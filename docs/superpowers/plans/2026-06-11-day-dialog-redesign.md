# Day Dialog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the day dialog (GoalModal) focus on primary fields by collapsing IG Sales / Custom Comm. / Allowance / Custom Wage into a per-shift "More options" fold, with side-by-side shift columns on wide screens and shift tabs on narrow screens.

**Architecture:** Extract the duplicated morning/afternoon JSX from `GoalModal.jsx` into one parameterized `ShiftSection` component, with a new `ShiftExtrasFold` (collapsible secondary fields + summary chips) and `ShiftTabs` (narrow-mode segmented control). GoalModal keeps all form state and save logic; it builds per-shift prop bundles and switches layout via a `useMediaQuery` hook at the existing 800px breakpoint. New styles live in CSS modules; the migrated commission/allowance rules are deleted from `App.css`.

**Tech Stack:** React 19, Vite 7, CSS Modules, vitest (added in Task 1) for pure-helper tests.

**Spec:** `docs/superpowers/specs/2026-06-11-day-dialog-redesign-design.md`

---

## Context for the implementer

- `src/presentation/components/GoalModal.jsx` (1,134 lines) renders the dialog. Lines 580–830 (morning) and 832–1078 (afternoon) are near-identical duplicates — they become `ShiftSection`.
- The dependency rule from CLAUDE.md applies: presentation code must not import `infrastructure/` or `firebase/*`. Everything in this plan stays inside `src/presentation/`.
- There is **no test framework** in the project yet. Task 1 adds vitest (node environment only, no DOM testing). UI components are verified manually in the browser via `npm run dev`.
- The existing wide layout already puts shifts side by side (`.shifts-compact`, App.css:1119) and collapses to a column stack at `@media (max-width: 800px)` (App.css:2181). Tabs replace that stacked mode.
- Classes `commission-toggles-row`, `commission-toggle-label`, `commission-expanded-inputs`, `custom-commission-inputs`, `ig-commission-inputs`, `admin-allowance-inline`, `admin-allowance-field`, `custom-commission-toggle` are referenced **only** by GoalModal.jsx (verified by grep), so their App.css rules can be migrated into `ShiftExtrasFold.module.css` and deleted.
- `npm run dev` starts the app at http://localhost:5173. `npm run lint` must pass after every task.

---

### Task 1: Add vitest

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Add test script**

In `package.json`, add to `"scripts"` (after `"lint"`):

```json
    "test": "vitest run"
```

- [ ] **Step 3: Verify the runner works (no tests yet)**

Run: `npm test`
Expected: vitest runs and reports "No test files found" with exit code 1 — that's fine; it proves the binary is wired. (Vitest exits non-zero when no tests exist; the next task adds tests.)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add vitest for unit testing pure presentation helpers"
```

---

### Task 2: Pure display helpers — `shiftDisplay.js` (TDD)

Pure functions, no React: which shift a narrow dialog should open on, what badge a tab shows, and which summary chips a collapsed fold shows.

**Files:**
- Create: `src/presentation/components/shiftDisplay.js`
- Test: `src/presentation/components/shiftDisplay.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/presentation/components/shiftDisplay.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getDefaultShiftKey, getShiftBadge, buildExtrasChips } from './shiftDisplay'

describe('getDefaultShiftKey', () => {
  it('returns morning when there is no goal', () => {
    expect(getDefaultShiftKey(null, false)).toBe('morning')
    expect(getDefaultShiftKey(undefined, true)).toBe('morning')
  })

  it('admin: picks the first confirmed-but-unverified shift', () => {
    const goal = { morningConfirmed: true, morningAdminConfirmed: false, afternoonConfirmed: true, afternoonAdminConfirmed: false }
    expect(getDefaultShiftKey(goal, true)).toBe('morning')
  })

  it('admin: skips a verified morning and lands on unverified afternoon', () => {
    const goal = { morningConfirmed: true, morningAdminConfirmed: true, afternoonConfirmed: true, afternoonAdminConfirmed: false }
    expect(getDefaultShiftKey(goal, true)).toBe('afternoon')
  })

  it('admin: ignores unconfirmed shifts', () => {
    const goal = { morningConfirmed: false, afternoonConfirmed: true, afternoonAdminConfirmed: false }
    expect(getDefaultShiftKey(goal, true)).toBe('afternoon')
  })

  it('member: picks the first confirmed shift missing an actual', () => {
    const goal = { morningConfirmed: true, morningActual: '5000', afternoonConfirmed: true, afternoonActual: '' }
    expect(getDefaultShiftKey(goal, false)).toBe('afternoon')
  })

  it('falls back to morning when nothing needs attention', () => {
    const goal = {
      morningConfirmed: true, morningAdminConfirmed: true, morningActual: '5000',
      afternoonConfirmed: true, afternoonAdminConfirmed: true, afternoonActual: '6000'
    }
    expect(getDefaultShiftKey(goal, true)).toBe('morning')
    expect(getDefaultShiftKey(goal, false)).toBe('morning')
  })
})

describe('getShiftBadge', () => {
  it('returns verified for an admin-verified shift', () => {
    expect(getShiftBadge({ confirmed: true, verified: true, hasActual: true }, true)).toBe('verified')
  })

  it('returns null for an unconfirmed shift', () => {
    expect(getShiftBadge({ confirmed: false, verified: false, hasActual: false }, true)).toBe(null)
  })

  it('admin: returns attention for confirmed but unverified', () => {
    expect(getShiftBadge({ confirmed: true, verified: false, hasActual: true }, true)).toBe('attention')
  })

  it('member: returns attention for confirmed without actual', () => {
    expect(getShiftBadge({ confirmed: true, verified: false, hasActual: false }, false)).toBe('attention')
  })

  it('member: returns null for confirmed with actual', () => {
    expect(getShiftBadge({ confirmed: true, verified: false, hasActual: true }, false)).toBe(null)
  })
})

describe('buildExtrasChips', () => {
  const empty = { igFeatured: '', igOther: '', customRate: '', customAmount: '', allowance: '', customWage: '', isAdminViewing: true }

  it('returns no chips when everything is default', () => {
    expect(buildExtrasChips(empty)).toEqual([])
  })

  it('sums IG featured + other into one chip', () => {
    expect(buildExtrasChips({ ...empty, igFeatured: '100', igOther: '20' })).toEqual(['IG $120'])
  })

  it('shows custom commission rate', () => {
    expect(buildExtrasChips({ ...empty, customRate: '5' })).toEqual(['Comm 5%'])
  })

  it('shows custom commission amount when there is no rate', () => {
    expect(buildExtrasChips({ ...empty, customAmount: '1000' })).toEqual(['Comm $1000'])
  })

  it('shows allowance and custom wage for admins', () => {
    expect(buildExtrasChips({ ...empty, allowance: '50', customWage: '70' }))
      .toEqual(['Allowance $50', 'Wage $70/hr'])
  })

  it('hides allowance and custom wage from non-admins', () => {
    expect(buildExtrasChips({ ...empty, allowance: '50', customWage: '70', isAdminViewing: false }))
      .toEqual([])
  })

  it('treats a custom wage of 0 as set', () => {
    expect(buildExtrasChips({ ...empty, customWage: '0' })).toEqual(['Wage $0/hr'])
  })

  it('orders chips IG, Comm, Allowance, Wage', () => {
    expect(buildExtrasChips({ ...empty, igFeatured: '120', customRate: '5', allowance: '50', customWage: '70' }))
      .toEqual(['IG $120', 'Comm 5%', 'Allowance $50', 'Wage $70/hr'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './shiftDisplay'` (or equivalent resolution error).

- [ ] **Step 3: Implement the helpers**

Create `src/presentation/components/shiftDisplay.js`:

```js
// Pure display helpers for the day dialog (GoalModal). No React, no I/O.

const shiftStatus = (goal, prefix) => ({
  confirmed: !!goal?.[prefix + 'Confirmed'],
  verified: !!goal?.[prefix + 'AdminConfirmed'],
  hasActual: String(goal?.[prefix + 'Actual'] ?? '').trim() !== ''
})

const needsAttention = (status, isAdminViewing) =>
  status.confirmed && (isAdminViewing ? !status.verified : !status.hasActual)

export function getDefaultShiftKey(goal, isAdminViewing) {
  if (needsAttention(shiftStatus(goal, 'morning'), isAdminViewing)) return 'morning'
  if (needsAttention(shiftStatus(goal, 'afternoon'), isAdminViewing)) return 'afternoon'
  return 'morning'
}

export function getShiftBadge(status, isAdminViewing) {
  if (status.verified) return 'verified'
  if (needsAttention(status, isAdminViewing)) return 'attention'
  return null
}

export function buildExtrasChips({ igFeatured, igOther, customRate, customAmount, allowance, customWage, isAdminViewing }) {
  const num = (v) => (v === '' || v === null || v === undefined) ? 0 : (Number(v) || 0)
  const isSet = (v) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v))

  const chips = []
  const ig = num(igFeatured) + num(igOther)
  if (ig > 0) chips.push(`IG $${ig}`)
  if (num(customRate) > 0) chips.push(`Comm ${num(customRate)}%`)
  else if (num(customAmount) > 0) chips.push(`Comm $${num(customAmount)}`)
  if (isAdminViewing && num(allowance) > 0) chips.push(`Allowance $${num(allowance)}`)
  if (isAdminViewing && isSet(customWage) && Number(customWage) >= 0) chips.push(`Wage $${Number(customWage)}/hr`)
  return chips
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in `shiftDisplay.test.js` green.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add src/presentation/components/shiftDisplay.js src/presentation/components/shiftDisplay.test.js
git commit -m "Add pure shift display helpers for day dialog (default tab, badges, summary chips)"
```

---

### Task 3: `useMediaQuery` hook

**Files:**
- Create: `src/presentation/hooks/useMediaQuery.js`

- [ ] **Step 1: Write the hook**

Create `src/presentation/hooks/useMediaQuery.js`:

```js
import { useState, useEffect } from 'react'

// Falls back to false (narrow layout) when matchMedia is unavailable,
// per the spec's error-handling note.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
```

No unit test — exercising this hook requires a DOM renderer the project doesn't have; it is covered by the manual browser verification in Tasks 7 and 9.

- [ ] **Step 2: Lint and commit**

```bash
npm run lint
git add src/presentation/hooks/useMediaQuery.js
git commit -m "Add useMediaQuery hook"
```

---

### Task 4: `ShiftTabs` component

**Files:**
- Create: `src/presentation/components/ShiftTabs.jsx`
- Create: `src/presentation/components/ShiftTabs.module.css`

- [ ] **Step 1: Write the component**

Create `src/presentation/components/ShiftTabs.jsx`:

```jsx
import styles from './ShiftTabs.module.css'

export function ShiftTabs({ tabs, activeKey, onChange }) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === activeKey}
          className={tab.key === activeKey ? `${styles.tab} ${styles.active}` : styles.tab}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.badge === 'verified' && <span className={styles.badgeVerified}>&#10003;</span>}
          {tab.badge === 'attention' && <span className={styles.badgeAttention}>&bull;</span>}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write the styles**

Create `src/presentation/components/ShiftTabs.module.css`:

```css
.tabs {
  display: flex;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 0;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  background: white;
  border: none;
  border-radius: 0;
  cursor: pointer;
}

.tab + .tab {
  border-left: 1.5px solid #d1d5db;
}

.active {
  background: #6d28d9;
  color: white;
}

.badgeVerified {
  color: #22c55e;
  font-weight: 700;
}

.active .badgeVerified {
  color: #bbf7d0;
}

.badgeAttention {
  color: #f59e0b;
  font-size: 18px;
  line-height: 1;
}

.active .badgeAttention {
  color: #fde68a;
}
```

- [ ] **Step 3: Lint and commit**

```bash
npm run lint
git add src/presentation/components/ShiftTabs.jsx src/presentation/components/ShiftTabs.module.css
git commit -m "Add ShiftTabs segmented control for narrow day dialog"
```

---

### Task 5: `ShiftExtrasFold` component

The collapsible "More options" section. Owns the IG Sales / Custom Comm. toggles + inputs and the admin-only Allowance / Custom Wage fields. Styles are migrated copies of the App.css rules (`commission-*`, `admin-allowance-*`) converted to module classes; App.css deletion happens in Task 8.

**Files:**
- Create: `src/presentation/components/ShiftExtrasFold.jsx`
- Create: `src/presentation/components/ShiftExtrasFold.module.css`

- [ ] **Step 1: Write the component**

Create `src/presentation/components/ShiftExtrasFold.jsx`:

```jsx
import styles from './ShiftExtrasFold.module.css'

export function ShiftExtrasFold({
  expanded, onToggle, chips, dimmed,
  showIg, setShowIg, igFeatured, setIgFeatured, igOther, setIgOther,
  showCustom, setShowCustom, customRate, setCustomRate, customAmount, setCustomAmount,
  showAdminFields, allowance, setAllowance, customWage, setCustomWage,
  fieldsDisabled, adminFieldsDisabled
}) {
  return (
    <div className={dimmed ? `${styles.fold} ${styles.dimmed}` : styles.fold}>
      <button type="button" className={styles.header} onClick={onToggle} aria-expanded={expanded}>
        <span className={styles.caret}>{expanded ? '▾' : '▸'}</span>
        <span>More options</span>
        {!expanded && chips.length > 0 && (
          <span className={styles.chips}>
            {chips.map((chip) => <span key={chip} className={styles.chip}>{chip}</span>)}
          </span>
        )}
      </button>
      {expanded && (
        <div className={styles.body}>
          <div className={styles.togglesRow}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showIg}
                disabled={fieldsDisabled}
                onChange={(e) => {
                  setShowIg(e.target.checked)
                  if (!e.target.checked) { setIgFeatured(''); setIgOther('') }
                }}
              />
              <span>IG Sales</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showCustom}
                disabled={fieldsDisabled}
                onChange={(e) => {
                  setShowCustom(e.target.checked)
                  if (!e.target.checked) { setCustomRate(''); setCustomAmount('') }
                }}
              />
              <span>Custom Comm.</span>
            </label>
          </div>
          {showIg && (
            <div className={`${styles.commissionInputs} ${styles.igInputs}`}>
              <div className="input-compact">
                <label>IG Featured ($)</label>
                <input
                  type="number"
                  value={igFeatured}
                  onChange={(e) => setIgFeatured(e.target.value)}
                  placeholder="0"
                  disabled={fieldsDisabled}
                />
              </div>
              <div className="input-compact">
                <label>IG Other ($)</label>
                <input
                  type="number"
                  value={igOther}
                  onChange={(e) => setIgOther(e.target.value)}
                  placeholder="0"
                  disabled={fieldsDisabled}
                />
              </div>
            </div>
          )}
          {showCustom && (
            <div className={styles.commissionInputs}>
              <div className="input-compact">
                <label>Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  placeholder="5"
                  disabled={fieldsDisabled}
                />
              </div>
              <div className="input-compact">
                <label>Amount ($)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="1000"
                  disabled={fieldsDisabled}
                />
              </div>
            </div>
          )}
          {showAdminFields && (
            <div className={styles.adminRow}>
              <div className={styles.adminField}>
                <label>Allowance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  placeholder="0"
                  disabled={adminFieldsDisabled}
                />
              </div>
              <div className={styles.adminField}>
                <label>Custom Wage ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customWage}
                  onChange={(e) => setCustomWage(e.target.value)}
                  placeholder="Auto"
                  disabled={adminFieldsDisabled}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

Note: `.input-compact` stays a global App.css class — it is shared with the Target/Actual inputs and other modals, so it is not migrated.

- [ ] **Step 2: Write the styles**

Create `src/presentation/components/ShiftExtrasFold.module.css`. The `togglesRow`, `toggleLabel`, `commissionInputs`, `igInputs`, `adminRow`, `adminField` rules are migrated from App.css (`.commission-toggles-row` etc., `.admin-allowance-*`), including the ≤600px mobile overrides; `fold`/`header`/`chips`/`dimmed` are new:

```css
.fold {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dimmed {
  opacity: 0.35;
}

.header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  text-align: left;
  user-select: none;
}

.header:hover {
  background: #f3f4f6;
}

.caret {
  font-size: 10px;
  width: 10px;
}

.chips {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chip {
  background: #ede9fe;
  color: #6d28d9;
  border-radius: 5px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.togglesRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
}

.toggleLabel {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  user-select: none;
}

.toggleLabel input[type="checkbox"] {
  width: 15px;
  height: 15px;
  cursor: pointer;
}

.commissionInputs {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 5px;
}

.igInputs {
  background: #ede9fe;
  border-color: #8b5cf6;
}

.adminRow {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.adminField {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.adminField label {
  font-size: 9px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.adminField input {
  width: 100%;
  padding: 4px 6px;
  border: 1.5px solid #d1d5db;
  border-radius: 5px;
  font-size: 13px;
  color: #374151;
  background: white;
  box-sizing: border-box;
}

.adminField input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

@media (max-width: 600px) {
  .toggleLabel {
    font-size: 11px;
    gap: 4px;
  }

  .toggleLabel input[type="checkbox"] {
    width: 14px;
    height: 14px;
  }

  .body {
    gap: 3px;
  }
}
```

- [ ] **Step 3: Lint and commit**

```bash
npm run lint
git add src/presentation/components/ShiftExtrasFold.jsx src/presentation/components/ShiftExtrasFold.module.css
git commit -m "Add ShiftExtrasFold collapsible secondary-fields section"
```

---

### Task 6: `ShiftSection` component + replace duplicated JSX in GoalModal

One parameterized shift card replaces both the morning block (GoalModal.jsx:581–830) and the afternoon block (834–1077). After this task the dialog looks different in one way only: commission/allowance fields are inside the fold. Layout switching (tabs) comes in Task 7.

**Files:**
- Create: `src/presentation/components/ShiftSection.jsx`
- Modify: `src/presentation/components/GoalModal.jsx`

- [ ] **Step 1: Write ShiftSection**

Create `src/presentation/components/ShiftSection.jsx`:

```jsx
import { ProofImages } from './ProofImages'
import { ShiftExtrasFold } from './ShiftExtrasFold'

export function ShiftSection({ shift, ctx }) {
  const fieldsDisabled = ctx.readOnly || !shift.confirmed || shift.locked
  const adminFieldsDisabled = ctx.readOnly || shift.locked

  return (
    <div className="shift-group">
      <div
        className={`shift-confirm-toggle${ctx.contentOverflows ? ` shift-confirm-sticky ${shift.stickyClass}` : ''}${!shift.confirmed ? ' shift-toggle-dimmed' : ''}`}
        onClick={ctx.contentOverflows ? (e) => {
          // Only scroll to top if clicking the header bar itself, not child buttons/labels
          if (e.target === e.currentTarget) {
            ctx.modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          }
        } : undefined}
      >
        <label className="shift-confirm">
          <input
            type="checkbox"
            checked={shift.confirmed}
            onChange={(e) => {
              shift.setConfirmed(e.target.checked)
              if (e.target.checked && !shift.location) {
                shift.setLocation(shift.fallbackLocation || ctx.autoLocation || null)
              }
            }}
            disabled={ctx.readOnly || shift.locked}
          />
          <span>{shift.label}</span>
        </label>
        {shift.confirmed && shift.adminConfirmed && (
          <span className="shift-verified-tag"><span className="verified-icon">&#10003;</span><span className="verified-text"> Verified</span></span>
        )}
        {ctx.isAdminViewing && shift.confirmed && (
          shift.adminConfirmed ? (
            <button className="admin-unconfirm-btn" onClick={() => ctx.onUnconfirmShift(shift.key)}>Undo</button>
          ) : (
            ctx.hasChanges
              ? <span className="shift-save-first-hint" onClick={ctx.onSave}>Save before verify</span>
              : <button className="admin-confirm-btn shift-verify-btn" onClick={() => ctx.onConfirmShift(shift.key)}>&#10003; Verify</button>
          )
        )}
      </div>
      <div className={`shift-section-wrapper ${!shift.confirmed ? 'shift-unconfirmed' : ''}`}>
        <div className="shift-row">
          <div className={`shift-inputs${/[+\-*/]/.test(String(shift.actualInput)) ? ' actual-expanded' : ''}`}>
            <div className="input-compact">
              <label>Target</label>
              <input
                type="number"
                value={shift.goalValue}
                onChange={(e) => shift.setGoalValue(e.target.value)}
                placeholder="0"
                disabled={fieldsDisabled}
              />
            </div>
            <div className="input-compact input-compact-actual">
              <label>Actual</label>
              <div className="actual-input-wrapper">
                <textarea
                  rows="1"
                  inputMode="decimal"
                  value={shift.actualInput}
                  onChange={(e) => {
                    shift.setActualInput(e.target.value)
                    const result = ctx.evaluateFormula(e.target.value)
                    if (result !== null) shift.setActual(String(result))
                    ctx.autoResize(e.target)
                  }}
                  onBlur={() => ctx.handleActualBlur(shift.actualInput, shift.setActual)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                  ref={(el) => ctx.autoResize(el)}
                  placeholder="0"
                  disabled={fieldsDisabled}
                />
                <button
                  type="button"
                  className="actual-add-btn"
                  aria-label="Add"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => shift.setActualInput((prev) => (prev || '') + '+')}
                  disabled={fieldsDisabled}
                >+</button>
              </div>
              {ctx.formulaPreview(shift.actualInput) !== null && (
                <div className="formula-preview">= {ctx.formulaPreview(shift.actualInput)}</div>
              )}
            </div>
            <div className={`wage-compact ${ctx.wageClass(shift.wage, shift.customWage)}`}>
              ${shift.wage}/hr
            </div>
          </div>
        </div>
        <div className="shift-time-row">
          <div className="time-input-group">
            <label>Start</label>
            <input
              type="time"
              value={shift.startTime}
              onChange={(e) => shift.setStartTime(e.target.value)}
              disabled={fieldsDisabled}
            />
          </div>
          <div className="time-input-group">
            <label>End</label>
            <input
              type="time"
              value={shift.endTime}
              onChange={(e) => shift.setEndTime(e.target.value)}
              disabled={fieldsDisabled}
            />
          </div>
          <div className="shift-duration">
            {ctx.formatHours(shift.hours)}
          </div>
        </div>
        {shift.confirmed && ctx.locations && ctx.locations.length > 0 && (
          <div className="shift-location-row">
            <label>Location</label>
            <select
              className="location-select"
              value={shift.location || ''}
              onChange={(e) => shift.setLocation(e.target.value || null)}
              disabled={adminFieldsDisabled}
            >
              <option value="">— None —</option>
              {ctx.locations.map((loc) => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
        )}
        <ShiftExtrasFold
          expanded={shift.extrasExpanded}
          onToggle={shift.onToggleExtras}
          chips={shift.extrasChips}
          dimmed={!shift.confirmed}
          showIg={shift.showIg}
          setShowIg={shift.setShowIg}
          igFeatured={shift.igFeatured}
          setIgFeatured={shift.setIgFeatured}
          igOther={shift.igOther}
          setIgOther={shift.setIgOther}
          showCustom={shift.showCustom}
          setShowCustom={shift.setShowCustom}
          customRate={shift.customRate}
          setCustomRate={shift.setCustomRate}
          customAmount={shift.customAmount}
          setCustomAmount={shift.setCustomAmount}
          showAdminFields={ctx.isAdminViewing && shift.confirmed}
          allowance={shift.allowance}
          setAllowance={shift.setAllowance}
          customWage={shift.customWage}
          setCustomWage={shift.setCustomWage}
          fieldsDisabled={fieldsDisabled}
          adminFieldsDisabled={adminFieldsDisabled}
        />
        <div className={`shift-proof-inline${!shift.confirmed ? ' shift-unconfirmed' : ''}`}>
          <ProofImages
            images={shift.proofImages}
            pendingFiles={shift.pendingFiles}
            pendingDeletePaths={shift.pendingDeletes}
            onUpload={(files) => ctx.onStageFiles(shift.key, files)}
            onDelete={(image) => ctx.onDeleteUploadedImage(shift.key, image)}
            onReplace={(oldImage, newFile) => ctx.onReplaceImage(shift.key, oldImage, newFile)}
            onRemovePending={(index) => ctx.onRemovePending(shift.key, index)}
            uploading={ctx.proofUploadingShift === shift.key}
            disabled={!shift.confirmed || shift.locked}
            readOnly={ctx.readOnly}
            onOpenPreview={(idx) => ctx.setPreviewIndex(shift.previewOffset + idx)}
          />
        </div>
      </div>
    </div>
  )
}
```

Behavior note: the original afternoon header had no scroll-to-top click handler while the morning one did; ShiftSection gives both the same handler. That is an intentional consistency fix.

- [ ] **Step 2: Add imports and fold state to GoalModal**

In `src/presentation/components/GoalModal.jsx`:

Replace the import block at the top:

```js
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Goal, DEFAULT_MORNING_START, DEFAULT_MORNING_END, DEFAULT_AFTERNOON_START, DEFAULT_AFTERNOON_END } from '../../domain/entities/Goal'
import { ProofImages } from './ProofImages'
```

with:

```js
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Goal, DEFAULT_MORNING_START, DEFAULT_MORNING_END, DEFAULT_AFTERNOON_START, DEFAULT_AFTERNOON_END } from '../../domain/entities/Goal'
import { ShiftSection } from './ShiftSection'
import { buildExtrasChips } from './shiftDisplay'
```

(`ProofImages` is now imported by ShiftSection, not GoalModal — but the preview overlay portal at the bottom of GoalModal does not use it, so the import can go.)

After the `const [previewIndex, setPreviewIndex] = useState(null)` line, add:

```js
  const [extrasExpanded, setExtrasExpanded] = useState({ morning: false, afternoon: false })
```

Inside the `useEffect(() => { ... }, [goal, autoLocation])` initialization effect, after `setSaveError(null)`, add:

```js
    setExtrasExpanded({ morning: false, afternoon: false })
```

- [ ] **Step 3: Build the per-shift prop bundles**

In GoalModal, immediately before the `return (` statement (the bundles reference `contentOverflows` and `modalRef`, which are declared near the bottom of the component, so they must come after everything they capture), add:

```js
  const morningShift = {
    key: 'morning',
    label: 'Shift A (Morning)',
    stickyClass: 'shift-confirm-sticky-a',
    confirmed: morningConfirmed, setConfirmed: setMorningConfirmed,
    locked: morningLocked,
    adminConfirmed: !!goal?.morningAdminConfirmed,
    goalValue: morningGoal, setGoalValue: setMorningGoal,
    setActual: setMorningActual,
    actualInput: morningActualInput, setActualInput: setMorningActualInput,
    startTime: morningStartTime, setStartTime: setMorningStartTime,
    endTime: morningEndTime, setEndTime: setMorningEndTime,
    location: morningLocation, setLocation: setMorningLocation,
    fallbackLocation: afternoonLocation,
    showIg: showMorningIg, setShowIg: setShowMorningIg,
    igFeatured: morningIgFeatured, setIgFeatured: setMorningIgFeatured,
    igOther: morningIgOther, setIgOther: setMorningIgOther,
    showCustom: showMorningCustom, setShowCustom: setShowMorningCustom,
    customRate: morningCustomRate, setCustomRate: setMorningCustomRate,
    customAmount: morningCustomAmount, setCustomAmount: setMorningCustomAmount,
    allowance: morningAllowance, setAllowance: setMorningAllowance,
    customWage: morningCustomWage, setCustomWage: setMorningCustomWage,
    wage: morningWage,
    hours: morningHours,
    proofImages: morningProofImages,
    pendingFiles: pendingMorningFiles,
    pendingDeletes: morningPendingDeletes,
    previewOffset: 0,
    extrasExpanded: extrasExpanded.morning,
    onToggleExtras: () => setExtrasExpanded(prev => ({ ...prev, morning: !prev.morning })),
    extrasChips: buildExtrasChips({
      igFeatured: morningIgFeatured, igOther: morningIgOther,
      customRate: morningCustomRate, customAmount: morningCustomAmount,
      allowance: morningAllowance, customWage: morningCustomWage,
      isAdminViewing: isAdminViewing && morningConfirmed
    })
  }

  const afternoonShift = {
    key: 'afternoon',
    label: 'Shift B (Afternoon)',
    stickyClass: 'shift-confirm-sticky-b',
    confirmed: afternoonConfirmed, setConfirmed: setAfternoonConfirmed,
    locked: afternoonLocked,
    adminConfirmed: !!goal?.afternoonAdminConfirmed,
    goalValue: afternoonGoal, setGoalValue: setAfternoonGoal,
    setActual: setAfternoonActual,
    actualInput: afternoonActualInput, setActualInput: setAfternoonActualInput,
    startTime: afternoonStartTime, setStartTime: setAfternoonStartTime,
    endTime: afternoonEndTime, setEndTime: setAfternoonEndTime,
    location: afternoonLocation, setLocation: setAfternoonLocation,
    fallbackLocation: morningLocation,
    showIg: showAfternoonIg, setShowIg: setShowAfternoonIg,
    igFeatured: afternoonIgFeatured, setIgFeatured: setAfternoonIgFeatured,
    igOther: afternoonIgOther, setIgOther: setAfternoonIgOther,
    showCustom: showAfternoonCustom, setShowCustom: setShowAfternoonCustom,
    customRate: afternoonCustomRate, setCustomRate: setAfternoonCustomRate,
    customAmount: afternoonCustomAmount, setCustomAmount: setAfternoonCustomAmount,
    allowance: afternoonAllowance, setAllowance: setAfternoonAllowance,
    customWage: afternoonCustomWage, setCustomWage: setAfternoonCustomWage,
    wage: afternoonWage,
    hours: afternoonHours,
    proofImages: afternoonProofImages,
    pendingFiles: pendingAfternoonFiles,
    pendingDeletes: afternoonPendingDeletes,
    previewOffset: afternoonOffset,
    extrasExpanded: extrasExpanded.afternoon,
    onToggleExtras: () => setExtrasExpanded(prev => ({ ...prev, afternoon: !prev.afternoon })),
    extrasChips: buildExtrasChips({
      igFeatured: afternoonIgFeatured, igOther: afternoonIgOther,
      customRate: afternoonCustomRate, customAmount: afternoonCustomAmount,
      allowance: afternoonAllowance, customWage: afternoonCustomWage,
      isAdminViewing: isAdminViewing && afternoonConfirmed
    })
  }

  const shiftCtx = {
    readOnly, isAdminViewing, locations, autoLocation,
    hasChanges, contentOverflows, modalRef,
    onSave: handleSave,
    onConfirmShift, onUnconfirmShift,
    evaluateFormula, formulaPreview, handleActualBlur, autoResize, formatHours, wageClass,
    onStageFiles: handleStageFiles,
    onDeleteUploadedImage: handleDeleteUploadedImage,
    onReplaceImage: handleReplaceImage,
    onRemovePending: handleRemovePending,
    proofUploadingShift, setPreviewIndex
  }
```


- [ ] **Step 4: Replace the duplicated shift JSX**

Delete everything from `<div className="shift-group">` (the first one, currently line 581) through the matching close of the afternoon `</div>` for its shift-group (currently line 1077) — i.e. the entire contents of `<div className="shifts-compact">` — and replace with:

```jsx
          <ShiftSection shift={morningShift} ctx={shiftCtx} />
          <div className="shift-group-divider" />
          <ShiftSection shift={afternoonShift} ctx={shiftCtx} />
```

The `shifts-compact` wrapper div itself stays.

- [ ] **Step 5: Verify in the browser**

```bash
npm run lint
npm run dev
```

Open http://localhost:5173, log in, open a day from the calendar (one with commission/allowance data if available). Confirm:
- Both shifts render side by side on desktop, stacked on a narrow window (unchanged from before this task).
- Commission toggles and allowance/custom-wage now sit inside a collapsed "More options" row; expanding shows them; values edit and save correctly.
- Chips appear on the collapsed fold for a day that has IG/commission/allowance data.
- Verify / Undo buttons, target/actual editing with formula (`100+200`), time editing, location dropdown, proof upload/preview all behave as before.
- An unconfirmed shift dims, including the fold.

- [ ] **Step 6: Run tests and commit**

```bash
npm test
git add src/presentation/components/ShiftSection.jsx src/presentation/components/GoalModal.jsx
git commit -m "Extract ShiftSection from GoalModal and fold secondary fields into More options"
```

---

### Task 7: Responsive tabs in GoalModal

**Files:**
- Modify: `src/presentation/components/GoalModal.jsx`

- [ ] **Step 1: Add imports, media query, and active-tab state**

In GoalModal's import block, extend:

```js
import { ShiftSection } from './ShiftSection'
import { ShiftTabs } from './ShiftTabs'
import { buildExtrasChips, getDefaultShiftKey, getShiftBadge } from './shiftDisplay'
import { useMediaQuery } from '../hooks/useMediaQuery'
```

After the `extrasExpanded` state line, add:

```js
  const [activeShiftKey, setActiveShiftKey] = useState('morning')
  const isWide = useMediaQuery('(min-width: 801px)')
```

In the initialization effect, after `setExtrasExpanded({ morning: false, afternoon: false })`, add:

```js
    setActiveShiftKey(getDefaultShiftKey(goal, isAdminViewing))
```

and change the effect's dependency array from `[goal, autoLocation]` to `[goal, autoLocation, isAdminViewing]`.

- [ ] **Step 2: Build tab descriptors**

Immediately after the `shiftCtx` object from Task 6, add:

```js
  const shiftTabs = [
    {
      key: 'morning',
      label: 'Shift A',
      badge: getShiftBadge({
        confirmed: morningConfirmed,
        verified: !!goal?.morningAdminConfirmed,
        hasActual: String(morningActual ?? '').trim() !== ''
      }, isAdminViewing)
    },
    {
      key: 'afternoon',
      label: 'Shift B',
      badge: getShiftBadge({
        confirmed: afternoonConfirmed,
        verified: !!goal?.afternoonAdminConfirmed,
        hasActual: String(afternoonActual ?? '').trim() !== ''
      }, isAdminViewing)
    }
  ]
```

- [ ] **Step 3: Switch the render on isWide**

Replace the body of `<div className="shifts-compact">` (the three lines added in Task 6 Step 4) with:

```jsx
          {isWide ? (
            <>
              <ShiftSection shift={morningShift} ctx={shiftCtx} />
              <div className="shift-group-divider" />
              <ShiftSection shift={afternoonShift} ctx={shiftCtx} />
            </>
          ) : (
            <>
              <ShiftTabs tabs={shiftTabs} activeKey={activeShiftKey} onChange={setActiveShiftKey} />
              <ShiftSection shift={activeShiftKey === 'morning' ? morningShift : afternoonShift} ctx={shiftCtx} />
            </>
          )}
```

- [ ] **Step 4: Verify in the browser**

```bash
npm run lint
npm run dev
```

In the browser at http://localhost:5173, open a day dialog and check:
- Desktop width (>800px): two columns, no tabs, divider hidden — same as Task 6.
- Narrow window (resize below 800px, or device toolbar / iPhone preset): tabs appear, only one shift renders, the other appears on tab click.
- Default tab lands on the shift needing attention (e.g. a day where Shift A is verified but Shift B is not → opens on Shift B for an admin).
- Badges: ✓ on verified shift tab, • on a confirmed-but-pending one.
- Type into Shift A's Actual, switch to Shift B and back — the edit survives.
- Resizing across 800px while open swaps layouts without losing edits.
- Proof preview arrows still walk from Shift A images into Shift B images even in tab mode.
- Save with edits on both shifts (made via switching tabs) persists both.

- [ ] **Step 5: Run tests and commit**

```bash
npm test
git add src/presentation/components/GoalModal.jsx
git commit -m "Add responsive shift tabs to day dialog on narrow screens"
```

---

### Task 8: Delete migrated CSS from App.css

The commission/allowance rules now live in `ShiftExtrasFold.module.css`; the long-dead `.custom-commission-toggle` rules (no JSX references at all) go too.

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Trim the unconfirmed-dimming combinator**

Replace (currently App.css:1408–1416):

```css
.shift-section-wrapper.shift-unconfirmed .shift-row,
.shift-section-wrapper.shift-unconfirmed .shift-time-row,
.shift-section-wrapper.shift-unconfirmed .shift-location-row,
.shift-section-wrapper.shift-unconfirmed .custom-commission-toggle,
.shift-section-wrapper.shift-unconfirmed .custom-commission-inputs,
.shift-section-wrapper.shift-unconfirmed .commission-toggles-row,
.shift-section-wrapper.shift-unconfirmed .commission-expanded-inputs {
  opacity: 0.35;
}
```

with:

```css
.shift-section-wrapper.shift-unconfirmed .shift-row,
.shift-section-wrapper.shift-unconfirmed .shift-time-row,
.shift-section-wrapper.shift-unconfirmed .shift-location-row {
  opacity: 0.35;
}
```

(The fold dims itself via its `dimmed` prop.)

- [ ] **Step 2: Delete the migrated/dead rule blocks**

Delete these whole rule blocks from App.css (search by selector; line numbers will have drifted):

- `.commission-toggles-row` (around 1499)
- `.commission-toggle-label` and `.commission-toggle-label input[type="checkbox"]` (around 1506–1521)
- `.commission-expanded-inputs` (around 1523)
- `.custom-commission-toggle`, `.custom-commission-toggle label`, `.custom-commission-toggle input[type="checkbox"]`, `.custom-commission-toggle span` (around 1529–1551)
- `.custom-commission-inputs` (around 1553)
- `.ig-commission-inputs` (around 1562)
- `.admin-allowance-inline`, `.admin-allowance-field`, `.admin-allowance-field label`, `.admin-allowance-field input`, `.admin-allowance-field input:focus` (around 4320–4357)
- Inside the mobile media query (around 2745+): the `.commission-toggle-label`, `.commission-toggle-label input[type="checkbox"]`, `.commission-expanded-inputs`, `.custom-commission-toggle label`, `.custom-commission-toggle input[type="checkbox"]` blocks.

- [ ] **Step 3: Confirm nothing references the deleted classes**

Run:
```bash
grep -rn "commission-toggles-row\|commission-toggle-label\|commission-expanded-inputs\|custom-commission-inputs\|ig-commission-inputs\|admin-allowance\|custom-commission-toggle" src
```
Expected: no matches.

- [ ] **Step 4: Verify in the browser**

`npm run dev` → open a day dialog, expand the fold on both an admin and a member view; confirm commission inputs (amber/violet boxes), allowance fields, and unconfirmed dimming all still look right at desktop and phone widths.

- [ ] **Step 5: Commit**

```bash
npm run lint
git add src/App.css
git commit -m "Remove commission and allowance CSS migrated to ShiftExtrasFold module"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full check suite**

```bash
npm run lint
npm test
npm run build
```
Expected: all pass; build completes without warnings about missing modules.

- [ ] **Step 2: Manual end-to-end pass (per spec Testing section)**

With `npm run dev`, walk this checklist in the browser:

1. **Wide (>800px):** both shifts side by side; folds collapsed; chips correct for a day with IG/allowance data.
2. **Narrow (≤800px, device toolbar):** tabs render; default tab is the shift needing attention; badges correct; edits survive tab switches; swipe-down-to-dismiss still works.
3. **Member (non-admin) view:** no Allowance/Custom Wage inside the fold; IG/Custom Comm. editable; fold chips never show allowance/wage.
4. **View Only link** (the `/member/<id>` read-only case from the screenshot): everything disabled, fold still expandable to *view* values.
5. **Verify flow:** admin verifies a shift → fields lock including inside the fold; Undo unlocks.
6. **Save flow:** change values in both shifts via tabs, Save once, reopen → all persisted; proof upload/replace/delete still works; preview arrows traverse A→B.

- [ ] **Step 3: Report**

Report results honestly — any checklist item that fails goes back to its task before claiming done.

# Day Dialog Redesign — Responsive Layout with Collapsed Secondary Fields

**Date:** 2026-06-11
**Component:** `src/presentation/components/GoalModal.jsx` (day detail dialog)
**Status:** Approved

## Problem

The day dialog renders both shifts as a long vertical stack. Every field — including the
rarely-used IG Sales, Custom Commission, Allowance, and Custom Wage inputs — is always
visible, so the primary task (checking target/actual, times, verifying a shift) is buried
in scroll, especially on phones. GoalModal is also a 1,134-line god component that
duplicates the entire shift JSX for morning and afternoon.

## Design

### Responsive layout

- **Wide screens (viewport wider than 800px — the existing breakpoint where the
  two-column `.shifts-compact` layout currently collapses to a stack):**
  Shift A and Shift B render side by side as two equal columns. Both shifts are always
  visible; no tabs.
- **Narrow screens (≤800px):** a segmented tab control (`Shift A | Shift B`) sits
  directly under the date header. Only the active shift renders. Switching uses
  presentation state only; form state lives in GoalModal, so unsaved edits survive tab
  switches.
- Mode is chosen via `matchMedia('(min-width: 801px)')`, reacting to resize/orientation
  changes.

### Default tab (narrow mode)

On open, select the first shift "needing attention":

1. Admin viewing: first shift that is confirmed but not admin-verified.
2. Member viewing: first shift that is confirmed but has no actual entered.
3. Fallback: Shift A.

### Tab badges

- `✓` when the shift is admin-verified.
- `•` when the shift is confirmed but still needs something (verification or actual).
- No badge for unconfirmed shifts.

### Shift card structure (both modes)

Always visible, in order:

1. Header: confirm checkbox, shift name, Verified badge / Verify / Undo / "save first"
   hint (existing logic unchanged).
2. Target / Actual (with `+` formula button) / wage chip row.
3. Start / End time row with duration.
4. Location dropdown.
5. **"More options" fold** (see below).
6. Proof photos section (stays primary, outside the fold; existing arrow-key preview
   navigation unchanged).

### "More options" fold

- Contains: IG Sales toggle + its inputs, Custom Comm. toggle + its inputs, and the
  admin-only Allowance ($) and Custom Wage ($/hr) fields. Admin visibility rules are
  unchanged — non-admins never see Allowance/Custom Wage, inside the fold or out.
- **Always collapsed by default**, on every dialog open. Expansion is manual, per shift,
  and not persisted.
- When collapsed and any contained field is non-default (IG amounts > 0, custom
  commission enabled, allowance ≠ 0, custom wage set), the fold line shows compact
  summary chips, e.g. `IG $120 · Comm 5% · Allowance $50 · Wage $70/hr`. Chips are pure
  formatting of existing form values — no commission math in the component
  (earningsCalculator remains the single source of earnings rules).
- Disabled/read-only states follow the same rules as the fields had before
  (read-only mode, unconfirmed shift dimming, admin-verified locking).

## Component architecture

Extract from GoalModal (which keeps form state, save flow, and orchestration):

- **`ShiftSection.jsx`** — one shift card, parameterized by shift (morning/afternoon)
  via props. Replaces the ~250 duplicated lines between the two shift blocks.
- **`ShiftExtrasFold.jsx`** — the collapsible secondary-fields section, including
  summary-chip rendering.
- **`ShiftTabs.jsx`** — the segmented control with status badges (narrow mode only).

Styling: new co-located CSS modules (`ShiftSection.module.css`, `ShiftExtrasFold.module.css`,
`ShiftTabs.module.css`). No additions to `App.css`; shift-section styles that get touched
migrate out of `App.css` into the modules opportunistically. Unused migrated selectors are
removed from `App.css`.

## Unchanged behavior

- Verify / Undo / "save before verify" logic and locking.
- Save flow, validation, and toasts.
- Proof photo upload/replace/delete and combined arrow-key preview navigation.
- View Only mode disabling.
- Wage chip coloring (wage-hit / wage-partial / wage-none / wage-custom).

## Error handling

No new I/O. The only new failure surface is layout-mode detection; if `matchMedia` is
unavailable, default to the stacked/tabbed narrow layout.

## Testing

- Unit-test the pure helpers: "first shift needing attention" selection and summary-chip
  formatting (plain functions, no React needed).
- Manual verification in the browser at both widths (per the project working agreement):
  collapsed fold with chips, expand/edit/save, tab switching preserving edits, verify
  flow, member vs admin field visibility, View Only mode.

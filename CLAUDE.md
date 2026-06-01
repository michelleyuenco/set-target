# Project: set-target

A React + Firebase app for tracking sales goals, shifts, commissions, and team performance.

## Architecture: Clean Architecture (strict)

The codebase is organized into four layers under `src/`. **The dependency rule is non-negotiable: dependencies point inward only.**

```
presentation  ──▶  application  ──▶  domain
infrastructure ─────────▶  application + domain
        ▲
        │ (wired via)
        di/  ──▶  resolves concrete adapters into ports
```

### Layer responsibilities

- **`src/domain/`** — entities, value objects, pure business invariants. No React, no Firebase, no browser APIs, no I/O. Should be runnable in plain Node.
- **`src/application/`** — use cases, ports (interfaces), and services that orchestrate domain logic. Imports `domain/` only. Defines ports; never instantiates Firebase or DOM things.
  - `ports/` — interface contracts (e.g., `GoalRepository.js`, `AuthPort.js`)
  - `services/` — orchestration (e.g., `GoalService.js`, `earningsCalculator.js`)
  - `useCases/` — single-purpose application operations (e.g., `SaveGoal.js`)
- **`src/infrastructure/`** — concrete adapters implementing ports (Firebase, storage, auth). Imports `application/` ports + `domain/`. Never imported directly by `presentation/`.
- **`src/presentation/`** — React components, hooks, view-models. Imports `application/` (services & ports) and `domain/` value objects. **Must NOT import from `infrastructure/` or `firebase/*`** — always go through the DI container.
- **`src/di/`** — composition root. Wires concrete adapters into ports and exposes accessors (`getActiveGoalService()`, etc.).

### Forbidden imports (will be rejected in review)

- `presentation/*` importing `infrastructure/*` or `firebase/*` directly
- `application/*` or `domain/*` importing React, Firebase, `window`, `document`, or any I/O library
- `domain/*` importing anything from `application/`, `infrastructure/`, or `presentation/`
- Hooks resolving services by `new GoalService(...)` instead of via the DI container

## Coding standards

### Single Responsibility
- **Soft cap on components/hooks: 300 lines.** Above that, split. Modals that hit 1000+ lines (looking at `RosterModal.jsx`, `GoalModal.jsx`) are bugs, not features.
- A component renders UI and wires events. It does **not** compute commissions, validate shift overlaps, or transform domain entities — call a service or use case for that.
- A hook owns one concern (one resource, one workflow). If a hook returns more than ~5 values or manages more than ~5 pieces of state, split it.

### DRY — single source of truth for business rules
- **All commission rates, allowance rules, shift defaults, and earnings math live in `application/services/earningsCalculator.js` (or a similar service).** Never hardcode rates (e.g., `0.045`, `0.07`) in a component or hook.
- If you find yourself copy-pasting a calculation from another component, stop and extract it to the application layer first.
- Domain constants (shift hours, default times) live in `domain/entities/*` and are imported, never duplicated.

### State management in components
- Prefer one `useReducer` over 30 `useState` calls.
- Lift state to a view-model hook (`presentation/viewModels/`) when a component coordinates more than ~10 fields.
- Form state belongs in a dedicated hook, not inline in a modal.

### Dependency injection in presentation
- Hooks and components depend on **ports** (the interface), not concrete service classes. Resolve them via `src/di/` accessors.
- When adding a new feature: define the port in `application/ports/`, implement in `infrastructure/`, register in `di/`, then consume from `presentation/`.

### Styling
- `src/App.css` is a known liability (~150KB monolith). **Do not add to it.** New styles go into:
  - CSS Modules (`Component.module.css`) co-located with the component, or
  - A scoped stylesheet imported only by the owning component.
- When you touch a component, opportunistically migrate its styles out of `App.css`.

### Error handling
- Validate at boundaries (user input, Firebase responses). Don't add defensive `if (x)` checks deep in pure functions when callers already guarantee the invariant.
- Surface user-facing errors via the existing toast/error UI; never `console.error` and swallow.

### Comments & docs
- Default to no comments. Name things well. Comment only when *why* is non-obvious (a workaround, a subtle invariant, a constraint).
- Don't write "// added for X" or "// used by Y" — that rots.

## Anti-patterns observed in this codebase (do not repeat)

1. **Hardcoded commission rates** in `DayCell.jsx`, `MonthlySalaryModal.jsx`, `WageBreakdownModal.jsx`, `BuybackModal.jsx`. The canonical source is `application/services/earningsCalculator.js` — use it.
2. **God components** — `RosterModal.jsx` (1146 lines), `GoalModal.jsx` (1134 lines), `presentation/App.jsx` (1327 lines). When editing these, prefer extracting a sub-component or hook over adding more inline logic.
3. **Hooks calling concrete services** — `useGoals.js` reaches for `getActiveGoalService()` and assumes its shape. Prefer depending on the port's contract.
4. **Global CSS dump** — `App.css` is a no-go zone for new styles.

## Common commands

```bash
npm run dev          # local dev server
npm run build        # production build
firebase deploy      # deploy hosting + functions + rules
```

## Working agreement

- **Verify before claiming done.** For UI changes, exercise the feature in the browser. Type-check passes ≠ feature works.
- **Don't introduce abstractions speculatively.** Three similar lines is better than a premature interface.
- **Don't add backwards-compat shims** for code you control — just change the callers.
- **Confirm before destructive ops** (force push, schema migrations, deleting branches). Local edits, tests, and reversible changes don't need a confirmation.

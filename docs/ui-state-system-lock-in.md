# UI State System Lock-In

## Scope
This lock-in pass is limited to dashboard section owners and shared UI-state primitives.

In scope:
- dashboard events section container
- dashboard vacancies section container
- dashboard notifications section container
- shared ui-state module under features/ui-state

Out of scope:
- non-dashboard pages
- backend or API behavior
- visual redesign

---

## 1. Input Normalization Strategy

### Shared normalizer
A shared utility was introduced:
- features/ui-state/deriveDataState.ts

Contract:
- accepts raw section signals: data array, filtered data array, filter-active flag, loading flag
- returns only one of:
  - loading
  - success
  - empty
  - filtered-empty

This eliminates ad hoc, per-container ternary trees and keeps all sections aligned to one normalized input shape before resolver usage.

### Usage pattern
Each section owner now follows this order:
1. derive filtered data from local feature inputs
2. derive hasActiveFilters from local controls
3. call deriveDataState with raw arrays and loading flag
4. derive errorState and isRefreshing
5. pass normalized values into SectionContainer

This makes the resolver input contract explicit and repeatable.

---

## 2. New Abstraction: SectionContainer

### Shared abstraction
A higher-level section abstraction was introduced:
- features/ui-state/SectionContainer.tsx

SectionContainer responsibilities:
- accepts normalized inputs: dataState, errorState, isRefreshing
- internally calls resolveSectionState
- internally applies renderSectionByState
- internally handles optional non-blocking error rendering
- internally handles refresh notice visibility via useRefreshVisibility

Result:
- section owners no longer implement their own resolver + render switch wiring
- bypassing the standard state path becomes harder because state branching is centralized

### Dashboard adoption completed
Applied in:
- features/events/components/EventsPageContainer.tsx
- features/vacancies/components/VacanciesPageContainer.tsx
- features/dashboard/components/DashboardNotificationsPageContainer.tsx

Each adopted section now routes all section body states through SectionContainer.

---

## 3. Debugging Improvements (Dev Only)

SectionContainer now supports optional development-only debug visibility:
- debugId: identifies the section in logs/attributes
- enableDebug: explicit opt-in

When debug is enabled in development:
- console.debug logs current section state tuple:
  - sectionState
  - dataState
  - errorState
  - isRefreshing
- rendered output includes data attributes for inspection in DevTools:
  - data-ui-section-state
  - data-ui-data-state
  - data-ui-error-state

Recommended toggle:
- NEXT_PUBLIC_UI_STATE_DEBUG=true

This improves trust in state transitions without affecting production output.

---

## 4. Scaling Strategy Across App

### Migration steps for each new section
1. Move section logic to a clear section owner component.
2. Build filtered data as pure derived state.
3. Compute hasActiveFilters explicitly.
4. Use deriveDataState for data normalization.
5. Map raw errors to errorState: none or present.
6. Derive isRefreshing from loading + existing data.
7. Replace local resolver/switch usage with SectionContainer.
8. Keep action-level feedback outside SectionContainer unless action is section-state-driven.

### Required compliance checklist
A section is compliant only if all checks pass:
- uses deriveDataState for dataState derivation
- uses SectionContainer as the single section state decision entry
- does not call resolveSectionState directly in feature section owners
- does not call renderSectionByState directly in feature section owners
- maps non-blocking and refresh notices through SectionContainer hooks
- keeps empty states in explicit empty-list and empty-filtered branches
- optional debug enabled only via env gate and only in non-production behavior

### Suggested rollout order after dashboard
1. sections with existing loading/error/empty duplication
2. sections with stale-data refresh behavior
3. sections with high UX inconsistency risk

This order reduces regression risk and maximizes immediate consistency gains.

---

## 5. Remaining Risks Before Full Rollout

1. Enforcement is structural, not lint-enforced.
- Developers can still import resolveSectionState directly in future code unless lint rules are added.

2. Filter semantics still depend on section owners.
- deriveDataState is standardized, but hasActiveFilters remains a local responsibility and can still be mis-specified.

3. SectionContainer API flexibility can still be misused.
- If teams over-customize render callbacks, divergence can creep back into section behaviors.

4. No codemod or static audit gate yet.
- App-wide migration speed and consistency depend on manual discipline until automated checks are introduced.

5. Existing non-dashboard surfaces remain heterogeneous.
- Lock-in is complete in dashboard scope, but app-wide consistency requires staged adoption outside this scope.

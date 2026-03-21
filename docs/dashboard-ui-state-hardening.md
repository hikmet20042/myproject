# Dashboard UI State Hardening

## Scope
This hardening pass is limited to the existing dashboard UI-state system and its current section owners.

In-scope areas:
- events section container
- vacancies section container
- dashboard notifications section container
- existing dashboard empty-state render points
- shared UI-state primitives used by dashboard sections

Out of scope:
- non-dashboard pages
- backend/API/SSE behavior
- UX redesign

---

## 1. What Was Hardened

### A) Resolver input model converted to state-machine inputs
Resolver contract changed from boolean composition to normalized state-machine inputs.

Now required inputs:
- `dataState: "loading" | "success" | "empty" | "filtered-empty"`
- `errorState: "none" | "present"`
- `isRefreshing: boolean`

Implemented in:
- `features/ui-state/resolveSectionState.ts`

Dashboard section containers now map raw data signals into these normalized inputs before resolving.

### B) Resolver enforcement pattern added
A shared enforcement helper was added so section body rendering is driven through one resolver path:
- `renderSectionByState(...)` in `features/ui-state/renderSectionByState.ts`

This prevents ad hoc body branching and requires an explicit render map for all body states.

Applied to:
- `features/events/components/EventsPageContainer.tsx`
- `features/vacancies/components/VacanciesPageContainer.tsx`
- `features/dashboard/components/DashboardNotificationsPageContainer.tsx`

### C) Latency hardening for refresh indicators
Refresh indicator visibility now follows anti-flicker timing rules:
- delayed show (prevents fast-refresh flashes)
- minimum visible duration (prevents blink on quick completion)

Implemented as reusable hook:
- `useRefreshVisibility(...)` in `features/ui-state/useRefreshVisibility.ts`

Used by all three dashboard section containers for `loading-refresh` info banners.

### D) Empty-state interface wrapper introduced
Existing empty UIs are preserved visually but now wrapped in a consistent slot interface:
- `SectionEmptyStateSlot` in `features/ui-state/SectionEmptyStateSlot.tsx`

Wrapped empty-state render points:
- `features/events/components/EventsList.tsx`
- `features/vacancies/components/VacanciesList.tsx`
- `features/dashboard/components/DashboardNotificationsPageContainer.tsx`

### E) System boundary prepared for scale
UI-state module was prepared as a reusable cross-feature boundary:
- new shared module: `features/ui-state/*`

Dashboard-local UI-state duplicates and compatibility exports were removed, so section owners now import only from `features/ui-state`.

This keeps current dashboard behavior intact while removing dashboard-only coupling from the core primitives.

---

## 2. Invalid States Now Impossible

With normalized resolver inputs, several invalid boolean combinations are no longer representable directly in resolver API usage.

Impossible-by-contract examples:
1. `hasData=true` together with `dataState="empty"`.
2. `hasFilteredData=false` while `dataState="success"`.
3. `isFilterActive=true` with `dataState="empty"` when filtered-empty semantics are required.
4. ambiguous "both initial loading and content" boolean mixes; now represented as one `dataState` plus optional `isRefreshing`.

Additionally:
- section body state selection is forced through `renderSectionByState(...)`, reducing bypass risk from scattered ternaries.

---

## 3. How Resolver Usage Is Enforced

Enforcement is applied through structure and shared helpers.

1. Input normalization step in each section owner:
- each container derives `dataState`, `errorState`, `isRefreshing` first.

2. Single resolver call:
- each container resolves one `sectionState` via `resolveSectionState(...)`.

3. Single body decision point:
- each container renders body via `renderSectionByState(sectionState, renderMap)`.
- no body switch/ternary is performed outside this helper.

4. Refresh indicator timing unified:
- each container uses `useRefreshVisibility(sectionState === "loading-refresh")` rather than direct refresh-state condition rendering.

5. Empty-slot wrapping:
- all dashboard empty render points now pass through `SectionEmptyStateSlot`, providing a common interface for later migration.

---

## 4. Remaining Risks Before App-Wide Scaling

1. Input derivation still lives inside each section container.
- while resolver is hardened, inconsistent mapping logic could still be introduced in new sections unless extraction of mapping utilities is added later.

2. Import boundary is now strict.
- dashboard-local compatibility layer was removed, so any new section must import from `features/ui-state` directly.

3. Empty-state visuals are intentionally not unified yet.
- interface is unified, but visual components still differ between sections by design in this pass.

4. Enforcement is structural, not lint-enforced.
- current prevention relies on helper usage conventions; no custom lint rule currently blocks future direct ad hoc branching.

---

## Files Added
- `features/ui-state/resolveSectionState.ts`
- `features/ui-state/renderSectionByState.ts`
- `features/ui-state/useRefreshVisibility.ts`
- `features/ui-state/SectionEmptyStateSlot.tsx`
- `features/ui-state/SectionLoading.tsx`
- `features/ui-state/SectionErrorInline.tsx`
- `features/ui-state/index.ts`
- `docs/dashboard-ui-state-hardening.md`

## Files Updated
- `features/ui-state/index.ts`
- `features/ui-state/SectionEmptyStateSlot.tsx`
- `features/events/components/EventsPageContainer.tsx`
- `features/vacancies/components/VacanciesPageContainer.tsx`
- `features/dashboard/components/DashboardNotificationsPageContainer.tsx`
- `features/events/components/EventsList.tsx`
- `features/vacancies/components/VacanciesList.tsx`

## Files Removed
- `features/dashboard/ui-state/index.ts`
- `features/dashboard/ui-state/resolveSectionState.ts`
- `features/dashboard/ui-state/SectionLoading.tsx`
- `features/dashboard/ui-state/SectionErrorInline.tsx`

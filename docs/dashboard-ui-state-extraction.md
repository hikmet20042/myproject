# Dashboard UI State Extraction

## Scope
This extraction pass is limited to dashboard section-state code that was already implemented in the vertical slice.

In-scope files:
- `features/events/components/EventsPageContainer.tsx`
- `features/vacancies/components/VacanciesPageContainer.tsx`
- `features/dashboard/components/DashboardNotificationsPageContainer.tsx`
- `features/ui-state/resolveSectionState.ts`
- `features/ui-state/renderSectionByState.ts`
- `features/ui-state/SectionLoading.tsx`
- `features/ui-state/SectionErrorInline.tsx`
- `features/ui-state/SectionEmptyStateSlot.tsx`
- `features/ui-state/useRefreshVisibility.ts`
- `features/ui-state/index.ts`

Out of scope:
- backend/API/SSE logic
- non-dashboard routes
- route-level ownership behavior already established in dashboard layout

---

## 1. What Patterns Were Extracted

### A) Section state resolver
Extracted reusable resolver:
- `resolveSectionState(...)` in `features/ui-state/resolveSectionState.ts`

Normalized inputs:
- `isLoading`
- `error`
- `hasData`
- `hasFilteredData`
- `isFilterActive`

Single resolved output (`SectionStateKind`):
- `loading-initial`
- `loading-refresh`
- `error-blocking`
- `error-nonblocking`
- `empty-list`
- `empty-filtered`
- `content`

This replaces per-container duplicated booleans and keeps deterministic precedence in one place.

### B) Standard section loading variants
Extracted shared loading component:
- `SectionLoading` in `features/ui-state/SectionLoading.tsx`

Supported variants:
- `list` (rows skeleton)
- `card-grid` (grid cards skeleton)
- `notifications` (notification-like skeleton)

### C) Unified inline error + retry UI
Extracted shared error component:
- `SectionErrorInline` in `features/ui-state/SectionErrorInline.tsx`

Standardized behavior:
- consistent inline error alert card structure
- consistent retry button behavior
- optional `framed` mode for blocking section errors rendered in a card container

### D) Shared cross-feature UI-state module entry
Added `features/ui-state/index.ts` so section containers import from one consistent and reusable boundary.

---

## 2. What Duplication Was Removed

Removed repeated logic from events, vacancies, notifications containers:
- manual duplicated booleans for loading/error/data combinations
- repeated initial-loading skeleton markup
- repeated error inline/retry markup
- repeated blocking error card wrapper markup
- scattered ternary trees for section body state transitions

All three section containers now:
- resolve section state via `resolveSectionState(...)`
- render non-blocking section error through `SectionErrorInline`
- render refresh info banner from one resolved state
- render section body through one decision point (`renderSectionBody` switch)

---

## 3. How Sections Are Now Consistent

Each section now follows the same rendering shape:
1. Resolve state once with normalized section inputs.
2. Render top-level non-blocking status UI (if applicable).
3. Render section body via one switch on the resolved state.

Consistent semantic mapping:
- `error-blocking` -> blocking error UI with retry
- `loading-initial` -> standardized loading skeleton variant
- `loading-refresh` -> non-blocking "refreshing" info banner while stale content remains
- `error-nonblocking` -> non-blocking inline error with retry while stale content remains
- `empty-list` / `empty-filtered` -> deterministic empty semantics
- `content` -> normal list/content rendering

Notes per section:
- Events and vacancies preserve existing empty-state UX through their existing list components.
- Notifications preserves existing empty-state messaging split between "no data yet" and "filtered empty".

---

## 4. Risks or Tradeoffs

1. Centralized resolver means precedence changes affect all dashboard sections using it.
- Tradeoff: better consistency, but resolver updates must be deliberate.

2. Notifications now uses shared skeleton variant.
- Tradeoff: improved consistency and reuse; visual details are intentionally standardized.

3. Some section-specific empty rendering is still delegated to feature list components (events/vacancies).
- Tradeoff: preserves current UX behavior with minimal risk, but leaves those empty UIs outside the shared component layer for now.

4. This pass is structural, not behavioral.
- Existing user flows are preserved by keeping the same branch outcomes and retry actions while consolidating implementation shape.

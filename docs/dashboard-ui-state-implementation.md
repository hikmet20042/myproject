# Dashboard UI State Implementation (Vertical Slice)

## Scope Applied
Implemented only dashboard-area UI-state logic and related section components.

In-scope paths covered:
- `app/dashboard/layout.tsx`
- `app/dashboard/events/create/page.tsx`
- `app/dashboard/events/[id]/page.tsx`
- `app/dashboard/events/[id]/edit/page.tsx`
- `app/dashboard/vacancies/create/page.tsx`
- `features/events/components/EventsPageContainer.tsx`
- `features/vacancies/components/VacanciesPageContainer.tsx`
- `features/dashboard/components/DashboardNotificationsPageContainer.tsx`
- `components/NotificationContext.tsx`
- `components/shared/index.ts`
- `components/shared/UnauthorizedState.tsx`

Out-of-scope kept unchanged:
- Backend business logic and DB schema
- API contracts/routes behavior
- SSE transport implementation details
- Unrelated global pages and non-dashboard feature surfaces

---

## 1. What Was Changed (Files + Behavior)

### A) Route-level owner and deterministic gating

#### `app/dashboard/layout.tsx`
Changes:
- Replaced bare page loader with unified `LoadingState` including text.
- Added deterministic route-level render gating for dashboard:
  1. auth unknown / mount not ready -> `LoadingState`
  2. unauthenticated -> redirect to sign-in
  3. permission unknown (account type / approval unknown) -> `LoadingState`
  4. permission denied (non-organization or unapproved org) -> `UnauthorizedState`
  5. otherwise -> dashboard content (`DashboardShell` + children)
- Removed permission-denied redirects in effect path; unauthorized now resolves to explicit UI state.

#### `components/shared/UnauthorizedState.tsx` (new)
Changes:
- Added explicit Unauthorized UI component.
- Added shared export via `components/shared/index.ts`.

### B) LoadingPage standardization

#### `app/dashboard/layout.tsx`
Changes:
- Removed `Loading` (bare spinner) usage.
- Standardized to `LoadingState` with explicit text labels.

#### `app/dashboard/events/create/page.tsx`
Changes:
- Replaced unstyled Suspense spinner fallback with `LoadingState` text fallback.

### C) Section-level owners (events, vacancies, notifications)

#### `features/events/components/EventsPageContainer.tsx`
Changes:
- Removed route/auth ownership from section component (layout owns route-level auth/permission).
- Added section-level deterministic states:
  - `LoadingSection` behavior via skeleton rows when initial section load and no data.
  - stale-data refresh behavior: existing list remains visible with inline info alert while loading.
  - `ErrorInline` behavior:
    - blocking section error card with retry when no data exists.
    - non-blocking inline alert with retry when stale data exists.
  - existing empty behavior remains in `EventsList` (empty list/filtered empty handled after successful load).
- Removed page-level `<Loading />` usage.

#### `features/vacancies/components/VacanciesPageContainer.tsx`
Changes:
- Removed route/auth ownership from section component.
- Added explicit section fetch error state (`fetchError`) and retry UI.
- Added section-level deterministic states:
  - skeleton rows for initial loading with no data.
  - stale-data refresh indicator when loading with existing list.
  - `ErrorInline` blocking/non-blocking patterns matching events.
  - empty list/filtered empty remains through `VacanciesList` after successful load.
- Removed page-level `<Loading />` usage.
- Eliminated console-only fetch failure for vacancies list.

#### `features/dashboard/components/DashboardNotificationsPageContainer.tsx`
Changes:
- Added section-level error handling based on context error state.
- Added deterministic section states:
  - initial loading skeleton when no notifications.
  - non-blocking refresh indicator when stale data is visible.
  - blocking error inline with retry when no notifications available.
  - non-blocking error inline with retry when stale notifications exist.
- Added action-level inline error feedback (`actionError`) for mark-all and toggle-read failures.

#### `components/NotificationContext.tsx`
Changes:
- Added context error surface (`error`) for notification fetch failures.
- `refreshNotifications` now sets/clears error state for section-level rendering.
- `toggleNotificationRead` and `markAllAsRead` now throw on failure after rollback so action owners can show inline error feedback.

### D) Action-level behavior (remove alert, inline feedback)

#### `app/dashboard/events/create/page.tsx`
Changes:
- Removed `alert()` usage for submit failures.
- Added inline `Alert` feedback state (`feedbackMessage`, `feedbackVariant`).
- Kept inline loading behavior with button loading state.

#### `app/dashboard/vacancies/create/page.tsx`
Changes:
- Removed all `alert()` validation/submission patterns.
- Added inline `Alert` feedback for validation and submit failures/success messaging.
- Kept inline loading behavior in submit button.

#### `app/dashboard/events/[id]/page.tsx`
Changes:
- Removed delete `alert()` feedback.
- Added inline `Alert` feedback for delete success/failure.

#### `app/dashboard/events/[id]/edit/page.tsx`
Changes:
- Removed submit `alert()` feedback.
- Added inline `Alert` feedback for update success/failure.

---

## 2. States Now Handled Correctly

### Route-level (dashboard)
- `LoadingPage` with text for auth/permission unknown.
- unauthenticated redirect.
- `UnauthorizedPage` for permission denied.
- content render only after route gate resolves.

### Section-level (events/vacancies/notifications)
- Initial section loading without blocking full page.
- Inline section error with retry instead of empty-on-failure.
- Empty list and filtered empty only after successful data resolution.
- Stale data remains visible during refresh with explicit updating indicator.

### Action-level (dashboard create/edit/delete/toggle)
- Inline action progress retained (`loading` or action spinner states).
- Inline feedback for failure/success (no browser `alert()`).
- Notification read/mark-all failures now surfaced in UI.

### Forbidden patterns removed in implemented slice
- `alert()` usage in dashboard scope files modified here.
- page-level bare `<Loading />` in dashboard layout/events/vacancies section containers.
- unstyled Suspense fallback in dashboard event-create page.
- silent vacancies section fetch failure.

---

## 3. Edge Cases Discovered During Implementation

1. Notification action failure signaling was swallowed inside context.
- Action-level UI could not surface errors until context actions were made reject-capable.
- Resolved by throwing after rollback in `toggleNotificationRead` and `markAllAsRead`.

2. Existing data-provider and section ownership overlapped.
- Events section previously combined auth guard + section loading + page loading.
- Resolved by moving route ownership to dashboard layout and leaving section owner for data UI states.

3. Initial vs refresh loading needed explicit split.
- Without separate handling, refresh could wipe visible lists and flash empty/loading.
- Resolved by distinguishing `loading && data.length === 0` from `loading && data.length > 0`.

4. Working tree contains many unrelated modifications.
- Implementation was restricted to dashboard UI-state slice files listed above.

---

## 4. Remaining Non-Compliant or Partial Areas (Known)

1. Dashboard profile route internals are not fully aligned to the new ownership model.
- `app/dashboard/profile/page.tsx` delegates to profile feature container that still has its own legacy state semantics.
- This was outside the targeted section-components slice (events/vacancies/notifications).

2. Some dashboard files still include `console.error` logging alongside user feedback.
- Logging remains, but user-facing feedback now exists in edited action/section paths.

3. Route-critical notFound/error precedence for all dashboard detail routes is not globally standardized yet.
- Event detail/edit received action feedback cleanup, but full-app notFound/unauthorized policy rollout was intentionally out of scope for this vertical slice.

4. Existing global unrelated changes in repository remain untouched.
- No backend/API/SSE transport logic was redesigned as requested.

---

## Summary
This vertical slice demonstrates the unified UI-state system working in dashboard scope with minimal, controlled refactors:
- route ownership is centralized in dashboard layout,
- page-level loading is standardized with text,
- section owners now handle loading/error/empty/content deterministically,
- action feedback is inline (no `alert()`),
- stale data stays visible during refresh,
- section fetch failures render explicit inline errors with retry.

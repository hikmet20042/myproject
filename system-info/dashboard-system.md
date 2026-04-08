=== FILE: dashboard-system.md ===

# Dashboard Workspace - Deep Current State

## 1. Feature Summary

The Dashboard Workspace is the authenticated organization management area served under the /dashboard route group. It is implemented as a client-rendered dashboard shell with section pages for organization profile, notifications, events, and vacancies.

At runtime, dashboard access is controlled in two layers:
- Middleware authentication gate for /dashboard paths.
- Client-side dashboard authorization check requiring accountType === organization and organizationStatus === approved.

Primary user scope of the dashboard in current code:
- Approved organization accounts use it to manage profile data, organization-owned events, organization-owned vacancies, and organization-targeted notifications.

Core dashboard page structure:
- /dashboard redirects to /dashboard/profile.
- /dashboard/profile renders organization profile view/edit container.
- /dashboard/notifications renders dashboard notifications container.
- /dashboard/events renders event management list container.
- /dashboard/vacancies renders vacancy management list container.
- Additional dashboard event routes exist for create, detail, and edit.
- Additional dashboard vacancy route exists for create.

Global providers affecting dashboard behavior:
- AuthProvider provides useSession state used by dashboard authorization and section logic.
- NotificationProvider is mounted in root layout and powers notifications state/actions.
- DashboardDataProvider is mounted specifically inside dashboard layout and provides dashboard-scoped events data and helper actions.


## 2. All User Capabilities

### Accessing Dashboard
- Open /dashboard and get redirected to /dashboard/profile.
- Access dashboard routes only when authenticated (middleware redirects unauthenticated requests to /auth/signin with callbackUrl).
- See unauthorized state screen when authenticated but not an approved organization account.

### Navigating Between Dashboard Sections
- Use left sidebar navigation in DashboardShell:
  - Organization Profile
  - Notifications
  - Your Events
  - Your Vacancies
- Sidebar active state follows current pathname.
- Navigation links are normalized via useLocalizedPath.

### Managing Organization Profile
- Open profile overview screen in dashboard profile page.
- Toggle between profile overview and edit mode using header action button.
- Fetch current organization profile from /api/organization/profile.
- Edit fields in ProfileForm and save via PUT /api/profile/organization.
- Cancel edit mode and return to profile overview.
- See success/error feedback alert after save attempt.

Editable profile fields currently represented in form state:
- organizationName
- organizationType
- description
- website
- contactPhone
- address
- registrationNumber
- focusAreas (checkbox multi-select)
- socialMedia: facebook, twitter, instagram, linkedin, youtube, website

### Managing Events
- View event list for current organization via dashboard events page.
- Data source is DashboardDataProvider events state loaded from /api/events?author=me.
- Filter events by:
  - Search term (title/description)
  - Status (all/pending/approved/rejected with approved tied to isPublished)
  - Category
- Create new event via navigation to /dashboard/events/create.
- Open event detail via /dashboard/events/[id] route (existing page).
- Open event edit route /dashboard/events/[id]/edit.
- Open public resource view /resources/events/[id].
- Delete event from list with confirmation modal and DELETE /api/events/[id].
- Receive inline feedback alert for delete success/error.

### Creating Events (Dashboard Create Route)
- Fill event creation form with core fields and optional training-specific fields.
- If URL query includes type=training/workshop/seminar, eventType initializes from query.
- Submit to POST /api/events.
- On success:
  - markEventsDirty() is called in DashboardDataProvider.
  - User is redirected to /dashboard/events.

### Viewing Event Detail (Dashboard Event Detail Route)
- Fetch selected event via GET /api/events/[id].
- Display status badge based on approval/rejection fields.
- Display description, location info, tags, optional image, and metadata blocks.
- Navigate to edit route.
- Delete from detail view with confirmation dialog.

### Editing Event (Dashboard Event Edit Route)
- Load existing event via GET /api/events/[id].
- Prefill edit form from loaded event.
- Submit update via PUT /api/events/[id].
- On success:
  - markEventsDirty() is called.
  - Redirect to /dashboard/events.

### Managing Vacancies
- View vacancy list for current organization via dashboard vacancies page.
- Data source is local page fetch to /api/vacancies?author=me.
- Filter vacancies by:
  - Search term (title/description)
  - Status
  - Category
  - Compensation type
- Create new vacancy via /dashboard/vacancies/create.
- Open public resource view /resources/vacancies/[id].
- Open dashboard vacancy edit URL /dashboard/vacancies/[id]/edit from row action link.
- Delete vacancy with confirmation modal and DELETE /api/vacancies/[id].
- Receive inline feedback alert for delete success/error.

### Creating Vacancies (Dashboard Create Route)
- Fill vacancy creation form with:
  - Basic role information
  - Type/category/work mode
  - Location fields
  - Application method (link or email)
  - Application instructions and deadline
  - Requirements/responsibilities/qualifications/benefits/tags arrays
  - Compensation and duration options
- Submit to POST /api/vacancies.
- On success redirect is currently to /dashboard.

### Viewing Notifications
- Open dashboard notifications page powered by NotificationContext.
- Fetch notifications through context refresh from /api/notifications.
- See unread count badge in section header and inbox area.
- Filter notifications by status:
  - all
  - unread
  - read
- Filter notifications by date scope:
  - all
  - today
  - last7days
  - last30days
- Filters are serialized into filter query param in URL.
- Notifications are grouped by date buckets:
  - Today
  - Yesterday
  - Earlier
- Open a notification modal to view title/message/timestamp.
- Toggle read/unread per item.
- Mark all as read.
- Load more notifications incrementally (visible window pagination).


## 3. Detailed Flows

### Dashboard Access Flow
1. Request enters middleware.
2. middleware.ts checks protected path prefixes including /dashboard.
3. If user is unauthenticated, middleware redirects to /auth/signin and includes callbackUrl.
4. If authenticated, request proceeds to dashboard route rendering.
5. app/dashboard/layout.tsx runs client authorization:
   - Reads session from useSession.
   - If session is null, returns null.
   - Validates accountType === organization and organizationStatus === approved.
6. If validation fails, layout renders UnauthorizedState with organization-required message.
7. If validation passes:
   - Wraps children with DashboardDataProvider.
   - Renders DashboardShell and selected page content.

### Navigation Between Sections Flow
1. DashboardShell renders sidebar navItems with fixed dashboard links.
2. Each href is normalized by useLocalizedPath.
3. Active state is computed from current pathname:
   - Exact match for link.
   - Prefix match for sub-routes.
4. Clicking nav item transitions to corresponding dashboard page route.

### Dashboard Events Management Flow
List page:
1. app/dashboard/events/page.tsx renders EventsPageContainer.
2. EventsPageContainer consumes useDashboardData values:
   - events
   - eventsLoading
   - eventsError
   - ensureFreshEvents
   - refreshEvents
   - removeEventById
3. On mount, ensureFreshEvents(EVENTS_STALE_MS) runs.
4. DashboardDataProvider refreshEvents fetches /api/events?author=me.
5. Container computes filteredEvents based on search/status/category.
6. UI state is resolved through resolveSectionState + renderSectionByState.
7. Depending on state:
   - blocking error: framed SectionErrorInline with retry.
   - initial loading: SectionLoading list skeleton.
   - empty/list/content: EventsList.
8. Non-blocking refresh errors show inline error with retry.
9. Refresh notice is shown using useRefreshVisibility when loading with existing data.

Delete flow:
1. User clicks delete action in EventRow.
2. EventDeleteDialog opens.
3. Confirm triggers DELETE /api/events/[id].
4. On success removeEventById updates provider state immediately.
5. Success feedback alert is shown.

Create flow:
1. User clicks Create Event -> /dashboard/events/create.
2. Form submit sends POST /api/events.
3. On success, markEventsDirty() called.
4. Router navigates back to /dashboard/events.

Detail flow:
1. /dashboard/events/[id] page loads event from GET /api/events/[id].
2. If not found/error -> ErrorState with return action.
3. Otherwise render full detail and allow edit/delete actions.

Edit flow:
1. /dashboard/events/[id]/edit fetches current event.
2. Form prefilled with event values.
3. Submit sends PUT /api/events/[id].
4. On success, markEventsDirty() then redirect to /dashboard/events.

### Dashboard Vacancies Management Flow
List page:
1. app/dashboard/vacancies/page.tsx renders VacanciesPageContainer.
2. Container executes fetchVacancies on mount.
3. fetchVacancies requests /api/vacancies?author=me.
4. Vacancies are stored in local component state (not DashboardDataProvider).
5. Filtering applies search/status/category/compensation.
6. UI state uses resolveSectionState + renderSectionByState.
7. State outcomes:
   - blocking error with retry
   - initial skeleton loading
   - empty/filter-empty/content using VacanciesList
8. Non-blocking refresh errors are shown inline.
9. Refresh notice visibility uses useRefreshVisibility.

Delete flow:
1. User clicks delete action in VacancyRow.
2. VacancyDeleteDialog opens.
3. Confirm sends DELETE /api/vacancies/[id].
4. On success, local vacancies array removes deleted item.
5. Feedback alert indicates success/error.

Create flow:
1. User navigates to /dashboard/vacancies/create.
2. Form performs client-side validations for required fields and method-specific fields.
3. Submit sends POST /api/vacancies.
4. On success user is redirected to /dashboard.

### Dashboard Profile Flow
1. app/dashboard/profile/page.tsx renders ProfilePageContainer.
2. Container waits for mounted + session readiness from useSession.
3. When ready, fetchProfile calls GET /api/organization/profile.
4. organizationProfile state stores fetched organization object.
5. Default view is ProfileView inside profile card.
6. Clicking Edit Profile toggles showProfileEdit.
7. Edit mode renders ProfileForm.
8. ProfileForm save sends PUT /api/profile/organization with form payload.
9. On success:
   - Success feedback appears.
   - onSave updates container profile state.
   - Container exits edit mode to overview.

### Dashboard Notifications Flow
1. app/dashboard/notifications/page.tsx renders DashboardNotificationsPageContainer.
2. Container consumes NotificationContext values:
   - notifications
   - unreadCount
   - isLoading
   - error
   - refreshNotifications
   - ensureFreshNotifications
   - toggleNotificationRead
   - markAllAsRead
3. On mount, ensureFreshNotifications(45_000) runs.
4. Active filters are parsed from filter query param token list.
5. Filtered notifications are computed by status + date rules.
6. Visible list window is sliced by visibleCount.
7. Visible items are grouped into Today/Yesterday/Earlier buckets.
8. SectionContainer handles loading/error/empty/content rendering states.
9. Mark All as Read triggers context markAllAsRead -> PUT /api/notifications.
10. Per-item read toggle triggers context toggleNotificationRead -> PUT /api/notifications.
11. Opening item launches NotificationModal.
12. Modal read/unread action uses same toggle flow then closes modal.
13. Load more increases visibleCount by fixed step.


## 4. Full Code Mapping

### Pages
Dashboard route pages:
- app/dashboard/page.tsx: redirects to /dashboard/profile
- app/dashboard/layout.tsx: authorization gate + provider/shell wrapper
- app/dashboard/profile/page.tsx: renders ProfilePageContainer
- app/dashboard/notifications/page.tsx: renders DashboardNotificationsPageContainer
- app/dashboard/events/page.tsx: renders EventsPageContainer
- app/dashboard/events/create/page.tsx: dashboard event creation form page
- app/dashboard/events/[id]/page.tsx: dashboard event detail page
- app/dashboard/events/[id]/edit/page.tsx: dashboard event edit page
- app/dashboard/vacancies/page.tsx: renders VacanciesPageContainer
- app/dashboard/vacancies/create/page.tsx: dashboard vacancy creation form page

### Layout
- app/dashboard/layout.tsx:
  - Reads session from useSession.
  - Renders UnauthorizedState when account is not approved organization.
  - Wraps page in DashboardDataProvider and DashboardShell when authorized.

- components/dashboard/DashboardShell.tsx:
  - Sidebar + main content shell.
  - Declares static nav items and active route styling.

### Components
Dashboard section containers currently used by pages:
- features/events/components/EventsPageContainer.tsx
- features/vacancies/components/VacanciesPageContainer.tsx
- features/profile/components/ProfilePageContainer.tsx
- features/dashboard/components/DashboardNotificationsPageContainer.tsx

Dashboard section support components:
- features/events/components/EventsList.tsx
- features/events/components/EventRow.tsx
- features/events/components/EventDeleteDialog.tsx
- features/events/components/types.ts
- features/vacancies/components/VacanciesList.tsx
- features/vacancies/components/VacancyRow.tsx
- features/vacancies/components/VacancyDeleteDialog.tsx
- features/vacancies/components/types.ts
- features/profile/components/ProfileForm.tsx
- features/profile/components/ProfileView.tsx

Shared UI-state components used by dashboard sections:
- features/ui-state/resolveSectionState.ts
- features/ui-state/renderSectionByState.ts
- features/ui-state/deriveDataState.ts
- features/ui-state/SectionContainer.tsx
- features/ui-state/SectionLoading.tsx
- features/ui-state/SectionErrorInline.tsx
- features/ui-state/SectionEmptyStateSlot.tsx
- features/ui-state/useRefreshVisibility.ts

Notification UI components used in dashboard notifications:
- components/NotificationContext.tsx
- components/NotificationModal.tsx
- components/notifications/NotificationListItem.tsx

Legacy dashboard management components present in codebase:
- components/dashboard/EventManagement.tsx
- components/dashboard/VacancyManagement.tsx


## 5. Data Flow & State

### Authentication/Session State
- Client session source: useSession from lib/auth/client.ts.
- Session is produced by AuthProvider:
  - Reads Supabase auth user.
  - Enriches with accounts table data (role, account_type, is_active).
  - For organization accounts, enriches with organization_profiles moderation_status and organization_name.
- Dashboard layout authorization is based on session user fields:
  - accountType
  - organizationStatus

### Dashboard Layout State Boundary
- DashboardDataProvider is mounted only for authorized dashboard sessions.
- It exposes context for profile/events/vacancies fields plus event refresh helpers.

DashboardDataProvider events state:
- events
- eventsLoading
- eventsError
- eventsLastFetchedAt
- eventsDirty
- refreshEvents
- refreshEventsIfStale(maxAgeMs)
- ensureFreshEvents(maxAgeMs)
- markEventsDirty
- removeEventById

DashboardDataProvider event fetch behavior:
- refreshEvents fetches /api/events?author=me.
- Initial fetch occurs only when:
  - session status is ready (not loading)
  - account is approved organization
  - hasFetchedEventsRef is false
- Non-approved/non-organization path resets events state to empty + no error.

DashboardDataProvider profile/vacancy slots:
- profile/profileLoading/profileError + setters exist.
- vacancies/vacanciesLoading/vacanciesError + setters exist.
- Current profile/vacancy page containers primarily use their own local fetch/state paths.

### Events Page State Pattern
- Uses dashboard context as authoritative events source.
- Local UI state:
  - search/filter inputs
  - delete modal state
  - deletion status
  - feedback message state
- Section-level rendering state is computed from:
  - dataState (loading/empty/filtered-empty/success)
  - errorState
  - isRefreshing

### Vacancies Page State Pattern
- Uses component-local source of truth for vacancies data.
- Fetches via /api/vacancies?author=me on mount.
- Maintains local loading/error/filter/modal/feedback states.
- Uses same section state rendering pattern as events via features/ui-state helpers.

### Profile Page State Pattern
- Uses useSession for auth readiness.
- Maintains organizationProfile, loading, showProfileEdit flags.
- Fetches profile with GET /api/organization/profile when mounted and authenticated.
- Passes organizationProfile down to ProfileView and ProfileForm.

### Notifications State Pattern
- NotificationProvider in root layout stores notifications, unreadCount, loading, error.
- Provider refreshNotifications() loads from GET /api/notifications.
- Provider ensures freshness via lastLoadedAtRef + maxAge checks.
- Dashboard notifications container derives filtered/grouped presentation states locally.


## 6. Interaction With Other Systems

### Auth System Interaction
Dashboard workspace interacts with auth in several layers:
- middleware.ts enforces authentication for /dashboard routes.
- app/dashboard/layout.tsx enforces approved organization authorization.
- AuthProvider and useSession provide runtime user authority fields.
- API routes called from dashboard rely on getServerSession() for server authorization/ownership checks.

### Profile System Interaction
Dashboard profile section uses:
- GET /api/organization/profile for organization profile retrieval.
- PUT /api/profile/organization for organization profile updates.

Organization profile APIs map to Supabase organization_profiles records and return normalized response objects used by profile UI.

### Events System Interaction
Dashboard events section uses:
- GET /api/events?author=me for owned events listing.
- POST /api/events for event creation.
- GET /api/events/[id] for detail/edit load.
- PUT /api/events/[id] for updates.
- DELETE /api/events/[id] for deletion.

Server-side event ownership model supports two creator columns:
- created_by
- created_by_organization

Dashboard flows rely on author=me query support and ownership checks in /api/events and /api/events/[id].

### Vacancies System Interaction
Dashboard vacancies section uses:
- GET /api/vacancies?author=me for owned vacancies listing.
- POST /api/vacancies for creation.
- DELETE /api/vacancies/[id] for deletion.
- Vacancy row actions link to /dashboard/vacancies/[id]/edit URL.

Vacancy APIs support creator ownership by:
- created_by
- created_by_organization

Vacancy status actions (admin-side patch path) also trigger notification generation through NotificationService.

### Notifications System Interaction
Dashboard notifications section uses NotificationContext methods that call:
- GET /api/notifications
- PUT /api/notifications (single read toggle and markAllAsRead)

Notifications API ownership behavior:
- Approved organization users query by organization_id.
- Other users query by user_id.


## 7. Role Behavior

### Unauthenticated Visitor
- Middleware detects protected /dashboard path and redirects to /auth/signin.
- callbackUrl is set to original dashboard pathname.

### Authenticated Regular User (accountType: user)
- Can pass middleware authentication gate.
- Dashboard layout authorization check fails because accountType is not organization approved.
- Receives UnauthorizedState message in dashboard layout.

### Authenticated Organization User (Pending/Rejected)
- Can pass middleware authentication gate.
- Dashboard layout authorization check fails when organizationStatus is not approved.
- Receives UnauthorizedState in dashboard layout.

### Authenticated Approved Organization User
- Passes dashboard layout authorization.
- Receives DashboardShell + dashboard section pages.
- Can perform profile/events/vacancies/notifications operations tied to organization ownership.

### Admin User
- Middleware allows authenticated admin user to access protected routes.
- Dashboard layout still applies approved organization check; rendering follows that check.
- API behavior includes admin capabilities for events/vacancies moderation and vacancy create path.


## 8. Edge Behaviors (Observed)

### Unauthorized Access Behavior
- Route-level auth redirect is handled by middleware for unauthenticated users.
- In-layout unauthorized state is rendered for authenticated but non-approved organization users.

### Loading Behaviors
- Profile page shows full-screen LoadingState while session/profile are loading.
- Events/vacancies sections show skeleton lists on initial load (SectionLoading variant list).
- Notifications section shows notification skeleton rows on initial load.
- Refreshing with existing data uses non-blocking loading mode and optional refresh notices.

### Empty State Behaviors
- Events list:
  - empty-list and empty-filtered states both route through EventsList empty messaging.
- Vacancies list:
  - empty-list and empty-filtered states both route through VacanciesList empty messaging.
- Notifications:
  - empty-list and empty-filtered states render dedicated framed empty-state blocks via SectionEmptyStateSlot.

### Error Behaviors
- Events and vacancies pages support:
  - blocking error state with retry action.
  - non-blocking error state when stale data is present.
- Profile fetch/save failures are surfaced through loading fallback or inline alert in form.
- Notifications action failures set local actionError alert.

### Data Freshness Behaviors
- Events provider tracks last fetched timestamp and dirty flag.
- Event create/edit pages call markEventsDirty to force next list refresh path.
- Notifications provider tracks lastLoadedAt and supports ensureFreshNotifications(maxAgeMs).

### URL/Filter Behaviors
- Notifications filters are serialized as comma-separated tokens in filter query parameter.
- Filter changes update URL with router.replace.
- Visible notifications reset to initial page size when filter changes.

### Dashboard Route Normalization Behavior
- middleware.ts redirects /organization-dashboard path segments to /dashboard.
- middleware.ts strips legacy language prefixes from path segments.


## 9. Notes for AI Understanding

The current dashboard acts as a workspace shell with section-specific containers, not as a single monolithic page. Orchestration is split across:
- middleware auth routing gate,
- dashboard layout authorization gate,
- dashboard shell navigation,
- section containers with independent fetch/state logic.

Cross-section shared patterns currently visible:
- Section UI-state model for loading/error/empty/content (resolveSectionState + renderSectionByState).
- Reusable inline section error and loading components.
- Card-based section layouts with common header/filter/list structure.

Section-level orchestration characteristics:
- Events section is context-backed by DashboardDataProvider and includes stale/dirty refresh semantics.
- Vacancies section uses local state and direct API fetch inside container.
- Profile section uses direct profile fetch/update endpoints and toggled view/edit mode.
- Notifications section is context-backed globally and uses URL-driven filtering + grouped rendering.

Dashboard centrality in runtime:
- It is the approved-organization operational surface for organization-owned content and profile maintenance.
- It depends on shared auth/session authority and shared notification infrastructure mounted at root layout.

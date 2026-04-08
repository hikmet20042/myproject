=== FILE: vacancies-system.md ===

# Vacancies System - Deep Current State

## 1. Feature Summary
The vacancies system currently provides:
- Public vacancies discovery and filtering through the resources area.
- Public vacancy detail pages with application information, save action, and view tracking.
- Organization dashboard vacancy management list for approved organization accounts.
- Organization vacancy creation form in dashboard.
- Vacancy moderation workflows in admin panel and admin preview page.
- Vacancy APIs for listing, creation, single read, update, moderation, deletion, save/unsave, and view analytics.
- Vacancy SEO metadata helper and JobPosting structured data generation helper.
- Vacancy presence on homepage teaser cards, resources hub links, and sitemap generation.

Primary runtime architecture:
- Frontend uses Next.js app router client pages/components.
- Backend uses app/api routes with Supabase admin client.
- Auth checks use getServerSession from server auth wrapper.
- Data persistence is in Supabase public.vacancies plus users.saved_vacancies for save state.

## 2. All User Capabilities

Public/visitor capabilities:
- Open vacancies listing page at /resources/vacancies.
- Search vacancies by title, organization name, and description (client-side filter over fetched list).
- Filter vacancies by type, location, and experience level on listing page.
- Open vacancy detail page at /resources/vacancies/[id].
- Read vacancy sections: description, responsibilities, requirements, qualifications, application instructions, required documents, skills/languages, compensation benefits.
- Use direct apply actions from listing/detail when application link/email exists.
- Trigger view tracking for vacancy detail (with guest first-view gating using sessionStorage key viewed_vacancy_<id>).
- See view count on detail via ViewTracker.

Authenticated user capabilities (non-organization user account):
- Save/unsave vacancy from listing and detail through SaveButton.
- Retrieve save status via GET /api/vacancies/[id]/save.
- Toggle save state via POST /api/vacancies/[id]/save.

Approved organization account capabilities:
- Access /dashboard and /dashboard/vacancies through dashboard layout authorization.
- Load own vacancies via /api/vacancies?author=me.
- Filter own vacancies by search, moderation status, category, compensation type.
- Open public detail of own vacancy from dashboard list.
- Trigger delete confirmation dialog and delete own vacancy.
- Open create page /dashboard/vacancies/create and submit vacancy creation form.
- Update vacancy through PUT API capability if owner (UI edit page link exists in dashboard rows, but no existing app route file for /dashboard/vacancies/[id]/edit in current tree).

Admin capabilities:
- Access admin vacancies tab in admin panel.
- Load vacancies queue in adminView mode using /api/vacancies?adminView=true with status/search/pagination.
- Open dedicated admin vacancy preview page /admin/preview/vacancies/[id].
- Approve pending vacancy through PATCH /api/vacancies/[id] with action=approve.
- Reject pending vacancy through PATCH /api/vacancies/[id] with action=reject and rejectionReason requirement at API level.
- Delete non-pending vacancies from admin list through DELETE /api/vacancies/[id].
- Send moderation outcome notifications to vacancy owner user/organization through NotificationService call in PATCH API.

## 3. Detailed User Flows

### Vacancy Creation Flow
Entry points:
- Dashboard sidebar to /dashboard/vacancies then Create Vacancy button.
- Direct route /dashboard/vacancies/create.

Authorization layers:
- Middleware requires authentication for /dashboard paths.
- Dashboard layout requires accountType=organization and organizationStatus=approved.
- API POST /api/vacancies additionally allows only admin OR approved organization.

Form behavior (client page):
- Local form state includes title, type, description, category, workType, city/country, application method/link/email/instructions/deadline, arrays for requirements/responsibilities/qualifications/benefits/tags, experience, compensation and duration fields.
- Client performs required checks with alert popups for missing fields.
- For application method, link or email is required based on selected radio option.
- Arrays are edited with add/remove controls.
- Submit builds vacancyData object and posts JSON to /api/vacancies.
- On success, router push to /dashboard.
- On failure, shows alert using error.error payload when available.

Server-side creation behavior:
- Validates authentication and allowed actor type.
- Validates required fields:
  - title, description, type, category, workType, experienceLevel, applicationDeadline, applicationInstructions.
- Validates description minimum text length after HTML stripping: >= 50 chars.
- Validates applicationInstructions minimum length if present: >= 30 chars.
- Validates applicationMethod dependent fields:
  - link requires applicationLink.
  - email requires applicationEmail.
- Validates body.deadline future date if present.
- Maps form compensationType to database compensation.type:
  - salary/hourly/negotiable -> paid
  - volunteer -> unpaid
  - stipend -> stipend
- Maps form durationType to database duration.type:
  - permanent -> permanent
  - fixed/project -> contract
  - temporary -> temporary
- Builds structured JSON fields:
  - location, compensation, duration, application_process.
- Sets creator columns:
  - approved organization: created_by=null, created_by_organization=session user id
  - otherwise user creator id in created_by
- Sets moderation defaults:
  - admin creator -> status approved and is_published true
  - non-admin approved organization creator -> status pending and is_published false
- Inserts into public.vacancies, returns mapped vacancy payload and message.

### Vacancy Editing Flow
Current UI state:
- Dashboard vacancy rows contain edit links to /dashboard/vacancies/[id]/edit.
- Workspace file map currently has no app/dashboard/vacancies/[id]/edit/page.tsx route file.

Current API edit behavior:
- PUT /api/vacancies/[id] exists.
- Requires session authentication.
- Loads target vacancy and validates existence.
- Allows only owner (created_by or created_by_organization matches session user id) or admin.
- Requires fields title, description, type, location in request body.
- Re-validates description length and optional applicationInstructions length.
- Validates body.deadline future date if provided.
- Applies allowed field subset and maps to DB fields:
  - deadline -> application_deadline
  - applicationInstructions/contactEmail/contactPhone -> application_process merge
  - benefits -> compensation merge
- For non-admin owner updates, moderation state resets to pending and approval/rejection fields are cleared.
- Returns updated mapped vacancy.

### Vacancy Viewing Flow
Public listing page flow:
- /resources/vacancies loads on mount and fetches /api/vacancies?status=approved&limit=50.
- Stores rawVacancies and computes display model in useMemo.
- Applies client-side filters for search/type/location/experience.
- Renders cards with:
  - type badge, title, organization display, description excerpt, location, salary/deadline, detail link, optional external apply button, save button.
- Shows empty result card when filtered list is empty.
- Shows error banner when fetch fails.

Public detail page flow:
- /resources/vacancies/[id] fetches /api/vacancies/[id] on params.id availability.
- If loading: LoadingState.
- If error/not found: ErrorState with retry to vacancies list.
- On success renders:
  - headline, type/workType badges, featured/urgent badges,
  - organization and location chips,
  - compensation chip for paid roles,
  - ViewTracker display,
  - content sections and sidebar stats.
- Includes SaveButton and apply actions via applicationProcess link/email.

API single-view visibility control:
- GET /api/vacancies/[id] returns vacancy for approved + published content publicly.
- For non-approved or unpublished vacancy, access is restricted to:
  - admin, or
  - owner (created_by or created_by_organization).

### Vacancy Save Flow
Client:
- SaveButton supports itemType vacancy.
- On mount for authenticated users, calls GET /api/vacancies/[id]/save and sets hasSaved.
- On click:
  - unauthenticated -> alert requesting login.
  - authenticated -> POST /api/vacancies/[id]/save.
- Updates button visual state and alerts success/failure text.

Server save endpoint:
- POST /api/vacancies/[id]/save:
  - requires auth,
  - verifies vacancy existence,
  - loads users.saved_vacancies,
  - toggles vacancy id in array,
  - writes updated array,
  - returns action saved/unsaved and hasSaved boolean.
- GET /api/vacancies/[id]/save:
  - unauthenticated returns hasSaved=false and canSave=false,
  - authenticated checks users.saved_vacancies membership and returns hasSaved/canSave.

### Vacancy View Tracking Flow
Client:
- ViewTracker delays tracking by 1 second after mount.
- Uses endpoint /api/vacancies/[id]/view for vacancy item type.
- For guest users, checks sessionStorage key viewed_vacancy_<id> and sends isFirstView flag.
- If API responds with viewIncremented for guest, writes sessionStorage key to prevent duplicate guest increments in same session.
- If initialViews is 0, also performs GET to fetch current count.

Server tracking endpoint:
- POST /api/vacancies/[id]/view:
  - loads vacancy fields status/views/unique_views/viewed_by/engagement_score.
  - returns non-incremented response when status is not approved.
  - authenticated viewer:
    - increments total views on every request,
    - increments unique_views and appends viewed_by only if user not seen before.
  - guest viewer:
    - increments both total and unique only if isFirstView=true.
  - writes updated metrics and updated_at.
  - returns views, uniqueViews, likes=0, dislikes=0, engagementScore, isUniqueView, viewIncremented.
- GET /api/vacancies/[id]/view:
  - returns views/uniqueViews/engagementScore (+ likes/dislikes hardcoded as 0).

### Organization Dashboard Vacancy Management Flow
Route:
- /dashboard/vacancies renders VacanciesPageContainer.

Access gating:
- Dashboard layout blocks non-approved organization accounts with UnauthorizedState.

Container behavior:
- Initial fetch from /api/vacancies?author=me.
- Maintains local state for loading, fetchError, filters, delete modal, deleting, feedback alert.
- Computes filteredVacancies by text/status/category/compensation.
- Uses ui-state helpers resolveSectionState and renderSectionByState for loading, blocking error, non-blocking refresh error, empty, and content rendering.
- Delete flow:
  - open modal with selected vacancy,
  - confirm -> DELETE /api/vacancies/[id],
  - on success remove item from local array and show success alert.

List row behavior:
- Displays status icon/badge, location, duration, compensation, deadline, tags.
- Action buttons:
  - view public detail,
  - edit link to /dashboard/vacancies/[id]/edit,
  - delete action opening dialog.

## 4. Full Code Mapping

### Pages
- [app/resources/vacancies/page.tsx](app/resources/vacancies/page.tsx)
- [app/resources/vacancies/[id]/page.tsx](app/resources/vacancies/[id]/page.tsx)
- [app/dashboard/vacancies/page.tsx](app/dashboard/vacancies/page.tsx)
- [app/dashboard/vacancies/create/page.tsx](app/dashboard/vacancies/create/page.tsx)
- [app/admin/preview/vacancies/[id]/page.tsx](app/admin/preview/vacancies/[id]/page.tsx)
- Route target appears in UI but no page file present in current tree: /dashboard/vacancies/[id]/edit

Related navigation/shell pages:
- [app/dashboard/layout.tsx](app/dashboard/layout.tsx)
- [components/dashboard/DashboardShell.tsx](components/dashboard/DashboardShell.tsx)
- [app/admin/layout.tsx](app/admin/layout.tsx)
- [app/page.tsx](app/page.tsx)
- [app/resources/page.tsx](app/resources/page.tsx)

### Components
Vacancy-specific feature components:
- [features/vacancies/components/VacanciesPageContainer.tsx](features/vacancies/components/VacanciesPageContainer.tsx)
- [features/vacancies/components/VacanciesList.tsx](features/vacancies/components/VacanciesList.tsx)
- [features/vacancies/components/VacancyRow.tsx](features/vacancies/components/VacancyRow.tsx)
- [features/vacancies/components/VacancyDeleteDialog.tsx](features/vacancies/components/VacancyDeleteDialog.tsx)
- [features/vacancies/components/types.ts](features/vacancies/components/types.ts)

Cross-feature components used by vacancies:
- [components/SaveButton.tsx](components/SaveButton.tsx)
- [components/ViewTracker.tsx](components/ViewTracker.tsx)
- [components/dashboard/VacancyManagement.tsx](components/dashboard/VacancyManagement.tsx) (legacy-style component still present)

### API Routes
Vacancy APIs:
- [app/api/vacancies/route.ts](app/api/vacancies/route.ts)
  - GET list/filter/adminView/author=me
  - POST create
- [app/api/vacancies/[id]/route.ts](app/api/vacancies/[id]/route.ts)
  - GET single with visibility checks
  - PUT update
  - PATCH moderation approve/reject (admin)
  - DELETE remove
- [app/api/vacancies/[id]/save/route.ts](app/api/vacancies/[id]/save/route.ts)
  - POST toggle save
  - GET save status
- [app/api/vacancies/[id]/view/route.ts](app/api/vacancies/[id]/view/route.ts)
  - POST track view
  - GET read counters

Admin page consuming the same vacancy API:
- [app/admin/page.tsx](app/admin/page.tsx)

### Services / Utils
Auth/session utilities:
- [lib/auth/server.ts](lib/auth/server.ts)
- [lib/auth/client.ts](lib/auth/client.ts)

Supabase client layer:
- [lib/supabase/admin.ts](lib/supabase/admin.ts)

Notifications integration:
- [lib/services/notificationService.ts](lib/services/notificationService.ts)

SEO metadata helper:
- [lib/metadata/vacancies.ts](lib/metadata/vacancies.ts)
- [lib/seo.ts](lib/seo.ts)

Route localization utility used by vacancy pages/components:
- [lib/useLocalizedPath.ts](lib/useLocalizedPath.ts)

Data schema:
- [supabase/schema.sql](supabase/schema.sql)

## 5. Data Flow and State

API list query inputs:
- page, limit, type, location, search, createdBy, author=me, adminView, status, sortBy, sortOrder.

List response contract:
- vacancies array (mapped from DB snake_case to frontend camelCase shape).
- pagination object with currentPage, totalPages, totalVacancies, hasNext, hasPrev, pages.
- stats object (adminView only): pending/approved/rejected/total.

Vacancy DB shape (public.vacancies):
- Core: id/title/description/type/category/work_type/location.
- Requirements and skills arrays.
- Structured JSONB: duration, compensation, application_process.
- Lifecycle: status, approved_at/by, rejected_at/reason, admin_comment.
- Visibility flags: is_published/is_featured/is_urgent.
- Engagement: application_count/views/unique_views/viewed_by/engagement_score.
- Ownership: created_by user id or created_by_organization organization id.

Frontend state patterns:
- Public list page:
  - rawVacancies state from API,
  - derived mapped vacancies via useMemo,
  - filtering done client-side,
  - loading and errorKey state.
- Public detail page:
  - vacancy object state,
  - loading/error state,
  - computed deadline states.
- Dashboard container:
  - vacancies array, loading/fetchError,
  - filter states,
  - delete modal states,
  - feedback alert state.
- SaveButton:
  - hasSaved, isLoading, auth status state.
- ViewTracker:
  - views count, hasTracked boolean/ref to avoid duplicate tracking in same mount lifecycle.

Mutation points:
- Create: POST /api/vacancies.
- Update: PUT /api/vacancies/[id].
- Moderate: PATCH /api/vacancies/[id].
- Delete: DELETE /api/vacancies/[id].
- Save toggle: POST /api/vacancies/[id]/save updates users.saved_vacancies.
- View increment: POST /api/vacancies/[id]/view updates views/unique_views/viewed_by/engagement_score.

## 6. Interaction With Other Systems

Auth system interaction:
- Middleware enforces authentication for /dashboard and /admin path families.
- Dashboard layout checks accountType and organizationStatus from session.
- API routes use getServerSession for authentication and role/account checks.

Organization system interaction:
- Vacancy creation ownership for organizations uses created_by_organization.
- Dashboard vacancy access is scoped to approved organization account type.
- author=me query resolves to current session user id and fetches rows where creator matches user or organization id.

Dashboard system interaction:
- Dashboard shell includes dedicated navigation item for vacancies.
- Vacancy section container follows dashboard UI-state section pattern.
- DashboardDataProvider includes vacancies state fields but current vacancies page container performs its own fetch and local state management directly.

Admin/moderation interaction:
- Admin panel vacancies tab uses same /api/vacancies endpoint with adminView=true.
- Admin preview route fetches vacancy via general /api/vacancies/[id] and sends moderation PATCH to same endpoint.
- Admin modal in main admin page also moderates via /api/vacancies/[id].

Notification system interaction:
- Vacancy PATCH moderation route creates notification through NotificationService.createNotification.
- Notification target is organization_id when created_by_organization exists, else user_id.
- Notification type emitted:
  - vacancy_approved
  - vacancy_rejected
- Notification includes relatedId, relatedModel='Vacancy', vacancyTitle, action, optional rejectionReason.

Home/resources/sitemap interaction:
- Homepage fetches vacancies teaser cards from /api/vacancies?page=1&limit=6&status=approved.
- Resources hub links to vacancies section.
- next-sitemap config includes /resources/vacancies/<id> from vacancies rows.

## 7. Role Behavior

Guest (unauthenticated):
- Can read public approved/published vacancies list and details.
- Cannot save vacancies (SaveButton alerts login requirement).
- View tracking still works with guest first-view logic.

Authenticated regular user:
- Can read public listings/details.
- Can save/unsave vacancies through save API.
- Cannot create vacancies (POST /api/vacancies returns 403 unless admin or approved organization).
- Cannot access dashboard vacancies due to dashboard layout authorization.

Approved organization user:
- Can access dashboard vacancies pages.
- Can create vacancy entries via dashboard create form.
- Can list, filter, and delete own vacancies from dashboard.
- Can update own vacancy through PUT API.
- Non-admin owner edit resets status to pending and clears moderation fields.

Admin:
- Can access admin interfaces through admin layout role check.
- Can list all vacancies via adminView endpoint.
- Can approve/reject pending vacancies.
- Can delete vacancies.
- Can read non-approved/unpublished vacancy detail via GET /api/vacancies/[id].
- Can create vacancy through POST API (status immediately approved and published).

## 8. Edge Behaviors (Observed)

Loading states:
- Public list and detail pages render LoadingState while fetching.
- Dashboard vacancies container has initial loading skeleton/list state and refresh visibility notice via ui-state helper.
- SaveButton shows disabled loading variant while auth status is loading.

Empty states:
- Public list has dedicated empty result panel and clear-filters action when filters active.
- Dashboard vacancies list shows empty content both for no created vacancies and no filtered results.
- Admin vacancies tab shows no-results panel when list is empty.

Error handling:
- Public listing shows visible red error banner when API fetch fails.
- Public detail shows ErrorState with retry navigation.
- Dashboard container shows blocking/non-blocking section error with retry callback.
- Legacy VacancyManagement component logs errors to console only for some failures.
- SaveButton uses browser alert for save errors.

Validation edge behavior:
- API enforces description and instruction minimum lengths irrespective of client form checks.
- API enforces future deadline only when body.deadline key is used; create form sends applicationDeadline.
- Rejection in PATCH requires rejectionReason at API level.

Moderation payload mismatch behavior:
- Admin main page executeVacancyAction sends adminComment for reject action body.
- Vacancy PATCH API expects rejectionReason, not adminComment.
- Admin preview page sends rejectionReason and matches API contract.

Visibility/access edge behavior:
- Single vacancy GET blocks non-owner non-admin access for non-approved or unpublished vacancies.
- Public list API defaults to approved + published unless creator-scoped query.
- Dashboard layout renders UnauthorizedState for non-approved organizations instead of redirect.

Route existence behavior:
- Dashboard vacancy rows link to /dashboard/vacancies/[id]/edit.
- No existing page route file for this path in current app/dashboard tree.

## 9. Notes for AI Understanding

Patterns used in vacancies implementation:
- Supabase row-to-DTO mapping function mapVacancy to normalize snake_case DB fields into camelCase API payload.
- Shared route design pattern with events:
  - list route with author=me and adminView,
  - id route for read/update/moderation/delete,
  - nested save and view routes.
- Save and view behavior is implemented as item-specific nested endpoints consumed by shared generic UI components SaveButton and ViewTracker.
- Moderation states are represented directly on content row using status plus approval/rejection metadata fields.

Similarity with events system (current code):
- Very similar API structure and ownership model (created_by + created_by_organization).
- Similar adminView list behavior and status stats aggregation.
- Similar save endpoint shape and view-tracking endpoint shape.
- Similar restriction logic for unpublished/non-approved single-item GET.

Difference from events system (current code):
- Events include additional endpoints (for example event images routes) not present in vacancies API tree.
- Events route appears to support admin moderation action handling inside update route semantics; vacancies uses explicit PATCH moderation handler.

Difference from blogs system (current code):
- Blogs use different ownership model (author_id) and separate admin blog endpoints.
- Blog interactions include like/dislike endpoints and related notifications, while vacancies use save and view only (no vacancy like/dislike endpoints in current routes).
- Blog listing/detail API shape and moderation pathing differ from vacancy pathing.

Additional implementation notes:
- Vacancy metadata helper exists in [lib/metadata/vacancies.ts](lib/metadata/vacancies.ts) and builds JobPosting schema input, but vacancies pages themselves are client components and this helper is not directly referenced by the two vacancy page files in current app tree.
- Legacy dashboard vacancy component [components/dashboard/VacancyManagement.tsx](components/dashboard/VacancyManagement.tsx) coexists with feature-based container [features/vacancies/components/VacanciesPageContainer.tsx](features/vacancies/components/VacanciesPageContainer.tsx); current route [app/dashboard/vacancies/page.tsx](app/dashboard/vacancies/page.tsx) uses the feature-based container.

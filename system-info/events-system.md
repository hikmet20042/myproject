# Events System - Deep Current State

## 1. Feature Summary
The Events System is a moderated event publishing workflow with three primary surfaces:
- Public discovery and detail pages under resources.
- Organization dashboard CRUD for organization-owned events.
- Admin moderation and preview tooling for pending/rejected/approved event submissions.

At runtime, the system stores event records in Supabase table public.events and exposes event data through Next.js app router API routes. Event records support:
- Core event fields: title, description, category, event type, event dates.
- Location model: online, physical, hybrid with location metadata.
- Registration model: application link and application deadline.
- Capacity model: max participants and current participants.
- Moderation state: pending, approved, rejected plus admin metadata.
- Publishing state: is_published and is_featured.
- Analytics state: views, unique_views, viewed_by, engagement_score.
- Media state: single primary image_url and image collection in images JSON.
- Training-specific extensions: duration, schedule, prerequisites, learning outcomes, certification, cost, target audience, syllabus.

Public pages consume approved/published events, while owner/admin access can retrieve non-public events through owner/admin permission checks in the event detail API.

## 2. All User Capabilities

### Public and authenticated end users
- Browse events list at /resources/events.
- Search events by text (title, organization, description) on the client side.
- Filter events by:
  - category
  - event type
  - location
  - month
- Open event detail page at /resources/events/[id].
- View event metadata (title, description, organizer, date/time, location, tags, participant counts, deadline state).
- Open external application link when available and deadline is not passed.
- Save or unsave event via save toggle (requires authenticated user account).
- Trigger and display view counter (ViewTracker) for events.

### Organization users (approved organizations only)
- Access organization dashboard events section at /dashboard/events.
- View own created events list with local filters (search, status, category).
- Open create form at /dashboard/events/create.
- Submit new event to moderation (new events are created with pending status).
- Provide training-specific extended fields when event type is training/workshop/seminar.
- Open edit form at /dashboard/events/[id]/edit.
- Update own event fields.
- Delete own events.
- Open detail view at /dashboard/events/[id] with status and moderation metadata.
- See rejection reason if previously rejected.
- For approved events, edits trigger status reset to pending and unpublish for re-review.
- Manage event images via event image API (upload, delete, set primary) when owner.

### Admin users
- Open admin events tab at /admin?tab=events.
- List all events with status/search pagination controls from admin endpoint.
- View counts for pending, approved, rejected, total.
- Open event preview at /admin/preview/events/[id].
- Approve pending events.
- Reject pending events with admin comment in preview/modal flows.
- Delete non-pending events from admin list (uses generic delete event API with admin permission).
- Load event details by id from admin-specific endpoint.

### System/automation capabilities
- Daily cron endpoint at /api/cron/event-deadlines to process saved-event deadline notifications.
- Manual trigger via GET on the same cron endpoint (no explicit admin auth check in that route).
- Notification generation for event approve/reject and event deadline reminders.

## 3. Detailed User Flows

### Event Creation Flow
1. Approved organization user navigates to /dashboard/events/create.
2. Client form initializes with base fields and optional training field groups.
3. User submits form.
4. Client transforms fields before API call:
   - maxParticipants string to integer.
   - comma-separated tags to array.
   - date/time fields to ISO strings.
5. Client sends POST /api/events with JSON payload (or multipart form-data if images are included).
6. API enforces authentication and organization eligibility:
   - session required.
   - accountType must be organization.
   - organizationStatus must be approved.
7. API validates required fields and constraints:
   - required: title, description, category, eventDate, location, eventType.
   - description minimum length 50 after HTML strip.
   - eventType in allowed set.
   - location.type in online/physical/hybrid.
   - training-specific duration/cost shape checks when eventType is training.
8. API fetches organization name from organization_profiles by account_id.
9. API inserts event with:
   - created_by null.
   - created_by_organization set to session user id.
   - status pending.
   - is_published false.
   - current_participants 0.
10. If multipart files were provided:
   - each image validated with Cloudinary file validation.
   - uploaded with event-specific Cloudinary naming.
   - event images array and primary image_url updated.
11. API responds with success message that event is awaiting admin approval.
12. Client marks dashboard events data dirty and redirects to /dashboard/events.

### Event Editing Flow
1. Organization owner opens /dashboard/events/[id]/edit.
2. Page fetches GET /api/events/[id].
3. API allows fetch if:
   - event is approved/published, or
   - session user is owner, or
   - session user is admin.
4. Edit form hydrates from event fields.
5. User submits PUT /api/events/[id].
6. API checks authentication and ownership/admin authorization.
7. API validates description min length when provided.
8. API maps camelCase request fields to DB snake_case columns.
9. If event previously had status approved and updater is owner:
   - status changed to pending.
   - approved_at and approved_by cleared.
   - is_published set false.
10. API updates updated_at and returns updated event.
11. Client marks events dirty and navigates back to /dashboard/events.

### Event Viewing Flow
1. User opens /resources/events.
2. Page requests GET /api/events?status=approved&limit=50.
3. API (non-admin flow) applies status/publishing visibility for public listing.
4. Client renders cards and applies client-side filter/search logic.
5. User opens /resources/events/[id].
6. Detail page fetches GET /api/events/[id].
7. API returns approved/published event publicly.
8. If event is non-public, API permits only owner/admin.
9. Detail page renders event content, organizer, tags, dates, location, participant metrics, application deadline state, and save/view controls.

### Event Save / Bookmark Flow
1. SaveButton mounted with itemType event checks session.
2. If session exists, SaveButton calls GET /api/events/[id]/save for hasSaved state.
3. On click:
   - if no session, UI shows login-required alert.
   - if session exists, POST /api/events/[id]/save.
4. API verifies authenticated session and event existence.
5. API reads users.saved_events array.
6. API toggles current event id in saved_events.
7. API returns action saved or unsaved and new hasSaved state.
8. SaveButton updates state and shows alert message.

### Event View Tracking Flow
1. ViewTracker mounts on event detail.
2. Waits ~1 second before POST tracking.
3. Endpoint used: POST /api/events/[id]/view with optional isFirstView.
4. For authenticated viewer:
   - if first unique viewer, adds user id to viewed_by and increments unique_views.
   - increments total views every tracked request.
5. For anonymous viewer:
   - client sessionStorage key viewed_event_[id] used to avoid duplicate increments in same session.
   - increments views and unique views only when isFirstView true.
6. API recomputes event engagement_score from views only (in this route).
7. ViewTracker updates displayed count from response.
8. Separate GET /api/events/[id]/view can fetch current counters.

### Organization Dashboard Event Management Flow
1. Dashboard layout gates access to approved organization accounts only.
2. /dashboard/events renders EventsPageContainer (feature-based implementation).
3. EventsPageContainer pulls events from DashboardDataProvider context.
4. DashboardDataProvider fetches /api/events?author=me when organization is approved.
5. Context caches events, loading, error, dirty flags, last fetched timestamp.
6. UI supports local search/status/category filtering.
7. Delete action opens modal and calls DELETE /api/events/[id].
8. On success, item removed from in-memory context.
9. Create and edit pages call markEventsDirty to force refresh after navigation.

### Admin Event Moderation Flow
1. Admin opens /admin?tab=events.
2. Admin page loadSubmissions routes to loadEvents when activeTab is events.
3. loadEvents calls GET /api/admin/events with page, limit, optional search/status/sort.
4. Admin UI shows status counters and list.
5. Pending records display Approve and Reject actions.
6. Approve/Reject action opens modal and calls PATCH /api/admin/events/[id] with action and optional adminComment.
7. PATCH endpoint updates status transitions and publishes/unpublishes accordingly.
8. Endpoint emits event status notification to creator through NotificationService.
9. Admin may open preview in /admin/preview/events/[id] for full content review and action.
10. Non-pending events can be deleted via DELETE /api/events/[id] (admin allowed by shared permission check).

## 4. Full Code Mapping

### Pages
- /resources/events
  - app/resources/events/page.tsx
- /resources/events/[id]
  - app/resources/events/[id]/page.tsx
- /dashboard/events
  - app/dashboard/events/page.tsx
- /dashboard/events/create
  - app/dashboard/events/create/page.tsx
- /dashboard/events/[id]
  - app/dashboard/events/[id]/page.tsx
- /dashboard/events/[id]/edit
  - app/dashboard/events/[id]/edit/page.tsx
- /admin?tab=events
  - app/admin/page.tsx (events tab section)
- /admin/preview/events/[id]
  - app/admin/preview/events/[id]/page.tsx

### Components
Core events feature components:
- features/events/components/EventsPageContainer.tsx
- features/events/components/EventsList.tsx
- features/events/components/EventRow.tsx
- features/events/components/EventDeleteDialog.tsx
- features/events/components/types.ts

Dashboard and shell components related to event management:
- components/dashboard/DashboardShell.tsx
- features/dashboard/context/DashboardDataProvider.tsx
- components/dashboard/EventManagement.tsx (parallel/legacy event management implementation present in codebase)

Shared cross-content components used directly by event pages:
- components/SaveButton.tsx
- components/ViewTracker.tsx
- components/shared state components (LoadingState, ErrorState, UnauthorizedState, ResourceFilterContainer, ActiveFilterBadges)

Navigation/discoverability:
- components/Header.tsx (Resources dropdown includes events link)

### API Routes
Public/owner event APIs:
- app/api/events/route.ts
  - GET list with filters, adminView support, author=me support.
  - POST create event.
- app/api/events/[id]/route.ts
  - GET detail with owner/admin visibility rules for non-public records.
  - PUT update (owner/admin).
  - DELETE delete (owner/admin).
- app/api/events/[id]/view/route.ts
  - POST increment and return view analytics.
  - GET return current view analytics.
- app/api/events/[id]/save/route.ts
  - POST toggle save/unsave for authenticated user.
  - GET current save status.
- app/api/events/[id]/images/route.ts
  - POST upload additional images.
  - DELETE remove image set by public ids.
  - PATCH update image metadata (including primary flag).

Admin-specific event APIs:
- app/api/admin/events/route.ts
  - GET paginated admin event list + stats.
  - PUT event status update by id with approved/rejected input.
- app/api/admin/events/[id]/route.ts
  - GET admin event detail.
  - PATCH approve/reject with notification dispatch.

Scheduled process:
- app/api/cron/event-deadlines/route.ts
  - POST cron-authorized reminder trigger.
  - GET manual trigger.

### Services / Utils / Supporting Files
Data/service utilities:
- lib/services/notificationService.ts
  - notifyEventStatus
  - checkEventDeadlinesAndNotify
- lib/services/cloudinaryService.ts
  - uploadEventImage
  - validateImageFile
  - deleteImages
- lib/supabase/admin.ts (used by all event route handlers)
- lib/auth/server.ts and lib/auth/client.ts for session checks
- lib/roles.ts and isAdminSession helper in admin list route
- lib/useLocalizedPath.ts for localized routing in pages/components

Metadata/SEO and discoverability:
- lib/metadata/events.ts (event metadata generator function exists)
- next-sitemap.config.js (approved event ids included in dynamic sitemap paths)
- vercel.json (daily cron schedule for event deadlines)

Persistence schema:
- supabase/schema.sql
  - public.events table fields and constraints
  - public.users.saved_events array
  - events RLS policy rules

## 5. Data Flow and State

### Data fetched
Event list (public):
- GET /api/events with status/category/location/month/search/eventType/sort query support.
- Public flow defaults to approved and published visibility when not adminView.

Event list (owner dashboard):
- GET /api/events?author=me
- API resolves author=me to current session user id.
- Query returns events where created_by equals user or created_by_organization equals user.

Event list (admin):
- GET /api/admin/events with pagination/search/status/category/eventType/location/date/sort controls.
- Response includes stats summary and pagination metadata.

Event detail:
- GET /api/events/[id] for public/owner/admin detail view.

Analytics and save state:
- GET and POST /api/events/[id]/view.
- GET and POST /api/events/[id]/save.

### Mutations
- Create: POST /api/events
- Update: PUT /api/events/[id]
- Delete: DELETE /api/events/[id]
- Admin moderate: PATCH /api/admin/events/[id] and PUT /api/admin/events
- Save toggle: POST /api/events/[id]/save
- View increment: POST /api/events/[id]/view
- Image management: POST/DELETE/PATCH /api/events/[id]/images

### In-app state handling
Public events list page:
- Local state for events array, loading, error, and all filter controls.
- Filtering is client-side after one list fetch.

Public event detail page:
- Local event, loading, error state.
- Integrates SaveButton and ViewTracker for side effects.

Dashboard events page:
- Uses DashboardDataProvider context state:
  - events
  - eventsLoading
  - eventsError
  - eventsLastFetchedAt
  - eventsDirty
- ensureFreshEvents(maxAge) and refreshEvents logic controls re-fetching.
- removeEventById mutates context list after delete success.

Save/view side-effect components:
- SaveButton maintains hasSaved and loading state per item.
- ViewTracker maintains views and hasTracked flags with guest sessionStorage dedupe key.

### Data model transformation
API handlers consistently map DB snake_case fields to response camelCase via mapEvent helper in multiple route files. Key transformations include:
- event_type -> eventType
- event_date -> eventDate
- end_date -> endDate
- learning_outcomes -> learningOutcomes
- target_audience -> targetAudience
- application_link -> applicationLink
- application_deadline -> applicationDeadline
- max_participants -> maxParticipants
- image_url -> imageUrl
- created_by and created_by_organization relation objects mapped to createdBy and createdByOrganization objects

## 6. Interaction With Other Systems

### Auth system
- Server session required for all write actions.
- Event creation explicitly restricted to session users whose accountType is organization and organizationStatus is approved.
- Owner/admin checks in event update/delete APIs compare session user id against created_by or created_by_organization.
- Public detail access for non-public events blocked unless owner or admin.

### Organization system
- Event creator identity for organization submissions is stored in created_by_organization.
- Organization display name for new event is read from organization_profiles.organization_name during creation.
- Dashboard access itself is protected at layout level for approved organizations only.
- Dashboard provider event fetching only runs for approved organizations.

### Dashboard system
- Event dashboard tab registered in DashboardShell navigation.
- Event list UI is currently implemented in feature module EventsPageContainer, backed by DashboardDataProvider.
- Separate component components/dashboard/EventManagement.tsx still exists with similar functionality and direct fetch logic.

### Notifications system
- Admin approve/reject in /api/admin/events/[id] calls NotificationService.notifyEventStatus.
- NotificationService creates notification records and emits real-time updates via socket and SSE helper calls.
- Daily event deadline reminder workflow checks users.saved_events and creates event_deadline notifications when application_deadline is within next 7 days.
- Notification list rendering maps event_deadline type label and color semantics in notification UI component.

### SEO/sitemap system
- next-sitemap dynamic fetch includes approved event ids and publishes /resources/events/[id] URLs.
- Events listing page is present in sitemap static paths.

### Scheduling/deployment
- vercel.json defines cron schedule for /api/cron/event-deadlines at 0 9 * * *.
- Cron POST endpoint validates bearer token against CRON_SECRET.

## 7. Role Behavior

### Anonymous user
- Can access /resources/events list.
- Can access approved/published event detail pages.
- Can trigger guest view tracking (sessionStorage-assisted first-view logic).
- Cannot save events (SaveButton disables and prompts login).

### Authenticated regular user
- Same browse/detail capabilities as anonymous.
- Can save and unsave events to users.saved_events.
- Can receive event deadline notifications for saved events.
- Cannot create/edit/delete events unless also owner/admin.

### Organization user (approved)
- Can access dashboard routes.
- Can create events.
- Can view own events in dashboard list.
- Can view details of own pending/rejected/unpublished events.
- Can edit own events.
- Can delete own events.
- Can upload/delete/update images for own events via images endpoint.
- Submitted events enter moderation pipeline before publication.

### Organization user (not approved)
- Blocked from dashboard layout for organization dashboard sections.
- Blocked from event create and image-management APIs by organization eligibility checks.

### Admin user
- Can list all events via /api/admin/events.
- Can approve/reject via admin APIs.
- Can fetch admin event details.
- Can access non-public event detail data through /api/events/[id] owner/admin exception path.
- Can delete any event through shared delete API (admin branch).

## 8. Edge Behaviors (Observed)

Loading states:
- Public list and detail pages use LoadingState wrappers.
- Dashboard list has initial loading, non-blocking error, and refresh notice states through UI-state utilities.
- SaveButton has auth-loading skeleton-like disabled state.

Empty states:
- Public list shows empty-state card when no filtered results.
- Dashboard list shows no-events and no-filter-match states.
- Admin events tab shows no-submissions state when list empty.

Error behaviors:
- Public detail shows ErrorState if event not found/unauthorized/fetch failure.
- Public list shows retry button when fetch fails.
- Dashboard list shows inline errors with retry action.
- CRUD forms use alert() for many mutation failures.

Visibility and access behavior:
- Non-approved or unpublished events are not publicly accessible in detail endpoint.
- Owner/admin exception allows access to those hidden records.
- Public list API path defaults to approved + is_published for non-admin views.

Moderation transition behavior:
- Owner edit on previously approved event automatically demotes status to pending and unpublishes.
- Admin reject in /api/admin/events/[id] requires non-empty adminComment.
- Admin reject in /api/admin/events (PUT) allows fallback rejection reason text.

Save behavior:
- Save API toggles membership in users.saved_events.
- SaveButton performs per-item GET status request after mount for authenticated sessions.

View tracking behavior:
- Endpoint computes unique view by viewed_by membership for authenticated users.
- Guest uniqueness delegated to client-side sessionStorage plus isFirstView body flag.
- Event view endpoint currently returns likes/dislikes fields as 0 placeholders.

Date/deadline behavior in UI:
- Public cards mark deadlines as near or passed and style them differently.
- Detail page hides application CTA when deadline has passed.

Image behavior:
- Image upload validates mime and size (default max 10MB).
- First uploaded image becomes primary if no prior image_url.
- Deleting primary image reassigns primary flag to first remaining image.

Admin surface behavior:
- Admin list has pending-only action buttons for approve/reject.
- Non-pending entries expose delete action.
- Preview page allows approve/reject from pending state with dedicated reject modal.

Parallel implementations observed:
- Feature-based dashboard events UI exists and is used by /dashboard/events route.
- Legacy EventManagement component with overlapping behavior also exists in codebase.

## 9. Notes for AI Understanding

### Patterns used
- Route-level permission checks and status gating are centralized in API handlers, not only UI.
- Event response shape is repeatedly normalized by mapEvent helpers across endpoints.
- UI forms are client-side and submit through fetch with manual field normalization.
- Moderation lifecycle is status-driven: pending -> approved/rejected; approved owner edits re-enter pending.
- Dashboard event data uses provider-based cached state with stale/dirty refresh controls.
- Cross-content generic UI primitives are reused heavily (loading/error/cards/buttons/modals).

### Similarities with blog system
- Both systems use moderated status model (pending/approved/rejected).
- Both have dedicated view tracking endpoints with similar unique-view logic and engagement recomputation.
- Both have admin moderation actions and admin list surfaces.
- Both persist analytics counters in table columns and return them from dedicated endpoints.
- Both use notification pathways for moderation outcomes.

### Differences from blog system
- Events are organization-centered for creation (approved organization gating), while blogs are user submission oriented.
- Events include operational fields (location, dates, capacity, application link/deadline, training extensions) not present in blog content model.
- Events support save/unsave bookmarking through users.saved_events and deadline reminder cron integration.
- Events currently do not expose like/dislike endpoints, while blogs have full like/dislike mutation endpoints.
- Events include dedicated image collection management endpoint for existing records, including primary image control.
- Dashboard events rely on organization dashboard context and organization-only access constraints.

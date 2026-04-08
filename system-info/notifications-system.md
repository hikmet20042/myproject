# Notifications & Communication System — Deep Current State

## 1. Feature Summary

The current notifications and communication implementation is a mixed system centered on a single database table (public.notifications), with multiple producers and multiple UI consumers.

At runtime, the platform currently does all of the following:

- Stores user-targeted and organization-targeted notifications in public.notifications.
- Supports admin announcement broadcasting by writing many notification rows at once.
- Exposes authenticated notification APIs for list, update (single and bulk-read), delete, and single-item patch by id.
- Uses a global client NotificationContext provider for header bell and dashboard notifications pages.
- Uses a separate profile-page-local notifications state path (not fully unified with NotificationContext).
- Includes real-time transport infrastructure via:
  - Server-Sent Events endpoint (app/api/notifications/stream/route.ts)
  - In-memory SSE connection manager (lib/sse.ts)
  - Socket.IO server init endpoint (pages/api/socket.ts)
  - Socket emission helpers (lib/socket.ts)
- Triggers notifications from moderation and content interaction flows (admin blog/event/vacancy moderation, organization moderation, blog like/dislike, auth registration/verification, admin user role update, cron deadline check).
- Requests browser notification permission in the SSE provider and can show native browser notifications when SSE messages of type notification are received.

System topology in current code:

- Persistence: Supabase notifications table.
- Producer layer:
  - Direct DB inserts in many API routes.
  - NotificationService wrappers in selected routes.
- Delivery layer:
  - Polling/fetch-based UI refresh through /api/notifications and /api/admin/notifications.
  - SSE connection per authenticated user id.
  - Socket.IO room-based emission helper.
- Consumer layer:
  - Header bell dropdown (global).
  - Dashboard notifications page (/dashboard/notifications).
  - Profile notifications tab (/profile?tab=notifications).
  - Admin notifications tab (/admin, notifications section).

## 2. All User Capabilities

Current capabilities by interface and role:

General authenticated user (non-admin)

- Can receive notifications addressed to user_id in notifications table.
- Can open header notification bell from main header.
- Can view unread badge count in header bell.
- Can view recent notifications (up to 10 in bell dropdown).
- Can click a notification to navigate to actionUrl (internal uses router.push, external uses window.location.href).
- Can mark an item read/unread from bell list item action.
- Can delete a single notification from bell list item action.
- Can mark all notifications as read from bell header action.
- Can access profile notifications tab UI and modal controls (separate state path).
- Can access /api/notifications GET/PUT/DELETE while authenticated.
- Can access /api/notifications/[id] PATCH while authenticated.

Approved organization account

- Can access dashboard notifications page (/dashboard/notifications) because dashboard layout requires accountType=organization and organizationStatus=approved.
- Can view notifications through NotificationContext-backed dashboard list, grouped by date and filtered by read-state and date window.
- Can mark single notification read/unread and mark all as read from dashboard page.
- Can open notification modal in dashboard and mark read/unread from modal.
- Notification ownership resolution in APIs uses organization_id for approved organizations.

Admin user

- Can access /api/admin/notifications GET/POST/PUT/DELETE.
- Can load paginated admin notifications tab list (default filtered to type=announcement unless type query is provided).
- Can view admin announcement stats: total, unread, read, today.
- Can create announcement notifications targeting:
  - all users
  - verified users
  - explicit list of user ids
- Can edit existing announcement notification title/message.
- Can delete single notification.
- Can bulk-delete notifications using deleteAll=true and optional userId/type filters.
- Can mark all notifications read with optional userId/type filters.
- Can mark single notification read/unread.
- Can moderate blogs/events/vacancies/organizations/users and trigger notifications as side effects in those APIs.

Real-time receiving capability

- SSE provider establishes EventSource to /api/notifications/stream for authenticated sessions.
- SSE keepalive and reconnect logic exists.
- SSE provider records lastNotification in context and can show native browser notification pop-up if permission granted.
- NotificationBell uses SSE connection state only to decide fallback polling behavior.
- Socket.IO client connection is initialized in SocketProvider and joins user-specific room.

## 3. Detailed Flows

### Notification Creation Flow

Current creation entrypoints are distributed across multiple API routes and NotificationService methods.

A) Auth registration flow (app/api/auth/register/route.ts)

- On successful account creation:
  - Non-organization account:
    - Inserts welcome notification directly into notifications table:
      - user_id = new user id
      - type = welcome
      - title/message = onboarding copy
      - data includes userType
  - Organization account:
    - Does not create the same welcome notification for the organization account path.
    - Queries all admin accounts (accounts.is_admin=true).
    - Inserts admin_action_required notification for each admin to review new organization registration.

B) Email verification flow (app/api/auth/verify-email/route.ts)

- After successful verifyOtp:
  - Resolves account type from accounts table.
  - If account type is not organization:
    - Calls NotificationService.createNotification with type=email_verification.
  - For organization accounts:
    - Returns response message but does not create this email_verification notification in this route.

C) Blog moderation flow 1 (app/api/admin/blogs/[id]/route.ts)

- Admin PUT status update for specific blog:
  - After blog update, calls NotificationService.notifyBlogStatus(author, blogId, title, status, adminComment).
  - Service writes notifications table row (type blog_approved or blog_rejected), then attempts realtime emit.

D) Blog moderation flow 2 (app/api/admin/blogs/route.ts)

- Admin PUT and PATCH bulk endpoints also create blog notifications directly using supabase.from('notifications').insert.
- Types differ from NotificationService route:
  - type blog
  - type blog_status
- Message and title strings differ from NotificationService strings.

E) Blog engagement flow (app/api/blogs/[id]/like/route.ts and dislike/route.ts)

- On like action (excluding self-like): inserts notification:
  - type blog_like
  - action_url /blogs/{blogId}
  - data includes actor id and blog info
- On dislike action (excluding self-dislike): inserts notification:
  - type blog_dislike
  - action_url /blogs/{blogId}
  - data includes actor id and blog info

F) Event moderation flow (app/api/admin/events/[id]/route.ts)

- Admin PATCH approve/reject updates event.
- Resolves event creator (user or organization relation object).
- Calls NotificationService.notifyEventStatus with action approve/reject.
- Service writes notification row (event_approved/event_rejected) addressed by userId parameter passed.

G) Vacancy moderation flow (app/api/vacancies/[id]/route.ts PATCH)

- Admin PATCH approve/reject vacancy.
- Builds notification target:
  - organizationId when created_by_organization exists
  - else userId when created_by exists
- Calls NotificationService.createNotification with vacancy_approved or vacancy_rejected.

H) Organization moderation flow (app/api/admin/organizations/route.ts PUT/PATCH)

- Approve/reject inserts notification directly (not NotificationService):
  - organization_id target
  - type organization_approved or organization_rejected
  - data includes action and organizationName, plus rejectionReason on reject
- Bulk PATCH loops through organizations and inserts one per org.

I) Admin account update flow (app/api/admin/users/route.ts PUT)

- On updateRole action only:
  - Inserts user notification type admin with title Account Update.

J) Admin announcement broadcasting (app/api/admin/notifications/route.ts POST)

- Admin submits type/title/message + targetUsers.
- Resolves recipient list:
  - all: all ids from users table
  - verified: from auth.admin.listUsers where email_confirmed_at exists
  - array: provided specific ids
- Inserts one notification row per recipient with is_read false.

K) Event deadline cron flow (app/api/cron/event-deadlines/route.ts + NotificationService.checkEventDeadlinesAndNotify)

- Cron POST with CRON_SECRET bearer token triggers service.
- Service scans users.saved_events and approved events with application_deadline in next 7 days.
- Prevents duplicate recent notifications per event by checking notifications of type event_deadline in last 24h and reading data.eventId.
- Creates event_deadline notifications for non-notified events.

L) NotificationService generic create path (lib/services/notificationService.ts)

- Enforces either userId or organizationId.
- Inserts notifications row with is_read false.
- If userId is present:
  - emits socket event notification via emitNotificationToUser
  - attempts SSE sendNotificationToUser
- If organizationId-only is used:
  - row is inserted, no socket/SSE call in this method because emit section checks userId.

### Notification Fetch Flow

Primary user fetch flow (NotificationContext)

- NotificationProvider mounted globally in app/layout.tsx.
- On mount and on session changes:
  - calls refreshNotifications({ force: true }).
- refreshNotifications:
  - if no session user id: clears list and unread count.
  - fetches GET /api/notifications.
  - maps snake_case to camel-like fields:
    - id/_id from id
    - action_url or actionUrl => actionUrl
    - is_read/isRead => isRead
    - created_at/createdAt => createdAt
  - unreadCount uses API unreadCount or local derived fallback.

API fetch behavior (app/api/notifications/route.ts GET)

- Requires authenticated session.
- Builds ownership filter:
  - approved organization account => organization_id=session.user.id
  - else => user_id=session.user.id
- Optional unreadOnly query via unread=true.
- Returns notifications sorted by created_at desc and unreadCount from count query.

Dashboard fetch flow (/dashboard/notifications)

- Page uses NotificationContext data.
- On mount calls ensureFreshNotifications(45000).
- Filtering and grouping are client-side on context notifications.

Header bell fetch flow

- Bell uses NotificationContext values.
- On dropdown open, calls ensureFreshNotifications(45000).
- If SSE connection state is false, starts 30-second polling fallback calling refreshNotifications.

Profile fetch flow (/profile notifications tab path)

- Profile page defines its own local notifications state and loadNotifications() fetching GET /api/notifications.
- Separate from NotificationContext list.
- Uses raw response data.notifications directly in local state.

Admin fetch flow (/admin notifications tab)

- Admin page loadNotifications() calls GET /api/admin/notifications with page/filter params.
- API defaults to type=announcement if type query missing.
- Returns notifications + pagination + stats block.

### Notification Read/Unread Flow

User-level API path (app/api/notifications/route.ts PUT)

- markAllAsRead=true:
  - updates all unread notifications for owner column (user_id or organization_id).
- single update:
  - requires notificationId and boolean isRead.
  - updates matching id with owner filter.
  - returns updated row.

Single-item PATCH path (app/api/notifications/[id]/route.ts)

- Requires boolean isRead in body.
- Uses route param id and owner filter.
- Updates one row and returns updated notification.

Client usage patterns

- NotificationContext.toggleNotificationRead:
  - calls PUT /api/notifications with notificationId + isRead.
  - then force refreshes list.
- NotificationContext.markAllAsRead:
  - calls PUT /api/notifications markAllAsRead true.
  - then force refreshes list.
- NotificationBell:
  - item-level toggle via context method.
  - mark-all via context method.
  - single delete via DELETE /api/notifications?id=...
- Dashboard notifications page:
  - uses context toggle/mark-all methods and local action loading/error UI state.
- Profile notifications tab:
  - uses local toggleNotificationRead and markAllAsRead wrappers calling PUT /api/notifications then reloading local list and forcing global refreshNotifications.

Admin read/unread path (app/api/admin/notifications/route.ts PUT)

- markAllAsRead=true:
  - marks all unread notifications as read with optional userId/type filters.
- single notification update:
  - notificationId + isRead updates that row.
- editAnnouncement=true:
  - updates title/message/updated_at for specific notification.

### Admin Announcement Flow

Creation

- Admin UI sendAnnouncement builds payload from announcementForm.
- targetUsers is transformed:
  - all or verified string, or parsed specific list from comma-separated ids.
- POST /api/admin/notifications inserts a notification row for each resolved user id.
- Response includes count of recipients.

Listing and stats

- Admin UI loadNotifications fetches paginated announcement rows and stats.
- API query:
  - select includes user_id relation fields (id, name, email), id, type, title, message, data, action_url, is_read, created_at.
  - default type filter announcement.
- Stats computed through four separate count queries for type=announcement.

Editing

- Admin UI sets editingAnnouncementId and pre-fills form from selected row.
- PUT /api/admin/notifications with editAnnouncement true updates title/message.

Deletion

- Single deletion from admin UI:
  - DELETE /api/admin/notifications?id=...
- Bulk deletion available at API level with deleteAll=true and optional filters.

### Real-Time / Live Update Flow (if exists)

SSE transport

- Client:
  - SSENotificationProvider opens EventSource('/api/notifications/stream') after 1-second delay and authenticated session requirement.
  - onopen sets isConnected true.
  - onmessage parses JSON:
    - type connected: logs user id
    - type notification: sets lastNotification, optionally shows browser notification
  - onerror closes source, sets disconnected, retries after 5 seconds.
- Server:
  - /api/notifications/stream requires session user id.
  - adds connection in in-memory map by userId.
  - writes initial connected event.
  - emits keepalive comments every 30 seconds.
  - cleans up on abort/cancel.
- Delivery:
  - NotificationService.createNotification tries sendSSENotification only when userId exists.
  - sendNotificationToUser wraps payload as { type: notification, notification }.

Socket.IO transport

- Client SocketProvider:
  - fetches /api/socket to initialize server endpoint.
  - creates socket.io-client connection to /api/socket/io.
  - joins room user:{session.user.id} on connect.
  - leaves room and disconnects on cleanup.
- Server pages/api/socket.ts:
  - initializes SocketIOServer once per process.
  - supports join/leave events for room membership.
- NotificationService create flow:
  - emitNotificationToUser(userId, notification) sends notification event to room user:{id} if io instance exists.

Polling fallback

- NotificationBell starts 30-second polling refresh when:
  - enabled delay passed
  - session user exists
  - SSE connection is not connected

## 4. Full Code Mapping

### Components

- app/layout.tsx
  - Wraps entire app in SocketProvider -> SSENotificationProvider -> NotificationProvider.
- components/Header.tsx
  - Renders NotificationBell in desktop and mobile authenticated header views.
  - Mobile profile menu shows unread badge from NotificationContext unreadCount.
- components/NotificationContext.tsx
  - Global notification state and API integration.
- components/NotificationBell.tsx
  - Dropdown UI, unread badge, mark all, toggle read, delete, click-through navigation.
  - Polling fallback and visual animation states.
- components/NotificationModal.tsx
  - Modal detail view with mark read/unread actions.
- components/notifications/NotificationListItem.tsx
  - Reusable notification row for bell and dashboard list.
  - Includes type labels/colors and relative time text.
- components/SSENotificationProvider.tsx
  - EventSource lifecycle + browser notification integration.
- components/SocketProvider.tsx
  - Socket.IO client lifecycle.
- features/dashboard/components/DashboardNotificationsPageContainer.tsx
  - Organization dashboard notifications UI and filters.
- components/Profile/Notifications.tsx
  - Profile tab notification list and modal integration.
- components/Profile/TabNavigation.tsx
  - Shows notifications tab badge using unread derived from passed list.

### API Routes

User/organization notification APIs

- app/api/notifications/route.ts
  - GET list + unread count
  - PUT mark one / mark all
  - DELETE single by query id
- app/api/notifications/[id]/route.ts
  - PATCH single read/unread by route id
- app/api/notifications/stream/route.ts
  - SSE stream endpoint

Admin notification APIs

- app/api/admin/notifications/route.ts
  - GET paginated list + stats
  - POST broadcast/create
  - PUT mark read/mark all/edit announcement
  - DELETE single or bulk-delete

Realtime endpoint

- pages/api/socket.ts
  - Socket.IO bootstrap endpoint

Notification-producing APIs (direct inserts or service calls)

- app/api/auth/register/route.ts
- app/api/auth/verify-email/route.ts
- app/api/admin/blogs/[id]/route.ts
- app/api/admin/blogs/route.ts
- app/api/admin/events/[id]/route.ts
- app/api/vacancies/[id]/route.ts
- app/api/admin/organizations/route.ts
- app/api/admin/users/route.ts
- app/api/blogs/[id]/like/route.ts
- app/api/blogs/[id]/dislike/route.ts
- app/api/cron/event-deadlines/route.ts

### Services / Utils

- lib/services/notificationService.ts
  - createNotification
  - notifyBlogStatus
  - notifyEventStatus
  - notifyVacancyStatus
  - notifyAdminsAboutSubmission
  - sendWelcomeNotification
  - checkEventDeadlinesAndNotify
  - notifyBlogLike
  - notifyBlogDislike
- lib/sse.ts
  - addConnection/removeConnection/sendEventToUser/sendNotificationToUser
- lib/socket.ts
  - init/get io, emitNotificationToUser, emitNotificationUpdate, emitBulkNotificationUpdate, comment event emits
- lib/auth/server.ts
  - session includes role/accountType/organizationStatus used by notification ownership checks.

### Data Schema

- supabase/schema.sql
  - public.notifications table:
    - id, mongo_id, user_id, organization_id, type, title, message, data, action_url, is_read, created_at, updated_at
  - RLS enabled on notifications.
  - policy Users manage notifications:
    - auth.uid() = user_id OR auth.uid() = organization_id

## 5. Data Flow & State

Storage model

- Single notifications table stores all categories.
- Row can target either:
  - user_id
  - organization_id
- type drives semantic category (examples present in code):
  - welcome, email_verification, announcement, admin_action_required, admin, blog_approved, blog_rejected, blog, blog_status, blog_like, blog_dislike, event_approved, event_rejected, event_deadline, vacancy_approved, vacancy_rejected, organization_approved, organization_rejected
- data jsonb stores per-event metadata with varying structures by producer.

Ownership resolution

- /api/notifications chooses owner column based on session:
  - approved organization account -> organization_id
  - otherwise -> user_id

Global client state path

- NotificationContext is global provider and source of truth for:
  - Header bell
  - Dashboard notifications page
- Context always refreshes from API after mutating operations.
- Context maintains:
  - notifications[]
  - unreadCount
  - isLoading
  - error
  - freshness timestamp for ensureFreshNotifications(maxAgeMs)

Profile-local state path

- /profile page maintains separate local notifications[] state.
- It does not consume NotificationContext notifications list, only calls refreshNotifications after local updates.

Admin-local state path

- /admin page maintains independent notifications[] state and pagination/stats/filter state for admin tab.

Real-time state

- SSE provider stores:
  - isConnected
  - lastNotification
- NotificationBell reads only isConnected from SSE context.
- SocketProvider stores socket instance and isConnected state.

Transport to UI propagation

- Primary visible propagation remains fetch/refresh based:
  - Context refresh on mount/open/mutation/poll fallback.
- SSE and socket emits are generated in backend service, but UI state update is still achieved mainly via explicit refresh calls.

## 6. Interaction With Other Systems

Auth system interaction

- getServerSession drives all notification API authorization checks.
- register route creates welcome/admin_action_required notifications.
- verify-email route creates email_verification notification for non-organization accounts.
- session role/accountType/organizationStatus directly affects query ownership and route access.

Blog system interaction

- Admin moderation in two routes triggers user notifications:
  - service-based in /api/admin/blogs/[id]
  - direct insert in /api/admin/blogs
- Blog like/dislike routes create blog_like/blog_dislike notifications for author.

Event system interaction

- Admin event moderation uses NotificationService.notifyEventStatus.
- Event deadline cron scans saved events and writes event_deadline notifications.

Vacancy system interaction

- Vacancy admin moderation in /api/vacancies/[id] PATCH creates vacancy_approved/vacancy_rejected via NotificationService.createNotification.

Organization moderation interaction

- /api/admin/organizations PUT/PATCH writes organization_approved/organization_rejected notifications targeting organization_id.

Admin system interaction

- Admin announcement tab consumes /api/admin/notifications.
- Admin user role updates trigger type=admin notification.
- Admin notifications stats and pagination are computed server-side in /api/admin/notifications.

Browser communication interaction

- SSE provider requests Notification browser permission and shows native browser notifications on incoming SSE notification messages.

## 7. Role Behavior

User role behavior

- Access:
  - can use /api/notifications endpoints for own user_id rows.
  - can see header bell and profile notifications tab UI.
- Receives notifications from:
  - welcome/email verification
  - blog moderation outcomes
  - blog like/dislike
  - event moderation outcomes (when creator mapped to user)
  - vacancy moderation outcomes (when creator mapped to user)
  - admin announcements
  - admin account update
  - event deadline cron

Organization role behavior

- Approved organization account:
  - /api/notifications ownership switches to organization_id.
  - can access dashboard notifications page.
- Organization moderation notifications are written with organization_id target.
- Organization-created vacancy moderation can target organization_id path.
- Registration-time behavior differs from normal user:
  - no same welcome notification insert in register route
  - admin_action_required notifications are sent to admins instead.

Admin role behavior

- Can access admin notification management API routes.
- Can create/edit/delete/mark admin announcements.
- Can perform moderation actions in blogs/events/vacancies/organizations/users that produce notifications.
- Also receives notifications as a normal user_id target for admin_action_required and announcements, depending on producer logic.

## 8. Edge Behaviors (Observed)

Unread count synchronization

- NotificationContext unread count is server-driven from unreadCount response with fallback local calculation.
- Header mobile menu uses unreadCount from context.
- Profile tab unread badge is derived from profile-local notifications array, not context list.

Dual state paths

- There are parallel notification states:
  - global context state (header/dashboard)
  - profile-local state
  - admin-local state
- Each path performs its own fetch/update cycle.

Data-shape normalization differences

- NotificationContext maps snake_case API rows to camel keys and _id alias.
- Profile and admin pages store API rows directly in local state without the same normalization mapping in their local load functions.

Real-time integration behavior

- Backend service emits socket and SSE only when userId is provided in createNotification.
- organizationId-only notifications do not go through that emit branch in NotificationService.createNotification.
- SSE provider tracks lastNotification, but NotificationBell currently consumes only isConnected from SSE context.
- SocketProvider initializes and joins rooms, but client-side subscription handlers for notification events are not implemented in current UI code.
- Bell falls back to periodic polling when SSE is disconnected.

API surface overlap

- Both /api/notifications PUT and /api/notifications/[id] PATCH can update read state for single notification.

Creation-path heterogeneity

- Some routes use NotificationService wrappers, others write directly to notifications table.
- Notification type naming and message format vary by route (for example blog_approved/blog_rejected vs blog/blog_status).

Admin notification tab behavior

- Admin notifications GET defaults to type=announcement unless type query provided.
- Admin stats are computed only for type=announcement.

Cron endpoint behavior

- POST /api/cron/event-deadlines requires Bearer CRON_SECRET.
- GET in same route triggers deadline check without explicit auth guard in that file.

SSE connection storage behavior

- SSE connections are in-memory map keyed by userId; comment in code notes per-instance scope.

## 9. Notes for AI Understanding

Architectural pattern currently used

- Shared storage table + route-level business logic + partially centralized NotificationService + mixed realtime/fetch delivery.
- The system uses both direct repository writes and service abstraction depending on endpoint.

Propagation model

- Notification propagation generally follows:
  - business action route executes
  - route inserts notification row (directly or via NotificationService)
  - user-visible UI updates happen primarily through subsequent API fetch refreshes
  - optional realtime emit may occur for userId-targeted service path

Ownership model

- Notification ownership is identity-column based:
  - user notifications via user_id
  - organization notifications via organization_id
- Runtime owner query resolution in /api/notifications depends on session accountType + organizationStatus.

UI layering model

- Header and dashboard rely on NotificationContext provider.
- Profile and admin notifications each use standalone local state logic.
- Modal interactions are reused through NotificationModal component in profile and dashboard.

Type ecosystem in current codebase

- Notification rows carry a broad and non-strictly-unified type vocabulary, because multiple modules generate types independently.
- data payload schema is flexible per type; consumers mostly display title/message and do not enforce strict per-type parsing.

Realtime model in practice

- SSE is active in client provider and server stream route.
- Socket infrastructure is present and backend emit utilities exist.
- Current UI state refresh remains largely explicit fetch-driven rather than event-driven state mutation.

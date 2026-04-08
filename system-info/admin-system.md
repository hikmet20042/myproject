=== FILE: admin-system.md ===

# Admin Panel & Moderation System — Deep Current State

## 1. Feature Summary
The current admin panel is a single, multi-tab client page at `/admin` with supporting preview pages and admin API routes.

What it currently does:
- Centralized moderation and management UI for:
  - blogs
  - users
  - organizations
  - events
  - vacancies
  - materials
  - announcements/notifications
  - site settings
- Uses tabbed navigation inside one page (`app/admin/page.tsx`) and loads per-tab datasets from server APIs.
- Includes dedicated preview pages for moderated content:
  - `/admin/preview/blog/[id]`
  - `/admin/preview/events/[id]`
  - `/admin/preview/vacancies/[id]`
- Applies admin authorization at multiple layers:
  - middleware requires authentication for `/admin`
  - admin layout denies non-admin sessions with an unauthorized state UI
  - each admin API route performs role checks server-side
- Implements moderation state transitions (`pending`, `approved`, `rejected`) and writes moderation metadata (`admin_comment`, review timestamps, reviewer id fields depending on model).
- Sends notifications after moderation actions through direct inserts and/or `NotificationService`.

Main admin UX model:
- One stateful client screen with per-tab state, filters, pagination, action modals, and optimistic list reloads.
- Most write actions are modal-confirmed and call API routes directly from the browser.

---

## 2. All Admin Capabilities
All currently implemented admin actions:

### Blogs
- List blogs through `/api/admin/blogs` with filters:
  - status
  - search (title/abstract/content)
  - author
  - date range
  - sort field/order
- Review via inline list and via preview page `/admin/preview/blog/[id]`.
- Approve single blog:
  - `PUT /api/admin/blogs` (from main panel)
  - `PUT /api/admin/blogs/[id]` (from preview)
- Reject single blog with required comment in some UI flows.
- Delete blog permanently:
  - `DELETE /api/admin/blogs/[id]`
  - UI only exposes delete when status is not `pending`.
- Bulk moderation from list selection:
  - bulk approve (`PATCH /api/admin/blogs` with `action: bulk_approve`)
  - bulk reject (`PATCH /api/admin/blogs` with `action: bulk_reject`)
  - bulk delete (`PATCH /api/admin/blogs` with `action: bulk_delete`)

### Users
- List users with pagination and role/search filters via `/api/admin/users`.
- View user profile snippets/stats in list:
  - name/email
  - derived role
  - blog count
  - profile metadata
- Change user role (`user`/`admin`) via `PUT /api/admin/users` with `action: updateRole`.
- Update user profile data via backend action `updateProfile` (server endpoint exists).
- Delete user account via `DELETE /api/admin/users?userId=...`.
- Built-in protection: admin cannot change own role or delete own account.

### Organizations
- View organization registrations with status/search/sort/pagination via `/api/admin/organizations`.
- View status counters (pending/approved/rejected/total).
- Open full organization detail modal including contact data, type, focus areas, social links.
- Approve organization via `PUT /api/admin/organizations` (`action: approve`).
- Reject organization via `PUT /api/admin/organizations` (`action: reject`) with required rejection reason.
- Bulk approve/reject organizations via `PATCH /api/admin/organizations`.
- Delete organization profile + auth user via `DELETE /api/admin/organizations/[id]`.

### Events
- View events queue with status/search pagination via `/api/admin/events`.
- View event details in list and dedicated preview `/admin/preview/events/[id]`.
- Approve pending event:
  - `PATCH /api/admin/events/[id]` with `action: approve`
  - also supported by `PUT /api/admin/events` with `{id,status}` path
- Reject pending event:
  - `PATCH /api/admin/events/[id]` with `action: reject` and required admin comment
- Delete event from admin list (for non-pending statuses) via `DELETE /api/events/[id]` (general event endpoint, admin-auth accepted there).

### Vacancies
- View vacancies queue through `/api/vacancies?adminView=true` with status/search/pagination.
- View vacancy details in list and preview `/admin/preview/vacancies/[id]`.
- Approve pending vacancy via `PATCH /api/vacancies/[id]` (`action: approve`).
- Reject pending vacancy via `PATCH /api/vacancies/[id]` (`action: reject`, reason required).
- Delete vacancy from admin list (for non-pending statuses) via `DELETE /api/vacancies/[id]`.

### Materials
- List all materials (including unpublished) via `/api/admin/materials` with category/search/pagination.
- Create material via `POST /api/materials`.
- Edit material via `PUT /api/materials/[id]`.
- Delete material via `DELETE /api/materials/[id]`.
- Toggle publish state (`isPublished`) via `PUT /api/materials/[id]`.
- Toggle featured state (`featured`) via `PUT /api/materials/[id]`.
- Upload material image through shared `ImageUpload` component integration.

### Notifications / Announcements
- Load announcement notifications (default `type=announcement`) via `/api/admin/notifications`.
- View notification stats: total/unread/read/today.
- Send announcement to:
  - all users
  - verified users
  - specific user ID list
  using `POST /api/admin/notifications`.
- Edit existing announcement content via `PUT /api/admin/notifications` with `editAnnouncement`.
- Mark individual notification read/unread via `PUT /api/admin/notifications` (`notificationId`, `isRead`).
- Mark all as read via `PUT /api/admin/notifications` (`markAllAsRead`).
- Delete single notification via `DELETE /api/admin/notifications?id=...`.
- Delete bulk notifications with filters via `DELETE /api/admin/notifications?deleteAll=true...`.

### Settings
- Load site settings via `GET /api/admin/settings`.
- Create initial settings row automatically if missing, seeded from defaults.
- Update settings (full object or section) via `PUT /api/admin/settings`.
- Reset all settings or one section to defaults via `DELETE /api/admin/settings[?section=...]`.
- Open history action in UI; backend currently returns empty history payload via `PATCH /api/admin/settings`.

### Admin Utility Endpoint
- Image blob cleanup status and execution APIs exist:
  - `GET /api/admin/cleanup-images` (estimates unused old images)
  - `POST /api/admin/cleanup-images` (delete by age + zero usage)
- No explicit tab/control for this endpoint is present in the main admin page.

---

## 3. Detailed Flows

### Blog Moderation Flow
1. Admin opens `blogs` tab (default active tab in state).
2. UI fetches `/api/admin/blogs` with filter params.
3. API validates admin session (`isAdminSession`), queries `blogs` with joins on author.
4. Response includes list and author filter options.
5. Admin chooses moderation path:
   - from list item preview link `/admin/preview/blog/[id]`
   - from review modal actions
   - from bulk action modal
6. Single approval/rejection path:
   - UI sends `PUT /api/admin/blogs` (or `/api/admin/blogs/[id]` in preview)
   - status changes to `approved` or `rejected`
   - admin comment written when supplied
7. Backend side effects:
   - writes moderation fields (`status`, `admin_comment`, timestamps/reviewer fields depending on endpoint)
   - invalidates blog/user cache in `/api/admin/blogs`
   - inserts notification rows for affected author
   - `/api/admin/blogs/[id]` may send through `NotificationService.notifyBlogStatus`
8. UI reloads blog data and updates pending badge counts.
9. Delete flow:
   - available for non-pending in list
   - confirmation dialog
   - `DELETE /api/admin/blogs/[id]`
   - refresh list.
10. Bulk flow:
   - select rows -> open modal -> choose approve/reject/delete
   - `PATCH /api/admin/blogs`
   - per-item processing and per-author notifications for status changes
   - refresh list.

### Event Moderation Flow
1. Admin opens `events` tab.
2. UI fetches `/api/admin/events` with status/search/page params.
3. API validates admin role and returns mapped event records + stats + pagination.
4. Pending events display approve/reject controls.
5. Approve:
   - `PATCH /api/admin/events/[id]` with `action: approve`
   - sets `status=approved`, `approved_at`, `approved_by`, `is_published=true`, clears rejection fields.
6. Reject:
   - rejection modal requires admin comment
   - `PATCH /api/admin/events/[id]` with `action: reject`, `adminComment`
   - sets `status=rejected`, rejection fields, `is_published=false`, clears approval fields.
7. Event preview page:
   - loads event via `/api/events/[id]`
   - if pending/rejected/unpublished, endpoint allows only owner or admin
   - preview actions call `/api/admin/events/[id]` patch and redirect to `/admin?tab=events`.
8. Post-moderation notification:
   - `NotificationService.notifyEventStatus` called in admin event `[id]` route.
9. Deletion path (for non-pending UI state):
   - `DELETE /api/events/[id]`
   - endpoint permits owner or admin
   - list reload.

### Organization Approval Flow
1. Admin opens `organizations` tab.
2. UI fetches `/api/admin/organizations` with page/status/search.
3. API validates admin and reads `organization_profiles` by `moderation_status`.
4. UI displays cards + registration list.
5. Admin can open organization detail modal for full profile fields.
6. Pending organization actions:
   - approve modal action -> `PUT /api/admin/organizations` with `action: approve`
   - reject modal action -> same endpoint with `action: reject` + required `rejectionReason`
7. Backend writes:
   - `moderation_status`
   - `reviewed_at`, `reviewed_by` (approved path)
   - `admin_comment` and null review fields (rejected path)
8. Backend inserts organization notification (`organization_approved`/`organization_rejected`) into `notifications` with `organization_id` target.
9. UI refreshes list and stats.
10. Non-pending organizations show delete action:
   - `DELETE /api/admin/organizations/[id]`
   - removes organization profile and deletes auth user.
11. Bulk moderation exists server-side through `PATCH /api/admin/organizations`, though main list UI path is single-item modal.

### User Management Flow
1. Admin opens `users` tab.
2. UI fetches `/api/admin/users?page=...&limit=20&search=...&role=...`.
3. API validates admin session and queries:
   - `users`
   - `user_profiles`
   - `blogs` for count aggregation
   - `accounts` for admin role derivation
4. API returns:
   - transformed user list
   - pagination info
   - stats (`total`, `verified`, `admin`)
5. Admin action modal paths:
   - role update
   - user delete
6. Role update:
   - `PUT /api/admin/users` with `{ action: 'updateRole', updates: { role } }`
   - updates `accounts.is_admin`
   - sends account update notification.
7. Delete:
   - `DELETE /api/admin/users?userId=...`
   - deletes related profile/blog/notification rows
   - deletes auth user.
8. Guardrails:
   - cannot modify own role
   - cannot delete own account.

### Admin Navigation / Dashboard Flow
1. Route access control:
   - middleware protects `/admin` by requiring authenticated user, redirecting to `/auth/signin` if absent.
2. In-page role gate:
   - `app/admin/layout.tsx` checks `useSession()`.
   - if session missing: returns `null`.
   - if role not admin: renders `UnauthorizedState`.
3. On page mount/tab change:
   - `activeTab` state drives `loadSubmissions()` switch.
   - `tab` query param is read from URL and synced into active tab state.
4. Data loading:
   - each tab has dedicated loader function.
   - separate `loading` and `tabLoading` states control full-page and tab-level loading indicators.
5. Navigation composition:
   - tabs are local buttons, not route transitions.
   - preview actions navigate to dedicated `/admin/preview/...` routes.

---

## 4. Full Code Mapping

### Pages
- `app/admin/layout.tsx`
  - Admin shell and client-side admin-role gate.
- `app/admin/page.tsx`
  - Main multi-tab admin control center.
- `app/admin/preview/blog/[id]/page.tsx`
  - Blog moderation preview + approve/reject modal.
- `app/admin/preview/events/[id]/page.tsx`
  - Event detail preview + approve/reject actions.
- `app/admin/preview/vacancies/[id]/page.tsx`
  - Vacancy detail preview + approve/reject actions.

### Components
- `components/shared/UnauthorizedState.tsx`
  - Displayed for non-admin session on admin layout.
- `components/admin/DraggableMaterialRow.tsx`
  - Sortable material row component (imported in admin page; no rendered usage found in current main page).
- `components/BlocknoteReadOnly.tsx`
  - Used in blog preview and admin review modal for structured content display.
- `components/shared/LoadingState.tsx`
  - Used for loading states in admin pages.
- `components/shared/ErrorState.tsx`
  - Used by preview pages for not found/failure states.
- `components/shared/ImageUpload.tsx`
  - Used in material create/edit modal.

### API Routes
Admin-prefixed:
- `app/api/admin/users/route.ts`
  - GET users, PUT user updates/role, DELETE user.
- `app/api/admin/blogs/route.ts`
  - GET blog queue, PUT moderate single, PATCH bulk moderation.
- `app/api/admin/blogs/[id]/route.ts`
  - GET one blog for preview, PUT moderate, DELETE blog.
- `app/api/admin/events/route.ts`
  - GET events queue + stats, PUT status update by id.
- `app/api/admin/events/[id]/route.ts`
  - GET event detail, PATCH approve/reject.
- `app/api/admin/organizations/route.ts`
  - GET org queue + stats, PUT approve/reject, PATCH bulk.
- `app/api/admin/organizations/[id]/route.ts`
  - DELETE organization account/profile.
- `app/api/admin/materials/route.ts`
  - GET all materials for admin view.
- `app/api/admin/notifications/route.ts`
  - GET notifications, POST create announcement, PUT update/read/edit, DELETE remove.
- `app/api/admin/settings/route.ts`
  - GET/PUT/DELETE/PATCH for site settings.
- `app/api/admin/cleanup-images/route.ts`
  - GET cleanup status, POST cleanup execution.

General routes used by admin UI/previews:
- `app/api/events/[id]/route.ts`
  - Used for event preview read and admin/non-admin delete/update logic.
- `app/api/vacancies/route.ts`
  - Used with `adminView=true` for admin vacancy queue.
- `app/api/vacancies/[id]/route.ts`
  - Used for vacancy preview read + moderation patch + delete.
- `app/api/materials/route.ts`
  - Admin uses POST create material.
- `app/api/materials/[id]/route.ts`
  - Admin uses GET/PUT/DELETE and publish/featured toggles.

Auth/role infrastructure:
- `middleware.ts`
  - Authentication gate for `/admin`.
- `lib/auth/server.ts`
  - Session resolution, canonical role from `accounts.is_admin`.
- `lib/auth/client.ts`
  - `useSession()` hook used by admin layout/page.
- `lib/roles.ts`
  - `isAdminSession` helper used by admin APIs.

Cross-system services used by moderation:
- `lib/services/notificationService.ts`
  - Event/blog/vacancy moderation notifications and realtime emission.
- `lib/cache.ts`
  - Blog cache invalidation from admin blog moderation route.
- `lib/supabase/siteSettingsDefaults.ts`
  - default settings payload for settings bootstrap.

---

## 5. Data Flow & State

### Client-side state model (`app/admin/page.tsx`)
Main state buckets:
- Navigation/control:
  - `activeTab`, `loading`, `tabLoading`
- Blogs moderation:
  - `blogs`, filters (`contentSearch`, `statusFilter`, `authorFilter`, date range, sort)
  - selection state (`selectedItems`) and bulk modal state
  - review modal state (`selectedItem`, `adminComment`, `showModal`)
- Users:
  - `users`, `userPagination`, `userStats`
  - `selectedUser`, `userAction`, `showUserModal`
- Organizations:
  - `organizations`, `organizationStats`, `organizationPagination`
  - `selectedOrganization`, `showOrganizationModal`, `showOrganizationDetailModal`, `organizationAction`
- Events:
  - `events`, `eventStats`, `eventPagination`
  - `selectedEvent`, `showEventModal`, `eventAction`, `eventRejectionReason`
- Vacancies:
  - `vacancies`, `vacancyStats`, `vacancyPagination`
  - `selectedVacancy`, `showVacancyModal`, `vacancyAction`, `vacancyRejectionReason`
- Notifications/announcements:
  - `notifications`, `notificationStats`, `notificationPagination`, `notificationFilters`
  - `announcementForm`, `showAnnouncementModal`, `sendingAnnouncement`, `editingAnnouncementId`
- Materials:
  - `materials`, `materialStats`, `materialPagination`
  - `materialSearch`, `materialCategoryFilter`
  - form/modal state (`materialFormData`, `selectedMaterial`, `showMaterialFormModal`)
- Settings:
  - `settings`, `settingsLoading`, `activeSettingsSection`, `settingsChanged`, `savingSettings`
  - `settingsHistory`, `showSettingsHistory`

### Read flows
- Per-tab fetch uses `fetch(...)` from client and updates tab-specific state.
- URL query param `tab` influences initial/current tab state.
- Many tab loaders rebuild `URLSearchParams` from local filters.

### Mutation flows
- Moderation and CRUD actions call API endpoints with JSON payloads.
- Most successful mutations immediately call tab loader again (`loadX`) to refresh list state.
- Action confirmation uses browser `confirm(...)` for destructive operations and Radix dialogs for moderated workflows.

### Server-side write patterns
- Admin writes map camelCase UI payload to snake_case DB columns inside endpoints.
- Timestamp fields commonly updated with `new Date().toISOString()`.
- Status transitions include associated metadata reset logic.

### Data stores/tables touched by admin system
- `users`
- `accounts`
- `user_profiles`
- `blogs`
- `events`
- `vacancies`
- `organization_profiles`
- `materials`
- `notifications`
- `site_settings`
- `image_blobs` (cleanup endpoint)

### Moderation data effects by domain
- Blog approval/rejection:
  - updates `blogs.status`, `admin_comment`, `updated_at` (+ reviewer/timestamp in `[id]` route)
- Event approval/rejection:
  - updates `events.status`, approval/rejection fields, `is_published`, `admin_comment`
- Vacancy approval/rejection:
  - updates `vacancies.status`, approval/rejection fields, `is_published`, `admin_comment`
- Organization approval/rejection:
  - updates `organization_profiles.moderation_status`, review fields, admin comment

---

## 6. Interaction With Other Systems

### Blog System Integration
- Public blog listing endpoint defaults to `status=approved`.
- Non-approved blog retrieval requires owner or admin.
- Admin moderation endpoints directly control status/visibility.
- Cache invalidation occurs on admin blog moderation (`cache.blogs.invalidateAll()` and per-user invalidation).
- Author notifications are emitted after moderation.

### Events System Integration
- Public events listing defaults to approved + published unless admin view/owner filters are used.
- Admin moderation in `/api/admin/events/[id]` affects `is_published` and status fields used by public and owner views.
- Event preview uses general event endpoint with access restrictions for non-approved items.

### Vacancy System Integration
- Admin vacancies tab consumes the general vacancies endpoint in `adminView` mode.
- Public vacancy visibility depends on approved/published filtering in vacancies API.
- Moderation events trigger notifications to creating organization/user.

### Organization System Integration
- Public organizations endpoint serves only approved profiles by default.
- Admin moderation endpoint changes `moderation_status`, directly controlling public visibility.
- Organization-targeted notifications use `organization_id` in notifications table.

### Auth System Integration
- Admin role is derived from `accounts.is_admin` in server session creation.
- Middleware enforces authentication but not role on route entry.
- Role authorization is enforced in admin layout and admin API routes.
- Multiple endpoints check admin via either:
  - `isAdminSession(session)` helper
  - direct `session.user.role === 'admin'`

### Notifications System Integration
- Admin announcements are stored in `notifications` table.
- Admin moderation generates author/organization notifications via:
  - direct inserts
  - `NotificationService` wrappers
- `NotificationService` emits realtime notifications through socket + SSE functions when applicable.

### Settings System Integration
- Admin settings endpoint uses `site_settings` table, storing settings JSON under `data` column.
- Missing settings row is auto-created from `siteSettingsDefaults`.

---

## 7. Role Behavior

### Admin Behavior
- Can access `/admin` and all child routes.
- Can execute all admin API routes.
- Can view and moderate pending/non-public content in preview routes and admin tabs.
- Can delete users, organizations, blogs, events, vacancies, materials (route-specific rules still apply).

### Authenticated Non-Admin Behavior
- Middleware allows authenticated user to reach `/admin` route path.
- Admin layout blocks rendering and shows unauthorized message if role is not admin.
- Admin API routes return forbidden/unauthorized responses (401/403 depending endpoint).

### Unauthenticated Behavior
- Middleware redirects `/admin` requests to `/auth/signin` with callback URL.
- API endpoints requiring session return unauthorized.

### Owner vs Admin in shared (non-admin-prefixed) content routes
- In event/vacancy/blog detail routes:
  - non-approved content is accessible to owner or admin only.
- In event/vacancy delete/update routes:
  - owner and admin are both authorized.

---

## 8. Edge Behaviors (Observed)

### Loading and Empty States
- Full-page loading state shown before initial tab content.
- Tab-level loaders present (including materials spinner).
- Empty list states are implemented per tab with domain-specific messages.

### Access/Authorization Edge Handling
- `/admin` route auth enforced in middleware; role gate enforced in layout and APIs.
- Unauthorized API responses vary by endpoint (`401` or `403`).

### Moderation Comment Requirements
- Blog reject in admin main modal requires comment before submit.
- Blog reject in `/api/admin/blogs` backend does not force comment, but UI frequently does.
- Event reject in `/api/admin/events/[id]` requires `adminComment`.
- Vacancy reject in `/api/vacancies/[id]` requires `rejectionReason`.
- Organization reject requires rejection reason.

### Status-Conditional Actions
- Blog delete button appears only when blog is not pending.
- Event/vacancy/organization list shows approve/reject only for pending items.
- Delete actions for event/vacancy/organization are shown for non-pending items in main admin list.

### Notification Tab Behaviors
- Admin notifications GET defaults to `type=announcement` when no type provided.
- Pagination manually refetches next/prev pages with repeated fetch logic.
- Announcement editing populates form from selected notification and scrolls to form.

### Settings Behaviors
- If no `site_settings` row exists, GET auto-creates default row.
- PATCH history endpoint returns empty history payload (`history: []`).
- UI has `showSettingsHistory` state but no visible rendered history panel in the inspected page body.

### Code-Path Observations in Admin Page
- `markNotificationAsRead` function exists but no invocation was found in current admin page rendering paths.
- DnD imports (`DndContext`, `SortableContext`, etc.) and `DraggableMaterialRow` import exist in admin page; no rendered usage of drag-and-drop row path found in current page implementation.
- `Tabs` component is imported but local button nav is used for actual tab switching.

### Content Visibility Edge Logic in General APIs
- `/api/events/[id]` and `/api/vacancies/[id]` return non-approved items only to owner/admin.
- `/api/blogs` list defaults to approved status for public listing.

---

## 9. Notes for AI Understanding

System patterns currently used:
- Hybrid gate pattern:
  - route auth in middleware
  - role gate in admin layout
  - strict role checks in API handlers
- Single-page admin control center with many local states and modal-driven mutations.
- Per-tab pull model:
  - each tab has explicit loader and explicit mutation-triggered reloads.
- Moderation lifecycle pattern across content domains:
  - submission starts/exists in `pending`
  - admin action flips to `approved` or `rejected`
  - side fields updated to reflect moderation decision
  - notification emitted to submitter
- Public visibility generally tied to moderation status + publication flags.
- Notification writing is mixed:
  - direct inserts in some routes
  - `NotificationService` in others.
- Supabase admin client is used across admin and many content endpoints.
- Data transformation layer maps snake_case DB rows to camelCase API payloads for frontend consumption.

Moderation lifecycle as currently implemented across systems:
- Blogs:
  - created as pending
  - admin approve/reject through admin routes
  - approved blogs are publicly listed
- Events:
  - moderation controls both status and publication fields
  - non-approved/unpublished access restricted to owner/admin
- Vacancies:
  - moderation via general vacancy endpoint patch (admin only)
  - admin queue powered by `adminView=true`
- Organizations:
  - moderation uses `organization_profiles.moderation_status`
  - public organizations endpoint defaults to approved-only

Operational shape of current admin system:
- Frontend: one large client component plus 3 preview pages.
- Backend: dedicated admin API namespace plus shared domain endpoints reused by admin for some actions.
- Notifications: built-in moderation messaging and announcement broadcasting.
- Settings: persisted JSON configuration with default bootstrap/reset semantics.

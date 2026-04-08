=== FILE: user-profile-system.md ===

# User Profile System — Deep Current State

## 1. Feature Summary
The current codebase contains two profile surfaces and one public-profile detail page:

1. Regular authenticated profile area at route `/profile`.
2. Organization dashboard profile area at route `/dashboard/profile`.
3. User-by-id profile detail page at route `/profile/[id]`.

The regular `/profile` page is a tabbed personal workspace that combines:
- account/profile data display and edit,
- personal blog management (tab present conditionally, render behavior is condition-dependent),
- notifications inbox and per-notification modal,
- placeholder settings tab.

The organization `/dashboard/profile` page is a separate profile implementation under dashboard shell/navigation. It is focused on organization-level fields and uses a dedicated organization profile API contract.

The `/profile/[id]` page shows a specific user profile and that user’s blogs (fetched by author id) in a read-only presentation.

Auth/session model for profile system is based on a unified session shape with:
- `role` (`user` or `admin`),
- `accountType` (`user` or `organization`),
- `organizationStatus` (`pending`, `approved`, `rejected`, or `null`),
- `emailVerified` boolean.

Middleware protects all routes starting with `/profile` and `/dashboard` (authentication required), and dashboard layout applies additional organization-approval authorization rules.

---

## 2. All User Capabilities
Current capabilities observable in code:

1. View own profile summary and details on `/profile`.
2. Edit own profile fields on `/profile` and persist via `PUT /api/users/profile`.
3. Upload avatar from profile edit form using `POST /api/upload` with `context=profile`.
4. View email verification warning banner on `/profile` when not verified.
5. Resend verification email from `/profile` using `POST /api/auth/verify-request`.
6. Open tab navigation within `/profile`:
- `profile`
- `blogs` (tab visibility depends on `isOrganization` flag passed to tab component)
- `notifications`
- `settings`
7. Fetch and display profile statistics via `GET /api/users/profile/stats`.
8. Fetch personal blogs via `GET /api/blogs/user` when blogs tab data is requested.
9. Delete own blog from profile flow using `DELETE /api/blogs?id=...`.
10. Edit pending or rejected blogs from profile blog cards (navigates to blog edit flow routes).
11. Open notification list and notification detail modal in profile area.
12. Mark single notification read/unread via `PUT /api/notifications`.
13. Mark all notifications as read via `PUT /api/notifications`.
14. Navigate to profile from header user menu (`/profile`) for non-organization users.
15. Navigate to organization dashboard profile from header (`/dashboard/profile`) for approved organization users.
16. View another user profile page on `/profile/[id]` and see that user’s blog list.
17. For approved organization accounts: view and edit organization profile in dashboard profile page.
18. In dashboard profile edit form, update organization identity/contact/focus/social fields via `PUT /api/profile/organization`.
19. View profile-image API support endpoints (`GET/POST/DELETE /api/profile/image`) for image lifecycle in backend.
20. Access notification bell dropdown globally (if authenticated), including read/unread toggle and delete notification actions.

Observed scope boundaries in current implementation:
- Profile pages do not currently expose a direct saved-events UI/action in profile surfaces.
- Saved events appear in notification service logic for deadline reminders (backend-side use of `users.saved_events`).

---

## 3. Detailed User Flows

### Profile Viewing Flow
Regular self-profile (`/profile`):

1. Route is auth-protected by middleware (`/profile*` requires authenticated user).
2. `ProfilePageContent` reads `useSession()` and initializes active tab from URL query `tab`.
3. On load, it calls:
- `GET /api/users/profile` for core profile data,
- `GET /api/users/profile/stats` for stats.
4. If profile fetch fails or returns no profile object, page shows error state.
5. When profile exists, page renders:
- hero/user identity block,
- optional bio,
- role/account badges (admin badge and approved-organization badge logic),
- joined date from stats,
- tab navigation.
6. If user email is not verified (`!profile.user.emailVerified`), warning banner appears with resend action.

Public profile-by-id (`/profile/[id]`):

1. Component reads dynamic `params.id`.
2. Fetches user by id via `GET /api/users/{id}`.
3. Normalizes API shape (`{ user }` or plain object).
4. Fetches blogs with `GET /api/blogs?author={id}`.
5. Normalizes blog list from multiple possible response shapes (`results`, `blogs`, array fallback).
6. Renders profile hero, contact information, social links, and blog cards.
7. On fetch failure, shows error state with fallback navigation.

Organization dashboard profile (`/dashboard/profile`):

1. Route exists inside dashboard layout.
2. Dashboard layout checks session account type/status:
- must be `accountType=organization` and `organizationStatus=approved`.
3. If unauthorized by role/status, renders `UnauthorizedState`.
4. On authorized entry, `ProfilePageContainer` fetches `GET /api/organization/profile`.
5. Shows profile overview card (`ProfileView`) or edit card (`ProfileForm`) based on local toggle.

### Profile Editing Flow
Regular `/profile` edit flow:

1. User enters edit mode in `components/Profile/Profile.tsx`.
2. Editable fields include:
- name,
- bio,
- location,
- website,
- phone,
- dateOfBirth,
- gender,
- occupation,
- organization,
- interests,
- social media links,
- socialLinks text,
- avatar URL (set by upload flow).
3. Avatar upload subflow:
- file input,
- sends multipart request to `POST /api/upload` with `context=profile`,
- on success writes returned `url` into form state as avatar.
4. Save action triggers `PUT /api/users/profile` with full form JSON.
5. Backend updates users table (name) and upserts `user_profiles` row.
6. UI reloads profile using `loadProfile()` and exits edit mode on success.

Organization `/dashboard/profile` edit flow:

1. User clicks `Edit Profile` in organization dashboard profile page.
2. `ProfileForm` local form is initialized from current organization profile object.
3. Required validations in UI/API path:
- `organizationName` required,
- `description` required,
- organization type must be in allowed enum if provided.
4. Save triggers `PUT /api/profile/organization`.
5. API writes to `organization_profiles` and returns normalized `organizationProfile` payload.
6. Parent container updates local state and toggles back to profile overview.

Additional organization update path exists:
- `PUT /api/organization/profile` also supports organization updates for approved organizations.
- Frontend dashboard profile currently calls `/api/profile/organization` from `ProfileForm`.

### User Content (Blogs / Saved / etc.) Flow
Blogs in `/profile`:

1. Blogs data is loaded lazily when active tab is `blogs` (`loadTabData`).
2. Fetch endpoint: `GET /api/blogs/user` filtered to authenticated user as author.
3. Blogs tab component displays:
- status badge (`pending`/`approved`/`rejected`),
- views count,
- created date,
- optional admin comment,
- action buttons by status.
4. Pending blog action: go to edit route `/edit/blog/{id}/step1`.
5. Rejected blog action:
- clears edit-related localStorage keys,
- fetches blog detail via `GET /api/blogs?id={id}`,
- stores normalized edit payload in localStorage,
- navigates to edit route for resubmission.
6. Approved blog action area shows non-editable published indicator.
7. Delete action opens confirmation dialog and calls `DELETE /api/blogs?id={id}`.

Notifications in `/profile`:

1. Notifications tab fetches with `GET /api/notifications`.
2. List items are opened in modal.
3. Modal actions call read/unread update through `PUT /api/notifications`.
4. `markAllAsRead` supported through same endpoint with `markAllAsRead: true`.
5. Notification context global state is refreshed after each mutation.

Saved-events related behavior currently observed:

1. Notification service contains a scheduled/deadline notification routine that reads `users.saved_events` and generates event deadline notifications.
2. Profile UIs (`/profile`, `/dashboard/profile`, `/profile/[id]`) do not render saved-events lists or controls.

---

## 4. Full Code Mapping

### Pages
Regular/self profile:
- `app/profile/page.tsx`

Public profile by id:
- `app/profile/[id]/page.tsx`

Organization profile entry:
- `app/dashboard/profile/page.tsx`
- `features/profile/components/ProfilePageContainer.tsx`

Dashboard wrapper affecting organization profile behavior:
- `app/dashboard/layout.tsx`
- `components/dashboard/DashboardShell.tsx`

### Components
Regular profile component set:
- `components/Profile/Profile.tsx`
- `components/Profile/TabNavigation.tsx`
- `components/Profile/Blogs.tsx`
- `components/Profile/Notifications.tsx`
- `components/Profile/SettingsTab.tsx`
- `components/Profile/Stats.tsx` (present in codebase/imported in profile page)

Organization profile component set:
- `features/profile/components/ProfileView.tsx`
- `features/profile/components/ProfileForm.tsx`
- `features/profile/components/ProfilePageContainer.tsx`

Notification-related shared components that integrate with profile behavior:
- `components/NotificationContext.tsx`
- `components/NotificationBell.tsx`
- `components/NotificationModal.tsx`
- `features/dashboard/components/DashboardNotificationsPageContainer.tsx`

Header navigation links affecting profile entry points:
- `components/Header.tsx`

### API Routes
Primary profile APIs:
- `app/api/users/profile/route.ts` (regular user profile GET/PUT)
- `app/api/users/profile/stats/route.ts` (regular user stats)
- `app/api/users/[id]/route.ts` (public user fetch by id)

Organization profile APIs:
- `app/api/organization/profile/route.ts` (approved org GET/PUT)
- `app/api/profile/organization/route.ts` (approved org update path used by organization profile form)
- `app/api/profile/route.ts` (session-aware profile summary endpoint)

Profile image APIs:
- `app/api/profile/image/route.ts` (GET/POST/DELETE image lifecycle)
- `app/api/upload/route.ts` (generic uploader with `context=profile`, used by regular profile edit UI)

Content/notification APIs used by profile flows:
- `app/api/blogs/user/route.ts`
- `app/api/blogs/route.ts`
- `app/api/notifications/route.ts`
- `app/api/auth/verify-request/route.ts`

### Supporting Auth/Context/Guards
- `lib/auth/client.ts`
- `lib/auth/server.ts`
- `components/AuthProvider.tsx`
- `middleware.ts`
- `features/dashboard/context/DashboardDataProvider.tsx`

---

## 5. Data Flow & State
Regular profile data model (frontend shape in `/profile`):

1. `profile.user`:
- `id`
- `email`
- `name`
- `image`
- `role`
- `emailVerified`
- `createdAt`

2. `profile.profile` (nullable):
- `bio`
- `location`
- `website`
- `phone`
- `dateOfBirth`
- `gender`
- `occupation`
- `organization`
- `interests`
- `avatar`
- `avatarUrl`
- `socialLinks`
- `socialMedia` object
- organization-related optional keys (`registrationNumber`, `focusAreas`, `status`, `contactPerson`)

3. Stats state in `/profile`:
- `totalBlogs`
- `joinedDate`
- `lastActive`
- `writingStreak`
- `achievements` array

4. Additional UI state:
- `activeTab`
- `loading` and per-domain error states
- `blogs` list
- `notifications` list
- `editing` mode
- delete-confirm modal state
- notification modal state
- email resend status state

Regular profile backend persistence (`PUT /api/users/profile`):

1. Updates `users.name` if name provided.
2. Upserts into `user_profiles`:
- `bio`, `location`, `website`, `phone`, `date_of_birth`, `gender`, `occupation`, `organization`, `interests`,
- `social_links`, `social_media`,
- avatar handling (`avatar` or `avatar_blob_id` depending on source URL pattern).

Organization profile state (`/dashboard/profile`):

1. `organizationProfile` object fetched from `GET /api/organization/profile`:
- organization identity fields,
- moderation/status fields,
- contact and social fields,
- audit metadata (approved/reviewed fields).
2. Edit form local state holds:
- organizationName, organizationType, description,
- website, contactPhone, address,
- registrationNumber, focusAreas,
- socialMedia links.
3. Save writes to `organization_profiles` through `PUT /api/profile/organization`.

Notification data flow:

1. Notification context loads from `/api/notifications` and normalizes snake_case fields.
2. `unreadCount` derived from API count or computed fallback.
3. Profile tabs and notification bell share the same context refresh/mutation methods.
4. Notification ownership filtering is account-type aware (`user_id` for users, `organization_id` for approved org accounts).

Blog data flow in profile:

1. User blog list from `/api/blogs/user` (author is session user id).
2. Single blog fetch for rejected edit prefill from `/api/blogs?id=...`.
3. Blog delete from `/api/blogs?id=...`.

Image data flow:

1. UI profile edit currently uploads through generic `/api/upload` (`context=profile`) and stores returned URL in profile form.
2. Separate `/api/profile/image` endpoint family exists for direct profile-image CRUD and Cloudinary publicId lifecycle.

---

## 6. Interaction With Other Systems

### Auth
1. Profile and dashboard routes are protected in middleware based on path prefixes.
2. Session authority is assembled from Supabase auth user + `accounts` table + profile tables.
3. `accountType` and `organizationStatus` drive profile branching and dashboard authorization.
4. `emailVerified` status is used in `/profile` banner and in blog submission authorization checks.

### Blog System
1. `/profile` consumes user blog list, delete action, and edit/resubmit pathing.
2. `/profile/[id]` consumes blog list by author for profile owner display.
3. Blog route enforces visibility/ownership for non-approved content.
4. Approved blogs are non-editable in profile blog UI; pending/rejected have edit actions.

### Events System
1. Organization dashboard shell links profile section with events section (`/dashboard/events`) under same dashboard environment.
2. Dashboard data provider centralizes event loading for approved organizations.
3. Notification service uses saved-events backend data to generate deadline notifications, connecting event lifecycle to notification/profile experience indirectly.

### Notifications
1. `/profile` notifications tab and global bell dropdown share `NotificationContext`.
2. Read/unread/mass-read/delete operations all hit `/api/notifications` methods.
3. Notification payloads support `actionUrl`, allowing navigation from notification interactions.
4. Welcome notification action target is `/profile`.

---

## 7. Role Behavior

### Regular user (`accountType=user`)
1. Can access `/profile`.
2. Uses `GET/PUT /api/users/profile` and `GET /api/users/profile/stats`.
3. Header links expose `Mənim Profilim` to `/profile`.
4. Notification API filtering uses `user_id` owner column.

### Organization user (`accountType=organization`)
Approved organization (`organizationStatus=approved`):
1. Authorized for dashboard routes (`/dashboard/*`) and organization profile surface.
2. Header exposes organization panel link (`/dashboard/profile`) instead of regular profile link.
3. `GET/PUT /api/organization/profile` available for org profile retrieval/update.
4. `PUT /api/profile/organization` available and used by organization profile form.
5. Notification API filtering uses `organization_id` owner column.
6. `GET/PUT /api/users/profile` returns 400 with redirect hint to organization profile endpoint.

Pending/rejected organization:
1. Not authorized for dashboard layout (organization-approved check fails).
2. Dashboard layout renders unauthorized state.
3. Route middleware still requires authentication for profile routes but not approval.

### Admin role (`role=admin`)
1. Admin role appears as badge in regular `/profile` hero.
2. Header includes admin panel link (`/admin`) when role is admin.
3. Blog API allows admin access to non-approved single blog retrieval and admin moderation update (`PUT /api/blogs` with approve/reject status).

---

## 8. Edge Behaviors (Observed)

1. `/profile` loads profile/stats after auth status leaves loading; there is no explicit redirect in page component when unauthenticated (auth gating is handled by middleware).
2. If profile fetch fails, `/profile` renders error state component with retry/back action.
3. `/profile` blogs tab data is lazy loaded and tracked via `loadedTabsRef` to avoid repeated loads.
4. `notifications` tab fetches notifications on demand, and a URL query parameter `notification` can auto-open a modal for a matching notification id.
5. Email verification resend endpoint enforces cooldown (1-hour interval) and returns 429 when violated.
6. In profile blogs UI, rejected blog edit flow uses localStorage staging before redirecting to edit route.
7. Blog delete action requires explicit dialog confirmation and then removes deleted blog from local list state.
8. Profile settings tab currently renders “coming soon” style content and no persistence actions.
9. Public profile page `/profile/[id]` attempts to normalize multiple possible API payload shapes for both user and blogs responses.
10. Middleware auth-protects all `/profile*` routes, including `/profile/[id]`.
11. Notification bell dropdown links “view all notifications” to `/dashboard/notifications` path while dashboard layout authorization is organization-approved-only.
12. In `/profile`, blogs tab visibility and blogs-tab content render condition are not aligned in the same predicate path:
- tab visibility is controlled by `!isOrganization` flag in tab component,
- blogs content render condition checks `accountType === organization && organizationStatus !== approved`.
13. `components/Profile/Stats.tsx` exists and is imported in `/profile` page, while tab content path focuses primarily on the `Profile` component and tab sections.

---

## 9. Notes for AI Understanding

1. The profile system is not a single implementation; it is split into:
- regular-user profile surface (`/profile` + `components/Profile/*`),
- organization-dashboard profile surface (`/dashboard/profile` + `features/profile/components/*`),
- profile-by-id detail page (`/profile/[id]`).

2. API layer is similarly split:
- regular user profile API (`/api/users/profile`),
- organization profile API (`/api/organization/profile`),
- alternative organization update endpoint (`/api/profile/organization`),
- session-aware profile summary API (`/api/profile`).

3. Auth/session fields `accountType`, `organizationStatus`, and `role` are central branching keys used across pages, components, and APIs.

4. Notification system is a cross-cutting dependency for profile:
- notification context is global,
- profile tab and header bell share same data/mutation source,
- notification actions can route users into profile/dashboard pages.

5. Blog system is integrated into regular profile as a profile-adjacent content workspace:
- own-blog listing,
- status-specific edit paths,
- delete lifecycle,
- verification-dependent publishing ecosystem.

6. Dashboard profile acts as the organization hub entry point inside a broader organization dashboard shell that also links notifications/events/vacancies.

7. Profile image handling currently has two backend paths present in code:
- generic upload path used by regular profile edit UI (`/api/upload` with profile context),
- dedicated profile image endpoint family (`/api/profile/image`) for direct profile image CRUD.

8. Middleware and dashboard layout combine to form a two-layer guard model:
- middleware: authentication guard for route families,
- dashboard layout: organization approval guard for dashboard-only surfaces.

9. Data storage surfaces tied to profile flows include `users`, `user_profiles`, `accounts`, `organization_profiles`, `blogs`, and `notifications` tables, with additional references to `image_blobs` for upload metadata.

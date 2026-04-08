# Organization Directory & Profiles — Deep Current State

## 1. Feature Summary
The Organization Directory & Organization Profiles system is implemented as a Supabase-backed organization account lifecycle with:
- public organization discovery pages,
- public organization detail pages,
- organization registration in auth flow,
- admin moderation for organization approval/rejection,
- approved-organization dashboard profile management,
- organization-linked notification handling.

The current implementation uses organization identity primarily through:
- `accounts.account_type = 'organization'`
- `organization_profiles.account_id`
- session fields `accountType` and `organizationStatus` derived from `organization_profiles.moderation_status`.

Core public surfaces:
- `/resources/organizations` for directory listing and client-side filtering.
- `/resources/organizations/[id]` for organization profile detail.

Core protected surfaces:
- `/dashboard/profile` for approved organization profile view/edit.
- `/api/admin/organizations` and `/api/admin/organizations/[id]` for admin moderation and deletion.

Core data store:
- `organization_profiles` table is the main profile source for public/org/admin organization operations.
- legacy `organizations` table still exists in schema and is referenced by some foreign keys/policies.

## 2. All User Capabilities
### Public and unauthenticated users
- Open organization directory at `/resources/organizations`.
- Fetch and view approved organizations from `GET /api/organizations`.
- Use search input for organization name/description matching.
- Use category filter against organization `focusAreas`.
- Use location filter against organization `address` content.
- Use organization type filter against `organization_type`.
- Open organization detail pages via `/resources/organizations/[id]`.
- View contact channels exposed on detail page: email, phone, contact person, website, social links.
- Use mailto links directly from cards/details.
- Use external website/social links from cards/details.
- Open organization registration entrypoint from CTA (`/auth/register?type=organization`).

### Authenticated regular user accounts
- Same browsing/detail capabilities as public users.
- Can register a separate organization account through auth registration flow.
- Do not receive organization dashboard navigation in header.

### Organization accounts in pending/rejected/approved states
- Register an organization account through `/auth/register` UI and `/api/auth/register`.
- Verify organization email through `/api/auth/verify-email` flow.
- Resend verification emails through `/api/auth/verify-request` with cooldown enforcement.
- Approved organization accounts:
  - see dashboard entry in header and mobile menu,
  - access `/dashboard/*` shell,
  - view organization profile via `GET /api/organization/profile`,
  - edit organization profile via `PUT /api/profile/organization` from dashboard profile form,
  - create events through `/api/events` (organization-only and approved-only),
  - create vacancies through `/api/vacancies` (approved organization or admin),
  - receive/read/update/delete notifications scoped by `notifications.organization_id`.
- Pending/rejected organization accounts:
  - cannot pass dashboard layout authorization gate,
  - cannot use approved-organization-only profile editing endpoints.

### Admin users
- Open admin panel organizations tab.
- Fetch organization moderation list with pagination/filter/search/sort.
- View aggregated organization moderation stats (pending/approved/rejected/total).
- Open organization detail modal with extended profile fields.
- Approve pending organization via `PUT /api/admin/organizations` action `approve`.
- Reject pending organization via `PUT /api/admin/organizations` action `reject` with required reason.
- Execute bulk approve/reject via `PATCH /api/admin/organizations`.
- Delete organization profile + auth user via `DELETE /api/admin/organizations/[id]`.

## 3. Detailed User Flows
### Organization Discovery Flow
1. User opens `/resources/organizations`.
2. Page initializes local state: `searchTerm`, `selectedCategory`, `selectedLocation`, `selectedOrganizationType`, `organizations`, `loading`, `error`.
3. `useEffect` triggers fetch when mounted and whenever organization type filter changes.
4. Request sent to `/api/organizations` with `limit=100`; includes `organizationType` when selected.
5. API `GET /api/organizations` computes pagination/sort/filter params from query string.
6. API determines `effectiveStatus`:
   - defaults to `approved`,
   - only permits requested status for admin/myOrganizations contexts.
7. API queries `organization_profiles` with `.eq('moderation_status', effectiveStatus)` and optional filters:
   - `contains('focus_areas', [category])`
   - `ilike('address', %location%)`
   - `eq('organization_type', organizationType)` when valid by `isOrganizationType`
   - `or(organization_name/description/contact_person->>name ilike search)`
8. API maps DB row fields to frontend shape (`_id`, `organizationName`, `organizationType`, `focusAreas`, `contactPerson`, `socialMedia`, `status`, timestamps, approval metadata).
9. Page stores list and applies client-side filtering over fetched set:
   - search text,
   - category,
   - location,
   - organization type.
10. UI renders card list with:
   - organization initial avatar,
   - approved badge if `status === 'approved'`,
   - first focus area,
   - organization type label from `ORGANIZATION_TYPE_LABELS`,
   - first address segment,
   - website/contact links,
   - profile button to `/resources/organizations/[id]`.

### Organization Profile Viewing Flow
1. User navigates to `/resources/organizations/[id]`.
2. Page calls `/api/organizations/{id}`.
3. API reads `organization_profiles` row with `eq('account_id', id)` and `maybeSingle()`.
4. API returns normalized organization payload including moderation/admin fields and contact/social structures.
5. Page renders:
   - breadcrumb and back button,
   - title + status icon,
   - badges (focus area/type/address/status),
   - description blocks,
   - location section,
   - registration number section,
   - contact card section,
   - social media section,
   - metadata cards with created/updated dates and status.

### Organization Registration Flow
1. User enters `/auth/register` and selects `organization` account type tab.
2. Form requires:
   - email, password, confirmPassword,
   - organizationName, organizationType, description,
   - at least one focus area,
   - contact person name + email.
3. Optional fields accepted in form state:
   - website, contactPhone, address, registrationNumber,
   - contact person phone + position.
4. Client validates:
   - email format,
   - password length >= 6,
   - confirm password match,
   - website format if provided (`http/https`).
5. Client submits to `POST /api/auth/register` with `type: 'organization'` and `organizationProfile` object.
6. Backend validates required organization registration fields and organization type membership in `ORGANIZATION_TYPE_VALUES`.
7. Backend validates email uniqueness across `users.email` and `organization_profiles.email`.
8. Backend creates auth user via `supabase.auth.admin.createUser` (with `email_confirm: false`).
9. Backend upserts account row in `accounts` with `account_type = 'organization'`.
10. Backend upserts organization profile row in `organization_profiles` with:
   - organization identity + profile fields,
   - `moderation_status = 'pending'`,
   - review fields null.
11. Backend generates verification link via `auth.admin.generateLink`.
12. Backend sends admin notifications for organization approval action required.
13. Backend sends verification email via Nodemailer SMTP.
14. UI shows success confirmation state and sign-in button.

### Organization Profile Editing Flow
1. Approved organization user opens `/dashboard/profile`.
2. Dashboard layout checks session:
   - must be `accountType === 'organization'` and `organizationStatus === 'approved'`.
3. `ProfilePageContainer` fetches profile from `GET /api/organization/profile`.
4. API verifies approved organization session and returns profile from `organization_profiles`.
5. In view mode, `ProfileView` displays organization fields, focus areas, and social links.
6. User clicks edit toggle; `ProfileForm` renders editable fields.
7. `ProfileForm` submits `PUT /api/profile/organization` with editable fields.
8. API validates auth + approved status + required `organizationName` and `description`; validates organization type.
9. API updates `organization_profiles` for current `account_id = session.user.id` and returns `organizationProfile` response.
10. `ProfileForm` passes updated profile to container; container updates local state and exits edit mode.

### Admin Organization Moderation Flow
1. Admin opens organizations tab in `/admin`.
2. Frontend loads stats via `GET /api/admin/organizations?limit=1`.
3. Frontend loads list via `GET /api/admin/organizations` with page/search/status/sort params.
4. API checks admin via `isAdminSession(session)`.
5. API queries `organization_profiles` with optional status/search and returns mapped rows + pagination + status counts.
6. Admin can open detail modal for selected organization.
7. Pending records show actions:
   - approve,
   - reject.
8. Approve/reject modal submits `PUT /api/admin/organizations` with `{ organizationId, action, rejectionReason? }`.
9. API updates moderation fields:
   - approve: `moderation_status = approved`, sets `reviewed_at`, optional `reviewed_by` resolved from `users`, clears comment.
   - reject: `moderation_status = rejected`, stores required admin comment, clears review fields.
10. API writes notification row to `notifications` with `organization_id` target and action-specific type/title/message.
11. UI reloads organizations list and stats.
12. For non-pending records, admin can delete via `DELETE /api/admin/organizations/{id}`.
13. Delete route removes `organization_profiles` row and removes auth user account.

## 4. Full Code Mapping
### Pages
- `app/resources/organizations/page.tsx`
- `app/resources/organizations/[id]/page.tsx`
- `app/auth/register/page.tsx`
- `app/auth/verify-email/page.tsx`
- `app/auth/verify-request/page.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/profile/page.tsx`
- `app/admin/page.tsx`
- `app/resources/page.tsx` (links into organizations directory)
- `app/page.tsx` (home preview cards + count fetch)

### Components
- `features/profile/components/ProfilePageContainer.tsx`
- `features/profile/components/ProfileForm.tsx`
- `features/profile/components/ProfileView.tsx`
- `components/dashboard/DashboardShell.tsx`
- `components/shared/UnauthorizedState.tsx`
- `components/shared/LoadingState` and `components/shared/ErrorState` (imported usages)
- `components/Header.tsx` (organization panel/menu exposure)
- `components/NotificationBell.tsx` and `components/NotificationContext.tsx` (used with organization notifications behavior)

### API Routes
- `app/api/organizations/route.ts`
  - `GET` list organizations (public approved default, optional admin/my status handling)
  - `POST` deprecated creation endpoint returning guidance message
- `app/api/organizations/[id]/route.ts`
  - `GET` single organization by `account_id`
  - `PUT` owner/admin update path
  - `DELETE` admin delete path
- `app/api/auth/register/route.ts`
  - organization registration + account/profile creation + verification email + admin notifications
- `app/api/auth/verify-email/route.ts`
  - OTP verification + account type resolution + verification messaging
- `app/api/auth/verify-request/route.ts`
  - resend verification email with one-hour cooldown
- `app/api/organization/profile/route.ts`
  - approved-organization `GET` and `PUT` profile endpoint
- `app/api/profile/organization/route.ts`
  - approved-organization `PUT` profile update endpoint used by dashboard form
- `app/api/profile/route.ts`
  - session profile endpoint with organization branch returning organization identity/status/profile image
- `app/api/admin/organizations/route.ts`
  - admin list, approve/reject, bulk approve/reject
- `app/api/admin/organizations/[id]/route.ts`
  - admin delete organization account/profile

### Services / Utils / Auth / Config
- `lib/organizationTypes.ts` (allowed type values, labels, validator)
- `lib/auth/server.ts` (server session shape and organization status derivation)
- `lib/auth/client.ts` (client session typing and auth helpers)
- `components/AuthProvider.tsx` (client session sync from auth + accounts + organization_profiles)
- `lib/roles.ts` (`isAdminSession` authority helper)
- `lib/useLocalizedPath.ts` (localized route construction used by organization links)
- `next-sitemap.config.js` (organizations path generation from approved `organization_profiles`)

### Database Schema Mapping
- `supabase/schema.sql`
  - `accounts` table with `account_type`, `is_admin`, `is_active`
  - `organizations` legacy profile table
  - `organization_profiles` one-to-one profile table keyed by `account_id`
  - `events.created_by_organization`, `vacancies.created_by_organization`
  - `notifications.organization_id`
  - RLS policies including organization profile self-management and owner-based event/vacancy management

## 5. Data Flow & State
### Session and role/status derivation
- `getServerSession()` resolves Supabase auth user.
- Reads `accounts` row by auth user id.
- Builds session role from `accounts.is_admin`.
- For organization account type:
  - reads `organization_profiles.moderation_status`,
  - maps to session `organizationStatus` (`pending|approved|rejected|null`),
  - sets accountType `organization`.
- Client `AuthProvider` reproduces same pattern for browser session state.

### Organization directory data shape
API response for list maps to frontend fields:
- `_id` from `account_id`
- `organizationName` from `organization_name`
- `organizationType` from `organization_type`
- `description`
- `focusAreas` from `focus_areas`
- `address`, `website`, `contactPhone`
- `contactPerson` from `contact_person`
- `socialMedia` from `social_links`
- `registrationNumber`
- `status` from `moderation_status`
- `createdAt`, `updatedAt`
- `approvedBy`, `approvedAt` from review fields

### Organization detail data shape
- `GET /api/organizations/[id]` returns single `organization` object with additional fields:
  - `email`, `profileImage`, `adminComment`, `contactPerson`, `socialMedia`.

### Registration write path
Registration writes to multiple tables/services in sequence:
1. Supabase auth user creation.
2. `accounts` upsert.
3. `organization_profiles` upsert for organization type.
4. admin notification inserts for moderation action.
5. verification link generation + email dispatch.

### Profile update write paths
- Active dashboard profile form writes through `PUT /api/profile/organization`.
- This endpoint updates:
  - `organization_name`, optional `organization_type`,
  - `description`, `website`, `contact_phone`, `address`, `registration_number`,
  - `focus_areas`, `social_links`, `updated_at`.
- `GET /api/organization/profile` is used to fetch current approved organization profile state in dashboard profile page.

### Admin moderation write path
- Approve/reject updates `organization_profiles` moderation fields.
- Sends corresponding notification rows scoped by `organization_id`.
- List endpoint returns stats and paged records for admin UI state.

### Frontend state handling patterns
- Directory page:
  - server fetch then client-side filter pipeline,
  - local loading/error/empty state branching,
  - active filter badges with clear/reset actions.
- Detail page:
  - request on `id` param change,
  - loading then error/not-found then content.
- Dashboard profile page:
  - `ProfilePageContainer` mounted/auth-ready checks,
  - fetch profile once session user id is ready,
  - local edit toggle and optimistic local update from API response.
- Admin organizations tab:
  - list, stats, pagination, selected organization modal state,
  - separate action modal state with rejection comment gate.

## 6. Interaction With Other Systems
### Auth system interaction
- Registration route supports both user and organization account types and persists account type into `accounts`.
- Organization email verification flow identifies account type from `accounts` and customizes verification message.
- Dashboard authorization depends on `accountType` + `organizationStatus` from session.

### Profile system interaction
- `/api/profile` returns organization-shaped user profile payload for approved organization sessions.
- Organization profile dashboard uses dedicated organization profile endpoints rather than user profile endpoints.

### Events system interaction
- Event creation route requires approved organization session.
- On organization event creation:
  - `created_by = null`, `created_by_organization = session.user.id`,
  - `organization_name` populated by querying `organization_profiles.organization_name`,
  - event enters pending moderation.
- Event update ownership checks accept either `created_by` or `created_by_organization` matching session id.

### Vacancies system interaction
- Vacancy creation allows admin or approved organization.
- Organization-created vacancy uses `created_by_organization = session.user.id` and `created_by = null`.
- Non-admin organization-created vacancy starts as pending and unpublished.
- Vacancy update ownership checks accept creator user id or creator organization id.

### Notifications system interaction
- Notifications endpoint chooses owner column dynamically:
  - organization approved account -> `organization_id`,
  - otherwise -> `user_id`.
- Organization moderation writes notification types:
  - `organization_approved`
  - `organization_rejected`.
- Organization registration writes admin-targeted `admin_action_required` notifications.

### Social media system interaction
- `GET/PUT /api/social-media` supports approved organization social links by reading/writing `organization_profiles.social_links` when `type='organization'`.

### Admin system interaction
- Organizations are managed inside admin page organizations tab using `/api/admin/organizations*` endpoints.
- Admin UI action buttons, detail modal, and delete behavior directly reflect organization moderation status.

### Resources/home/navigation/SEO interaction
- Resources hub page links to organization directory card.
- Home page loads organizations list/count from `/api/organizations` and renders preview cards.
- Header resources dropdown includes organizations route.
- `next-sitemap.config.js` includes approved organizations as dynamic detail URLs.

## 7. Role Behavior
### Public user
- Can list and view organizations through public routes.
- Receives approved-only organization list from public organizations API.

### Authenticated regular user
- Can browse/view organizations like public user.
- Uses non-organization profile/menu paths.
- No organization dashboard menu exposure.

### Organization user (pending)
- Has organization account context but `organizationStatus` not approved.
- Dashboard layout authorization fails and returns unauthorized state.
- Approved-only organization endpoints reject access.

### Organization user (approved)
- Passes dashboard authorization and can access organization dashboard sections.
- Can fetch organization profile from `/api/organization/profile`.
- Can update organization profile through `/api/profile/organization`.
- Can create events and vacancies under organization ownership fields.
- Notification ownership is organization-scoped (`organization_id`).

### Organization user (rejected)
- Session remains organization account type with rejected status.
- Dashboard authorization fails.
- Approved-only org profile endpoints reject access.

### Admin
- Admin authority comes from `accounts.is_admin` reflected into session role.
- Can view all organization statuses in admin list.
- Can moderate pending organizations and delete non-pending organizations.
- Can use bulk moderation API.
- Can also update organizations via `/api/organizations/[id]` admin branch.

## 8. Edge Behaviors (Observed)
### Loading states
- Directory page returns loading state component while organization list request is in flight.
- Detail page shows loading state text while fetching by id.
- Dashboard profile container shows loading while auth/profile fetch is in progress.
- Admin organizations tab state updates with async list/stat fetches.

### Empty states
- Directory page renders explicit empty block when filtered result is empty.
- Admin organizations list renders empty block when no organizations match filters.
- Profile view renders fallback text when organization profile object is null.

### Error states
- Directory fetch failure sets error state and renders retryable error state component.
- Detail request failure or missing organization renders error state with return action.
- API endpoints return explicit status codes/messages for auth/validation/not-found/server errors.

### Non-approved organization visibility
- Public listing endpoint defaults to approved-only records.
- Detail endpoint fetches by id directly from `organization_profiles` row.
- Admin endpoint exposes all statuses with status filter support.

### Access restrictions
- Dashboard layout: strict approved organization requirement.
- `/api/organization/profile` GET/PUT: strict approved organization requirement.
- `/api/profile/organization` PUT: strict approved organization requirement.
- `/api/admin/organizations*`: strict admin session requirement.
- `/api/organizations/[id]` PUT: allowed for organization owner with approved status or admin.
- `/api/organizations/[id]` DELETE: admin-only.

### Moderation action constraints
- Reject action requires non-empty rejection reason in admin API.
- Rejection submit button in admin modal is disabled until comment is provided.
- Bulk reject also requires reason.

### Verification email request constraints
- `/api/auth/verify-request` applies one-hour cooldown using `verification_email_last_sent`.
- Cooldown persisted in `organization_profiles` for organization accounts.

## 9. Notes for AI Understanding
### Primary architectural patterns
- Supabase-auth-first account identity, then app-level account typing in `accounts`.
- Organization lifecycle modeled by moderation status on `organization_profiles`.
- Public and dashboard concerns split between:
  - public directory/detail endpoints,
  - approved-organization dashboard/profile endpoints,
  - admin moderation endpoints.

### Dual organization profile surface
- Public and moderation operations center around `organization_profiles` table.
- Schema also keeps legacy `organizations` table; foreign keys in events/vacancies/notifications still point to it, while runtime API logic uses organization account ids and `organization_profiles` lookups.

### Moderation lifecycle in code
- Registration initializes organization status as pending.
- Admin approve sets approved status + review timestamp/reviewer.
- Admin reject sets rejected status + admin comment and clears review stamp fields.
- Public listing depends on approved moderation status.
- Organization dashboard authorization depends on session `organizationStatus === 'approved'`.

### Route-level responsibility split
- Organization listing/detail for public content discovery:
  - `/api/organizations`
  - `/api/organizations/[id]`
- Organization owner profile management in dashboard:
  - read via `/api/organization/profile`
  - write via `/api/profile/organization`
- Admin moderation lifecycle:
  - `/api/admin/organizations`
  - `/api/admin/organizations/[id]`

### Organization type normalization
- Valid values are constrained by shared constants:
  - `ngo`, `student_club`, `community`, `startup`, `training_center`, `university_group`, `other`.
- Validation occurs in registration and update endpoints.

### Notifications ownership model for organizations
- Organization-focused APIs resolve notifications by `organization_id` when session indicates approved organization account type.
- Moderation outcomes and organization action-required notifications are inserted with organization-aware payload metadata.
=== FILE: authentication.md ===

# Authentication — Deep Current State

## 1. Feature Summary
Authentication in this codebase is implemented with Supabase Auth (not NextAuth runtime usage in the analyzed auth flows), with custom app-layer session shaping and role/account enrichment.

Current behavior includes:
- Credentials sign-in (email/password) for both user and organization account types.
- Google OAuth sign-in/sign-up flow for user accounts via Supabase OAuth.
- Email/password registration for user and organization types through a custom API.
- Email verification using Supabase OTP/link verification plus custom verify-email route/page.
- Resend verification email for signed-in but unverified accounts.
- Forgot-password and reset-password flows for both user and organization profiles.
- Sign-out via Supabase auth signOut.
- Global client auth context with session status (`loading`, `authenticated`, `unauthenticated`).
- Middleware-enforced route protection for selected pages.
- API-level authorization using `getServerSession()` and role checks (`admin`, `organization approved`, ownership checks).

Underlying identity and authorization data are composed from:
- Supabase auth user (`supabase.auth.getUser()`).
- `accounts` table as canonical role/account source (`account_type`, `is_admin`, `is_active`).
- `users` table for regular user profile name and legacy `role` display field.
- `organization_profiles` for organization name/status and moderation state.

## 2. All User Capabilities
Authentication-related user capabilities currently present:

- Register as regular user with email/password.
- Register as organization with email/password and extended organization profile fields.
- Start registration/sign-in with Google OAuth (regular user path).
- Sign in with email/password.
- Sign in with Google OAuth.
- Select account type during credentials sign-in (`user` or `organization`) and be blocked on mismatch.
- Sign out from header or dedicated signout page.
- Trigger forgot-password flow by email.
- Reset password using tokenized reset link.
- Verify email through tokenized verify endpoint/page.
- Resend verification email (cooldown-limited) when authenticated but unverified.
- Receive auth-related notifications (welcome, email verification, organization moderation status) via notification system.

Capabilities visible for admins (auth-governance related):
- Read/update/delete users through admin API routes guarded by admin session checks.
- Approve/reject organization registrations with notification side effects.
- Update role by writing `accounts.is_admin`.

## 3. Detailed Flows

### Registration Flow

#### A. Regular user registration (email/password)
1. UI: `/auth/register` with `registrationType = 'user'` validates:
	 - name required
	 - valid email format
	 - password min length 6
	 - confirm password match
2. UI sends `POST /api/auth/register` with `{ name, email, password, type: 'user' }`.
3. API (`app/api/auth/register/route.ts`):
	 - validates payload and password/email format.
	 - checks duplicate email in `users` and `organization_profiles`.
	 - creates Supabase auth user via `supabase.auth.admin.createUser` (`email_confirm: false`).
	 - upserts `accounts` row:
		 - `account_type: 'user'`
		 - `is_admin: false`
		 - `is_active: true`
	 - inserts `users` row with:
		 - `role: 'user'`
		 - `auth_provider: 'credentials'`
	 - generates signup verification link using `supabase.auth.admin.generateLink({ type: 'signup' ... })`.
	 - creates welcome notification for non-organization accounts.
	 - sends verification email via Nodemailer SMTP using generated action link.
4. API returns success JSON message.
5. UI sets local `success=true` and shows success panel with link to `/auth/signin`.

#### B. Organization registration (email/password)
1. UI: `/auth/register` with `registrationType = 'organization'` requires:
	 - organizationName
	 - organizationType
	 - description
	 - at least one focus area
	 - contactPerson name + email
	 - valid base email/password/confirm
2. UI sends `POST /api/auth/register` with:
	 - `type: 'organization'`
	 - `email`, `password`
	 - `organizationProfile` payload containing org and contact fields.
3. API:
	 - validates required org fields + valid org type.
	 - duplicate email check across `users` and `organization_profiles`.
	 - creates auth user in Supabase auth.
	 - upserts `accounts` with `account_type: 'organization'`, `is_admin: false`, `is_active: true`.
	 - upserts `organization_profiles` with:
		 - org metadata
		 - `moderation_status: 'pending'`
		 - review fields null
	 - generates verify link and sends email.
	 - notifies all admin accounts (`accounts.is_admin = true`) using notifications table.
4. API returns success JSON.
5. UI shows same registration success state.

#### C. Google-based sign-up path from register page
1. UI button on `/auth/register` (visible only for regular user mode) calls `signInWithOAuth('google', redirectTo=/auth/callback?next=/)`.
2. Supabase handles provider flow.
3. Callback route (`/auth/callback`) finalizes session and user/account materialization (detailed in OAuth flow section).

### Login Flow

#### A. Credentials login
1. UI: `/auth/signin` captures email/password and selected `accountType` (`user` or `organization`).
2. Frontend validation:
	 - email regex
	 - password min 6
3. Calls `signInWithPassword(email, password)` (Supabase browser client).
4. If auth error, UI surfaces `result.error.message`.
5. If success:
	 - UI fetches `accounts.account_type` for signed-in user ID.
	 - compares database account type with selected account type.
	 - mismatch behavior:
		 - if selected organization but actual user -> message instructing organization selector usage.
		 - otherwise generic invalid credential style messaging.
	 - no navigation when mismatch.
6. If account type matches:
	 - resolves `callbackUrl` query parameter (default `/`).
	 - attempts same-origin safe redirect handling:
		 - if same origin, uses router replace with normalized pathname/search/hash.
		 - otherwise uses `window.location.href`.
		 - fallback logic handles malformed URL cases.

#### B. Google OAuth login
1. UI button on `/auth/signin` calls `signInWithOAuth('google', redirectTo=/auth/callback?next={callbackUrl})`.
2. Provider flow returns to `/auth/callback` with auth code.
3. Callback route:
	 - exchanges code for session via `supabase.auth.exchangeCodeForSession(code)`.
	 - on failure redirects to `/auth/signin?error=OAuthSignin`.
	 - gets current auth user.
	 - ensures `accounts` row exists; if missing, upserts default user account.
	 - reads account type/is_admin.
	 - if account type is organization:
		 - signs out immediately.
		 - redirects `/auth/signin?message=Organization accounts cannot use Google sign-in`.
	 - upserts `users` row with:
		 - derived `role` (`admin` if `accounts.is_admin`, else `user`)
		 - `auth_provider: 'google'`
4. Redirects to `next` query value or `/`.

### Logout Flow
1. Header and mobile menu call `signOut()` from `lib/auth/client`.
2. Dedicated route `/auth/signout` triggers sign-out in `useEffect` and redirects home.
3. `signOut()` calls Supabase browser `auth.signOut()`.
4. AuthProvider receives auth state change and syncs to unauthenticated state.

### Email Verification Flow

#### A. Initial verification link
1. Generated during registration using Supabase admin `generateLink(type='signup')` with redirect to `/auth/verify-email?verified=1&type={accountType}`.
2. Email sent via Nodemailer.

#### B. Verification page behavior (`/auth/verify-email`)
1. Reads query params:
	 - if `verified=1`, marks success immediately client-side.
	 - else expects `token`.
2. If token present, calls `GET /api/auth/verify-email?token=...`.
3. API:
	 - calls `supabase.auth.verifyOtp({ token_hash, type })`.
	 - determines account type from `accounts`.
	 - for non-organization accounts creates `email_verification` notification.
	 - returns success message with account type.
4. UI renders loading/success/error states and links to sign-in/register.

#### C. Resend verification (`POST /api/auth/verify-request`)
1. Requires authenticated user (`supabase.auth.getUser()`).
2. Rejects if already verified (`email_confirmed_at`).
3. Loads account type and account row (`users` for user, `organization_profiles` for org).
4. Enforces cooldown of 1 hour based on `verification_email_last_sent`.
5. Updates `verification_email_last_sent`.
6. Generates verification link and sends via Nodemailer.
7. Returns success JSON.

UI touchpoints:
- Sign-in page shows special verification error block and link to `/auth/verify-request` page.
- Profile page includes resend verification button calling `/api/auth/verify-request`.

### Password Reset Flow

#### A. Forgot password (`/auth/forgot-password`)
1. User submits email to `POST /api/auth/forgot-password`.
2. API normalizes email and searches:
	 - `users` first
	 - then `organization_profiles` if not a regular user
3. For existing account:
	 - generates random reset token (`crypto.randomBytes`).
	 - hashes token with bcrypt.
	 - stores hash + expiry (1 hour) in account record:
		 - `users.password_reset_token/expires` OR
		 - `organization_profiles.password_reset_token/expires`
	 - sends reset email with URL `/auth/reset-password?token=...&email=...&accountType=...`.
4. For non-existing account:
	 - still returns generic success-style message.
5. UI shows message or error.

#### B. Reset password (`/auth/reset-password`)
1. Page reads `token`, `email`, optional `accountType`.
2. Validates password length and confirm match.
3. Sends `POST /api/auth/reset-password` with payload.
4. API:
	 - validates required fields.
	 - branch by accountType:
		 - `organization`: checks org reset token hash/expiry, then updates Supabase auth password by org account id.
		 - `user` or unspecified: checks user token hash first; if not valid and accountType not user, tries organization fallback.
	 - clears reset token fields after successful update.
5. UI shows success and redirects to sign-in with message after 3 seconds.

### Session Handling

#### Client session model
- `AuthProvider` wraps full app in root layout.
- It builds context value `{ data: ClientSession | null, status }`.
- On mount:
	- calls `supabase.auth.getUser()`.
	- enriches auth user from DB (`accounts`, `users` or `organization_profiles`).
	- sets `authenticated` or `unauthenticated`.
- Subscribes to `supabase.auth.onAuthStateChange`.
	- ignores `TOKEN_REFRESHED` events to avoid extra profile/account fetches.
	- syncs on other auth events.
- Implements equality checks to avoid unnecessary session/status state updates.

#### Server session model
- `getServerSession()` in `lib/auth/server.ts`:
	- reads Supabase auth user via server client.
	- returns `null` when no user or auth error.
	- enriches role/account type from `accounts`.
	- for org users, loads org profile and moderation status.
	- for regular users, loads `users.name`.
	- returns normalized app session object with:
		- `id`, `email`, `name`
		- `role` derived from `accounts.is_admin`
		- `accountType`
		- `organizationStatus`
		- `emailVerified` from `email_confirmed_at`
		- `isActive` from `accounts.is_active` default true

#### Middleware protection
- Middleware protects path prefixes:
	- `/admin`
	- `/submit`
	- `/edit/blog`
	- `/dashboard`
	- `/profile`
- If no Supabase auth user:
	- redirects to `/auth/signin?callbackUrl={pathname}`.
- Also normalizes legacy route:
	- `/organization-dashboard` -> `/dashboard`.
- Language-prefixed paths `/az/*` and `/en/*` are redirected to canonical non-prefixed routes.

### Error Handling

Observed error handling patterns in auth flows:
- Sign-in page surfaces:
	- credentials errors
	- OAuth errors
	- verification-required message
	- provider mismatch/account-type mismatch messages
	- optional URL-provided `error` and `message` query values
- Auth error page maps known auth error codes to localized messages (`OAuthSignin`, `CredentialsSignin`, etc.).
- API status patterns:
	- `400` for invalid request/token/validation issues.
	- `401` for unauthenticated access.
	- `403` for authenticated but unauthorized role/account access.
	- `404` for missing profile/resource in some flows.
	- `429` for verify-email resend cooldown.
	- `500` for server/internal failures.
- Many API routes return explicit `{ error: 'Unauthorized' }` or role-specific denial messages.
- Several routes log debug output (`console.log` / `console.debug`) for auth/session state in development or server logs.

---

## 4. Full Code Mapping

### Pages (Auth UI + auth-adjacent guarded layouts)
- `/auth/signin` -> `app/auth/signin/page.tsx`
- `/auth/register` -> `app/auth/register/page.tsx`
- `/auth/signout` -> `app/auth/signout/page.tsx`
- `/auth/forgot-password` -> `app/auth/forgot-password/page.tsx`
- `/auth/reset-password` -> `app/auth/reset-password/page.tsx`
- `/auth/verify-email` -> `app/auth/verify-email/page.tsx`
- `/auth/verify-request` -> `app/auth/verify-request/page.tsx`
- `/auth/error` -> `app/auth/error/page.tsx`
- OAuth callback route path `/auth/callback` -> `app/auth/callback/route.ts`

Guarding/auth-aware layout pages:
- `app/layout.tsx` (injects `AuthProvider` globally)
- `app/admin/layout.tsx` (client admin gate + `UnauthorizedState`)
- `app/dashboard/layout.tsx` (organization approved gate + `UnauthorizedState`)

Auth-consuming feature pages:
- `app/profile/page.tsx`
- `app/submit/blog/step1/page.tsx`
- `app/submit/blog/step2/page.tsx`
- `app/edit/blog/[id]/step1/page.tsx`
- `app/edit/blog/[id]/step2/page.tsx`

### Components
- `components/AuthProvider.tsx`
	- Central client auth context provider; session synchronization.
- `components/Header.tsx`
	- Uses `useSession`; shows role/account-dependent navigation; triggers signOut.
- `components/BlogReactions.tsx`
	- Uses `useSession`; prompts sign-in for unauthenticated reactions.
- `components/shared/UnauthorizedState.tsx`
	- Generic unauthorized screen used by gated layouts.
- `components/shared/index.ts`
	- Re-exports unauthorized and other shared states.

Profile-related component area (auth-adjacent use but not direct auth mutation):
- `components/Profile/*` used under authenticated profile page.

### API Routes (auth feature core)
- `POST /api/auth/register` (+ `GET` informational) -> `app/api/auth/register/route.ts`
- `POST /api/auth/forgot-password` -> `app/api/auth/forgot-password/route.ts`
- `POST /api/auth/reset-password` -> `app/api/auth/reset-password/route.ts`
- `GET /api/auth/verify-email` -> `app/api/auth/verify-email/route.ts`
- `POST /api/auth/verify-request` -> `app/api/auth/verify-request/route.ts`
- `POST /api/auth/change-password` -> `app/api/auth/change-password/route.ts`
- `GET /auth/callback` -> `app/auth/callback/route.ts`

### Services / Utils / Infra directly implementing auth
- `lib/auth/client.ts`
	- `useSession`, `signInWithPassword`, `signInWithOAuth`, `signOut`.
- `lib/auth/server.ts`
	- `getServerSession`, `requireServerSession`, `requireAdminSession`.
- `lib/supabase/client.ts`
	- Browser Supabase client creation.
- `lib/supabase/server.ts`
	- Server Supabase client creation using Next cookies.
- `lib/supabase/admin.ts`
	- Service-role Supabase client.
- `lib/roles.ts`
	- Canonical admin session helper based on `session.user.role`.
- `lib/email-templates/password-reset.ts`
	- Password reset and password changed email templates.
- `middleware.ts`
	- Auth redirect checks on protected route prefixes.

### Other API routes that depend on auth/session
Auth integration extends to many non-auth feature APIs that gate by session and role.

Major groups (all reference `getServerSession()` and role/ownership checks):
- Admin APIs: `app/api/admin/*`
- Profile APIs: `app/api/profile/*`, `app/api/users/profile/*`, `app/api/organization/profile/*`
- Content APIs: `app/api/blogs/*`, `app/api/events/*`, `app/api/vacancies/*`, `app/api/materials/*`
- Notifications APIs: `app/api/notifications/*`
- Media/upload APIs: `app/api/images/route.ts`, `app/api/upload/route.ts`
- Social/organization APIs: `app/api/social-media/route.ts`, `app/api/organizations/*`

Representative auth-linked endpoints explicitly using session checks include:
- `app/api/admin/users/route.ts`
- `app/api/admin/organizations/route.ts`
- `app/api/admin/blogs/route.ts`
- `app/api/admin/events/route.ts`
- `app/api/admin/materials/route.ts`
- `app/api/admin/settings/route.ts`
- `app/api/profile/route.ts`
- `app/api/users/profile/route.ts`
- `app/api/organization/profile/route.ts`
- `app/api/blogs/route.ts`
- `app/api/events/route.ts`
- `app/api/vacancies/route.ts`
- `app/api/notifications/route.ts`
- `app/api/notifications/stream/route.ts`

---

## 5. Data Flow & State

### Auth state storage and propagation
- Client-side auth state is stored in React context (`AuthSessionContext`) in memory.
- Provider exposes:
	- `data` (session object or null)
	- `status` (`loading`, `authenticated`, `unauthenticated`)
- Supabase client auth state is source-of-truth for logged-in identity on browser side.
- App-level session enrichment (role/account/profile) is done by fetching DB tables after `supabase.auth.getUser()`.

### Cookie and token handling
- Supabase SSR clients (`@supabase/ssr`) are used on server and middleware.
- Server client reads/writes auth cookies through Next.js cookie APIs.
- Middleware server client reads request cookies and can set response cookies.
- No custom JWT parsing logic is present in analyzed auth implementation; token/session exchange is handled by Supabase client methods.

### Client vs server auth logic split
- Client:
	- interactive sign-in/sign-out actions
	- UI-level status rendering
	- client-side account-type selection checks during credentials sign-in
	- auth subscription updates through `onAuthStateChange`
- Server/API:
	- session verification via `getServerSession()`
	- role/account authorization checks
	- account/user/org data writes
	- email verification, password reset, registration creation

### Session object shape used across app
Session user fields used by consumers:
- `id`
- `email`
- `name`
- `role` (`user` or `admin`)
- `emailVerified`
- `accountType` (`user` or `organization`)
- `organizationStatus` (`pending`, `approved`, `rejected`, or null)
- `isActive`

## 6. Role Behavior (if exists)

### Canonical role source
- Admin role is derived from `accounts.is_admin`.
- Helper note in code explicitly marks this as source of truth.
- `users.role` is treated as legacy/display-only in some paths.

### Role/account categories in runtime behavior
- `user` (regular account)
- `organization` (account_type organization with moderation status)
- `admin` (is_admin true, can still be account_type user or organization in data model, but admin checks are role-based)

### Behavior differences

Regular user:
- Can register with Google or credentials.
- Gets user profile from `users` table.
- Can access profile features.
- Welcome notification inserted on registration.

Organization account:
- Registration uses organization form and creates `organization_profiles` pending moderation.
- Credentials login requires selecting organization account type in sign-in UI.
- Google OAuth callback explicitly blocks organization account usage and signs out.
- Dashboard layout requires `accountType === 'organization'` and `organizationStatus === 'approved'`.
- Organization-specific profile APIs require approved organization.

Admin:
- Admin-only pages and APIs check `session.user.role === 'admin'` or `isAdminSession`.
- Admin layout shows unauthorized screen for non-admin sessions.
- Admin APIs manage users, organizations, events/blog moderation, settings, notifications, etc.

## 7. Interaction With Other Systems

### Profile system
- `/profile` page consumes `useSession` and loads profile data from protected APIs.
- `app/api/profile/route.ts` and `app/api/users/profile/route.ts` depend on server session.
- Organizations are redirected/segregated to organization profile endpoint behavior.
- Profile page uses verification resend flow for unverified users.

### Dashboard system
- `/dashboard` tree gated in middleware (requires authenticated user).
- `app/dashboard/layout.tsx` adds second-level gate: only approved organizations allowed.
- Non-authorized users see `UnauthorizedState`.

### Admin system
- `/admin` gated in middleware (auth required) and admin layout (role required).
- Admin APIs all rely on server session + admin checks.

### Content submission/edit systems
- `/submit/blog/*` and `/edit/blog/*` routes are middleware-protected.
- Pages consume `useSession` for user identity behavior and author attribution.
- Content APIs enforce server-side session and role/ownership checks.

### Notifications system
- Auth APIs create notifications for:
	- welcome
	- email verification success
	- organization moderation actions
- Notification delivery stack includes DB writes, Socket.IO emit, and SSE stream endpoint that requires authenticated session.

### Cron/protected automation integration
- `app/api/cron/event-deadlines/route.ts` uses bearer `CRON_SECRET` authorization for POST.
- GET manual trigger path has no auth check in this file (directly executes notification logic).

## 8. Edge Behaviors (Observed)

- Credentials login validates selected account type against `accounts.account_type`; mismatch returns UI error and blocks redirect.
- OAuth callback for organization accounts signs them out and redirects with explanatory sign-in message.
- Sign-in page handles URL error mapping for several auth error codes.
- Email verification resend endpoint requires authenticated context; responds with 401 if unauthenticated.
- Verification resend cooldown is 1 hour; returns 429 with minutes remaining.
- Verify-email page supports two modes:
	- direct `verified=1` success
	- token-based API verification
- Forgot-password always returns generic success message when account not found.
- Reset-password validates token hash and expiry; returns generic invalid/expired token error for failures.
- AuthProvider ignores `TOKEN_REFRESHED` events during subscription updates.
- While auth status is loading, multiple components show loading placeholders and avoid rendering protected content.
- `app/admin/layout.tsx` and `app/dashboard/layout.tsx` return `null` if session is absent (middleware expected to redirect unauthenticated users).
- Middleware callback URL is set from `pathname` (without query string in current implementation).

## 9. Notes for AI Understanding

- Authentication approach is Supabase Auth + custom application session enrichment layer.
- Session object is not raw Supabase user; it is normalized by reading:
	- Supabase auth user
	- `accounts`
	- `users` or `organization_profiles`
- Authorization strategy is layered:
	- edge route gate in `middleware.ts`
	- client layout guards for admin/dashboard UX
	- server/API authorization with `getServerSession` and role/account checks
- Role authority source is `accounts.is_admin`; user table role may still exist but is not canonical for authorization.
- Organization lifecycle is moderation-dependent (`pending/approved/rejected`) and directly affects dashboard/profile access.
- OAuth callback includes account materialization/upsert side effects (`accounts`, `users`).
- Email operations (registration verify, resend verify, forgot/reset, password changed) are implemented with Nodemailer SMTP using environment configuration.
- Notifications are integrated into auth lifecycle events and can propagate through DB + realtime channels.

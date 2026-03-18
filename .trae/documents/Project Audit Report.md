# Project Audit Report — icma360

**Date:** February 4, 2025  
**Last status update:** After implementing fixes from this audit.  
**Scope:** Full codebase review for working features, bugs, and illogical processes.

**Remaining (not yet fixed):**
- **3.5** — Reset password link does not include locale (optional).
- **4.2** — `processContentImages` does not support BlockNote object shape (optional).

---

## 1. Project Overview

- **Stack:** Next.js 14, React 18, Supabase Auth, Supabase (Postgres), next-intl (i18n), Blocknote, Socket.io, Cloudinary.
- **Purpose:** Public service site for gender equality in Azerbaijan (blogs/stories, events, vacancies, Organizations, user/Organization auth).
- **Routing:** Locale prefix (`/az`, `/en`) applied in middleware; internal routes are rewritten without prefix.

---

## 2. Critical Issues (Must Fix)

### 2.1 Organization profile and dashboard broken — `organization-token` never set — ✅ FIXED

**Location:** `app/api/organization/profile/route.ts`, `app/api/organizations/[id]/route.ts` (PUT).

**Issue:**  
Organization profile API and Organization update use a cookie `organization-token` (JWT) for auth. This cookie is **never set** anywhere when an Organization signs in. Organizations sign in via **next-auth** (credentials with `accountType: 'organization'`), so they only have a next-auth session; no `organization-token` is issued.

**Effect:**
- Dashboard calls `GET /api/organization/profile` → **401 Unauthorized** for every Organization.
- Organization profile section and profile updates in the dashboard do not work.
- PUT `/api/organizations/[id]` for “Organization owner” also relies on `organization-token`, so only admins can update Organizations; owners cannot.

**Fix options (pick one):**
1. **Preferred:** Use next-auth session in Organization profile and Organization update:
   - In `api/organization/profile`: accept session (e.g. `getServerSession(authOptions)`), require `session?.user?.id` and `session?.user?.isApprovedNGO`, and treat `session.user.id` as Organization `_id` (since Organization login sets `id: organization._id.toString()`).
   - In `api/organizations/[id]` PUT: allow Organization “owner” by `session?.user?.isApprovedNGO && session?.user?.id === params.id` (no `organization-token`).
2. **Alternative:** After successful Organization sign-in, set `organization-token` (JWT with `ngoId`, `type: 'organization'`) in a cookie from the client or in an auth callback. Then keep current API logic.

**Fix applied:** `api/organization/profile` now uses `getServerSession(authOptions)` and `session.user.isApprovedNGO`; `api/organizations/[id]` PUT allows Organization owner via session (no `organization-token`).

---

### 2.2 Vacancies API — invalid location filter — ✅ FIXED

**Location:** `app/api/vacancies/route.ts` (GET).

**Issue:**  
`filter.location = new RegExp(...)` was applied to object field `location`; invalid for structured JSON filtering.

**Fix applied:**  
Location filter now uses `$or` on `location.city`, `location.country`, `location.address` with regex. Creator + location + search combined via `$and` so they do not overwrite each other.

---

### 2.3 Password reset and forgot-password ignore Organizations — ✅ FIXED

**Location:** `app/api/auth/forgot-password/route.ts`, `app/api/auth/reset-password/route.ts`.

**Issue:**  
Both flows only look up **User** by email. Organizations have separate collection and passwords; they never receive a reset email and cannot reset password via “Forgot password”.

**Fix:**
- **Forgot-password:** Look up email in both User and Organization; if found in Organization, generate token and set `passwordResetToken` / `passwordResetExpires` on the Organization document; send same style of email with reset link (and use a route that supports both, e.g. `?type=organization` or detect in reset handler).
- **Reset-password:** Accept optional `accountType: 'user' | 'organization'` (or infer from which collection has the token). Find user or Organization by email + valid token; update password and clear token on the correct model.

**Fix applied:** Organization model has password reset fields; forgot-password and reset-password support both User and Organization; reset link includes `accountType`.

---

### 2.4 Event/Vacancy `createdBy` schema vs usage — ✅ FIXED

**Location:** `lib/models/Event.ts`, `lib/models/Vacancy.ts`, events/vacancies APIs.

**Issue:**  
`createdBy` stored Organization id but schema refs User; populate failed.

**Fix applied:**  
Added optional `createdByNgo` (ref Organization) to Event and Vacancy; `createdBy` made optional. Organization create sets `createdByNgo`, `createdBy: null`. GET/list populate `createdByNgo`; owner checks use `createdBy` or `createdByNgo`. Events and vacancies filter by creator use `$or` on both fields.

---

## 3. High-Priority Issues

### 3.1 User model — hardcoded admin email — ✅ FIXED

**Location:** `lib/models/User.ts` (pre-save hook).

**Issue:**  
`if (this.email === 'hikmat.mammadlii@gmail.com') this.role = 'admin'` hardcodes an admin. `lib/auth.ts` uses `ADMIN_EMAILS` env for admin role. Two sources of truth can diverge.

**Fix applied:**  
Pre-save hook that set role by hardcoded email was removed. Admin is determined only via auth (ADMIN_EMAILS and role).

---

### 3.2 Admin blog list — author filter wrong type — ✅ FIXED

**Location:** `app/api/admin/blogs/route.ts` (GET).

**Issue:**  
`if (author) query.author = { $regex: author, $options: 'i' }`. Blog `author` is an **ObjectId** (ref User), not a string. Regex on ObjectId is not correct and may not behave as intended.

**Fix applied:**  
Filter uses `query.authorName = { $regex: author, $options: 'i' }` so search is by display name.

---

### 3.3 Admin check duplication and hardcoding — ✅ FIXED

**Location:** `app/api/admin/blogs/route.ts` (e.g. `isAdmin`).

**Issue:**  
`session?.user?.email === 'hikmat.mammadlii@gmail.com' || session?.user?.role === 'admin'` duplicates logic and hardcodes an email again.

**Fix applied:**  
`lib/roles.ts` now exports `isAdminSession(session)`. Admin blogs route uses `isAdminSession(session)`.

---

### 3.4 Forgot-password route — noisy and fragile — ✅ FIXED

**Location:** `app/api/auth/forgot-password/route.ts`.

**Issue:**  
- Many `console.log` statements (tokens, user data) — security and noise.  
- Deleting and re-importing the User model to “fix” cache can cause subtle bugs and is fragile.

**Fix applied:**  
Route rewritten: no debug logs, no model re-import. Single User/Organization lookup and token update.

---

### 3.5 Reset password link and locale — ❌ NOT FIXED (optional)

**Location:** `app/api/auth/forgot-password/route.ts` (reset URL).

**Issue:**  
Reset link is `${NEXTAUTH_URL}/auth/reset-password?token=...`. App uses locale-prefixed routes (`/az/...`, `/en/...`). Middleware redirects `/auth/reset-password` to `/az/auth/reset-password`, so it works, but the link does not preserve user’s language.

**Fix (optional):**  
Store preferred locale (e.g. in a short-lived cookie or token payload) and build link as `${NEXTAUTH_URL}/${locale}/auth/reset-password?token=...` so the user lands in their language.

---

## 4. Medium-Priority / Consistency

### 4.1 Blog PATCH — featuredImageBlobId not updated — ✅ FIXED

**Location:** `app/api/blogs/route.ts` (PATCH).

**Issue:**  
`featuredImage` was updated but `featuredImageBlobId` was not, so it could stay stale.

**Fix applied:**  
When `featuredImage` is updated, PATCH now sets `updateData.featuredImageBlobId = getFeaturedImageBlobId(featuredImage) ?? undefined`.

---

### 4.2 processContentImages and BlockNote content shape — ❌ NOT FIXED (optional)

**Location:** `lib/utils/imageUtils.ts` — `processContentImages`.

**Issue:**  
`processContentImages` expects `content` to be an **array** (`content.map`). BlockNote stores content as an **object** with a `blocks` array. For BlockNote content the function returns content as-is and `imageReferences: []`, so image validation does not run on BlockNote content.

**Current behavior:**  
Content is saved as-is; image URLs are persisted. Behavior is OK; only validation/processing of inline images in BlockNote is not applied.

**Fix (optional):**  
Support BlockNote shape: if `content?.blocks` is an array, run the same logic over `content.blocks` (and nested blocks) so blob IDs are validated/normalized.

---

### 4.3 Duplicate setTimeout in blog page — ✅ FIXED

**Location:** `app/blogs/[id]/page.tsx` (around 352–395).

**Issue:**  
Two identical `setTimeout` blocks in the same branch after `setBlog` from API.

**Fix applied:**  
Duplicate removed; API branch has a single `setTimeout` for `setContentReady`.

---

## 5. Illogical or Confusing Processes

### 5.1 Two ways to get a single blog

- **GET /api/blogs?id=...** — Returns one blog; allows public access for approved blogs; for non-approved, requires session and ownership.  
- **GET /api/blogs/[id]** — Always requires auth; returns 401 for unauthenticated; only owner or admin can read.

So “single blog” is split between query-param (used by public blog page and edit flow) and path-param (stricter, auth-only). This is workable but inconsistent. Consider documenting that public/approved single blog is via `GET /api/blogs?id=...` and that `/api/blogs/[id]` is for owner/admin only.

### 5.2 Dashboard access only for approved Organizations

Dashboard requires `session.user.isApprovedNGO`. Regular users and unapproved Organizations are redirected home. So the dashboard is “Organization dashboard” (events/vacancies, profile). This is consistent with “only approved Organizations can create events/vacancies”; just ensure UX (e.g. sign-in or nav) makes it clear that dashboard is for Organizations.

### 5.3 Profile page vs Organization profile — ✅ Resolved

- **User profile:** `/profile` (and `/profile/[id]`) use next-auth session and user profile API.  
- **Organization profile:** Fetched from `/api/organization/profile`; now uses next-auth session (see 2.1). Both flows are consistent.

---

## 6. What’s Working Well

- **Auth:** next-auth with credentials + Google; email verification; separate User vs Organization login; admin via `ADMIN_EMAILS`.
- **Middleware:** Locale prefix, redirect for missing locale, protection of admin/submit/edit/dashboard/profile.
- **Blog (Story) model and rules:** Uses `author` (ObjectId), `authorName`, `isAnonymous`; permission checks and API methods (PATCH user, PUT admin) align with project rules.
- **Notifications:** Correctly split by `userId` vs `ngoId` based on `session.user.isApprovedNGO`.
- **Events/Vacancies listing:** Filtering and pagination; `author=me` for dashboard.
- **Verify-email:** Handles both User and Organization by token.
- **Register:** Handles both User and Organization; validation and verification token flow.

---

## 7. Recommended Fix Order (for remaining items)

1. **3.5 Reset password link and locale (optional)** — Add locale to reset URL if you want users to land in their language.  
2. **4.2 processContentImages BlockNote shape (optional)** — Support `content.blocks` in `imageUtils.ts` if you need validation of inline images in BlockNote content.

All other items from the original list have been fixed.

---

## 8. Summary Table

| Area              | Status   | Notes                                              |
|-------------------|----------|----------------------------------------------------|
| Auth (User/Organization)   | ✅ OK    | Organization profile uses next-auth session                 |
| Middleware        | ✅ OK    | Locale + protected routes                          |
| Blogs API         | ✅ OK    | PATCH sets featuredImageBlobId; admin filter by authorName |
| Events API        | ✅ OK    | createdByNgo added; populate and owner checks updated |
| Vacancies API     | ✅ OK    | Location filter uses city/country/address; createdByNgo |
| Password reset    | ✅ OK    | User and Organization supported; optional: locale in link  |
| Dashboard         | ✅ OK    | Organization profile loads via session                      |
| Notifications     | ✅ OK    | User vs Organization split correct                          |
| i18n / routing    | ✅ OK    | useLocalizedPath, locale in middleware            |

**Still open (optional):** Reset link locale (3.5); BlockNote content shape in processContentImages (4.2).

=== FILE: blog-system.md ===

# Blog System - Deep Current State

## 1. Feature Summary
The blog system is an end-to-end content flow built on Next.js App Router pages and Supabase-backed API routes. It currently includes:

- Public blog discovery and reading (list + detail pages).
- Authenticated 2-step blog submission flow.
- Authenticated blog editing flow for the author (with restrictions by status).
- Blog reaction system (like/dislike) with per-user reaction state and counters.
- Blog view tracking system (total + unique views) with session-based guest deduplication and account-based deduplication.
- User profile integration for blog management (status visibility, edit actions, delete actions).
- Admin moderation and preview flows for approve/reject/delete plus bulk operations.
- Notification integration for moderation changes and reactions.
- In-memory caching for blog list responses.

Storage and backend model is implemented in Supabase (`public.blogs`) with status lifecycle fields, engagement counters, moderation fields, media/image references, and ownership fields.

---

## 2. All User Capabilities

### Public / Unauthenticated Capabilities
- Open blog listing route and browse fetched blogs.
- Use blog search input on listing page (client-side filtering over loaded list).
- Open blog detail route by ID.
- Read blog content in rendered read-only format (BlockNote JSON, sanitized HTML fallback, or raw text fallback).
- Trigger view tracking on approved blog detail pages.
- See current like/dislike counters on detail page.
- Click sign-in CTA from reactions panel.

### Authenticated User Capabilities
- Access protected submission pages.
- Create a blog via 2-step submission flow:
	- Step 1: title + author identity mode (named or anonymous).
	- Step 2: content editor + preview + final submit.
- Persist submission draft data in localStorage between steps.
- Submit blog content to backend (creates pending status).
- Access protected edit routes for a blog ID.
- Edit existing blog data via edit step1/step2 flow and resubmit changes.
- Delete own blogs from profile flow (DELETE endpoint call with ID query param).
- Open profile and view personal blog entries loaded from `/api/blogs/user`.
- See blog status labels in profile blog cards.
- React to blogs with like and dislike (toggle behavior).
- Receive notification records for moderation outcomes and reactions (if another user reacts).

### Admin Capabilities
- Open admin page blog tab and load all blogs through admin API.
- Filter admin blog list by status, search text, author, date range, sort.
- Open admin preview route for a specific blog.
- Approve/reject a blog with admin comment from modal actions.
- Update blog status through admin endpoints.
- Delete blog from admin UI (for non-pending in rendered UI section).
- Execute bulk operations via admin API (`bulk_approve`, `bulk_reject`, `bulk_delete`).

---

## 3. Detailed User Flows

### Blog Creation Flow
1. User enters `/submit/blog`.
2. Page immediately redirects to `/submit/blog/step1`.
3. Middleware enforces authentication for `/submit` path. Unauthenticated users are redirected to sign-in with callback URL.
4. Step 1 initializes state from:
	 - URL query `edit` if present.
	 - Existing `draftBlog` localStorage.
	 - Current session user name.
5. Step 1 form captures:
	 - `title`
	 - `isAnonymous`
	 - `authorName` (optional override)
6. On continue, step1 validates author identity requirements and writes merged `draftBlog` payload to localStorage (preserving any existing content fields).
7. Router pushes to `/submit/blog/step2`.
8. Step 2 loads draft payload from localStorage (or URL search params fallback) and hydrates title/tags/anonymous flag/author/content.
9. User writes content in `BlocknoteEditor`; component callback stores JSON content, generated HTML, and text-length-derived character count.
10. Step 2 submit validates:
	 - Content not empty.
	 - Character count >= 100.
	 - Author name if required in non-anonymous path.
11. Client sends POST `/api/blogs` with JSON body:
	 - `type: blog`
	 - `title`
	 - `content`
	 - `contentHtml`
	 - `tags`
	 - `isAnonymous`
	 - `authorName` when applicable
	 - `media` extracted from content blocks.
12. API `/api/blogs` POST validates session and `emailVerified`.
13. API validates title length and content text length >= 100.
14. API processes image references via image utility functions, validates blob ownership, maps media and featured image blob IDs.
15. API inserts into `blogs` table with status `pending`.
16. API returns success payload with created blog metadata.
17. Client clears localStorage draft keys and shows success state.
18. Client redirects to `/profile` after timeout.

### Blog Editing Flow
There are two edit entry mechanisms currently present.

#### Flow A: Dedicated edit routes (`/edit/blog/[id]`)
1. User opens `/edit/blog/[id]`.
2. Page stores `currentEditBlogId` and pushes to `/edit/blog/[id]/step1`.
3. Step1 tries to restore `editBlogData` from localStorage when `inBlogEditFlow` is set.
4. If local state is not valid, step1 fetches `/api/blogs?id=[id]`.
5. API GET with `id` allows access if blog is approved (public) or if requester owns blog / is admin for non-approved entries.
6. Step1 performs additional front-end permission check comparing fetched `blog.author`/`blog.authorName` against session user fields.
7. Step1 writes normalized `editBlogData` to localStorage and sets `currentBlogEditId`.
8. On continue, step1 saves current fields to localStorage and pushes to `/edit/blog/[id]/step2` while setting navigation session flag.
9. Step2 loads `editBlogData` from localStorage only.
10. User edits content in BlockNote editor; updates are persisted back into `editBlogData`.
11. Submit sends PATCH `/api/blogs` with:
		- `id`
		- `title`
		- `content`
		- `contentHtml`
		- `isAnonymous`
		- `authorName`
		- `status: pending`
		- `media` (image URLs)
12. API PATCH verifies ownership (`author_id == session.user.id`) and blocks approved blog edits.
13. API PATCH validates text length >= 100 when content provided.
14. API PATCH updates fields and if existing status is rejected and requested status is pending, clears `admin_comment`.
15. Client clears edit localStorage keys, shows success state, and redirects to `/profile`.

#### Flow B: Submission pages with `edit` query (`/submit/blog/step1?edit=[id]`)
1. Step1 detects `edit` query and sets `currentBlogEditId`.
2. Step1 fetches `/api/blogs?id=[id]`, hydrates form, and stores merged `draftBlog` with `editId`.
3. Step2 detects edit mode and calls load function fetching `/api/blogs?id=[id]`.
4. Step2 edits content similarly to create flow and persists to local draft.
5. Final submit path in this component still calls POST `/api/blogs` (create endpoint), not PATCH.
6. This edit-query support exists in code paths and state handling.

### Blog Viewing Flow
#### Blog listing (`/blogs`)
1. On mount, page fetches `/api/blogs?page=1&limit=100`.
2. API list defaults status filter to `approved` if not provided.
3. Response maps from `results` array into local card model.
4. UI applies additional client-side filter `status === approved`.
5. Search bar filters loaded list by title, authorName, excerpt, and content string fields.
6. Empty result section renders either search-empty or total-empty message.

#### Blog detail (`/blogs/[id]`)
1. Detail page first checks `submittedBlogs` localStorage cache for matching ID.
2. If not found, fetches `/api/blogs?id=[id]`.
3. API returns blog if approved. For non-approved, requires authenticated owner/admin.
4. Detail page maps fetched fields into local `Blog` state (uses `_id` and `id` handling).
5. Content rendering precedence:
	 - Object content -> `BlocknoteReadOnly`.
	 - Else sanitized `contentHtml`.
	 - Else plain text.
6. View tracker component mounts for approved blogs when `_id` exists and passes item type `blog`.
7. Reactions component mounts for approved blogs after content-ready state.
8. Error state rendered when blog is unavailable.

### Blog Reaction Flow (like/dislike)
1. `BlogReactions` receives blogId and initial counts.
2. If session loading: skeleton reaction strip rendered.
3. If no session user: counters shown + sign-in button.
4. If authenticated: component performs one-time GET to both endpoints:
	 - `/api/blogs/[id]/like`
	 - `/api/blogs/[id]/dislike`
5. Response sets `hasLiked`/`hasDisliked` and current counters.
6. Like action:
	 - POST `/api/blogs/[id]/like`.
	 - Server removes previous dislike by same user if present.
	 - Server toggles like (like or unlike).
	 - Server recalculates engagement score and updates arrays/counters.
	 - Server optionally inserts `blog_like` notification for author when actor != author.
7. Dislike action mirrors like flow against dislike endpoint and can remove prior like.
8. Client updates counts and booleans from returned payload.

### Admin Preview / Moderation Flow
1. Admin UI blog tab fetches `/api/admin/blogs` with active filters and sort.
2. Admin can click preview link to `/admin/preview/blog/[id]`.
3. Preview page fetches `/api/admin/blogs/[id]` and renders full content.
4. For pending items, preview page displays approve/reject buttons and opens modal for comment.
5. Modal submit sends PUT `/api/admin/blogs/[id]` with status and admin comment.
6. Endpoint validates admin session and updates moderation fields (`status`, `admin_comment`, `reviewed_at`, `reviewed_by`).
7. Endpoint triggers `NotificationService.notifyBlogStatus` for blog author.
8. Preview page updates local state from response and closes modal.

Additional admin moderation path in admin page:
- Admin page uses PUT `/api/admin/blogs` for single-item approve/reject.
- Admin page uses PATCH `/api/admin/blogs` for bulk operations.

---

## 4. Full Code Mapping

### Pages
- `/blogs` -> `app/blogs/page.tsx`
- `/blogs/[id]` -> `app/blogs/[id]/page.tsx`
- `/submit/blog` -> `app/submit/blog/page.tsx` (redirect)
- `/submit/blog/step1` -> `app/submit/blog/step1/page.tsx`
- `/submit/blog/step2` -> `app/submit/blog/step2/page.tsx`
- `/submit/blog/layout` -> `app/submit/blog/layout.tsx`
- `/edit/blog/[id]` -> `app/edit/blog/[id]/page.tsx` (redirect)
- `/edit/blog/[id]/step1` -> `app/edit/blog/[id]/step1/page.tsx`
- `/edit/blog/[id]/step2` -> `app/edit/blog/[id]/step2/page.tsx`
- `/edit/blog/layout` -> `app/edit/blog/layout.tsx`
- `/admin` blog management section -> `app/admin/page.tsx`
- `/admin/preview/blog/[id]` -> `app/admin/preview/blog/[id]/page.tsx`
- `/profile` blogs tab integration -> `app/profile/page.tsx`
- Home page recent blogs section -> `app/page.tsx`

### Components
- `components/BlogCard.tsx`
- `components/BlogPostCard.tsx`
- `components/BlogReactions.tsx`
- `components/ViewTracker.tsx`
- `components/BlocknoteEditor.tsx`
- `components/BlocknoteReadOnly.tsx`
- `components/Profile/Blogs.tsx`
- `components/RecentCommunityContent.tsx`

### API Routes
- `app/api/blogs/route.ts`
	- GET list and single-by-query-id.
	- POST create.
	- PATCH user edit.
	- PUT admin review path and alternate user edit path.
	- DELETE owner/admin delete by query `id`.
- `app/api/blogs/user/route.ts`
	- GET current user blogs, optional status filter.
- `app/api/blogs/[id]/route.ts`
	- GET single by dynamic id for authenticated owner/admin.
- `app/api/blogs/[id]/like/route.ts`
	- POST toggle like; GET like status.
- `app/api/blogs/[id]/dislike/route.ts`
	- POST toggle dislike; GET dislike status.
- `app/api/blogs/[id]/view/route.ts`
	- POST track view; GET stats snapshot.
- `app/api/admin/blogs/route.ts`
	- GET list + filters.
	- PUT single moderation update.
	- PATCH bulk operations.
- `app/api/admin/blogs/[id]/route.ts`
	- GET single blog.
	- PUT status/comment moderation update.
	- DELETE permanent delete.

### Services / Utils
- `lib/cache.ts` (blogs list cache + invalidation)
- `lib/services/notificationService.ts` (blog status notifications, generic notification creation)
- `lib/utils/imageUtils.ts` (content image extraction, blob ownership validation, media mapping)
- `lib/auth/server.ts` and `lib/auth/client.ts` session shape and auth resolution
- `lib/roles.ts` admin role check helper
- `lib/useLocalizedPath.ts` route generation used in UI blog links
- `lib/metadata/blogs.ts` blog metadata generation for SEO
- `lib/analytics.ts` `trackBlogRead` event helper

---

## 5. Data Flow & State

### Primary Blog Data Model (database)
From `public.blogs` in schema:

- `id` uuid primary key
- `mongo_id` text unique (legacy mapping)
- `title` text
- `content` jsonb
- `content_html` text
- `author_id` uuid ref users
- `author_name` text
- `tags` text[]
- `abstract` text
- `status` enum-like text: pending | approved | rejected
- `admin_comment` text
- `is_anonymous` boolean
- `reviewed_at`, `reviewed_by`
- `media` jsonb
- engagement fields:
	- `views`
	- `unique_views`
	- `viewed_by` uuid[]
	- `likes`
	- `liked_by` uuid[]
	- `dislikes`
	- `disliked_by` uuid[]
	- `engagement_score`
- image fields:
	- `featured_image`
	- `featured_image_blob_id`
- timestamps: `created_at`, `updated_at`

### Read Queries
- Public list uses `GET /api/blogs` with optional `page`, `limit`, `search`, `tags`, `status`.
- Public detail uses `GET /api/blogs?id=[id]`.
- Profile user list uses `GET /api/blogs/user`.
- Admin list uses `GET /api/admin/blogs` with filters and sorting.
- Admin single preview uses `GET /api/admin/blogs/[id]`.
- Reaction status uses GET like/dislike endpoints.
- View count fetch can use GET `/api/blogs/[id]/view`.

### Mutations
- Create: POST `/api/blogs`.
- User edit: PATCH `/api/blogs`.
- Alternate edit/admin status path: PUT `/api/blogs`.
- User/admin delete: DELETE `/api/blogs?id=[id]`.
- Reactions: POST like/dislike subroutes.
- View tracking: POST view subroute.
- Admin moderation single: PUT `/api/admin/blogs` or PUT `/api/admin/blogs/[id]`.
- Admin moderation bulk: PATCH `/api/admin/blogs`.
- Admin delete: DELETE `/api/admin/blogs/[id]`.

### Client State Sources
- React component state per page/component.
- localStorage keys used heavily in submit/edit flows:
	- `draftBlog`
	- `editBlogData`
	- `currentBlogEditId`
	- `currentEditBlogId`
	- `submittedBlogs` (detail page read path).
- sessionStorage keys:
	- `inBlogEditFlow`
	- `navigatingWithinBlogFlow`
	- `viewed_blog_[id]` via `ViewTracker` pattern.
- API-side in-memory LRU cache for list responses (`cache.blogs`).

### Data Shape Handling in UI
Current UI code consumes mixed naming variants and often maps both:
- `id` and `_id`
- `author_name` and `authorName`
- `created_at` and `createdAt`
- `content_html` and `contentHtml`

Several components include fallback mapping logic across these variants when reading API payloads.

---

## 6. Interaction With Other Systems

### Auth System
- Middleware protects `/submit`, `/edit/blog`, `/dashboard`, `/profile`, `/admin` from unauthenticated access.
- Session user includes:
	- `id`
	- `role` (user/admin)
	- `emailVerified`
	- `accountType` (user/organization)
	- `organizationStatus`.
- Blog POST endpoint blocks creation when `emailVerified` is false.

### Profile System
- Profile page loads user blogs using `/api/blogs/user`.
- Profile blog cards expose per-blog status, admin comment, edit actions (pending/rejected), and delete action.
- Deletion invokes `/api/blogs?id=[id]` DELETE and updates local list state.
- Profile stats endpoint aggregates blog status/engagement from blogs table.

### Admin System
- Admin dashboard blog tab retrieves and moderates blog submissions.
- Admin preview route loads full blog content and moderation controls.
- Admin list and preview use two related admin API route groups.
- Admin updates write moderation fields and can generate notifications.

### Notifications System
- Reactions endpoint inserts `notifications` rows for `blog_like` and `blog_dislike` when actor is not owner.
- Admin moderation endpoint path in `/api/admin/blogs/[id]` uses `NotificationService.notifyBlogStatus` and stores types `blog_approved` / `blog_rejected`.
- Admin moderation endpoint in `/api/admin/blogs` inserts notifications with type `blog` or `blog_status` depending on action path.
- Notification service also emits real-time updates through Socket and SSE helpers.

### Image / Media System
- Blog create/edit APIs call image utility functions to:
	- parse image references from content
	- validate blob ownership (`image_blobs.uploaded_by == user`)
	- map blob references in media arrays
	- derive featured image blob id.

### SEO / Metadata System
- Blog metadata helper fetches a blog record and generates SEO metadata and article schema.
- Canonical path pattern uses `/blogs/[id]`.

### Analytics System
- `trackBlogRead` exists in analytics utilities for GA event emission (`read_blog` action).

---

## 7. Role Behavior

### user
- Can view approved blogs publicly.
- Can create blogs when authenticated and email verified.
- Can edit own non-approved blogs through edit flow/API ownership checks.
- Cannot edit approved blogs through PATCH guard.
- Can delete own blogs.
- Can react to blogs when authenticated.
- Can view own blog records in profile flow.

### admin
- Inherits user capabilities.
- Can pass owner restrictions in certain read/delete checks.
- Can access admin blog list/preview endpoints through admin session checks.
- Can approve/reject/pending status updates and add admin comment.
- Can delete blogs through admin API routes.
- Can perform bulk moderation operations.

### organization
Organization behavior uses accountType and organizationStatus fields from session.

- Organization accounts are authenticated users in middleware-protected routes.
- Blog APIs generally enforce by ownership/session, not a separate organization-specific blog table.
- Profile page has explicit condition for rendering the blogs tab content:
	- Blogs tab component render condition checks `accountType === organization` and `organizationStatus !== approved`.
- Profile stats API redirects approved organizations toward organization stats endpoint.

---

## 8. Edge Behaviors (Observed)

### Loading States
- Blog list uses a dedicated loading state component and skeleton card placeholders.
- Blog detail has loading state before blog fetch resolves.
- Detail content has `contentReady` gating and post-load spinner section.
- Reactions component has session-loading skeleton and button-level loading spinner.
- Edit and submit pages show loading states while restoring drafts or fetching edit data.
- Admin preview has loading and error states.

### Empty States
- Blog listing shows contextual empty state:
	- Search empty with query echo.
	- Global empty when no blogs.
- Profile blog tab shows empty illustration and submit CTA when no records.
- Admin blog list shows empty text when no filtered results.

### Failed Submission / Error Handling
- Create/edit steps set local error strings and render inline error cards.
- API errors surfaced by reading JSON `error` field and showing fallback string.
- Detail route renders explicit not-found style error component when no blog is resolved.
- Edit step1 includes access-denied style message if front-end author check fails.

### Invalid Edit Access Behavior
- Middleware blocks unauthenticated access to edit route.
- API PATCH blocks if blog not found for owner or if approved status.
- API GET with query id returns 404 for non-owner/non-admin when non-approved.
- Dynamic `[id]` GET route explicitly returns 403 for unauthorized user.

### Duplicate Actions / Rapid Click Behavior
- Reactions buttons set `isLoading` and disable while request is in flight, limiting repeated clicks during pending request.
- View tracker uses:
	- `hasTrackedRef` to avoid duplicate effect execution.
	- sessionStorage key for guest deduplication (`viewed_blog_[id]`).
	- `viewed_by` UUID array for authenticated unique count deduplication.

### Status/Field Handling Behaviors
- List endpoint defaults to `status=approved` unless query overrides it.
- Detail page only renders reactions and tracker for approved status.
- Edit API can clear admin comment when rejected blog is resubmitted to pending.
- Front-end mappings frequently reference both camelCase and snake_case variants.
- Code paths use both `id` and `_id` fields across admin/profile/blog pages.

---

## 9. Notes for AI Understanding

### Patterns Used
- App Router client pages + route handlers.
- Supabase admin client in APIs.
- Hybrid protection:
	- route-level auth via middleware.
	- ownership/role enforcement inside API handlers.
- Multi-source state hydration:
	- URL params
	- localStorage
	- API fetch.
- Reusable shared UI states (`LoadingState`, `ErrorState`, `SuccessState`).

### Multi-Step Form Behavior
- Submission flow is split into step1/step2 pages.
- Step transition preserves draft payload in localStorage.
- Step2 continuously tracks editor-derived character count and writes back to draft.
- Edit flow duplicates this concept with separate localStorage namespace (`editBlogData`) and session flags to preserve data while navigating between edit steps.

### Draft vs Published/Moderated State Handling
- There is no separate database draft status field in blogs table.
- Draft concept in current implementation is browser-local (localStorage) during form completion.
- Persisted records use moderation statuses in DB:
	- `pending`
	- `approved`
	- `rejected`.
- New submissions are inserted as `pending`.
- User edits of rejected/pending records use update endpoints and can set or reset to `pending`.
- Approved records are protected against user edit in PATCH flow.
- Admin moderation writes status and moderation metadata.

### End-to-End Status Lifecycle in Code
- Create -> pending.
- Admin review -> approved or rejected.
- Rejected edit resubmission -> pending (admin comment can be cleared in update path).
- Approved content remains viewable publicly and reaction/view tracking is active.


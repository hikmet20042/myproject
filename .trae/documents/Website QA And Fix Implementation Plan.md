## Scope

* Audit and fix auth, middleware, API validations, secrets handling, and auth UI.

* Verify protected routes, content flows, and error messaging across the site.

## Key Fixes

1. Auth & Roles

* Move hard-coded admin email override from `session` callback to a durable source:

  * Either persist admin role in DB and read it in `jwt` callback, or check against an env-based allowlist.

* Remove duplicate NextAuth type augmentation in `lib/auth.ts`; keep only `types/next-auth.d.ts`.

1. Secrets & Tokens

* Remove fallback secrets:

  * Replace `process.env.CRON_SECRET || 'your-secret-key-here'` with strict env requirement.

  * Replace `process.env.NEXTAUTH_SECRET || 'fallback-secret'` in NGO token verification with strict env requirement.

1. API Validation Consistency

* Blogs: Add content-length/type validation to `PATCH` (align with `POST`/`PUT`).

* Events: Add `description` minimum-length check in `POST` and `[id]/PUT` updates (strip HTML if needed).

* Vacancies: Add `description` minimum-length check in `POST` and `[id]/PUT` updates; optionally validate `applicationInstructions` length.

1. Middleware Simplification

* Consolidate authorization logic by removing duplication between `checkAuthorization` and `withAuth({ callbacks.authorized })`. Keep one source of truth and ensure language rewrites remain intact.

1. Auth UI Improvements

* Sign-in page:

  * Add email format and basic password validation with inline errors.

  * Read and display `message` query (used after reset-password).

  * Add loading/disable state for Google sign-in to prevent double clicks.

## Verification Plan

* Run the app locally and validate:

  * Admin route gating and role propagation through JWT.

  * Blog create/edit (`POST`/`PATCH`/`PUT`) validation behavior.

  * Event and Vacancy create/update description checks.

  * NGO token flows after removing fallback secret.

  * Sign-in UX and error messages (including `message` query).

* Add targeted unit/integration tests for API validation logic and middleware route protection.

## Deliverables

* Code changes implementing the above fixes.

* Brief test results demonstrating validation and route protection working as intended.

* Notes on any further issues discovered during manual QA.

## Next Step

* Proceed to implement the fixes and run a local QA pass, then share diffs and results for review.


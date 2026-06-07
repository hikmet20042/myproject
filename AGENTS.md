# AGENTS.md — icma360

## Project

- Next.js 14 app (React 18, TypeScript strict) deployed on Netlify with `@netlify/plugin-nextjs`.
- Node 20.x required. `output: 'standalone'` in next.config.js.
- Path alias: `@/*` → `./*`

## Commands

```
npm run dev              # Start dev server
npm run build            # Production build (runs next-sitemap postbuild)
npm run lint             # Next.js ESLint
npm run check:ui-patterns  # Custom UI pattern check
npm run lint:architecture  # Custom architecture boundary check
npm run lint:system      # Full: lint + ui-patterns + architecture
npm run hooks:install    # Install git pre-commit hooks (run once per clone)

# Playwright E2E
npm run test:e2e              # Full suite (workers=2 local, 1 in CI)
npm run test:e2e:ui           # Playwright UI mode
npm run test:e2e:debug        # Playwright debug mode
SMOKE=1 npx playwright test <files...> --workers=1 --max-failures=3   # Minimal smoke run
```

Pre-commit runs `npm run lint:system`. Hooks live in `.githooks/`.

## Architecture Ownership

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Features | `features/<feature>/` | Domain logic, services, types, hooks |
| Containers | `components/containers/` | Data fetching, auth, orchestration. Filename must end with `Container` |
| Shared UI | `components/shared/` | Reusable presentational components |
| Base UI | `components/ui/` | Pure presentational building blocks |
| Hooks | `hooks/` | Reusable application-level hooks |
| Lib | `lib/` | Framework-agnostic utilities, API clients, helpers |

## Hard Rules (enforced by ESLint + architecture scripts)

- **UI components** (`components/ui/`, `components/shared/`) must NOT import: `@tanstack/react-query`, `@/lib/auth/client`, `axios`, `@/lib/*Queries`, `@/lib/admin-api`, `@/lib/apiClient`, or feature services/contexts/providers.
- **Containers** own data fetching, query/mutation/session hooks, permission checks, and side effects.
- **API routes** (`app/api/**/route.ts`) must use `successResponse`/`errorResponse` from `lib/apiResponse` — NOT `NextResponse.json`.
- **Auth redirects** and `useSession` calls belong in layout guards, not in leaf UI components.
- **Feature boundaries**: features must NOT import another feature's private modules directly. Use shared layers for cross-feature reuse.
- **Naming**: Containers end with `Container`, rows/lists with `Item`, sections with `Section`, cards with `Card`.

## Auth & Routing

- Supabase SSR auth via `@supabase/ssr`.
- `middleware.ts` handles: language prefix stripping (`/az/`, `/en/` → canonical), auth redirects, account-type routing (user/organization/admin), onboarding enforcement.
- Account types: `user`, `organization`, `admin`. Organizations have `moderation_status` (pending/approved).
- Routes requiring auth: `/submit/*`, `/edit/blog/*`, `/dashboard/*`, `/profile/*`, `/saved/*`, `/notifications/*`, `/organization/*`, `/admin/*`, `/onboarding/*`.

## Key Integrations

- **Database**: Supabase/PostgreSQL. Migrations in `supabase/migrations/`, schema in `supabase/schema.sql`.
- **Email**: Brevo SMTP (nodemailer).
- **Images**: Cloudinary for uploads.
- **Real-time**: Socket.IO for notifications (optional, `NEXT_PUBLIC_ENABLE_SOCKET`).
- **SEO**: `next-sitemap` runs postbuild. INDEXNOW support via `scripts/setup-indexnow.js`.

## Env Setup

Copy `.env.example` → `.env.local`. Requires Supabase URL/anon key, Cloudinary, Brevo SMTP credentials.

## Notes

- `opencode.json` references `docs/guidelines.md` and `docs/security.md` — these files do not exist. The actual architecture doc is `docs/architecture-guidelines.md`.
- `pages/` directory contains legacy API routes only. All app routes use the `app/` directory.
- Playwright is configured (`playwright.config.ts`) but the `tests/` directory it expects does not exist yet — no e2e tests have been written.
- `e2e/` directory is empty and gitignored.
- `test-*.js` patterns are gitignored; `test-admin-audit.js` and `test-org-audit.js` exist on disk (local scripts).

## Playwright Test Architecture

- **Auth bypass:** `middleware.ts` checks `ENABLE_TEST_AUTH_MODE=1` and short-circuits Supabase auth using `X-Test-Role` / `X-Test-User-Id` / `X-Test-Org-Status` headers (only when env var is set, so production is unaffected). `playwright.config.ts` sets the env var on the webServer automatically.
- **Auth helper:** Use `mockTestRoleAuth(page, 'admin' | 'user' | 'organization', { orgStatus })` from `tests/helpers/auth.ts`. Combines the header bypass with `/auth/v1/user` and (for org) `/api/organizations/me` route mocks.
- **API mocking:** `tests/helpers/api.ts` exports `mockApi`, `mockApiRoute`, `mockBlogsList`, `mockEventsList`, `mockVacanciesList`, `mockProfileStats`, etc.
- **Fixtures:** `tests/fixtures/{blog,event,vacancy,organization,notification}.ts` export `makeX(overrides)` and `makeXList(n, overrides)` factories.
- **New coverage:** `tests/specs/notifications.spec.ts`, `i18n.spec.ts`, `seo-meta.spec.ts`, `mobile-viewport.spec.ts` (mobile project must be added to `playwright.config.ts` to enable the last one).

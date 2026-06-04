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

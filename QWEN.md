# ICMA360 — Project Context

## Project Overview

**icma360** is a Next.js 14 public service website focused on promoting gender equality in Azerbaijan. The platform provides resources including job vacancies, events, blog posts, and organization profiles. It supports multi-language content (Azerbaijani `az` and English `en`), with user authentication via Supabase and OAuth (Google).

The site is deployed on **Netlify** and uses **Supabase** as its primary backend/database (PostgreSQL). It also integrates Cloudinary for image hosting, Brevo for email delivery, and supports AI providers (OpenRouter, Gemini, Mistral).

### Key Technologies

| Category | Stack |
|----------|-------|
| **Framework** | Next.js 14 (App Router + Pages Router hybrid) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS, PostCSS |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth, NextAuth, Google OAuth |
| **State Management** | TanStack React Query |
| **Real-time** | Socket.IO, SSE |
| **Rich Text Editor** | Blocknote (Tiptap-based) |
| **Analytics** | Google Analytics |
| **Deployment** | Netlify (standalone output) |
| **Email** | Nodemailer + Brevo SMTP |
| **Image Storage** | Cloudinary |

## Project Structure

```
app/                  # Next.js App Router (main routing)
├── about/            # About page
├── admin/            # Admin panel routes
├── api/              # API routes (server-side endpoints)
├── auth/             # Authentication pages (signin, callback)
├── blogs/            # Blog listing and individual posts
├── dashboard/        # Organization dashboard
├── edit/             # Blog editing routes
├── notifications/    # User notifications
├── onboarding/       # Role selection and organization onboarding
├── organization/     # Organization-specific pages
├── organizations/    # Public organization directory
├── profile/          # User profile management
├── resources/        # Vacancies, events, and other resources
├── saved/            # Saved/bookmarked items
├── submit/           # Content submission forms
├── users/            # User-related pages
├── layout.tsx        # Root layout
├── globals.css       # Global styles
└── page.tsx          # Home page

components/           # Reusable React components
├── admin/            # Admin-specific components
├── containers/       # Container components (data-fetching boundary)
├── feedback/         # User feedback components
├── forms/            # Form components
├── layout/           # Layout components
├── shared/           # Shared generic components
└── ui/               # Base UI primitives (dumb components)

features/             # Feature-based modules (domain-driven)
├── admin/            # Admin feature module
├── blogs/            # Blog feature module
├── dashboard/        # Dashboard feature module
├── events/           # Events feature module
├── forms/            # Feature-specific forms
├── notifications/    # Notifications feature module
├── profile/          # Profile feature module
├── ui-state/         # Shared UI state management
├── vacancies/        # Vacancies feature module
└── ui-state.ts       # Global UI state definitions

lib/                  # Shared library code
├── auth/             # Authentication utilities
├── design/           # Design system utilities
├── email-templates/  # Email template files
├── events/           # Event-related utilities
├── feed/             # Feed utilities
├── metadata/         # SEO metadata generation
├── security/         # Security-related utilities
├── services/         # External service integrations
├── supabase/         # Supabase client and helpers
└── utils/            # General utilities

pages/api/            # Legacy Pages Router API routes
public/               # Static assets (images, fonts, etc.)
scripts/              # Custom build/analysis scripts
supabase/             # Database migrations and schema
e2e/                  # End-to-end tests (Playwright, empty directory)
```

## Architecture Patterns

### Container/Presentational Pattern
The codebase enforces a strict **Container/Presentational** separation:
- **`components/ui/` and `components/shared/`** — Presentational (dumb) components. Must NOT import query logic, auth logic, or API clients.
- **`components/containers/`** — Container components that bridge data fetching and presentation.
- **`features/`** — Feature modules containing business logic, services, contexts, and providers.

### Role-Based Access Control
Three user types with distinct access:
1. **`user`** — Regular users (can submit blogs, manage profile)
2. **`organization`** — Organization accounts (dashboard, vacancies, events)
3. **`admin`** — Admin users (full moderation and management access)

Authorization is handled in `middleware.ts` which:
- Manages language prefix redirection (`/az/*`, `/en/*` → canonical non-prefixed routes)
- Redirects unauthenticated users to sign-in for protected routes
- Routes users to onboarding if `account_type` is `null`
- Blocks regular users from organization-only routes (and vice versa)
- Checks organization moderation status (`pending` vs `approved`)

### ESLint Architecture Rules
The `.eslintrc.js` enforces architecture boundaries:
- UI components cannot import React Query, auth clients, or API clients
- Non-layout files should not use `useSession()` or `router.push/replace` for auth
- API routes must use `successResponse/errorResponse` from `lib/apiResponse`
- Auth ownership belongs in layout guards, not scattered across UI components

## Commands

### Development
```bash
npm run dev              # Start development server (Next.js dev)
npm run build            # Production build (standalone output)
npm run start            # Start production server
```

### Linting & Quality
```bash
npm run lint             # Next.js ESLint (core-web-vitals)
npm run lint:architecture  # Architecture lint checks
npm run check:ui-patterns  # UI pattern validation
npm run lint:system      # Full lint: lint + architecture + UI patterns
```

### Git Hooks
```bash
npm run hooks:install    # Install pre-commit git hooks (runs lint:system)
```

### Post-Build
```bash
npm run postbuild        # Runs next-sitemap to generate sitemap.xml and robots.txt
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, for sitemap generation) |
| `NEXTAUTH_SECRET` | NextAuth session secret |
| `MONGODB_URI` | MongoDB connection string (legacy/optional) |
| `CLOUDINARY_URL` | Cloudinary credentials |
| `EMAIL_SERVER_*` | Brevo SMTP credentials |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth credentials |
| `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `MISTRAL_API_KEY` | AI provider keys |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics tracking ID |
| `NEXT_PUBLIC_ENABLE_SOCKET` | Enable Socket.IO real-time features |

## SEO & Performance

- **Sitemap**: Auto-generated via `next-sitemap` (fetches dynamic routes for vacancies, events, blogs, organizations)
- **Robots.txt**: Auto-generated with appropriate disallow rules for admin/auth/dashboard paths
- **Security headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Image optimization**: AVIF/WebP formats, remote patterns for external image hosts
- **Caching**: Static assets (1 year), images (1 week), API responses (1 min + revalidation)
- **OpenGraph images**: Custom opengraph-image.tsx per route

## Database

- **Supabase (PostgreSQL)** is the primary database
- Migrations are stored in `supabase/migrations/`
- Schema definition in `supabase/schema.sql`
- Row-Level Security (RLS) is enabled on all tables
- Tables include: `accounts`, `organization_profiles`, `blogs`, `vacancies`, `events`, `blog_views`, `blog_reactions`, `image_blobs`, and others

## Code Style & Conventions

- **TypeScript strict mode** enabled
- **Path aliases**: `@/*` maps to project root
- **No direct "Loading..." text** — use `LoadingState` component
- **No `fallback={null}`** — use deliberate empty state components
- **Error handling**: Preserve data on errors, don't reset to empty arrays in catch blocks
- **Component separation**: UI components are pure; data fetching lives in containers/features
- **Auth logic**: Centralized in layout guards and middleware, not duplicated in UI components

## Notable Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Auth routing, language prefix handling, role-based access control |
| `next.config.js` | Next.js config: headers, caching, redirects, webpack optimization, security |
| `.eslintrc.js` | Enforces architecture boundaries and coding conventions |
| `next-sitemap.config.js` | Sitemap generation with dynamic route fetching |
| `tailwind.config.js` | Design system with blue/green color palette (legacy colors remapped) |
| `tsconfig.json` | TypeScript strict configuration with path aliases |

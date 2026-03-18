## Scope
- Convert remaining user‑facing string literals to `t('...')` across UI code.
- Add missing keys to `public/locales/en/common.json` and `public/locales/az/common.json`.
- Normalize all internal navigation to use `useLocalizedPath` (links, breadcrumbs, router pushes).

## Standards
- Key naming: `domain.section.item` (e.g., `header.signIn`, `resources.categories.educationalMaterials.title`).
- Interpolation: use `t('key', { param })` for dynamic pieces.
- Fallbacks: keep `t('key') || 'Readable English'` only temporarily where helpful; aim to remove fallbacks after populating locales.
- Links: use `localePath('/path')` for internal routes; keep external/API intact.

## Identification & Conversion
- Run codewide scans to find:
  - JSX text nodes and raw strings inside components/pages.
  - `Link`/`ButtonLink`/`Breadcrumb` items with `href: '/...'`.
  - `router.push('/...')`, `window.location.href = '/...'`, programmatic navigations.
- Prioritize high‑traffic areas:
  - `app`: home, about, blogs (list/detail), resources (list/detail), events/vacancies/Organizations (list/detail), submit/edit flows, auth pages, dashboard, admin.
  - `components`: `ui/*`, `shared/*`, feature components (cards, headers, breadcrumbs, filters, modals, forms).
- Convert literals to `t('...')`, add keys to both locale files.
- Replace internal links and breadcrumb entries with `localePath(...)`.

## Locales Update
- Augment `public/locales/en/common.json` and `public/locales/az/common.json` with new keys.
- Preserve existing structure; group additions under relevant domains.
- Ensure parity between `en` and `az` for every added key.

## Verification
- Dev run; navigate all major flows in both languages:
  - Header, footer, nav menus
  - Auth (signin/register/forgot/reset)
  - Resources (materials/organizations/events/vacancies), detail pages
  - Blogs (list/detail), submit/edit
  - Dashboard/admin key screens
- Confirm all labels render localized text and all internal links preserve prefix.
- Fix any missing keys or broken paths discovered.

## Deliverables
- Updated UI files with `t('...')` applied.
- Updated locale files (`en/az`), with consistent keys and translations.
- Normalized internal links and programmatic navigation.
- Short QA checklist/results.

## Next Step
- Proceed with repo‑wide scan and incremental conversions, updating locales and links as described, then share diffs and results.
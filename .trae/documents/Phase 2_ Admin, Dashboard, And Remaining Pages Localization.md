## Scope
- Normalize internal routes and localize labels across admin, dashboard, and remaining listings/detail pages.
- Add any missing locale keys in `en`/`az` to keep parity.

## Targets
1. Admin
- `app/admin/layout.tsx`: replace `router.push('/auth/signin?callbackUrl=/admin')`, `router.push('/')` with `useLocalizedPath`; localize any hard-coded UI strings.
- `app/admin/page.tsx`: ensure preview/detail links use `useLocalizedPath` and labels use `t('...')`.
- `app/admin/preview/events/[id]/page.tsx`, `app/admin/preview/blog/[id]/page.tsx`: localize breadcrumbs/headers, normalize internal links.

2. Dashboard
- `app/dashboard/events/create/page.tsx`: replace `router.push('/dashboard/events?created=true')` with `useLocalizedPath` and localize success/error messages.
- Other dashboard pages (events edit, NGOs dashboard if present): convert navigations and labels to `t('...')`.

3. Listings & Detail Pages
- `app/resources/events/page.tsx`: ensure all per-card `Link` anchors use `useLocalizedPath` (primary card link). Verify we updated the button link already.
- `app/resources/vacancies/page.tsx`: normalize any per-card internal links and localize category/type labels if literals remain.
- `app/resources/ngos/page.tsx`: confirm all CTA/profile links use `useLocalizedPath` and localize remaining literals.
- `app/blogs/page.tsx`: confirm list uses `BlogCard` (now localized) and localize any remaining page-level strings.
- `app/resources/materials/page.tsx`: confirm CTA links localized; ensure any page-level literals are under `t('resources.materials.*')`.

4. Locale Files
- Add missing keys:
  - `common.back`, `common.backTo`, `common.note`, `common.loading`, `common.tryAgain` if used.
  - `vacancies.notFound`, `vacancies.notFoundText`, `vacancies.backToVacancies`, plus any dashboard/admin messages we localize.
  - Ensure `en` and `az` parity.

## Verification
- Navigate admin and dashboard flows in both languages; confirm redirects respect language prefix and UI strings are localized.
- Test listings (events/vacancies/ngos) and detail pages’ links; confirm language prefix and localized labels.
- Fix any missing keys discovered.

## Deliverables
- Code diffs normalizing links and adding `t('...')`.
- Updated `public/locales/en/common.json` and `public/locales/az/common.json` with new keys.
- Brief QA results across admin/dashboard/resources/blogs/materials in both languages.

## Next Step
- Proceed with edits described above and report changes and QA.
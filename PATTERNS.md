# UI Patterns (Anti-Drift Contract)

This document defines mandatory UI usage patterns to prevent design and UX drift.

## 1) List Pages: `ListPageLayout` (Required)

All list-like pages must use `ListPageLayout` from `components/layout`.

Use this for pages that render:
- search/filter controls
- mapped list/grid results
- loading/error/empty list states

### Required structure
- `title`, `description`, `icon`
- optional `filterSection`
- `content` for mapped list/grid
- optional `bottomCta`
- state props: `isLoading`, `isError`, `isEmpty`, `onRetry`, and empty copy

### Example

```tsx
<ListPageLayout
  title="İş İmkanları"
  description="..."
  icon={Sparkles}
  isLoading={loading}
  isError={Boolean(error)}
  isEmpty={!loading && !error && items.length === 0}
  onRetry={refetch}
  filterSection={<ResourceFilterContainer ... />}
  content={<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{...}</div>}
/>
```

## 1.1) Admin Pages: `AdminListLayout` (Required)

All pages under `app/admin/**/page.tsx` must use `AdminListLayout` as the outer shell.

### Rules
- Keep state handling as-is (`PageStateGuard`, `LoadingState`, `ErrorState`, query guards).
- Use simpler visual style (no additional hero redesign).
- Keep page-specific internals unchanged; only standardize outer layout shell.

## 2) Resource Cards: `ResourceCard` (Required)

All resource list cards must use `ResourceCard` from `components/shared`.

Do not create inline `<article>` card structures for resource list items.

### Required props
- `type`: `'event' | 'vacancy' | 'blog'`
- `title`

### Extension props
- `description`
- `badges`
- `metadata`
- `actions`
- `topRight`
- `imageUrl`
- `icon`

### Example

```tsx
<ResourceCard
  type="event"
  title={event.title}
  description={event.description}
  badges={[{ label: event.category, variant: 'info' }]}
  metadata={<EventMeta event={event} />}
  actions={<EventActions event={event} />}
/>
```

## 3) Create/Edit Flows: Shared Form Components (Required)

All create/edit pages must delegate form UI and validation to shared form components.

### Rules
- Page files in `app/**/create/**/page.tsx` and `app/**/edit/**/page.tsx` should be wrappers.
- Wrappers can handle:
  - data loading
  - mutation wiring
  - success navigation
- Wrappers must not implement full raw form structure directly.

### Required usage
- Event flows: `features/events/components/EventForm`
- Vacancy flows: `features/vacancies/components/VacancyForm`
- Other domains should follow same pattern (`<Domain>Form` under `features/<domain>/components`)

## 4) Automated Enforcement

Run:

```bash
npm run check:ui-patterns
```

The checker enforces:
- `list-page-layout-required`
- `resource-card-required`
- `shared-form-required`

It exits with non-zero status when violations exist.

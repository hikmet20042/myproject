# UI State Rules

This document defines enforceable guardrails for UI state behavior consistency.

## Scope

Applies to:
- `app/**/*.tsx`
- `components/**/*.tsx`
- `features/**/*.tsx`
- `pages/**/*.tsx`

Enforcement channels:
- ESLint warnings in `.eslintrc.js`
- Static checker in `scripts/check-ui-state-rules.mjs`

## Allowed Patterns

- Page-level loading uses `LoadingState`.
- Page-level error uses `ErrorState`.
- Section-level state ownership uses `SectionContainer` + section slots when applicable.
- Suspense fallbacks are explicit UI states (not null).
- Catch blocks preserve existing content and surface a user-visible error state.

## Forbidden Patterns

- Direct loading text such as `"Loading..."` in UI.
- Plain `<div>` loader placeholders.
- `fallback={null}` for Suspense.
- `setData([])`-style resets inside `catch` blocks.
- Unauthorized/auth ownership logic outside layout guards:
  - `useSession()`
  - `router.push()` / `router.replace()` for auth redirects
  - `UnauthorizedState`, `accountType`, `isApprovedOrganization`, `"unauthenticated"`
- Potential state overlap in the same scope:
  - loading + content simultaneously
  - error + content simultaneously

## Examples

Good:

```tsx
if (loading) {
  return <LoadingState text={'Yüklənir'} />;
}

if (error) {
  return (
    <ErrorState
      title={'Məlumat yüklənmədi'}
      message={error}
      retryText={'Yenidən cəhd et'}
      onRetry={refetch}
    />
  );
}

return <ContentView data={data} />;
```

Bad:

```tsx
if (loading) return <div>Loading...</div>;
```

```tsx
<Suspense fallback={null}>
  <HeavyClientBlock />
</Suspense>
```

```tsx
catch (error) {
  setItems([]);
}
```

```tsx
const { status } = useSession();
if (status === 'unauthenticated') {
  router.replace('/auth/signin');
}
```

## Commands

- Non-blocking check (default lint pipeline):
  - `npm run lint`
- UI-state checker only:
  - `npm run lint:ui-state`
- Blocking mode for CI hard enforcement:
  - `npm run lint:ui-state:strict`

## Notes

- `lint:ui-state` reports hard violations and warnings.
- `lint:ui-state:strict` fails when hard violations are present.
- Warning-only checks are intentionally conservative and may report potential overlaps for manual review.

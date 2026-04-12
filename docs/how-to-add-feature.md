# How To Add a Feature

Use this checklist to create a feature without violating architecture constraints.

## 1) Create Feature Skeleton

Create one folder in `features/`:

- `features/<feature-name>/components`
- `features/<feature-name>/services` (optional)
- `features/<feature-name>/types` (optional)
- `features/<feature-name>/hooks` (optional)

Only use approved feature subdirectories from architecture guidelines.

## 2) Add Components With Correct Naming

- Data orchestration component: `SomethingContainer.tsx`
- Visual row/list unit: `SomethingItem.tsx`
- Visual section block: `SomethingSection.tsx`
- Card UI: `SomethingCard.tsx`

Do not use ambiguous names for new files.

## 3) Keep Container and UI Separate

Container:

- owns fetching, mutations, auth checks, side effects
- passes plain props to UI components

UI:

- no fetching/query/session logic
- no direct service or API imports
- no cross-feature business imports

## 4) Respect Feature Boundaries

Allowed imports:

- same feature (`@/features/<same-feature>/...`)
- shared layers (`@/components/ui`, `@/components/shared`, `@/components/containers`, `@/lib`, `@/hooks`)

Disallowed imports:

- other feature private components/services

If reuse is required across features, move the reusable part into shared layers.

## 5) Use Design Tokens

- prefer tokenized classes/utilities and design token constants
- avoid introducing fresh hardcoded spacing/color utilities when token options already exist

## 6) Validate Before Commit

Run:

- `npm run lint:system`

If hooks are enabled, this check will run automatically before commit.

## 7) Common Mistakes To Avoid

- adding fetch/query logic inside `components/ui`
- naming a data component without `Container`
- importing from another feature's `components` or `services`
- adding ad-hoc top-level folders under a feature
- adding hardcoded utility colors/spacing where tokenized options exist

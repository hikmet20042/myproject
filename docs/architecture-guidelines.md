# Architecture Guidelines

This repository uses hard guardrails to preserve architecture quality. These rules are enforced by lint tooling and architecture checks.

## 1) Ownership Model

- `features/<feature>/`: feature-owned domain logic.
- `components/ui/`: pure presentational building blocks.
- `components/shared/`: reusable cross-feature presentational components.
- `components/containers/`: cross-feature orchestration containers.
- `hooks/`: reusable application-level hooks.
- `lib/`: framework-agnostic utilities, API clients, and core helpers.

## 2) Naming Rules

- Containers must end with `Container`.
- Row/list visual units should use `Item`.
- Section blocks should use `Section`.
- Presentational cards should use `Card`.
- File and default export names should match.

## 3) Container vs UI Rules

A component is a Container if it does any of the following:

- fetches data
- uses query/mutation/session hooks
- performs permission checks
- orchestrates side effects

Container requirements:

- file name must end in `Container`
- may depend on services, hooks, and state layers
- should render presentational UI components

UI requirements:

- no direct API/query/session logic
- no feature-service imports
- receives data and callbacks through props

## 4) Feature Boundaries

Inside `features/<feature>/`, code may import:

- same feature modules
- shared UI (`components/ui`, `components/shared`)
- shared containers (`components/containers`) when needed
- shared libraries (`lib`, `hooks`)

Disallowed:

- importing another feature's private components/services directly

Use shared layers when behavior or UI is reused across features.

## 5) Feature Folder Contract

Approved subdirectories under each feature:

- `components`
- `hooks`
- `services`
- `types`
- `utils`
- `context`
- `providers`
- `schema`
- `validation`
- `payloadBuilders`
- `ui-state`

Any new top-level feature subdirectory should be intentional and added to architecture checks.

## 6) Design Token Rules

- Prefer centralized tokens and tokenized utilities over hardcoded values.
- Avoid introducing new hardcoded color/spacing utility classes when token utilities exist.
- Keep token definitions in shared design/token layers.

## 7) Enforcement Commands

- `npm run lint`
- `npm run check:ui-patterns`
- `npm run lint:architecture`
- `npm run lint:system`

## 8) Pre-Commit Safety

Install hooks once per clone:

- `npm run hooks:install`
- `git config core.hooksPath .githooks`

This runs `npm run lint:system` before each commit.

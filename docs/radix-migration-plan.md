# Radix UI Migration Plan

## Goals
- Replace custom UI primitives with Radix UI primitives where applicable.
- Preserve existing styling and UX while improving accessibility and keyboard support.
- Keep API parity for existing internal components to minimize feature refactors.

## Scope Inventory (Current UI Primitives)
- components/ui/Badge.tsx
- components/ui/Breadcrumb.tsx
- components/ui/Button.tsx
- components/ui/ButtonLink.tsx
- components/ui/Card.tsx
- components/ui/ContactCard.tsx
- components/ui/Dropdown.tsx
- components/ui/Input.tsx
- components/ui/Loading.tsx
- components/ui/Modal.tsx
- components/ui/SearchBar.tsx
- components/ui/Select.tsx
- components/ui/SocialLink.tsx
- components/ui/Tabs.tsx
- components/ui/Textarea.tsx

## Radix Mapping (Target Primitives)
- Modal → @radix-ui/react-dialog
- Dropdown → @radix-ui/react-dropdown-menu
- Select → @radix-ui/react-select
- Tabs → @radix-ui/react-tabs
- (Optional future) Tooltip/Popover for hints and menus

## Phases & Checklist

### Phase 1 — Foundation (Dependencies + Conventions)
- [x] Add Radix UI dependencies
- [ ] Define shared className helpers for Radix components (if needed)
- [ ] Update docs with usage patterns and accessibility notes

### Phase 2 — Core UI Primitives (components/ui)
- [x] Migrate Modal → Radix Dialog
- [x] Migrate Dropdown → Radix DropdownMenu
- [x] Migrate Select → Radix Select
- [x] Migrate Tabs → Radix Tabs
- [ ] Verify Button/ButtonLink/Card/Input/Textarea/Badge remain stable (no Radix equivalents)
- [ ] Keep API compatibility for existing usage sites

### Phase 3 — App Integration
- [ ] Update all usages of Modal, Dropdown, Select, Tabs to match any API changes
- [x] Migrate admin dashboard modals to Radix Dialog
- [ ] Validate pages with forms and filters (resources, dashboard, admin)
- [ ] Validate auth flows and dialogs (admin previews, confirmations)

### Phase 4 — Cleanup
- [ ] Remove unused legacy logic after migration
- [ ] Validate lint/build
- [ ] Update documentation and changelog

## Progress Log
- 2026-02-04: Plan created.
- 2026-02-04: Added Radix UI dependencies (dialog, dropdown-menu, select, tabs).
- 2026-02-04: Migrated Modal to Radix Dialog.
- 2026-02-04: Migrated Dropdown to Radix DropdownMenu.
- 2026-02-04: Migrated Select to Radix Select.
- 2026-02-04: Migrated Tabs to Radix Tabs.
- 2026-02-04: Migrated NotificationModal to Radix Dialog.
- 2026-02-04: Migrated admin blog preview action modal to Radix Dialog.
- 2026-02-04: Migrated admin vacancy preview reject modal to Radix Dialog.
- 2026-02-04: Migrated admin event preview reject modal to Radix Dialog.
- 2026-02-04: Migrated dashboard event delete modal to Radix Dialog.
- 2026-02-04: Migrated admin dashboard modals to Radix Dialog.
- 2026-02-04: Migrated profile delete confirmation dialog to Radix Dialog.
- 2026-02-04: Converted admin modal selects to Radix Select.

## Notes / Risks
- Some components (Breadcrumb, Card, Badge, Input, Textarea) have no direct Radix equivalents and will remain custom.
- Ensure Radix portals and z-index stacking do not break modals in admin pages.
- Keep Tailwind styling consistent with existing UI theme.

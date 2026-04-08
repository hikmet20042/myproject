# UI System & Shared Components — Deep Current State

## 1. Feature Summary
The project uses a componentized UI system built on Next.js App Router client/server pages with Tailwind CSS utility classes and shared React component libraries under the components directory.

Current UI system composition in code:
- Reusable primitive UI components are centralized in components/ui and exported via components/ui/index.ts and components/index.ts.
- Reusable composite/shared visual components are centralized in components/shared and exported via components/shared/index.ts.
- Form-oriented wrappers are centralized in components/forms and exported via components/forms/index.ts.
- Layout utilities are centralized in components/layout and exported via components/layout/index.ts.
- Feedback primitives are centralized in components/feedback.
- Feature-level UI state handling utilities are centralized in features/ui-state and re-exported by features/ui-state.ts.
- Page-level and feature-level UIs consume these shared components from app/* pages and features/* containers.

Top-level style approach:
- Tailwind content scanning includes app, components, and pages paths.
- Global CSS contains Tailwind base/components/utilities, CSS variables, utility classes, animation keyframes/classes, custom scrollbars, and helper classes.
- Most page and component UIs use direct className utility composition.

Main shared composition patterns present:
- Primitive-first composition: Input, Select, TextArea, Button, Card, Modal, etc. are used directly in pages and feature containers.
- Wrapper composition: FormField and FormSection wrap primitives for grouped form UIs.
- State rendering composition: SectionContainer + resolveSectionState + renderSectionByState + SectionLoading + SectionErrorInline + SectionEmptyStateSlot.
- Resource filtering composition: ResourceFilterContainer + ActiveFilterBadges + Input/Select.
- High-level page states: LoadingState, ErrorState, SuccessState, UnauthorizedState.

## 2. All UI Capabilities
### Reusable UI primitives (components/ui)
- Button
  - Variants: primary, secondary, outline, ghost, danger, add, gradient-blue, gradient-green, gradient-indigo, gradient-purple, gradient-pink, gradient-teal, white-on-dark.
  - Sizes: xs, sm, md, lg, xl.
  - Supports loading spinner mode, optional icon (left/right), fullWidth, rounded scale, shadow scale, hoverEffect scale/lift/glow/none, optional gradient alias override.
- ButtonLink
  - Same visual variant/size model as Button.
  - Internal Link mode or external anchor mode via external boolean.
- Input
  - Optional label, description, error text.
  - Icon support left/right.
  - Variants: default, orange, indigo, purple.
  - Sizes: sm, md, lg.
  - Required marker rendering.
- TextArea
  - Optional label, description, error text.
  - Variants: default, orange, indigo, purple.
  - Sizes: sm, md, lg.
  - Configurable rows.
- Select
  - Built with @radix-ui/react-select.
  - Optional label, description, error text.
  - Options array (value/label/disabled).
  - Variants: default, orange, indigo, purple.
  - Sizes: sm, md, lg.
  - Trigger/content/item custom styling and value mapping to HTML-like onChange event.
- Card suite
  - Card with variant/shadow props.
  - CardHeader with optional gradient, title, description, icon.
  - CardContent with padding levels.
- Loading
  - Variants: spinner, dots, pulse.
  - Sizes: sm, md, lg, xl.
  - Colors: primary, white, gray, current.
  - Optional text and fullScreen overlay mode.
- Badge
  - Variants: primary, secondary, success, warning, danger, info.
  - Sizes: sm, md, lg.
  - Optional icon, rounded toggle.
- Modal
  - Built with @radix-ui/react-dialog.
  - Controls: isOpen/onClose, title, size (sm/md/lg/xl), showCloseButton, closeOnOverlayClick, className.
- Dropdown
  - Built with @radix-ui/react-dropdown-menu.
  - Trigger + item list model (label/value/href/icon/onClick/disabled/divider).
  - Router push for same-origin href, hard navigation fallback for external/malformed URLs.
- Tabs
  - Built with @radix-ui/react-tabs.
  - Controlled/uncontrolled modes.
  - Variants: default, pills, underline.
  - Sizes: sm, md, lg.
  - Supports icon and badge per tab.
- SearchBar
  - Debounced search input.
  - Optional localStorage persistence via storageKey.
  - Manual clear callback support.
- Breadcrumb
  - Items with label/href/current.
  - Variants: default, light.
  - Custom separator support.
- ContactCard
  - Icon + label + value card, link or div mode.
  - Variants: default, compact.
- SocialLink
  - Platform presets: facebook, twitter, instagram, linkedin, youtube, tiktok.
  - Variants: default, compact, icon-only.
  - Platform-specific icon/color styles.

### Reusable shared composite components (components/shared)
- AnimatedBackground
  - Fixed full-screen animated gradient blob background.
  - Configurable blob colors and opacity prop.
- GradientHero
  - Gradient section hero with title/subtitle/icon and optional badge metadata props.
  - Uses animated overlays.
- ProgressIndicator
  - Multi-step progress display with percentage bar and optional 100% animated gradient bar effect.
- EnhancedCard
  - Card container with optional title/icon header and animation delay.
- StatusBadge
  - Status-based label/icon visualizer for approved/rejected/pending/active/inactive/success/error/warning.
  - Size and pulse options.
- LoadingState
  - Full-screen centered loading card state with icon + text.
- ErrorState
  - Full-screen centered error card state with title/message/retry action and configurable gradient classes.
- UnauthorizedState
  - Full-screen authorization error panel with optional CTA button.
- SuccessState
  - Full-screen success panel with optional actions.
- SectionHeader
  - Icon + title + subtitle + optional badge heading row.
- InfoCard
  - Label/value mini-card with gradient background and hover border class option.
- ActionButton
  - Tone-detected gradient-like action button wrapper based on gradient class strings.
- ImageUpload
  - Client image upload UI with preview, remove/replace controls, validation, and upload POST to /api/upload.
- ResourceFilterContainer
  - Reusable filter block with header, always-visible search slot, collapsible additional filters, optional active filter badge slot.
- ActiveFilterBadges
  - Reusable active filter pills with remove handlers and clear-all action.
- ResourceCard
  - Reusable card for resources with optional image, badges, footer, CTA button, icon, link/onClick modes.

### Form components (components/forms)
- FormField
  - Wrapper that dispatches to Input, TextArea, or Select based on type prop.
  - Spacing presets.
- FormSection
  - Card-based titled section wrapper using Card, CardHeader, CardContent.
  - Supports gradient header controls and spacing/padding props.
- DynamicList
  - Multi-item text area list manager with add/remove row controls.
  - Variant color presets and min/max item constraints.

### Layout components (components/layout)
- Container
  - Width presets: sm, md, lg, xl, full.
  - Padding presets: none, sm, md, lg, xl.
  - Centering toggle.
- Grid
  - Column presets and gap presets.
  - Responsive col settings via dynamic class strings.
- GridItem
  - Span presets and responsive span settings.

### Feedback components (components/feedback)
- Alert
  - Variants: success, error, warning, info.
  - Sizes: sm, md, lg.
  - Optional title, icon toggle, dismissible mode.

### Shared UI-state utility system (features/ui-state)
- resolveSectionState
  - Converts dataState + errorState + isRefreshing into section state kind.
- deriveDataState
  - Computes loading/success/empty/filtered-empty from data arrays and flags.
- renderSectionByState + getSectionBodyState
  - Section state to body renderer mapping.
- SectionContainer
  - Orchestrates non-blocking error, refreshing notice, and body rendering by section state.
  - Includes optional debug dataset attributes and console debugging.
- SectionLoading
  - Skeleton presets: list, card-grid, notifications.
- SectionErrorInline
  - Inline/framed error alert with retry action.
- SectionEmptyStateSlot
  - Empty-state slot wrapper with scope and kind data attributes.
- useRefreshVisibility
  - Delayed/min-visible state for refresh indicators.
- features/ui-state/index.tsx
  - Additional client utility implementation of similarly named state helpers and simplified components.

### Additional component export organization
- components/index.ts exports:
  - Shared components namespace export.
  - UI primitives and their types.
  - Form components export.
  - Layout components export.
  - Feedback components export.
  - Selected social interaction components (BlogReactions, SaveButton, ViewTracker, NotificationBell).

## 3. Component Structure
### UI Folder Structure
- components/ui
  - Badge.tsx
  - Breadcrumb.tsx
  - Button.tsx
  - ButtonLink.tsx
  - Card.tsx
  - ContactCard.tsx
  - Dropdown.tsx
  - Input.tsx
  - Loading.tsx
  - Modal.tsx
  - SearchBar.tsx
  - Select.tsx
  - SocialLink.tsx
  - Tabs.tsx
  - Textarea.tsx
  - index.ts

### Shared folders and related reusable directories
- components/shared
  - ActionButton.tsx
  - ActiveFilterBadges.tsx
  - AnimatedBackground.tsx
  - EnhancedCard.tsx
  - ErrorState.tsx
  - GradientHero.tsx
  - ImageUpload.tsx
  - InfoCard.tsx
  - LoadingState.tsx
  - ProgressIndicator.tsx
  - ResourceCard.tsx
  - ResourceFilterContainer.tsx
  - SectionHeader.tsx
  - StatusBadge.tsx
  - SuccessState.tsx
  - UnauthorizedState.tsx
  - index.ts
- components/forms
  - DynamicList.tsx
  - FormField.tsx
  - FormSection.tsx
  - index.ts
- components/layout
  - Container.tsx
  - Grid.tsx
  - index.ts
- components/feedback
  - Alert.tsx
  - index.ts
- features/ui-state
  - SectionContainer.tsx
  - SectionEmptyStateSlot.tsx
  - SectionErrorInline.tsx
  - SectionLoading.tsx
  - deriveDataState.ts
  - index.ts
  - index.tsx
  - renderSectionByState.ts
  - resolveSectionState.ts
  - useRefreshVisibility.ts
- features/ui-state.ts
  - Re-export entrypoint.

### Key components and currently present behavior
- FormField.tsx
  - Type-based wrapper chooses Input/TextArea/Select.
  - Pass-through refs cast for selected target element types.
- FormSection.tsx
  - Wraps grouped fields in Card/CardHeader/CardContent visual structure.
- UI primitives
  - Unified API shape and style-system-like variants/sizes.
- State components
  - LoadingState, ErrorState, SuccessState, UnauthorizedState provide page-scale state canvases.
  - SectionLoading, SectionErrorInline, SectionEmptyStateSlot provide section-scale state canvases.

### Existing resource component namespace
- components/resources exists with files:
  - LoadingState.tsx
  - EmptyState.tsx
  - ResourceCard.tsx
  - ResourceFilters.tsx
  - index.ts
- Current content state:
  - These files exist and are empty.

## 4. Styling System
### Tailwind usage
- Tailwind is the primary styling mechanism via className strings across pages/components.
- Tailwind config content scanning:
  - app/**/*.{js,ts,jsx,tsx,mdx}
  - components/**/*.{js,ts,jsx,tsx,mdx}
  - pages/**/*.{js,ts,jsx,tsx,mdx}
- Tailwind theme extensions include:
  - colors: primary, accent, textColor, buttonHover.
  - color remaps for indigo/purple/violet/fuchsia/pink/rose/yellow/amber to blue/cyan/emerald/green scales.
  - fontFamily.sans set to Inter.

### Global styles (app/globals.css)
- Imports Inter font from Google Fonts.
- Includes Tailwind base/components/utilities directives.
- Defines root CSS variables:
  - --primary-color
  - --accent-color
  - --text-color
  - --button-hover
- Global reset-like rules:
  - box-sizing, margin, padding
  - html/body max-width and x-overflow handling
  - body text color and Inter font
  - anchor default inherit/no underline
- Shared utility classes:
  - .btn-primary
  - .btn-secondary
  - .card
  - .section-padding
  - .line-clamp-2
  - .line-clamp-3
  - .bn-autogrow and nested BlockNote auto-grow helpers
  - .card-hover
  - .gradient-text
  - .glass
- Animation keyframes defined:
  - blob, fade-in, slide-up, slide-in-left, slide-in-right, bounce-slow, float, pulse-glow, shimmer, scale-in, shake, gradient-x.
- Animation utility classes defined:
  - animate-blob
  - animate-fade-in
  - animate-slide-up
  - animate-slide-in-left
  - animate-slide-in-right
  - animate-bounce-slow
  - animate-float
  - animate-pulse-glow
  - animate-shimmer
  - animate-scale-in
  - animate-shake
  - animate-gradient-x
  - animation-delay-* helpers (200/400/600/800/1000/2000/4000)
- Additional global behavior:
  - html smooth scrolling.
  - custom webkit scrollbar styles.

### Theme and class naming patterns in current code
- Frequently used color families in component classes:
  - blue, cyan, emerald, slate, gray, amber, rose.
- Rounded radii patterns:
  - rounded-lg, rounded-xl, rounded-2xl, rounded-full.
- Elevation patterns:
  - shadow-sm, shadow-md, shadow-lg, shadow-xl with hover transitions.
- Background patterns:
  - white base cards, gradient hero sections, subtle slate/blue tinted backgrounds.
- Motion patterns:
  - hover scale/lift, animate-* classes from globals.

## 5. UI State Handling
### Page-level loading/error/success/auth states
- LoadingState is used in multiple pages to render full-screen loading panel.
- ErrorState is used in resource/detail pages and admin preview pages for full-screen error panel.
- SuccessState is used in submit/edit flows for positive completion panel.
- UnauthorizedState is used in dashboard/admin layout access checks.

### Section-level UI-state utilities (features/ui-state)
- data state model:
  - loading
  - success
  - empty
  - filtered-empty
- error state model:
  - none
  - present
- resolved section states:
  - loading-initial
  - loading-refresh
  - error-blocking
  - error-nonblocking
  - empty-list
  - empty-filtered
  - content
- state rendering flow:
  - deriveDataState computes data state from arrays and flags.
  - resolveSectionState combines data/error/refresh states.
  - SectionContainer renders:
    - optional non-blocking error region
    - optional refresh notice region with delayed visibility behavior
    - primary body via renderSectionByState
- skeleton handling:
  - SectionLoading variant "list"
  - SectionLoading variant "card-grid"
  - SectionLoading variant "notifications"
- inline error handling:
  - SectionErrorInline with optional framed card wrapper.
- empty slot semantics:
  - SectionEmptyStateSlot adds data attributes for empty kind and scope.
- refresh notice timing:
  - useRefreshVisibility has configurable showDelayMs and minVisibleMs.

### Feature usage of section-state system
- Dashboard notifications container uses:
  - deriveDataState
  - SectionContainer
  - SectionErrorInline
  - SectionLoading
  - SectionEmptyStateSlot
- Events and vacancies dashboard containers use:
  - resolveSectionState
  - renderSectionByState
  - SectionErrorInline
  - SectionLoading
  - useRefreshVisibility

### Additional UI state implementation file
- features/ui-state/index.tsx contains a client implementation of deriveDataState/SectionContainer/SectionErrorInline/SectionLoading/SectionEmptyStateSlot.
- It includes simplified rendering logic and a local error style block for SectionErrorInline.

## 6. Interaction With Other Systems
### Auth pages using shared UI
- app/auth/signin/page.tsx
  - Uses Input and Button primitives for sign-in form.
  - Includes button-based account type selection and custom error blocks.
- app/auth/register/page.tsx
  - Uses Input, Button, TextArea for user and organization registration flows.
  - Uses conditional form sections by registration type.
- app/auth/forgot-password/page.tsx
  - Uses Input + Button in a single-field form.
- app/auth/reset-password/page.tsx
  - Uses Input + Button for reset and confirm password.

### Profile pages using shared UI
- app/profile/page.tsx
  - Uses Button, LoadingState, ErrorState, StatusBadge, Alert and profile subcomponents.
- features/profile/components/ProfilePageContainer.tsx
  - Uses Button, Card/CardContent, LoadingState.
  - Switches between ProfileView and ProfileForm inside shared card layout.
- features/profile/components/ProfileForm.tsx
  - Uses Input, TextArea, Button, Alert.
  - Also uses native select and checkbox controls with Tailwind classes.

### Blog flows using shared UI
- app/submit/blog/step1/page.tsx
  - Uses Input, Button, ButtonLink, ProgressIndicator, GradientHero, LoadingState.
- app/submit/blog/step2/page.tsx
  - Uses Button/ButtonLink, Input, LoadingState, ProgressIndicator, SuccessState.
- app/edit/blog/[id]/step1/page.tsx and step2/page.tsx
  - Use shared loading/success/error patterns and UI primitives.
- app/blogs/page.tsx and app/blogs/[id]/page.tsx
  - Use Button/ButtonLink/SearchBar and shared loading/error components.

### Events and dashboard systems using shared UI
- app/dashboard/events/create/page.tsx
  - Uses Input, Select, Button, TextArea plus FormSection wrapper.
- app/dashboard/events/[id]/page.tsx and edit page
  - Use Button and shared loading/error states.
- features/events/components/EventsPageContainer.tsx
  - Uses Button, Input, Select, Card, Alert, and features/ui-state helpers.

### Vacancies and dashboard systems using shared UI
- app/dashboard/vacancies/create/page.tsx
  - Uses Input, Select, Button, TextArea plus large amount of native form controls.
- features/vacancies/components/VacanciesPageContainer.tsx
  - Uses Button, Input, Select, Card, Alert, and features/ui-state helpers.
- components/dashboard/VacancyManagement.tsx and EventManagement.tsx
  - Use Button/Input/Select/Card/Badge/Modal/Loading.

### Resources system using shared UI
- app/resources/events/page.tsx
  - Uses ResourceFilterContainer + ActiveFilterBadges + Input + Select + Button/ButtonLink + LoadingState/ErrorState.
- app/resources/vacancies/page.tsx
  - Uses ResourceFilterContainer + ActiveFilterBadges + Input + Select + Button/ButtonLink + LoadingState.
- app/resources/organizations/page.tsx
  - Uses ResourceFilterContainer + ActiveFilterBadges + Input + Select + Button/ButtonLink + LoadingState/ErrorState.
- app/resources/materials/page.tsx
  - Uses ResourceFilterContainer + Input + Select + Button/ButtonLink + LoadingState/ErrorState.
- app/resources/* detail pages
  - Use combinations of Card, CardContent, Badge, Breadcrumb, ContactCard, SocialLink, Button, LoadingState, ErrorState.

### Admin and organization systems using shared UI
- app/admin/page.tsx
  - Uses Input, Select, Button, TextArea, Card/CardHeader/CardContent, Container, Tabs, LoadingState, ImageUpload.
- app/admin/layout.tsx
  - Uses UnauthorizedState.
- app/admin/preview/* pages
  - Use Button + LoadingState/ErrorState combinations.

## 7. Layout Patterns
### Global app layout pattern
- app/layout.tsx wraps all pages with:
  - Header
  - Footer
  - Main element containing route children
  - Providers (AuthProvider, SocketProvider, SSENotificationProvider, NotificationProvider)
- Body classes include min-h-screen, bg-gray-50, text-gray-900, transition-colors.

### Dashboard layout pattern
- app/dashboard/layout.tsx
  - Session-guarded layout.
  - UnauthorizedState shown for non-approved/non-organization accounts.
  - Authorized flow wrapped with DashboardDataProvider and DashboardShell.
- components/dashboard/DashboardShell.tsx
  - Two-column responsive layout with sticky sidebar nav on desktop.
  - Sidebar uses localized links and active route highlighting.
  - Main content rendered in right pane.

### Common page composition patterns across routes
- Hero section pattern used in resources and submit pages:
  - Large title/subtitle area, decorative backgrounds, CTA buttons.
- Card-centric content pattern:
  - White cards with rounded borders/shadows for forms and content sections.
- Filter + results pattern:
  - ResourceFilterContainer at top, followed by result counts and card grids/lists.
- State-first pattern:
  - Early returns for loading/error states in many pages.

### Header/Footer consistency
- Header
  - Sticky top nav with desktop and mobile variants.
  - Session-aware auth/profile/dashboard/admin links.
  - Dropdown and notification integrations.
- Footer
  - Multi-column structure with quick links/contact blocks and patterned/gradient background layers.

## 8. Edge Behaviors (Observed)
### Inconsistent component usage patterns currently observable
- Mixed primitive and native controls:
  - Some forms use Input/Select/TextArea components.
  - Some forms mix native input/select/textarea/checkbox in the same file.
- Mixed state utility usage:
  - Some features use features/ui-state SectionContainer stack.
  - Some pages use direct conditional rendering and local loading/error blocks.
- Mixed card/resource implementations:
  - components/shared/ResourceCard exists and is used.
  - components/resources namespace exists but files are currently empty.
- Mixed language text in UI strings:
  - Azerbaijani and English labels/messages both appear across components/pages.

### Repeated component motifs and patterns
- Repeated gradient hero sections with animated background overlays.
- Repeated rounded 2xl card containers with border + shadow combinations.
- Repeated filter sections with Input + Select combinations.
- Repeated CTA button rows in hero and form contexts.
- Repeated loading patterns:
  - Full-screen loading states.
  - Section skeleton rows/cards/notification placeholders.

### Conditional rendering patterns in current code
- Session/auth guards:
  - Null return or unauthorized state until session and account checks complete.
- Multi-step form branching:
  - Submit/edit blog flow uses step-based persisted state and conditional transitions.
- Filter-driven rendering:
  - Resource pages compute filtered arrays and display filtered counts/cards/empty messaging.
- Modal/dialog toggles:
  - Notification modal and delete confirmation dialogs use local state flags.
- Refresh-state messaging:
  - Section refresh notices shown only when delayed visibility hook allows.

## 9. Notes for AI Understanding
### Design and implementation patterns actively used
- Utility-first styling with Tailwind classes embedded directly in JSX.
- Component API pattern:
  - Rich prop-driven variants, sizes, and optional icon/content slots.
- Composition pattern:
  - Primitive components are wrapped by form/shared/state components for higher-level usage.
- State rendering pattern:
  - Declarative state mapping via section state enums and render maps in parts of the dashboard.
- Page architecture pattern:
  - Client components for interactive UIs (forms, filters, dashboards), often with route-local state.

### Reuse strategy currently in code
- Centralized exports from index files:
  - components/ui/index.ts
  - components/shared/index.ts
  - components/forms/index.ts
  - components/layout/index.ts
  - components/feedback/index.ts
  - components/index.ts
- Shared primitives are reused across auth, profile, blog, resources, dashboard, and admin pages.
- Shared state components and ui-state utility modules are reused in dashboard-oriented feature containers.

### Structure consistency characteristics
- Directory-level modularization exists for UI primitives, shared composites, forms, layout, and feedback.
- Shared components are consumed through both barrel imports and direct file imports.
- features/ui-state has both modular helper files and an additional consolidated index.tsx implementation.
- Resource-related component namespaces exist in two places:
  - components/shared contains active resource UI building blocks.
  - components/resources contains empty files in current state.

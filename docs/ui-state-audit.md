# Full UI State Audit

Status: Analysis only. No code changes. No solution proposals.
Scope: app/, features/, components/, layouts, middleware guards
Date: 2026-03-20

## Coverage Summary

- Total app pages scanned: 41
- Layouts scanned: 5
- Feature components scanned: 13
- Components scanned: 80+
- Next.js special files checked: no app/**/loading.tsx, no app/**/not-found.tsx, no notFound() usage in UI scope

---

## 1. Loading States

### 1.1 Shared Loading UI Primitives

| Component | File | Visual style | Typical use |
|---|---|---|---|
| LoadingState | components/shared/LoadingState.tsx | Full-screen gradient + large spinner + text | Page-level blocking loading |
| Loading | components/ui/Loading.tsx | Spinner/dots/pulse utility (optionally fullScreen) | Container/section loading |
| Button loading | components/ui/Button.tsx | Inline spinner inside button | Action-level loading |

### 1.2 Page-Level Loading Implementations

| File | Component/Page | Type | UI | Trigger condition | Blocking vs overlay |
|---|---|---|---|---|---|
| app/admin/layout.tsx | AdminLayout | Page-level | LoadingState | status === 'loading' | Blocking |
| app/dashboard/layout.tsx | DashboardLayout | Page-level | LoadingState | !mounted or status === 'loading' or accountType/approval not ready | Blocking |
| app/admin/page.tsx | Admin page | Page-level | LoadingState | loading | Blocking |
| app/blogs/page.tsx | Blogs list | Page-level | LoadingState | loading | Blocking |
| app/blogs/[id]/page.tsx | Blog detail | Page-level | LoadingState | loading | Blocking |
| app/profile/page.tsx | Own profile | Page-level | LoadingState | loading | Blocking |
| app/profile/[id]/page.tsx | Public profile | Page-level | LoadingState | loading | Blocking |
| app/resources/events/page.tsx | Events list | Page-level | LoadingState | loading | Blocking |
| app/resources/vacancies/page.tsx | Vacancies list | Page-level | LoadingState | loading | Blocking |
| app/resources/organizations/page.tsx | Organizations list | Page-level | LoadingState | loading | Blocking |
| app/resources/materials/page.tsx | Materials list | Page-level | LoadingState | loading | Blocking |
| app/resources/events/[id]/page.tsx | Event detail | Page-level | LoadingState | loading | Blocking |
| app/resources/vacancies/[id]/page.tsx | Vacancy detail | Page-level | LoadingState | loading | Blocking |
| app/resources/organizations/[id]/page.tsx | Organization detail | Page-level | LoadingState | loading | Blocking |
| app/dashboard/events/[id]/page.tsx | Dashboard event detail | Page-level | LoadingState | status === 'loading' OR loading | Blocking |
| app/dashboard/events/[id]/edit/page.tsx | Dashboard event edit | Page-level | LoadingState | status === 'loading' OR loadingEvent | Blocking |
| app/dashboard/events/create/page.tsx | Dashboard create event | Guard-level | LoadingState | auth/approval readiness checks | Blocking |
| app/dashboard/vacancies/create/page.tsx | Dashboard create vacancy | Guard-level | LoadingState | status === 'loading' | Blocking |
| app/edit/blog/[id]/page.tsx | Edit flow entry | Page-level | LoadingState | redirect phase | Blocking |
| app/edit/blog/[id]/step1/page.tsx | Edit step 1 | Page-level | LoadingState | status === 'loading' OR loading | Blocking |
| app/edit/blog/[id]/step2/page.tsx | Edit step 2 | Page-level | LoadingState | status === 'loading' OR loading OR !init | Blocking |
| app/submit/blog/step1/page.tsx | Submit step 1 | Page-level | LoadingState | status === 'loading' OR loading | Blocking |
| app/submit/blog/step2/page.tsx | Submit step 2 | Page-level | LoadingState | status === 'loading' OR loading OR !init | Blocking |

### 1.3 Component/Section Loading Implementations

| File | Component | Type | UI | Trigger |
|---|---|---|---|---|
| app/page.tsx | Home sections | Section-level | Inline skeleton cards (animate-pulse) | loading |
| features/dashboard/components/DashboardNotificationsPageContainer.tsx | Notifications section | Section-level | SectionLoading skeleton rows | derived dataState = loading-initial |
| components/NotificationBell.tsx | Header dropdown | Partial | Skeleton list + top progress bar | isLoading with/without existing notifications |
| components/RecentCommunityContent.tsx | Home widget | Section-level | Skeleton cards | loading |
| components/Profile/Blogs.tsx | Profile blogs tab | Section-level | Skeleton list | loadingTab === 'blogs' |
| components/Profile/Notifications.tsx | Profile notifications tab | Section-level | Skeleton list | loadingTab === 'notifications' |
| components/Profile/TabNavigation.tsx | Tab nav | Micro | Spinner dot per active loading tab | loadingTab === tab |
| components/notifications/NotificationListItem.tsx | Row actions | Action-level | Spinner icon | isActionLoading / isDeleting |
| components/BlogReactions.tsx | Like/dislike actions | Action-level | Spinner icon | isLoading |
| components/shared/ImageUpload.tsx | Upload action | Action-level | Spinner + text | uploading |
| features/events/components/EventDeleteDialog.tsx | Delete action | Action-level | Button loading spinner | deleting |
| features/vacancies/components/VacancyDeleteDialog.tsx | Delete action | Action-level | Button loading spinner | deleting |

### 1.4 Suspense Fallback Loading Styles

| File | Fallback UI |
|---|---|
| app/layout.tsx | fallback={null} for analytics Suspense |
| app/profile/page.tsx | bare Loader2 centered spinner |
| app/submit/blog/step1/page.tsx | plain text "Yuklenir..." in centered div |
| app/auth/error/page.tsx | plain text "Yuklenir..." centered |
| app/auth/verify-email/page.tsx | plain text "Yuklenir..." centered |
| app/dashboard/events/create/page.tsx | LoadingState in Suspense fallback |
| app/auth/signin/page.tsx | centered plain text fallback |

### 1.5 Fetching Files With No Explicit Loading UI

Confirmed in user-visible areas:

- features/vacancies/components/VacanciesPageContainer.tsx: has loading UI for initial fetch, but fetch re-runs and internal refresh paths do not always expose a separate refresh indicator.
- app/admin/page.tsx: tabLoading exists but tab content mostly has no uniform loading placeholder during tab switches (materials tab has one, others rely mainly on disabled tabs/stale content).
- app/profile/page.tsx: loadingTab is tracked for tab changes but tab body loading feedback is inconsistent across tabs (nav indicator exists; content-level placeholder differs by tab).

---

## 2. Empty / Not Found States

### 2.1 Not Found Handling (Resource Detail)

| File | Trigger | UI |
|---|---|---|
| app/blogs/[id]/page.tsx | !blog | ErrorState "Bloq tapilmadi" |
| app/profile/[id]/page.tsx | error || !user | ErrorState |
| app/resources/events/[id]/page.tsx | error || !event | ErrorState |
| app/resources/vacancies/[id]/page.tsx | error || !vacancy | ErrorState |
| app/resources/organizations/[id]/page.tsx | error || !organization | ErrorState |
| app/dashboard/events/[id]/page.tsx | error || !event | ErrorState |
| app/dashboard/events/[id]/edit/page.tsx | error || !event | ErrorState |

Observations:
- notFound() is not used in UI routes.
- app/**/not-found.tsx files do not exist.

### 2.2 Empty List/No Data States

| File | Trigger | Empty UI style |
|---|---|---|
| app/blogs/page.tsx | filteredBlogs.length === 0 | Large custom empty card, icon changes by search context |
| app/resources/events/page.tsx | filteredData.length === 0 | Centered card with Calendar icon and guidance |
| app/resources/vacancies/page.tsx | filteredVacancies.length === 0 | Centered card + clear filters CTA (conditional) |
| app/resources/organizations/page.tsx | filteredOrganizations.length === 0 | Centered card + clear filters CTA (conditional) |
| app/resources/materials/page.tsx | filteredMaterials.length === 0 | Centered card + clear filters button |
| features/events/components/EventsList.tsx | filteredEvents.length === 0 | SectionEmptyStateSlot wrapper + custom body |
| features/vacancies/components/VacanciesList.tsx | filteredVacancies.length === 0 | SectionEmptyStateSlot wrapper + custom body |
| features/dashboard/components/DashboardNotificationsPageContainer.tsx | deriveDataState => empty-list/empty-filtered | SectionEmptyStateSlot + custom dashed panel |
| components/NotificationBell.tsx | notifications.length === 0 | Compact dropdown empty state |
| components/Profile/Blogs.tsx | blogs.length === 0 | Tab empty state with CTA |
| components/Profile/Notifications.tsx | notifications.length === 0 | Tab empty state |
| components/dashboard/EventManagement.tsx | filteredEvents.length === 0 | Card empty state |
| components/dashboard/VacancyManagement.tsx | filteredVacancies.length === 0 | Card empty state |
| app/admin/page.tsx | per-tab arrays length === 0 | Text/section empties in blogs/users/orgs/events/vacancies/notifications/materials |

### 2.3 Empty/Not Found Infrastructure Notes

- components/resources/EmptyState.tsx exists but file is empty and unused.
- features/ui-state import targets are used by features pages, but the features/ui-state directory is empty in workspace listing.

### 2.4 Missing Empty States (Confirmed)

- app/page.tsx: when API calls fail, sections can render with zero cards and no explicit empty-state message per section.
- app/admin/page.tsx: empty styles vary heavily by tab; there is no single consistent empty-state component.

---

## 3. Unauthorized / Access Control States

### 3.1 Middleware Guards (Server Redirect)

File: middleware.ts

Protected prefixes:
- /admin
- /submit
- /edit/blog
- /dashboard
- /profile

Behavior:
- Unauthenticated: redirect to /auth/signin?callbackUrl=...
- /admin non-admin: redirect to /auth/signin?callbackUrl=...
- Silent redirect (no intermediate unauthorized UI)

### 3.2 Layout/Page Auth Guards

| File | Condition | Behavior | UI shown vs silent |
|---|---|---|---|
| app/admin/layout.tsx | unauthenticated | router.replace(signInPath) | Silent redirect |
| app/admin/layout.tsx | authenticated non-admin | router.replace(homePath) | Silent redirect |
| app/dashboard/layout.tsx | unauthenticated | router.replace(signInPath) | Silent redirect |
| app/dashboard/layout.tsx | authenticated non-org | render UnauthorizedState | Message UI |
| app/dashboard/layout.tsx | org not approved | render UnauthorizedState | Message UI |
| app/submit/blog/step1/page.tsx | !session after load | router.push('/auth/signin') | Silent redirect |
| app/submit/blog/step2/page.tsx | !session after load | router.push('/auth/signin') | Silent redirect |
| app/edit/blog/[id]/page.tsx | !session | router.push('/auth/signin') | Silent redirect |
| app/edit/blog/[id]/step1/page.tsx | !session | router.push('/auth/signin') | Silent redirect |
| app/edit/blog/[id]/step2/page.tsx | !session | router.push('/auth/signin') | Silent redirect |
| app/dashboard/events/create/page.tsx | non-org or not approved | router.replace(homePath) | Silent redirect |
| app/dashboard/vacancies/create/page.tsx | !session | router.push('/auth/signin') | Silent redirect |
| features/profile/components/ProfilePageContainer.tsx | non-org or not approved | router.replace(homePath) in effect + ErrorState branches exist | Both redirect logic and message-state branches present |
| features/events/components/EventsPageContainer.tsx | non-org or not approved | ErrorState | Message UI |
| features/vacancies/components/VacanciesPageContainer.tsx | non-org or not approved | ErrorState + redirect in effect | Mixed |

### 3.3 Access State Consistency

- Both silent redirects and explicit unauthorized screens are used.
- In several feature containers, redirect guard and error-screen branches coexist.

---

## 4. Error States

### 4.1 Shared Error UI

| Component | File | Usage |
|---|---|---|
| ErrorState | components/shared/ErrorState.tsx | Full-page error screens on many detail/list pages |
| Alert | components/feedback/Alert.tsx | Inline feedback in forms and dashboard containers |

### 4.2 Error Handling by Area

| File | Error type | UI response | User feedback visibility |
|---|---|---|---|
| app/page.tsx | network/content load | console.error only | None |
| app/blogs/page.tsx | load failure | setAllBlogs([]) + console.error | Indirect (looks like empty state) |
| app/resources/events/page.tsx | fetch failure | inline custom error panel + retry button | Visible |
| app/resources/vacancies/page.tsx | fetch failure | compact red error banner (errorKey) | Visible |
| app/resources/organizations/page.tsx | fetch failure | ErrorState | Visible |
| app/resources/materials/page.tsx | fetch failure | ErrorState | Visible |
| app/resources/*/[id]/page.tsx | fetch/not-found | ErrorState | Visible |
| app/blogs/[id]/page.tsx | fetch/not-found | ErrorState | Visible |
| app/profile/[id]/page.tsx | fetch/not-found | ErrorState | Visible |
| app/profile/page.tsx | profile/stats/blogs fetch failures | mostly console.error, fallback !profile ErrorState only in one branch | Partial |
| app/admin/page.tsx | many admin API calls | mostly console.error, some alert() for actions | Partial/inconsistent |
| features/events/components/EventsPageContainer.tsx | delete/fetch errors | Alert + ErrorState via eventsError | Visible |
| features/vacancies/components/VacanciesPageContainer.tsx | initial fetch error | console.error only | None |
| features/profile/components/ProfilePageContainer.tsx | profile fetch error | console.error only; no dedicated fetch-error surface | Limited |
| components/dashboard/EventManagement.tsx | fetch/delete error | console.error only | None |
| components/dashboard/VacancyManagement.tsx | fetch/delete error | console.error only | None |
| components/RecentCommunityContent.tsx | load error | console.error only then empty state | Indirect |
| components/SaveButton.tsx | save/fetch status errors | alert() + console.error | Visible via browser alert |
| components/BlogReactions.tsx | reaction API errors | console.error only | None |
| components/ViewTracker.tsx | tracking/count fetch | console.error only | None |

### 4.3 Error Boundary/Fallback Infrastructure

- No app/**/error.tsx route error boundaries found.
- No explicit React ErrorBoundary component detected in scope.

---

## 5. Global Patterns

### 5.1 Distinct Loading Designs (Detected)

1. Full-screen LoadingState gradient loader
2. Generic Loading component spinner/dots/pulse
3. Inline skeleton cards (animate-pulse)
4. Micro spinners (Loader2 in buttons/rows)
5. Plain text Suspense fallbacks
6. Null Suspense fallback (analytics in app/layout.tsx)

### 5.2 Distinct Empty-State Designs (Detected)

1. Full custom empty hero/cards in pages
2. Compact text empty rows in admin sections
3. SectionEmptyStateSlot-based dashboards
4. Dropdown/tab compact empties (notifications/profile tabs)
5. Card-based dashboard empties (legacy EventManagement/VacancyManagement)

### 5.3 Shared Component Reuse

- Shared loading: present (LoadingState, Loading)
- Shared error: present (ErrorState, Alert)
- Shared empty: not standardized across app
- Dedicated resources empty/loading files exist but are empty/unused

---

## 6. Inconsistencies

### 6.1 Loading Inconsistencies

- Same type of page guard uses different visuals (LoadingState vs Loading vs plain Suspense text).
- app/resources/events/page.tsx has both early-return LoadingState and an additional in-layout loading section.
- Tab-level loading in app/profile/page.tsx and app/admin/page.tsx is not uniformly represented in content area.

### 6.2 Empty-State Inconsistencies

- Different style systems in resources pages, dashboard feature lists, admin tables, profile tabs, and dropdowns.
- app/page.tsx section emptiness can appear as blank grids when fetch fails, while other pages use explicit empty cards.

### 6.3 Unauthorized-State Inconsistencies

- Some routes/components silently redirect; others render Unauthorized/Error screens.
- Some feature containers include unauthorized render branches while parent layout already enforces redirects/guards.

### 6.4 Error-State Inconsistencies

- Mix of ErrorState, Alert, red inline banners, browser alert(), and console-only handling.
- Several action paths use alert() while adjacent areas use styled inline feedback.

---

## 7. Critical Gaps

### 7.1 Pages That Fetch Data But Have No Clear Error UI

- app/page.tsx
- app/blogs/page.tsx
- features/vacancies/components/VacanciesPageContainer.tsx
- components/dashboard/EventManagement.tsx
- components/dashboard/VacancyManagement.tsx
- components/BlogReactions.tsx
- components/ViewTracker.tsx

### 7.2 Guards/Flows With Potential UX Friction

- Mixed redirect vs inline unauthorized approaches across middleware/layout/features.
- app/admin/page.tsx and app/profile/page.tsx: tab transitions use internal loading flags without a single, consistent content-loading pattern.

### 7.3 Structural Gaps in UI-State Architecture

- No Next.js notFound() and no app-level not-found.tsx usage.
- No route-level error.tsx boundaries found.
- No unified, reusable EmptyState component in active use.
- components/resources/EmptyState.tsx and components/resources/LoadingState.tsx are empty files.

---

## 8. Full System Map (Condensed)

### App routes with explicit loading state

- /admin (layout + page)
- /dashboard (layout + events/profile/vacancies detail/create/edit paths)
- /blogs and /blogs/[id]
- /profile and /profile/[id]
- /resources/events, /resources/vacancies, /resources/organizations, /resources/materials and their detail pages
- /submit/blog/step1, /submit/blog/step2
- /edit/blog/[id], /edit/blog/[id]/step1, /edit/blog/[id]/step2
- auth verify/error/signout/signin flows (varied fallback/inline loading)

### App routes with explicit empty state

- /blogs
- /resources/events
- /resources/vacancies
- /resources/organizations
- /resources/materials
- /admin tabs (blogs/users/orgs/events/vacancies/notifications/materials)

### Feature/component modules with explicit state management

- features/dashboard/components/DashboardNotificationsPageContainer.tsx
- features/events/components/EventsPageContainer.tsx
- features/vacancies/components/VacanciesPageContainer.tsx
- features/profile/components/ProfilePageContainer.tsx
- components/Profile/Blogs.tsx
- components/Profile/Notifications.tsx
- components/NotificationBell.tsx
- components/NotificationContext.tsx
- components/RecentCommunityContent.tsx
- components/dashboard/EventManagement.tsx
- components/dashboard/VacancyManagement.tsx

End of audit.
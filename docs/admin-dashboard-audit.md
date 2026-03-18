# Admin Dashboard Audit Report

Date: 2026-02-04
Scope: Admin dashboard UI + admin-related backend APIs
Method: Static code review of UI/route handlers and models

## Summary
Multiple high‑impact UI↔API mismatches and security gaps were found. Several admin tabs appear to work superficially but either do nothing, update the wrong data, or expose restricted content. This report lists findings and a suggested fix order. Each item includes file references to speed implementation.

Status: All items in this report have been addressed and marked as fixed.

## Findings

### Critical (Broken functionality)
1) ✅ **Settings save/reset are wired incorrectly** (Fixed)
- UI sends raw settings body and DELETE body; API expects `{ settings: ... }` and query param `section`.
- Result: Save/reset likely no‑ops or returns 400.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L662-L706)
- API: [app/api/admin/settings/route.ts](../app/api/admin/settings/route.ts#L42-L164)

2) ✅ **Blog bulk actions fail** (Fixed)
- UI sends `ids`; API expects `storyIds`.
- Result: Bulk approve/reject/delete fails.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L1438-L1452)
- API: [app/api/admin/blogs/route.ts](../app/api/admin/blogs/route.ts#L147-L189)

3) ✅ **Admin events list/filter/stats use wrong fields** (Fixed)
- Admin events API uses `isApproved`/`rejectedAt` but Event model/other APIs use `status`.
- Result: Events tab filtering and stats inconsistent or empty.
- API: [app/api/admin/events/route.ts](../app/api/admin/events/route.ts#L46-L186)
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L495-L520)

4) ✅ **Organization delete likely deletes wrong collection** (Fixed)
- Admin delete endpoint uses User model but Organizations are stored in Organization collection.
- Result: Deletes fail or delete wrong records.
- API: [app/api/admin/organizations/[id]/route.ts](../app/api/admin/organizations/%5Bid%5D/route.ts#L1-L44)
- Model: [lib/models/Organization.ts](../lib/models/Organization.ts#L1-L120)

5) ✅ **Materials create form doesn’t meet API validation** (Fixed)
- UI only checks title/description/url but API requires category/type too.
- Result: Create fails with 400.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L1328-L1340)
- API: [app/api/materials/route.ts](../app/api/materials/route.ts#L79-L97)

6) ✅ **Blog approval notification doesn’t send** (Fixed)
- `/api/admin/blogs/[id]` checks `blog.authorId` (not in schema).
- Result: Notify author silently fails.
- API: [app/api/admin/blogs/[id]/route.ts](../app/api/admin/blogs/%5Bid%5D/route.ts#L139-L148)
- Model: [lib/models/Blog.ts](../lib/models/Blog.ts#L1-L44)

7) ✅ **Vacancy preview link points to missing route** (Fixed)
- UI uses `/admin/preview/vacancies/[id]` but route doesn’t exist.
- Result: Preview action fails.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L2712)

8) ✅ **Admin page redirects to non‑existing sign‑in** (Fixed)
- Admin page uses `/signin`; app uses `/auth/signin` elsewhere.
- Result: unauthenticated redirect likely 404.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L391)
- Reference: [app/admin/layout.tsx](../app/admin/layout.tsx#L24)

9) ✅ **Blog author filter doesn’t work** (Fixed)
- UI sends `author` (likely ID), API filters `authorName` string.
- Result: filter ineffective.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L404-L405)
- API: [app/api/admin/blogs/route.ts](../app/api/admin/blogs/route.ts#L41)

10) ✅ **Announcement targeting logic is inconsistent** (Fixed)
- Modal uses `announcementForm.target`, send logic uses `targetUsers`.
- Result: target selector ignored.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L548-L586)
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L4640-L4665)

### High (Security/Authorization)
11) ✅ **Public endpoints expose admin data via `adminView=true`** (Fixed)
- Events/vacancies allow adminView without admin auth, exposing pending/rejected.
- APIs: [app/api/events/route.ts](../app/api/events/route.ts#L27-L156), [app/api/vacancies/route.ts](../app/api/vacancies/route.ts#L23-L141)

12) ✅ **Single event/vacancy GET exposes unpublished content** (Fixed)
- No auth checks for pending/rejected status.
- APIs: [app/api/events/[id]/route.ts](../app/api/events/%5Bid%5D/route.ts#L10-L49), [app/api/vacancies/[id]/route.ts](../app/api/vacancies/%5Bid%5D/route.ts#L10-L47)

### Medium (Consistency/UX)
13) ✅ **Hardcoded admin emails in multiple APIs** (Fixed)
- Duplicates logic and conflicts with central role helper.
- APIs: [app/api/admin/users/route.ts](../app/api/admin/users/route.ts#L15), [app/api/admin/organizations/route.ts](../app/api/admin/organizations/route.ts#L11), [app/api/admin/events/route.ts](../app/api/admin/events/route.ts#L10), [app/api/admin/blogs/[id]/route.ts](../app/api/admin/blogs/%5Bid%5D/route.ts#L11)
- Helper: [lib/roles.ts](../lib/roles.ts#L9-L20)

14) ✅ **Role update allows invalid role** (Fixed)
- Allows `moderator` but schema allows only `user`/`admin`.
- API: [app/api/admin/users/route.ts](../app/api/admin/users/route.ts#L174)
- Model: [lib/models/User.ts](../lib/models/User.ts#L36-L73)

15) ✅ **Materials stats are page‑scoped** (Fixed)
- Stats computed only from current page, not total dataset.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L1198-L1220)

16) ✅ **Next/Image missing size props** (Fixed)
- Admin materials table uses Image without width/height or `fill`.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L3285-L3290)

17) ✅ **Scroll‑to‑form target missing** (Fixed)
- `data-announcement-form` isn’t defined in DOM.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L2931-L2990)

18) ✅ **Admin event preview returns to unused query param** (Fixed)
- Preview redirects to `/admin?tab=events`, but admin page ignores query param.
- UI: [app/admin/preview/events/[id]/page.tsx](../app/admin/preview/events/%5Bid%5D/page.tsx#L136-L169)
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L234)

19) ✅ **Review modal duplicated title + author rendering** (Fixed)
- Duplicated title; author can display `[object Object]`.
- UI: [app/admin/page.tsx](../app/admin/page.tsx#L3748-L3756)

## Fix Plan (Suggested Order)
1) Fix critical UI↔API mismatches: settings, blog bulk actions, materials create validation, Organization delete, blog notification.
2) Fix admin events API to align with `status` model; adjust UI if needed.
3) Add auth checks for `adminView` and unpublished single GETs.
4) Normalize admin authorization using `isAdminSession` helper.
5) UX polish: announcement targeting, missing preview route, query‑param tab restore, image sizing, scroll target.

## Next Step
All listed issues are fixed. If new issues are discovered, add them to this report and track with the same checklist format.
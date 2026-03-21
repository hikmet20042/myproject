# Unified UI State System (Final, Edge-Case Complete)

> Status: Final architecture policy (no implementation)
> Scope: Entire application (routes, layouts, features, components)
> Date: 2026-03-18
> Builds on: refined enforceable model

---

## 0. Policy Contract

This document closes all remaining edge-case ambiguity.

Compliance language:
- MUST: required.
- MUST NOT: prohibited.
- FORBIDDEN: hard violation.

Each route/section/action must resolve to exactly one visible primary state at any moment.

Primary states:
1. LoadingPage
2. LoadingSection
3. UnauthorizedPage
4. UnauthorizedRedirect
5. NotFoundPage
6. ErrorPage
7. ErrorInline
8. EmptyList
9. EmptyFiltered
10. Content

---

## 1. State Collision Rules (Critical)

Collision rule format:
- Collision
- Winner (always)
- Why
- Enforcement

## 1.1 NotFound vs Error

Winner: NotFoundPage (always) when absence is conclusively known.

Why:
- 404 is a semantic result, not a transport/runtime failure.
- Showing generic error for known absence creates false diagnostics.

Enforcement:
1. If resource lookup confirms non-existence, state MUST resolve to NotFoundPage.
2. ErrorPage is allowed only when existence cannot be determined due to technical failure.

## 1.2 Unauthorized vs NotFound

Winner: Unauthorized (always) for protected resources when permission check fails before safe existence disclosure.

Why:
- Prevents resource enumeration and information leakage.
- Security precedence outranks content semantics.

Enforcement:
1. If user lacks permission to inspect a resource, system MUST NOT reveal whether it exists.
2. Resolve to UnauthorizedPage (authenticated) or UnauthorizedRedirect (unauthenticated).
3. NotFoundPage is allowed only after authorization to inspect is granted.

## 1.3 Unauthorized vs Error

Winner: Unauthorized (always) when denial is established.

Why:
- Authorization failure is deterministic and user-actionable.
- Generic error obscures access policy and causes misrouting behavior.

Enforcement:
1. If permission decision is deny, resolve to Unauthorized state.
2. Error state must not replace known authorization denial.

## 1.4 Loading vs Error (race conditions)

Winner:
- Error wins once failure is final for active request identity.
- Loading wins only while request is pending and no terminal result exists.

Why:
- Terminal outcomes must end pending visual states.
- Prevents endless spinners over failed requests.

Enforcement:
1. Each request cycle MUST have identity (sequence token or equivalent conceptual request id).
2. Late responses from superseded requests MUST be ignored.
3. Active cycle terminal state (success/error/notFound/unauthorized) MUST clear loading immediately.

---

## 2. State Resolution Model

## 2.1 Inputs

State resolution consumes normalized inputs:
1. authState: unknown | unauthenticated | authenticated
2. permissionState: unknown | allowed | denied
3. dataState: unknown | loading | success | empty | notFound
4. errorState: none | recoverable | blocking
5. scopeType: route | section | action
6. requestIdentity: current | stale

## 2.2 Output

Output MUST be one resolved UI state for the scope.

Route scope outputs:
- LoadingPage
- UnauthorizedRedirect
- UnauthorizedPage
- NotFoundPage
- ErrorPage
- Content

Section scope outputs:
- LoadingSection
- ErrorInline
- EmptyList
- EmptyFiltered
- Content

Action scope outputs:
- inline-action-loading
- inline-action-error
- action-success-feedback
- idle

## 2.3 Resolver responsibility

Who resolves:
- Route-level owner resolves route output.
- Section-level owner resolves section output.
- Action-level owner resolves action output.

How developers must structure it:
1. Normalize inputs first (auth, permission, data, error).
2. Evaluate in deterministic order per owner.
3. Return exactly one primary state branch.
4. Derive secondary micro-feedback only inside the chosen branch.

## 2.4 Deterministic route resolution sequence

Mandatory route sequence:
1. If authState = unknown -> LoadingPage
2. If authState = unauthenticated and route protected -> UnauthorizedRedirect
3. If permissionState = unknown and permission required -> LoadingPage
4. If permissionState = denied -> UnauthorizedPage
5. If dataState = notFound (after authorized inspection) -> NotFoundPage
6. If errorState = blocking -> ErrorPage
7. If dataState = loading and page-critical -> LoadingPage
8. Else -> Content

Any deviation is non-compliant.

---

## 3. NotFound vs Unauthorized Security Rule

Strict security rule:
1. If user is not authorized to inspect a resource, UI MUST resolve to Unauthorized state.
2. UI MUST NOT disclose resource existence, absence, metadata, or identifier validity.
3. NotFound may be resolved only after authorization-to-inspect is established.

Case handling:
- Resource exists but access denied: show UnauthorizedPage/UnauthorizedRedirect, never NotFound.
- Resource does not exist but access denied: still show Unauthorized state (no existence disclosure).
- Resource does not exist and user is authorized to inspect: show NotFoundPage.

Rationale:
- Eliminates enumeration leaks.
- Keeps access control semantics consistent across all protected resources.

---

## 4. Loading Latency Rules

These thresholds define indicator timing policy.

## 4.1 Latency bands

1. 0-120 ms: ultra-fast
- Loader MUST NOT be shown.
- Keep current view unchanged.

2. 121-300 ms: fast
- Loader SHOULD be delayed.
- Show indicator only if operation exceeds 300 ms total.

3. 301-1000 ms: moderate
- Loader MUST be shown.
- Section operations: LoadingSection/in-action spinner.
- Route-critical operations: LoadingPage.

4. >1000 ms: slow
- Loader MUST be visible with contextual text.
- For route-level waits, text MUST explain what is loading.

## 4.2 Immediate-show exceptions

Indicator MUST show immediately (no delay) when:
1. User triggered destructive or irreversible action (delete/publish/submit finalization).
2. Route access/auth resolution blocks all content.
3. Security/permission evaluation is pending for protected content.

## 4.3 Anti-flicker rule

1. Once shown, a loader SHOULD remain visible for a short minimum display window (recommended 180-250 ms) to avoid flash flicker.
2. This minimum window MUST NOT delay terminal state beyond usability; terminal errors still take precedence.

---

## 5. Optimistic UI Rules

## 5.1 Optimistic updates are allowed only when all are true

1. Operation is reversible.
2. Failure probability is low and bounded.
3. Domain risk is low (no legal/security/financial critical side effects).
4. Rollback path is well-defined and user-visible.

Typical allowed class:
- preference toggles
- non-critical reaction counters
- local ordering adjustments

## 5.2 Optimistic updates are FORBIDDEN when any is true

1. Operation is destructive (delete with irreversible consequences).
2. Operation changes authorization, billing, compliance, or publication status.
3. Side effects are multi-entity and difficult to reconcile.
4. Server canonical validation can reject with high variability.

## 5.3 Rollback behavior (mandatory)

1. On optimistic apply, mark entity as pending-sync.
2. If server success: clear pending state, keep optimistic value.
3. If server failure:
   - restore previous snapshot atomically,
   - show inline action error,
   - provide retry.
4. Rollback MUST NOT leave mixed old/new fragments in same entity view.

---

## 6. Final Edge-Case Rules

## 6.1 Fast success (no loader)

Rule:
1. If operation completes within no-loader threshold (<=120 ms), keep current UI and transition directly to success/content.
2. No transient spinner/skeleton flash allowed.

## 6.2 Fast error

Rule:
1. If failure occurs before loader threshold, show error state directly.
2. Do not force loader display before error.
3. Error must still be scoped by owner (ErrorPage/ErrorInline/action error).

## 6.3 Retry spam

Rule:
1. Concurrent retries for same scope MUST be coalesced to one active request.
2. Retry controls MUST be disabled while active retry runs.
3. Superseded retries MUST be canceled or ignored by request identity.
4. UI MUST show one loading indicator for active retry cycle.

## 6.4 Rapid navigation changes

Rule:
1. Route change invalidates previous route requests immediately.
2. Late responses from prior route MUST NOT mutate current route state.
3. New route owner resolves independently from normalized fresh inputs.
4. Cross-route visual bleed (old data flash on new identity) is FORBIDDEN unless explicitly allowed by stale strategy and same identity class.

## 6.5 Stale + error combination

Rule:
1. If stale snapshot exists and refresh fails, keep stale content visible.
2. Show ErrorInline + refresh indicator termination in section scope.
3. Provide retry without clearing valid stale snapshot.
4. If stale data is invalid/sensitive, purge stale snapshot and escalate to blocking state per owner.

---

## 7. Unified Precedence Table (Single Source of Truth)

For route scope, highest wins:
1. UnauthorizedRedirect (unauthenticated protected route)
2. UnauthorizedPage (authenticated denied)
3. NotFoundPage (authorized and confirmed absent)
4. ErrorPage (blocking technical failure)
5. LoadingPage (pending terminal decision)
6. Content

For section scope, highest wins:
1. ErrorInline (terminal sectional failure)
2. LoadingSection (pending sectional request)
3. EmptyFiltered (resolved success + active filters + zero results)
4. EmptyList (resolved success + no filters + zero results)
5. Content

For action scope, highest wins:
1. inline-action-error
2. inline-action-loading
3. action-success-feedback
4. idle

Note:
- Scope precedence does not permit lower scope to override higher scope blocking decisions.

---

## 8. Final Non-Negotiable Rules

1. System MUST resolve to one primary state per scope at any time.
2. Unauthorized determination MUST precede notFound disclosure on protected resources.
3. notFound MUST beat generic error when absence is conclusive.
4. Terminal states MUST clear loading for active request identity.
5. Silent failure UX is FORBIDDEN.
6. Browser alert UX is FORBIDDEN.
7. Duplicate loaders for same owner/state cycle are FORBIDDEN.
8. Redirecting authenticated denied users to sign-in is FORBIDDEN.
9. Ambiguous branch order is FORBIDDEN.
10. Any non-deterministic edge-case behavior is non-compliant.

---

## 9. Architecture Completion Check

A surface is final-compliant only if all are true:
1. Collision outcomes are explicitly defined and follow precedence.
2. Resolver model is documented with normalized inputs and one output.
3. Security rule for Unauthorized vs NotFound is enforced.
4. Latency thresholds are declared and applied.
5. Optimistic behavior includes allow/forbid criteria and rollback contract.
6. Edge cases (fast success/error, retry spam, rapid nav, stale+error) are deterministic.

If any condition is false, the UI state architecture is not finalized.

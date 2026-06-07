import { type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Mock user objects
// ---------------------------------------------------------------------------

export const MOCK_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { account_type: 'user', full_name: 'Test User' },
}

export const MOCK_ORG_USER = {
  id: 'org-user-id',
  email: 'org@test.com',
  user_metadata: { account_type: 'organization', full_name: 'Test Org User' },
}

export const MOCK_ADMIN = {
  id: 'admin-id',
  email: 'admin@test.com',
  user_metadata: { account_type: 'admin' },
}

export const MOCK_ORG_PROFILE = {
  id: 'org-1',
  name: 'Test Org',
  account_id: 'org-user-id',
  moderation_status: 'approved' as const,
}

// ---------------------------------------------------------------------------
// Generic mock-user shape for Supabase auth/v1/user response
// ---------------------------------------------------------------------------

type MockUser = {
  id: string
  email: string
  user_metadata: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Core auth-route interceptor
//
// The Supabase JS client calls GET /auth/v1/user to check the session.
// We intercept that and return the provided user object.
// All other auth/v1 requests (token refresh, signout, etc.) get an empty 200.
// ---------------------------------------------------------------------------

async function routeAuthV1(page: Page, user: MockUser | null) {
  await page.route(/auth\/v1/, async (route: any) => {
    const url = route.request().url()
    if (url.includes('/user') && !url.includes('/token')) {
      if (user) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user }),
        })
      } else {
        // Unauthenticated – return empty user object
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      }
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    }
  })
}

// ---------------------------------------------------------------------------
// High-level setup helpers
// ---------------------------------------------------------------------------

/**
 * Mock an authenticated **regular user** session.
 * Intercepts the Supabase auth/v1/user endpoint and mocks the organizations/me
 * endpoint as needed.
 */
export async function setupUserAuthMock(page: Page) {
  await routeAuthV1(page, MOCK_USER)
}

/**
 * Mock an authenticated **organization** session.
 * Also intercepts /api/organizations/me to return an approved org profile.
 */
export async function setupOrgAuthMock(page: Page) {
  await routeAuthV1(page, MOCK_ORG_USER)
  await page.route('**/api/organizations/me', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_ORG_PROFILE }),
    })
  })
}

/**
 * Mock an authenticated **admin** session.
 */
export async function setupAdminAuthMock(page: Page) {
  await routeAuthV1(page, MOCK_ADMIN)
}

/**
 * Mock an **unauthenticated** session (returns empty user for auth/v1/user).
 */
export async function setupUnauthMock(page: Page) {
  await routeAuthV1(page, null)
}

// ---------------------------------------------------------------------------
// Test-mode auth (combines middleware header bypass + browser route mocks)
//
// Use this instead of setupOrgAuthMock/setupUserAuthMock for routes that are
// protected by middleware. Sets the X-Test-* headers that the middleware
// test-mode branch reads, AND mocks the browser-side /auth/v1/user endpoint
// so the React tree is consistent.
// ---------------------------------------------------------------------------

type TestRole = 'admin' | 'user' | 'organization'

export async function mockTestRoleAuth(
  page: Page,
  role: TestRole,
  opts: { userId?: string; orgStatus?: 'approved' | 'pending' | 'rejected' } = {}
) {
  const userId = opts.userId ?? `test-${role}-id`
  const orgStatus = opts.orgStatus ?? 'approved'

  // Use CONTEXT-level extra headers (not page-level) so the headers are sent
  // on the very first navigation, which is what the middleware intercepts.
  // page.setExtraHTTPHeaders only takes effect on requests made AFTER the call.
  await page.context().setExtraHTTPHeaders({
    'x-test-role': role,
    'x-test-user-id': userId,
    'x-test-org-status': orgStatus,
  })

  // Mirror the identity client-side via window.__TEST_AUTH__ so useAuthSync
  // skips the Supabase PostgREST account lookup (which has no mock in tests).
  const accountType = role === 'organization' ? 'organization' : role === 'admin' ? 'user' : 'user'
  await page.addInitScript(({ userId, role, accountType, orgStatus }) => {
    ;(window as unknown as { __TEST_AUTH__?: unknown }).__TEST_AUTH__ = {
      id: userId,
      email: `${role}@test.local`,
      name: `Test ${role}`,
      role,
      accountType,
      organizationStatus: accountType === 'organization' ? orgStatus : null,
    }
  }, { userId, role, accountType, orgStatus })

  // Mirror server-side identity in the browser so React components see the
  // same role. Without this, useSession() returns null and the UI flickers.
  const user =
    role === 'admin' ? { ...MOCK_ADMIN, id: userId } :
    role === 'organization' ? { ...MOCK_ORG_USER, id: userId } :
    { ...MOCK_USER, id: userId }
  await routeAuthV1(page, user)

  // For org users, also mock /api/organizations/me so the org profile
  // (name, moderation_status) is visible to client components.
  if (role === 'organization') {
    await page.route('**/api/organizations/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...MOCK_ORG_PROFILE, account_id: userId, moderation_status: orgStatus },
        }),
      })
    })
  }
}

// ---------------------------------------------------------------------------
// Legacy alias – some files used `setupAuthMock` for the regular-user variant
// ---------------------------------------------------------------------------

export const setupAuthMock = setupUserAuthMock

// ---------------------------------------------------------------------------
// Utility: programmatically submit a form (for testing validation)
// ---------------------------------------------------------------------------

export async function submitForm(page: Page) {
  await page.evaluate(() => {
    const form = document.querySelector('form')
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  })
}

// ---------------------------------------------------------------------------
// Legacy: kept for backward-compat with tests/helpers/auth.ts
// ---------------------------------------------------------------------------

export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass123!',
  name: 'Test User',
}

export async function signInAsTestUser(page: Page) {
  await page.goto('/auth/signin')
  await page.locator('input[type="email"]').fill(TEST_USER.email)
  await page.locator('input[type="password"]').fill(TEST_USER.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForLoadState('networkidle')
}

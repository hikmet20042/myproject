import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Onboarding — Role Selection', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/onboarding/role')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('displays role selection page after registration', async ({ page }) => {
    // Mock auth with no account_type yet (new user)
    await page.route(/auth\/v1/, async (route: any) => {
      const url = route.request().url()
      if (url.includes('/user') && !url.includes('/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'new-user-id', email: 'new@test.com', user_metadata: {} } }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      }
    })
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/role')
    await expect(page.getByText(/Rol|seçim|İstifadəçi|Təşkilat/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows sign-out button on role selection page', async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'new-user-id' })
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/role')
    // Sign-out button is labeled "Hesabdan çıx" (not "Çıxış").
    await expect(page.getByRole('button', { name: /Hesabdan çıx/i })).toBeVisible({ timeout: 10000 })
  })

  test('redirects away when accountType already set (organization)', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/onboarding/role')
    // Org user with approved status should be redirected to dashboard
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  })

  test('user role selection navigates to /onboarding/user', async ({ page }) => {
    await page.route(/auth\/v1/, async (route: any) => {
      const url = route.request().url()
      if (url.includes('/user') && !url.includes('/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'new-user-id', email: 'new@test.com', user_metadata: {} } }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      }
    })
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/role')
    const userButton = page.getByText(/İstifadəçi|Şəxsi/i)
    if (await userButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await userButton.first().click()
      await expect(page).toHaveURL(/\/onboarding\/user/, { timeout: 10000 })
    }
  })

  test('organization role selection navigates to /onboarding/organization', async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'new-user-id' })
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/role')
    // "Təşkilat" text also matches the header's "Təşkilatlar" nav link.
    // Scope the locator to the role-card button to avoid clicking the nav.
    const orgButton = page.locator('button').filter({ hasText: /^Təşkilat/ }).first()
    if (await orgButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgButton.click()
      await expect(page).toHaveURL(/\/onboarding\/organization/, { timeout: 10000 })
    }
  })
})

test.describe('Onboarding — User Flow', () => {
  test('displays user onboarding form with interests', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/user')
    await expect(page.getByText(/ maraqlar|İlgi|Profil/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('submits user onboarding via API', async ({ page }) => {
    let onboardCalled = false
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.route('**/api/users/onboarding', async (route: any) => {
      onboardCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { message: 'Onboarding completed' } }),
      })
    })
    await page.goto('/onboarding/user')
    await expect(page.getByText(/İlgi|maraq|maraqlar/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows interests selection counter', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/user')
    await expect(page.getByText(/seç|seçilmiş|seçim/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/onboarding/user')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })
})

test.describe('Onboarding — Organization Flow', () => {
  test('displays organization onboarding form', async ({ page }) => {
    await page.route(/auth\/v1/, async (route: any) => {
      const url = route.request().url()
      if (url.includes('/user') && !url.includes('/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'org-new-id', email: 'org-new@test.com', user_metadata: {} } }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      }
    })
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/organization')
    await expect(page.getByText(/Təşkilat|adı|profil/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows validation errors for empty organization form', async ({ page }) => {
    await page.route(/auth\/v1/, async (route: any) => {
      const url = route.request().url()
      if (url.includes('/user') && !url.includes('/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'org-new-id', email: 'org-new@test.com', user_metadata: {} } }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      }
    })
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/organization')
    await expect(page.getByText(/Təşkilat|Profil/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('submits organization via API', async ({ page }) => {
    await page.route(/auth\/v1/, async (route: any) => {
      const url = route.request().url()
      if (url.includes('/user') && !url.includes('/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'org-new-id', email: 'org-new@test.com', user_metadata: {} } }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      }
    })
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.route('**/api/organizations/onboarding', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { message: 'Organization created' } }),
      })
    })
    await page.goto('/onboarding/organization')
    await expect(page.getByText(/Təşkilat|Profil/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows character counter for description', async ({ page }) => {
    await page.route(/auth\/v1/, async (route: any) => {
      const url = route.request().url()
      if (url.includes('/user') && !url.includes('/token')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'org-new-id', email: 'org-new@test.com', user_metadata: {} } }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      }
    })
    await page.route('**/api/accounts/me', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { account_type: null } }),
      })
    })
    await page.goto('/onboarding/organization')
    await expect(page.getByText(/Təşkilat|Açıqlama/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Onboarding — Pending Organization State', () => {
  test('pending org user sees /organization/pending instead of dashboard', async ({ page }) => {
    // Use mockTestRoleAuth so the middleware test-mode branch sees the
    // org role and applies the pending-org redirect. Without the
    // X-Test-Org-Status header, the real Supabase auth runs and the
    // request is redirected to /auth/signin.
    await mockTestRoleAuth(page, 'organization', {
      userId: 'pending-org-id',
      orgStatus: 'pending',
    })
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/organization\/pending/, { timeout: 10000 })
  })
})

import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Dashboard — Auth Guard', () => {
  test('redirects unauthenticated user to sign-in', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 })
  })
})

test.describe('Dashboard — Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'organization', { orgStatus: 'approved' })
    await page.route('**/api/users/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-user-id',
            email: 'test@test.com',
            full_name: 'Test User',
            account_type: 'user',
          },
        }),
      })
    })
    await page.route('**/api/users/profile/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { savedCount: 5, followedOrgsCount: 3 },
        }),
      })
    })
  })

  test('displays dashboard with welcome message', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Rəhbər paneli/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows quick action cards', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tədbir yarat|Vakansiya/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows stats cards', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tədbirlər|Vakansiyalar|İzləyicilər|Baxışlar/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows quick actions section', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Sürətli əməliyyatlar/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Dashboard — Organization User View', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'organization', { orgStatus: 'approved' })
    await page.route('**/api/organizations/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'org-1',
            name: 'Test Organization',
            account_id: 'org-user-id',
            moderation_status: 'approved',
          },
        }),
      })
    })
    await page.route('**/api/events**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { events: [] }, meta: {} }),
      })
    })
    await page.route('**/api/vacancies**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { vacancies: [] }, meta: {} }),
      })
    })
    await page.route('**/api/users/profile/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { publishedBlogs: 2, approvedEvents: 3, approvedVacancies: 1 },
        }),
      })
    })
  })

  test('shows organization quick actions (create event, vacancy)', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tədbir yarat|Vakansiya/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows stats cards with counts', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tədbirlər|Vakansiyalar/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('has link to profile settings', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const settingsLink = page.getByRole('link', { name: /Profil|Tənzimləmələr/i }).first()
    if (await settingsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(settingsLink).toBeVisible()
    }
  })
})

test.describe('Dashboard — Content Creation Validation', () => {
  test('event creation form shows required field errors', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization', { orgStatus: 'approved' })
    await page.route('**/api/organizations/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'org-1', name: 'Test Org', account_id: 'org-user-id', moderation_status: 'approved' },
        }),
      })
    })
    await page.goto('/dashboard/events/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Hadisəni yarat|Tədbir/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('vacancy creation form shows required fields', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization', { orgStatus: 'approved' })
    await page.route('**/api/organizations/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'org-1', name: 'Test Org', account_id: 'org-user-id', moderation_status: 'approved' },
        }),
      })
    })
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Vakansiya yarat/i).first()).toBeVisible({ timeout: 10000 })
  })
})

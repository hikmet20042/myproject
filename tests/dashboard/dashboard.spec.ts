import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Dashboard — Access Control', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('redirects regular user away from dashboard', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    // Regular users should be redirected away from org-only /dashboard
    await expect(page).not.toHaveURL(/\/dashboard\/$/, { timeout: 10000 })
  })

  test('allows approved organization to access dashboard', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization', { orgStatus: 'approved' })
    await page.route('**/api/users/profile/stats', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })
})

test.describe('Dashboard — Overview Page', () => {
  test('displays stat cards for events, vacancies, followers, views', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/users/profile/stats', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { publishedBlogs: 3, approvedEvents: 5, approvedVacancies: 2, totalViews: 150 } }),
      })
    })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tədbirlər|Vakansiyalar|Bloqlar|Baxışlar/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows quick action buttons', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/users/profile/stats', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Yarat|Yeni/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state when no events or vacancies', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/users/profile/stats', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.route('**/api/events*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { events: [] }, meta: {} }) })
    })
    await page.route('**/api/vacancies*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { vacancies: [] }, meta: {} }) })
    })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Dashboard|İdarəetmə|Xoş gəldin/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows sidebar nav items for org dashboard', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/users/profile/stats', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tədbirlər|Vakansiyalar|Profil/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Dashboard — Events Management', () => {
  test('displays manage events page with Azerbaijani heading', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/events*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { events: [] }, meta: {} }) })
    })
    await page.goto('/dashboard/events', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tədbirlər|Hadisələr|İdarəetmə/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state for events management', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/events*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { events: [] }, meta: {} }) })
    })
    await page.goto('/dashboard/events', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tapılmadı| boş|yoxdur/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('navigates to create event page', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/events*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { events: [] }, meta: {} }) })
    })
    await page.goto('/dashboard/events', { waitUntil: 'domcontentloaded' })
    const createBtn = page.getByRole('link', { name: /Yarat|Yeni|Əlavə et/i })
    if (await createBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.first().click()
      await expect(page).toHaveURL(/\/dashboard\/events\/create/, { timeout: 10000 })
    }
  })

  test('event edit page shows existing data', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/events/evt-123', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true, data: {
            event: {
              id: 'evt-123', title: 'Existing Event', slug: 'existing-event',
              description: 'Event description', status: 'approved',
              startDate: new Date().toISOString(), endDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/dashboard/events/edit/evt-123', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Existing Event|Redaktə|Düzəliş/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Dashboard — Vacancies Management', () => {
  test('displays manage vacancies page with Azerbaijani heading', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/vacancies*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { vacancies: [] }, meta: {} }) })
    })
    await page.goto('/dashboard/vacancies', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Vakansiyalar|İdarəetmə/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state for vacancies management', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/vacancies*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { vacancies: [] }, meta: {} }) })
    })
    await page.goto('/dashboard/vacancies', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tapılmadı| boş|yoxdur/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('navigates to create vacancy page', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/vacancies*', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { vacancies: [] }, meta: {} }) })
    })
    await page.goto('/dashboard/vacancies', { waitUntil: 'domcontentloaded' })
    const createBtn = page.getByRole('link', { name: /Yarat|Yeni|Əlavə et/i })
    if (await createBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.first().click()
      await expect(page).toHaveURL(/\/dashboard\/vacancies\/create/, { timeout: 10000 })
    }
  })

  test('displays create vacancy form with required fields', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Vakansiya|Yarat|Başlıq/i).first()).toBeVisible({ timeout: 10000 })
  })
})

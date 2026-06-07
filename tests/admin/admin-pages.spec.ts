import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Admin — Auth Guard for All Admin Routes', () => {
  const adminRoutes = [
    '/admin',
    '/admin/users',
    '/admin/organizations',
    '/admin/blogs',
    '/admin/notifications',
    '/admin/materials',
  ]

  for (const route of adminRoutes) {
    test(`redirects unauthenticated user from ${route} to sign-in`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 })
    })
  }
})

test.describe('Admin Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'admin', { userId: 'admin-user-id' })
    await page.route('**/api/admin/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalUsers: 150,
            totalOrganizations: 25,
            totalBlogs: 45,
            totalEvents: 30,
            totalVacancies: 20,
            pendingOrganizations: 5,
            pendingBlogs: 8,
          },
        }),
      })
    })
    await page.route('**/api/admin/recent-activity', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { activities: [] } }),
      })
    })
  })

  test('displays admin dashboard with stats cards', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByText(/150|İstifadəçi/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows pending items requiring attention', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByText(/Təsdiq gözləyən|Gözləyən/i)).toBeVisible({ timeout: 10000 })
  })

  test('has navigation links to admin sub-pages', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('link', { name: /İstifadəçilər/i }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /Təşkilatlar/i }).first()).toBeVisible()
  })
})

test.describe('Admin Users Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'admin', { userId: 'admin-user-id' })
    await page.route('**/api/admin/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'u1', email: 'user1@test.com', full_name: 'Test User 1', account_type: 'user', created_at: new Date().toISOString() },
            { id: 'u2', email: 'user2@test.com', full_name: 'Test User 2', account_type: 'organization', created_at: new Date().toISOString() },
          ],
          meta: { total: 2 },
        }),
      })
    })
  })

  test('displays users list page', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.getByText(/İstifadəçilər/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows user entries in the list', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.getByText('user1@test.com')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('user2@test.com')).toBeVisible()
  })

  test('shows user names', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.getByText('Test User 1')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Admin Organizations Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'admin', { userId: 'admin-user-id' })
    await page.route('**/api/admin/organizations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'o1', name: 'Test Org', moderation_status: 'pending', created_at: new Date().toISOString() },
          ],
          meta: { total: 1 },
        }),
      })
    })
  })

  test('displays organizations list page', async ({ page }) => {
    await page.goto('/admin/organizations')
    await expect(page.getByText(/Təşkilatlar/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows organization entries', async ({ page }) => {
    await page.goto('/admin/organizations')
    await expect(page.getByText('Test Org')).toBeVisible({ timeout: 10000 })
  })

  test('shows moderation status for organizations', async ({ page }) => {
    await page.goto('/admin/organizations')
    await expect(page.getByText(/Gözləyən|pending/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Admin Blogs Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'admin', { userId: 'admin-user-id' })
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'b1', title: 'Test Blog Post', status: 'pending', author_id: 'a1', created_at: new Date().toISOString() },
          ],
          meta: { total: 1 },
          filters: { authors: [], tags: [] },
        }),
      })
    })
  })

  test('displays blogs moderation page', async ({ page }) => {
    await page.goto('/admin/blogs')
    await expect(page.getByText(/Bloqlar|Moderasiya/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows blog entries for moderation', async ({ page }) => {
    await page.goto('/admin/blogs')
    await expect(page.getByText('Test Blog Post')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Admin Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'admin', { userId: 'admin-user-id' })
  })

  test('displays notifications page', async ({ page }) => {
    await page.goto('/admin/notifications')
    await expect(page.getByText(/Bildirişlər/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Admin Materials Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'admin', { userId: 'admin-user-id' })
  })

  test('displays materials page', async ({ page }) => {
    await page.goto('/admin/materials')
    await expect(page.getByText(/Materiallar|Material/i).first()).toBeVisible({ timeout: 10000 })
  })
})

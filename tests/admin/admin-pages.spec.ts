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

  test('displays admin dashboard page', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Admin Paneli/i })).toBeVisible({ timeout: 10000 })
  })

  test('has navigation links to admin sub-pages', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
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
          data: {
            users: [
              { _id: 'u1', name: 'Test User 1', email: 'user1@test.com', role: 'user', emailVerified: true, createdAt: new Date().toISOString() },
              { _id: 'u2', name: 'Test User 2', email: 'user2@test.com', role: 'organization', emailVerified: false, createdAt: new Date().toISOString() },
            ],
            pagination: { page: 1, totalPages: 1, total: 2 },
            stats: { total: 2, verified: 1, admin: 0 },
          },
        }),
      })
    })
  })

  test('displays users list page', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/İstifadəçilər/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows user entries in the list', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('user1@test.com')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('user2@test.com')).toBeVisible()
  })

  test('shows user names', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' })
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
          data: {
            organizations: [
              { _id: 'o1', organizationName: 'Test Org', email: 'org@test.com', description: 'Test organization description', status: 'pending', createdAt: new Date().toISOString() },
            ],
            stats: { pending: 1, approved: 0, rejected: 0, total: 1 },
            pagination: { currentPage: 1, totalPages: 1 },
          },
        }),
      })
    })
  })

  test('displays organizations list page', async ({ page }) => {
    await page.goto('/admin/organizations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Təşkilatlar/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows organization entries', async ({ page }) => {
    await page.goto('/admin/organizations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Test Org' })).toBeVisible({ timeout: 10000 })
  })

  test('shows moderation status for organizations', async ({ page }) => {
    await page.goto('/admin/organizations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Gözləmədə|Gözləyən|pending/i).first()).toBeVisible({ timeout: 10000 })
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
          data: {
            items: [
              { id: 'b1', title: 'Test Blog Post', status: 'pending', author_id: { id: 'a1', name: 'Author1', email: 'author1@test.com' }, created_at: new Date().toISOString() },
            ],
            page: 1,
            total: 1,
            limit: 10,
          },
          filters: { authors: [], tags: [] },
        }),
      })
    })
  })

  test('displays blogs moderation page', async ({ page }) => {
    await page.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Bloq/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows blog entries for moderation', async ({ page }) => {
    await page.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Test Blog Post')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Admin Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'admin', { userId: 'admin-user-id' })
  })

  test('displays notifications page', async ({ page }) => {
    await page.goto('/admin/notifications', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Bildirişlər/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Admin Materials Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'admin', { userId: 'admin-user-id' })
  })

  test('displays materials page', async ({ page }) => {
    await page.goto('/admin/materials', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Materiallar|Material/i).first()).toBeVisible({ timeout: 10000 })
  })
})

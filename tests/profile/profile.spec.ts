import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

const MOCK_PROFILE = {
  success: true,
  data: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      role: 'user',
      emailVerified: true,
      createdAt: new Date().toISOString(),
    },
    profile: {
      bio: 'Test bio',
      location: 'Bakı',
      occupation: 'Developer',
      avatarUrl: null,
    },
  },
}

const MOCK_STATS = {
  success: true,
  data: {
    stats: {
      totalBlogs: 5,
      totalViews: 120,
      totalLikes: 30,
      totalDislikes: 2,
      totalSaves: 10,
      joinedDate: new Date().toISOString(),
    },
  },
}

const MOCK_SAVED_EMPTY = {
  success: true,
  data: { items: [] },
}

const MOCK_SAVED_WITH_ITEMS = {
  success: true,
  data: {
    items: [
      { id: 's1', itemId: 'e1', itemType: 'event', title: 'Test Event', description: 'An event', href: '/resources/events/test-event', createdAt: new Date().toISOString() },
      { id: 's2', itemId: 'v1', itemType: 'vacancy', title: 'Test Vacancy', description: 'A vacancy', href: '/resources/vacancies/test-vacancy', createdAt: new Date().toISOString() },
    ],
  },
}

const MOCK_NOTIFICATIONS = {
  success: true,
  data: {
    notifications: [
      { id: 'n1', title: 'Test Notification', message: 'You have a new message', type: 'info', read: false, createdAt: new Date().toISOString() },
    ],
    unreadCount: 1,
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  },
}



test.describe('Profile — Overview Page', () => {
  test('redirects unauthenticated user to sign-in', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('displays profile page with Azerbaijani heading', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROFILE),
      })
    })
    await page.route('**/api/users/profile/stats', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STATS),
      })
    })
    await page.goto('/profile')
    await expect(page.getByText(/Profil mərkəzi/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows profile statistics cards', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROFILE),
      })
    })
    await page.route('**/api/users/profile/stats', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STATS),
      })
    })
    await page.goto('/profile')
    await expect(page.getByText(/Bloqlar/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Baxışlar/i)).toBeVisible()
    await expect(page.getByText(/Bəyənmələr/i)).toBeVisible()
  })

  test('shows profile settings button', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROFILE),
      })
    })
    await page.route('**/api/users/profile/stats', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STATS),
      })
    })
    await page.goto('/profile')
    await expect(page.getByText(/Tənzimlə/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Profile — Saved Items', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/saved')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('displays saved items page with Azerbaijani heading', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/saved', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SAVED_WITH_ITEMS),
      })
    })
    await page.goto('/saved')
    await expect(page.getByText(/Saxlanılanlar/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state when nothing saved', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/saved', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SAVED_EMPTY),
      })
    })
    await page.goto('/saved')
    await expect(page.getByText(/Heç nə saxlamamısan/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows saved items with stats counts', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/saved', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SAVED_WITH_ITEMS),
      })
    })
    await page.goto('/saved')
    await expect(page.getByText(/Ümumi/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Tədbirlər/i).first()).toBeVisible()
    await expect(page.getByText(/Vakansiyalar/i).first()).toBeVisible()
  })
})

test.describe('Notifications Page', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('displays notifications page with Azerbaijani heading', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/notifications', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTIFICATIONS),
      })
    })
    await page.goto('/notifications')
    await expect(page.getByText(/Bildirişlər/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows filter tabs for notifications', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/notifications', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTIFICATIONS),
      })
    })
    await page.goto('/notifications')
    await expect(page.getByText(/Hamısı|Oxunmamış|Oxunmuş/i).first()).toBeVisible({ timeout: 10000 })
  })
})

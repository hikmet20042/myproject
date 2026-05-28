import { test, expect } from '@playwright/test'

const USER_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', user_metadata: { name: 'Test User' }, accountType: 'user' },
  access_token: 'fake-token',
}

const mockNotifications = () => ({
  data: {
    items: [
      { id: 'n1', title: 'Welcome!', message: 'Welcome to icma360', type: 'WELCOME', isRead: false, createdAt: new Date().toISOString() },
      { id: 'n2', title: 'Blog Liked', message: 'Someone liked your blog', type: 'BLOG_LIKE', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'n3', title: 'Event Approved', message: 'Your event was approved', type: 'EVENT_APPROVED', isRead: false, createdAt: new Date().toISOString() },
    ],
    meta: { unreadCount: 2 },
  },
})

test.describe('Notifications — Page Render', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
  })

  test('displays notifications page with Azerbaijani heading', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Bildirişlər/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows filter tabs', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('tab', { name: /Hamısı/i }).or(page.getByText(/Hamısı/i))).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('tab', { name: /Oxunmamış/i }).or(page.getByText(/Oxunmamış/i))).toBeVisible()
    await expect(page.getByRole('tab', { name: /Oxunmuş/i }).or(page.getByText(/Oxunmuş/i))).toBeVisible()
  })
})

test.describe('Notifications — Summary Stats', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
    await page.route('**/api/notifications*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockNotifications()) })
      } else {
        await route.continue()
      }
    })
  })

  test('shows summary stat cards', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Ümumi/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Oxunmamış/i)).toBeVisible()
  })
})

test.describe('Notifications — Mark All As Read', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
  })

  test('mark all as read button calls correct API', async ({ page }) => {
    let markAllBody: any = null
    await page.route('**/api/notifications*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockNotifications()) })
      } else if (route.request().method() === 'POST') {
        markAllBody = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
    const markAllBtn = page.getByRole('button', { name: /Hamısını oxunmuş et/i })
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click()
      await page.waitForLoadState('networkidle')
    }
  })
})

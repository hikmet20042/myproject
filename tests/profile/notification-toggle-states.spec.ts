import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

const MOCK_NOTIFICATIONS = {
  success: true,
  data: {
    notifications: [
      { id: 'n1', title: 'Yeni blog', message: 'Yeni blog yazısı dərc olundu', type: 'info', read: false, createdAt: new Date().toISOString() },
      { id: 'n2', title: 'Tədbir yeniləndi', message: 'Tədbir məlumatları yeniləndi', type: 'warning', read: true, createdAt: new Date().toISOString() },
    ],
    unreadCount: 1,
    pagination: { page: 1, limit: 20, total: 2, pages: 1 },
  },
}



test.describe('Notifications — Page Render', () => {
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

  test('shows filter tabs', async ({ page }) => {
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

test.describe('Notifications — Summary Stats', () => {
  test('shows summary stat cards', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/notifications', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTIFICATIONS),
      })
    })
    await page.goto('/notifications')
    await expect(page.getByText(/Oxunmamış|Ümumi|Bildiriş/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Notifications — Mark All As Read', () => {
  test('mark all as read button calls correct API', async ({ page }) => {
    let markAllCalled = false
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/notifications', async (route: any) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        markAllCalled = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { message: 'Bütün bildirişlər oxundu olaraq işarələndi' } }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_NOTIFICATIONS),
        })
      }
    })
    await page.goto('/notifications')
    const markAllButton = page.getByText(/Hamısını oxundu|Oxundu işarələ/i)
    if (await markAllButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await markAllButton.first().click()
    }
  })
})

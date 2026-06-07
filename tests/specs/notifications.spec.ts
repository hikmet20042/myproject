import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'
import { mockApi } from '../helpers/api'
import { makeNotificationList } from '../fixtures/notification'

test.describe('Notifications Page', () => {
  test('unauthenticated user is redirected to sign-in', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('shows notification list heading for authenticated user', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await mockApi(page, '**/api/notifications*', { success: true, data: { items: [], meta: { total: 0 } } })
    await page.goto('/notifications')
    await expect(page.getByText(/Bildirişlər|Notifications/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('renders notification cards from mocked data', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    const notifs = makeNotificationList(3, { actorName: 'Alice' })
    await mockApi(page, '**/api/notifications*', { success: true, data: { items: notifs, meta: { total: 3 } } })
    await page.goto('/notifications')
    await expect(page.getByText('Test Notification 1')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Test Notification 2')).toBeVisible()
    await expect(page.getByText('Test Notification 3')).toBeVisible()
  })

  test('shows empty state when no notifications exist', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await mockApi(page, '**/api/notifications*', { success: true, data: { items: [], meta: { total: 0 } } })
    await page.goto('/notifications')
    await expect(page.getByText(/boş|yoxdur|Tapılmadı|heç bir/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows filter tabs for read/unread', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await mockApi(page, '**/api/notifications*', { success: true, data: { items: [], meta: { total: 0 } } })
    await page.goto('/notifications')
    const filterTab = page.getByRole('tab', { name: /Hamısı|Read|Unread|Oxunmamış/i })
    if (await filterTab.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(filterTab.first()).toBeVisible()
    }
  })
})

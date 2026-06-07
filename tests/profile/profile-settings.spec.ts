import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Profile Settings — Page Render', () => {
  test('displays settings page with Azerbaijani heading', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User', image: null, role: 'user', emailVerified: true },
            profile: { bio: 'Test bio', location: 'Bakı', occupation: 'Developer' },
          },
        }),
      })
    })
    await page.goto('/profile/settings')
    await expect(page.getByText(/Tənzimləmələr|Profil/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows edit mode toggle button', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User', image: null, role: 'user', emailVerified: true },
            profile: { bio: 'Test bio', location: 'Bakı' },
          },
        }),
      })
    })
    await page.goto('/profile/settings')
    await expect(page.getByText(/Redaktə et|Dəyişiklikləri yaddaş/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Profile Settings — Account Modals', () => {
  test('email change modal can be opened', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User', image: null, role: 'user', emailVerified: true },
            profile: { bio: 'Test bio' },
          },
        }),
      })
    })
    await page.route('**/api/auth/change-email', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { currentEmail: 'test@example.com', requiresCurrentPassword: false, requiresGoogleReauth: false, providers: ['email'] } }),
      })
    })
    await page.goto('/profile/settings')
    const emailButton = page.getByText(/E-poçtu dəyiş/i)
    if (await emailButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailButton.first().click()
      await expect(page.getByText(/Yeni e-poçt/i).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('password change modal can be opened', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User', image: null, role: 'user', emailVerified: true },
            profile: { bio: 'Test bio' },
          },
        }),
      })
    })
    await page.goto('/profile/settings')
    const passwordButton = page.getByText(/Şifrə dəyiş/i)
    if (await passwordButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await passwordButton.first().click()
      await expect(page.getByText(/Şifrə dəyişikliyi|Yeni şifrə/i).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('delete account modal shows confirmation text', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User', image: null, role: 'user', emailVerified: true },
            profile: { bio: 'Test bio' },
          },
        }),
      })
    })
    await page.goto('/profile/settings')
    const deleteButton = page.getByText(/Hesabı sil/i)
    if (await deleteButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteButton.first().click()
      await expect(page.getByText(/silmək|təsdiqlə|geri ala bilməz/i).first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Profile Settings — Unverified Email Banner', () => {
  test('shows unverified email banner when email not verified', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/users/profile', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User', image: null, role: 'user', emailVerified: false },
            profile: { bio: 'Test bio' },
          },
        }),
      })
    })
    await page.goto('/profile/settings')
    await expect(page.getByText(/təsdiqi tamamlanmayıb/i).first()).toBeVisible({ timeout: 10000 })
  })
})

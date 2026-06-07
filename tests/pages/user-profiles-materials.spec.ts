import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('User Public Profile', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('shows profile for a valid user handle', async ({ page }) => {
    await page.route('**/api/users/public/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 'user-1', name: 'Test User', urlHandle: 'testuser', createdAt: new Date().toISOString() },
            stats: { totalBlogs: 5, totalViews: 100 },
          },
        }),
      })
    })
    await page.goto('/u/testuser')
    await expect(page.getByText('Test User')).toBeVisible({ timeout: 10000 })
  })

  test('shows 404 state for non-existent user', async ({ page }) => {
    await page.route('**/api/users/public/**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { code: 'NOT_FOUND' } }),
      })
    })
    await page.goto('/u/nonexistent-user-xyz')
    await expect(page.locator('body')).toContainText(/tapılmadı|not found/i, { timeout: 15000 })
  })
})

test.describe('Materials Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('materials page loads successfully', async ({ page }) => {
    await page.goto('/resources/materials')
    await expect(page.locator('body')).toContainText(/material|resurs/i, { timeout: 10000 })
  })

  test('shows heading', async ({ page }) => {
    await page.goto('/resources/materials')
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Onboarding Pages', () => {
  test('role selection page loads', async ({ page }) => {
    await page.goto('/onboarding/role')
    await expect(page.locator('body')).toContainText(/rol|hesab|seçin/i, { timeout: 10000 })
  })

  test('user onboarding page loads', async ({ page }) => {
    await page.goto('/onboarding/user')
    await expect(page.locator('body')).toContainText(/ad|profil|istifadəçi/i, { timeout: 10000 })
  })

  test('organization onboarding page loads', async ({ page }) => {
    await page.goto('/onboarding/organization')
    await expect(page.locator('body')).toContainText(/təşkilat|ad|profil/i, { timeout: 10000 })
  })
})

test.describe('Sign Out Page', () => {
  test('sign out page loads', async ({ page }) => {
    await page.goto('/auth/signout')
    await expect(page.locator('body')).toContainText(/çıxış|sign.?out/i, { timeout: 10000 })
  })
})

test.describe('Reset Password Page', () => {
  test('reset password page loads with form', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await expect(page.locator('body')).toContainText(/şifrə|password|sıfırla/i, { timeout: 10000 })
  })
})

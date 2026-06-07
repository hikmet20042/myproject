import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('Static Pages — About', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('about page loads successfully', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveURL(/\/about/)
  })

  test('about page has content', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('body')).toContainText(/iCMA|İcma|haqqında|barədə/i, { timeout: 10000 })
  })
})

test.describe('Static Pages — Privacy', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('privacy page loads successfully', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page).toHaveURL(/\/privacy/)
  })

  test('privacy page has content', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('body')).toContainText(/məlumat|privacy|şəxsi/i, { timeout: 10000 })
  })
})

test.describe('Static Pages — Resources Landing', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('resources page loads successfully', async ({ page }) => {
    await page.goto('/resources')
    await expect(page).toHaveURL(/\/resources/)
  })

  test('resources page has heading', async ({ page }) => {
    await page.goto('/resources')
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Static Pages — Not Found', () => {
  test('non-existent page shows 404', async ({ page }) => {
    await setupUnauthMock(page)
    const response = await page.goto('/this-page-does-not-exist-xyz')
    expect(response?.status()).toBe(404)
  })
})

test.describe('Static Pages — Auth Error', () => {
  test('auth error page loads', async ({ page }) => {
    await page.goto('/auth/error')
    await expect(page.locator('body')).toContainText(/xəta|error/i, { timeout: 10000 })
  })
})

test.describe('Static Pages — Verify Request', () => {
  test('verify request page loads', async ({ page }) => {
    await page.goto('/auth/verify-request')
    await expect(page.locator('body')).toContainText(/təsdiq|verify|göndərilib/i, { timeout: 10000 })
  })
})

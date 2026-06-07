import { test, expect } from '@playwright/test'

test.describe('Session Interruption — Sign-Out Flow', () => {
  test('sign-out page renders heading from SSR HTML before redirect', async ({ page }) => {
    // Navigate to sign-out page; the heading is in the server-rendered HTML
    // before React hydrates and the signOut effect triggers the redirect
    await page.goto('/auth/signout', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('h1')).toHaveText(/Çıxış edilir/i)
    // After signOut completes, the page should redirect to sign-in
    await page.waitForURL(/\/auth\/signin/, { timeout: 15000 })
  })
})

test.describe('Session Interruption — 401 on Blog Interactions', () => {
  test('blog listing loads without crashing when like API returns 401', async ({ page }) => {
    await page.route('**/api/blogs/*/like', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs')
    await expect(page.getByRole('heading', { name: /İcma Bloqları/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Session Interruption — 401 on Save', () => {
  test('blog listing loads without crashing when save API returns 401', async ({ page }) => {
    await page.route('**/api/content/*/save', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } }) })
    })
    await page.goto('/blogs')
    await expect(page.getByRole('heading', { name: /İcma Bloqları/i })).toBeVisible({ timeout: 10000 })
  })
})

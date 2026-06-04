import { test, expect } from '@playwright/test'

test.describe('Auth Guards — route protection and role-based access', () => {
  test('redirects unauthenticated users to sign-in for /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /profile', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /submit/blog', async ({ page }) => {
    await page.goto('/submit/blog')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /saved', async ({ page }) => {
    await page.goto('/saved')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /notifications', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /admin', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /organization', async ({ page }) => {
    await page.goto('/organization')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('allows unauthenticated access to public pages', async ({ page }) => {
    await page.route(/auth\/v1\/user/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    })
    const publicRoutes = ['/', '/auth/signin', '/auth/register', '/blogs', '/resources/events', '/resources/vacancies', '/search']
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: 'load' })
      await expect(page).not.toHaveURL(/\/auth\/signin\?/)
    }
  })

  test('redirects non-admin users away from /admin', async ({ page }) => {
    test.skip(true, '__mockSession not consumed — needs test Supabase instance')
  })
})

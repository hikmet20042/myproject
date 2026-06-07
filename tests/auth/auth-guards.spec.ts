import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Auth Guards — route protection and role-based access', () => {
  test('redirects unauthenticated users to sign-in for /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /profile', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /submit/blog', async ({ page }) => {
    await page.goto('/submit/blog')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /saved', async ({ page }) => {
    await page.goto('/saved')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /notifications', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('redirects unauthenticated users to sign-in for /organization', async ({ page }) => {
    await page.goto('/organization')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('allows unauthenticated access to public pages', async ({ page }) => {
    // No mockTestRoleAuth → middleware runs real auth; unauthenticated
    // users are NOT redirected from public routes.
    const publicRoutes = ['/', '/auth/signin', '/auth/register', '/blogs', '/resources/events', '/resources/vacancies', '/search']
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/auth\/signin\?/)
    }
  })

  test('redirects non-admin users away from /admin', async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'regular-user' })
    await page.goto('/admin')
    // Non-admin user should be redirected away from /admin
    await expect(page).not.toHaveURL(/\/admin\/dashboard/, { timeout: 10000 })
  })
})

import { test, expect } from '@playwright/test'

test.describe('Profile — Overview Page', () => {
  test('redirects unauthenticated user to sign-in', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('displays profile page with Azerbaijani heading', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('shows profile statistics cards', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('shows profile settings button', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })
})

test.describe('Profile — Saved Items', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/saved')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('displays saved items page with Azerbaijani heading', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('shows empty state when nothing saved', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('shows saved items with stats counts', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })
})

test.describe('Notifications Page', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('displays notifications page with Azerbaijani heading', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('shows filter tabs for notifications', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })
})

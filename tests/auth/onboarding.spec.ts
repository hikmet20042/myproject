import { test, expect } from '@playwright/test'

test.describe('Onboarding — Role Selection', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/onboarding/role')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('displays role selection page after registration', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('shows sign-out button on role selection page', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('redirects away when accountType already set (organization)', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('user role selection navigates to /onboarding/user', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('organization role selection navigates to /onboarding/organization', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })
})

test.describe.skip('Onboarding — User Flow', () => {
  test('displays user onboarding form with interests', async ({ page }) => {
  })

  test('submits user onboarding via API', async ({ page }) => {
  })

  test('shows interests selection counter', async ({ page }) => {
  })

  test('redirects unauthenticated to sign-in', async ({ page }) => {
  })
})

test.describe.skip('Onboarding — Organization Flow', () => {
  test('displays organization onboarding form', async ({ page }) => {
  })

  test('shows validation errors for empty organization form', async ({ page }) => {
  })

  test('submits organization via API', async ({ page }) => {
  })

  test('shows character counter for description', async ({ page }) => {
  })
})

test.describe.skip('Onboarding — Pending Organization State', () => {
  test('pending org user sees /organization/pending instead of dashboard', async ({ page }) => {
  })
})

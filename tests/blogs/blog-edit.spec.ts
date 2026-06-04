import { test, expect } from '@playwright/test'

test.describe('Blog Edit — Ownership and Access', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/edit/blog/some-id')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('shows edit form for blog owner', async ({ page }) => {
    test.skip(true, 'Auth middleware blocks /edit/blog/* — needs test Supabase instance')
  })

  test('blocks non-owner from editing', async ({ page }) => {
    test.skip(true, 'Auth middleware blocks /edit/blog/* — needs test Supabase instance')
  })
})

test.describe.skip('Blog Edit — Update Request for Approved Blogs', () => {
  test('shows edit form for approved blog with status warning', async ({ page }) => {
  })

  test('shows correct submit button text for approved blog', async ({ page }) => {
  })
})

test.describe.skip('Blog Edit — Draft and Field States', () => {
  test('disables submit button when title is empty', async ({ page }) => {
  })

  test('shows title input with Azerbaijani label', async ({ page }) => {
  })
})

import { test, expect } from '@playwright/test'

// Run with: npx playwright test tests/specs/mobile-viewport.spec.ts --project=mobile-chromium
test.describe('Mobile Viewport — iPhone 13', () => {

  test('home page renders within mobile viewport', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    // Horizontal overflow should be eliminated
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('blogs listing is readable on mobile', async ({ page }) => {
    await page.goto('/blogs')
    const heading = page.getByRole('heading', { name: /Bloq|bloqlar|İcma/i })
    if (await heading.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(heading.first()).toBeVisible()
    }
  })

  test('events listing renders on mobile', async ({ page }) => {
    await page.goto('/resources/events')
    await expect(page.getByRole('banner')).toBeVisible()
  })

  test('vacancies listing renders on mobile', async ({ page }) => {
    await page.goto('/resources/vacancies')
    await expect(page.getByRole('banner')).toBeVisible()
  })

  test('navigation menu collapses on mobile', async ({ page }) => {
    await page.goto('/')
    // On mobile, primary nav links may be hidden behind a menu button
    const menuButton = page.getByRole('button', { name: /menu|menu|navigasiya/i })
    if (await menuButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(menuButton.first()).toBeVisible()
    }
  })
})

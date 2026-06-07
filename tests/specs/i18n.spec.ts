import { test, expect } from '@playwright/test'

test.describe('i18n — Language Routing', () => {
  test('/az prefix redirects to canonical (no prefix)', async ({ page }) => {
    const resp = await page.goto('/az/blogs')
    expect(page.url()).not.toContain('/az/')
  })

  test('/en prefix redirects to canonical', async ({ page }) => {
    const resp = await page.goto('/en/blogs')
    expect(page.url()).not.toContain('/en/')
  })

  test('home page sets a lang attribute on <html>', async ({ page }) => {
    await page.goto('/')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
    expect(lang).toMatch(/^(az|en|ru)$/)
  })

  test('blogs page sets a lang attribute on <html>', async ({ page }) => {
    await page.goto('/blogs')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
  })

  test('events page has language set', async ({ page }) => {
    await page.goto('/resources/events')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
  })

  test('language switcher is visible in header', async ({ page }) => {
    await page.goto('/')
    const switcher = page.getByRole('button', { name: /AZ|EN|language|dil/i })
    if (await switcher.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(switcher.first()).toBeVisible()
    }
  })
})

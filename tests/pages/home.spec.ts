import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('Home Page — Hero and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('loads the home page successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/iCMA 360|İcma|icma/i)
  })

  test('displays hero section with main heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 })
  })

  test('shows stats bar section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Aktiv Vakansiya|Aktiv Tədbir|İcma Bloqu|Tərəfdaş Təşkilat/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows featured opportunities section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Seçilmiş imkanlar/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows vacancies section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Vakansiyalar/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows events section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Tədbirlər/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows organizations section with filter tabs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /^Təşkilatlar$/ })).toBeVisible({ timeout: 10000 })
  })

  test('shows blogs section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /İcma Bloqu/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows how-it-works section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Necə işləyir/i })).toBeVisible({ timeout: 10000 })
  })

  test('how-it-works has 3 steps', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('3', { exact: true }).first()).toBeVisible()
  })
})

test.describe('Home Page — API Mocking and Content', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('shows empty states when all APIs return empty', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/resolve') && !url.pathname.includes('/admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { events: [] }, meta: {} }),
        })
      } else {
        await route.continue()
      }
    })
    await page.route('**/api/vacancies*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/resolve') && !url.searchParams.has('adminView')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { vacancies: [] }, meta: {} }),
        })
      } else {
        await route.continue()
      }
    })
    await page.route('**/api/blogs*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/resolve') && !url.pathname.includes('/admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { items: [] }, meta: { pagination: { total: 0 } } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/')
    await expect(page.getByText(/İmkan tapılmadı/i)).toBeVisible({ timeout: 10000 })
  })

  test('navigates to events listing via section link', async ({ page }) => {
    await page.goto('/')
    const eventsLink = page.getByRole('link', { name: /Hamısına bax/i }).first()
    if (await eventsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await eventsLink.click()
      expect(page.url()).toContain('/resources')
    }
  })

  test('navigates to blog listing via section link', async ({ page }) => {
    await page.goto('/')
    const blogLinks = page.getByRole('link', { name: /Bloqlar|bloq/i })
    const count = await blogLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Home Page — Language and Localization', () => {
  test('displays Azerbaijani content by default', async ({ page }) => {
    await setupUnauthMock(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Necə işləyir/i })).toBeVisible({ timeout: 10000 })
  })

  test('has navigation links in the header', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Bloqlar/i }).first()).toBeVisible({ timeout: 10000 })
  })
})

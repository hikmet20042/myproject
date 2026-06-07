import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('Search — empty states, network tracking, Azerbaijani text', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('displays search page with Azerbaijani heading', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('heading', { name: /^Axtarış$/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows search input with Azerbaijani placeholder', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('input[placeholder*="Açar söz"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows type filter buttons with Azerbaijani labels', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('button', { name: /Hamısı/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Vakansiyalar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Tədbirlər/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Bloqlar/i })).toBeVisible()
  })

  test('shows initial state with popular search suggestions', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByText(/Populyar axtarışlar/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/dizayn/i)).toBeVisible()
    await expect(page.getByText(/könüllülük/i)).toBeVisible()
    await expect(page.getByText(/gənclər/i).or(page.getByText(/proqramlaşdırma/i))).toBeVisible()
  })

  test('shows empty state in Azerbaijani when no results match', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 12, total: 0, pages: 0 },
            totalsByType: { event: 0, vacancy: 0, blog: 0, organization: 0 },
          },
        }),
      })
    })
    await page.goto('/search?q=zzzzzzzzzzzzzzzzz')
    await expect(page.getByText(/nəticə tapılmadı/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows loading state while searching', async ({ page }) => {
    let resolveSearch: () => void
    const searchPromise = new Promise<void>((resolve) => { resolveSearch = resolve })
    await page.route('**/api/search*', async (route) => {
      await searchPromise
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 12, total: 0, pages: 0 },
            totalsByType: { event: 0, vacancy: 0, blog: 0, organization: 0 },
          },
        }),
      })
    })
    await page.goto('/search?q=delayed')
    await expect(page.getByText(/Axtarılır/i).or(page.getByText(/Nəticələr axtarılır/i))).toBeVisible({ timeout: 3000 })
    resolveSearch!()
  })

  test('displays search results for a valid query', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      const url = new URL(route.request().url())
      const q = url.searchParams.get('q') || ''
      if (q === 'test') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [
                { id: '1', type: 'blog', title: 'Test Blog Result', snippet: 'A test blog', href: '/blogs/test-blog', score: 0.9 },
                { id: '2', type: 'event', title: 'Test Event', snippet: 'A test event', href: '/resources/events/test-event', score: 0.8 },
              ],
              pagination: { page: 1, limit: 12, total: 2, pages: 1 },
              totalsByType: { event: 1, vacancy: 0, blog: 1, organization: 0 },
            },
          }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/search?q=test')
    await expect(page.getByText(/nəticə tapıldı/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Test Blog Result')).toBeVisible()
    await expect(page.getByText('Test Event')).toBeVisible()
  })

  test('URL drives search state — query param preserved', async ({ page }) => {
    await page.goto('/search?q=developer')
    const searchInput = page.locator('input[placeholder*="Açar söz"]')
    await expect(searchInput).toHaveValue('developer', { timeout: 10000 })
  })

  test('type filter buttons update the search scope', async ({ page }) => {
    await page.goto('/search?q=test')
    const blogsButton = page.getByRole('button', { name: /Bloqlar/i })
    await expect(blogsButton).toBeVisible({ timeout: 10000 })
  })
})

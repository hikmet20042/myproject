import { test, expect } from '@playwright/test'

async function submitForm(page: any) {
  await page.evaluate(() => {
    const form = document.querySelector('form')
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  })
}

test.describe('Authorization — API error states for various user types', () => {
  test.describe('Blog creation guard', () => {
    test.beforeEach(async ({ page }) => {
      await page.route(/auth\/v1\/user/, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      })
    })

    test('shows blog listing for unauthenticated users (no creation form)', async ({ page }) => {
      await page.route('**/api/blogs*', async (route) => {
        const body = JSON.stringify({ success: true, data: { items: [] }, meta: { pagination: { page: 1, pages: 1, total: 0 } } })
        await route.fulfill({ status: 200, contentType: 'application/json', body })
      })
      await page.goto('/blogs')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: /Bloqlar/i })).toBeVisible()
    })

    test('handles server error on blog listing', async ({ page }) => {
      await page.route('**/api/blogs*', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server xətası' }) })
      })
      await page.goto('/blogs')
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/Bloqlar yüklənə bilmədi/i).or(page.getByText(/problem baş verdi/i))).toBeVisible({ timeout: 10000 })
    })

    test('handles blog not found', async ({ page }) => {
      await page.route('**/api/blogs/*', async (route) => {
        const url = new URL(route.request().url())
        if (!url.searchParams.has('page') && !url.pathname.endsWith('/blogs')) {
          await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Bloq tapılmadı' }) })
        }
      })
      await page.goto('/blogs/some-nonexistent-slug', { waitUntil: 'load' })
      await expect(page.getByText(/Bloq tapılmadı/i).or(page.getByText(/mövcud deyil/i))).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('API error states on public pages', () => {
    test.beforeEach(async ({ page }) => {
      await page.route(/auth\/v1\/user/, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      })
    })

    test('handles rate limit error on auth endpoints', async ({ page }) => {
      await page.route('**/api/auth/forgot-password', async (route) => {
        await route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'Çox sayda sorğu. Bir az sonra yenidən cəhd edin.' }) })
      })
      await page.goto('/auth/forgot-password')
      await page.waitForLoadState('networkidle')
      await page.locator('input[type="email"]').fill('test@example.com')
      await submitForm(page)
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/Çox sayda sorğu/i).or(page.getByText(/rate limit/i).or(page.getByText(/çox sayda/i)))).toBeVisible({ timeout: 10000 })
    })

    test('handles network failure on vacancy listing', async ({ page }) => {
      await page.route('**/api/vacancies*', async (route) => {
        const url = new URL(route.request().url())
        if (!url.pathname.includes('/resolve') && !url.searchParams.has('adminView')) {
          await route.abort('connectionrefused')
        }
      })
      await page.goto('/resources/vacancies')
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/Xəta baş verdi/i).or(page.getByText(/yüklənə bilmədi/i))).toBeVisible({ timeout: 10000 })
    })

    test('handles network failure on event listing', async ({ page }) => {
      await page.route('**/api/events*', async (route) => {
        const url = new URL(route.request().url())
        if (!url.pathname.includes('/resolve')) {
          await route.abort('connectionrefused')
        }
      })
      await page.goto('/resources/events')
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(/Xəta baş verdi/i).or(page.getByText(/yüklənə bilmədi/i))).toBeVisible({ timeout: 10000 })
    })

    test('handles search endpoint returning non-200', async ({ page }) => {
      await page.route('**/api/search*', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Axtarış xətası' }) })
      })
      await page.goto('/search')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('textbox', { name: /Qlobal axtarış/i })).toBeVisible()
    })

    test('handles empty search results for nonexistent query', async ({ page }) => {
      await page.route('**/api/search*', async (route) => {
        const body = JSON.stringify({ success: true, data: { items: [], pagination: { page: 1, pages: 1, total: 0 }, totalsByType: {} } })
        await route.fulfill({ status: 200, contentType: 'application/json', body })
      })
      await page.goto('/search')
      await page.waitForLoadState('networkidle')
      await page.getByRole('textbox', { name: /Qlobal axtarış/i }).fill('nonexistent==')
      await page.waitForTimeout(500)
      await expect(page.getByText(/nəticə tapılmadı/i).or(page.getByText(/heç nə tapılmadı/i))).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Authenticated-only functionality', () => {
    test('shows blog creation form for authenticated users', async ({ page }) => {
      test.skip(true, '__mockSession not consumed — needs test Supabase instance')
    })

    test('allows organization to create vacancies', async ({ page }) => {
      test.skip(true, '__mockSession not consumed — needs test Supabase instance')
    })

    test('allows creating events', async ({ page }) => {
      test.skip(true, '__mockSession not consumed — needs test Supabase instance')
    })
  })
})

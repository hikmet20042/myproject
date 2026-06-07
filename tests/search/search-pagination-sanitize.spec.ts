import { test, expect } from '@playwright/test'

const emptyResponse = {
  success: true,
  data: {
    items: [],
    pagination: { page: 1, limit: 12, total: 0, pages: 0 },
    totalsByType: { event: 0, vacancy: 0, blog: 0, organization: 0 },
  },
}

const sampleItem = (id: string, type: string) => ({
  id,
  type,
  title: `Result ${id}`,
  snippet: `Snippet for ${id}`,
  href: type === 'blog' ? `/blogs/${id}` : `/resources/${type}s/${id}`,
  score: 0.9,
  imageUrl: null,
  date: new Date().toISOString(),
  ownerLabel: null,
  locationLabel: null,
})

const resultsPage = (items: any[], pageNum: number, total: number, pages: number) => ({
  success: true,
  data: {
    items,
    pagination: { page: pageNum, limit: 12, total, pages },
    totalsByType: { event: 0, vacancy: 0, blog: total, organization: 0 },
  },
})

test.describe('Search — Pagination Mechanics', () => {
  test('shows pagination controls for multi-page results', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          resultsPage(
            Array.from({ length: 12 }, (_, i) => sampleItem(`p1-${i}`, 'blog')),
            1, 25, 3
          )
        ),
      })
    })
    await page.goto('/search?q=test')
    await expect(page.getByText(/25 nəticə tapıldı/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Səhifə 1 \/ 3/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Əvvəlki/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Növbəti/i })).toBeVisible()
  })

  test('clicking Növbəti advances page and updates URL', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      const url = new URL(route.request().url())
      const p = Number(url.searchParams.get('page') || '1')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          resultsPage(
            Array.from({ length: 12 }, (_, i) => sampleItem(`p${p}-${i}`, 'blog')),
            p, 25, 3
          )
        ),
      })
    })
    await page.goto('/search?q=test')
    await expect(page.getByText(/Səhifə 1 \/ 3/i)).toBeVisible()
    await page.getByRole('button', { name: /Növbəti/i }).click()
    await expect(page.getByText(/Səhifə 2 \/ 3/i)).toBeVisible({ timeout: 10000 })
  })

  test('clicking Əvvəlki goes back to page 1', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      const url = new URL(route.request().url())
      const p = Number(url.searchParams.get('page') || '1')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          resultsPage(
            Array.from({ length: 12 }, (_, i) => sampleItem(`p${p}-${i}`, 'blog')),
            p, 25, 3
          )
        ),
      })
    })
    await page.goto('/search?q=test&page=2')
    await expect(page.getByText(/Səhifə 2 \/ 3/i)).toBeVisible()
    await page.getByRole('button', { name: /Əvvəlki/i }).click()
    await expect(page.getByText(/Səhifə 1 \/ 3/i)).toBeVisible({ timeout: 10000 })
  })

  test('pagination controls hidden for single-page result', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          resultsPage(
            Array.from({ length: 3 }, (_, i) => sampleItem(`p1-${i}`, 'blog')),
            1, 3, 1
          )
        ),
      })
    })
    await page.goto('/search?q=test')
    await expect(page.getByRole('button', { name: /Əvvəlki/i })).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Növbəti/i })).not.toBeVisible()
    await expect(page.getByText(/3 nəticə tapıldı/i)).toBeVisible()
  })
})

test.describe('Search — Input Sanitization', () => {
  test('handles XSS script tag in query without crashing', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyResponse) })
    })
    await page.goto("/search?q=<script>alert('xss')</script>")
    await expect(page.getByRole('heading', { name: /Nəticə tapılmadı/i })).toBeVisible({ timeout: 10000 })
    const body = await page.evaluate(() => document.body.innerHTML)
    expect(body).not.toContain('<script>alert(')
  })

  test('handles very long query without crashing', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyResponse) })
    })
    const longQuery = 'a'.repeat(2000)
    await page.goto(`/search?q=${longQuery}`)
    await expect(page.getByRole('heading', { name: /Nəticə tapılmadı/i })).toBeVisible({ timeout: 10000 })
  })

  test('handles SQL injection pattern without crashing', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyResponse) })
    })
    await page.goto("/search?q='+OR+'1'%3D'1")
    await expect(page.getByRole('heading', { name: /Nəticə tapılmadı/i })).toBeVisible({ timeout: 10000 })
  })

  test('handles unicode and emoji in query without crashing', async ({ page }) => {
    await page.route('**/api/search*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyResponse) })
    })
    await page.goto('/search?q=%F0%9F%94%8D+test+%E2%9C%A8')
    await expect(page.getByRole('heading', { name: /Nəticə tapılmadı/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Search — Debounce Behavior', () => {
  test('debounce delays API call — only fires after 200ms of inactivity', async ({ page }) => {
    let callTimes: number[] = []
    await page.route('**/api/search*', async (route) => {
      callTimes.push(Date.now())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyResponse),
      })
    })
    await page.goto('/search')
    callTimes = []
    const start = Date.now()
    await page.goto('/search?q=test')
    expect(callTimes.length).toBe(1)
    expect(callTimes[0] - start).toBeGreaterThanOrEqual(150)
  })
})

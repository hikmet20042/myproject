import { test, expect } from '@playwright/test'

const blogItem = (id: string) => ({
  _id: id,
  title: `Blog Title ${id}`,
  slug: `blog-${id}`,
  excerpt: `Excerpt for blog ${id}`,
  content: [{ content: [{ text: `Content for blog ${id}` }] }],
  createdAt: new Date().toISOString(),
  authorName: 'Test Author',
})

const generatePage = (pageNum: number, totalPages: number, perPage: number = 20) => ({
  success: true,
  data: {
    items: Array.from({ length: perPage }, (_, i) => blogItem(`p${pageNum}-${i}`)),
  },
  meta: {
    pagination: { page: pageNum, limit: perPage, total: totalPages * perPage, pages: totalPages },
  },
})

test.describe('Blog Listing — Pagination Mechanics', () => {
  test('shows pagination controls for multi-page blog listing', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      const url = new URL(route.request().url())
      const reqPage = Number(url.searchParams.get('page') || '1')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generatePage(reqPage, 3)),
      })
    })
    await page.goto('/blogs')
    await expect(page.getByRole('button', { name: /Əvvəlki/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Növbəti/i })).toBeVisible()
    await expect(page.getByText(/Səhifə 1 \/ 3/i)).toBeVisible()
  })

  test('clicking Növbəti advances page', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      const url = new URL(route.request().url())
      const reqPage = Number(url.searchParams.get('page') || '1')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generatePage(reqPage, 3)),
      })
    })
    await page.goto('/blogs')
    await expect(page.getByText(/Səhifə 1 \/ 3/i)).toBeVisible()
    await page.getByRole('button', { name: /Növbəti/i }).click()
    await expect(page.getByText(/Səhifə 2 \/ 3/i)).toBeVisible({ timeout: 10000 })
  })

  test('clicking Əvvəlki goes back to previous page', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      const url = new URL(route.request().url())
      const reqPage = Number(url.searchParams.get('page') || '1')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generatePage(reqPage, 3)),
      })
    })
    await page.goto('/blogs?page=2')
    await expect(page.getByText(/Səhifə 2 \/ 3/i)).toBeVisible()
    await page.getByRole('button', { name: /Əvvəlki/i }).click()
    await expect(page.getByText(/Səhifə 1 \/ 3/i)).toBeVisible({ timeout: 10000 })
  })

  test('pagination controls hidden for single-page listing', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generatePage(1, 1, 5)),
      })
    })
    await page.goto('/blogs')
    await expect(page.getByRole('button', { name: /Əvvəlki/i })).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Növbəti/i })).not.toBeVisible()
  })

  test('buttons disabled at page boundaries', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generatePage(1, 2)),
      })
    })
    await page.goto('/blogs')
    const prevBtn = page.getByRole('button', { name: /Əvvəlki/i })
    const nextBtn = page.getByRole('button', { name: /Növbəti/i })
    await expect(prevBtn).toBeDisabled()
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()
    await expect(prevBtn).toBeEnabled()
    await expect(nextBtn).toBeDisabled()
  })

  test('URL page param syncs with pagination state', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      const url = new URL(route.request().url())
      const pageParam = url.searchParams.get('page') || '1'
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generatePage(Number(pageParam), 3)),
      })
    })
    await page.goto('/blogs?page=2')
    await expect(page.getByText(/Səhifə 2 \/ 3/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Əvvəlki/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Növbəti/i })).toBeVisible()
  })
})

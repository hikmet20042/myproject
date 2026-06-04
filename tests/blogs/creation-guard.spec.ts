import { test, expect } from '@playwright/test'

test.describe('Blogs — Creation Guard (user vs organization)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/auth\/v1/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: null }) })
    })
  })

  test('shows blog listing with Azerbaijani heading', async ({ page }) => {
    await page.goto('/blogs')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /^İcma Bloqları$/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows search bar with Azerbaijani placeholder', async ({ page }) => {
    await page.goto('/blogs')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('input[placeholder*="Mövzu"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state when no blogs exist', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/api/blogs/resolve') && !url.pathname.includes('/admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { items: [] }, meta: { pagination: { total: 0, page: 1, pages: 0 } } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Bloq tapılmadı/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows CTA section at bottom of listing', async ({ page }) => {
    await page.goto('/blogs')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Öz hekayəni danış/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Blog Creation Form', () => {
  test('redirects unauthenticated user away from /submit/blog', async ({ page }) => {
    await page.goto('/submit/blog')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('shows blog creation form title for authenticated user', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })

  test('disables submit button when title is empty', async ({ page }) => {
    test.skip(true, '__mockSession not consumed by AuthProvider — needs test Supabase instance')
  })
})

test.describe('Blog Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/auth\/v1/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: null }) })
    })
  })

  test('shows error state for non-existent blog', async ({ page }) => {
    await page.goto('/blogs/non-existent-slug-12345')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Bloq tapılmadı/i)).toBeVisible({ timeout: 15000 })
  })

  test('shows detail page for existing blog with Azerbaijani labels', async ({ page }) => {
    await page.route('**/api/blogs/resolve/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'blog-123' } }),
      })
    })
    await page.route('**/api/blogs/blog-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-123',
              title: 'Test Blog Title',
              slug: 'test-blog',
              status: 'approved',
              content: { blocks: [] },
              contentHtml: '<p>Test content</p>',
              authorName: 'Test User',
              authorUrlHandle: 'testuser',
              createdAt: new Date().toISOString(),
              views: 42,
              likes: 10,
              dislikes: 2,
            },
          },
        }),
      })
    })
    await page.goto('/blogs/test-blog')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    const body = page.locator('body')
    await expect(body).toContainText('Test Blog Title', { timeout: 10000 })
  })
})

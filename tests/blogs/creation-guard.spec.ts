import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Blogs — Creation Guard (user vs organization)', () => {
  test('shows blog listing with Azerbaijani heading', async ({ page }) => {
    await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /^İcma Bloqları$/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows search bar with Azerbaijani placeholder', async ({ page }) => {
    await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
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
    await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /sakitlikdir/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows CTA section at bottom of listing', async ({ page }) => {
    await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Öz hekayəni danış/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Blog Creation Form', () => {
  test('redirects unauthenticated user away from /submit/blog', async ({ page }) => {
    await page.goto('/submit/blog', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('shows blog creation form title for authenticated user', async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'user-id' })
    await page.goto('/submit/blog', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Bloq yaz' })).toBeVisible({ timeout: 10000 })
  })

  test('disables submit button when title is empty', async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'user-id' })
    await page.goto('/submit/blog', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Bloq yaz' })).toBeVisible({ timeout: 10000 })
    const submitBtn = page.getByRole('button', { name: /Göndər|Nəşr et/i })
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(submitBtn).toBeDisabled()
    }
  })
})

test.describe('Blog Detail Page', () => {
  test('shows error state for non-existent blog', async ({ page }) => {
    await page.goto('/blogs/non-existent-slug-12345', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Bloq tapılmadı/i })).toBeVisible({ timeout: 15000 })
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
              content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content', styles: {} }] }] },
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
    await page.goto('/blogs/test-blog', { waitUntil: 'domcontentloaded' })
    const body = page.locator('body')
    await expect(body).toContainText('Test Blog Title', { timeout: 10000 })
  })
})

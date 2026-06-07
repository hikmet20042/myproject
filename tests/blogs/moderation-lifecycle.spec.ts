import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('Blogs — Moderation Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('pending blog does not appear in public listing', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/resolve') && !url.pathname.includes('/admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [
                { id: 'blog-approved', title: 'Approved Blog', slug: 'approved-blog', status: 'approved', views: 5, likes: 2, dislikes: 0, authorName: 'Test' },
              ],
            },
            meta: { pagination: { page: 1, limit: 50, total: 1, pages: 1 } },
          }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs')
    await expect(page.getByText('Approved Blog')).toBeVisible({ timeout: 10000 })
  })

  test('rejected blog shows detail page content', async ({ page }) => {
    await page.route('**/api/blogs/resolve/rejected-blog', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'blog-rejected' } }),
      })
    })
    await page.route('**/api/blogs/blog-rejected', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-rejected', title: 'Rejected Blog', slug: 'rejected-blog',
              status: 'rejected', views: 0, likes: 0, dislikes: 0,
              authorName: 'Other User', authorId: 'other-user-id',
            },
          },
        }),
      })
    })
    await page.goto('/blogs/rejected-blog')
    await expect(page.getByText('Rejected Blog').first()).toBeVisible({ timeout: 15000 })
  })
})

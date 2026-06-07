import { test, expect } from '@playwright/test'

test.describe('Blog Listing — Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/auth\/v1/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: null }) })
    })
  })

  test('blog listing page has heading', async ({ page }) => {
    await page.goto('/blogs')
    await expect(page.getByRole('heading', { name: /Bloq|bloqlar|İcma/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows search bar', async ({ page }) => {
    await page.goto('/blogs')
    const searchInput = page.locator('input[type="text"], input[type="search"]')
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 })
  })

  test('shows blog cards when mocked data present', async ({ page }) => {
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
                { id: 'blog-1', title: 'Test Blog Post', slug: 'test-blog', authorName: 'Author', status: 'approved', views: 10, likes: 5, createdAt: new Date().toISOString() },
                { id: 'blog-2', title: 'Another Blog Post', slug: 'another-blog', authorName: 'Writer', status: 'approved', views: 20, likes: 8, createdAt: new Date().toISOString() },
              ],
            },
            meta: { pagination: { total: 2 } },
          }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs')
    await expect(page.getByText('Test Blog Post')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Another Blog Post')).toBeVisible()
  })
})

test.describe('Blog Detail — Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/auth\/v1/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: null }) })
    })
  })

  test('shows blog content with author info', async ({ page }) => {
    await page.route('**/api/blogs/resolve/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'blog-abc' } }),
      })
    })
    await page.route('**/api/blogs/blog-abc', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-abc', title: 'Comprehensive Blog Test', slug: 'comprehensive-test',
              status: 'approved', contentHtml: '<p>This is a comprehensive blog post about community building.</p>',
              authorName: 'Jane Doe', authorUrlHandle: 'janedoe',
              views: 250, likes: 30, dislikes: 2,
              tags: ['community', 'education'], abstract: 'A comprehensive test blog',
              createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/blogs/comprehensive-test')
    await expect(page.getByText('Comprehensive Blog Test')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Jane Doe')).toBeVisible()
  })

  test('shows view count and engagement stats', async ({ page }) => {
    await page.route('**/api/blogs/resolve/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'blog-stats' } }),
      })
    })
    await page.route('**/api/blogs/blog-stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-stats', title: 'Stats Blog', slug: 'stats-blog',
              status: 'approved', contentHtml: '<p>Content here</p>',
              authorName: 'Author', views: 150, likes: 20, dislikes: 3,
              createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/blogs/stats-blog')
    await expect(page.getByText('Stats Blog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/baxış|views/i)).toBeVisible()
  })

  test('shows blog with tags', async ({ page }) => {
    await page.route('**/api/blogs/resolve/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'blog-tags' } }),
      })
    })
    await page.route('**/api/blogs/blog-tags', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-tags', title: 'Tagged Blog', slug: 'tagged-blog',
              status: 'approved', contentHtml: '<p>Tagged content</p>',
              authorName: 'Tagger', tags: ['javascript', 'react', 'community'],
              createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/blogs/tagged-blog')
    await expect(page.getByText('Tagged Blog')).toBeVisible({ timeout: 10000 })
  })

  test('shows sharing options', async ({ page }) => {
    await page.route('**/api/blogs/resolve/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'blog-share' } }),
      })
    })
    await page.route('**/api/blogs/blog-share', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-share', title: 'Share Blog', slug: 'share-blog',
              status: 'approved', contentHtml: '<p>Shareable content</p>',
              authorName: 'Sharer', createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/blogs/share-blog')
    await expect(page.getByRole('button', { name: /Paylaş/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Blog Edit Page', () => {
  test('redirects unauthenticated user away from edit', async ({ page }) => {
    await page.goto('/edit/blog/fake-id')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })
})

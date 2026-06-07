import { test, expect } from '@playwright/test'

test.describe('Blogs — Interactions (views, upvote/downvote, saves)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/auth\/v1/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: null }) })
    })
    await page.route('**/api/blogs/resolve/interactive-blog', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'blog-interactive' } }),
      })
    })
    await page.route('**/api/blogs/blog-interactive', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-interactive',
              title: 'Interactive Blog',
              slug: 'interactive-blog',
              status: 'approved',
              content: '<p>Content for testing interactions with enough text to trigger view tracking and reactions.</p>',
              contentHtml: '<p>Content for testing interactions with enough text to trigger view tracking and reactions.</p>',
              authorName: 'Author User',
              authorUrlHandle: 'author',
              createdAt: new Date().toISOString(),
              views: 100,
              likes: 25,
              dislikes: 5,
            },
          },
        }),
      })
    })
  })

  test('shows view count with Azerbaijani label', async ({ page }) => {
    await page.goto('/blogs/interactive-blog')
    await expect(page.getByText(/100 baxış/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows like/dislike counts', async ({ page }) => {
    await page.goto('/blogs/interactive-blog')
    await expect(page.getByText(/25/).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/5/).first()).toBeVisible()
  })

  test('shows reactions section heading', async ({ page }) => {
    await page.goto('/blogs/interactive-blog')
    await expect(page.getByRole('heading', { name: /Bu məqalə sənə necə gəldi/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows reading time in Azerbaijani', async ({ page }) => {
    await page.goto('/blogs/interactive-blog')
    await expect(page.getByText(/\d+ dəq/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows author name as a link', async ({ page }) => {
    await page.goto('/blogs/interactive-blog')
    await expect(page.getByRole('link', { name: 'Author User' })).toBeVisible({ timeout: 10000 })
  })

  test('shows share button', async ({ page }) => {
    await page.goto('/blogs/interactive-blog')
    await expect(page.getByRole('button', { name: /Paylaş/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows breadcrumb navigation', async ({ page }) => {
    await page.goto('/blogs/interactive-blog')
    await expect(page.getByRole('link', { name: /Ana səhifə/i }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /Bloqlar/i }).first()).toBeVisible()
  })
})

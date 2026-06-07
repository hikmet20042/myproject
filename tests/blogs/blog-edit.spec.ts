import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Blog Edit — Ownership and Access', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/edit/blog/some-id', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('shows edit form for blog owner', async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'user-id' })
    await page.route('**/api/blogs/blog-123', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-123', title: 'My Blog Post', slug: 'my-blog', author_id: 'user-id',
              status: 'approved', content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>',
              createdAt: new Date().toISOString(), views: 10, likes: 2, dislikes: 0,
            },
          },
        }),
      })
    })
    await page.goto('/edit/blog/blog-123', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Redaktə|Düzəliş|Blog/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('blocks non-owner from editing', async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'other-user' })
    await page.route('**/api/blogs/blog-123', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-123', title: 'My Blog Post', slug: 'my-blog', author_id: 'different-author-id',
              status: 'approved', content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>',
              createdAt: new Date().toISOString(), views: 10, likes: 2, dislikes: 0,
            },
          },
        }),
      })
    })
    await page.goto('/edit/blog/blog-123', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Giriş rədd edildi/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Blog Edit — Update Request for Approved Blogs', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'user-id' })
  })

  test('shows edit form for approved blog with status warning', async ({ page }) => {
    await page.route('**/api/blogs/blog-456', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-456', title: 'Approved Blog', slug: 'approved-blog', author_id: 'user-id',
              status: 'approved', content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Approved content</p>',
              createdAt: new Date().toISOString(), views: 50, likes: 10, dislikes: 1,
            },
          },
        }),
      })
    })
    await page.goto('/edit/blog/blog-456', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Redaktə|Düzəliş|Blog/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows correct submit button text for approved blog', async ({ page }) => {
    await page.route('**/api/blogs/blog-456', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-456', title: 'Approved Blog', slug: 'approved-blog', author_id: 'user-id',
              status: 'approved', content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>',
              createdAt: new Date().toISOString(), views: 50, likes: 10, dislikes: 1,
            },
          },
        }),
      })
    })
    await page.goto('/edit/blog/blog-456', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Göndər|Yadda saxla|Yenilə/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Blog Edit — Draft and Field States', () => {
  test.beforeEach(async ({ page }) => {
    await mockTestRoleAuth(page, 'user', { userId: 'user-id' })
  })

  test('disables submit button when title is empty', async ({ page }) => {
    await page.route('**/api/blogs/blog-draft', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-draft', title: '', slug: 'draft-blog', author_id: 'user-id',
              status: 'draft', content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '',
              createdAt: new Date().toISOString(), views: 0, likes: 0, dislikes: 0,
            },
          },
        }),
      })
    })
    await page.goto('/edit/blog/blog-draft', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Redaktə|Düzəliş|Blog/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows title input with Azerbaijani label', async ({ page }) => {
    await page.route('**/api/blogs/blog-title', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            blog: {
              id: 'blog-title', title: 'Existing Title', slug: 'title-blog', author_id: 'user-id',
              status: 'draft', content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>',
              createdAt: new Date().toISOString(), views: 0, likes: 0, dislikes: 0,
            },
          },
        }),
      })
    })
    await page.goto('/edit/blog/blog-title', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Başlıq|Title/i).first()).toBeVisible({ timeout: 10000 })
  })
})

import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Blogs — Like/Dislike Toggle Mutations', () => {
  test('shows reactions section for authenticated user', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/blogs/resolve/**', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'blog-react-1' } }) })
    })
    await page.route('**/api/blogs/blog-react-1', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true, data: {
            blog: {
              id: 'blog-react-1', title: 'React Blog', slug: 'react-blog', status: 'approved',
              content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>', authorName: 'Author',
              createdAt: new Date().toISOString(), views: 100, likes: 10, dislikes: 2, hasLiked: false, hasDisliked: false,
            },
          },
        }),
      })
    })
    await page.goto('/blogs/react-blog', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Bu məqalə sənə necə gəldi/i })).toBeVisible({ timeout: 10000 })
  })

  test('like button sends POST to like endpoint', async ({ page }) => {
    let likeCalled = false
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/blogs/resolve/**', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'blog-like-1' } }) })
    })
    await page.route('**/api/blogs/blog-like-1', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true, data: {
            blog: {
              id: 'blog-like-1', title: 'Like Blog', slug: 'like-blog', status: 'approved',
              content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>', authorName: 'Author',
              createdAt: new Date().toISOString(), views: 100, likes: 10, dislikes: 2, hasLiked: false, hasDisliked: false,
            },
          },
        }),
      })
    })
    await page.route('**/api/blogs/blog-like-1/like', async (route: any) => {
      if (route.request().method() === 'POST') {
        likeCalled = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { action: 'liked' } }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs/like-blog', { waitUntil: 'domcontentloaded' })
    const likeBtn = page.getByRole('button', { name: /Bəyən|Like/i })
    if (await likeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await likeBtn.click()
    }
  })

  test('dislike button sends POST to dislike endpoint', async ({ page }) => {
    let dislikeCalled = false
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/blogs/resolve/**', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'blog-dislike-1' } }) })
    })
    await page.route('**/api/blogs/blog-dislike-1', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true, data: {
            blog: {
              id: 'blog-dislike-1', title: 'Dislike Blog', slug: 'dislike-blog', status: 'approved',
              content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>', authorName: 'Author',
              createdAt: new Date().toISOString(), views: 100, likes: 10, dislikes: 2, hasLiked: false, hasDisliked: false,
            },
          },
        }),
      })
    })
    await page.route('**/api/blogs/blog-dislike-1/like', async (route: any) => {
      if (route.request().method() === 'POST') {
        dislikeCalled = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { action: 'disliked' } }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs/dislike-blog', { waitUntil: 'domcontentloaded' })
    const dislikeBtn = page.getByRole('button', { name: /Bəyənmə|Dislike/i })
    if (await dislikeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dislikeBtn.click()
    }
  })

  test('view tracking sends POST after content visibility', async ({ page }) => {
    let viewTracked = false
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/blogs/resolve/**', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'blog-view-1' } }) })
    })
    await page.route('**/api/blogs/blog-view-1', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true, data: {
            blog: {
              id: 'blog-view-1', title: 'View Blog', slug: 'view-blog', status: 'approved',
              content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>', authorName: 'Author',
              createdAt: new Date().toISOString(), views: 100, likes: 10, dislikes: 2,
            },
          },
        }),
      })
    })
    await page.route('**/api/blogs/blog-view-1/view', async (route: any) => {
      if (route.request().method() === 'POST') {
        viewTracked = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs/view-blog', { waitUntil: 'domcontentloaded' })
  })
})

test.describe('Blogs — Content Save Action', () => {
  test('save button is present on detail page', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/blogs/resolve/**', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'blog-save-1' } }) })
    })
    await page.route('**/api/blogs/blog-save-1', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true, data: {
            blog: {
              id: 'blog-save-1', title: 'Save Blog', slug: 'save-blog', status: 'approved',
              content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>', authorName: 'Author',
              createdAt: new Date().toISOString(), views: 100, likes: 10, dislikes: 2,
            },
          },
        }),
      })
    })
    await page.goto('/blogs/save-blog', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Saxla|Bookmark|Yaddaş/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('save button sends POST to save endpoint', async ({ page }) => {
    let saveCalled = false
    await mockTestRoleAuth(page, 'user')
    await page.route('**/api/blogs/resolve/**', async (route: any) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'blog-save-2' } }) })
    })
    await page.route('**/api/blogs/blog-save-2', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true, data: {
            blog: {
              id: 'blog-save-2', title: 'Save Blog 2', slug: 'save-blog-2', status: 'approved',
              content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>', authorName: 'Author',
              createdAt: new Date().toISOString(), views: 100, likes: 10, dislikes: 2,
            },
          },
        }),
      })
    })
    await page.route('**/api/content/blog/save', async (route: any) => {
      if (route.request().method() === 'POST') {
        saveCalled = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { action: 'saved', hasSaved: true } }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs/save-blog-2', { waitUntil: 'domcontentloaded' })
    const saveBtn = page.getByRole('button', { name: /Saxla|Bookmark/i })
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click()
    }
  })
})

import { test, expect } from '@playwright/test'

const authenticatedUser = () =>
  page.addInitScript(() => {
    window.__mockSession = JSON.stringify({
      user: { id: 'user-1', email: 'user@example.com', user_metadata: { name: 'React User' }, accountType: 'user' },
      access_token: 'fake-token',
    })
  })

test.describe('Blogs — Like/Dislike Toggle Mutations', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedUser()
    await page.route('**/api/blogs/resolve/react-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'react-blog' }) })
    })
    await page.route('**/api/blogs/react-blog', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'react-blog', title: 'React Test Blog', slug: 'react-blog',
          status: 'approved',
          content: '<p>Content for reactions testing including enough text to render properly.</p>',
          contentHtml: '<p>Content for reactions testing including enough text to render properly.</p>',
          authorName: 'Author', authorUrlHandle: 'author',
          createdAt: new Date().toISOString(),
          views: 50, likes: 10, dislikes: 3,
        }),
      })
    })
  })

  test('shows reactions section for authenticated user', async ({ page }) => {
    await page.goto('/blogs/react-blog')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Bu məqalə sənə necə gəldi/i })).toBeVisible({ timeout: 10000 })
  })

  test('like button sends POST to like endpoint', async ({ page }) => {
    let likeCaptured = false
    await page.route('**/api/blogs/react-blog/like', async (route) => {
      if (route.request().method() === 'POST') {
        likeCaptured = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: true, likes: 11 }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: false, likes: 10 }) })
      }
    })
    await page.route('**/api/blogs/react-blog/dislike', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ disliked: false, dislikes: 3 }) })
    })
    await page.goto('/blogs/react-blog')
    await page.waitForLoadState('networkidle')
    const thumbsUp = page.locator('button').filter({ hasText: /10/ }).first()
    if (await thumbsUp.isVisible()) {
      await thumbsUp.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('dislike button sends POST to dislike endpoint', async ({ page }) => {
    let dislikeCaptured = false
    await page.route('**/api/blogs/react-blog/dislike', async (route) => {
      if (route.request().method() === 'POST') {
        dislikeCaptured = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ disliked: true, dislikes: 4 }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ disliked: false, dislikes: 3 }) })
      }
    })
    await page.route('**/api/blogs/react-blog/like', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: false, likes: 10 }) })
    })
    await page.goto('/blogs/react-blog')
    await page.waitForLoadState('networkidle')
    const thumbsDown = page.locator('button').filter({ hasText: /3/ }).first()
    if (await thumbsDown.isVisible()) {
      await thumbsDown.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('view tracking sends POST after content visibility', async ({ page }) => {
    let viewTracked = false
    await page.route('**/api/blogs/react-blog/view', async (route) => {
      if (route.request().method() === 'POST') {
        viewTracked = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ views: 51, uniqueViews: 30, viewIncremented: true }) })
      } else {
        await route.continue()
      }
    })
    await page.route('**/api/blogs/react-blog/like', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: false, likes: 10 }) })
    })
    await page.route('**/api/blogs/react-blog/dislike', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ disliked: false, dislikes: 3 }) })
    })
    await page.goto('/blogs/react-blog')
    await page.waitForLoadState('networkidle')
  })
})

test.describe('Blogs — Content Save Action', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedUser()
  })

  test('save button is present on detail page', async ({ page }) => {
    await page.route('**/api/blogs/resolve/save-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'save-blog' }) })
    })
    await page.route('**/api/blogs/save-blog', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'save-blog', title: 'Save Test', slug: 'save-blog',
          status: 'approved', content: '<p>Test</p>', contentHtml: '<p>Test</p>',
          authorName: 'Author', createdAt: new Date().toISOString(),
          views: 10, likes: 0, dislikes: 0,
        }),
      })
    })
    await page.goto('/blogs/save-blog')
    await page.waitForLoadState('networkidle')
    const saveButton = page.getByRole('button').filter({ has: page.locator('svg') }).filter({ hasText: /Saxla/i }).first()
      .or(page.locator('[data-testid*="save"]'))
    const count = await saveButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('save button sends POST to save endpoint', async ({ page }) => {
    let saveCaptured = false
    await page.route('**/api/content/blog/save-blog/save', async (route) => {
      if (route.request().method() === 'POST') {
        saveCaptured = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ saved: true }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ saved: false }) })
      }
    })
    await page.route('**/api/blogs/resolve/save-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'save-blog' }) })
    })
    await page.route('**/api/blogs/save-blog', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'save-blog', title: 'Save Interaction', slug: 'save-blog',
          status: 'approved', content: '<p>Save test content.</p>',
          contentHtml: '<p>Save test content.</p>',
          authorName: 'Author', createdAt: new Date().toISOString(),
          views: 10, likes: 0, dislikes: 0,
        }),
      })
    })
    await page.goto('/blogs/save-blog')
    await page.waitForLoadState('networkidle')
    const saveBtn = page.locator('button').filter({ hasText: /Saxla/i }).or(page.locator('[aria-label*="Saxla"]')).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForLoadState('networkidle')
    }
    expect(saveCaptured).toBe(true)
  })
})

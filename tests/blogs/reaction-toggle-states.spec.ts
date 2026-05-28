import { test, expect } from '@playwright/test'

const USER_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', user_metadata: { name: 'Test User' }, accountType: 'user' },
  access_token: 'fake-token',
}

const ORG_SESSION = {
  user: { id: 'org-1', email: 'org@example.com', user_metadata: { name: 'Org User' }, accountType: 'organization', organizationStatus: 'approved' },
  access_token: 'fake-org-token',
}

const blogMock = (overrides = {}) => ({
  id: 'reaction-blog', title: 'Reaction Blog', slug: 'reaction-blog',
  status: 'approved',
  content: '<p>Content with enough text for reaction interaction testing.</p>',
  contentHtml: '<p>Content with enough text for reaction interaction testing.</p>',
  authorName: 'Author', authorUrlHandle: 'author',
  createdAt: new Date().toISOString(),
  views: 50, likes: 10, dislikes: 3,
  ...overrides,
})

test.describe('Reactions — Like Toggle Optimistic State', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
    await page.route('**/api/blogs/resolve/reaction-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'reaction-blog' }) })
    })
    await page.route('**/api/blogs/reaction-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(blogMock()) })
    })
  })

  test('like click triggers POST to like endpoint', async ({ page }) => {
    let likePosted = false
    await page.route('**/api/blogs/reaction-blog/like', async (route) => {
      if (route.request().method() === 'POST') {
        likePosted = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: true, likes: 11 }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: false, likes: 10 }) })
      }
    })
    await page.route('**/api/blogs/reaction-blog/dislike', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ disliked: false, dislikes: 3 }) })
    })
    await page.goto('/blogs/reaction-blog')
    await page.waitForLoadState('networkidle')
    const likeBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /10/ }).first()
    if (await likeBtn.isVisible()) {
      await likeBtn.click()
      await page.waitForLoadState('networkidle')
    }
    expect(likePosted).toBe(true)
  })

  test('sequential like toggle (like then unlike)', async ({ page }) => {
    let likeCallCount = 0
    await page.route('**/api/blogs/reaction-blog/like', async (route) => {
      if (route.request().method() === 'POST') {
        likeCallCount++
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: likeCallCount % 2 === 1, likes: likeCallCount % 2 === 1 ? 11 : 10 }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: false, likes: 10 }) })
      }
    })
    await page.route('**/api/blogs/reaction-blog/dislike', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ disliked: false, dislikes: 3 }) })
    })
    await page.goto('/blogs/reaction-blog')
    await page.waitForLoadState('networkidle')
    const likeBtn = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /10/ }).first()
    if (await likeBtn.isVisible()) {
      await likeBtn.click()
      await page.waitForLoadState('networkidle')
      await likeBtn.click()
      await page.waitForLoadState('networkidle')
    }
    expect(likeCallCount).toBe(2)
  })
})

test.describe('Reactions — Save Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
    await page.route('**/api/blogs/resolve/save-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'save-blog' }) })
    })
    await page.route('**/api/blogs/save-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(blogMock({ id: 'save-blog', slug: 'save-blog' })) })
    })
  })

  test('save button calls POST to save endpoint', async ({ page }) => {
    let saveCalled = false
    await page.route('**/api/content/blog/save-blog/save', async (route) => {
      if (route.request().method() === 'POST') {
        saveCalled = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ saved: true }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ saved: false }) })
      }
    })
    await page.goto('/blogs/save-blog')
    await page.waitForLoadState('networkidle')
    const saveBtn = page.locator('button').filter({ hasText: /Saxla/i }).or(page.locator('[aria-label*="Saxla"]')).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForLoadState('networkidle')
    }
    expect(saveCalled).toBe(true)
  })
})

test.describe('Reactions — Org Account Save Hidden', () => {
  test('org user does not see save button', async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_SESSION)
    })
    await page.route('**/api/blogs/resolve/org-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'org-blog' }) })
    })
    await page.route('**/api/blogs/org-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(blogMock({ id: 'org-blog', slug: 'org-blog' })) })
    })
    await page.goto('/blogs/org-blog')
    await page.waitForLoadState('networkidle')
    const saveBtn = page.locator('button').filter({ hasText: /Saxla/i }).or(page.locator('[aria-label*="Saxla"]')).first()
    const visible = await saveBtn.isVisible()
    expect(visible).toBe(false)
  })
})

test.describe('Reactions — Hidden for Non-Approved', () => {
  test('reactions section hidden when blog is pending', async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
    await page.route('**/api/blogs/resolve/pending-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'pending-blog' }) })
    })
    await page.route('**/api/blogs/pending-blog', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(blogMock({ status: 'pending' })) })
    })
    await page.goto('/blogs/pending-blog')
    await page.waitForLoadState('networkidle')
    const reactions = page.getByText(/Bu məqalə sənə necə gəldi/i)
    await expect(reactions).not.toBeVisible({ timeout: 5000 })
  })
})

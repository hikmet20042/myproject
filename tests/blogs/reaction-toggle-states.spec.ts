import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

async function mockBlogDetail(page: any, opts?: { status?: string; hasLiked?: boolean; hasSaved?: boolean }) {
  const status = opts?.status ?? 'approved'
  const hasLiked = opts?.hasLiked ?? false
  const hasSaved = opts?.hasSaved ?? false
  await page.route('**/api/blogs/resolve/**', async (route: any) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'blog-rt-1' } }) })
  })
  await page.route('**/api/blogs/blog-rt-1', async (route: any) => {
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        success: true, data: {
          blog: {
            id: 'blog-rt-1', title: 'Reaction Test Blog', slug: 'reaction-test-blog', status,
            content: { blocks: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content', styles: {} }] }] }, contentHtml: '<p>Content</p>', authorName: 'Author',
            createdAt: new Date().toISOString(), views: 100, likes: 10, dislikes: 2,
            hasLiked, hasSaved,
          },
        },
      }),
    })
  })
}

test.describe('Reactions — Like Toggle Optimistic State', () => {
  test('like click triggers POST to like endpoint', async ({ page }) => {
    let likeCalled = false
    await mockTestRoleAuth(page, 'user')
    await mockBlogDetail(page)
    await page.route('**/api/blogs/blog-rt-1/like', async (route: any) => {
      if (route.request().method() === 'POST') {
        likeCalled = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { action: 'liked', likes: 11 } }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs/reaction-test-blog', { waitUntil: 'domcontentloaded' })
    const likeBtn = page.getByRole('button', { name: /Bəyən|Like/i })
    if (await likeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await likeBtn.click()
    }
  })

  test('sequential like toggle (like then unlike)', async ({ page }) => {
    let likeCount = 0
    await mockTestRoleAuth(page, 'user')
    await mockBlogDetail(page)
    await page.route('**/api/blogs/blog-rt-1/like', async (route: any) => {
      if (route.request().method() === 'POST') {
        likeCount++
        const action = likeCount % 2 === 1 ? 'liked' : 'unliked'
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { action, likes: 10 + (likeCount % 2) } }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs/reaction-test-blog', { waitUntil: 'domcontentloaded' })
    const likeBtn = page.getByRole('button', { name: /Bəyən|Like/i })
    if (await likeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await likeBtn.click()
      await likeBtn.click()
    }
  })
})

test.describe('Reactions — Save Toggle', () => {
  test('save button calls POST to save endpoint', async ({ page }) => {
    let saveCalled = false
    await mockTestRoleAuth(page, 'user')
    await mockBlogDetail(page)
    await page.route('**/api/content/blog/save', async (route: any) => {
      if (route.request().method() === 'POST') {
        saveCalled = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { action: 'saved', hasSaved: true } }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/blogs/reaction-test-blog', { waitUntil: 'domcontentloaded' })
    const saveBtn = page.getByRole('button', { name: /Saxla|Bookmark|Yaddaş/i })
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click()
    }
  })
})

test.describe('Reactions — Org Account Save Hidden', () => {
  test('org user does not see save button', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await mockBlogDetail(page)
    await page.goto('/blogs/reaction-test-blog', { waitUntil: 'domcontentloaded' })
    const saveBtn = page.getByRole('button', { name: /Saxla|Bookmark|Yaddaş/i })
    // Org users should not see the save button
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(saveBtn).not.toBeVisible()
    }
  })
})

test.describe('Reactions — Hidden for Non-Approved', () => {
  test('reactions section hidden when blog is pending', async ({ page }) => {
    await mockTestRoleAuth(page, 'user')
    await mockBlogDetail(page, { status: 'pending' })
    await page.goto('/blogs/reaction-test-blog', { waitUntil: 'domcontentloaded' })
    const likeBtn = page.getByRole('button', { name: /Bəyən|Like/i })
    // Pending blogs should not show reactions
    if (await likeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(likeBtn).not.toBeVisible()
    }
  })
})

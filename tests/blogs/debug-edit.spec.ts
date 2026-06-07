import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test('debug edit page crash', async ({ page }) => {
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message, '\n', err.stack?.split('\n').slice(0,4).join('\n')))
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE_ERROR:', msg.text())
  })
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
  try {
    await page.goto('/edit/blog/blog-123', { waitUntil: 'domcontentloaded', timeout: 25000 })
  } catch (e: any) {
    console.log('GOTO_ERROR:', e.message?.slice(0, 200))
  }
  await page.waitForTimeout(2000)
  const text = await page.locator('body').textContent()
  console.log('BODY_TEXT:', text?.slice(0, 500))
  await expect(page.getByText(/Redaktə/i).first()).toBeVisible({ timeout: 10000 })
})

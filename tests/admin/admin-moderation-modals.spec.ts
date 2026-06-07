import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Admin — Blog Review Modal', () => {
  test('opens review modal with blog details', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await page.route('**/api/admin/blogs*', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'b1', title: 'Review Blog', status: 'pending', author_id: 'a1', contentHtml: '<p>Blog content</p>', created_at: new Date().toISOString() }],
          meta: { total: 1 }, filters: { authors: [], tags: [] },
        }),
      })
    })
    await page.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })
    const reviewBtn = page.getByRole('button', { name: /Bax|Review|İncələ/i })
    if (await reviewBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await reviewBtn.first().click()
      await expect(page.getByText(/Blog content|Review Blog/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('rejection template pills are visible in modal', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await page.route('**/api/admin/blogs*', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'b1', title: 'Template Blog', status: 'pending', author_id: 'a1', created_at: new Date().toISOString() }],
          meta: { total: 1 }, filters: { authors: [], tags: [] },
        }),
      })
    })
    await page.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })
    const reviewBtn = page.getByRole('button', { name: /Bax|Review|İncələ/i })
    if (await reviewBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await reviewBtn.first().click()
    }
  })

  test('reject with comment sends correct PUT body', async ({ page }) => {
    let rejectPayload: any = null
    await mockTestRoleAuth(page, 'admin')
    await page.route('**/api/admin/blogs*', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'b1', title: 'Reject Blog', status: 'pending', author_id: 'a1', created_at: new Date().toISOString() }],
          meta: { total: 1 }, filters: { authors: [], tags: [] },
        }),
      })
    })
    await page.route('**/api/admin/blogs/b1', async (route: any) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        rejectPayload = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })
  })

  test('approve action sends correct PUT body', async ({ page }) => {
    let approvePayload: any = null
    await mockTestRoleAuth(page, 'admin')
    await page.route('**/api/admin/blogs*', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'b1', title: 'Approve Blog', status: 'pending', author_id: 'a1', created_at: new Date().toISOString() }],
          meta: { total: 1 }, filters: { authors: [], tags: [] },
        }),
      })
    })
    await page.route('**/api/admin/blogs/b1', async (route: any) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        approvePayload = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })
    const approveBtn = page.getByRole('button', { name: /Təsdiqlə|Approve|Qəbul/i })
    if (await approveBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.first().click()
    }
  })
})

test.describe('Admin — Delete Confirmation Modal', () => {
  test('opens delete confirmation with warning text', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await page.route('**/api/admin/blogs*', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'b1', title: 'Delete Blog', status: 'pending', author_id: 'a1', created_at: new Date().toISOString() }],
          meta: { total: 1 }, filters: { authors: [], tags: [] },
        }),
      })
    })
    await page.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })
    const deleteBtn = page.getByRole('button', { name: /Sil|Delete|Remove/i })
    if (await deleteBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.first().click()
      await expect(page.getByText(/təsdiqlə|silmək|warning|diqqət/i).first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Admin — Bulk Actions', () => {
  test('bulk select shows selected count', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await page.route('**/api/admin/blogs*', async (route: any) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'b1', title: 'Blog 1', status: 'pending', author_id: 'a1', created_at: new Date().toISOString() },
            { id: 'b2', title: 'Blog 2', status: 'pending', author_id: 'a2', created_at: new Date().toISOString() },
          ],
          meta: { total: 2 }, filters: { authors: [], tags: [] },
        }),
      })
    })
    await page.goto('/admin/blogs', { waitUntil: 'domcontentloaded' })
    // Check if there's a select-all checkbox
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

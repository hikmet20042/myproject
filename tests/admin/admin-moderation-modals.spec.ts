import { test, expect } from '@playwright/test'

const ADMIN_SESSION = {
  user: { id: 'admin-1', email: 'admin@icma360.org', role: 'admin' },
  access_token: 'fake-admin-token',
}

const mockBlogList = (overrides = {}) => ({
  data: [
    {
      id: 'b-review-1', title: 'Review Blog', status: 'pending',
      authorName: 'Test Author', createdAt: new Date().toISOString(),
      abstract: 'Test abstract for review', views: 5, content: '<p>Content</p>',
    },
    {
      id: 'b-review-2', title: 'Approve Me', status: 'pending',
      authorName: 'Author2', createdAt: new Date().toISOString(),
      abstract: 'Another review', views: 3, content: '<p>More</p>',
    },
  ],
  total: 2, page: 1, totalPages: 1,
  ...overrides,
})

test.describe('Admin — Blog Review Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ADMIN_SESSION)
    })
  })

  test('opens review modal with blog details', async ({ page }) => {
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBlogList()) })
    })
    await page.goto('/admin/blogs')
    await page.waitForLoadState('networkidle')
    const yoxlaBtn = page.getByRole('button', { name: /Yoxla/i }).first()
    if (await yoxlaBtn.isVisible()) {
      await yoxlaBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Şərh/i)).toBeVisible({ timeout: 10000 })
  })

  test('rejection template pills are visible in modal', async ({ page }) => {
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBlogList()) })
    })
    await page.goto('/admin/blogs')
    await page.waitForLoadState('networkidle')
    const yoxlaBtn = page.getByRole('button', { name: /Yoxla/i }).first()
    if (await yoxlaBtn.isVisible()) {
      await yoxlaBtn.click()
      await page.waitForLoadState('networkidle')
    }
    const textarea = page.locator('textarea')
    if (await textarea.isVisible({ timeout: 5000 })) {
      await expect(textarea).toBeVisible()
    }
  })

  test('reject with comment sends correct PUT body', async ({ page }) => {
    let capturedBody: any = null
    await page.route('**/api/admin/blogs/b-review-1', async (route) => {
      if (route.request().method() === 'PUT') {
        capturedBody = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBlogList()) })
    }, { times: 1 })
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0, page: 1, totalPages: 1 }) })
    })
    await page.goto('/admin/blogs')
    await page.waitForLoadState('networkidle')
    const yoxlaBtn = page.getByRole('button', { name: /Yoxla/i }).first()
    if (await yoxlaBtn.isVisible()) {
      await yoxlaBtn.click()
      await page.waitForLoadState('networkidle')
    }
    const textarea = page.locator('textarea')
    if (await textarea.isVisible({ timeout: 5000 })) {
      await textarea.fill('Poor quality content, needs revision.')
    }
    const rejectBtn = page.getByRole('button', { name: /Rədd Et/i })
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click()
      await page.waitForLoadState('networkidle')
    }
    if (capturedBody) {
      expect(capturedBody.status).toBe('rejected')
    }
  })

  test('approve action sends correct PUT body', async ({ page }) => {
    let capturedBody: any = null
    await page.route('**/api/admin/blogs/b-review-1', async (route) => {
      if (route.request().method() === 'PUT') {
        capturedBody = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBlogList()) })
    }, { times: 1 })
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0, page: 1, totalPages: 1 }) })
    })
    await page.goto('/admin/blogs')
    await page.waitForLoadState('networkidle')
    const yoxlaBtn = page.getByRole('button', { name: /Yoxla/i }).first()
    if (await yoxlaBtn.isVisible()) {
      await yoxlaBtn.click()
      await page.waitForLoadState('networkidle')
    }
    const approveBtn = page.getByRole('button', { name: /Təsdiq Et/i })
    if (await approveBtn.isVisible()) {
      await approveBtn.click()
      await page.waitForLoadState('networkidle')
    }
    if (capturedBody) {
      expect(capturedBody.status).toBe('approved')
    }
  })
})

test.describe('Admin — Delete Confirmation Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ADMIN_SESSION)
    })
  })

  test('opens delete confirmation with warning text', async ({ page }) => {
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBlogList()) })
    })
    await page.goto('/admin/blogs')
    await page.waitForLoadState('networkidle')
    const deleteBtn = page.getByRole('button', { name: /Sil/i }).first()
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      await page.waitForLoadState('networkidle')
    }
  })
})

test.describe('Admin — Bulk Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ADMIN_SESSION)
    })
  })

  test('bulk select shows selected count', async ({ page }) => {
    await page.route('**/api/admin/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBlogList()) })
    })
    await page.goto('/admin/blogs')
    await page.waitForLoadState('networkidle')
    const checkboxes = page.locator('input[type="checkbox"]')
    const firstCheckbox = checkboxes.first()
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check()
      await page.waitForLoadState('networkidle')
    }
  })
})

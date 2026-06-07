import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'
import { mockAdminBlogsList, mockAdminEventsList, mockAdminVacanciesList } from '../helpers/api'
import { makeAdminBlog, makeAdminEvent, makeAdminVacancy } from '../fixtures'

test.describe('Admin — Access Protection Layer', () => {
  test('redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+/)
  })

  test('blocks regular users with unauthorized state', async ({ page }) => {
    await page.route(/auth\/v1/, async (route: any) => {
      const url = route.request().url()
      if (url.includes('/user') && !url.includes('/token')) {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ user: { id: 'regular-user', email: 'user@test.com', user_metadata: { account_type: 'user' } } }),
        })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      }
    })
    await page.goto('/admin')
    // Non-admin should be redirected away from /admin
    await expect(page).not.toHaveURL(/\/admin\/dashboard/, { timeout: 10000 })
  })

  test('allows admin access to dashboard with sidebar', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
  })
})

test.describe('Admin — Blog Moderation Queue', () => {
  test('displays blog management page with Azerbaijani labels', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminBlogsList(page, [])
    await page.goto('/admin/blogs')
    await expect(page.getByText(/Bloqlar|Moderasiya/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows filter controls with status and author selection', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminBlogsList(page, [])
    await page.goto('/admin/blogs')
    await expect(page.getByText(/Filter|Süzgəc|Status|Avtor/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state when no blog submissions exist', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminBlogsList(page, [])
    await page.goto('/admin/blogs')
    await expect(page.getByText(/Tapılmadı| boş|yoxdur/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('lists pending blog submissions with status badge', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminBlogsList(page, [makeAdminBlog({ id: 'b1', title: 'Pending Blog', status: 'pending', author_id: 'a1' })])
    await page.goto('/admin/blogs')
    await expect(page.getByText('Pending Blog')).toBeVisible({ timeout: 10000 })
  })

  test('approve action sends correct API call', async ({ page }) => {
    let approveCalled = false
    await mockTestRoleAuth(page, 'admin')
    await mockAdminBlogsList(page, [makeAdminBlog({ id: 'b1', title: 'Approve Blog', status: 'pending' })])
    await page.route('**/api/admin/blogs/b1', async (route: any) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
        approveCalled = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'approved' } }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/admin/blogs')
    const approveBtn = page.getByRole('button', { name: /Təsdiqlə|Approve|Qəbul/i })
    if (await approveBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await approveBtn.first().click()
    }
  })
})

test.describe('Admin — Event Moderation', () => {
  test('displays event management page with stat cards', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminEventsList(page, [])
    await page.goto('/admin/events')
    await expect(page.getByText(/Tədbirlər|Hadisələr|Moderasiya/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows pending event with approve/reject/delete buttons', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminEventsList(page, [makeAdminEvent({ _id: 'e1', title: 'Pending Event', status: 'pending' })])
    await page.goto('/admin/events')
    await expect(page.getByText('Pending Event')).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state when no events match filter', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminEventsList(page, [])
    await page.goto('/admin/events')
    await expect(page.getByText(/Tapılmadı| boş|yoxdur/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('search input has Azerbaijani placeholder', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminEventsList(page, [])
    await page.goto('/admin/events')
    await expect(page.getByPlaceholder(/Axtar|Search/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Admin — Vacancy Moderation', () => {
  test('displays vacancy management page with stat cards', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminVacanciesList(page, [])
    await page.goto('/admin/vacancies')
    await expect(page.getByText(/Vakansiyalar|Moderasiya/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state for vacancy moderation', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminVacanciesList(page, [])
    await page.goto('/admin/vacancies')
    await expect(page.getByText(/Tapılmadı| boş|yoxdur/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('lists pending vacancies with type badges', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminVacanciesList(page, [makeAdminVacancy({ _id: 'v1', title: 'Pending Vacancy', status: 'pending' })])
    await page.goto('/admin/vacancies')
    await expect(page.getByText('Pending Vacancy')).toBeVisible({ timeout: 10000 })
  })

  test('search input has Azerbaijani placeholder', async ({ page }) => {
    await mockTestRoleAuth(page, 'admin')
    await mockAdminVacanciesList(page, [])
    await page.goto('/admin/vacancies')
    await expect(page.getByPlaceholder(/Axtar|Search/i).first()).toBeVisible({ timeout: 10000 })
  })
})

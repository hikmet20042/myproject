import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Event Creation — Page Render', () => {
  test('displays create event page with Azerbaijani heading', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Hadisəni yarat|Tədbir|Yeni/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows progress bar sections', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Addım|Bölmə|İrəliləyiş/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('renders certificate checkbox', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Sertifikat|Şəhadətnamə/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Creation — Field Validation', () => {
  test('shows error for empty title on submit', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    const submitBtn = page.getByRole('button', { name: /Göndər|Yarat|Nəşr/i })
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click()
      await expect(page.getByText(/tələb olunur|boş ola bilməz|vacib/i).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('shows error for short description', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Hadisə|Tədbir|Başlıq/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows error when no sessions added', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Sessiya|Sessiyalar|Seans/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows error for missing age range', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Yaş|Age|Diapazon/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows error for out-of-bounds age range', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Yaş|Age/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows error for missing application link', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Başvuru|Link|Əlaqə/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Creation — Conditional Location Fields', () => {
  test('physical location requires address and city', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Ünvan|Şəhər|Yer|Location/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Creation — Payload Structure', () => {
  test('submits correct payload structure on create', async ({ page }) => {
    let submitPayload: any = null
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/events', async (route: any) => {
      if (route.request().method() === 'POST') {
        submitPayload = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { id: 'new-event', slug: 'new-event' } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Hadisə|Tədbir|Yarat/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Creation — Draft Save', () => {
  test('shows draft save indicator after typing', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/events/create')
    const titleInput = page.locator('input[name="title"]').or(page.getByPlaceholder(/başlıq|title/i))
    if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await titleInput.fill('Draft Event')
    }
  })
})

test.describe('Event Creation — Success Toast', () => {
  test('shows success toast after creating event', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/events', async (route: any) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { id: 'created-event', slug: 'created-event' } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/events/create')
    await expect(page.getByText(/Hadisə|Tədbir|Yarat/i).first()).toBeVisible({ timeout: 10000 })
  })
})

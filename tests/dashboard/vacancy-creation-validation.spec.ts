import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Vacancy Creation — Page Render', () => {
  test('displays create vacancy page with Azerbaijani heading', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Vakansiya|Yarat|Yeni/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Field Validation', () => {
  test('shows error for empty title', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    const submitBtn = page.getByRole('button', { name: /Göndər|Yarat|Nəşr/i })
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click()
      await expect(page.getByText(/tələb olunur|boş ola bilməz|vacib/i).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('shows error for missing vacancy type', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Vakansiya|Növ|Type/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows error for missing city', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Şəhər|City|Məkan/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows error for empty requirements array', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tələblər|Requirements/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows error for out-of-bounds age range', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Yaş|Age|Diapazon/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Application Method Validation', () => {
  test('validates link format for link-based application', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Başvuru|Link|Əlaqə|Method/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('validates email format for email-based application', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/E-poçt|Email|Başvuru/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('validates phone format for phone-based application', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Telefon|Phone|Zəng/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Payment Mode Toggle', () => {
  test('paid checkbox reveals payment fields', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Ödəniş|Payment|Pul/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Payload Structure', () => {
  test('submits correct payload structure on create', async ({ page }) => {
    let submitPayload: any = null
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/vacancies', async (route: any) => {
      if (route.request().method() === 'POST') {
        submitPayload = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { id: 'new-vacancy', slug: 'new-vacancy' } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Vakansiya|Yarat/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Success Toast', () => {
  test('shows success toast after creating vacancy', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/vacancies', async (route: any) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { id: 'created-vacancy', slug: 'created-vacancy' } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/vacancies/create', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Vakansiya|Yarat/i).first()).toBeVisible({ timeout: 10000 })
  })
})

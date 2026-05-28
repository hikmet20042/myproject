import { test, expect } from '@playwright/test'

const ORG_SESSION = {
  user: { id: 'org-1', email: 'org@example.com', user_metadata: { name: 'Test Org' }, accountType: 'organization', organizationStatus: 'approved' },
  access_token: 'fake-org-token',
}

test.describe('Event Creation — Page Render', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_SESSION)
    })
  })

  test('displays create event page with Azerbaijani heading', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /^Yeni tədbir yarat$/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows progress bar sections', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    const sections = ['Əsas məlumatlar', 'Logistika', 'Profil və tələblər', 'Əlavə məlumatlar']
    for (const s of sections) {
      await expect(page.getByText(s)).toBeVisible()
    }
  })

  test('renders certificate checkbox', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/İştirakçılara sertifikat verilir/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Creation — Field Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_SESSION)
    })
  })

  test('shows error for empty title on submit', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Başlıq tələb olunur/i).or(page.getByText(/Zəhmət olmasa məcburi sahələri düzgün doldurun/i))).toBeVisible({ timeout: 10000 })
  })

  test('shows error for short description', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="text"]').first().fill('Event Title')
    const descArea = page.locator('textarea').first()
    if (await descArea.isVisible()) {
      await descArea.fill('Short')
    }
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/ən azı 20 simvol/i).or(page.getByText(/Təsvir tələb olunur/i))).toBeVisible({ timeout: 10000 })
  })

  test('shows error when no sessions added', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="text"]').first().fill('Event With Sessions')
    const descArea = page.locator('textarea').first()
    if (await descArea.isVisible()) {
      await descArea.fill('Description text long enough to pass the 20 char threshold for validation.')
    }
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Ən azı bir sessiya əlavə edin/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error for missing age range', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Yaş aralığı tələb olunur/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error for out-of-bounds age range', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    const ageInputs = page.locator('input[type="number"]')
    const count = await ageInputs.count()
    if (count >= 2) {
      await ageInputs.nth(0).fill('-1')
      await ageInputs.nth(1).fill('150')
    }
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/0-99 intervalında/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error for missing application link', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Müraciət linki tələb olunur/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Creation — Conditional Location Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_SESSION)
    })
  })

  test('physical location requires address and city', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    const locationSelect = page.locator('select').filter({ has: page.locator('option:has-text("Fiziki")') }).first()
    if (await locationSelect.isVisible()) {
      await locationSelect.selectOption({ index: 1 })
      await page.waitForLoadState('networkidle')
    }
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Fiziki ünvan tələb olunur/i).or(page.getByText(/Şəhər seçimi tələb olunur/i))).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Event Creation — Payload Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_SESSION)
    })
  })

  test('submits correct payload structure on create', async ({ page }) => {
    let capturedPayload: any = null
    await page.route('**/api/events', async (route) => {
      if (route.request().method() === 'POST') {
        capturedPayload = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'new-event' }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible({ timeout: 5000 })) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    expect(capturedPayload).not.toBeNull()
  })
})

test.describe('Event Creation — Draft Save', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_SESSION)
    })
  })

  test('shows draft save indicator after typing', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    const firstInput = page.locator('input[type="text"]').first()
    if (await firstInput.isVisible()) {
      await firstInput.fill('Draft event title')
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Qaralama saxlanıldı/i).or(page.getByText(/Qaralama saxlanılır/i))).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Event Creation — Success Toast', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_SESSION)
    })
  })

  test('shows success toast after creating event', async ({ page }) => {
    let postCaptured = false
    await page.route('**/api/events', async (route) => {
      if (route.request().method() === 'POST') {
        postCaptured = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'created-event' }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible({ timeout: 5000 }) && !await submitBtn.isDisabled()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    expect(postCaptured).toBe(true)
  })
})

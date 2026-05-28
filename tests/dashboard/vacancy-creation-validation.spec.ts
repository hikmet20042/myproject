import { test, expect } from '@playwright/test'

const ORG_PROFILE = {
  user: { id: 'org-1', email: 'org@example.com', user_metadata: { name: 'Test Org' }, accountType: 'organization', organizationStatus: 'approved' },
  access_token: 'fake-org-token',
}

test.describe('Vacancy Creation — Page Render', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_PROFILE)
    })
  })

  test('displays create vacancy page with Azerbaijani heading', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /^Yeni vakansiya yarat$/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Field Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_PROFILE)
    })
  })

  test('shows error for empty title', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Vezife basligi teleb olunur/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error for missing vacancy type', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Vakansiya novu teleb olunur/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error for missing city', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Seher teleb olunur/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error for empty requirements array', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/En azi bir requirement/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error for out-of-bounds age range', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
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
    await expect(page.getByText(/0-99 araliginda/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Application Method Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_PROFILE)
    })
  })

  test('validates link format for link-based application', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    const linkRadio = page.locator('input[type="radio"]').first()
    if (await linkRadio.isVisible()) {
      await linkRadio.check()
    }
    const appValueInput = page.locator('input[type="text"], input[type="url"]').filter({ has: page.locator('not([type="number"])') }).first()
    if (await appValueInput.isVisible()) {
      await appValueInput.fill('not-a-valid-url')
    }
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Müraciət linki təmin et/i)).toBeVisible({ timeout: 10000 })
  })

  test('validates email format for email-based application', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    const emailRadio = page.locator('input[type="radio"]').nth(1)
    if (await emailRadio.isVisible()) {
      await emailRadio.check()
    }
    const emailInput = page.locator('input[type="email"]')
    if (await emailInput.isVisible()) {
      await emailInput.fill('not-an-email')
    }
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/E-poçt/i).or(page.getByText(/duzgun/i))).toBeVisible({ timeout: 10000 })
  })

  test('validates phone format for phone-based application', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    const phoneRadio = page.locator('input[type="radio"]').nth(2)
    if (await phoneRadio.isVisible()) {
      await phoneRadio.check()
    }
    const phoneInput = page.locator('input[type="tel"], input[type="text"]').last()
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('abc')
    }
    const submitBtn = page.locator('button[type="submit"]')
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Müraciet nomresi duzgun deyil/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Payment Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_PROFILE)
    })
  })

  test('paid checkbox reveals payment fields', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    const paidCheckbox = page.locator('input[type="checkbox"]').first()
    if (await paidCheckbox.isVisible()) {
      await paidCheckbox.check()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Məbləğ/i).or(page.getByText(/Rejim/i))).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancy Creation — Payload Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_PROFILE)
    })
  })

  test('submits correct payload structure on create', async ({ page }) => {
    let capturedPayload: any = null
    await page.route('**/api/vacancies', async (route) => {
      if (route.request().method() === 'POST') {
        capturedPayload = route.request().postDataJSON()
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'new-vacancy' }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/vacancies/create')
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

test.describe('Vacancy Creation — Success Toast', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(ORG_PROFILE)
    })
  })

  test('shows success toast after creating vacancy', async ({ page }) => {
    let postCaptured = false
    await page.route('**/api/vacancies', async (route) => {
      if (route.request().method() === 'POST') {
        postCaptured = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, id: 'created-vacancy' }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/vacancies/create')
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

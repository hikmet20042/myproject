import { test, expect } from '@playwright/test'

async function submitForm(page: any) {
  await page.evaluate(() => {
    const form = document.querySelector('form')
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  })
}

test.describe('Forgot Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/auth\/v1\/user/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    })
    await page.goto('/auth/forgot-password')
  })

  test('displays the forgot-password form with Azerbaijani text', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^Şifrəni unutmusunuz\?$/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows validation for empty email field', async ({ page }) => {
    await page.locator('input[type="email"]').fill('')
    await submitForm(page)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/e-poçt tələb olunur/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows success message after submitting existing email', async ({ page }) => {
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'If an account with that email exists, a password reset link has been sent.' }),
      })
    })
    await page.locator('input[type="email"]').fill('test@example.com')
    await submitForm(page)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/hesab varsa, şifrə sıfırlama keçidi göndərilib/i)).toBeVisible({ timeout: 10000 })
  })

  test('navigates back to sign-in page', async ({ page }) => {
    await page.getByRole('link', { name: /Girişə qayıt/i }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin/)
  })
})

test.describe('Reset Password', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/auth\/v1\/user/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    })
  })

  test('displays invalid link state for expired recovery session', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Etibarsız sıfırlama keçidi/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Yeni şifrə sıfırlama tələb edin/i).first()).toBeVisible()
  })

  test('navigates to forgot-password from invalid reset page', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await page.waitForLoadState('networkidle')
    const link = page.getByRole('link', { name: /yeni şifrə sıfırlama tələb edin/i })
    await expect(link).toBeVisible({ timeout: 15000 })
    await link.click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/forgot-password/)
  })
})

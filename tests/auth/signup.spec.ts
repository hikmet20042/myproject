import { test, expect } from '@playwright/test'

async function submitForm(page: any) {
  await page.evaluate(() => {
    const form = document.querySelector('form')
    if (form) {
      form.noValidate = true
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    }
  })
}

test.describe('Sign Up — validation, short password, duplicate email', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register')
  })

  test('displays the registration form with Azerbaijani headings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^Hesab yarat$/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows required-field validation when submitting empty form', async ({ page }) => {
    // Fill empty to ensure React state is initialized
    await page.locator('input[type="email"]').fill('')
    await page.locator('input[type="password"]').first().fill('')
    await page.locator('input[type="password"]').nth(1).fill('')
    await submitForm(page)
    await expect(page.locator('p:has-text("E-poçt tələb olunur")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('p:has-text("Şifrə tələb olunur")')).toBeVisible({ timeout: 10000 })
  })

  test('shows invalid email format error', async ({ page }) => {
    await page.locator('input[type="email"]').fill('not-an-email')
    await page.locator('input[type="password"]').first().fill('ValidPass1')
    await submitForm(page)
    await expect(page.getByText(/etibarlı e-poçt/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows short password error when password is under 6 characters', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').first().fill('Ab1')
    await submitForm(page)
    await expect(page.getByText(/ən azı 6 simvol/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows password mismatch error when confirm does not match', async ({ page }) => {
    const passwordInputs = page.locator('input[type="password"]')
    await passwordInputs.nth(0).fill('ValidPass1')
    await passwordInputs.nth(1).fill('DifferentPass1')
    await submitForm(page)
    await expect(page.getByText(/şifrələr uyğun gəlmir/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows duplicate email error from the API', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Bu e-poçt ünvanı artıq qeydiyyatdan keçib.' }),
      })
    })
    await page.locator('input[type="email"]').fill('existing@example.com')
    await page.locator('input[type="password"]').first().fill('ValidPass1')
    await submitForm(page)
    await expect(page.getByText(/artıq qeydiyyatdan keçib/i)).toBeVisible({ timeout: 10000 })
  })

  test('navigates to sign-in page via link', async ({ page }) => {
    await page.getByRole('link', { name: 'Daxil ol' }).click()
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('Google OAuth button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Google ilə davam et/i })).toBeVisible()
  })
})

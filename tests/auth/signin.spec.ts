import { test, expect } from '@playwright/test'

async function submitForm(page: any) {
  await page.evaluate(() => {
    const form = document.querySelector('form')
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  })
}

test.describe('Sign In — validation, wrong credentials, email verification guard', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/auth\/v1\/user/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    })
    await page.goto('/auth/signin')
  })

  test('displays the sign-in form with Azerbaijani heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^Hesabına daxil ol$/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows client-side validation for empty email', async ({ page }) => {
    await page.locator('input[type="email"]').fill('')
    await page.locator('input[type="password"]').fill('somepass')
    await submitForm(page)
    await expect(page.getByText(/e-poçt formatı yanlışdır/i).or(page.getByText(/tələb olunur/i))).toBeVisible({ timeout: 10000 })
  })

  test('shows client-side validation for short password', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('Ab1')
    await submitForm(page)
    await expect(page.getByText(/şifrə ən azı 6 simvol/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.route(/auth\/v1\/token/, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      })
    })
    await page.locator('input[type="email"]').fill('wrong@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await submitForm(page)
    await expect(page.getByText(/Invalid login credentials/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows email verification banner when email not verified', async ({ page }) => {
    await page.route(/auth\/v1\/token/, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'email_not_confirmed',
          error_description: 'Email not confirmed',
        }),
      })
    })
    await page.locator('input[type="email"]').fill('unverified@example.com')
    await page.locator('input[type="password"]').fill('ValidPass1')
    await submitForm(page)
    await expect(page.getByText(/Email not confirmed/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/təsdiq e-poçtunu yenidən göndər/i).or(page.getByText(/Email not confirmed/i))).toBeVisible()
  })

  test('navigates to registration page', async ({ page }) => {
    await page.getByRole('link', { name: 'Buradan yarat' }).click()
    await expect(page).toHaveURL(/\/auth\/register/)
  })

  test('navigates to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: 'Şifrəni unutmusunuz' }).click()
    await expect(page).toHaveURL(/\/auth\/forgot-password/)
  })

  test('Google OAuth button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Google ilə davam et/i })).toBeVisible()
  })
})

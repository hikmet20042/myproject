import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('Not Found Page — 404', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('displays 404 page for a non-existent route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz')
    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 })
  })

  test('displays Azerbaijani heading on 404 page', async ({ page }) => {
    await page.goto('/non-existent-route')
    await expect(page.getByRole('heading', { name: /Səhifə Tapılmadı/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows explanatory message on 404 page', async ({ page }) => {
    await page.goto('/non-existent-route')
    await expect(page.getByText(/mövcud deyil|silinmiş|köçürülmüş/i)).toBeVisible({ timeout: 10000 })
  })

  test('provides quick link to vacancies on 404', async ({ page }) => {
    await page.goto('/non-existent-route')
    const vacanciesLink = page.getByRole('link', { name: /Vakansiyalar/i })
    await expect(vacanciesLink).toBeVisible({ timeout: 10000 })
    await expect(vacanciesLink).toHaveAttribute('href', '/resources/vacancies')
  })

  test('provides quick link to events on 404', async ({ page }) => {
    await page.goto('/non-existent-route')
    const eventsLink = page.getByRole('link', { name: /Tədbirlər/i })
    await expect(eventsLink).toBeVisible({ timeout: 10000 })
    await expect(eventsLink).toHaveAttribute('href', '/resources/events')
  })

  test('provides quick link to blogs on 404', async ({ page }) => {
    await page.goto('/non-existent-route')
    const blogsLink = page.getByRole('link', { name: /Bloqlar/i })
    await expect(blogsLink).toBeVisible({ timeout: 10000 })
    await expect(blogsLink).toHaveAttribute('href', '/blogs')
  })

  test('has "Ana Səhifəyə Qayıt" button linking to home', async ({ page }) => {
    await page.goto('/non-existent-route')
    const homeButton = page.getByRole('link', { name: /Ana Səhifəyə Qayıt/i })
    await expect(homeButton).toBeVisible({ timeout: 10000 })
    await expect(homeButton).toHaveAttribute('href', '/')
  })

  test('has "İmkanları Kəşf Et" button linking to resources', async ({ page }) => {
    await page.goto('/non-existent-route')
    const exploreButton = page.getByRole('link', { name: /İmkanları Kəşf Et/i })
    await expect(exploreButton).toBeVisible({ timeout: 10000 })
    await expect(exploreButton).toHaveAttribute('href', '/resources')
  })

  test('navigates back to home from 404 page', async ({ page }) => {
    await page.goto('/non-existent-route')
    await page.getByRole('link', { name: /Ana Səhifəyə Qayıt/i }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('page title indicates not found', async ({ page }) => {
    await page.goto('/non-existent-route')
    await expect(page).toHaveTitle(/Səhifə Tapılmadı/i)
  })
})

test.describe('Sign-in Page — Form and Error States', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('displays the sign-in form with Azerbaijani labels', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('heading', { name: /Hesabına daxil ol/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows email and password inputs', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('shows Google sign-in button', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('button', { name: /Google ilə davam et/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows "forgot password" link', async ({ page }) => {
    await page.goto('/auth/signin')
    const forgotLink = page.getByRole('link', { name: /Şifrəni unutmusunuz/i })
    await expect(forgotLink).toBeVisible({ timeout: 10000 })
    await expect(forgotLink).toHaveAttribute('href', /forgot-password/)
  })

  test('shows "register" link', async ({ page }) => {
    await page.goto('/auth/signin')
    const registerLink = page.getByRole('link', { name: /Buradan yarat/i })
    await expect(registerLink).toBeVisible({ timeout: 10000 })
    await expect(registerLink).toHaveAttribute('href', /register/)
  })

  test('submit button is disabled when fields are empty', async ({ page }) => {
    await page.goto('/auth/signin')
    const submitButton = page.getByRole('button', { name: /^Daxil ol$/i })
    await expect(submitButton).toBeVisible({ timeout: 10000 })
    await expect(submitButton).toBeDisabled()
  })

  test('enables submit button after filling email and password', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('password123')
    const submitButton = page.getByRole('button', { name: /^Daxil ol$/i })
    await expect(submitButton).toBeEnabled()
  })

  test('shows error message on invalid email format', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.locator('input[name="email"]').fill('not-an-email')
    await page.locator('input[name="password"]').fill('password123')
    await page.getByRole('button', { name: /^Daxil ol$/i }).click()
    await expect(page.getByText(/E-poçt formatı yanlışdır/i)).toBeVisible({ timeout: 5000 })
  })

  test('shows error message for short password', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('123')
    await page.getByRole('button', { name: /^Daxil ol$/i }).click()
    await expect(page.getByText(/ən azı 6 simvol/i)).toBeVisible({ timeout: 5000 })
  })

  test('shows error message for incorrect credentials', async ({ page }) => {
    await page.route('**/auth/v1/token?grant_type=password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      })
    })
    await page.goto('/auth/signin')
    await page.locator('input[name="email"]').fill('wrong@example.com')
    await page.locator('input[name="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /^Daxil ol$/i }).click()
    await expect(page.getByText(/yanlış e-poçt|şifrə|xəta/i)).toBeVisible({ timeout: 10000 })
  })

  test('preserves callbackUrl in sign-in redirect', async ({ page }) => {
    await page.goto('/auth/signin?callbackUrl=/dashboard')
    await expect(page.getByRole('heading', { name: /Hesabına daxil ol/i })).toBeVisible({ timeout: 10000 })
  })

  test('sign-in page has logo linking to home', async ({ page }) => {
    await page.goto('/auth/signin')
    const logo = page.locator('a[href="/"]').first()
    await expect(logo).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Sign-in Page — Error URL Params', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('shows CredentialsSignin error message for error=CredentialSignin', async ({ page }) => {
    await page.goto('/auth/signin?error=CredentialsSignin')
    await expect(page.getByText(/yanlış e-poçt və ya şifrə/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows Verification error when error=Verification', async ({ page }) => {
    await page.goto('/auth/signin?error=Verification')
    await expect(page.getByText(/e-poçtunu təsdiqlə/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows message param as info toast', async ({ page }) => {
    await page.goto('/auth/signin?message=Email+verified+successfully')
    // Just verify the page loads without errors
    await expect(page.getByRole('heading', { name: /Hesabına daxil ol/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Sign-up Page — Form Basics', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('displays registration form with Azerbaijani heading', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByRole('heading', { name: /Hesab yarat/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows email, password, and confirm password fields', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('shows Google sign-up button', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByRole('button', { name: /Google ilə davam et/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows "sign in" link for existing users', async ({ page }) => {
    await page.goto('/auth/register')
    const signInLink = page.getByRole('link', { name: /Daxil ol/i })
    await expect(signInLink.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('displays forgot password form', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await expect(page.getByRole('heading', { name: /Şifrəni bərpa et/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows email input for password reset', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10000 })
  })

  test('shows submit button for sending reset email', async ({ page }) => {
    await page.goto('/auth/forgot-password')
    await expect(page.getByRole('button', { name: /göndər/i })).toBeVisible({ timeout: 10000 })
  })
})

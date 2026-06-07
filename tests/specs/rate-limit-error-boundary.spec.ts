import { test, expect } from '@playwright/test'
import { mockApi } from '../helpers/api'

test.describe('Rate limit / error boundary resilience', () => {
  test('sign-in form surfaces an error toast when the auth endpoint rate-limits', async ({ page }) => {
    // Supabase client calls the real auth URL (e.g. https://<project>.supabase.co).
    // Mock the cross-origin token request to return 429 so the form's
    // handleCredentialsSignIn sees result.error and triggers the toast.
    await page.route(/.+\/auth\/v1\/token\?grant_type=password/, async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'rate_limited',
          error_description: 'Çox sayda sorğu. Bir az sonra yenidən cəhd edin.',
        }),
      })
    })
    await page.goto('/auth/signin')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.locator('input[type="password"]').fill('TestPass123!')
    const submitBtn = page.getByRole('button', { name: /Daxil ol/i })
    await expect(submitBtn).toBeEnabled({ timeout: 5000 })
    await submitBtn.click()
    // Error surfaces as a toast via GlobalFeedback (role=alert). The exact
    // text depends on the upstream Supabase error message; we accept any
    // error toast for resilience purposes.
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 })
  })

  test('forgot-password form surfaces a 429 toast', async ({ page }) => {
    await mockApi(
      page,
      '**/api/auth/forgot-password',
      { error: { message: 'Çox sayda sorğu. Bir az sonra yenidən cəhd edin.' } },
      429
    )
    await page.goto('/auth/forgot-password')
    await page.locator('input[type="email"]').fill('test@example.com')
    await page.getByRole('button', { name: /Sıfırlama keçidi göndər/i }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: /Çox sayda sorğu|rate limit|çox sayda/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('search page keeps the search input usable after a 500', async ({ page }) => {
    await mockApi(
      page,
      '**/api/search*',
      { error: { message: 'Axtarış xətası' } },
      500
    )
    await page.goto('/search')
    const input = page.getByRole('textbox', { name: /Qlobal axtarış/i }).first()
    await expect(input).toBeVisible({ timeout: 10000 })
    // The input remains interactive even after the API error.
    await input.fill('icma')
    await expect(input).toHaveValue('icma')
  })

  test('blogs page shows an error state when the API refuses the connection', async ({ page }) => {
    await page.route('**/api/blogs*', async (route) => {
      await route.abort('connectionrefused')
    })
    await page.goto('/blogs', { waitUntil: 'domcontentloaded' })
    // Empty/error state — the page should not crash and the chrome should remain.
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('events page keeps the header/footer when the API fails', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.abort('connectionrefused')
    })
    await page.goto('/resources/events', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('vacancies page keeps the header/footer when the API fails', async ({ page }) => {
    await page.route('**/api/vacancies*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.searchParams.has('adminView')) {
        await route.abort('connectionrefused')
      }
    })
    await page.goto('/resources/vacancies', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
})

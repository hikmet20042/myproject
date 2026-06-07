import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('Organizations — Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('displays organizations listing page', async ({ page }) => {
    await page.goto('/resources/organizations')
    await expect(page.locator('body')).toContainText(/təşkilat|organiz/i, { timeout: 10000 })
  })

  test('shows search input', async ({ page }) => {
    await page.goto('/resources/organizations')
    const searchInput = page.locator('input[type="text"], input[type="search"]')
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state when mocked to return empty', async ({ page }) => {
    await page.route('**/api/organizations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { items: [] }, meta: { total: 0 } }),
      })
    })
    await page.goto('/resources/organizations')
    await expect(page.locator('body')).toContainText(/tapılmadı|yoxdur|boş/i, { timeout: 10000 })
  })

  test('shows organization cards when mocked data present', async ({ page }) => {
    await page.route('**/api/organizations*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              { id: 'org-1', slug: 'test-org', organizationName: 'Test Organization', focusAreas: ['education'], description: 'A test org' },
              { id: 'org-2', slug: 'another-org', organizationName: 'Another Org', focusAreas: ['environment'], description: 'Another org' },
            ],
          },
          meta: { total: 2 },
        }),
      })
    })
    await page.goto('/resources/organizations')
    await expect(page.getByText('Test Organization')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Another Org')).toBeVisible()
  })
})

test.describe('Organizations — Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('shows error state for non-existent organization', async ({ page }) => {
    await page.route('**/api/organizations/resolve/**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } }),
      })
    })
    await page.goto('/o/non-existent-org')
    await expect(page.locator('body')).toContainText(/tapılmadı|not found/i, { timeout: 15000 })
  })

  test('displays organization detail with mocked data', async ({ page }) => {
    await page.route('**/api/organizations/resolve/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'org-123' } }),
      })
    })
    await page.route('**/api/organizations/org-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            organization: {
              id: 'org-123', slug: 'test-org', organizationName: 'Test Org',
              description: 'We are a test organization focused on education.',
              focusAreas: ['education'], status: 'approved', followerCount: 42,
              contactPerson: { name: 'Contact Person', email: 'contact@test.org' },
              createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/o/test-org')
    await expect(page.getByText('Test Org')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Organizations — Redirect Page', () => {
  test('redirects /organizations to /resources/organizations', async ({ page }) => {
    await setupUnauthMock(page)
    await page.goto('/organizations')
    await expect(page).toHaveURL(/\/resources\/organizations/)
  })
})

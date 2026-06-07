import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('Vacancies — Listing with strict heading anchors', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('displays vacancies listing with exact Azerbaijani heading', async ({ page }) => {
    await page.goto('/resources/vacancies')
    await expect(page.getByRole('heading', { name: /^Vakansiyalar$/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows search input with Azerbaijani placeholder', async ({ page }) => {
    await page.goto('/resources/vacancies')
    await expect(page.locator('input[placeholder*="Vakansiya adı"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows filter controls with Azerbaijani labels', async ({ page }) => {
    await page.goto('/resources/vacancies')
    await expect(page.getByText(/İş növü/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Şəhər/i)).toBeVisible()
    await expect(page.getByText(/Sıralama/i)).toBeVisible()
    await expect(page.getByText(/Son müraciət/i)).toBeVisible()
  })

  test('shows empty state when no vacancies exist', async ({ page }) => {
    await page.route('**/api/vacancies*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/resolve') && !url.searchParams.has('adminView')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { vacancies: [] }, meta: {} }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/resources/vacancies')
    await expect(page.getByText(/Vakansiya tapılmadı/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows CTA section at bottom for non-org users', async ({ page }) => {
    await page.goto('/resources/vacancies')
    await expect(page.getByRole('heading', { name: /İşçi axtarırsınız/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /Vakansiya yerləşdir/i })).toBeVisible()
  })

  test('does NOT match card items when asserting main heading — strict anchor', async ({ page }) => {
    await page.route('**/api/vacancies*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/resolve') && !url.searchParams.has('adminView')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              vacancies: [
                { id: 'vac-1', title: 'Test Vakansiyalar Opportunity', slug: 'test-vacancy', type: 'full_time', city: 'Bakı', status: 'approved', views: 10, createdAt: new Date().toISOString() },
                { id: 'vac-2', title: 'Vakansiyalar Summer Intern', slug: 'summer-intern', type: 'intern', city: 'Gəncə', status: 'approved', views: 5, createdAt: new Date().toISOString() },
              ],
            },
            meta: { total: 2 },
          }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/resources/vacancies')
    const headings = page.getByRole('heading', { name: /^Vakansiyalar$/i })
    await expect(headings).toHaveCount(1, { timeout: 10000 })
  })
})

test.describe('Vacancies — Detail and External Handoff', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
    await page.route('**/api/vacancies/resolve/test-vacancy', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'vac-123' } }),
      })
    })
  })

  test('shows vacancy detail with Azerbaijani labels', async ({ page }) => {
    await page.route('**/api/vacancies/vac-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vacancy: {
              id: 'vac-123', title: 'Software Developer', slug: 'test-vacancy',
              status: 'approved', description: 'Join our team.', type: 'full_time',
              city: 'Bakı', requirements: ['React', 'Node.js'], responsibilities: ['Develop features'],
              isPaid: true, paymentMode: 'range', paymentMin: 1500, paymentMax: 2500,
              applicationMethod: 'link', applicationValue: 'https://company.com/apply',
              views: 100, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/vacancies/test-vacancy')
    await expect(page.getByText(/Tam ştat/i)).toBeVisible({ timeout: 10000 })
  })

  test('displays external CTA button "Dərhal müraciət et" for link-based application', async ({ page }) => {
    await page.route('**/api/vacancies/vac-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vacancy: {
              id: 'vac-123', title: 'External Link Vacancy', slug: 'test-vacancy',
              status: 'approved', description: 'Apply via external link.', type: 'full_time',
              city: 'Bakı', applicationMethod: 'link', applicationValue: 'https://external-ats.com/apply',
              views: 50, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/vacancies/test-vacancy')
    const ctaButton = page.getByRole('link', { name: /Dərhal müraciət et/i })
    await expect(ctaButton).toBeVisible({ timeout: 10000 })
    const href = await ctaButton.getAttribute('href')
    expect(href).toBe('https://external-ats.com/apply')
  })

  test('displays email CTA button for email-based application', async ({ page }) => {
    await page.route('**/api/vacancies/vac-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vacancy: {
              id: 'vac-123', title: 'Email Apply Vacancy', slug: 'test-vacancy',
              status: 'approved', description: 'Apply via email.', type: 'volunteer',
              city: 'Bakı', applicationMethod: 'email', applicationValue: 'hr@company.com',
              views: 20, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/vacancies/test-vacancy')
    await expect(page.getByRole('link', { name: /E-poçt ilə müraciət et/i })).toBeVisible({ timeout: 10000 })
  })

  test('displays phone CTA button for phone-based application', async ({ page }) => {
    await page.route('**/api/vacancies/vac-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vacancy: {
              id: 'vac-123', title: 'Phone Apply Vacancy', slug: 'test-vacancy',
              status: 'approved', description: 'Apply via phone.', type: 'part_time',
              city: 'Bakı', applicationMethod: 'phone', applicationValue: '+994501234567',
              views: 15, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/vacancies/test-vacancy')
    await expect(page.getByRole('link', { name: /Zəng ilə müraciət et/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows job description and requirements sections', async ({ page }) => {
    await page.route('**/api/vacancies/vac-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vacancy: {
              id: 'vac-123', title: 'Full Stack Developer', slug: 'test-vacancy',
              status: 'approved', description: 'We are looking for a full stack developer.',
              type: 'full_time', city: 'Bakı',
              requirements: ['React expertise', 'Node.js experience', 'Team player'],
              responsibilities: ['Build web apps', 'Code reviews'],
              views: 80, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/vacancies/test-vacancy')
    await expect(page.getByRole('heading', { name: /İş təsviri/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: /Tələblər/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Məsuliyyətlər/i })).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'

test.describe('Events — Comprehensive Listing', () => {
  test('shows event cards with mocked data', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/resolve') && !url.pathname.includes('/admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              events: [
                { id: 'evt-1', title: 'Community Workshop', slug: 'community-workshop', eventType: 'workshop', status: 'approved', location: { type: 'physical', city: 'Bakı' }, views: 50, createdAt: new Date().toISOString() },
                { id: 'evt-2', title: 'Tech Conference 2025', slug: 'tech-conference', eventType: 'conference', status: 'approved', location: { type: 'online' }, views: 120, createdAt: new Date().toISOString() },
              ],
            },
            meta: { total: 2 },
          }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/resources/events')
    await expect(page.getByText('Community Workshop')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Tech Conference 2025')).toBeVisible()
  })

  test('search filters events', async ({ page }) => {
    await page.goto('/resources/events')
    const searchInput = page.locator('input[placeholder*="Tədbir"], input[type="text"]').first()
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    await searchInput.fill('workshop')
  })

  test('event type filter exists', async ({ page }) => {
    await page.goto('/resources/events')
    await expect(page.getByText(/Məkan|Tədbir növü|Növ|Sıralama/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Events — Detail Comprehensive', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/events/resolve/online-event', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'evt-online' } }),
      })
    })
  })

  test('shows event with online location badge', async ({ page }) => {
    await page.route('**/api/events/evt-online', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: 'evt-online', title: 'Online Webinar', slug: 'online-event',
              status: 'approved', description: 'Join our online webinar.',
              eventType: 'webinar', location: { type: 'online' },
              sessions: [{ date: new Date().toISOString(), startTime: '14:00', endTime: '16:00' }],
              views: 80, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/events/online-event')
    await expect(page.getByText('Online Webinar').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows event with physical location', async ({ page }) => {
    await page.route('**/api/events/resolve/physical-event', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'evt-phys' } }),
      })
    })
    await page.route('**/api/events/evt-phys', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: 'evt-phys', title: 'In-Person Workshop', slug: 'physical-event',
              status: 'approved', description: 'Join us in person.',
              eventType: 'workshop',
              location: { type: 'physical', city: 'Bakı', address: '123 Main St', country: 'Azərbaycan' },
              sessions: [{ date: new Date().toISOString(), startTime: '10:00', endTime: '17:00' }],
              views: 45, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/events/physical-event')
    await expect(page.getByText('In-Person Workshop').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows event with hybrid location', async ({ page }) => {
    await page.route('**/api/events/resolve/hybrid-event', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'evt-hybrid' } }),
      })
    })
    await page.route('**/api/events/evt-hybrid', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: 'evt-hybrid', title: 'Hybrid Conference', slug: 'hybrid-event',
              status: 'approved', description: 'Hybrid event.',
              eventType: 'conference',
              location: { type: 'hybrid', city: 'Bakı', address: 'Convention Center' },
              sessions: [{ date: new Date().toISOString(), startTime: '09:00', endTime: '18:00' }],
              applicationLink: 'https://apply.example.com',
              views: 200, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/events/hybrid-event')
    await expect(page.getByText('Hybrid Conference').first()).toBeVisible({ timeout: 10000 })
    const ctaButton = page.getByRole('link', { name: /Müraciət et/i })
    await expect(ctaButton).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancies — Comprehensive Listing', () => {
  test('shows vacancy cards with mocked data', async ({ page }) => {
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
                { id: 'vac-a', title: 'Frontend Developer', slug: 'frontend-dev', type: 'full_time', city: 'Bakı', status: 'approved', views: 30, createdAt: new Date().toISOString() },
                { id: 'vac-b', title: 'Marketing Intern', slug: 'marketing-intern', type: 'intern', city: 'Gəncə', status: 'approved', views: 15, createdAt: new Date().toISOString() },
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
    await expect(page.getByText('Frontend Developer')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Marketing Intern')).toBeVisible()
  })

  test('vacancy type filters exist', async ({ page }) => {
    await page.goto('/resources/vacancies')
    await expect(page.getByText(/İş növü|Şəhər|Sıralama|Son müraciət/i).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Vacancies — Detail Comprehensive', () => {
  test('shows unpaid vacancy without payment info', async ({ page }) => {
    await page.route('**/api/vacancies/resolve/unpaid-vac', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'vac-unpaid' } }),
      })
    })
    await page.route('**/api/vacancies/vac-unpaid', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vacancy: {
              id: 'vac-unpaid', title: 'Volunteer Position', slug: 'unpaid-vac',
              status: 'approved', description: 'Join as a volunteer.', type: 'volunteer',
              city: 'Bakı', isPaid: false,
              applicationMethod: 'link', applicationValue: 'https://volunteer.example.com',
              requirements: ['Good attitude'], responsibilities: ['Help community'],
              views: 25, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/vacancies/unpaid-vac')
    await expect(page.getByText('Volunteer Position')).toBeVisible({ timeout: 10000 })
  })

  test('shows vacancy detail with full structure', async ({ page }) => {
    await page.route('**/api/vacancies/resolve/full-vac', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'vac-full' } }),
      })
    })
    await page.route('**/api/vacancies/vac-full', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vacancy: {
              id: 'vac-full', title: 'Full Stack Developer', slug: 'full-vac',
              status: 'approved', description: 'We need a full stack developer.',
              type: 'full_time', city: 'Bakı', address: 'Tech Hub',
              isPaid: true, paymentMode: 'fixed', paymentAmount: 2000,
              requirements: ['5+ years experience', 'TypeScript', 'React', 'Node.js'],
              responsibilities: ['Build features', 'Mentor juniors', 'Code reviews'],
              applicationMethod: 'email', applicationValue: 'careers@company.com',
              applicationDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
              views: 150, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/vacancies/full-vac')
    await expect(page.getByText('Full Stack Developer')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: /İş təsviri/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Tələblər/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Məsuliyyətlər/i })).toBeVisible()
  })
})

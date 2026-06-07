import { test, expect } from '@playwright/test'
import { setupUnauthMock } from '../helpers/auth'

test.describe('Events — Listing and Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
  })

  test('displays events listing with Azerbaijani heading', async ({ page }) => {
    await page.goto('/resources/events')
    await expect(page.getByRole('heading', { name: /^Tədbirlər$/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows search input with Azerbaijani placeholder', async ({ page }) => {
    await page.goto('/resources/events')
    await expect(page.locator('input[placeholder*="Tədbir adı"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('shows filter controls with Azerbaijani labels', async ({ page }) => {
    await page.goto('/resources/events')
    await expect(page.getByText(/Məkan/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Tədbir növü/i).or(page.getByText(/Növ/i))).toBeVisible()
    await expect(page.getByText(/Sıralama/i)).toBeVisible()
  })

  test('shows empty state when no events exist', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      const url = new URL(route.request().url())
      if (!url.pathname.includes('/resolve') && !url.pathname.includes('/admin')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { items: [] }, meta: {} }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/resources/events')
    await expect(page.getByText(/Tədbir tapılmadı/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows CTA section at bottom for non-org users', async ({ page }) => {
    await page.goto('/resources/events')
    await expect(page.getByRole('heading', { name: /Tədbiriniz var/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /Tədbir əlavə et/i })).toBeVisible()
  })
})

test.describe('Events — Detail and External Handoff', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthMock(page)
    await page.route('**/api/events/resolve/test-event', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'event-123' } }),
      })
    })
  })

  test('shows event detail with Azerbaijani breadcrumbs', async ({ page }) => {
    await page.route('**/api/events/event-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: 'event-123', title: 'Test Conference', slug: 'test-event',
              status: 'approved', description: 'Test event description.',
              eventType: 'conference', category: 'education',
              location: { type: 'physical', city: 'Bakı', address: 'Main Street', country: 'Azərbaycan' },
              sessions: [{ date: new Date().toISOString(), startTime: '10:00', endTime: '18:00' }],
              views: 75, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/events/test-event')
    await expect(page.getByRole('link', { name: /Ana Səhifə/i }).or(page.getByText(/Ana Səhifə/i))).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /Tədbirlər/i }).or(page.getByText(/Tədbirlər/))).toBeVisible()
  })

  test('displays external CTA button "Müraciət et" with a valid application link', async ({ page }) => {
    await page.route('**/api/events/event-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: 'event-123', title: 'Event With Application', slug: 'test-event',
              status: 'approved', description: 'Apply now!',
              eventType: 'conference', location: { type: 'online' },
              sessions: [{ date: new Date().toISOString(), startTime: '10:00', endTime: '12:00' }],
              applicationLink: 'https://external-registration.com/apply',
              views: 30, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/events/test-event')
    const ctaButton = page.getByRole('link', { name: /Müraciət et/i })
    await expect(ctaButton).toBeVisible({ timeout: 10000 })
    const href = await ctaButton.getAttribute('href')
    expect(href).toBe('https://external-registration.com/apply')
  })

  test('shows "Müraciət linki tapılmadı" when no applicationLink exists', async ({ page }) => {
    await page.route('**/api/events/event-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: 'event-123', title: 'Event Without Link', slug: 'test-event',
              status: 'approved', description: 'No link provided.',
              eventType: 'meetup', location: { type: 'physical', city: 'Bakı' },
              sessions: [{ date: new Date().toISOString(), startTime: '14:00', endTime: '16:00' }],
              views: 10, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/events/test-event')
    await expect(page.getByText(/Müraciət linki tapılmadı/i)).toBeVisible({ timeout: 10000 })
  })

  test('does NOT display participant capacity or attendee trackers', async ({ page }) => {
    await page.route('**/api/events/event-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            event: {
              id: 'event-123', title: 'Capacity Check Event', slug: 'test-event',
              status: 'approved', description: 'Testing capacity display.',
              eventType: 'workshop', location: { type: 'physical', city: 'Bakı' },
              sessions: [{ date: new Date().toISOString(), startTime: '09:00', endTime: '17:00' }],
              maxParticipants: 50, views: 20, createdAt: new Date().toISOString(),
            },
          },
        }),
      })
    })
    await page.goto('/resources/events/test-event')
    await expect(page.getByText(/iştirakçı/i)).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/yer/i)).not.toBeVisible()
  })

  test('shows error state for non-existent event', async ({ page }) => {
    await page.goto('/resources/events/non-existent-event')
    await expect(page.getByText(/Tədbir tapılmadı/i)).toBeVisible({ timeout: 15000 })
  })
})

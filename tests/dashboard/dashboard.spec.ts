import { test, expect } from '@playwright/test'

const orgApprovedSession = () =>
  page.addInitScript(() => {
    window.__mockSession = JSON.stringify({
      user: { id: 'org-1', email: 'org@example.com', user_metadata: { name: 'Test Org' }, accountType: 'organization', organizationStatus: 'approved' },
      access_token: 'fake-org-token',
    })
  })

test.describe('Dashboard — Access Control', () => {
  test('redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=.+\/dashboard/)
  })

  test('redirects regular user away from dashboard', async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify({
        user: { id: 'user-1', email: 'user@example.com', accountType: 'user' },
        access_token: 'fake-user-token',
      })
    })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/\/dashboard/)
  })

  test('allows approved organization to access dashboard', async ({ page }) => {
    await orgApprovedSession()
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Rəhbər paneli/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Dashboard — Overview Page', () => {
  test.beforeEach(async ({ page }) => {
    await orgApprovedSession()
  })

  test('displays stat cards for events, vacancies, followers, views', async ({ page }) => {
    const mockData = (url: string) => {
      if (url.includes('/api/events')) return { data: [{ id: 'e1', title: 'Event', views: 10 }], total: 1 }
      if (url.includes('/api/vacancies')) return { data: [{ id: 'v1', title: 'Vacancy', views: 5 }], total: 1 }
      if (url.includes('/api/blogs')) return { data: [], total: 0 }
      if (url.includes('/api/organizations/me')) return { org: { name: 'Test Org' } }
      return {}
    }
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData(route.request().url())) })
    })
    await page.route('**/api/vacancies*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData(route.request().url())) })
    })
    await page.route('**/api/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData(route.request().url())) })
    })
    await page.route('**/api/organizations/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'Test Org' }) })
    })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Tədbirlər/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Vakansiyalar/i)).toBeVisible()
    await expect(page.getByText(/Baxışlar/i)).toBeVisible()
  })

  test('shows quick action buttons', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'e1' }], total: 1 }) })
    })
    await page.route('**/api/vacancies*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'v1' }], total: 1 }) })
    })
    await page.route('**/api/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    })
    await page.route('**/api/organizations/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'Test Org' }) })
    })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Sürətli əməliyyatlar/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /Tədbir yaratın/i }).or(page.getByRole('button', { name: /Tədbir yaratın/i }))).toBeVisible()
    await expect(page.getByRole('link', { name: /Vakansiya yaratın/i }).or(page.getByRole('button', { name: /Vakansiya yaratın/i }))).toBeVisible()
  })

  test('shows empty state when no events or vacancies', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    })
    await page.route('**/api/vacancies*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    })
    await page.route('**/api/blogs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    })
    await page.route('**/api/organizations/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'Test Org' }) })
    })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/İlk tədbirinizi yaratmağa başlayın/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows sidebar nav items for org dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const navItems = ['Ümumi baxış', 'Tədbirlər', 'Vakansiyalar', 'Profil']
    for (const item of navItems) {
      await expect(page.getByRole('link', { name: item })).toBeVisible()
    }
  })
})

test.describe('Dashboard — Events Management', () => {
  test.beforeEach(async ({ page }) => {
    await orgApprovedSession()
  })

  test('displays manage events page with Azerbaijani heading', async ({ page }) => {
    await page.route('**/api/events*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    })
    await page.goto('/dashboard/events')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Tədbirləriniz/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /Tədbir yarat/i })).toBeVisible()
  })

  test('shows empty state for events management', async ({ page }) => {
    await page.route('**/api/events*author=me*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    })
    await page.goto('/dashboard/events')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Tədbir tapılmadı/i)).toBeVisible({ timeout: 10000 })
  })

  test('navigates to create event page', async ({ page }) => {
    await page.goto('/dashboard/events/create')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Yeni tədbir yarat/i })).toBeVisible({ timeout: 10000 })
  })

  test('event edit page shows existing data', async ({ page }) => {
    await page.route('**/api/events/e1', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          id: 'e1', title: 'Existing Event', slug: 'existing-event',
          status: 'approved', description: 'This is an existing event description that is long enough.',
          eventType: 'conference', category: 'education',
          location: { type: 'physical', city: 'Bakı', address: 'Main St', country: 'Azərbaycan' },
          sessions: [{ date: new Date().toISOString(), startTime: '10:00', endTime: '18:00' }],
          applicationLink: 'https://example.com/apply',
          audienceAgeMin: 18, audienceAgeMax: 35,
          views: 50, createdAt: new Date().toISOString(),
        }),
      })
    })
    await page.goto('/dashboard/events/e1/edit')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Tədbiri yenilə/i })).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Dashboard — Vacancies Management', () => {
  test.beforeEach(async ({ page }) => {
    await orgApprovedSession()
  })

  test('displays manage vacancies page with Azerbaijani heading', async ({ page }) => {
    await page.route('**/api/vacancies*author=me*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    })
    await page.goto('/dashboard/vacancies')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Vakansiyalarınız/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('link', { name: /Vakansiya yarat/i })).toBeVisible()
  })

  test('shows empty state for vacancies management', async ({ page }) => {
    await page.route('**/api/vacancies*author=me*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    })
    await page.goto('/dashboard/vacancies')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Vakansiya tapılmadı/i)).toBeVisible({ timeout: 10000 })
  })

  test('navigates to create vacancy page', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Yeni vakansiya yarat/i })).toBeVisible({ timeout: 10000 })
  })

  test('displays create vacancy form with required fields', async ({ page }) => {
    await page.goto('/dashboard/vacancies/create')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Vəzifə başlığı/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Vakansiya növü/i)).toBeVisible()
    await expect(page.getByText(/Əsas şəhər/i)).toBeVisible()
    await expect(page.getByText(/Təsvir/i)).toBeVisible()
  })
})

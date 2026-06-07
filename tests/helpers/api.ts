import { type Page, type Route } from '@playwright/test'

// ---------------------------------------------------------------------------
// Generic route mocking
// ---------------------------------------------------------------------------

export type RoutePattern = string | RegExp

export interface MockResponse {
  status?: number
  body: unknown
}

/**
 * Intercept a network request and return a canned response.
 * Use this to mock any API the app calls from the browser.
 */
export async function mockApiRoute(
  page: Page,
  pattern: RoutePattern,
  responder: (route: Route) => MockResponse | Promise<MockResponse>
) {
  await page.route(pattern, async (route) => {
    const { status = 200, body } = await responder(route)
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  })
}

/**
 * Mock an endpoint that always returns the same payload.
 */
export async function mockApi(
  page: Page,
  pattern: RoutePattern,
  payload: unknown,
  status = 200
) {
  await mockApiRoute(page, pattern, () => ({ status, body: payload }))
}

/**
 * Mock an endpoint to return a 500 error.
 */
export async function mockApiError(
  page: Page,
  pattern: RoutePattern,
  message = 'Internal Server Error'
) {
  await mockApi(page, pattern, { success: false, error: { message } }, 500)
}

// ---------------------------------------------------------------------------
// Success envelope helper — matches lib/apiResponse
// ---------------------------------------------------------------------------

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true as const, data, ...(meta ? { meta } : {}) }
}

export function list<T>(items: T[], total?: number) {
  return ok({ items, ...(total !== undefined ? { meta: { total } } : {}) })
}

export function legacyList<T>(key: 'events' | 'vacancies' | 'blogs', items: T[]) {
  return ok({ [key]: items }, { total: items.length })
}

// ---------------------------------------------------------------------------
// Domain-specific mocks
// ---------------------------------------------------------------------------

export async function mockBlogsList(
  page: Page,
  pattern: string = '**/api/blogs*',
  items: unknown[] = []
) {
  await mockApi(page, pattern, list(items, items.length))
}

export async function mockEventsList(
  page: Page,
  pattern: string = '**/api/events*',
  items: unknown[] = []
) {
  await mockApi(page, pattern, list(items, items.length))
}

export async function mockVacanciesList(
  page: Page,
  pattern: string = '**/api/vacancies*',
  items: unknown[] = []
) {
  await mockApi(page, pattern, list(items, items.length))
}

export async function mockOrganizationsList(
  page: Page,
  pattern: string = '**/api/organizations*',
  items: unknown[] = []
) {
  await mockApi(page, pattern, list(items, items.length))
}

export async function mockProfileStats(page: Page, stats: Record<string, unknown> = {}) {
  await mockApi(page, '**/api/users/profile/stats', ok(stats))
}

export async function mockUserProfile(page: Page, profile: Record<string, unknown> = {}) {
  await mockApi(page, '**/api/users/profile', ok(profile))
}

// ---------------------------------------------------------------------------
// Admin list mocks
// Each resource has a DIFFERENT response shape (see lib/admin-config.ts):
//   - blogs:     { data: { items, page, total, limit } }   GET /api/admin/blogs*
//   - events:    { events, pagination: { page, pages }, stats: { total } }   GET /api/admin/events*
//   - vacancies: { vacancies, page, totalPages, total, limit }   GET /api/vacancies?adminView=true
// ---------------------------------------------------------------------------

export async function mockAdminBlogsList(
  page: Page,
  items: object[] = [],
  opts: { filters?: { tags?: string[]; authors?: Array<{ id: string; name: string }> } } = {}
) {
  const filters = opts.filters ?? { tags: [], authors: [] }
  await mockApi(page, '**/api/admin/blogs**', {
    success: true,
    data: {
      items,
      page: 1,
      total: items.length,
      limit: 50,
      filters,
    },
  })
}

export async function mockAdminEventsList(
  page: Page,
  items: object[] = []
) {
  await mockApi(page, '**/api/admin/events**', {
    success: true,
    events: items,
    pagination: { page: 1, pages: 1 },
    stats: { total: items.length },
  })
}

export async function mockAdminVacanciesList(
  page: Page,
  items: object[] = []
) {
  // Vacancies admin list actually hits /api/vacancies?adminView=true (see admin-config.ts)
  const payload = {
    success: true,
    vacancies: items,
    page: 1,
    totalPages: 1,
    total: items.length,
    limit: 50,
  }
  await mockApi(page, '**/api/vacancies*adminView=true**', payload)
  // Also catch the path used in some tests
  await mockApi(page, '**/api/admin/vacancies**', payload)
}

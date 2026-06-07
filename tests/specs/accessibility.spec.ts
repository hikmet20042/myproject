import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockBlogsList, mockEventsList, mockVacanciesList, mockApi } from '../helpers/api'

// Routes that the a11y spec exercises. Each route gets a minimal data
// mock so the page renders its real structure (not just a loading state).
const PUBLIC_ROUTES = [
  { path: '/', name: 'home', mocks: () => Promise.resolve() },
  {
    path: '/blogs',
    name: 'blogs',
    mocks: (page: import('@playwright/test').Page) => mockBlogsList(page),
  },
  {
    path: '/resources/events',
    name: 'events',
    mocks: (page: import('@playwright/test').Page) => mockEventsList(page),
  },
  {
    path: '/resources/vacancies',
    name: 'vacancies',
    mocks: (page: import('@playwright/test').Page) => mockVacanciesList(page),
  },
  { path: '/about', name: 'about', mocks: () => Promise.resolve() },
  {
    path: '/search',
    name: 'search',
    mocks: (page: import('@playwright/test').Page) =>
      mockApi(page, '**/api/search*', {
        success: true,
        data: { items: [], pagination: { page: 1, pages: 1, total: 0 }, totalsByType: {} },
      }),
  },
] as const

for (const route of PUBLIC_ROUTES) {
  test(`a11y — ${route.name} reports critical/serious structural violations`, async ({ page }) => {
    await route.mocks(page)
    // SSE notifications stream keeps the page from reaching `load`;
    // use domcontentloaded so the page is parsed and stable.
    await page.goto(route.path, { waitUntil: 'domcontentloaded' })
    // Give React time to render the post-loading structure.
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      // color-contrast is excluded: it surfaces dozens of borderline
      // issues driven by decorative backgrounds and is a design
      // concern (handled in design QA, not a blocking a11y gate).
      .disableRules(['color-contrast'])
      .analyze()

    // Log all violations for tracking. The hard gate is critical-impact
    // issues only; serious/moderate are tracked but not blocking while
    // the team works through them.
    if (results.violations.length > 0) {
      const summary = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        help: v.help,
      }))
      console.log(`a11y ${route.path}: ${results.violations.length} violation group(s)`, summary)
    }

    const blocking = results.violations.filter((v) => v.impact === 'critical')
    expect(
      blocking,
      `critical a11y violations on ${route.path}:\n${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([])
  })
}

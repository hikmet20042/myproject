import { type Page, expect } from '@playwright/test'

export const ROUTES = {
  home: '/',
  signIn: '/auth/signin',
  register: '/auth/register',
  blogs: '/blogs',
  events: '/resources/events',
  vacancies: '/resources/vacancies',
  search: '/search',
  dashboard: '/dashboard',
  profile: '/profile',
  admin: '/admin',
} as const

export async function expectPageTitle(page: Page, pattern: RegExp) {
  await expect(page).toHaveTitle(pattern)
}

export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

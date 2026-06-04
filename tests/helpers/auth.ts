import { type Page } from '@playwright/test'

export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPass123!',
  name: 'Test User',
}

export async function signInAsTestUser(page: Page) {
  await page.goto('/auth/signin')
  await page.locator('input[type="email"]').fill(TEST_USER.email)
  await page.locator('input[type="password"]').fill(TEST_USER.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForLoadState('networkidle')
}

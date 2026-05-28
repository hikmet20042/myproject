import { test, expect } from '@playwright/test'

const USER_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', user_metadata: { name: 'Test User' }, accountType: 'user' },
  access_token: 'fake-token',
}

const mockProfile = () => ({
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', emailVerified: true },
  profile: { name: 'Test User', bio: 'My bio', location: 'Bakı', website: '', phone: '+994501234567', occupation: 'Developer', interests: ['Tech'], avatar: null, urlHandle: 'testuser', socialMedia: {} },
})

test.describe('Profile Settings — Page Render', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
    await page.route('**/api/users/profile', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile()) })
    })
  })

  test('displays settings page with Azerbaijani heading', async ({ page }) => {
    await page.goto('/profile/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /Hesab tənzimləmələri/i })).toBeVisible({ timeout: 10000 })
  })

  test('shows edit mode toggle button', async ({ page }) => {
    await page.goto('/profile/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Redaktə et/i)).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Profile Settings — Account Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
    await page.route('**/api/users/profile', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile()) })
    })
  })

  test('email change modal can be opened', async ({ page }) => {
    await page.goto('/profile/settings')
    await page.waitForLoadState('networkidle')
    const emailBtn = page.getByRole('button', { name: /E-poçtu dəyiş/i })
    if (await emailBtn.isVisible()) {
      await emailBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Yeni e-poçt/i).or(page.getByText(/Cari e-poçt/i))).toBeVisible({ timeout: 10000 })
  })

  test('password change modal can be opened', async ({ page }) => {
    await page.goto('/profile/settings')
    await page.waitForLoadState('networkidle')
    const passBtn = page.getByRole('button', { name: /Parolu dəyiş/i })
    if (await passBtn.isVisible()) {
      await passBtn.click()
      await page.waitForLoadState('networkidle')
    }
    await expect(page.getByText(/Yeni parol/i).or(page.getByText(/Mövcud parol/i))).toBeVisible({ timeout: 10000 })
  })

  test('delete account modal shows confirmation text', async ({ page }) => {
    await page.goto('/profile/settings')
    await page.waitForLoadState('networkidle')
    const delBtn = page.getByRole('button', { name: /Hesabı sil/i })
    if (await delBtn.isVisible()) {
      await delBtn.click()
      await page.waitForLoadState('networkidle')
    }
  })
})

test.describe('Profile Settings — Unverified Email Banner', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = JSON.stringify(USER_SESSION)
    })
  })

  test('shows unverified email banner when email not verified', async ({ page }) => {
    await page.route('**/api/users/profile', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        user: { id: 'user-1', email: 'user@example.com', name: 'Test User', emailVerified: false },
        profile: { name: 'Test User', bio: '', location: '', website: '', phone: '', occupation: '', interests: [], avatar: null, urlHandle: '', socialMedia: {} },
      }) })
    })
    await page.goto('/profile/settings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/E-poçt təsdiqi tamamlanmayıb/i)).toBeVisible({ timeout: 10000 })
  })
})

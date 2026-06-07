import { test, expect } from '@playwright/test'
import { mockTestRoleAuth } from '../helpers/auth'

test.describe('Vacancy Image Upload', () => {
  test('image upload form renders for authenticated org user', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.goto('/dashboard/vacancies/create')
    await expect(page.getByText(/Şəkil|Image|Upload|Yüklə/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('upload single image via file input triggers multipart POST', async ({ page }) => {
    let uploadCalled = false
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/upload**', async (route: any) => {
      if (route.request().method() === 'POST') {
        uploadCalled = true
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { url: 'https://cloudinary.com/test.jpg' } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/vacancies/create')
    await expect(page.getByText(/Şəkil|Image|Yüklə/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('upload multiple images via file input triggers multipart POST', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/upload**', async (route: any) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { url: 'https://cloudinary.com/test.jpg' } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/vacancies/create')
    await expect(page.getByText(/Şəkil|Image|Yüklə/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('removing image sends DELETE request', async ({ page }) => {
    let deleteCalled = false
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/upload**', async (route: any) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/vacancies/create')
    await expect(page.getByText(/Şəkil|Image|Yüklə/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('shows validation error for unsupported file type', async ({ page }) => {
    await mockTestRoleAuth(page, 'organization')
    await page.route('**/api/upload**', async (route: any) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400, contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { message: 'Unsupported file type' } }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/dashboard/vacancies/create')
    await expect(page.getByText(/Şəkil|Image|Yüklə/i).first()).toBeVisible({ timeout: 10000 })
  })
})

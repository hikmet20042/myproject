import { test, expect } from '@playwright/test'
import { mockApi } from '../helpers/api'

test.describe('SEO Meta Tags', () => {
  test('home page has a non-empty <title>', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(5)
  })

  test('home page has a meta description', async ({ page }) => {
    await page.goto('/')
    const desc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(desc).toBeTruthy()
    expect(desc!.length).toBeGreaterThan(20)
  })

  test('home page has Open Graph title', async ({ page }) => {
    await page.goto('/')
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()
  })

  test('home page has canonical link', async ({ page }) => {
    await page.goto('/')
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toBeTruthy()
  })

  test('blog detail page has article meta tags', async ({ page }) => {
    await mockApi(page, '**/api/blogs/resolve/**', { success: true, data: { id: 'seo-blog' } })
    await mockApi(page, '**/api/blogs/seo-blog', {
      success: true,
      data: {
        blog: {
          id: 'seo-blog',
          slug: 'seo-blog',
          title: 'SEO Test Blog',
          contentHtml: '<p>SEO content</p>',
          authorName: 'SEO Author',
          status: 'approved',
          createdAt: new Date().toISOString(),
        },
      },
    })
    await page.goto('/blogs/seo-blog')
    const title = await page.title()
    // Title may be "SEO Test Blog" or "SEO Test Blog | icma360" etc.
    expect(title.length).toBeGreaterThan(5)
    const desc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(desc).toBeTruthy()
  })

  test('events listing has meta description', async ({ page }) => {
    await page.goto('/resources/events')
    const desc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(desc).toBeTruthy()
  })
})

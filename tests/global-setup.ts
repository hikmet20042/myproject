import { chromium, FullConfig } from '@playwright/test'

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3000'
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  try {
    const resp = await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    if (!resp || !resp.ok()) {
      throw new Error(`Server not ready at ${baseURL}: status ${resp?.status() ?? 'n/a'}`)
    }
  } finally {
    await ctx.close()
    await browser.close()
  }
}

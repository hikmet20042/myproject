import { defineConfig, devices } from '@playwright/test'

const CI = !!process.env.CI
const SMOKE = !!process.env.SMOKE

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/e2e/**', '**/node_modules/**'],
  fullyParallel: !CI && !SMOKE,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: SMOKE ? 1 : CI ? 1 : 2,
  maxFailures: SMOKE ? 3 : CI ? 50 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  globalSetup: require.resolve('./tests/global-setup'),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: CI
      ? 'npm run build && npm run start -- -p 3000'
      : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !CI,
    timeout: CI ? 240_000 : 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ENABLE_TEST_AUTH_MODE: '1',
    },
  },
})

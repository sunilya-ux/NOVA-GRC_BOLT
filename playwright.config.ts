import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'json',
  // Only match typical playwright spec filenames
  testMatch: /.*\.(spec|test)\.(ts|js)x?$/,
  // Ignore other folders that contain old or non-playwright tests
  testIgnore: [
    '**/spec-kit/**',
    '**/test-results/**',
    '**/playwright-report/**',
    '**/node_modules/**',
    '**/src/**', // if you keep non-playwright .spec files in src
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
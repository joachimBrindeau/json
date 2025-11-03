import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../tests',
  globalSetup: '../tests/utils/global-setup.ts',
  globalTeardown: '../tests/utils/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 5,
  reporter: [
    ['html'],
    ['junit', { outputFile: './test-results/results.xml' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3456',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  timeout: 60000,
  expect: {
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  outputDir: './test-results/',
  testIgnore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
});

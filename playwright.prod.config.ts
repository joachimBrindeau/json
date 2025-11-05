import { defineConfig, devices } from '@playwright/test';

// Production-safe Playwright config:
// - Does NOT start a local web server
// - Does NOT run globalSetup that creates test users or touches databases
// - Targets only read-only, safe tests against a provided baseURL
//
// Usage:
//   PLAYWRIGHT_BASE_URL=https://json-viewer.io npx playwright test -c playwright.prod.config.ts
//
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://json-viewer.io';

export default defineConfig({
  testDir: './tests',
  testMatch: [
    'tests/e2e/basic/compare-sync-scroll.spec.ts',
    'tests/e2e/basic/library-page.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  maxFailures: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  // No webServer and no globalSetup here to keep production read-only and safe
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: { threshold: 0.2 },
  },
  outputDir: './test-results/',
});


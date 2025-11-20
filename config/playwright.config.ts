import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
// Use a single source of truth for test server URL
// Prefer 127.0.0.1 to avoid IPv6 (::1) DNS resolution issues on some systems
const SERVER_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3456';
const baseURL = SERVER_URL;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // Only run E2E-style tests; skip unit tests (*.test.ts) which are handled by Vitest
  testMatch: '**/*.spec.@(ts|tsx|js)',
  /* Run tests sequentially to ensure strict fail-fast behavior */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: true,
  /* Retry on CI only */
  retries: 0,
  /* Fail fast after first failure to surface breakages early */
  maxFailures: 1,
  /* Strict timeout to prevent hanging - fail fast */
  globalTimeout: 300_000, // 5 minutes max for entire test run
  /* Opt out of parallel tests on CI. Run sequentially to fail fast */
  workers: 1, // Always run sequentially to ensure fast failure detection
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    isCI ? ['github'] : ['list'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Ensure download reliability across browsers */
    acceptDownloads: true,

    /* Global timeout for each action - strict to prevent hanging */
    actionTimeout: 5_000, // 5 seconds max per action

    /* Global timeout for navigation - strict to prevent hanging */
    navigationTimeout: 10_000, // 10 seconds max for navigation

    /* Ignore HTTPS errors for development */
    ignoreHTTPSErrors: true,

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  /* Configure projects for major browsers - Only run Chromium for fast failure detection */
  projects: [
    {
      name: 'setup',
      testMatch: '**/global-setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use custom viewport for better test stability
        viewport: { width: 1280, height: 720 },
        // Disable web security for development testing
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
        },
      },
      dependencies: ['setup'],
    },
    // Disabled other browsers for faster test execution and strict fail-fast
    // Uncomment to test on multiple browsers:
    /*
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
    */

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Start a dev server for tests to avoid a Next.js 15 build bug on /404 */
  webServer: {
    command: 'npm run dev:next',
    url: SERVER_URL,
    reuseExistingServer: true,
    timeout: 90_000, // 90 seconds max to start server
    stdout: 'pipe',
    stderr: 'pipe',
    env: { PLAYWRIGHT: '1' },
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('../tests/utils/global-setup.ts'),
  globalTeardown: require.resolve('../tests/utils/global-teardown.ts'),

  /* Test timeout - strict to prevent hanging, but allow enough time for E2E operations */
  timeout: 20_000, // 20 seconds max per test

  /* Expect timeout - strict to prevent hanging */
  expect: {
    timeout: 2_000, // 2 seconds max for assertions
    /* Take screenshot on expect failure */
    toHaveScreenshot: { threshold: 0.2 },
  },

  /* Folders */
  outputDir: './test-results/',

  /* Ignore these files when looking for tests */
  testIgnore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
});

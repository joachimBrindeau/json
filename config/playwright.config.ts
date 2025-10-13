import { defineConfig, devices } from '@playwright/test';
import { config } from '../lib/config';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: config.build.isCI,
  /* Retry on CI only */
  retries: config.build.isCI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: config.build.isCI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    config.build.isCI ? ['github'] : ['list'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: config.testing.baseUrl,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Global timeout for each action */
    actionTimeout: 15_000,

    /* Global timeout for navigation */
    navigationTimeout: 30_000,

    /* Ignore HTTPS errors for development */
    ignoreHTTPSErrors: true,

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  /* Configure projects for major browsers */
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

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific launch options
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

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3456',
  //   reuseExistingServer: true, // Always reuse existing server
  //   timeout: 180_000,
  //   stdout: 'pipe',
  //   stderr: 'pipe',
  // },

  /* Global setup and teardown */
  globalSetup: require.resolve('../tests/utils/global-setup.ts'),
  globalTeardown: require.resolve('../tests/utils/global-teardown.ts'),

  /* Test timeout */
  timeout: 60_000,

  /* Expect timeout */
  expect: {
    timeout: 10_000,
    /* Take screenshot on expect failure */
    toHaveScreenshot: { threshold: 0.2 },
  },

  /* Folders */
  outputDir: './test-results/',

  /* Ignore these files when looking for tests */
  testIgnore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
});

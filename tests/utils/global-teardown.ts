import { FullConfig, chromium } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global teardown started');

  try {
    // Get base URL from config
    const baseURL =
      config.projects?.find((p) => p.name !== 'setup')?.use?.baseURL || 'http://localhost:3456';

    // Optional: Perform cleanup operations
    await performCleanup(baseURL);

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

async function performCleanup(baseURL: string) {
  try {
    // Launch browser for cleanup operations
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    // Cleanup operations can be added here:
    // - Clear test data from database
    // - Remove uploaded test files
    // - Reset any test configurations

    // For now, just verify the server is still running
    try {
      const response = await context.request.get(`${baseURL}/api/health`);
      if (response.ok()) {
        console.log('✅ Server health check passed during teardown');
      }
    } catch (error) {
      console.log('⚠️ Server health check failed during teardown (this is okay)');
    }

    await context.close();
    await browser.close();
  } catch (error) {
    console.log('⚠️ Cleanup operations failed:', (error as Error).message);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

export default globalTeardown;

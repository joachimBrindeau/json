import { chromium, FullConfig, BrowserContext } from '@playwright/test';
import { TEST_USERS } from '../fixtures/users';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup started');

  // Get base URL from config
  const baseURL = config.projects?.find(p => p.name !== 'setup')?.use?.baseURL || 'http://localhost:3456';
  console.log(`📡 Using base URL: ${baseURL}`);

  // Launch browser for global setup operations
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const page = await context.newPage();

  try {
    // Wait for server to be ready with retries
    console.log('📡 Checking if server is available...');
    await waitForServer(page, baseURL);
    console.log('✅ Server is available');

    // Setup test users
    console.log('👤 Creating test users...');
    await setupTestUsers(context, baseURL);

    // Verify basic app functionality
    console.log('🔍 Verifying basic app functionality...');
    await verifyBasicApp(page, baseURL);

    console.log('🎯 Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function waitForServer(page: any, baseURL: string, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await page.goto(baseURL, {
        timeout: 10000,
        waitUntil: 'domcontentloaded',
      });
      
      if (response && response.status() < 400) {
        console.log(`✅ Server responded with status ${response.status()}`);
        return;
      }
      
      console.log(`⚠️ Server responded with status ${response?.status()}, retrying...`);
    } catch (error) {
      console.log(`⚠️ Server check attempt ${i + 1}/${maxRetries} failed:`, error.message);
    }
    
    if (i < maxRetries - 1) {
      console.log(`⏳ Waiting 3 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error(`Server at ${baseURL} is not responding after ${maxRetries} attempts`);
}

async function verifyBasicApp(page: any, baseURL: string) {
  try {
    // Check if main content loads
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    
    // Wait for React to hydrate
    await page.waitForTimeout(2000);
    
    // Look for common elements that should exist
    const hasContent = await page.evaluate(() => {
      // Check for any of the expected main content areas
      return !!(
        document.querySelector('main') ||
        document.querySelector('[data-testid="main-content"]') ||
        document.querySelector('body > div') ||
        document.querySelector('#__next')
      );
    });
    
    if (!hasContent) {
      console.warn('⚠️ Main content area not found, but server is responding');
    } else {
      console.log('✅ Main content area found');
    }
    
  } catch (error) {
    console.warn('⚠️ Basic app verification failed:', error.message);
  }
}

async function setupTestUsers(context: BrowserContext, baseURL: string) {
  const testUsers = [
    TEST_USERS.regular,
    TEST_USERS.admin,
    TEST_USERS.developer,
    TEST_USERS.powerUser,
    TEST_USERS.communityManager,
    TEST_USERS.temp1,
    TEST_USERS.temp2,
  ];

  // First, check if the auth API is available
  try {
    const healthResponse = await context.request.get(`${baseURL}/api/health`);
    if (!healthResponse.ok()) {
      console.log('⚠️ Health check failed, but continuing with user setup');
    }
  } catch (error) {
    console.log('⚠️ Health check failed, but continuing with user setup');
  }

  for (const user of testUsers) {
    try {
      console.log(`  Creating user: ${user.email}`);
      
      // Create user via API with proper headers and error handling
      const response = await context.request.post(`${baseURL}/api/auth/signup`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        data: {
          name: user.name,
          email: user.email,
          password: user.password,
        },
      });

      if (response.ok()) {
        console.log(`  ✅ Created user: ${user.email}`);
      } else if (response.status() === 400) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const textData = await response.text().catch(() => 'Unknown error');
          errorData = { error: textData };
        }
        
        if (errorData.error?.includes('already exists') || errorData.message?.includes('already exists')) {
          console.log(`  ℹ️  User already exists: ${user.email}`);
        } else {
          console.log(`  ⚠️  Failed to create user ${user.email}: ${errorData.error || errorData.message || 'Unknown error'}`);
        }
      } else if (response.status() === 404) {
        console.log(`  ⚠️  Signup endpoint not found - user creation skipped: ${user.email}`);
      } else {
        const responseText = await response.text().catch(() => 'No response text');
        console.log(`  ❌ Failed to create user ${user.email}: ${response.status()} - ${responseText}`);
      }
    } catch (error) {
      console.log(`  ❌ Error creating user ${user.email}:`, error.message);
    }
    
    // Small delay between user creations to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export default globalSetup;

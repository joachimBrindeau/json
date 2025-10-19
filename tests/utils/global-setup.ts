import { chromium, FullConfig, BrowserContext } from '@playwright/test';
import { TEST_USERS } from '../fixtures/users';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { initializeFaker } from './faker-config';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup started');

  // Initialize deterministic faker with fixed seed
  console.log('🎲 Initializing deterministic faker...');
  initializeFaker();
  console.log('✅ Faker initialized with seed');

  // Check and start Docker dependencies FIRST
  console.log('🐳 Checking Docker dependencies...');
  await ensureDockerDependencies();

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

    // Clean up existing test users before creating new ones
    console.log('🧹 Cleaning up existing test users...');
    await cleanupTestUsers();

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
    await Promise.race([
      page.waitForLoadState('networkidle', { timeout: 3000 }),
      page.waitForFunction(() => document.readyState === 'complete', { timeout: 3000 })
    ]).catch(() => {});

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

async function cleanupTestUsers() {
  const prisma = new PrismaClient();

  try {
    const testUserEmails = [
      TEST_USERS.regular.email,
      TEST_USERS.admin.email,
      TEST_USERS.developer.email,
      TEST_USERS.powerUser.email,
      TEST_USERS.communityManager.email,
      TEST_USERS.temp1.email,
      TEST_USERS.temp2.email,
    ];

    // Delete all test users (cascade will automatically delete related data)
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          in: testUserEmails,
        },
      },
    });

    console.log(`  ✅ Deleted ${result.count} existing test users`);
  } catch (error) {
    console.log('  ⚠️ Error cleaning up test users:', error.message);
  } finally {
    await prisma.$disconnect();
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
      } else if (response.status() === 400 || response.status() === 409) {
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

/**
 * Ensure Docker dependencies (PostgreSQL, Redis) are running
 * This prevents test failures due to missing database connections
 */
async function ensureDockerDependencies() {
  try {
    // Check if Docker daemon is running
    try {
      execSync('docker info', { stdio: 'ignore' });
      console.log('  ✅ Docker daemon is running');
    } catch (error) {
      console.error('  ❌ Docker daemon is not running!');
      console.error('  💡 Please start Docker Desktop and try again');
      throw new Error('Docker daemon is not running - tests require PostgreSQL and Redis');
    }

    // Check if required containers are running and healthy
    const requiredContainers = ['config-postgres-1', 'config-redis-1'];
    const missingContainers: string[] = [];

    for (const containerName of requiredContainers) {
      try {
        // Check if container exists and is running
        const output = execSync(`docker ps --filter "name=${containerName}" --format "{{.Names}}: {{.Status}}"`,
          { encoding: 'utf-8' });

        if (output.trim()) {
          console.log(`  ✅ ${output.trim()}`);
        } else {
          console.log(`  ⚠️  Container ${containerName} is not running`);
          missingContainers.push(containerName);
        }
      } catch (error) {
        console.log(`  ⚠️  Container ${containerName} not found`);
        missingContainers.push(containerName);
      }
    }

    // Start missing containers using docker-compose
    if (missingContainers.length > 0) {
      console.log('  🚀 Starting Docker containers...');
      try {
        execSync('docker-compose -f config/docker-compose.local.yml up -d postgres redis',
          { stdio: 'inherit', cwd: process.cwd() });

        // Wait for containers to be healthy
        console.log('  ⏳ Waiting for containers to be healthy...');
        await waitForDockerHealth();

        console.log('  ✅ Docker containers started successfully');
      } catch (error) {
        console.error('  ❌ Failed to start Docker containers:', error.message);
        throw error;
      }
    }

    // Verify PostgreSQL is accessible
    await verifyPostgreSQL();

    // Verify Redis is accessible
    await verifyRedis();

  } catch (error) {
    console.error('  ❌ Docker dependency check failed:', error.message);
    throw error;
  }
}

/**
 * Wait for Docker containers to report healthy status
 */
async function waitForDockerHealth(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const postgresHealth = execSync(
        'docker inspect --format="{{.State.Health.Status}}" config-postgres-1',
        { encoding: 'utf-8' }
      ).trim();

      const redisHealth = execSync(
        'docker inspect --format="{{.State.Health.Status}}" config-redis-1',
        { encoding: 'utf-8' }
      ).trim();

      if (postgresHealth === 'healthy' && redisHealth === 'healthy') {
        console.log('  ✅ All containers are healthy');
        return;
      }

      console.log(`  ⏳ Waiting for containers to be healthy (${i + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Container might not have health check yet, continue waiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.warn('  ⚠️  Containers did not report healthy status, but continuing...');
}

/**
 * Verify PostgreSQL is accessible
 */
async function verifyPostgreSQL() {
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    console.log('  ✅ PostgreSQL is accessible');
  } catch (error) {
    console.error('  ❌ PostgreSQL connection failed:', error.message);
    throw new Error('PostgreSQL is not accessible - check DATABASE_URL in .env');
  }
}

/**
 * Verify Redis is accessible
 */
async function verifyRedis() {
  try {
    // Simple Redis ping test using docker exec
    execSync('docker exec config-redis-1 redis-cli ping', { stdio: 'ignore' });
    console.log('  ✅ Redis is accessible');
  } catch (error) {
    console.warn('  ⚠️  Redis connection check failed, but continuing...');
    // Redis is optional for tests, so just warn
  }
}

export default globalSetup;

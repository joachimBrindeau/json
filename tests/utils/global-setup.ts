import { chromium, FullConfig } from '@playwright/test';
import { TEST_USERS } from '../fixtures/users';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { initializeFaker } from './faker-config';
import fs from 'fs';
import path from 'path';
import net from 'net';
import { hashPassword } from '@/lib/auth/password';

async function globalSetup(config: FullConfig) {
  // Wrap entire setup in timeout to prevent hanging
  const SETUP_TIMEOUT = 300_000; // 5 minutes max for setup
  
  return Promise.race([
    (async () => {
      console.log('🚀 Global setup started');

      // Initialize deterministic faker with fixed seed
      console.log('🎲 Initializing deterministic faker...');
      initializeFaker();
      console.log('✅ Faker initialized with seed');

      // Check and start Docker dependencies FIRST
      console.log('🐳 Checking Docker dependencies...');
      await ensureDockerDependencies();

      // Ensure a writable downloads directory exists for tests that save files
      try {
        const downloadsDir = path.join(process.cwd(), 'tests', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
          fs.mkdirSync(downloadsDir, { recursive: true });
        }
        console.log('📁 Ensured downloads dir:', downloadsDir);
      } catch (e) {
        console.warn('⚠️ Could not ensure downloads dir:', (e as Error).message);
      }

      // Get base URL from config
      const baseURL =
        config.projects?.find((p) => p.name !== 'setup')?.use?.baseURL || 'http://localhost:3456';
      console.log(`📡 Using base URL: ${baseURL}`);

      // Launch browser for global setup operations
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        extraHTTPHeaders: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      const page = await context.newPage();

      try {
        // Always check server readiness to fail fast
        console.log('📡 Checking if server is available...');
        await waitForServer(page, baseURL);
        console.log('✅ Server is available');

        // Clean up existing test users before creating new ones
        console.log('🧹 Cleaning up existing test users...');
        await cleanupTestUsers();

        // Setup test users
        console.log('👤 Creating test users...');
        await setupTestUsersDirect();

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
    })(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Global setup timed out after ${SETUP_TIMEOUT}ms`)), SETUP_TIMEOUT)
    ),
  ]);
}

async function waitForServer(page: any, baseURL: string, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Prefer API health endpoint (more stable in dev) and fall back to root page
      const health = await page.request.get(`${baseURL}/api/health`);
      if (health && health.status() < 400) {
        console.log(`✅ Health endpoint responded with status ${health.status()}`);
        return;
      }

      const response = await page.goto(baseURL, {
        timeout: 5000, // Reduced from 10s to 5s for faster failure
        waitUntil: 'domcontentloaded',
      });

      if (response && response.status() < 400) {
        console.log(`✅ Server responded with status ${response.status()}`);
        return;
      }

      console.log(
        `⚠️ Server responded with status ${response?.status() ?? health?.status()}, retrying...`
      );
    } catch (error) {
      console.log(
        `⚠️ Server check attempt ${i + 1}/${maxRetries} failed:`,
        (error as Error).message
      );
    }

    if (i < maxRetries - 1) {
      console.log(`⏳ Waiting 2 seconds before retry...`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Reduced from 3s to 2s
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
      page.waitForFunction(() => document.readyState === 'complete', { timeout: 3000 }),
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
    console.warn('⚠️ Basic app verification failed:', (error as Error).message);
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
    console.log('  ⚠️ Error cleaning up test users:', (error as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}
async function setupTestUsersDirect() {
  const prisma = new PrismaClient();
  try {
    const testUsers = [
      TEST_USERS.regular,
      TEST_USERS.admin,
      TEST_USERS.developer,
      TEST_USERS.powerUser,
      TEST_USERS.communityManager,
      TEST_USERS.temp1,
      TEST_USERS.temp2,
    ];

    for (const user of testUsers) {
      const email = user.email.trim().toLowerCase();
      const name = user.name.trim();
      try {
        const passwordHash = await hashPassword(user.password);
        await prisma.user.create({
          data: {
            name,
            email,
            password: passwordHash,
            // Mark verified in tests to avoid email flow complexity
            emailVerified: new Date(),
          },
        });
        console.log(`  ✅ Created user (direct DB): ${email}`);
      } catch (e: any) {
        // Prisma unique constraint error code
        if (e && typeof e === 'object' && e.code === 'P2002') {
          console.log(`  ℹ️  User already exists (direct DB): ${email}`);
        } else {
          console.log(`  ⚠️  Failed to create user (direct DB) ${email}:`, e?.message || e);
        }
      }
      // Gentle throttle
      await new Promise((r) => setTimeout(r, 50));
    }
  } finally {
    await prisma.$disconnect();
  }
}


// Setup test users via API (currently unused but kept for future use)
// Commented out to avoid build errors - can be uncommented if needed
/*
async function _setupTestUsers(context: any, baseURL: string) {
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
          Accept: 'application/json',
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
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          const textData = await response.text().catch(() => 'Unknown error');
          errorData = { error: textData };
        }

        // Unwrap standardized envelope if present
        const isStandard =
          errorData &&
          typeof errorData === 'object' &&
          'success' in errorData &&
          errorData.success === false;
        const message = isStandard
          ? errorData.error || errorData.message
          : errorData.error || errorData.message;

        if (message && String(message).includes('already exists')) {
          console.log(`  ℹ️  User already exists: ${user.email}`);
        } else {
          console.log(`  ⚠️  Failed to create user ${user.email}: ${message || 'Unknown error'}`);
        }
      } else if (response.status() === 404) {
        console.log(`  ⚠️  Signup endpoint not found - user creation skipped: ${user.email}`);
      } else {
        const responseText = await response.text().catch(() => 'No response text');
        console.log(
          `  ❌ Failed to create user ${user.email}: ${response.status()} - ${responseText}`
        );
      }
    } catch (error) {
      console.log(`  ❌ Error creating user ${user.email}:`, (error as Error).message);
    }

    // Small delay between user creations to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
*/

// Find a free TCP port on localhost starting from a base value
async function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    try {
      server.listen(port, '127.0.0.1');
    } catch {
      resolve(false);
    }
  });
}

async function findFreePort(start = 9991, maxAttempts = 50): Promise<number> {
  let port = start;
  for (let i = 0; i < maxAttempts; i++, port++) {
    // Skip well-known ports just in case
    if (port < 1024) continue;
    if (await isPortFree(port)) return port;
  }
  throw new Error(`Unable to find a free port starting at ${start}`);
}


/**
 * Ensure Docker dependencies (PostgreSQL, Redis) are running
 * This prevents test failures due to missing database connections
 */
async function ensureDockerDependencies() {
  try {
    // Check if Docker daemon is running, and try to start it if not
    let dockerRunning = false;
    try {
      execSync('docker info', { stdio: 'ignore' });
      dockerRunning = true;
      console.log('  ✅ Docker daemon is running');
    } catch (error) {
      console.log('  ⚠️  Docker daemon is not running, attempting to start...');
      
      // Try to start Docker Desktop (macOS)
      if (process.platform === 'darwin') {
        try {
          console.log('  🚀 Attempting to start Docker Desktop...');
          execSync('open -a Docker', { stdio: 'ignore' });
          console.log('  ⏳ Waiting for Docker Desktop to start...');
          
          // Wait for Docker to be ready (max 60 seconds)
          for (let i = 0; i < 60; i++) {
            try {
              execSync('docker info', { stdio: 'ignore' });
              dockerRunning = true;
              console.log('  ✅ Docker Desktop started successfully');
              break;
            } catch {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
          
          if (!dockerRunning) {
            console.error('  ❌ Docker Desktop did not start within 60 seconds');
            throw new Error('Docker Desktop failed to start - please start it manually');
          }
        } catch (startError) {
          console.error('  ❌ Failed to start Docker Desktop:', (startError as Error).message);
          console.error('  💡 Please start Docker Desktop manually and try again');
          throw new Error('Docker daemon is not running - tests require PostgreSQL and Redis');
        }
      } else {
        // On Linux, try to start Docker service
        try {
          console.log('  🚀 Attempting to start Docker service...');
          execSync('sudo systemctl start docker', { stdio: 'ignore' });
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Reduced from 2s to 1s
          
          try {
            execSync('docker info', { stdio: 'ignore' });
            dockerRunning = true;
            console.log('  ✅ Docker service started successfully');
          } catch {
            throw new Error('Docker service failed to start');
          }
        } catch (startError) {
          console.error('  ❌ Failed to start Docker service:', (startError as Error).message);
          console.error('  💡 Please start Docker manually and try again');
          throw new Error('Docker daemon is not running - tests require PostgreSQL and Redis');
        }
      }
    }
    
    if (!dockerRunning) {
      throw new Error('Docker daemon is not running - tests require PostgreSQL and Redis');
    }

    // Check if required containers are running and healthy
    const requiredContainers = ['config-postgres-1', 'config-redis-1'];
    const missingContainers: string[] = [];

    for (const containerName of requiredContainers) {
      try {
        // Check if container exists and is running
        const output = execSync(
          `docker ps --filter "name=${containerName}" --format "{{.Names}}: {{.Status}}"`,
          { encoding: 'utf-8' }
        );

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
        // Build a services list based on what is missing
        const services: string[] = [];
        if (missingContainers.includes('config-postgres-1')) services.push('postgres');
        if (missingContainers.includes('config-redis-1')) services.push('redis');

        if (services.length > 0) {
          // Start Postgres first (required)
          if (services.includes('postgres')) {
            // Always select a random free host port for PostgreSQL to avoid collisions
            const chosenPostgresPort = await findFreePort(9992);
            console.log(`  🔌 Using PostgreSQL host port: ${chosenPostgresPort}`);
            try {
              const envPrefix = `POSTGRES_HOST_PORT=${chosenPostgresPort}`;
              execSync(`${envPrefix} docker compose -f config/docker-compose.local.yml up -d postgres`, {
                stdio: 'inherit',
                cwd: process.cwd(),
              });
            } catch (e) {
              console.error('  ❌ Failed to start PostgreSQL container');
              throw e;
            }
          }
          // Start Redis (optional)
          if (services.includes('redis')) {
            // Always select a random free host port for Redis to avoid collisions
            let chosenRedisPort = await findFreePort(9991);
            console.log(`  🔌 Using Redis host port: ${chosenRedisPort}`);
            try {
              const envPrefix = `REDIS_HOST_PORT=${chosenRedisPort}`;
              execSync(`${envPrefix} docker compose -f config/docker-compose.local.yml up -d redis`, {
                stdio: 'inherit',
                cwd: process.cwd(),
              });
            } catch (e: any) {
              console.warn('  ⚠️  Failed to start Redis container; continuing (Redis optional for tests)');
            }
          }
        }

        // Wait for containers to be healthy (best-effort)
        console.log('  ⏳ Waiting for containers to be healthy...');
        await waitForDockerHealth();
        
        // Additional wait for PostgreSQL to be fully ready
        console.log('  ⏳ Waiting for PostgreSQL to accept connections...');
        for (let i = 0; i < 30; i++) {
          try {
            execSync('docker exec config-postgres-1 pg_isready -U json_viewer_user -d json_viewer', {
              stdio: 'ignore'
            });
            console.log('  ✅ PostgreSQL is ready');
            break;
          } catch {
            if (i < 29) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        console.log('  ✅ Docker container start attempt completed');
      } catch (error) {
        console.error('  ❌ Failed to start required Docker containers:', (error as Error).message || error);
        throw error;
      }
    }

    // Verify PostgreSQL is accessible
    await verifyPostgreSQL();

    // Verify Redis is accessible
    await verifyRedis();
  } catch (error) {
    console.error('  ❌ Docker dependency check failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Wait for Docker containers to report healthy status
 */
async function waitForDockerHealth(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      let postgresHealthy = false;
      let redisHealthy = false;
      
      // Check PostgreSQL health
      try {
        const postgresHealth = execSync(
          'docker inspect --format="{{.State.Health.Status}}" config-postgres-1 2>/dev/null',
          { encoding: 'utf-8' }
        ).trim();
        postgresHealthy = postgresHealth === 'healthy' || postgresHealth === '';
      } catch {
        // Container might not exist yet or health check not configured
        // Try to check if container is running instead
        try {
          const postgresStatus = execSync(
            'docker ps --filter "name=config-postgres-1" --format "{{.Status}}"',
            { encoding: 'utf-8' }
          ).trim();
          postgresHealthy = postgresStatus.includes('Up');
        } catch {
          postgresHealthy = false;
        }
      }
      
      // Check Redis health
      try {
        const redisHealth = execSync(
          'docker inspect --format="{{.State.Health.Status}}" config-redis-1 2>/dev/null',
          { encoding: 'utf-8' }
        ).trim();
        redisHealthy = redisHealth === 'healthy' || redisHealth === '';
      } catch {
        // Container might not exist yet or health check not configured
        // Try to check if container is running instead
        try {
          const redisStatus = execSync(
            'docker ps --filter "name=config-redis-1" --format "{{.Status}}"',
            { encoding: 'utf-8' }
          ).trim();
          redisHealthy = redisStatus.includes('Up');
        } catch {
          redisHealthy = false;
        }
      }

      if (postgresHealthy && redisHealthy) {
        console.log('  ✅ All containers are healthy');
        return;
      }

      if (i % 5 === 0) {
        console.log(`  ⏳ Waiting for containers to be healthy (${i + 1}/${maxRetries})...`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      // Container might not have health check yet, continue waiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.warn('  ⚠️  Containers did not report healthy status, but continuing...');
}

/**
 * Verify PostgreSQL is accessible with retries
 */
async function verifyPostgreSQL(maxRetries = 15) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const prisma = new PrismaClient();
      await prisma.$connect();
      await prisma.$disconnect();
      console.log('  ✅ PostgreSQL is accessible');
      return;
    } catch (error) {
      if (i < maxRetries - 1) {
        if (i % 5 === 0) {
          console.log(`  ⏳ Waiting for PostgreSQL to be ready (${i + 1}/${maxRetries})...`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Reduced from 2s to 1s
      } else {
        console.error('  ❌ PostgreSQL connection failed:', (error as Error).message);
        throw new Error('PostgreSQL is not accessible - check DATABASE_URL in .env');
      }
    }
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

import { Page, BrowserContext, expect } from '@playwright/test';
import { AuthHelper } from './auth-helper';
import { APIHelper } from './api-helper';
import { TestFactories } from './test-factories';
import { CommonAssertions } from './common-assertions';
import { UserType } from '../fixtures/users';

/**
 * Setup and teardown helpers to standardize test initialization
 * Eliminates duplication in beforeEach/afterEach hooks across tests
 */
export class SetupHelpers {
  constructor(
    private page: Page,
    private context: BrowserContext,
    private authHelper: AuthHelper,
    private apiHelper: APIHelper
  ) {}

  /**
   * Setup authenticated test environment
   */
  async setupAuthenticatedTest(
    options: {
      userType?: UserType;
      navigateTo?: string;
      createTestData?: boolean;
      waitForReady?: boolean;
      clearStorage?: boolean;
      testDocuments?: number;
    } = {}
  ) {
    const {
      userType = 'regular',
      navigateTo = '/',
      createTestData = false,
      waitForReady = true,
      clearStorage = true,
      testDocuments = 0,
    } = options;

    console.log(`🔧 Setting up authenticated test for user type: ${userType}`);

    // Clear storage if requested
    if (clearStorage) {
      await this.clearAllStorage();
    }

    // Login user
    await this.authHelper.login(userType);

    // Verify authentication
    const assertions = new CommonAssertions(this.page);
    await assertions.assertAuthenticated();

    // Navigate to target page
    if (navigateTo !== '/') {
      await this.page.goto(navigateTo);
    }

    // Wait for application to be ready
    if (waitForReady) {
      await this.waitForAppReady();
    }

    // Create test data if requested
    const testData: any = {};
    if (createTestData) {
      testData.user = TestFactories.createFixtureUser(userType);

      if (testDocuments > 0) {
        testData.documents = [];
        for (let i = 0; i < testDocuments; i++) {
          const doc = TestFactories.createTestDocument({
            title: `Test Document ${i + 1}`,
            userId: testData.user.id,
          });

          const uploadResult = await this.apiHelper.uploadJSON(doc.content, {
            title: doc.title,
            description: doc.description,
            tags: doc.tags,
            isPublic: doc.isPublic,
          });

          testData.documents.push({ ...doc, ...uploadResult });
        }
      }
    }

    console.log('✅ Authenticated test setup completed');
    return testData;
  }

  /**
   * Setup anonymous test environment
   */
  async setupAnonymousTest(
    options: {
      navigateTo?: string;
      waitForReady?: boolean;
      clearStorage?: boolean;
      createSessionData?: boolean;
    } = {}
  ) {
    const {
      navigateTo = '/',
      waitForReady = true,
      clearStorage = true,
      createSessionData = false,
    } = options;

    console.log('🔧 Setting up anonymous test environment');

    // Clear storage if requested
    if (clearStorage) {
      await this.clearAllStorage();
    }

    // Ensure user is logged out
    if (await this.authHelper.isLoggedIn()) {
      await this.authHelper.logout();
    }

    // Navigate to target page
    await this.page.goto(navigateTo);

    // Wait for application to be ready
    if (waitForReady) {
      await this.waitForAppReady();
    }

    // Verify anonymous state
    const assertions = new CommonAssertions(this.page);
    await assertions.assertAnonymous();

    // Create session data if requested
    const sessionData = createSessionData ? TestFactories.createTestSession() : null;

    console.log('✅ Anonymous test setup completed');
    return { sessionData };
  }

  /**
   * Setup large data test environment for performance testing
   */
  async setupLargeDataTest(
    options: {
      dataSize?: 'small' | 'medium' | 'large' | 'extreme';
      userType?: UserType;
      preloadData?: boolean;
      monitorPerformance?: boolean;
    } = {}
  ) {
    const {
      dataSize = 'medium',
      userType = 'regular',
      preloadData = true,
      monitorPerformance = true,
    } = options;

    console.log(`🔧 Setting up large data test - size: ${dataSize}`);

    // Setup authenticated environment
    await this.setupAuthenticatedTest({ userType, waitForReady: true });

    // Generate large test data
    const testData = TestFactories.createLargeTestData({
      objectCount: this.getObjectCountForSize(dataSize),
      arraySize: this.getArraySizeForSize(dataSize),
      nestingDepth: this.getNestingDepthForSize(dataSize),
      includeLargeStrings: dataSize === 'extreme',
    });

    // Preload data if requested
    let uploadedDocument;
    if (preloadData) {
      console.log('📤 Preloading large test data...');
      uploadedDocument = await this.apiHelper.uploadJSON(testData, {
        title: `Large Test Data - ${dataSize}`,
        description: `Performance test data with ${dataSize} size`,
        tags: ['performance', 'test', dataSize],
      });
    }

    // Setup performance monitoring
    let performanceMetrics;
    if (monitorPerformance) {
      performanceMetrics = await this.setupPerformanceMonitoring();
    }

    console.log('✅ Large data test setup completed');
    return {
      testData,
      uploadedDocument,
      performanceMetrics,
      size: dataSize,
    };
  }

  /**
   * Setup library test environment with predefined documents
   */
  async setupLibraryTest(
    options: {
      userType?: UserType;
      publicDocuments?: number;
      privateDocuments?: number;
      categories?: string[];
      tags?: string[];
    } = {}
  ) {
    const {
      userType = 'regular',
      publicDocuments = 5,
      privateDocuments = 3,
      categories = ['test', 'sample', 'demo'],
      tags = ['json', 'test', 'example'],
    } = options;

    console.log(
      `🔧 Setting up library test with ${publicDocuments} public, ${privateDocuments} private docs`
    );

    // Setup authenticated environment
    const userData = await this.setupAuthenticatedTest({ userType });

    const createdDocuments = [];

    // Create public documents
    for (let i = 0; i < publicDocuments; i++) {
      const doc = TestFactories.createTestDocument({
        title: `Public Document ${i + 1}`,
        isPublic: true,
        category: categories[i % categories.length],
        tags: [tags[i % tags.length], 'public', `doc-${i + 1}`],
        userId: userData.user?.id,
      });

      const uploaded = await this.apiHelper.uploadJSON(doc.content, {
        title: doc.title,
        description: doc.description,
        category: doc.category,
        tags: doc.tags,
        isPublic: doc.isPublic,
      });

      // Publish to public library
      await this.apiHelper.publishJSON(uploaded.id, {
        title: doc.title,
        description: doc.description,
        tags: doc.tags,
        category: doc.category,
      });

      createdDocuments.push({ ...doc, ...uploaded, type: 'public' });
    }

    // Create private documents
    for (let i = 0; i < privateDocuments; i++) {
      const doc = TestFactories.createTestDocument({
        title: `Private Document ${i + 1}`,
        isPublic: false,
        category: categories[i % categories.length],
        tags: [tags[i % tags.length], 'private', `doc-${i + 1}`],
        userId: userData.user?.id,
      });

      const uploaded = await this.apiHelper.uploadJSON(doc.content, {
        title: doc.title,
        description: doc.description,
        category: doc.category,
        tags: doc.tags,
        isPublic: doc.isPublic,
      });

      createdDocuments.push({ ...doc, ...uploaded, type: 'private' });
    }

    console.log('✅ Library test setup completed');
    return {
      userData,
      documents: createdDocuments,
      categories,
      tags,
    };
  }

  /**
   * Cleanup test data and environment
   */
  async cleanupTestData(
    options: {
      clearStorage?: boolean;
      logout?: boolean;
      clearCookies?: boolean;
      documentIds?: string[];
    } = {}
  ) {
    const { clearStorage = true, logout = true, clearCookies = true, documentIds = [] } = options;

    console.log('🧹 Cleaning up test data...');

    try {
      // Delete specific documents if provided
      for (const documentId of documentIds) {
        try {
          await this.apiHelper.apiCall('DELETE', `/api/json/${documentId}`, {
            expectedStatus: 200,
          });
        } catch (error) {
          console.warn(`Could not delete document ${documentId}:`, error);
        }
      }

      // Logout if requested and user is logged in
      if (logout && (await this.authHelper.isLoggedIn())) {
        await this.authHelper.logout();
      }

      // Clear storage
      if (clearStorage) {
        await this.clearAllStorage();
      }

      // Clear cookies
      if (clearCookies) {
        await this.context.clearCookies();
      }

      console.log('✅ Test cleanup completed');
    } catch (error) {
      console.warn('⚠️ Partial cleanup failure:', error);
    }
  }

  /**
   * Wait for application to be fully ready
   */
  async waitForAppReady(timeout = 15000) {
    console.log('⏳ Waiting for application to be ready...');

    // Wait for React to hydrate
    await this.page.waitForFunction(
      () => {
        return (
          window.React !== undefined ||
          document.querySelector('[data-reactroot]') !== null ||
          document.querySelector('main') !== null
        );
      },
      { timeout }
    );

    // Wait for any loading indicators to disappear
    await this.page.waitForFunction(
      () => {
        const loadingElements = document.querySelectorAll(
          '[data-testid="loading"], .loading, .spinner, .loading-overlay'
        );
        return loadingElements.length === 0;
      },
      { timeout }
    );

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout });

    // Additional wait for any async operations to complete
    await Promise.race([
      this.page.waitForLoadState('domcontentloaded'),
      this.page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 }),
    ]).catch(() => {});

    console.log('✅ Application ready');
  }

  /**
   * Setup error monitoring for tests
   */
  async setupErrorMonitoring() {
    const errors: string[] = [];
    const consoleMessages: string[] = [];

    // Monitor console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        errors.push(errorText);
        consoleMessages.push(`CONSOLE ERROR: ${errorText}`);
      }
    });

    // Monitor page errors
    this.page.on('pageerror', (error) => {
      const errorText = error.message;
      errors.push(errorText);
      consoleMessages.push(`PAGE ERROR: ${errorText}`);
    });

    // Monitor failed network requests
    this.page.on('response', (response) => {
      if (!response.ok()) {
        const errorText = `Network error: ${response.status()} ${response.url()}`;
        errors.push(errorText);
        consoleMessages.push(`NETWORK ERROR: ${errorText}`);
      }
    });

    return {
      getErrors: () => errors,
      getConsoleMessages: () => consoleMessages,
      hasErrors: () => errors.length > 0,
      clearErrors: () => {
        errors.length = 0;
        consoleMessages.length = 0;
      },
    };
  }

  /**
   * Setup performance monitoring
   */
  async setupPerformanceMonitoring() {
    // Enable performance metrics collection
    const client = await this.page.context().newCDPSession(this.page);
    await client.send('Performance.enable');

    return {
      getMetrics: async () => {
        const metrics = await client.send('Performance.getMetrics');
        return metrics.metrics;
      },
      startTrace: async () => {
        await client.send('Tracing.start', {
          categories: ['blink.user_timing'] as any,
          options: 'sampling-frequency=10000',
        });
      },
      stopTrace: async () => {
        const trace = await client.send('Tracing.end');
        return trace;
      },
    };
  }

  /**
   * Setup network interception for testing offline/error scenarios
   */
  async setupNetworkInterception(
    options: {
      blockPatterns?: string[];
      slowNetwork?: boolean;
      offlineMode?: boolean;
    } = {}
  ) {
    const { blockPatterns = [], slowNetwork = false, offlineMode = false } = options;

    if (offlineMode) {
      await this.context.setOffline(true);
    }

    // Block specific patterns
    for (const pattern of blockPatterns) {
      await this.page.route(pattern, (route) => {
        route.abort('internetdisconnected');
      });
    }

    // Simulate slow network
    if (slowNetwork) {
      await this.page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        route.continue();
      });
    }

    return {
      restoreNetwork: async () => {
        await this.context.setOffline(false);
        await this.page.unrouteAll();
      },
    };
  }

  // Private helper methods
  private async clearAllStorage() {
    await Promise.all([
      this.page.evaluate(() => localStorage.clear()),
      this.page.evaluate(() => sessionStorage.clear()),
      this.context.clearCookies(),
    ]);
  }

  private getObjectCountForSize(size: string): number {
    const sizes = {
      small: 100,
      medium: 500,
      large: 2000,
      extreme: 10000,
    };
    return sizes[size as keyof typeof sizes] || 500;
  }

  private getArraySizeForSize(size: string): number {
    const sizes = {
      small: 10,
      medium: 50,
      large: 100,
      extreme: 200,
    };
    return sizes[size as keyof typeof sizes] || 50;
  }

  private getNestingDepthForSize(size: string): number {
    const depths = {
      small: 2,
      medium: 3,
      large: 5,
      extreme: 7,
    };
    return depths[size as keyof typeof depths] || 3;
  }
}

/**
 * Standalone helper functions for common setup scenarios
 */

/**
 * Quick setup for anonymous viewer tests
 */
export async function quickSetupAnonymous(page: Page, authHelper: AuthHelper) {
  const setupHelper = new SetupHelpers(
    page,
    page.context(),
    authHelper,
    new APIHelper(page.context().request)
  );
  return await setupHelper.setupAnonymousTest();
}

/**
 * Quick setup for authenticated user tests
 */
export async function quickSetupAuthenticated(
  page: Page,
  context: BrowserContext,
  authHelper: AuthHelper,
  apiHelper: APIHelper,
  userType: UserType = 'regular'
) {
  const setupHelper = new SetupHelpers(page, context, authHelper, apiHelper);
  return await setupHelper.setupAuthenticatedTest({ userType });
}

/**
 * Quick cleanup for tests
 */
export async function quickCleanup(
  page: Page,
  context: BrowserContext,
  authHelper: AuthHelper,
  options: {
    documentIds?: string[];
    logout?: boolean;
  } = {}
) {
  const setupHelper = new SetupHelpers(page, context, authHelper, new APIHelper(context.request));
  return await setupHelper.cleanupTestData(options);
}

/**
 * Wait for JSON processing to complete
 */
export async function waitForJsonProcessing(page: Page, timeout = 10000) {
  // Wait for processing indicators to disappear
  await page.waitForFunction(
    () => {
      const processingElements = document.querySelectorAll(
        '[data-testid="processing"], .processing, .json-loading, .analyzing'
      );
      return processingElements.length === 0;
    },
    { timeout }
  );

  // Wait for JSON viewer to be visible
  await page.waitForSelector('[data-testid="json-viewer"], .json-viewer, .tree-view', { timeout });

  // Wait for viewer to be ready
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/**
 * Create a test environment with specific browser settings
 */
export async function createTestEnvironment(
  options: {
    viewport?: { width: number; height: number };
    userAgent?: string;
    locale?: string;
    timezone?: string;
  } = {}
) {
  const {
    viewport = { width: 1280, height: 720 },
    userAgent,
    locale = 'en-US',
    timezone = 'America/New_York',
  } = options;

  return {
    viewport,
    userAgent,
    locale,
    timezoneId: timezone,
  };
}

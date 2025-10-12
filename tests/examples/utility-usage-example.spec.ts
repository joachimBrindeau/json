import { test, expect } from '../utils/base-test';

/**
 * Example test file demonstrating usage of new comprehensive test utilities
 * This file shows how to eliminate duplication using the new utility classes
 */

test.describe('Test Utilities Usage Examples', () => {

  test.describe('Anonymous User Examples', () => {
    test('example: basic anonymous JSON viewing', async ({ 
      page, 
      pageHelpers, 
      testFactories, 
      commonAssertions, 
      setupHelpers 
    }) => {
      // Setup anonymous environment with utilities
      await setupHelpers.setupAnonymousTest({
        navigateTo: '/',
        waitForReady: true,
      });

      // Create test data using factories
      const testDocument = testFactories.createTestDocument({
        title: 'Example JSON Document',
        size: 'medium',
      });

      // Use page helpers for interactions
      await pageHelpers.navigateToViewer();
      await pageHelpers.inputJsonText(testDocument.content);

      // Use common assertions for verification
      await commonAssertions.assertJsonVisible({
        expectedNodeCount: 50,
        checkForErrors: true,
        viewMode: 'tree',
      });

      await commonAssertions.assertAnonymous();
    });

    test('example: test different view modes', async ({ 
      pageHelpers, 
      testFactories, 
      commonAssertions 
    }) => {
      // Create complex test data
      const complexData = testFactories.createTestDocument({
        size: 'large',
        tags: ['complex', 'nested'],
      });

      await pageHelpers.navigateToViewer();
      await pageHelpers.inputJsonText(complexData.content);

      // Test all view modes
      for (const viewMode of ['tree', 'raw', 'formatted'] as const) {
        await pageHelpers.switchViewMode(viewMode);
        await commonAssertions.assertJsonVisible({
          viewMode,
          checkForErrors: true,
        });
      }
    });
  });

  test.describe('Authenticated User Examples', () => {
    test('example: user document management workflow', async ({
      setupHelpers,
      pageHelpers,
      testFactories,
      commonAssertions,
      apiHelper,
    }) => {
      // Setup authenticated test environment
      const testData = await setupHelpers.setupAuthenticatedTest({
        userType: 'regular',
        createTestData: true,
        testDocuments: 3,
      });

      // Verify authentication
      await commonAssertions.assertAuthenticated({
        expectedEmail: 'testuser@jsonshare.test',
        checkUserMenu: true,
      });

      // Navigate to library and verify documents
      await pageHelpers.navigateToLibrary();
      await commonAssertions.assertLibraryContains(
        testData.documents.map((doc: any) => ({
          title: doc.title,
          isPublic: doc.isPublic,
          tags: doc.tags,
        }))
      );

      // Test document editing
      await pageHelpers.selectLibraryItem(testData.documents[0].title);
      await commonAssertions.assertDocumentSaved({
        expectedTitle: testData.documents[0].title,
        checkInLibrary: false,
      });

      // Cleanup
      await setupHelpers.cleanupTestData({
        documentIds: testData.documents.map((doc: any) => doc.id),
      });
    });

    test('example: sharing workflow', async ({
      setupHelpers,
      pageHelpers,
      testFactories,
      commonAssertions,
      apiHelper,
    }) => {
      // Setup with specific test data
      const userData = await setupHelpers.setupAuthenticatedTest({
        userType: 'regular',
      });

      // Create and upload document for sharing
      const shareDocument = testFactories.createTestDocument({
        title: 'Document to Share',
        isPublic: true,
        tags: ['shared', 'example'],
      });

      const uploaded = await apiHelper.uploadJSON(shareDocument.content, {
        title: shareDocument.title,
        isPublic: shareDocument.isPublic,
        tags: shareDocument.tags,
      });

      // Navigate to document and test sharing
      await pageHelpers.navigateToViewer(uploaded.id);
      await pageHelpers.openShareModal();

      // Get share URL and test it works
      const shareUrl = `${page.url().split('/').slice(0, 3).join('/')}/library/${uploaded.shareId}`;
      
      await commonAssertions.assertShareLinkWorks(shareUrl, {
        checkAnonymousAccess: true,
        expectedTitle: shareDocument.title,
        checkEmbedding: true,
      });

      await setupHelpers.cleanupTestData({
        documentIds: [uploaded.id],
      });
    });
  });

  test.describe('Performance Testing Examples', () => {
    test('example: large data handling', async ({
      setupHelpers,
      pageHelpers,
      commonAssertions,
    }) => {
      // Setup large data test environment
      const performanceData = await setupHelpers.setupLargeDataTest({
        dataSize: 'large',
        userType: 'regular',
        monitorPerformance: true,
      });

      // Navigate to the large document
      await pageHelpers.navigateToViewer(performanceData.uploadedDocument.id);

      // Assert that large JSON loads properly
      await commonAssertions.assertJsonVisible({
        expectedNodeCount: 1000, // Expect many nodes
        checkForErrors: true,
      });

      // Test search functionality on large data
      await pageHelpers.searchJsonContent('test-value');
      
      // Take performance screenshot
      await pageHelpers.takeScreenshot('large-data-performance', {
        fullPage: true,
      });

      await setupHelpers.cleanupTestData({
        documentIds: [performanceData.uploadedDocument.id],
      });
    });

    test('example: stress test with extreme data', async ({
      setupHelpers,
      testFactories,
      pageHelpers,
      commonAssertions,
    }) => {
      // Create extreme size data
      const extremeData = testFactories.createLargeTestData({
        objectCount: 5000,
        arraySize: 200,
        nestingDepth: 7,
        includeLargeStrings: true,
      });

      await setupHelpers.setupAnonymousTest();
      await pageHelpers.navigateToViewer();

      // Input extreme data and test handling
      await pageHelpers.inputJsonText(extremeData);

      // Should handle extreme data gracefully
      await commonAssertions.assertJsonVisible({
        checkForErrors: true,
        viewMode: 'tree',
      });

      // Test that UI remains responsive
      await pageHelpers.switchViewMode('raw');
      await pageHelpers.switchViewMode('tree');
    });
  });

  test.describe('Library and Search Examples', () => {
    test('example: library browsing and filtering', async ({
      setupHelpers,
      pageHelpers,
      commonAssertions,
      testFactories,
    }) => {
      // Setup library with test documents
      const libraryData = await setupHelpers.setupLibraryTest({
        publicDocuments: 10,
        privateDocuments: 5,
        categories: ['api', 'config', 'sample'],
        tags: ['json', 'test', 'demo'],
      });

      // Test library browsing
      await pageHelpers.navigateToPublicLibrary();
      
      // Test filtering by category
      await pageHelpers.filterByCategory('api');
      await commonAssertions.assertLibraryContains(
        libraryData.documents.filter((doc: any) => doc.category === 'api'),
        { libraryType: 'public' }
      );

      // Test search functionality
      await pageHelpers.searchLibrary('test');
      await commonAssertions.assertSearchWorks('test', ['Test'], {
        searchType: 'title',
      });

      // Test saved documents
      await pageHelpers.navigateToLibrary();
      await commonAssertions.assertLibraryContains(
        libraryData.documents.filter((doc: any) => !doc.isPublic),
        { libraryType: 'user' }
      );

      await setupHelpers.cleanupTestData({
        documentIds: libraryData.documents.map((doc: any) => doc.id),
      });
    });
  });

  test.describe('Error Handling Examples', () => {
    test('example: network error handling', async ({
      setupHelpers,
      pageHelpers,
      commonAssertions,
    }) => {
      // Setup network interception for error testing
      const networkControl = await setupHelpers.setupNetworkInterception({
        blockPatterns: ['**/api/json/**'],
        offlineMode: false,
      });

      await setupHelpers.setupAnonymousTest();
      await pageHelpers.navigateToViewer();

      // Try to input JSON when API is blocked
      await pageHelpers.inputJsonText('{"test": "data"}');

      // Should handle network errors gracefully
      await commonAssertions.assertErrorDisplayed('network', {
        expectedMessage: 'connection',
        dismissible: true,
      });

      // Restore network and verify recovery
      await networkControl.restoreNetwork();
      await pageHelpers.inputJsonText('{"test": "data"}');
      await commonAssertions.assertJsonVisible();
    });

    test('example: malformed JSON handling', async ({
      pageHelpers,
      commonAssertions,
      testFactories,
      setupHelpers,
    }) => {
      await setupHelpers.setupAnonymousTest();
      await pageHelpers.navigateToViewer();

      // Test various malformed JSON strings
      const malformedJsonSamples = [
        '{"incomplete": true',
        '{"trailing": "comma",}',
        '{duplicate: "key", duplicate: "value"}',
        '{"unquoted": key}',
      ];

      for (const malformedJson of malformedJsonSamples) {
        await pageHelpers.inputJsonText(malformedJson);
        
        // Should display appropriate error
        await commonAssertions.assertErrorDisplayed('json', {
          expectedMessage: 'Invalid',
        });
      }

      // Test recovery with valid JSON
      const validData = testFactories.createTestDocument({ size: 'small' });
      await pageHelpers.inputJsonText(validData.content);
      await commonAssertions.assertJsonVisible({
        checkForErrors: true,
      });
    });
  });

  test.describe('Modal and Form Examples', () => {
    test('example: modal interactions', async ({
      setupHelpers,
      pageHelpers,
      commonAssertions,
      testFactories,
    }) => {
      await setupHelpers.setupAuthenticatedTest({ userType: 'regular' });

      // Create test document
      const testDoc = testFactories.createTestDocument({
        title: 'Modal Test Document',
      });

      await pageHelpers.navigateToViewer();
      await pageHelpers.inputJsonText(testDoc.content);

      // Test save modal
      await pageHelpers.openSaveModal();
      await commonAssertions.assertModalOpen('save', {
        expectedTitle: 'Save',
        checkCloseButton: true,
      });

      // Fill form and submit
      await pageHelpers.fillDocumentForm({
        title: testDoc.title,
        description: testDoc.description,
        tags: testDoc.tags,
        isPublic: false,
      });

      await pageHelpers.submitForm();

      // Verify save success
      await commonAssertions.assertDocumentSaved({
        expectedTitle: testDoc.title,
      });
    });
  });
});

/**
 * Example of how to use utilities in a more traditional test structure
 */
test.describe('Traditional Test Structure with Utilities', () => {
  test.beforeEach(async ({ setupHelpers }) => {
    // Use setup helper in beforeEach
    await setupHelpers.setupAnonymousTest({
      clearStorage: true,
      waitForReady: true,
    });
  });

  test.afterEach(async ({ setupHelpers }) => {
    // Use cleanup helper in afterEach
    await setupHelpers.cleanupTestData({
      clearStorage: true,
    });
  });

  test('traditional structure example', async ({
    pageHelpers,
    testFactories,
    commonAssertions,
  }) => {
    // Create test data
    const testDoc = testFactories.createTestDocument({ size: 'medium' });

    // Navigate and input
    await pageHelpers.navigateToViewer();
    await pageHelpers.inputJsonText(testDoc.content);

    // Assert results
    await commonAssertions.assertJsonVisible();
    await commonAssertions.assertAnonymous();

    // Take screenshot for documentation
    await pageHelpers.takeScreenshot('traditional-example');
  });
});
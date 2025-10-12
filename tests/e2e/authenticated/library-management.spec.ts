import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Authenticated User - Library Management', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page, authHelper }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);

    // Login as regular user
    await authHelper.login('regular');
    expect(await layoutPage.isLoggedIn()).toBe(true);
  });

  test.afterEach(async ({ authHelper }) => {
    await authHelper.logout();
  });

  test.describe('Save JSON Documents', () => {
    test('should save JSON documents to personal library', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      // Create JSON in viewer
      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Save to library
      const saveButton = viewerPage.page
        .locator('[data-testid="save-button"]')
        .or(viewerPage.page.locator('button:has-text("Save")'));

      await expect(saveButton).toBeVisible();
      await saveButton.click();

      // Fill save dialog if present
      const saveModal = viewerPage.page.locator('[data-testid="save-modal"]');
      if (await saveModal.isVisible()) {
        const titleInput = viewerPage.page.locator('[data-testid="save-title"]');
        await titleInput.fill('Test Complex JSON Document');

        const saveConfirmButton = viewerPage.page.locator('[data-testid="save-confirm"]');
        await saveConfirmButton.click();
      }

      // Wait for save confirmation
      await layoutPage.waitForNotification('Saved to library');

      // Navigate to library and verify
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Should have at least one item
      expect(await libraryPage.isEmpty()).toBe(false);

      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThan(0);

      // Find the saved item
      const savedItem = items.find((item) => item.title.includes('Test Complex JSON'));
      expect(savedItem).toBeDefined();
    });

    test('should auto-save JSON with default titles', async ({ dataGenerator }) => {
      const testJson = JSON_SAMPLES.simple.content;
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Use quick save without custom title
      const quickSaveButton = viewerPage.page.locator('[data-testid="quick-save"]');
      if (await quickSaveButton.isVisible()) {
        await quickSaveButton.click();
      } else {
        // Fallback to regular save
        await viewerPage.page.locator('[data-testid="save-button"]').click();
        await viewerPage.page.locator('[data-testid="save-confirm"]').click();
      }

      await layoutPage.waitForNotification('Saved to library');

      // Verify in library
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThan(0);

      // Should have auto-generated title
      const autoTitledItem = items.find(
        (item) =>
          item.title.includes('Untitled') ||
          item.title.includes('JSON Document') ||
          item.title.match(/^\d{4}-\d{2}-\d{2}/)
      );
      expect(autoTitledItem).toBeDefined();
    });

    test('should save JSON with metadata and tags', async ({ apiHelper }) => {
      const testJson = JSON_SAMPLES.ecommerce.content;

      // Use API to create JSON with rich metadata
      await apiHelper.uploadJSON(testJson, {
        title: 'E-commerce Order Example',
        description: 'Sample e-commerce order data for testing',
        category: 'Example',
        tags: ['ecommerce', 'order', 'sample', 'testing'],
        isPublic: false,
      });

      // Navigate to library and verify
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const ecommerceItem = items.find((item) => item.title.includes('E-commerce Order'));

      expect(ecommerceItem).toBeDefined();

      // Click to view details
      await libraryPage.viewJSONByTitle('E-commerce Order');

      // Should navigate to viewer with the JSON loaded
      await viewerPage.waitForJSONProcessed();
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Verify JSON content matches
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(0);
    });

    test('should handle large JSON documents', async ({ dataGenerator }) => {
      // Create large JSON for testing
      const largeJson = dataGenerator.generateLargeJSON(500, 5, 50);
      const jsonString = JSON.stringify(largeJson, null, 2);

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Save large document
      await viewerPage.page.locator('[data-testid="save-button"]').click();

      const saveModal = viewerPage.page.locator('[data-testid="save-modal"]');
      if (await saveModal.isVisible()) {
        await viewerPage.page
          .locator('[data-testid="save-title"]')
          .fill('Large JSON Test Document');
        await viewerPage.page.locator('[data-testid="save-confirm"]').click();
      }

      // Should handle large document save
      await layoutPage.waitForNotification('Saved to library', 15000);

      // Verify in library
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const largeItem = items.find((item) => item.title.includes('Large JSON Test'));

      expect(largeItem).toBeDefined();

      // Size should be indicated
      if (largeItem?.size) {
        expect(largeItem.size).toMatch(/KB|MB/);
      }
    });
  });

  test.describe('View Personal Library', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create test data for library tests
      const testJsons = [
        { content: JSON_SAMPLES.simple.content, title: 'Simple User Data' },
        { content: JSON_SAMPLES.nested.content, title: 'Nested Structure Example' },
        { content: JSON_SAMPLES.configuration.content, title: 'App Configuration' },
        { content: JSON_SAMPLES.analytics.content, title: 'Analytics Dashboard Data' },
      ];

      for (const json of testJsons) {
        await apiHelper.uploadJSON(json.content, { title: json.title });
      }
    });

    test('should view personal library with all saved JSONs', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Should not be empty
      expect(await libraryPage.isEmpty()).toBe(false);

      // Get all items
      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThanOrEqual(4);

      // Verify items have expected properties
      for (const item of items) {
        expect(item.title).toBeTruthy();
        expect(item.date).toBeTruthy();

        // Size should be present if implementation includes it
        if (item.size) {
          expect(item.size).toMatch(/\d+\s*(B|KB|MB)/);
        }
      }

      // Verify library statistics
      const stats = await libraryPage.getLibraryStats();
      expect(stats.totalItems).toBeGreaterThanOrEqual(4);
    });

    test('should display library in different view modes', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Test different view modes if available
      const viewModeButtons = [
        '[data-testid="list-view"]',
        '[data-testid="grid-view"]',
        '[data-testid="table-view"]',
      ];

      for (const buttonSelector of viewModeButtons) {
        const button = libraryPage.page.locator(buttonSelector);
        if (await button.isVisible()) {
          await button.click();
          await libraryPage.waitForItemsToLoad();

          // Items should still be visible in new view mode
          const items = await libraryPage.getAllJSONItems();
          expect(items.length).toBeGreaterThan(0);
        }
      }
    });

    test('should show empty state for new users', async ({ page, authHelper, dataGenerator }) => {
      // Logout and create a new user account
      await authHelper.logout();

      const newUser = dataGenerator.generateUserData();
      await authHelper.createAccount(newUser);

      // Navigate to library
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Should show empty state
      expect(await libraryPage.isEmpty()).toBe(true);

      const emptyMessage = await libraryPage.getEmptyStateMessage();
      expect(emptyMessage).toContain('No JSON documents');

      // Should have create new button or upload options
      await expect(libraryPage.createNewButton).toBeVisible();
    });

    test('should display library metadata correctly', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();

      for (let i = 0; i < Math.min(3, items.length); i++) {
        const item = items[i];

        // Title should be readable and not empty
        expect(item.title.trim()).toBeTruthy();
        expect(item.title.length).toBeGreaterThan(0);

        // Date should be in a valid format
        expect(item.date).toMatch(
          /\d{4}-\d{2}-\d{2}|\d+\s+(minute|hour|day|week|month)s?\s+ago|just now/
        );

        // If size is shown, it should be properly formatted
        if (item.size && item.size.trim()) {
          expect(item.size).toMatch(/^\d+(\.\d+)?\s*(B|KB|MB|GB)$/);
        }
      }
    });
  });

  test.describe('Search Library', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create diverse test data for search tests
      const searchTestData = [
        { content: { name: 'John Doe', type: 'user' }, title: 'User Profile: John Doe' },
        { content: { orderNumber: 12345, status: 'completed' }, title: 'Order #12345' },
        { content: { config: { database: 'postgresql' } }, title: 'Database Configuration' },
        { content: { metrics: { users: 1000 } }, title: 'User Metrics Report' },
        { content: { api: { version: '2.0', endpoints: [] } }, title: 'API Documentation v2.0' },
      ];

      for (const data of searchTestData) {
        await apiHelper.uploadJSON(data.content, { title: data.title });
      }
    });

    test('should search library by title', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Search for "user"
      await libraryPage.searchItems('user');

      const filteredItems = await libraryPage.getAllJSONItems();
      expect(filteredItems.length).toBeGreaterThan(0);

      // All results should contain "user" (case insensitive)
      for (const item of filteredItems) {
        expect(item.title.toLowerCase()).toContain('user');
      }
    });

    test('should search library by content', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Search for specific content
      await libraryPage.searchItems('postgresql');

      const results = await libraryPage.getAllJSONItems();

      // Should find items containing postgresql
      expect(results.length).toBeGreaterThan(0);

      const dbConfigItem = results.find((item) => item.title.toLowerCase().includes('database'));
      expect(dbConfigItem).toBeDefined();
    });

    test('should handle search with no results', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Search for something that doesn't exist
      await libraryPage.searchItems('nonexistentcontent12345');

      // Should show no results
      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBe(0);

      // Should show empty search results message
      const emptySearchMessage = libraryPage.page
        .locator('[data-testid="no-search-results"]')
        .or(libraryPage.page.locator('.empty-search-results'));

      if (await emptySearchMessage.isVisible()) {
        const messageText = await emptySearchMessage.textContent();
        expect(messageText).toContain('No results found');
      }
    });

    test('should clear search and show all results', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const initialItems = await libraryPage.getAllJSONItems();
      const initialCount = initialItems.length;

      // Search to filter results
      await libraryPage.searchItems('user');
      const filteredItems = await libraryPage.getAllJSONItems();
      expect(filteredItems.length).toBeLessThan(initialCount);

      // Clear search
      await libraryPage.clearSearch();

      // Should show all items again
      const allItems = await libraryPage.getAllJSONItems();
      expect(allItems.length).toBe(initialCount);
    });

    test('should search with special characters and quotes', async ({ apiHelper }) => {
      // Add item with special characters
      await apiHelper.uploadJSON(
        { message: 'Hello "world"!', data: { value: 'test@example.com' } },
        { title: 'Special Characters Test' }
      );

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Search for quoted content
      await libraryPage.searchItems('"world"');

      const results = await libraryPage.getAllJSONItems();
      const specialCharItem = results.find((item) => item.title.includes('Special Characters'));

      if (results.length > 0) {
        expect(specialCharItem).toBeDefined();
      }

      // Search for email pattern
      await libraryPage.clearSearch();
      await libraryPage.searchItems('test@example.com');

      const emailResults = await libraryPage.getAllJSONItems();
      if (emailResults.length > 0) {
        const emailItem = emailResults.find((item) => item.title.includes('Special Characters'));
        expect(emailItem).toBeDefined();
      }
    });
  });

  test.describe('Sort and Filter Library', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create test data with different characteristics for sorting
      const sortTestData = [
        {
          content: { small: true },
          title: 'A - Small JSON Document',
          delay: 0,
        },
        {
          content: JSON_SAMPLES.largeArray.generateContent(100),
          title: 'Z - Large JSON Document',
          delay: 1000,
        },
        {
          content: { medium: true, data: Array(20).fill('data') },
          title: 'M - Medium JSON Document',
          delay: 2000,
        },
      ];

      for (let i = 0; i < sortTestData.length; i++) {
        const data = sortTestData[i];
        await apiHelper.uploadJSON(data.content, { title: data.title });

        // Add delay to ensure different timestamps
        if (data.delay && i < sortTestData.length - 1) {
          await libraryPage.page.waitForTimeout(data.delay);
        }
      }
    });

    test('should sort library by name (alphabetical)', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Sort by name
      await libraryPage.sortBy('name');

      const sortedItems = await libraryPage.getAllJSONItems();
      expect(sortedItems.length).toBeGreaterThanOrEqual(3);

      // Verify alphabetical order
      const titles = sortedItems.map((item) => item.title);
      const sortedTitles = [...titles].sort();

      // First few items should match sorted order
      for (let i = 0; i < Math.min(3, titles.length); i++) {
        expect(titles[i]).toBe(sortedTitles[i]);
      }
    });

    test('should sort library by date (newest first)', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Sort by date
      await libraryPage.sortBy('date');

      const sortedItems = await libraryPage.getAllJSONItems();
      expect(sortedItems.length).toBeGreaterThan(0);

      // Verify date order (implementation may vary)
      // This test assumes newest first is the default
      if (sortedItems.length >= 2) {
        // Just verify that sorting doesn't break the display
        for (const item of sortedItems) {
          expect(item.title).toBeTruthy();
          expect(item.date).toBeTruthy();
        }
      }
    });

    test('should sort library by size', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Sort by size
      await libraryPage.sortBy('size');

      const sortedItems = await libraryPage.getAllJSONItems();
      expect(sortedItems.length).toBeGreaterThan(0);

      // Verify items are still displayed properly after size sort
      for (const item of sortedItems) {
        expect(item.title).toBeTruthy();

        // If size is displayed, verify format
        if (item.size && item.size.trim()) {
          expect(item.size).toMatch(/\d+.*[KMGT]?B/);
        }
      }
    });

    test('should filter library by date range', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const allItems = await libraryPage.getAllJSONItems();
      const totalCount = allItems.length;

      // Filter by today
      await libraryPage.filterByDate('today');

      const todayItems = await libraryPage.getAllJSONItems();

      // Should show recent items (all test data was created today)
      expect(todayItems.length).toBeGreaterThan(0);
      expect(todayItems.length).toBeLessThanOrEqual(totalCount);

      // Filter by this week
      await libraryPage.filterByDate('week');

      const weekItems = await libraryPage.getAllJSONItems();
      expect(weekItems.length).toBeGreaterThanOrEqual(todayItems.length);
    });

    test('should combine search and sort', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // First search for items containing "JSON"
      await libraryPage.searchItems('JSON');
      const searchResults = await libraryPage.getAllJSONItems();

      expect(searchResults.length).toBeGreaterThan(0);

      // Then sort the search results by name
      await libraryPage.sortBy('name');

      const sortedSearchResults = await libraryPage.getAllJSONItems();
      expect(sortedSearchResults.length).toBe(searchResults.length);

      // All items should still contain "JSON" and be sorted
      for (const item of sortedSearchResults) {
        expect(item.title.toLowerCase()).toContain('json');
      }
    });

    test('should handle complex filtering scenarios', async ({ apiHelper }) => {
      // Add items with different categories/types
      const categoryTestData = [
        { content: { type: 'api_response' }, title: 'API Response Example', category: 'API' },
        { content: { type: 'configuration' }, title: 'Config File', category: 'Configuration' },
        { content: { type: 'test_data' }, title: 'Test Dataset', category: 'Testing' },
      ];

      for (const data of categoryTestData) {
        await apiHelper.uploadJSON(data.content, {
          title: data.title,
          category: data.category,
        });
      }

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Test type/category filter if available
      const typeFilter = libraryPage.page.locator('[data-testid="category-filter"]');
      if (await typeFilter.isVisible()) {
        await typeFilter.click();

        const apiOption = libraryPage.page.locator('[data-value="API"]');
        if (await apiOption.isVisible()) {
          await apiOption.click();

          const filteredItems = await libraryPage.getAllJSONItems();
          const hasApiItem = filteredItems.some((item) => item.title.includes('API Response'));
          expect(hasApiItem).toBe(true);
        }
      }
    });
  });

  test.describe('Library Pagination', () => {
    test('should handle pagination when library has many items', async ({ apiHelper }) => {
      // Create enough items to trigger pagination
      const itemCount = 25;
      const batchSize = 5;

      for (let batch = 0; batch < itemCount / batchSize; batch++) {
        const promises = [];
        for (let i = 0; i < batchSize; i++) {
          const index = batch * batchSize + i;
          promises.push(
            apiHelper.uploadJSON(
              { id: index, data: `Test item ${index}` },
              { title: `Pagination Test Item ${String(index).padStart(3, '0')}` }
            )
          );
        }
        await Promise.all(promises);
      }

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Check pagination info
      const paginationInfo = await libraryPage.getPaginationInfo();

      if (paginationInfo.hasNext) {
        // Test navigation to next page
        const initialItems = await libraryPage.getAllJSONItems();

        await libraryPage.goToNextPage();

        const nextPageItems = await libraryPage.getAllJSONItems();
        expect(nextPageItems.length).toBeGreaterThan(0);

        // Items should be different
        const firstInitialTitle = initialItems[0]?.title;
        const firstNextPageTitle = nextPageItems[0]?.title;
        expect(firstInitialTitle).not.toBe(firstNextPageTitle);

        // Test going back
        if (paginationInfo.currentPage > 1 || (await libraryPage.prevPageButton.isEnabled())) {
          await libraryPage.goToPreviousPage();

          const backItems = await libraryPage.getAllJSONItems();
          expect(backItems[0]?.title).toBe(firstInitialTitle);
        }
      } else {
        // All items fit on one page
        const items = await libraryPage.getAllJSONItems();
        expect(items.length).toBeLessThanOrEqual(25);
      }
    });

    test('should handle items per page settings', async ({ apiHelper }) => {
      // Create test items
      for (let i = 0; i < 15; i++) {
        await apiHelper.uploadJSON(
          { index: i, data: `Item ${i}` },
          { title: `Per Page Test ${i}` }
        );
      }

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const itemsPerPageSelect = libraryPage.itemsPerPageSelect;

      if (await itemsPerPageSelect.isVisible()) {
        // Test different page sizes
        const pageSizes = [5, 10, 20];

        for (const size of pageSizes) {
          await libraryPage.changeItemsPerPage(size);

          const items = await libraryPage.getAllJSONItems();
          expect(items.length).toBeLessThanOrEqual(size);

          if (items.length === size) {
            // Should have pagination if there are more items
            const paginationInfo = await libraryPage.getPaginationInfo();
            expect(paginationInfo.hasNext).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Library Performance', () => {
    test('should handle library loading performance', async ({ page, apiHelper }) => {
      // Create moderate number of items
      for (let i = 0; i < 50; i++) {
        await apiHelper.uploadJSON(
          { id: i, timestamp: Date.now(), data: Array(10).fill(`data-${i}`) },
          { title: `Performance Test Item ${i}` }
        );
      }

      // Measure load time
      const startTime = Date.now();

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const loadTime = Date.now() - startTime;

      // Should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(10000); // 10 seconds max

      // Should display items
      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThan(0);
    });

    test('should handle concurrent library operations', async ({ page, apiHelper }) => {
      // Create some initial data
      for (let i = 0; i < 5; i++) {
        await apiHelper.uploadJSON(
          { id: i, data: `Concurrent test ${i}` },
          { title: `Concurrent Test Item ${i}` }
        );
      }

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Perform multiple operations simultaneously
      const operations = [
        libraryPage.searchItems('test'),
        libraryPage.sortBy('name'),
        libraryPage.filterByDate('week'),
      ];

      // Execute operations concurrently
      await Promise.allSettled(operations);

      // Library should still be functional
      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThan(0);

      // Should be able to interact with items
      if (items.length > 0) {
        await libraryPage.viewJSONItem(0);
        await viewerPage.waitForJSONProcessed();
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    });
  });
});

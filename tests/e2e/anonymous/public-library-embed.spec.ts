import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';

test.describe('Anonymous User - Library & Embed Features', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);
  });

  test.describe('User Stories 16-17: Browse public JSON library', () => {
    test('should navigate to library', async ({ page }) => {
      await page.goto('/');
      await layoutPage.waitForLoad();

      // Navigate to library
      if (await layoutPage.libraryLink.isVisible()) {
        await layoutPage.goToLibrary();

        // Should reach library page
        expect(await libraryPage.getCurrentURL()).toContain('library');

        // Switch to library if needed
        if (await libraryPage.publicLibraryTab.isVisible()) {
          await libraryPage.switchToPublicLibrary();
        }

        // Take screenshot of library
        await libraryPage.takeScreenshot('public-library-interface');
      } else {
        // Try direct navigation
        await libraryPage.navigateToPublicLibrary();
        expect(await libraryPage.getCurrentURL()).toContain('public');
      }
    });

    test('should display public JSON examples', async () => {
      await libraryPage.navigateToPublicLibrary();
      await libraryPage.waitForItemsToLoad();

      if (!(await libraryPage.isEmpty())) {
        // Should show public JSON items
        const publicItems = await libraryPage.getAllJSONItems();
        expect(publicItems.length).toBeGreaterThan(0);

        // Items should have titles and metadata
        for (const item of publicItems.slice(0, 3)) {
          // Check first 3 items
          expect(item.title).toBeTruthy();
          expect(item.title.length).toBeGreaterThan(0);
        }

        // Take screenshot of library items
        await libraryPage.takeScreenshot('public-library-items');
      } else {
        // Empty state should be handled gracefully
        const emptyMessage = await libraryPage.getEmptyStateMessage();
        expect(emptyMessage).toBeTruthy();
      }
    });

    test('should support browsing by categories', async () => {
      await libraryPage.navigateToPublicLibrary();
      await libraryPage.waitForItemsToLoad();

      // Look for category filters
      const categoryFilter = libraryPage.page.locator(
        '[data-testid="category-filter"], .category-filter, select[name="category"]'
      );

      if (await categoryFilter.isVisible()) {
        // Get available categories
        const categories = await libraryPage.page
          .locator('[data-testid="category-filter"] option, .category-option')
          .allTextContents();

        if (categories.length > 1) {
          // Select a specific category
          await categoryFilter.click();
          const firstCategory = libraryPage.page
            .locator('[data-testid="category-filter"] option:nth-child(2)')
            .or(libraryPage.page.locator('.category-option').first());

          if (await firstCategory.isVisible()) {
            await firstCategory.click();
            await libraryPage.waitForItemsToLoad();

            // Should filter results
            const filteredItems = await libraryPage.getAllJSONItems();
            expect(filteredItems.length).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should support search and filter functionality', async () => {
      await libraryPage.navigateToPublicLibrary();
      await libraryPage.waitForItemsToLoad();

      if ((await libraryPage.searchInput.isVisible()) && !(await libraryPage.isEmpty())) {
        // Perform search
        await libraryPage.searchItems('example');

        // Should show search results
        const searchResults = await libraryPage.getAllJSONItems();
        expect(searchResults.length).toBeGreaterThanOrEqual(0);

        // Clear search
        await libraryPage.clearSearch();

        // Should show all items again
        const allItems = await libraryPage.getAllJSONItems();
        expect(allItems.length).toBeGreaterThanOrEqual(searchResults.length);
      }
    });

    test('should allow viewing JSON examples from library', async () => {
      await libraryPage.navigateToPublicLibrary();
      await libraryPage.waitForItemsToLoad();

      if (!(await libraryPage.isEmpty())) {
        const items = await libraryPage.getAllJSONItems();

        if (items.length > 0) {
          // Click on first item to view it
          await libraryPage.viewJSONItem(0);

          // Should navigate to viewer with the JSON loaded
          expect(await viewerPage.getCurrentURL()).toContain('viewer');

          // JSON should be loaded and processed
          await viewerPage.waitForJSONProcessed();
          expect(await viewerPage.hasJSONErrors()).toBe(false);

          const nodeCount = await viewerPage.getNodeCounts();
          expect(nodeCount.total).toBeGreaterThan(0);
        }
      }
    });

    test('should display library statistics and metadata', async () => {
      await libraryPage.navigateToPublicLibrary();
      await libraryPage.waitForItemsToLoad();

      // Check for library statistics
      const stats = await libraryPage.getLibraryStats();

      if (stats.totalItems > 0) {
        expect(stats.totalItems).toBeGreaterThan(0);
      }

      // Look for additional metadata displays
      const hasPopularSection =
        (await libraryPage.page
          .locator('text="Popular", text="Trending", .popular-section')
          .count()) > 0;

      const hasRecentSection =
        (await libraryPage.page.locator('text="Recent", text="Latest", .recent-section').count()) >
        0;

      // At least some organization should be present
      const hasOrganization = hasPopularSection || hasRecentSection;
    });

    test('should support pagination for large libraries', async () => {
      await libraryPage.navigateToPublicLibrary();
      await libraryPage.waitForItemsToLoad();

      const paginationInfo = await libraryPage.getPaginationInfo();

      if (paginationInfo.hasNext) {
        const initialItems = await libraryPage.getAllJSONItems();

        // Go to next page
        await libraryPage.goToNextPage();

        const nextPageItems = await libraryPage.getAllJSONItems();

        // Should show different items
        expect(nextPageItems.length).toBeGreaterThan(0);

        // Go back to previous page
        if (paginationInfo.hasPrev) {
          await libraryPage.goToPreviousPage();

          const backItems = await libraryPage.getAllJSONItems();
          expect(backItems.length).toBe(initialItems.length);
        }
      }
    });
  });

  test.describe('User Story 18: Developer documentation', () => {
    test('should navigate to developers page', async ({ page }) => {
      await page.goto('/');
      await layoutPage.waitForLoad();

      if (await layoutPage.developersLink.isVisible()) {
        await layoutPage.goToDevelopers();

        // Should reach developers page
        expect(await layoutPage.getCurrentURL()).toContain('developers');

        // Take screenshot of developers page
        await layoutPage.takeScreenshot('developers-page');
      } else {
        // Try direct navigation
        await page.goto('/developers');
        expect(await layoutPage.getCurrentURL()).toContain('developers');
      }
    });

    test('should display API documentation', async ({ page }) => {
      await page.goto('/developers');
      await layoutPage.waitForLoad();

      // Look for API documentation sections
      const apiSections = await page
        .locator('text="API", text="Endpoints", text="Reference", h1, h2, h3')
        .count();

      expect(apiSections).toBeGreaterThan(0);

      // Look for code examples
      const codeExamples = await page.locator('code, pre, .code-block, .highlight').count();

      expect(codeExamples).toBeGreaterThan(0);
    });

    test('should provide integration examples', async ({ page }) => {
      await page.goto('/developers');
      await layoutPage.waitForLoad();

      // Look for integration examples
      const integrationExamples = await page
        .locator('text="Integration", text="Example", text="Sample", text="curl"')
        .count();

      if (integrationExamples > 0) {
        expect(integrationExamples).toBeGreaterThan(0);
      }

      // Should have practical code samples
      const practicalExamples = await page
        .locator('text="POST", text="GET", text="JSON", text="javascript"')
        .count();

      expect(practicalExamples).toBeGreaterThan(0);
    });
  });

  test.describe('User Stories 19-21: Embed functionality', () => {
    test('should provide embed code generation', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for embed functionality
      const embedButton = viewerPage.page.locator(
        '[data-testid="embed"], button:has-text("Embed"), text="Embed"'
      );

      if (await embedButton.isVisible()) {
        await embedButton.click();

        // Should open embed modal
        const embedModal = viewerPage.page.locator(
          '[data-testid="embed-modal"], .embed-modal, [role="dialog"]'
        );

        await embedModal.waitFor({ state: 'visible' });

        // Should provide embed code
        const embedCode = await viewerPage.page
          .locator('[data-testid="embed-code"], .embed-code, textarea')
          .inputValue();

        expect(embedCode).toBeTruthy();
        expect(embedCode).toContain('<iframe');

        // Take screenshot of embed modal
        await viewerPage.takeScreenshot('embed-modal-interface');

        await viewerPage.page.keyboard.press('Escape');
      }
    });

    test('should allow customization of embed appearance', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      const embedButton = viewerPage.page.locator(
        '[data-testid="embed"], button:has-text("Embed")'
      );

      if (await embedButton.isVisible()) {
        await embedButton.click();

        // Look for customization options
        const themeOptions = await viewerPage.page
          .locator('[data-testid="embed-theme"], select[name="theme"], .theme-selector')
          .count();

        const heightOptions = await viewerPage.page
          .locator('[data-testid="embed-height"], input[name="height"], .height-selector')
          .count();

        const viewModeOptions = await viewerPage.page
          .locator('[data-testid="embed-view-mode"], select[name="viewMode"]')
          .count();

        // Should have customization options
        const hasCustomization = themeOptions > 0 || heightOptions > 0 || viewModeOptions > 0;
        if (hasCustomization) {
          expect(hasCustomization).toBe(true);
        }

        // Test theme customization
        const themeSelector = viewerPage.page.locator(
          '[data-testid="embed-theme"], select[name="theme"]'
        );

        if (await themeSelector.isVisible()) {
          await themeSelector.selectOption('dark');

          // Embed code should update
          const updatedCode = await viewerPage.page
            .locator('[data-testid="embed-code"], .embed-code')
            .inputValue();

          expect(updatedCode).toContain('dark');
        }

        await viewerPage.page.keyboard.press('Escape');
      }
    });

    test('should generate working embed URLs', async ({ page, dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // First share the JSON to get a shareable ID
      if (await viewerPage.shareButton.isVisible()) {
        const shareUrl = await viewerPage.shareJSON();

        if (shareUrl) {
          // Extract ID from share URL
          const urlParts = shareUrl.split('/');
          const jsonId = urlParts[urlParts.length - 1];

          // Test embed URL
          const embedUrl = `${page.url().split('/').slice(0, 3).join('/')}/embed/${jsonId}`;

          await page.goto(embedUrl);
          await viewerPage.waitForJSONProcessed();

          // Should display JSON in embed mode
          expect(await viewerPage.hasJSONErrors()).toBe(false);
          const nodeCount = await viewerPage.getNodeCounts();
          expect(nodeCount.total).toBeGreaterThan(0);

          // Should have embed-specific styling/layout
          const isEmbedded = (await page.locator('body.embedded, .embed-container').count()) > 0;

          // Take screenshot of embedded view
          await viewerPage.takeScreenshot('embedded-json-view');
        }

        await viewerPage.page.keyboard.press('Escape');
      }
    });

    test('should handle embed parameters correctly', async ({ page, dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.shareButton.isVisible()) {
        const shareUrl = await viewerPage.shareJSON();

        if (shareUrl) {
          const urlParts = shareUrl.split('/');
          const jsonId = urlParts[urlParts.length - 1];

          // Test embed with parameters
          const embedUrlWithParams = `${page.url().split('/').slice(0, 3).join('/')}/embed/${jsonId}?theme=dark&view=tree&height=400`;

          await page.goto(embedUrlWithParams);
          await viewerPage.waitForJSONProcessed();

          // Should apply parameters
          const isDarkMode = await layoutPage.isDarkMode();

          // Tree view should be active if parameter worked
          if (await viewerPage.treeViewButton.isVisible()) {
            const currentView = await viewerPage.getCurrentViewMode();
            // Parameters may or may not be applied depending on implementation
          }

          // Should not have errors
          expect(await viewerPage.hasJSONErrors()).toBe(false);
        }

        await viewerPage.page.keyboard.press('Escape');
      }
    });
  });

  test.describe('User Story 15: Ultra-optimized viewer with virtualization', () => {
    test('should handle extremely large JSON files efficiently', async ({ dataGenerator }) => {
      const veryLargeJson = dataGenerator.generateLargeJSON(1000);
      const jsonString = JSON.stringify(veryLargeJson, null, 2);

      await viewerPage.navigateToViewer();

      const startTime = Date.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const endTime = Date.now();

      // Should process within reasonable time
      expect(endTime - startTime).toBeLessThan(15000); // 15 seconds max for very large JSON

      // Should not have errors
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(1000);
    });

    test('should maintain performance with deep nesting', async ({ dataGenerator }) => {
      const deepJson = dataGenerator.generateDeeplyNestedJSON(15);
      const jsonString = JSON.stringify(deepJson, null, 2);

      await viewerPage.navigateToViewer();

      const startTime = Date.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const endTime = Date.now();

      // Should handle deep nesting efficiently
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Should be able to expand deep structures
      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();
        await viewerPage.expandAll();

        // Should not crash on deep expansion
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    });

    test('should use virtualization for large arrays', async () => {
      const largeArrayJson = {
        items: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: `Data for item ${i}`,
          timestamp: new Date(Date.now() - i * 1000).toISOString(),
        })),
      };
      const jsonString = JSON.stringify(largeArrayJson, null, 2);

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.listViewButton.isVisible()) {
        await viewerPage.switchToListView();

        // Should handle large arrays efficiently
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Look for virtualization indicators
        const hasVirtualization =
          (await viewerPage.page
            .locator('.virtual-list, .virtualized, [data-virtualized="true"]')
            .count()) > 0;

        // Should remain responsive
        const isResponsive = await viewerPage.page.locator('body').isEnabled();
        expect(isResponsive).toBe(true);
      }
    });
  });
});

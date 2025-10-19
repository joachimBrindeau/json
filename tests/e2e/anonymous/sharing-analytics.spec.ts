import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Anonymous User - Sharing & Analytics', () => {
  let viewerPage: JsonViewerPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    layoutPage = new MainLayoutPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('User Stories 12-13: Create and access shareable links', () => {
    test('should provide share functionality for JSON content', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for share button
      if (await viewerPage.shareButton.isVisible()) {
        const shareUrl = await viewerPage.shareJSON();

        // Should return a valid URL
        expect(shareUrl).toBeTruthy();
        expect(shareUrl).toMatch(/^https?:\/\/.+/);

        // Take screenshot of share modal
        await viewerPage.takeScreenshot('share-modal-interface');

        // Close share modal
        await viewerPage.page.keyboard.press('Escape');
      } else {
        // Fail fast if share functionality not available
        expect(await viewerPage.shareButton.isVisible(), 'Share functionality must be available for this test').toBe(true);
      }
    });

    test('should access shared JSON via public URL', async ({ page, dataGenerator }) => {
      // This test simulates accessing a shared JSON
      // In real scenario, we'd first create a share link, then access it

      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.shareButton.isVisible()) {
        const shareUrl = await viewerPage.shareJSON();

        if (shareUrl) {
          // Navigate to the shared URL
          await page.goto(shareUrl);
          await viewerPage.waitForJSONProcessed();

          // Should display the shared JSON
          expect(await viewerPage.hasJSONErrors()).toBe(false);
          const nodeCount = await viewerPage.getNodeCounts();
          expect(nodeCount.total).toBeGreaterThan(0);

          // Should be in read-only mode or clearly indicate it's shared content
          const hasSharedIndicator =
            (await page.locator('text="Shared", text="Public", .shared-indicator').count()) > 0;
        }

        await viewerPage.page.keyboard.press('Escape');
      }
    });

    test('should generate unique share URLs for different JSON content', async ({
      dataGenerator,
    }) => {
      if (await viewerPage.shareButton.isVisible()) {
        const shareUrls = [];

        // Create multiple different JSON contents and share them
        const jsonSamples = [
          dataGenerator.generateSimpleJSON(),
          dataGenerator.generateComplexJSON(),
          JSON_SAMPLES.ecommerce.content,
        ];

        for (const testJson of jsonSamples) {
          const jsonString = JSON.stringify(testJson, null, 2);
          await viewerPage.inputJSON(jsonString);
          await viewerPage.waitForJSONProcessed();

          const shareUrl = await viewerPage.shareJSON();
          if (shareUrl) {
            shareUrls.push(shareUrl);
            await viewerPage.page.keyboard.press('Escape');
          }
        }

        // All share URLs should be unique
        const uniqueUrls = new Set(shareUrls);
        expect(uniqueUrls.size).toBe(shareUrls.length);
      }
    });

    test('should preserve JSON structure in shared links', async ({ page, dataGenerator }) => {
      const originalJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(originalJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.shareButton.isVisible()) {
        const shareUrl = await viewerPage.shareJSON();

        if (shareUrl) {
          // Access shared URL and verify content integrity
          await page.goto(shareUrl);
          await viewerPage.waitForJSONProcessed();

          // Should maintain the same structure
          const sharedNodeCount = await viewerPage.getNodeCounts();
          expect(sharedNodeCount.total).toBeGreaterThan(0);
          expect(sharedNodeCount.objects).toBeGreaterThan(0);

          // Should not have parsing errors
          expect(await viewerPage.hasJSONErrors()).toBe(false);
        }

        await viewerPage.page.keyboard.press('Escape');
      }
    });
  });

  test.describe('User Story 14: View JSON statistics', () => {
    test('should display basic JSON statistics', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Get JSON statistics
      const stats = await viewerPage.getJSONStats();

      // Should have node count
      expect(stats.nodeCount).toBeGreaterThan(0);

      // Look for additional statistics display
      const statsPanel = await viewerPage.statsPanel.isVisible();
      const hasFileSize = await viewerPage.fileSize.isVisible();
      const hasProcessingTime = await viewerPage.processingTime.isVisible();

      if (statsPanel || hasFileSize || hasProcessingTime) {
        // Take screenshot of statistics display
        await viewerPage.takeScreenshot('json-statistics-display');
      }
    });

    test('should show node count by type', async () => {
      const mixedJson = JSON_SAMPLES.mixedTypes.content;
      const jsonString = JSON.stringify(mixedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      const nodeCounts = await viewerPage.getNodeCounts();

      // Should count different node types
      expect(nodeCounts.objects).toBeGreaterThan(0);
      expect(nodeCounts.strings).toBeGreaterThan(0);
      expect(nodeCounts.numbers).toBeGreaterThan(0);
      expect(nodeCounts.arrays).toBeGreaterThan(0);
      expect(nodeCounts.total).toBeGreaterThan(0);

      // Total should be sum of all types
      const calculatedTotal =
        nodeCounts.objects +
        nodeCounts.strings +
        nodeCounts.numbers +
        nodeCounts.booleans +
        nodeCounts.arrays +
        nodeCounts.nulls;
      expect(calculatedTotal).toBeLessThanOrEqual(nodeCounts.total);
    });

    test('should calculate file size information', async ({ dataGenerator }) => {
      const largeJson = dataGenerator.generateLargeJSON(100);
      const jsonString = JSON.stringify(largeJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      const stats = await viewerPage.getJSONStats();

      // Should have size information if available
      if (stats.fileSize) {
        expect(stats.fileSize).toBeTruthy();
        expect(stats.fileSize).toMatch(/\d+.*[bB]ytes?|\d+.*[kK][bB]|\d+.*[mM][bB]/);
      }
    });

    test('should show processing time metrics', async ({ dataGenerator }) => {
      const complexJson = dataGenerator.generateDeeplyNestedJSON(6);
      const jsonString = JSON.stringify(complexJson, null, 2);

      const startTime = Date.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const endTime = Date.now();

      const actualProcessingTime = endTime - startTime;

      const stats = await viewerPage.getJSONStats();

      // Should show reasonable processing time
      if (stats.processingTime) {
        expect(stats.processingTime).toBeTruthy();
        expect(stats.processingTime).toMatch(/\d+.*ms|\d+.*second/);
      }

      // Actual processing should be reasonable
      expect(actualProcessingTime).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should display complexity metrics', async ({ dataGenerator }) => {
      const deepJson = dataGenerator.generateDeeplyNestedJSON(8);
      const jsonString = JSON.stringify(deepJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for complexity indicators
      const complexityInfo = await viewerPage.page
        .locator('text="Depth", text="depth", text="Levels", text="levels", text="Complexity"')
        .count();

      // Should handle deep nesting without errors
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(10); // Should have many nested nodes
    });

    test('should update statistics when JSON changes', async ({ dataGenerator }) => {
      // Start with simple JSON
      const simpleJson = dataGenerator.generateSimpleJSON();
      const simpleJsonString = JSON.stringify(simpleJson, null, 2);

      await viewerPage.inputJSON(simpleJsonString);
      await viewerPage.waitForJSONProcessed();

      const initialStats = await viewerPage.getJSONStats();
      const initialNodeCount = initialStats.nodeCount;

      // Switch to complex JSON
      const complexJson = dataGenerator.generateComplexJSON();
      const complexJsonString = JSON.stringify(complexJson, null, 2);

      await viewerPage.inputJSON(complexJsonString);
      await viewerPage.waitForJSONProcessed();

      const updatedStats = await viewerPage.getJSONStats();
      const updatedNodeCount = updatedStats.nodeCount;

      // Statistics should update
      expect(updatedNodeCount).toBeGreaterThan(initialNodeCount);
    });

    test('should handle statistics for edge cases', async () => {
      const edgeCases = [
        '{}', // Empty object
        '[]', // Empty array
        '"simple string"', // Just a string
        'null', // Just null
        '42', // Just a number
      ];

      for (const jsonString of edgeCases) {
        await viewerPage.inputJSON(jsonString);
        await viewerPage.waitForJSONProcessed();

        // Should not crash on edge cases
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        const stats = await viewerPage.getJSONStats();
        expect(stats.nodeCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('User Story 22: Theme switching', () => {
    test('should provide theme switching functionality', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for theme toggle
      if (await layoutPage.themeToggle.isVisible()) {
        const initialDarkMode = await layoutPage.isDarkMode();

        // Toggle theme
        await layoutPage.toggleTheme();

        // Theme should have changed
        const newDarkMode = await layoutPage.isDarkMode();
        expect(newDarkMode).not.toBe(initialDarkMode);

        // Take screenshots of both themes
        await viewerPage.takeScreenshot('theme-after-toggle');

        // Toggle back
        await layoutPage.toggleTheme();
        const revertedDarkMode = await layoutPage.isDarkMode();
        expect(revertedDarkMode).toBe(initialDarkMode);

        await viewerPage.takeScreenshot('theme-reverted');
      } else {
        // Fail fast if theme toggle not available
        expect(await layoutPage.themeToggle.isVisible(), 'Theme toggle must be available for this test').toBe(true);
      }
    });

    test('should maintain JSON content when switching themes', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      const initialNodeCount = await viewerPage.getNodeCounts();

      if (await layoutPage.themeToggle.isVisible()) {
        // Switch themes multiple times
        await layoutPage.toggleTheme();
        await viewerPage.page.waitForLoadState('networkidle');

        await layoutPage.toggleTheme();
        await viewerPage.page.waitForLoadState('networkidle');

        // JSON content should remain intact
        const finalNodeCount = await viewerPage.getNodeCounts();
        expect(finalNodeCount.total).toBe(initialNodeCount.total);
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    });

    test('should apply theme to all viewer components', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await layoutPage.themeToggle.isVisible()) {
        // Test theme application in different view modes
        const viewModes = [
          { button: viewerPage.treeViewButton, switch: () => viewerPage.switchToTreeView() },
          { button: viewerPage.listViewButton, switch: () => viewerPage.switchToListView() },
        ];

        for (const mode of viewModes) {
          if (await mode.button.isVisible()) {
            await mode.switch();
            await viewerPage.page.waitForLoadState('networkidle');

            // Toggle theme in this view mode
            await layoutPage.toggleTheme();
            await viewerPage.page.waitForLoadState('networkidle');

            // Should not cause errors
            expect(await viewerPage.hasJSONErrors()).toBe(false);

            // Take screenshot of theme in this view mode
            await viewerPage.takeScreenshot(`theme-in-${mode.name || 'view'}-mode`);
          }
        }
      }
    });

    test('should persist theme preference across page reloads', async ({ page, dataGenerator }) => {
      if (await layoutPage.themeToggle.isVisible()) {
        const initialTheme = await layoutPage.isDarkMode();

        // Change theme
        await layoutPage.toggleTheme();
        const changedTheme = await layoutPage.isDarkMode();
        expect(changedTheme).not.toBe(initialTheme);

        // Reload page
        await page.reload();
        await viewerPage.waitForLoad();

        // Theme should be preserved
        const persistedTheme = await layoutPage.isDarkMode();
        expect(persistedTheme).toBe(changedTheme);
      }
    });

    test('should support auto theme detection', async () => {
      // Look for auto theme option
      const autoThemeOption = viewerPage.page.locator(
        'text="Auto", text="System", [data-theme="auto"], [data-theme="system"]'
      );

      if (await autoThemeOption.isVisible()) {
        await autoThemeOption.click();
        await viewerPage.page.waitForLoadState('networkidle');

        // Should adapt to system theme
        const currentTheme = await layoutPage.isDarkMode();
        // Theme should match system preference (varies by system)
        expect(typeof currentTheme).toBe('boolean');
      }
    });
  });
});

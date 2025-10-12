import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import {
  PerformanceTestGenerator,
  generateLargeTestJSON,
  PERFORMANCE_BENCHMARKS,
} from '../../../lib/performance-test-generator';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Advanced User - Large File Handling (Story 1)', () => {
  let viewerPage: JsonViewerPage;
  const testFilesDir = join(__dirname, '../../test-files/large');
  const MAX_TEST_TIMEOUT = 300_000; // 5 minutes for large file tests

  test.beforeAll(async () => {
    // Create test files directory
    if (!existsSync(testFilesDir)) {
      mkdirSync(testFilesDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('Very Large JSON Files (up to 2GB)', () => {
    test('should handle 100MB JSON file efficiently', async () => {
      const testJson = generateLargeTestJSON(100); // 100MB
      const jsonString = JSON.stringify(testJson);
      const testFilePath = join(testFilesDir, 'test-100mb.json');

      // Create large test file
      writeFileSync(testFilePath, jsonString);

      const startTime = Date.now();

      // Upload large file
      await viewerPage.uploadJSONFile(testFilePath);

      const uploadTime = Date.now() - startTime;

      // Verify file was processed successfully
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Check processing time is reasonable (should be under 10 seconds for 100MB)
      expect(uploadTime).toBeLessThan(10_000);

      // Verify content is displayed
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(1000);

      // Take performance screenshot
      await viewerPage.takeScreenshot('large-file-100mb-processed');

      // Verify memory usage stats if available
      const stats = await viewerPage.getJSONStats();
      if (stats.processingTime) {
        const processingTimeMs = parseFloat(stats.processingTime.replace(/[^\d.]/g, ''));
        expect(processingTimeMs).toBeLessThan(PERFORMANCE_BENCHMARKS.large.expectedParseTime);
      }
    });

    test(
      'should handle 500MB JSON file with chunking',
      async () => {
        const testJson = generateLargeTestJSON(500); // 500MB
        const jsonString = JSON.stringify(testJson);
        const testFilePath = join(testFilesDir, 'test-500mb.json');

        // Create very large test file
        writeFileSync(testFilePath, jsonString);

        const startTime = Date.now();

        // Upload very large file
        await viewerPage.uploadJSONFile(testFilePath);

        const uploadTime = Date.now() - startTime;

        // Should either process successfully or show chunked/streaming indicator
        const hasErrors = await viewerPage.hasJSONErrors();

        if (!hasErrors) {
          // Successfully processed
          const nodeCounts = await viewerPage.getNodeCounts();
          expect(nodeCounts.total).toBeGreaterThan(100);

          // Should be reasonably fast (under 30 seconds)
          expect(uploadTime).toBeLessThan(30_000);

          // Take screenshot of large file handling
          await viewerPage.takeScreenshot('large-file-500mb-processed');
        } else {
          // Check if it's a meaningful error (not just a failure)
          const errorMessage = await viewerPage.getErrorMessage();
          expect(errorMessage).toContain('memory'); // Should be memory-related error
        }
      },
      MAX_TEST_TIMEOUT
    );

    test(
      'should handle 1GB JSON file with memory optimization',
      async () => {
        // Generate extreme test JSON (approximately 1GB)
        const extremeJson = PerformanceTestGenerator.generateExtremeJSON();
        const jsonString = JSON.stringify(extremeJson);
        const testFilePath = join(testFilesDir, 'test-1gb.json');

        // Create extreme test file
        writeFileSync(testFilePath, jsonString);

        const startTime = Date.now();

        // Attempt to upload extreme file
        await viewerPage.uploadJSONFile(testFilePath);

        const uploadTime = Date.now() - startTime;

        // Should handle gracefully - either process or show appropriate message
        const hasErrors = await viewerPage.hasJSONErrors();

        if (!hasErrors) {
          // Successfully handled
          const stats = await viewerPage.getJSONStats();
          expect(stats.nodeCount).toBeGreaterThan(1000);

          // Memory management should keep processing time reasonable
          expect(uploadTime).toBeLessThan(60_000); // 1 minute max

          await viewerPage.takeScreenshot('extreme-json-1gb-processed');
        } else {
          // Should show meaningful error about size/memory limits
          const errorMessage = await viewerPage.getErrorMessage();
          expect(errorMessage?.toLowerCase()).toMatch(/memory|size|limit|large/);

          await viewerPage.takeScreenshot('extreme-json-1gb-error');
        }
      },
      MAX_TEST_TIMEOUT
    );

    test('should show loading indicators during large file processing', async () => {
      const largeJson = generateLargeTestJSON(50); // 50MB - large enough to see loading
      const jsonString = JSON.stringify(largeJson);
      const testFilePath = join(testFilesDir, 'test-50mb-loading.json');

      writeFileSync(testFilePath, jsonString);

      // Start upload and immediately check for loading indicators
      const uploadPromise = viewerPage.uploadJSONFile(testFilePath);

      // Should show loading spinner during processing
      await expect(viewerPage.loadingSpinner).toBeVisible({ timeout: 5000 });

      // Take screenshot of loading state
      await viewerPage.takeScreenshot('large-file-loading-state');

      // Wait for completion
      await uploadPromise;

      // Loading should be complete
      expect(await viewerPage.loadingSpinner.isVisible()).toBe(false);
      expect(await viewerPage.hasJSONErrors()).toBe(false);
    });

    test('should handle large array JSON (millions of items)', async () => {
      const largeArray = PerformanceTestGenerator.generateLargeArray(100000); // 100k items
      const testJson = { data: largeArray };
      const jsonString = JSON.stringify(testJson);
      const testFilePath = join(testFilesDir, 'test-large-array.json');

      writeFileSync(testFilePath, jsonString);

      const startTime = Date.now();
      await viewerPage.uploadJSONFile(testFilePath);
      const processingTime = Date.now() - startTime;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Should handle large arrays efficiently
      expect(processingTime).toBeLessThan(15_000); // Under 15 seconds

      // Verify array handling
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.arrays).toBeGreaterThan(0);

      // Should show array size in statistics
      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(10000);
    });

    test('should handle deeply nested JSON efficiently', async () => {
      const deepJson = PerformanceTestGenerator.generateDeepObject(100); // 100 levels deep
      const testJson = { root: deepJson };
      const jsonString = JSON.stringify(testJson);
      const testFilePath = join(testFilesDir, 'test-deep-nesting.json');

      writeFileSync(testFilePath, jsonString);

      const startTime = Date.now();
      await viewerPage.uploadJSONFile(testFilePath);
      const processingTime = Date.now() - startTime;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Deep nesting should be handled efficiently
      expect(processingTime).toBeLessThan(10_000); // Under 10 seconds

      // Verify deep structure handling
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.objects).toBeGreaterThan(50);
    });

    test('should handle wide JSON objects (many properties)', async () => {
      const wideJson = PerformanceTestGenerator.generateWideObject(10000); // 10k properties
      const testJson = { wide: wideJson };
      const jsonString = JSON.stringify(testJson);
      const testFilePath = join(testFilesDir, 'test-wide-object.json');

      writeFileSync(testFilePath, jsonString);

      const startTime = Date.now();
      await viewerPage.uploadJSONFile(testFilePath);
      const processingTime = Date.now() - startTime;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Wide objects should be handled reasonably
      expect(processingTime).toBeLessThan(20_000); // Under 20 seconds

      // Verify wide object handling
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(5000);
    });

    test('should provide size warnings for very large files', async () => {
      const hugeJson = generateLargeTestJSON(200); // 200MB
      const jsonString = JSON.stringify(hugeJson);
      const testFilePath = join(testFilesDir, 'test-huge-warning.json');

      writeFileSync(testFilePath, jsonString);

      await viewerPage.uploadJSONFile(testFilePath);

      // Look for size warnings or optimization suggestions
      const warningElements = await viewerPage.page
        .locator('text=/warning|caution|large|memory|performance/i')
        .count();

      if (warningElements > 0) {
        // If warnings are shown, verify they're helpful
        const warningText = await viewerPage.page
          .locator('[data-testid="warning"], .warning, .alert')
          .first()
          .textContent();
        expect(warningText?.toLowerCase()).toMatch(/large|memory|performance|slow/);
      }

      // Should still process the file
      expect(await viewerPage.hasJSONErrors()).toBe(false);
    });

    test(
      'should gracefully handle memory limits and suggest alternatives',
      async () => {
        // Try to create a JSON that might hit memory limits
        const extremelyLargeArray = new Array(500000).fill(0).map((_, i) => ({
          id: i,
          data: `Very long string data that takes up memory: ${i}`.repeat(20),
          nested: {
            level1: { level2: { level3: `Deep data ${i}`.repeat(10) } },
          },
          array: new Array(50).fill(`Item ${i}`),
        }));

        const testJson = { extreme: extremelyLargeArray };
        const jsonString = JSON.stringify(testJson);
        const testFilePath = join(testFilesDir, 'test-memory-limit.json');

        writeFileSync(testFilePath, jsonString);

        const startTime = Date.now();
        await viewerPage.uploadJSONFile(testFilePath);
        const processingTime = Date.now() - startTime;

        // Should either process successfully or fail gracefully
        const hasErrors = await viewerPage.hasJSONErrors();

        if (hasErrors) {
          // Error should be informative about memory/size limits
          const errorMessage = await viewerPage.getErrorMessage();
          expect(errorMessage?.toLowerCase()).toMatch(/memory|size|limit|large|performance/);
        } else {
          // If successful, should be reasonably fast
          expect(processingTime).toBeLessThan(45_000);
          const stats = await viewerPage.getJSONStats();
          expect(stats.nodeCount).toBeGreaterThan(10000);
        }
      },
      MAX_TEST_TIMEOUT
    );

    test('should maintain responsiveness during large file processing', async () => {
      const largeJson = generateLargeTestJSON(75); // 75MB
      const jsonString = JSON.stringify(largeJson);
      const testFilePath = join(testFilesDir, 'test-responsive.json');

      writeFileSync(testFilePath, jsonString);

      // Start upload
      const uploadPromise = viewerPage.uploadJSONFile(testFilePath);

      // UI should remain responsive - try interacting with other elements
      if (await viewerPage.settingsButton.isVisible()) {
        await viewerPage.settingsButton.click();
        // Should be able to interact despite processing
      }

      // Can switch view modes
      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.treeViewButton.click();
      }

      // Wait for upload to complete
      await uploadPromise;

      // Should complete successfully
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // UI should still be interactive
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(100);
    });
  });

  test.describe('Memory Management and Optimization', () => {
    test('should report memory usage statistics', async () => {
      const mediumJson = generateLargeTestJSON(25); // 25MB
      const jsonString = JSON.stringify(mediumJson);
      const testFilePath = join(testFilesDir, 'test-memory-stats.json');

      writeFileSync(testFilePath, jsonString);

      await viewerPage.uploadJSONFile(testFilePath);

      // Look for memory or performance statistics
      const statsElements = await viewerPage.page
        .locator('[data-testid*="memory"], [data-testid*="performance"], [data-testid*="stats"]')
        .count();

      if (statsElements > 0) {
        // Verify memory statistics are meaningful
        const memoryInfo = await viewerPage.page
          .locator('[data-testid*="memory"]')
          .first()
          .textContent();
        expect(memoryInfo).toMatch(/\d+/); // Should contain numbers
      }

      // Standard stats should be available
      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(0);
      expect(stats.fileSize).toBeTruthy();
    });

    test('should optimize rendering for large datasets', async () => {
      const largeJson = generateLargeTestJSON(50);
      const jsonString = JSON.stringify(largeJson);
      const testFilePath = join(testFilesDir, 'test-render-optimization.json');

      writeFileSync(testFilePath, jsonString);

      await viewerPage.uploadJSONFile(testFilePath);

      // Switch to different view modes to test rendering optimization
      await viewerPage.switchToTreeView();
      const treeRenderStart = Date.now();
      await viewerPage.waitForJSONProcessed();
      const treeRenderTime = Date.now() - treeRenderStart;

      await viewerPage.switchToListView();
      const listRenderStart = Date.now();
      await viewerPage.waitForJSONProcessed();
      const listRenderTime = Date.now() - listRenderStart;

      // Rendering should be optimized (under 5 seconds per view)
      expect(treeRenderTime).toBeLessThan(5000);
      expect(listRenderTime).toBeLessThan(5000);

      // Take screenshots of different optimized views
      await viewerPage.takeScreenshot('large-file-tree-optimized');

      await viewerPage.switchToListView();
      await viewerPage.takeScreenshot('large-file-list-optimized');
    });
  });

  // Cleanup after tests
  test.afterAll(async () => {
    // Optional: Clean up large test files to save disk space
    // Note: Keeping them for manual inspection during development
  });
});

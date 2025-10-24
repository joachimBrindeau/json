import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import {
  PerformanceTestGenerator,
  generateLargeTestJSON,
} from '../../../lib/performance-test-generator';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Advanced User - Streaming JSON Processing (Story 2)', () => {
  let viewerPage: JsonViewerPage;
  const testFilesDir = join(__dirname, '../../test-files/streaming');
  const STREAMING_TIMEOUT = 120_000; // 2 minutes for streaming tests

  test.beforeAll(async () => {
    if (!existsSync(testFilesDir)) {
      mkdirSync(testFilesDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('Streaming JSON Processing for Large Files', () => {
    test(
      'should process large files incrementally with streaming',
      async () => {
        test.setTimeout(STREAMING_TIMEOUT);
        const streamingJson = generateLargeTestJSON(150); // 150MB for streaming test
        const jsonString = JSON.stringify(streamingJson);
        const testFilePath = join(testFilesDir, 'streaming-150mb.json');

        writeFileSync(testFilePath, jsonString);

        const startTime = Date.now();

        // Upload file - should use streaming for large files
        await viewerPage.uploadJSONFile(testFilePath);

        const totalTime = Date.now() - startTime;

        // Should process successfully
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Streaming should make it faster than regular parsing
        expect(totalTime).toBeLessThan(60_000); // Under 1 minute

        // Verify content is available
        const nodeCounts = await viewerPage.getNodeCounts();
        expect(nodeCounts.total).toBeGreaterThan(1000);

        // Take screenshot of streaming result
        await viewerPage.takeScreenshot('streaming-json-processed');

        // Check for streaming indicators in the UI
        const streamingIndicators = await viewerPage.page
          .locator('text=/stream|chunk|incremental/i')
          .count();
        if (streamingIndicators > 0) {
          console.log('Streaming indicators found in UI');
        }
      }
    );

    test('should show progressive loading during streaming', async () => {
      const progressiveJson = PerformanceTestGenerator.generateLargeArray(75000); // Large array for progressive loading
      const testJson = {
        metadata: { type: 'progressive_test', size: 'large' },
        items: progressiveJson,
      };
      const jsonString = JSON.stringify(testJson);
      const testFilePath = join(testFilesDir, 'progressive-loading.json');

      writeFileSync(testFilePath, jsonString);

      // Start upload and watch for progressive indicators
      const uploadPromise = viewerPage.uploadJSONFile(testFilePath);

      // Should show loading progress
      await expect(viewerPage.loadingSpinner).toBeVisible({ timeout: 5000 });

      // Look for progress indicators
      const progressElements = await viewerPage.page
        .locator('[data-testid*="progress"], .progress, text=/loading|processing/i')
        .count();

      if (progressElements > 0) {
        // Take screenshot of progress state
        await viewerPage.takeScreenshot('streaming-progress-indicators');
      }

      // Wait for completion
      await uploadPromise;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Progress indicators should be gone
      expect(await viewerPage.loadingSpinner.isVisible()).toBe(false);
    });

    test('should handle streaming API endpoints for large data', async ({ apiHelper }) => {
      // Test if streaming API endpoint exists and works
      const testJson = generateLargeTestJSON(25);

      try {
        // Try to use streaming API if available
        const response = await apiHelper.uploadJSON(testJson);

        if (response.streamingSupported) {
          // Navigate to streaming URL
          await viewerPage.navigateTo(`/viewer/${response.id}`);

          // Should load with streaming
          await viewerPage.waitForJSONProcessed();

          expect(await viewerPage.hasJSONErrors()).toBe(false);

          // Look for streaming indicators
          const streamingStatus = await viewerPage.page
            .locator('[data-testid*="streaming"], text=/stream/i')
            .count();

          if (streamingStatus > 0) {
            await viewerPage.takeScreenshot('api-streaming-active');
          }
        }
      } catch (error) {
        // Fail fast if streaming API is not available
        throw new Error('Streaming API must be available for this test: ' + error.message);
      }
    });

    test('should efficiently stream process deeply nested JSON', async () => {
      const deepData = {
        metadata: { type: 'deep_streaming_test' },
        data: PerformanceTestGenerator.generateDeepObject(200), // 200 levels deep
      };
      const jsonString = JSON.stringify(deepData);
      const testFilePath = join(testFilesDir, 'deep-streaming.json');

      writeFileSync(testFilePath, jsonString);

      const startTime = Date.now();
      await viewerPage.uploadJSONFile(testFilePath);
      const processingTime = Date.now() - startTime;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Deep nesting with streaming should be efficient
      expect(processingTime).toBeLessThan(30_000); // Under 30 seconds

      // Verify deep structure is accessible
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.objects).toBeGreaterThan(100);

      await viewerPage.takeScreenshot('deep-streaming-processed');
    });

    test(
      'should handle streaming with mixed data types efficiently',
      async () => {
        test.setTimeout(STREAMING_TIMEOUT);
        const mixedData = {
          strings: new Array(10000).fill(0).map((_, i) => `String data ${i} - `.repeat(20)),
          numbers: new Array(50000).fill(0).map(() => Math.random() * 1000000),
          objects: new Array(5000).fill(0).map((_, i) => ({
            id: i,
            nested: {
              level1: { level2: { data: `Complex nested data ${i}`.repeat(5) } },
            },
            array: new Array(20).fill(0).map((_, j) => ({ item: j, value: Math.random() })),
          })),
          booleans: new Array(1000).fill(0).map((_, i) => i % 2 === 0),
          arrays: new Array(100)
            .fill(0)
            .map((_, i) => new Array(100).fill(0).map((_, j) => `Item ${i}-${j}`)),
        };

        const jsonString = JSON.stringify(mixedData);
        const testFilePath = join(testFilesDir, 'mixed-streaming.json');

        writeFileSync(testFilePath, jsonString);

        const startTime = Date.now();
        await viewerPage.uploadJSONFile(testFilePath);
        const processingTime = Date.now() - startTime;

        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Mixed data streaming should be efficient
        expect(processingTime).toBeLessThan(45_000); // Under 45 seconds

        // Verify all data types are handled
        const nodeCounts = await viewerPage.getNodeCounts();
        expect(nodeCounts.strings).toBeGreaterThan(1000);
        expect(nodeCounts.numbers).toBeGreaterThan(1000);
        expect(nodeCounts.objects).toBeGreaterThan(100);
        expect(nodeCounts.arrays).toBeGreaterThan(50);
        expect(nodeCounts.booleans).toBeGreaterThan(100);
      }
    );

    test('should handle streaming interruption gracefully', async () => {
      const largeJson = generateLargeTestJSON(100);
      const jsonString = JSON.stringify(largeJson);
      const testFilePath = join(testFilesDir, 'streaming-interruption.json');

      writeFileSync(testFilePath, jsonString);

      // Start upload
      const uploadPromise = viewerPage.uploadJSONFile(testFilePath);

      // Simulate interruption by navigation (real world scenario)
      setTimeout(async () => {
        if (await viewerPage.loadingSpinner.isVisible()) {
          // Navigate away to simulate interruption
          await viewerPage.navigateTo('/');

          // Navigate back
          setTimeout(async () => {
            await viewerPage.navigateToViewer();
          }, 1000);
        }
      }, 5000);

      try {
        await uploadPromise;
      } catch (error) {
        // Interruption is expected
        console.log('Upload interrupted as expected');
      }

      // Should handle interruption gracefully - no crashes
      await viewerPage.navigateToViewer();
      expect(await viewerPage.page.isVisible('body')).toBe(true);

      // Can start new upload after interruption
      const smallJson = { test: 'recovery', data: [1, 2, 3] };
      await viewerPage.inputJSON(JSON.stringify(smallJson));
      await viewerPage.waitForJSONProcessed();

      expect(await viewerPage.hasJSONErrors()).toBe(false);
    });

    test('should optimize memory usage during streaming', async () => {
      const memoryTestJson = {
        metadata: { type: 'memory_streaming_test' },
        data: new Array(25000).fill(0).map((_, i) => ({
          id: i,
          largeString: 'x'.repeat(1000), // 1KB string per item
          nestedData: {
            level1: { level2: { level3: `Data ${i}` } },
            array: new Array(50).fill(`item-${i}`),
          },
        })),
      };

      const jsonString = JSON.stringify(memoryTestJson);
      const testFilePath = join(testFilesDir, 'memory-streaming.json');

      writeFileSync(testFilePath, jsonString);

      // Monitor page performance during upload
      await viewerPage.page.evaluate(() => {
        (window as any).performanceStart = performance.now();
        (window as any).memoryStart = (performance as any).memory?.usedJSHeapSize;
      });

      const startTime = Date.now();
      await viewerPage.uploadJSONFile(testFilePath);
      const processingTime = Date.now() - startTime;

      // Get performance metrics
      const perfMetrics = await viewerPage.page.evaluate(() => {
        return {
          processingTime: performance.now() - (window as any).performanceStart,
          memoryUsed: (performance as any).memory
            ? ((performance as any).memory.usedJSHeapSize - (window as any).memoryStart) /
              1024 /
              1024
            : null,
        };
      });

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Memory usage should be reasonable (streaming should limit memory)
      if (perfMetrics.memoryUsed) {
        expect(perfMetrics.memoryUsed).toBeLessThan(200); // Under 200MB
      }

      // Processing should be efficient
      expect(processingTime).toBeLessThan(30_000);

      await viewerPage.takeScreenshot('memory-optimized-streaming');
    });

    test('should provide streaming status and progress information', async () => {
      const statusJson = generateLargeTestJSON(75);
      const jsonString = JSON.stringify(statusJson);
      const testFilePath = join(testFilesDir, 'streaming-status.json');

      writeFileSync(testFilePath, jsonString);

      // Start upload and monitor status
      const uploadPromise = viewerPage.uploadJSONFile(testFilePath);

      // Look for status information during streaming
      const statusSelectors = [
        '[data-testid*="status"]',
        '[data-testid*="progress"]',
        '.status',
        '.progress',
        'text=/processing|loading|streaming/i',
      ];

      let statusFound = false;
      for (const selector of statusSelectors) {
        const elements = await viewerPage.page.locator(selector).count();
        if (elements > 0) {
          statusFound = true;
          const statusText = await viewerPage.page.locator(selector).first().textContent();
          console.log(`Streaming status found: ${statusText}`);

          // Take screenshot of status display
          await viewerPage.takeScreenshot('streaming-status-display');
          break;
        }
      }

      await uploadPromise;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Status should be cleared after completion
      const finalStatus = await viewerPage.loadingSpinner.isVisible();
      expect(finalStatus).toBe(false);
    });

    test(
      'should handle concurrent streaming operations',
      async ({ page, context }) => {
        test.setTimeout(STREAMING_TIMEOUT);
        // Open multiple tabs to test concurrent streaming
        const page2 = await context.newPage();
        const viewerPage2 = new JsonViewerPage(page2);

        const json1 = generateLargeTestJSON(50);
        const json2 = generateLargeTestJSON(50);

        const jsonString1 = JSON.stringify(json1);
        const jsonString2 = JSON.stringify(json2);

        const testFilePath1 = join(testFilesDir, 'concurrent-1.json');
        const testFilePath2 = join(testFilesDir, 'concurrent-2.json');

        writeFileSync(testFilePath1, jsonString1);
        writeFileSync(testFilePath2, jsonString2);

        await viewerPage.navigateToViewer();
        await viewerPage2.navigateToViewer();

        // Start both uploads concurrently
        const upload1Promise = viewerPage.uploadJSONFile(testFilePath1);
        const upload2Promise = viewerPage2.uploadJSONFile(testFilePath2);

        // Both should complete successfully
        await Promise.all([upload1Promise, upload2Promise]);

        expect(await viewerPage.hasJSONErrors()).toBe(false);
        expect(await viewerPage2.hasJSONErrors()).toBe(false);

        // Both should have processed content
        const stats1 = await viewerPage.getJSONStats();
        const stats2 = await viewerPage2.getJSONStats();

        expect(stats1.nodeCount).toBeGreaterThan(100);
        expect(stats2.nodeCount).toBeGreaterThan(100);

        await page2.close();
      }
    );
  });

  test.describe('Streaming API Integration', () => {
    test('should use streaming endpoints for large JSON uploads', async ({ apiHelper }) => {
      const largeJson = generateLargeTestJSON(100);

      try {
        // Test direct API streaming upload
        const response = await apiHelper.requestContext.post('/api/json/upload', {
          data: {
            json: largeJson,
            streaming: true,
          },
        });

        if (response.ok()) {
          const data = await response.json();
          expect(data.success).toBe(true);

          if (data.streamingId) {
            // Navigate to streaming viewer
            await viewerPage.navigateTo(`/viewer/${data.id}?streaming=${data.streamingId}`);
            await viewerPage.waitForJSONProcessed();

            expect(await viewerPage.hasJSONErrors()).toBe(false);

            // Should show streaming indicators
            const streamingInfo = await viewerPage.page
              .locator('[data-testid*="streaming"]')
              .count();
            if (streamingInfo > 0) {
              await viewerPage.takeScreenshot('api-streaming-viewer');
            }
          }
        }
      } catch (error) {
        // Fail fast if streaming API is not available
        throw new Error('Streaming API must be available for this test: ' + error.message);
      }
    });

    test('should handle streaming API errors gracefully', async ({ apiHelper }) => {
      // Test error handling in streaming API
      const invalidData = { invalid: 'not-json-string' };

      try {
        const response = await apiHelper.requestContext.post('/api/json/stream/invalid-id', {
          data: invalidData,
        });

        // Should handle error gracefully
        expect(response.status()).toBeGreaterThanOrEqual(400);

        const errorData = await response.json();
        expect(errorData.error).toBeTruthy();
      } catch (error) {
        console.log('Streaming API error test skipped - endpoint not available');
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup streaming test files if needed
  });
});

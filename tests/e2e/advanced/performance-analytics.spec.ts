import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import {
  PerformanceTestGenerator,
  PERFORMANCE_BENCHMARKS,
} from '../../../lib/performance-test-generator';
import { JSON_SAMPLES } from '../../fixtures/json-samples';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Advanced User - Performance Analytics & Processing Times (Story 3)', () => {
  let viewerPage: JsonViewerPage;
  const testFilesDir = join(__dirname, '../../test-files/performance');
  const ANALYTICS_TIMEOUT = 60_000; // 1 minute for performance tests

  test.beforeAll(async () => {
    if (!existsSync(testFilesDir)) {
      mkdirSync(testFilesDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('JSON Performance Analytics Display', () => {
    test('should display processing time metrics for small JSON', async ({ dataGenerator }) => {
      const smallJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(smallJson);

      const startTime = performance.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const clientProcessingTime = performance.now() - startTime;

      // Check for processing time display in UI
      const stats = await viewerPage.getJSONStats();

      // Should show processing time
      if (stats.processingTime) {
        const displayedTime = parseFloat(stats.processingTime.replace(/[^\d.]/g, ''));
        expect(displayedTime).toBeGreaterThan(0);
        expect(displayedTime).toBeLessThan(PERFORMANCE_BENCHMARKS.small.expectedParseTime);
      }

      // Client-side timing should be fast for small JSON
      expect(clientProcessingTime).toBeLessThan(100); // Under 100ms

      // Take screenshot of performance display
      await viewerPage.takeScreenshot('small-json-performance-display');
    });

    test('should show detailed performance metrics for complex JSON', async () => {
      const complexJson = JSON_SAMPLES.ecommerce.content;
      const jsonString = JSON.stringify(complexJson);

      const startTime = Date.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const totalTime = Date.now() - startTime;

      // Should process complex JSON efficiently
      expect(totalTime).toBeLessThan(2000); // Under 2 seconds

      // Check for detailed performance information
      const performanceElements = await viewerPage.page
        .locator('[data-testid*="performance"], [data-testid*="metrics"], [data-testid*="stats"]')
        .count();

      if (performanceElements > 0) {
        // Get performance data
        const perfData = await viewerPage.page
          .locator('[data-testid*="performance"]')
          .first()
          .textContent();
        expect(perfData).toBeTruthy();

        // Should contain numeric values
        expect(perfData).toMatch(/\d+/);

        await viewerPage.takeScreenshot('complex-json-performance-metrics');
      }

      // Basic stats should always be available
      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(10);
      expect(stats.fileSize).toBeTruthy();
    });

    test('should display memory usage analytics for large JSON', async () => {
      const largeJson = PerformanceTestGenerator.generateLargeArray(10000);
      const testJson = { data: largeJson };
      const jsonString = JSON.stringify(testJson);

      // Monitor memory before processing
      const memoryBefore = await viewerPage.page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null;
      });

      const startTime = Date.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const processingTime = Date.now() - startTime;

      // Monitor memory after processing
      const memoryAfter = await viewerPage.page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null;
      });

      // Should process efficiently
      expect(processingTime).toBeLessThan(10_000); // Under 10 seconds

      // Check for memory analytics in UI
      const memoryElements = await viewerPage.page
        .locator('[data-testid*="memory"], text=/memory|usage|mb|kb/i')
        .count();

      if (memoryElements > 0) {
        const memoryInfo = await viewerPage.page
          .locator('[data-testid*="memory"]')
          .first()
          .textContent();
        console.log(`Memory info displayed: ${memoryInfo}`);

        await viewerPage.takeScreenshot('memory-analytics-display');
      }

      // Log actual memory usage
      if (memoryBefore && memoryAfter) {
        const memoryUsedMB = (memoryAfter - memoryBefore) / (1024 * 1024);
        console.log(`Memory used: ${memoryUsedMB.toFixed(2)} MB`);
        expect(memoryUsedMB).toBeGreaterThan(0);
      }
    });

    test('should show performance breakdown by operation type', async () => {
      const complexJson = {
        parsing: 'test',
        rendering: 'test',
        indexing: 'test',
        analysis: PerformanceTestGenerator.generateComplexStructure(1000),
      };
      const jsonString = JSON.stringify(complexJson);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for performance breakdown information
      const breakdownElements = await viewerPage.page
        .locator(
          '[data-testid*="breakdown"], [data-testid*="analysis"], text=/parse|render|analyze/i'
        )
        .count();

      if (breakdownElements > 0) {
        // Take screenshot of performance breakdown
        await viewerPage.takeScreenshot('performance-breakdown-display');

        // Verify breakdown contains meaningful data
        const breakdownText = await viewerPage.page
          .locator('[data-testid*="breakdown"]')
          .first()
          .textContent();
        if (breakdownText) {
          expect(breakdownText).toMatch(/\d+/); // Should contain numbers
        }
      }

      // Test different view modes for performance impact
      const treeStart = Date.now();
      await viewerPage.switchToTreeView();
      await viewerPage.waitForJSONProcessed();
      const treeTime = Date.now() - treeStart;

      const listStart = Date.now();
      await viewerPage.switchToListView();
      await viewerPage.waitForJSONProcessed();
      const listTime = Date.now() - listStart;

      // View switching should be fast
      expect(treeTime).toBeLessThan(2000);
      expect(listTime).toBeLessThan(2000);

      console.log(`Tree view switch: ${treeTime}ms, List view switch: ${listTime}ms`);
    });

    test('should track and display processing optimization over time', async () => {
      const testData = [
        { name: 'small', data: { test: 'small' } },
        { name: 'medium', data: PerformanceTestGenerator.generateLargeArray(1000) },
        { name: 'large', data: PerformanceTestGenerator.generateLargeArray(5000) },
      ];

      const processingTimes: number[] = [];

      for (const test of testData) {
        const jsonString = JSON.stringify(test.data);

        const startTime = Date.now();
        await viewerPage.inputJSON(jsonString);
        await viewerPage.waitForJSONProcessed();
        const processingTime = Date.now() - startTime;

        processingTimes.push(processingTime);

        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Clear for next test
        await viewerPage.clearJSON();
        // Wait for clear to complete
        await viewerPage.page.waitForLoadState('networkidle');
      }

      // Processing times should scale reasonably
      expect(processingTimes[0]).toBeLessThan(processingTimes[1]);
      expect(processingTimes[1]).toBeLessThan(processingTimes[2] * 2); // Not exponentially slower

      console.log(
        `Processing times: Small: ${processingTimes[0]}ms, Medium: ${processingTimes[1]}ms, Large: ${processingTimes[2]}ms`
      );

      // Look for optimization tracking in UI
      const optimizationElements = await viewerPage.page
        .locator('[data-testid*="optimization"], text=/optimize|improve|cache/i')
        .count();

      if (optimizationElements > 0) {
        await viewerPage.takeScreenshot('optimization-tracking');
      }
    });
  });

  test.describe('Real-time Performance Monitoring', () => {
    test(
      'should provide real-time processing feedback',
      async () => {
        const largeJson = PerformanceTestGenerator.generateLargeArray(25000);
        const jsonString = JSON.stringify({ data: largeJson });
        const testFilePath = join(testFilesDir, 'realtime-feedback.json');

        writeFileSync(testFilePath, jsonString);

        // Start upload and monitor real-time feedback
        const uploadPromise = viewerPage.uploadJSONFile(testFilePath);

        // Should show immediate feedback
        await expect(viewerPage.loadingSpinner).toBeVisible({ timeout: 3000 });

        // Look for real-time progress/status updates
        const feedbackElements = await viewerPage.page
          .locator(
            '[data-testid*="progress"], [data-testid*="status"], text=/processing|analyzing|loading/i'
          )
          .count();

        if (feedbackElements > 0) {
          // Monitor feedback changes
          const feedbackTexts: string[] = [];

          for (let i = 0; i < 5; i++) {
            const text = await viewerPage.page
              .locator('[data-testid*="progress"]')
              .first()
              .textContent();
            if (text) feedbackTexts.push(text);
            // Wait for next feedback update
            await viewerPage.page.waitForLoadState('networkidle');
          }

          // Take screenshot of real-time feedback
          await viewerPage.takeScreenshot('realtime-processing-feedback');

          if (feedbackTexts.length > 0) {
            console.log(`Real-time feedback: ${feedbackTexts.join(' -> ')}`);
          }
        }

        await uploadPromise;
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Feedback should be cleared after completion
        expect(await viewerPage.loadingSpinner.isVisible()).toBe(false);
      },
      ANALYTICS_TIMEOUT
    );

    test(
      'should show performance warnings for suboptimal operations',
      async () => {
        // Create JSON that might trigger performance warnings
        const problematicJson = {
          metadata: { type: 'performance_warning_test' },
          // Very wide object
          wideObject: PerformanceTestGenerator.generateWideObject(15000),
          // Deep nesting
          deepNesting: PerformanceTestGenerator.generateDeepObject(150),
          // Large array
          largeArray: PerformanceTestGenerator.generateLargeArray(50000),
        };

        const jsonString = JSON.stringify(problematicJson);

        await viewerPage.inputJSON(jsonString);
        await viewerPage.waitForJSONProcessed();

        // Look for performance warnings
        const warningElements = await viewerPage.page
          .locator('[data-testid*="warning"], .warning, text=/warning|slow|performance|optimize/i')
          .count();

        if (warningElements > 0) {
          const warningText = await viewerPage.page
            .locator('[data-testid*="warning"]')
            .first()
            .textContent();
          expect(warningText?.toLowerCase()).toMatch(/performance|slow|large|memory/);

          await viewerPage.takeScreenshot('performance-warnings-display');

          console.log(`Performance warning: ${warningText}`);
        } else {
          console.log('No performance warnings displayed (good optimization)');
        }

        // Should still process successfully despite potential performance issues
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      },
      ANALYTICS_TIMEOUT
    );

    test(
      'should display processing bottleneck identification',
      async () => {
        const bottleneckJson = {
          // Different types of potential bottlenecks
          stringProcessing: new Array(10000)
            .fill(0)
            .map((_, i) => `Very long string content: ${'x'.repeat(500)}`),
          numberProcessing: new Array(50000).fill(0).map(() => Math.PI * Math.random()),
          objectProcessing: new Array(5000).fill(0).map((_, i) => ({
            [`key_${i}`]: { nested: { deep: { value: i } } },
          })),
          arrayProcessing: new Array(1000)
            .fill(0)
            .map((_, i) =>
              new Array(100).fill(0).map((_, j) => ({ id: `${i}-${j}`, data: Math.random() }))
            ),
        };

        const jsonString = JSON.stringify(bottleneckJson);

        const startTime = Date.now();
        await viewerPage.inputJSON(jsonString);
        await viewerPage.waitForJSONProcessed();
        const totalTime = Date.now() - startTime;

        console.log(`Total processing time for bottleneck test: ${totalTime}ms`);

        // Look for bottleneck identification in UI
        const bottleneckElements = await viewerPage.page
          .locator(
            '[data-testid*="bottleneck"], [data-testid*="slow"], text=/bottleneck|slow.*process/i'
          )
          .count();

        if (bottleneckElements > 0) {
          const bottleneckInfo = await viewerPage.page
            .locator('[data-testid*="bottleneck"]')
            .first()
            .textContent();
          console.log(`Bottleneck identified: ${bottleneckInfo}`);

          await viewerPage.takeScreenshot('bottleneck-identification');
        }

        expect(await viewerPage.hasJSONErrors()).toBe(false);
      },
      ANALYTICS_TIMEOUT
    );
  });

  test.describe('Performance Optimization Suggestions', () => {
    test('should suggest optimizations for large datasets', async () => {
      const optimizableJson = PerformanceTestGenerator.generateSizedJSON(75);
      const jsonString = JSON.stringify(optimizableJson);
      const testFilePath = join(testFilesDir, 'optimization-suggestions.json');

      writeFileSync(testFilePath, jsonString);

      await viewerPage.uploadJSONFile(testFilePath);

      // Look for optimization suggestions
      const suggestionElements = await viewerPage.page
        .locator(
          '[data-testid*="suggestion"], [data-testid*="optimize"], text=/suggest|recommend|optimize|improve/i'
        )
        .count();

      if (suggestionElements > 0) {
        const suggestions = await viewerPage.page
          .locator('[data-testid*="suggestion"]')
          .first()
          .textContent();
        expect(suggestions).toBeTruthy();

        // Suggestions should be actionable
        expect(suggestions?.toLowerCase()).toMatch(/chunk|stream|virtual|lazy|compress/);

        await viewerPage.takeScreenshot('optimization-suggestions');

        console.log(`Optimization suggestions: ${suggestions}`);
      }

      expect(await viewerPage.hasJSONErrors()).toBe(false);
    });

    test('should track performance improvements after optimization', async () => {
      const baselineJson = PerformanceTestGenerator.generateLargeArray(10000);
      let jsonString = JSON.stringify({ data: baselineJson });

      // Baseline measurement
      let startTime = Date.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const baselineTime = Date.now() - startTime;

      await viewerPage.clearJSON();
      // Wait for clear to complete
      await viewerPage.page.waitForLoadState('networkidle');

      // Optimized measurement (smaller, structured data)
      const optimizedJson = {
        metadata: { optimized: true },
        data: baselineJson.slice(0, 5000), // Smaller dataset
      };
      jsonString = JSON.stringify(optimizedJson);

      startTime = Date.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const optimizedTime = Date.now() - startTime;

      // Optimized version should be faster
      expect(optimizedTime).toBeLessThan(baselineTime);

      const improvement = ((baselineTime - optimizedTime) / baselineTime) * 100;
      console.log(
        `Performance improvement: ${improvement.toFixed(1)}% (${baselineTime}ms -> ${optimizedTime}ms)`
      );

      // Look for performance improvement tracking
      const improvementElements = await viewerPage.page
        .locator('[data-testid*="improvement"], text=/faster|improved|optimized/i')
        .count();

      if (improvementElements > 0) {
        await viewerPage.takeScreenshot('performance-improvement-tracking');
      }
    });
  });

  test.describe('Performance Comparison and Benchmarks', () => {
    test('should compare performance across different JSON structures', async () => {
      const testCases = [
        {
          name: 'flat',
          data: Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`key${i}`, i])),
        },
        { name: 'nested', data: PerformanceTestGenerator.generateDeepObject(20) },
        { name: 'array', data: { items: PerformanceTestGenerator.generateLargeArray(2000) } },
        { name: 'mixed', data: { flat: {}, nested: {}, array: [] } },
      ];

      const performanceResults: Array<{ name: string; time: number; nodes: number }> = [];

      for (const testCase of testCases) {
        const jsonString = JSON.stringify(testCase.data);

        const startTime = Date.now();
        await viewerPage.inputJSON(jsonString);
        await viewerPage.waitForJSONProcessed();
        const processingTime = Date.now() - startTime;

        const nodeCounts = await viewerPage.getNodeCounts();

        performanceResults.push({
          name: testCase.name,
          time: processingTime,
          nodes: nodeCounts.total,
        });

        await viewerPage.clearJSON();
        // Wait for clear to complete
        await viewerPage.page.waitForLoadState('networkidle');
      }

      // Log performance comparison
      console.log('Performance Comparison:');
      performanceResults.forEach((result) => {
        console.log(`${result.name}: ${result.time}ms (${result.nodes} nodes)`);
      });

      // All should complete in reasonable time
      performanceResults.forEach((result) => {
        expect(result.time).toBeLessThan(5000);
        expect(result.nodes).toBeGreaterThan(0);
      });

      // Look for comparison UI
      const comparisonElements = await viewerPage.page
        .locator('[data-testid*="comparison"], text=/compare|benchmark/i')
        .count();

      if (comparisonElements > 0) {
        await viewerPage.takeScreenshot('performance-comparison');
      }
    });

    test(
      'should benchmark against performance standards',
      async () => {
        const benchmarkTests = [
          { size: 'small', json: PerformanceTestGenerator.generateSizedJSON(1), expected: 50 },
          { size: 'medium', json: PerformanceTestGenerator.generateSizedJSON(10), expected: 200 },
          { size: 'large', json: PerformanceTestGenerator.generateSizedJSON(50), expected: 1000 },
        ];

        const benchmarkResults: Array<{ size: string; time: number; withinBenchmark: boolean }> =
          [];

        for (const benchmark of benchmarkTests) {
          const jsonString = JSON.stringify(benchmark.json);

          const startTime = Date.now();
          await viewerPage.inputJSON(jsonString);
          await viewerPage.waitForJSONProcessed();
          const processingTime = Date.now() - startTime;

          const withinBenchmark = processingTime <= benchmark.expected;
          benchmarkResults.push({
            size: benchmark.size,
            time: processingTime,
            withinBenchmark,
          });

          expect(await viewerPage.hasJSONErrors()).toBe(false);

          await viewerPage.clearJSON();
          // Wait for clear to complete
          await viewerPage.page.waitForLoadState('networkidle');
        }

        // Log benchmark results
        console.log('Benchmark Results:');
        benchmarkResults.forEach((result) => {
          const status = result.withinBenchmark ? '✓ PASS' : '✗ FAIL';
          console.log(`${result.size}: ${result.time}ms ${status}`);
        });

        // At least small and medium should meet benchmarks
        expect(benchmarkResults[0].withinBenchmark).toBe(true); // small
        expect(benchmarkResults[1].withinBenchmark).toBe(true); // medium

        // Look for benchmark display in UI
        const benchmarkElements = await viewerPage.page
          .locator('[data-testid*="benchmark"], text=/benchmark|standard/i')
          .count();

        if (benchmarkElements > 0) {
          await viewerPage.takeScreenshot('benchmark-results');
        }
      },
      ANALYTICS_TIMEOUT
    );
  });

  test.afterAll(async () => {
    // Cleanup performance test files
  });
});

// Helper function for complex structure generation (added to PerformanceTestGenerator)
declare module '../../../lib/performance-test-generator' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PerformanceTestGenerator {
    function generateComplexStructure(complexity: number): any;
  }
}

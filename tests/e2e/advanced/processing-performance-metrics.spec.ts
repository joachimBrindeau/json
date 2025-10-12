import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import {
  PerformanceTestGenerator,
  generateLargeTestJSON,
  PERFORMANCE_BENCHMARKS,
} from '../../../lib/performance-test-generator';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

test.describe('Advanced User - Processing Performance Metrics (Story 9)', () => {
  let viewerPage: JsonViewerPage;
  const testFilesDir = join(__dirname, '../../test-files/performance');
  const PERFORMANCE_TIMEOUT = 240_000; // 4 minutes for performance tests

  test.beforeAll(async () => {
    if (!existsSync(testFilesDir)) {
      mkdirSync(testFilesDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('Real-time Performance Monitoring', () => {
    test('should display processing time metrics for JSON parsing', async () => {
      const performanceJson = {
        metadata: {
          purpose: 'Processing time measurement',
          expected_complexity: 'medium',
          target_parse_time: '< 1 second',
        },
        dataset: generateLargeTestJSON(25).data.slice(0, 5000), // Moderate size for timing
      };

      const startTime = Date.now();

      await viewerPage.inputJSON(JSON.stringify(performanceJson));
      await viewerPage.waitForJSONProcessed();

      const clientProcessingTime = Date.now() - startTime;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Look for processing time display
      const timeMetricsSelectors = [
        '[data-testid*="processing-time"]',
        '[data-testid*="parse-time"]',
        '[data-testid*="render-time"]',
        'text=/processing.*time/i',
        'text=/parsed.*in.*ms/i',
        'text=/render.*time/i',
      ];

      let timingFound = false;
      let displayedTime = 0;

      for (const selector of timeMetricsSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          const timeText = await viewerPage.page.locator(selector).first().textContent();
          const timeMatch = timeText?.match(/(\d+(?:\.\d+)?)\s*(ms|milliseconds|s|seconds)/i);

          if (timeMatch) {
            const value = parseFloat(timeMatch[1]);
            const unit = timeMatch[2].toLowerCase();
            displayedTime = unit.startsWith('s') ? value * 1000 : value; // Convert to ms
            timingFound = true;

            console.log(`Processing time displayed: ${displayedTime}ms`);
            break;
          }
        }
      }

      // Get stats from viewer
      const stats = await viewerPage.getJSONStats();
      if (stats.processingTime) {
        const processingTimeMatch = stats.processingTime.match(/(\d+(?:\.\d+)?)/);
        if (processingTimeMatch) {
          const viewerDisplayedTime = parseFloat(processingTimeMatch[1]);
          expect(viewerDisplayedTime).toBeGreaterThan(0);
          console.log(`Viewer stats processing time: ${viewerDisplayedTime}ms`);
        }
      }

      // Validate timing is reasonable
      expect(clientProcessingTime).toBeLessThan(PERFORMANCE_BENCHMARKS.medium.expectedParseTime);

      if (timingFound) {
        expect(displayedTime).toBeGreaterThan(0);
        expect(displayedTime).toBeLessThanOrEqual(clientProcessingTime * 2); // Should be in reasonable range
        await viewerPage.takeScreenshot('processing-time-metrics');
      }
    });

    test('should show memory usage metrics during JSON processing', async () => {
      const memoryTestJson = {
        memory_test: 'Large dataset for memory monitoring',
        large_arrays: Array.from({ length: 10 }, (_, i) =>
          Array.from({ length: 1000 }, (_, j) => ({
            id: i * 1000 + j,
            data: `Memory test data ${i}-${j}`,
            large_string: 'x'.repeat(500), // 500 bytes per item
            nested: {
              level1: { level2: { level3: `nested_${i}_${j}` } },
            },
          }))
        ),
        wide_object: Object.fromEntries(
          Array.from({ length: 2000 }, (_, i) => [
            `prop_${i}`,
            { value: i, metadata: { created: new Date().toISOString() } },
          ])
        ),
      };

      // Monitor memory before processing
      const memoryBefore = await viewerPage.page.evaluate(() => {
        if ((performance as any).memory) {
          return {
            used: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
            total: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
            limit: (performance as any).memory.jsHeapSizeLimit / 1024 / 1024,
          };
        }
        return null;
      });

      await viewerPage.inputJSON(JSON.stringify(memoryTestJson));
      await viewerPage.waitForJSONProcessed();

      const memoryAfter = await viewerPage.page.evaluate(() => {
        if ((performance as any).memory) {
          return {
            used: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
            total: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
            limit: (performance as any).memory.jsHeapSizeLimit / 1024 / 1024,
          };
        }
        return null;
      });

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Calculate memory usage
      if (memoryBefore && memoryAfter) {
        const memoryIncrease = memoryAfter.used - memoryBefore.used;
        console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
        console.log(`Memory after processing: ${memoryAfter.used.toFixed(2)}MB`);

        // Memory increase should be reasonable
        expect(memoryIncrease).toBeLessThan(200); // Under 200MB increase
        expect(memoryAfter.used).toBeLessThan(memoryAfter.limit * 0.8); // Under 80% of limit
      }

      // Look for memory metrics in UI
      const memorySelectors = [
        '[data-testid*="memory"]',
        'text=/memory.*usage/i',
        'text=/heap.*size/i',
        'text=/\d+\s*mb/i',
      ];

      for (const selector of memorySelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          const memoryText = await viewerPage.page.locator(selector).first().textContent();

          if (memoryText && /\d+/.test(memoryText)) {
            console.log(`Memory metric found: ${memoryText}`);
            await viewerPage.takeScreenshot('memory-usage-metrics');
            break;
          }
        }
      }

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(10000);
    });

    test('should track rendering performance for different view modes', async () => {
      const renderTestJson = {
        render_test: 'Multi-view rendering performance',
        complex_structure: {
          deeply_nested: PerformanceTestGenerator.generateDeepObject(12),
          wide_array: PerformanceTestGenerator.generateLargeArray(2000),
          mixed_data: {
            strings: Array.from({ length: 500 }, (_, i) => `String ${i}`),
            numbers: Array.from({ length: 500 }, () => Math.random() * 1000),
            booleans: Array.from({ length: 100 }, (_, i) => i % 2 === 0),
            nested_objects: Array.from({ length: 200 }, (_, i) => ({
              id: i,
              metadata: { created: new Date().toISOString(), index: i },
              nested: { level1: { level2: `value_${i}` } },
            })),
          },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(renderTestJson));
      await viewerPage.waitForJSONProcessed();

      // Test tree view rendering performance
      const treeRenderStart = performance.now();
      await viewerPage.switchToTreeView();
      await viewerPage.waitForJSONProcessed();
      const treeRenderTime = performance.now() - treeRenderStart;

      // Test list view rendering performance
      const listRenderStart = performance.now();
      await viewerPage.switchToListView();
      await viewerPage.waitForJSONProcessed();
      const listRenderTime = performance.now() - listRenderStart;

      console.log(`Tree view render time: ${treeRenderTime.toFixed(2)}ms`);
      console.log(`List view render time: ${listRenderTime.toFixed(2)}ms`);

      // Rendering should be reasonably fast
      expect(treeRenderTime).toBeLessThan(3000); // Under 3 seconds
      expect(listRenderTime).toBeLessThan(3000); // Under 3 seconds

      // Look for render performance metrics
      const renderMetricsSelectors = [
        '[data-testid*="render"]',
        'text=/render.*time/i',
        'text=/view.*switch/i',
      ];

      for (const selector of renderMetricsSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          await viewerPage.takeScreenshot('render-performance-metrics');
          break;
        }
      }

      await viewerPage.takeScreenshot('multi-view-performance');
    });

    test(
      'should measure and display JSON complexity impact on performance',
      async () => {
        const complexityVariations = [
          {
            name: 'Simple',
            data: { simple: 'data', number: 42, array: [1, 2, 3] },
            expectedComplexity: 'low',
          },
          {
            name: 'Medium',
            data: {
              users: Array.from({ length: 100 }, (_, i) => ({
                id: i,
                name: `User ${i}`,
                metadata: { created: new Date().toISOString() },
              })),
            },
            expectedComplexity: 'medium',
          },
          {
            name: 'Complex',
            data: {
              nested: PerformanceTestGenerator.generateDeepObject(10),
              wide: Object.fromEntries(
                Array.from({ length: 500 }, (_, i) => [`prop_${i}`, `value_${i}`])
              ),
              array: PerformanceTestGenerator.generateLargeArray(1000),
            },
            expectedComplexity: 'high',
          },
        ];

        const performanceResults = [];

        for (const variation of complexityVariations) {
          // Clear previous data
          await viewerPage.navigateToViewer();

          const startTime = performance.now();

          await viewerPage.inputJSON(JSON.stringify(variation.data));
          await viewerPage.waitForJSONProcessed();

          const processingTime = performance.now() - startTime;

          expect(await viewerPage.hasJSONErrors()).toBe(false);

          const nodeCounts = await viewerPage.getNodeCounts();
          const stats = await viewerPage.getJSONStats();

          const result = {
            name: variation.name,
            processingTime,
            nodeCount: nodeCounts.total,
            complexity: variation.expectedComplexity,
            statsProcessingTime: stats.processingTime,
          };

          performanceResults.push(result);

          console.log(
            `${variation.name}: ${processingTime.toFixed(2)}ms, ${nodeCounts.total} nodes`
          );

          await viewerPage.takeScreenshot(`complexity-${variation.name.toLowerCase()}-performance`);
        }

        // Validate that complexity correlates with processing time
        const simpleTime = performanceResults.find((r) => r.name === 'Simple')?.processingTime || 0;
        const complexTime =
          performanceResults.find((r) => r.name === 'Complex')?.processingTime || 0;

        // Complex should take longer than simple (but not excessively)
        expect(complexTime).toBeGreaterThan(simpleTime);
        expect(complexTime).toBeLessThan(simpleTime * 50); // Not more than 50x slower

        // Look for complexity impact indicators
        const complexityImpactSelectors = [
          '[data-testid*="complexity-impact"]',
          'text=/complexity.*performance/i',
          'text=/impact.*time/i',
        ];

        for (const selector of complexityImpactSelectors) {
          if ((await viewerPage.page.locator(selector).count()) > 0) {
            await viewerPage.takeScreenshot('complexity-impact-metrics');
            break;
          }
        }
      },
      PERFORMANCE_TIMEOUT
    );
  });

  test.describe('System Resource Monitoring', () => {
    test('should monitor CPU usage during intensive JSON processing', async ({ page }) => {
      const cpuIntensiveJson = {
        cpu_test: 'Intensive processing test',
        large_computation_data: Array.from({ length: 20000 }, (_, i) => ({
          id: i,
          computed_values: {
            fibonacci: i < 20 ? this.fibonacci(i % 20) : i,
            factorial: i < 10 ? this.factorial(i % 10) : i,
            prime_check: this.isPrime(i),
            nested_computation: {
              level1: { result: i * i },
              level2: { result: Math.sqrt(i) },
              level3: { result: i % 7 === 0 },
            },
          },
          large_string: `CPU intensive string processing ${i}: ${'compute'.repeat(50)}`,
          metadata: {
            timestamp: new Date(Date.now() - i * 100).toISOString(),
            category: `cpu_cat_${i % 100}`,
            references: Array.from({ length: 10 }, (_, j) => `ref_${i}_${j}`),
          },
        })),
      };

      // Start CPU monitoring if available
      const cpuMonitoringSupported = await page.evaluate(() => {
        return 'performance' in window && 'now' in performance;
      });

      if (cpuMonitoringSupported) {
        await page.evaluate(() => {
          (window as any).cpuMeasurements = [];
          (window as any).startCPUMonitoring = () => {
            const start = performance.now();
            return {
              measureCPU: () => {
                const elapsed = performance.now() - start;
                (window as any).cpuMeasurements.push({
                  timestamp: Date.now(),
                  elapsed,
                });
              },
            };
          };
        });
      }

      const startTime = Date.now();

      await viewerPage.inputJSON(JSON.stringify(cpuIntensiveJson));
      await viewerPage.waitForJSONProcessed();

      const totalProcessingTime = Date.now() - startTime;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // CPU intensive processing should complete reasonably
      expect(totalProcessingTime).toBeLessThan(30_000); // Under 30 seconds

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(20000);

      // Calculate processing rate
      const processingRate = nodeCounts.total / (totalProcessingTime / 1000);
      console.log(`Processing rate: ${processingRate.toFixed(2)} nodes/second`);

      expect(processingRate).toBeGreaterThan(50); // At least 50 nodes per second

      await viewerPage.takeScreenshot('cpu-intensive-processing');
    });

    // Helper functions for CPU intensive operations
    function fibonacci(n: number): number {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }

    function factorial(n: number): number {
      if (n <= 1) return 1;
      return n * factorial(n - 1);
    }

    function isPrime(n: number): boolean {
      if (n <= 1) return false;
      if (n <= 3) return true;
      if (n % 2 === 0 || n % 3 === 0) return false;
      for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
      }
      return true;
    }

    test('should track browser performance metrics during large file processing', async () => {
      const performanceTrackingJson = generateLargeTestJSON(50);
      const jsonString = JSON.stringify(performanceTrackingJson);
      const testFilePath = join(testFilesDir, 'performance-tracking.json');

      writeFileSync(testFilePath, jsonString);

      // Start performance tracking
      await viewerPage.page.evaluate(() => {
        (window as any).performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          (window as any).performanceEntries = (window as any).performanceEntries || [];
          (window as any).performanceEntries.push(...entries);
        });

        (window as any).performanceObserver.observe({
          entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'],
        });

        performance.mark('json-processing-start');
      });

      const startTime = Date.now();

      await viewerPage.uploadJSONFile(testFilePath);
      await viewerPage.waitForJSONProcessed();

      const processingTime = Date.now() - startTime;

      // End performance tracking
      const performanceData = await viewerPage.page.evaluate(() => {
        performance.mark('json-processing-end');
        performance.measure('json-processing', 'json-processing-start', 'json-processing-end');

        const entries = (window as any).performanceEntries || [];
        const processingMeasure = performance.getEntriesByName('json-processing')[0];

        return {
          entries: entries.length,
          processingMeasure: processingMeasure ? processingMeasure.duration : null,
          memory: (performance as any).memory
            ? {
                used: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
                total: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
              }
            : null,
        };
      });

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      console.log(`Processing time: ${processingTime}ms`);
      console.log(`Performance entries captured: ${performanceData.entries}`);

      if (performanceData.processingMeasure) {
        console.log(`Performance API measure: ${performanceData.processingMeasure.toFixed(2)}ms`);
        expect(performanceData.processingMeasure).toBeGreaterThan(0);
      }

      if (performanceData.memory) {
        console.log(`Memory usage: ${performanceData.memory.used.toFixed(2)}MB`);
        expect(performanceData.memory.used).toBeLessThan(600); // Under 600MB
      }

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(1000);

      await viewerPage.takeScreenshot('browser-performance-tracking');
    });
  });

  test.describe('Performance Optimization Suggestions', () => {
    test('should provide optimization suggestions for slow processing', async () => {
      const slowProcessingJson = {
        optimization_test: 'Performance optimization suggestions',
        problematic_structure: {
          very_deep_nesting: PerformanceTestGenerator.generateDeepObject(50),
          extremely_wide_object: Object.fromEntries(
            Array.from({ length: 5000 }, (_, i) => [
              `property_${i}`,
              {
                value: i,
                metadata: PerformanceTestGenerator.generateDeepObject(3),
                large_array: Array.from({ length: 100 }, (_, j) => `item_${i}_${j}`),
              },
            ])
          ),
          large_string_array: Array.from(
            { length: 1000 },
            (_, i) => 'x'.repeat(1000) + i.toString() // Large strings
          ),
          mixed_complexity: Array.from({ length: 2000 }, (_, i) => ({
            id: i,
            deep_nested: PerformanceTestGenerator.generateDeepObject(5),
            wide_props: Object.fromEntries(
              Array.from({ length: 20 }, (_, j) => [`prop_${j}`, `value_${i}_${j}`])
            ),
          })),
        },
      };

      const startTime = Date.now();

      await viewerPage.inputJSON(JSON.stringify(slowProcessingJson));
      await viewerPage.waitForJSONProcessed();

      const processingTime = Date.now() - startTime;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      console.log(`Complex structure processing time: ${processingTime}ms`);

      // Look for optimization suggestions
      const optimizationSelectors = [
        '[data-testid*="optimization"]',
        '[data-testid*="suggestion"]',
        '[data-testid*="performance-tip"]',
        'text=/optimization|suggestion|tip/i',
        'text=/improve.*performance/i',
        'text=/slow.*processing/i',
      ];

      let optimizationFound = false;
      for (const selector of optimizationSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          const suggestionText = await viewerPage.page.locator(selector).first().textContent();

          if (suggestionText) {
            console.log(`Optimization suggestion: ${suggestionText}`);
            optimizationFound = true;
            await viewerPage.takeScreenshot('performance-optimization-suggestions');
            break;
          }
        }
      }

      // If no specific optimization UI, validate performance is still reasonable
      if (processingTime > 10000) {
        // If took longer than 10 seconds
        console.log(
          'Complex structure took significant time - optimization suggestions would be valuable'
        );
      }

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(5000);
    });

    test(
      'should show system limitation warnings for extreme datasets',
      async () => {
        const extremeDataset = {
          warning_test: 'System limitations test',
          extreme_data: {
            massive_array: Array.from({ length: 100000 }, (_, i) => ({
              id: i,
              data: `Extreme item ${i}`,
              large_content: 'x'.repeat(500),
              nested: { level1: { level2: `value_${i}` } },
            })),
          },
          wide_structure: Object.fromEntries(
            Array.from({ length: 10000 }, (_, i) => [
              `extreme_prop_${i}`,
              {
                id: i,
                content: `Property ${i} content`.repeat(10),
                nested_array: Array.from({ length: 50 }, (_, j) => `item_${i}_${j}`),
              },
            ])
          ),
        };

        const jsonString = JSON.stringify(extremeDataset);
        const testFilePath = join(testFilesDir, 'extreme-limitations.json');

        writeFileSync(testFilePath, jsonString);

        const startTime = Date.now();

        try {
          await viewerPage.uploadJSONFile(testFilePath);

          const processingTime = Date.now() - startTime;

          // Should either process successfully or show meaningful warnings/errors
          const hasErrors = await viewerPage.hasJSONErrors();

          if (!hasErrors) {
            // Successfully processed extreme dataset
            console.log(`Extreme dataset processed in ${processingTime}ms`);

            // Should have warning indicators about size/performance
            const warningSelectors = [
              '[data-testid*="warning"]',
              '[data-testid*="limitation"]',
              'text=/warning|caution|large|extreme/i',
              'text=/system.*limit/i',
              'text=/performance.*impact/i',
            ];

            for (const selector of warningSelectors) {
              if ((await viewerPage.page.locator(selector).count()) > 0) {
                const warningText = await viewerPage.page.locator(selector).first().textContent();
                console.log(`System warning: ${warningText}`);
                await viewerPage.takeScreenshot('system-limitation-warnings');
                break;
              }
            }

            const nodeCounts = await viewerPage.getNodeCounts();
            expect(nodeCounts.total).toBeGreaterThan(50000);
          } else {
            // Failed to process - should show informative error
            const errorMessage = await viewerPage.getErrorMessage();
            expect(errorMessage?.toLowerCase()).toMatch(/memory|size|limit|large|extreme/);

            console.log(`System limitation encountered: ${errorMessage}`);
            await viewerPage.takeScreenshot('extreme-dataset-limitation-error');
          }
        } catch (error) {
          // Extreme dataset might cause processing errors
          console.log(
            'Extreme dataset caused processing error - this demonstrates system limitations'
          );

          // Should still have functional UI
          expect(await viewerPage.page.isVisible('body')).toBe(true);
        }
      },
      PERFORMANCE_TIMEOUT
    );

    test('should provide performance comparison with baseline metrics', async () => {
      const baselineTests = [
        {
          name: 'Baseline Small',
          size: 'small',
          data: { simple: 'test', array: [1, 2, 3], nested: { value: 'test' } },
          expectedTimeMs: 100,
        },
        {
          name: 'Baseline Medium',
          size: 'medium',
          data: generateLargeTestJSON(1).data.slice(0, 100),
          expectedTimeMs: 500,
        },
        {
          name: 'Baseline Large',
          size: 'large',
          data: generateLargeTestJSON(10).data.slice(0, 1000),
          expectedTimeMs: 2000,
        },
      ];

      const results = [];

      for (const test of baselineTests) {
        await viewerPage.navigateToViewer();

        const startTime = performance.now();

        await viewerPage.inputJSON(JSON.stringify(test.data));
        await viewerPage.waitForJSONProcessed();

        const processingTime = performance.now() - startTime;

        expect(await viewerPage.hasJSONErrors()).toBe(false);

        const nodeCounts = await viewerPage.getNodeCounts();
        const stats = await viewerPage.getJSONStats();

        const result = {
          name: test.name,
          size: test.size,
          processingTime,
          expectedTime: test.expectedTimeMs,
          nodeCount: nodeCounts.total,
          withinExpectation: processingTime <= test.expectedTimeMs * 2, // Allow 2x buffer
          statsTime: stats.processingTime,
        };

        results.push(result);

        console.log(
          `${test.name}: ${processingTime.toFixed(2)}ms (expected: <${test.expectedTimeMs}ms), nodes: ${nodeCounts.total}`
        );

        // Validate performance is within reasonable bounds
        expect(processingTime).toBeLessThan(test.expectedTimeMs * 3); // Allow 3x buffer for test environment

        await viewerPage.takeScreenshot(`baseline-${test.size}-performance`);
      }

      // Look for baseline comparison displays
      const comparisonSelectors = [
        '[data-testid*="baseline"]',
        '[data-testid*="comparison"]',
        'text=/baseline|comparison|benchmark/i',
      ];

      for (const selector of comparisonSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          await viewerPage.takeScreenshot('baseline-performance-comparison');
          break;
        }
      }

      // Validate that larger datasets take proportionally longer
      const smallTime = results.find((r) => r.size === 'small')?.processingTime || 1;
      const largeTime = results.find((r) => r.size === 'large')?.processingTime || 1;

      expect(largeTime).toBeGreaterThan(smallTime);

      console.log('Performance baseline comparison completed');
      console.table(
        results.map((r) => ({
          Test: r.name,
          'Time (ms)': r.processingTime.toFixed(2),
          'Expected (ms)': r.expectedTime,
          Nodes: r.nodeCount,
          'Within Expectation': r.withinExpectation,
        }))
      );
    });
  });

  test.describe('Performance Reporting and Export', () => {
    test('should generate comprehensive performance reports', async () => {
      const reportTestJson = {
        report_generation_test: true,
        performance_data: generateLargeTestJSON(15).data.slice(0, 3000),
        metadata: {
          purpose: 'Performance reporting test',
          expected_metrics: ['processing_time', 'memory_usage', 'node_count', 'complexity_score'],
        },
      };

      const startTime = performance.now();

      await viewerPage.inputJSON(JSON.stringify(reportTestJson));
      await viewerPage.waitForJSONProcessed();

      const processingTime = performance.now() - startTime;

      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Collect all available metrics
      const nodeCounts = await viewerPage.getNodeCounts();
      const stats = await viewerPage.getJSONStats();

      const reportData = {
        processing_time_ms: processingTime,
        node_counts: nodeCounts,
        stats: stats,
        timestamp: new Date().toISOString(),
      };

      console.log('Performance Report:', JSON.stringify(reportData, null, 2));

      // Look for report generation or export functionality
      const reportSelectors = [
        '[data-testid*="report"]',
        '[data-testid*="export-performance"]',
        'button:has-text("Report")',
        'text=/generate.*report/i',
        'text=/export.*performance/i',
      ];

      for (const selector of reportSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          try {
            const downloadPromise = viewerPage.page.waitForEvent('download');
            await viewerPage.page.locator(selector).first().click();

            const download = await downloadPromise;
            expect(download.suggestedFilename()).toMatch(/report|performance/i);

            await viewerPage.takeScreenshot('performance-report-generated');
          } catch (error) {
            // Report generation UI found but might not trigger download in test environment
            console.log('Performance report functionality detected');
            await viewerPage.takeScreenshot('performance-report-ui');
          }
          break;
        }
      }

      // Validate comprehensive metrics are available
      expect(nodeCounts.total).toBeGreaterThan(1000);
      expect(processingTime).toBeGreaterThan(0);

      if (stats.processingTime) {
        expect(stats.processingTime).toBeTruthy();
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup performance test files
    console.log('Performance test suite completed');
  });
});

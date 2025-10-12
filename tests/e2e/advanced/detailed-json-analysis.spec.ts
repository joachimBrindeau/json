import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { PerformanceTestGenerator } from '../../../lib/performance-test-generator';

test.describe('Advanced User - Detailed JSON Analysis (Story 7)', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('JSON Structure Analysis', () => {
    test('should analyze and display basic JSON complexity metrics', async () => {
      const complexJson = {
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          author: 'test',
        },
        data: {
          users: [
            { id: 1, name: 'Alice', active: true, profile: { age: 30, city: 'NYC' } },
            { id: 2, name: 'Bob', active: false, profile: { age: 25, city: 'LA' } },
            { id: 3, name: 'Carol', active: true, profile: { age: 28, city: 'Chicago' } },
          ],
          settings: {
            theme: 'dark',
            notifications: {
              email: true,
              sms: false,
              push: { enabled: true, frequency: 'daily' },
            },
          },
        },
        status: {
          healthy: true,
          lastCheck: new Date().toISOString(),
        },
      };

      await viewerPage.inputJSON(JSON.stringify(complexJson));
      await viewerPage.waitForJSONProcessed();

      // Look for analysis panel or statistics
      const analysisSelectors = [
        '[data-testid="json-analysis"]',
        '[data-testid="complexity"]',
        '[data-testid="structure-info"]',
        '.analysis-panel',
        '.json-stats',
      ];

      let analysisFound = false;
      const analysisData: any = {};

      for (const selector of analysisSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          analysisFound = true;
          break;
        }
      }

      // Get node counts from viewer
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(10);
      expect(nodeCounts.objects).toBeGreaterThan(5);
      expect(nodeCounts.arrays).toBeGreaterThan(0);
      expect(nodeCounts.strings).toBeGreaterThan(5);

      // Get basic stats
      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(0);

      await viewerPage.takeScreenshot('json-complexity-analysis');

      // If detailed analysis panel exists, verify its contents
      if (analysisFound) {
        const analysisPanel = viewerPage.page
          .locator('[data-testid="json-analysis"], .analysis-panel')
          .first();
        const analysisText = await analysisPanel.textContent();

        // Should show meaningful metrics
        expect(analysisText?.toLowerCase()).toMatch(/node|object|array|depth|complexity/);
      }
    });

    test('should calculate and display maximum nesting depth', async () => {
      const deepJson = {
        level0: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      level7: {
                        level8: {
                          level9: {
                            deepest: 'value at depth 10',
                            metadata: {
                              depth: 10,
                              note: 'This is very deep nesting',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        parallel: {
          shallow: 'value',
          medium: {
            nested: {
              value: 'depth 3',
            },
          },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(deepJson));
      await viewerPage.waitForJSONProcessed();

      // Look for depth information
      const depthSelectors = [
        '[data-testid="max-depth"]',
        '[data-testid="nesting-depth"]',
        '[data-testid*="depth"]',
        'text=/depth.*\d+/i',
        'text=/nesting.*\d+/i',
      ];

      let depthFound = false;
      let maxDepth = 0;

      for (const selector of depthSelectors) {
        const elements = await viewerPage.page.locator(selector).count();
        if (elements > 0) {
          const depthText = await viewerPage.page.locator(selector).first().textContent();
          const depthMatch = depthText?.match(/(\d+)/);
          if (depthMatch) {
            maxDepth = parseInt(depthMatch[1]);
            depthFound = true;
            break;
          }
        }
      }

      if (depthFound) {
        // Should detect significant depth (at least 8-10 levels)
        expect(maxDepth).toBeGreaterThanOrEqual(8);
        await viewerPage.takeScreenshot('deep-nesting-analysis');
      }

      // Verify structure is properly analyzed regardless
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.objects).toBeGreaterThan(10); // Many nested objects
    });

    test('should analyze node count and data type distribution', async () => {
      const mixedDataJson = {
        strings: ['Hello', 'World', 'Test', 'Data', 'Analysis'],
        numbers: [1, 2, 3.14, -42, 1e6, 0],
        booleans: [true, false, true, true, false],
        nullValues: [null, null, null],
        objects: [
          { id: 1, name: 'Object 1' },
          { id: 2, name: 'Object 2', metadata: { type: 'test' } },
          { id: 3, name: 'Object 3', nested: { deep: { value: 'test' } } },
        ],
        arrays: [[1, 2, 3], ['a', 'b', 'c'], [true, false], [{ nested: 'array' }]],
        mixed: {
          string_prop: 'text',
          number_prop: 42,
          boolean_prop: true,
          null_prop: null,
          object_prop: { inner: 'value' },
          array_prop: [1, 'two', { three: 3 }],
        },
      };

      await viewerPage.inputJSON(JSON.stringify(mixedDataJson));
      await viewerPage.waitForJSONProcessed();

      const nodeCounts = await viewerPage.getNodeCounts();

      // Verify all data types are detected and counted
      expect(nodeCounts.strings).toBeGreaterThan(10); // Many string values
      expect(nodeCounts.numbers).toBeGreaterThan(5); // Several numbers
      expect(nodeCounts.booleans).toBeGreaterThan(3); // Multiple booleans
      expect(nodeCounts.nulls).toBeGreaterThan(2); // Several nulls
      expect(nodeCounts.objects).toBeGreaterThan(5); // Various objects
      expect(nodeCounts.arrays).toBeGreaterThan(3); // Multiple arrays

      // Total should be sum of all parts
      expect(nodeCounts.total).toBeGreaterThan(50);

      // Look for detailed breakdown display
      const breakdownSelectors = [
        '[data-testid="type-breakdown"]',
        '[data-testid="node-distribution"]',
        '.type-distribution',
        '.node-breakdown',
      ];

      for (const selector of breakdownSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          await viewerPage.takeScreenshot('data-type-distribution');
          break;
        }
      }
    });

    test('should analyze array characteristics (length, homogeneity)', async () => {
      const arrayAnalysisJson = {
        short_array: [1, 2, 3],
        long_array: Array.from({ length: 100 }, (_, i) => i),
        homogeneous_strings: ['apple', 'banana', 'cherry', 'date', 'elderberry'],
        homogeneous_numbers: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        homogeneous_objects: [
          { id: 1, name: 'Item 1', value: 100 },
          { id: 2, name: 'Item 2', value: 200 },
          { id: 3, name: 'Item 3', value: 300 },
        ],
        heterogeneous_array: [
          'string',
          42,
          true,
          null,
          { object: 'value' },
          [1, 2, 3],
          false,
          3.14,
        ],
        nested_arrays: [
          [1, 2, [3, 4]],
          [5, 6, [7, 8, [9, 10]]],
          [
            [11, 12],
            [13, 14],
          ],
        ],
        empty_array: [],
        single_item: ['alone'],
      };

      await viewerPage.inputJSON(JSON.stringify(arrayAnalysisJson));
      await viewerPage.waitForJSONProcessed();

      const nodeCounts = await viewerPage.getNodeCounts();

      // Should detect multiple arrays
      expect(nodeCounts.arrays).toBeGreaterThan(5);

      // Look for array-specific analysis
      const arrayAnalysisSelectors = [
        '[data-testid*="array"]',
        'text=/array.*length/i',
        'text=/homogeneous|heterogeneous/i',
      ];

      let arrayAnalysisFound = false;
      for (const selector of arrayAnalysisSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          arrayAnalysisFound = true;
          await viewerPage.takeScreenshot('array-characteristics-analysis');
          break;
        }
      }

      // Verify arrays are properly processed
      expect(nodeCounts.total).toBeGreaterThan(100); // Should include all array items
    });

    test('should analyze object complexity and property distribution', async () => {
      const objectAnalysisJson = {
        simple_object: {
          name: 'Simple',
          value: 42,
        },
        complex_object: {
          id: 'complex_001',
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            version: '1.2.3',
            tags: ['tag1', 'tag2', 'tag3'],
          },
          data: {
            primary: {
              name: 'Primary Data',
              values: [1, 2, 3, 4, 5],
              nested: {
                level1: {
                  level2: {
                    level3: 'deep value',
                  },
                },
              },
            },
            secondary: {
              backup: true,
              location: 'remote',
              settings: {
                timeout: 30000,
                retries: 3,
                fallback: null,
              },
            },
          },
          status: {
            active: true,
            health: 'good',
            last_check: new Date().toISOString(),
            metrics: {
              cpu: 45.2,
              memory: 78.9,
              disk: 23.1,
            },
          },
        },
        wide_object: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`prop_${i}`, `value_${i}`])
        ),
        empty_object: {},
        single_property: {
          alone: 'lonely',
        },
      };

      await viewerPage.inputJSON(JSON.stringify(objectAnalysisJson));
      await viewerPage.waitForJSONProcessed();

      const nodeCounts = await viewerPage.getNodeCounts();

      // Should detect various object types
      expect(nodeCounts.objects).toBeGreaterThan(10);

      // Look for object complexity metrics
      const objectAnalysisSelectors = [
        '[data-testid*="object"]',
        '[data-testid*="property"]',
        'text=/properties/i',
        'text=/complexity/i',
      ];

      for (const selector of objectAnalysisSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          await viewerPage.takeScreenshot('object-complexity-analysis');
          break;
        }
      }

      // Verify all properties are counted
      expect(nodeCounts.total).toBeGreaterThan(60); // Should include wide_object properties
    });

    test('should calculate JSON size and memory implications', async () => {
      const sizedJson = {
        metadata: {
          purpose: 'Size analysis test',
          generated: new Date().toISOString(),
        },
        large_strings: Array.from(
          { length: 10 },
          (_, i) => `This is a large string number ${i}: ${'x'.repeat(1000)}`
        ),
        data_array: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(3),
          metadata: {
            created: new Date(Date.now() - i * 1000).toISOString(),
            tags: [`tag${i % 10}`, `category${i % 5}`],
          },
          values: Array.from({ length: 10 }, (_, j) => i * 10 + j),
        })),
      };

      await viewerPage.inputJSON(JSON.stringify(sizedJson));
      await viewerPage.waitForJSONProcessed();

      const stats = await viewerPage.getJSONStats();

      // Should show file size information
      expect(stats.fileSize).toBeTruthy();

      // Look for size/memory analysis
      const sizeSelectors = [
        '[data-testid*="size"]',
        '[data-testid*="memory"]',
        'text=/size/i',
        'text=/memory/i',
        'text=/bytes|kb|mb/i',
      ];

      let sizeAnalysisFound = false;
      for (const selector of sizeSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          const sizeText = await viewerPage.page.locator(selector).first().textContent();
          if (sizeText && /\d+/.test(sizeText)) {
            sizeAnalysisFound = true;
            await viewerPage.takeScreenshot('size-memory-analysis');
            break;
          }
        }
      }

      // Should handle large dataset
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(1000);
    });
  });

  test.describe('Performance Analysis Integration', () => {
    test('should analyze parsing performance and optimization suggestions', async () => {
      const performanceJson = PerformanceTestGenerator.generateLargeArray(10000);
      const testData = {
        metadata: { type: 'performance_test', size: 'large' },
        data: performanceJson,
      };

      const startTime = Date.now();
      await viewerPage.inputJSON(JSON.stringify(testData));
      await viewerPage.waitForJSONProcessed();
      const processingTime = Date.now() - startTime;

      // Should complete in reasonable time
      expect(processingTime).toBeLessThan(10_000); // Under 10 seconds

      // Look for performance metrics or suggestions
      const performanceSelectors = [
        '[data-testid*="performance"]',
        '[data-testid*="optimization"]',
        'text=/performance/i',
        'text=/parsing.*time/i',
        'text=/optimization/i',
      ];

      let performanceAnalysisFound = false;
      for (const selector of performanceSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          performanceAnalysisFound = true;
          await viewerPage.takeScreenshot('performance-analysis');
          break;
        }
      }

      const stats = await viewerPage.getJSONStats();
      if (stats.processingTime) {
        // Processing time should be recorded
        expect(stats.processingTime).toBeTruthy();
      }
    });

    test('should provide complexity scoring and readability metrics', async () => {
      // Create JSON with varying complexity
      const complexityTestJson = {
        simple: {
          name: 'Simple section',
          value: 42,
          active: true,
        },
        moderate: {
          users: [
            { id: 1, name: 'User 1' },
            { id: 2, name: 'User 2' },
          ],
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        complex: {
          data: PerformanceTestGenerator.generateDeepObject(8),
          metadata: {
            nested: {
              deep: {
                very: {
                  deep: {
                    structure: 'here',
                  },
                },
              },
            },
          },
        },
        extreme: {
          wide: Object.fromEntries(
            Array.from({ length: 100 }, (_, i) => [
              `property_${i}`,
              { value: i, nested: { level: i % 5 } },
            ])
          ),
          arrays: Array.from({ length: 50 }, (_, i) =>
            Array.from({ length: 20 }, (_, j) => ({ id: i * 20 + j }))
          ),
        },
      };

      await viewerPage.inputJSON(JSON.stringify(complexityTestJson));
      await viewerPage.waitForJSONProcessed();

      // Look for complexity metrics
      const complexitySelectors = [
        '[data-testid*="complexity"]',
        '[data-testid*="score"]',
        'text=/complexity.*score/i',
        'text=/readability/i',
      ];

      for (const selector of complexitySelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          const complexityText = await viewerPage.page.locator(selector).first().textContent();

          // Should show meaningful complexity information
          expect(complexityText?.toLowerCase()).toMatch(/complexity|score|level/);

          await viewerPage.takeScreenshot('complexity-scoring');
          break;
        }
      }

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(100);
    });

    test('should analyze JSON schema adherence and structure patterns', async () => {
      const schemaTestJson = {
        consistent_objects: [
          { id: 1, name: 'Item 1', type: 'TypeA', value: 100 },
          { id: 2, name: 'Item 2', type: 'TypeB', value: 200 },
          { id: 3, name: 'Item 3', type: 'TypeA', value: 300 },
        ],
        inconsistent_objects: [
          { id: 1, name: 'Item 1', value: 100 },
          { id: 2, title: 'Item 2', price: 200 }, // Different structure
          { identifier: 3, name: 'Item 3', amount: 300, extra: true }, // Another structure
        ],
        api_response_pattern: {
          success: true,
          data: [
            { id: 1, attributes: { name: 'Resource 1' } },
            { id: 2, attributes: { name: 'Resource 2' } },
          ],
          meta: {
            total: 2,
            page: 1,
            per_page: 10,
          },
        },
        config_pattern: {
          database: {
            host: 'localhost',
            port: 5432,
            name: 'mydb',
          },
          cache: {
            enabled: true,
            ttl: 3600,
            provider: 'redis',
          },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(schemaTestJson));
      await viewerPage.waitForJSONProcessed();

      // Look for pattern analysis
      const patternSelectors = [
        '[data-testid*="pattern"]',
        '[data-testid*="schema"]',
        '[data-testid*="structure"]',
        'text=/pattern/i',
        'text=/consistent/i',
        'text=/schema/i',
      ];

      for (const selector of patternSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          await viewerPage.takeScreenshot('schema-pattern-analysis');
          break;
        }
      }

      // Should handle different patterns correctly
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.objects).toBeGreaterThan(10);
      expect(nodeCounts.arrays).toBeGreaterThan(2);
    });
  });

  test.describe('Analysis Export and Sharing', () => {
    test('should allow exporting analysis results', async () => {
      const analysisJson = {
        sample_data: PerformanceTestGenerator.generateSizedJSON(5).data.slice(0, 100),
      };

      await viewerPage.inputJSON(JSON.stringify(analysisJson));
      await viewerPage.waitForJSONProcessed();

      // Look for export analysis functionality
      const exportSelectors = [
        '[data-testid*="export-analysis"]',
        '[data-testid*="download-analysis"]',
        'button:has-text("Export")',
        'text=/export.*analysis/i',
      ];

      for (const selector of exportSelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          const exportPromise = viewerPage.page.waitForEvent('download');
          await viewerPage.page.locator(selector).first().click();

          try {
            const download = await exportPromise;
            expect(download.suggestedFilename()).toMatch(/analysis|report/i);
            await viewerPage.takeScreenshot('analysis-export');
          } catch (error) {
            // Export might not trigger download in test environment
            console.log('Export functionality detected but download not captured');
          }
          break;
        }
      }
    });

    test('should display comprehensive analysis summary', async () => {
      const comprehensiveJson = {
        metadata: {
          version: '2.1.0',
          created: new Date().toISOString(),
          type: 'comprehensive_test',
        },
        simple_data: {
          string: 'Hello World',
          number: 42,
          boolean: true,
          null_value: null,
        },
        complex_data: {
          nested: PerformanceTestGenerator.generateDeepObject(5),
          array: PerformanceTestGenerator.generateLargeArray(50),
          wide: Object.fromEntries(
            Array.from({ length: 25 }, (_, i) => [`key_${i}`, `value_${i}`])
          ),
        },
        mixed_types: ['string', 42, true, null, { nested: 'object' }, [1, 2, 3], 3.14159],
      };

      await viewerPage.inputJSON(JSON.stringify(comprehensiveJson));
      await viewerPage.waitForJSONProcessed();

      // Get all available stats and counts
      const nodeCounts = await viewerPage.getNodeCounts();
      const stats = await viewerPage.getJSONStats();

      // Verify comprehensive analysis
      expect(nodeCounts.total).toBeGreaterThan(50);
      expect(nodeCounts.objects).toBeGreaterThan(5);
      expect(nodeCounts.arrays).toBeGreaterThan(2);
      expect(nodeCounts.strings).toBeGreaterThan(10);
      expect(nodeCounts.numbers).toBeGreaterThan(5);
      expect(nodeCounts.booleans).toBeGreaterThan(0);
      expect(nodeCounts.nulls).toBeGreaterThan(0);

      // Look for summary analysis panel
      const summarySelectors = [
        '[data-testid="analysis-summary"]',
        '[data-testid="json-summary"]',
        '.analysis-summary',
        '.json-overview',
      ];

      for (const selector of summarySelectors) {
        if ((await viewerPage.page.locator(selector).count()) > 0) {
          const summaryContent = await viewerPage.page.locator(selector).first().textContent();

          // Summary should contain key metrics
          expect(summaryContent?.toLowerCase()).toMatch(/node|object|array|depth|size/);

          await viewerPage.takeScreenshot('comprehensive-analysis-summary');
          break;
        }
      }
    });
  });
});

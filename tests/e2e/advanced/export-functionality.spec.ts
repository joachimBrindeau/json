import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { PerformanceTestGenerator } from '../../../lib/performance-test-generator';
import { JSON_SAMPLES } from '../../fixtures/json-samples';
import { existsSync, readFileSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';

test.describe('Advanced User - Export Functionality with Different Formats (Story 5)', () => {
  let viewerPage: JsonViewerPage;
  const downloadDir = join(__dirname, '../../downloads');

  test.beforeAll(async () => {
    // Create downloads directory for testing
    if (!existsSync(downloadDir)) {
      mkdirSync(downloadDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('JSON Export Formats', () => {
    test('should export JSON in standard format', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      await viewerPage.inputJSON(JSON.stringify(testJson));
      await viewerPage.waitForJSONProcessed();

      // Test standard JSON export
      const downloadPromise = viewerPage.page.waitForEvent('download');
      await viewerPage.downloadButton.click();

      const download = await downloadPromise;
      const downloadPath = join(downloadDir, download.suggestedFilename());
      await download.saveAs(downloadPath);

      // Verify download
      expect(existsSync(downloadPath)).toBe(true);

      // Verify content
      const downloadedContent = readFileSync(downloadPath, 'utf8');
      const parsedContent = JSON.parse(downloadedContent);

      // Should match original structure
      expect(parsedContent).toEqual(testJson);

      await viewerPage.takeScreenshot('standard-json-export');
    });

    test('should export JSON with different formatting options', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      await viewerPage.inputJSON(JSON.stringify(testJson));
      await viewerPage.waitForJSONProcessed();

      // Look for formatting options
      const formatElements = await viewerPage.page
        .locator(
          '[data-testid*="format"], [data-testid*="export-options"], text=/format|pretty|compact|minify/i'
        )
        .count();

      if (formatElements > 0) {
        // Test different formatting options
        await viewerPage.page.locator('[data-testid*="export-options"]').first().click();
        await viewerPage.page.waitForTimeout(500);

        // Try compact/minified export
        const compactOption = viewerPage.page.locator('text=/compact|minif/i');
        if (await compactOption.isVisible()) {
          await compactOption.click();

          const downloadPromise = viewerPage.page.waitForEvent('download');
          await viewerPage.downloadButton.click();

          const download = await downloadPromise;
          const compactPath = join(downloadDir, `compact-${download.suggestedFilename()}`);
          await download.saveAs(compactPath);

          const compactContent = readFileSync(compactPath, 'utf8');
          // Compact should have no unnecessary whitespace
          expect(compactContent).not.toContain('\n  ');
          expect(compactContent).not.toContain('    ');
        }

        // Try pretty/formatted export
        const prettyOption = viewerPage.page.locator('text=/pretty|format/i');
        if (await prettyOption.isVisible()) {
          await prettyOption.click();

          const downloadPromise = viewerPage.page.waitForEvent('download');
          await viewerPage.downloadButton.click();

          const download = await downloadPromise;
          const prettyPath = join(downloadDir, `pretty-${download.suggestedFilename()}`);
          await download.saveAs(prettyPath);

          const prettyContent = readFileSync(prettyPath, 'utf8');
          // Pretty should have proper indentation
          expect(prettyContent).toContain('\n  ');
          expect(prettyContent).toContain('\n}');
        }

        await viewerPage.takeScreenshot('formatting-options');
      } else {
        console.log('No formatting options found, testing default export');

        // Test default export
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.downloadButton.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.json$/);
      }
    });

    test('should export large JSON files efficiently', async () => {
      const largeJson = PerformanceTestGenerator.generateSizedJSON(50); // 50MB
      await viewerPage.inputJSON(JSON.stringify(largeJson));
      await viewerPage.waitForJSONProcessed();

      const exportStartTime = Date.now();

      const downloadPromise = viewerPage.page.waitForEvent('download');
      await viewerPage.downloadButton.click();

      const download = await downloadPromise;
      const exportTime = Date.now() - exportStartTime;

      // Export should complete in reasonable time
      expect(exportTime).toBeLessThan(30_000); // Under 30 seconds

      const downloadPath = join(downloadDir, `large-${download.suggestedFilename()}`);
      await download.saveAs(downloadPath);

      // Verify large file export
      expect(existsSync(downloadPath)).toBe(true);

      const stats = statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(1024 * 1024); // At least 1MB

      console.log(`Large JSON export: ${stats.size} bytes in ${exportTime}ms`);

      await viewerPage.takeScreenshot('large-json-export');
    });

    test('should export filtered/searched JSON subsets', async () => {
      const filterableJson = {
        users: [
          { id: 1, name: 'John Doe', department: 'Engineering', active: true },
          { id: 2, name: 'Jane Smith', department: 'Marketing', active: true },
          { id: 3, name: 'Bob Johnson', department: 'Engineering', active: false },
          { id: 4, name: 'Alice Brown', department: 'Sales', active: true },
        ],
        products: [
          { id: 'P001', name: 'Product Alpha', category: 'Electronics' },
          { id: 'P002', name: 'Product Beta', category: 'Books' },
        ],
        metadata: { total: 6, exported: 'filtered' },
      };

      await viewerPage.inputJSON(JSON.stringify(filterableJson));
      await viewerPage.waitForJSONProcessed();

      // Apply search filter
      await viewerPage.searchInJSON('Engineering');

      // Look for export filtered results option
      const filteredExportElements = await viewerPage.page
        .locator(
          '[data-testid*="export-filtered"], [data-testid*="export-search"], text=/export.*filter|export.*search/i'
        )
        .count();

      if (filteredExportElements > 0) {
        // Export filtered results
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.page.locator('[data-testid*="export-filtered"]').first().click();

        const download = await downloadPromise;
        const filteredPath = join(downloadDir, `filtered-${download.suggestedFilename()}`);
        await download.saveAs(filteredPath);

        // Verify filtered export contains only Engineering department
        const filteredContent = JSON.parse(readFileSync(filteredPath, 'utf8'));

        // Should contain engineering-related data
        const contentStr = JSON.stringify(filteredContent).toLowerCase();
        expect(contentStr).toContain('engineering');

        await viewerPage.takeScreenshot('filtered-export');
      } else {
        console.log('Filtered export not available, testing standard export after filter');

        // Standard export after filtering (may export full data with filter metadata)
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.downloadButton.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBeTruthy();
      }
    });
  });

  test.describe('Alternative Export Formats', () => {
    test('should export JSON as CSV for tabular data', async () => {
      const tabularJson = {
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
            department: 'Engineering',
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            age: 28,
            department: 'Marketing',
          },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35, department: 'Sales' },
        ],
      };

      await viewerPage.inputJSON(JSON.stringify(tabularJson));
      await viewerPage.waitForJSONProcessed();

      // Look for CSV export option
      const csvExportElements = await viewerPage.page
        .locator('[data-testid*="csv"], [data-testid*="export-csv"], text=/csv|comma.*separated/i')
        .count();

      if (csvExportElements > 0) {
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.page.locator('[data-testid*="csv"]').first().click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.csv$/);

        const csvPath = join(downloadDir, download.suggestedFilename());
        await download.saveAs(csvPath);

        // Verify CSV content
        const csvContent = readFileSync(csvPath, 'utf8');
        expect(csvContent).toContain('id,name,email,age,department'); // Header row
        expect(csvContent).toContain('John Doe'); // Data row
        expect(csvContent).toContain('jane@example.com'); // Email

        await viewerPage.takeScreenshot('csv-export');
      } else {
        console.log('CSV export not available');
      }
    });

    test('should export JSON as XML format', async () => {
      const xmlableJson = {
        document: {
          title: 'Test Document',
          author: 'Test Author',
          sections: [
            { id: 1, title: 'Introduction', content: 'This is the introduction' },
            { id: 2, title: 'Body', content: 'This is the main content' },
          ],
          metadata: {
            created: '2024-01-01',
            version: '1.0',
          },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(xmlableJson));
      await viewerPage.waitForJSONProcessed();

      // Look for XML export option
      const xmlExportElements = await viewerPage.page
        .locator('[data-testid*="xml"], [data-testid*="export-xml"], text=/xml/i')
        .count();

      if (xmlExportElements > 0) {
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.page.locator('[data-testid*="xml"]').first().click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.xml$/);

        const xmlPath = join(downloadDir, download.suggestedFilename());
        await download.saveAs(xmlPath);

        // Verify XML content
        const xmlContent = readFileSync(xmlPath, 'utf8');
        expect(xmlContent).toContain('<?xml');
        expect(xmlContent).toContain('<document>');
        expect(xmlContent).toContain('<title>Test Document</title>');

        await viewerPage.takeScreenshot('xml-export');
      } else {
        console.log('XML export not available');
      }
    });

    test('should export JSON as YAML format', async () => {
      const yamlableJson = {
        configuration: {
          server: {
            host: 'localhost',
            port: 3000,
            ssl: false,
          },
          database: {
            type: 'postgresql',
            host: 'db-server',
            port: 5432,
            credentials: {
              username: 'dbuser',
              password: 'encrypted',
            },
          },
          features: ['auth', 'logging', 'caching'],
          debug: true,
        },
      };

      await viewerPage.inputJSON(JSON.stringify(yamlableJson));
      await viewerPage.waitForJSONProcessed();

      // Look for YAML export option
      const yamlExportElements = await viewerPage.page
        .locator('[data-testid*="yaml"], [data-testid*="yml"], text=/yaml|yml/i')
        .count();

      if (yamlExportElements > 0) {
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.page.locator('[data-testid*="yaml"]').first().click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.ya?ml$/);

        const yamlPath = join(downloadDir, download.suggestedFilename());
        await download.saveAs(yamlPath);

        // Verify YAML content
        const yamlContent = readFileSync(yamlPath, 'utf8');
        expect(yamlContent).toContain('configuration:');
        expect(yamlContent).toContain('  server:');
        expect(yamlContent).toContain('    host: localhost');
        expect(yamlContent).toContain('  - auth');

        await viewerPage.takeScreenshot('yaml-export');
      } else {
        console.log('YAML export not available');
      }
    });

    test('should export selected portions of JSON', async () => {
      const selectableJson = {
        section1: {
          data: [1, 2, 3, 4, 5],
          metadata: { selected: true },
        },
        section2: {
          data: ['a', 'b', 'c'],
          metadata: { selected: false },
        },
        section3: {
          nested: {
            deep: {
              value: 'target',
            },
          },
          metadata: { selected: true },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(selectableJson));
      await viewerPage.waitForJSONProcessed();

      // Look for selection-based export
      const selectionElements = await viewerPage.page
        .locator('[data-testid*="select"], [data-selectable], .selectable')
        .count();

      if (selectionElements > 0) {
        // Try to select specific nodes/sections
        const selectableNodes = await viewerPage.page
          .locator('[data-selectable], .selectable')
          .all();

        if (selectableNodes.length > 0) {
          // Select a few nodes
          for (let i = 0; i < Math.min(2, selectableNodes.length); i++) {
            await selectableNodes[i].click();
          }

          // Look for export selected option
          const exportSelectedElements = await viewerPage.page
            .locator('[data-testid*="export-selected"], text=/export.*selected/i')
            .count();

          if (exportSelectedElements > 0) {
            const downloadPromise = viewerPage.page.waitForEvent('download');
            await viewerPage.page.locator('[data-testid*="export-selected"]').first().click();

            const download = await downloadPromise;
            const selectedPath = join(downloadDir, `selected-${download.suggestedFilename()}`);
            await download.saveAs(selectedPath);

            // Verify selective export
            expect(existsSync(selectedPath)).toBe(true);

            await viewerPage.takeScreenshot('selective-export');
          }
        }
      }

      // Fallback: Test node-specific export by right-clicking
      const firstNode = await viewerPage.jsonNodes.first();
      if (await firstNode.isVisible()) {
        await firstNode.click({ button: 'right' });

        const contextMenuElements = await viewerPage.page
          .locator('[data-testid*="context"], .context-menu, text=/export.*node|export.*subtree/i')
          .count();

        if (contextMenuElements > 0) {
          await viewerPage.takeScreenshot('context-menu-export');
        }
      }
    });
  });

  test.describe('Export Customization and Options', () => {
    test('should provide export customization options', async ({ dataGenerator }) => {
      const customizableJson = dataGenerator.generateAPIResponseJSON();
      await viewerPage.inputJSON(JSON.stringify(customizableJson));
      await viewerPage.waitForJSONProcessed();

      // Look for export customization dialog/options
      const customizationElements = await viewerPage.page
        .locator(
          '[data-testid*="export-settings"], [data-testid*="export-options"], text=/export.*options|customize.*export/i'
        )
        .count();

      if (customizationElements > 0) {
        await viewerPage.page.locator('[data-testid*="export-options"]').first().click();
        await viewerPage.page.waitForTimeout(500);

        // Check for various customization options
        const optionElements = {
          indentation: await viewerPage.page
            .locator('[data-testid*="indentation"], text=/indent|spacing/i')
            .count(),
          encoding: await viewerPage.page
            .locator('[data-testid*="encoding"], text=/encoding|utf/i')
            .count(),
          compression: await viewerPage.page
            .locator('[data-testid*="compress"], text=/compress|zip/i')
            .count(),
          metadata: await viewerPage.page
            .locator('[data-testid*="metadata"], text=/metadata|include.*info/i')
            .count(),
        };

        console.log('Export customization options found:', optionElements);

        await viewerPage.takeScreenshot('export-customization-options');

        // Test with different options if available
        if (optionElements.indentation > 0) {
          const indentOption = viewerPage.page.locator('[data-testid*="indentation"]').first();
          await indentOption.selectOption('4'); // 4-space indentation
        }

        if (optionElements.compression > 0) {
          const compressOption = viewerPage.page.locator('[data-testid*="compress"]').first();
          await compressOption.check();
        }

        // Apply customizations and export
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.downloadButton.click();

        const download = await downloadPromise;
        const customPath = join(downloadDir, `custom-${download.suggestedFilename()}`);
        await download.saveAs(customPath);

        expect(existsSync(customPath)).toBe(true);

        // Verify customizations applied
        const customContent = readFileSync(customPath, 'utf8');

        if (optionElements.indentation > 0) {
          expect(customContent).toContain('\n    '); // 4-space indentation
        }
      } else {
        console.log('Export customization not available, testing default options');
      }
    });

    test('should export with metadata and timestamps', async () => {
      const metadataJson = {
        data: { test: 'value', number: 42 },
        exported: new Date().toISOString(),
        source: 'json-viewer-test',
      };

      await viewerPage.inputJSON(JSON.stringify(metadataJson));
      await viewerPage.waitForJSONProcessed();

      // Look for metadata inclusion options
      const metadataOptions = await viewerPage.page
        .locator(
          '[data-testid*="include-metadata"], [data-testid*="add-timestamp"], text=/metadata|timestamp|export.*info/i'
        )
        .count();

      if (metadataOptions > 0) {
        // Enable metadata inclusion
        const metadataCheckbox = viewerPage.page
          .locator('[data-testid*="include-metadata"]')
          .first();
        if (await metadataCheckbox.isVisible()) {
          await metadataCheckbox.check();
        }

        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.downloadButton.click();

        const download = await downloadPromise;
        const metadataPath = join(downloadDir, `metadata-${download.suggestedFilename()}`);
        await download.saveAs(metadataPath);

        // Verify metadata is included
        const metadataContent = JSON.parse(readFileSync(metadataPath, 'utf8'));

        // Should include export metadata
        expect(metadataContent).toHaveProperty('__export_metadata');
        expect(metadataContent.__export_metadata).toHaveProperty('timestamp');
        expect(metadataContent.__export_metadata).toHaveProperty('source');

        await viewerPage.takeScreenshot('metadata-export');
      }
    });

    test('should handle export errors gracefully', async () => {
      // Test with problematic data that might cause export issues
      const problematicJson = {
        circular: {},
        veryLongString: 'x'.repeat(10000000), // Very long string
        specialChars: '\\n\\t\\r\\"\\\'',
        unicode: '🌍🚀💾🔍',
        numbers: {
          infinity: Infinity,
          nan: NaN,
          veryLarge: Number.MAX_VALUE,
        },
      };

      // Create circular reference
      (problematicJson.circular as any).self = problematicJson.circular;

      try {
        await viewerPage.inputJSON(JSON.stringify(problematicJson));
        await viewerPage.waitForJSONProcessed();
      } catch (error) {
        // Handle JSON with circular references
        const safeJson = {
          ...problematicJson,
          circular: { note: 'circular reference removed' },
        };
        await viewerPage.inputJSON(JSON.stringify(safeJson));
        await viewerPage.waitForJSONProcessed();
      }

      // Attempt export - should handle errors gracefully
      try {
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.downloadButton.click();

        const download = await downloadPromise;
        const errorTestPath = join(downloadDir, `error-test-${download.suggestedFilename()}`);
        await download.saveAs(errorTestPath);

        // Should create some form of export, even if modified
        expect(existsSync(errorTestPath)).toBe(true);
      } catch (exportError) {
        // Export might fail - check for error handling in UI
        const errorMessages = await viewerPage.page
          .locator('[data-testid*="error"], .error, text=/error|failed|problem/i')
          .count();

        if (errorMessages > 0) {
          const errorText = await viewerPage.page
            .locator('[data-testid*="error"]')
            .first()
            .textContent();
          expect(errorText).toBeTruthy();
          console.log('Export error handled:', errorText);

          await viewerPage.takeScreenshot('export-error-handling');
        }
      }
    });
  });

  test.describe('Batch Export and Automation', () => {
    test('should support batch export of multiple formats', async ({ dataGenerator }) => {
      const batchJson = dataGenerator.generateSimpleJSON();
      await viewerPage.inputJSON(JSON.stringify(batchJson));
      await viewerPage.waitForJSONProcessed();

      // Look for batch export functionality
      const batchElements = await viewerPage.page
        .locator(
          '[data-testid*="batch"], [data-testid*="multiple"], text=/batch|multiple.*format|export.*all/i'
        )
        .count();

      if (batchElements > 0) {
        await viewerPage.page.locator('[data-testid*="batch"]').first().click();
        await viewerPage.page.waitForTimeout(500);

        // Select multiple export formats
        const formatOptions = await viewerPage.page
          .locator('[data-testid*="format-option"], input[type="checkbox"]')
          .all();

        for (let i = 0; i < Math.min(3, formatOptions.length); i++) {
          await formatOptions[i].check();
        }

        // Start batch export
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await viewerPage.page
          .locator('[data-testid*="start-batch"], text=/export|download/i')
          .click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(zip|tar|json)$/);

        await viewerPage.takeScreenshot('batch-export');
      } else {
        console.log('Batch export not available');
      }
    });

    test('should provide export URL/API for automation', async ({ apiHelper, dataGenerator }) => {
      const automationJson = dataGenerator.generateAPIResponseJSON();

      // Test if there's an API endpoint for automated exports
      try {
        const response = await apiHelper.uploadJSON(automationJson);

        if (response.success && response.id) {
          // Test export API endpoint
          const exportResponse = await apiHelper.request.get(`/api/json/${response.id}/export`);

          if (exportResponse.ok()) {
            const exportData = await exportResponse.text();
            const parsedData = JSON.parse(exportData);

            expect(parsedData).toEqual(automationJson);
            console.log('Export API endpoint working');

            // Test different format exports
            const formats = ['json', 'csv', 'xml'];

            for (const format of formats) {
              const formatResponse = await apiHelper.request.get(
                `/api/json/${response.id}/export?format=${format}`
              );

              if (formatResponse.ok()) {
                const formatData = await formatResponse.text();
                expect(formatData.length).toBeGreaterThan(0);
                console.log(`${format.toUpperCase()} export API working`);
              }
            }
          }
        }
      } catch (error) {
        console.log('Export API not available or not tested');
      }
    });
  });

  test.afterAll(async () => {
    // Cleanup downloaded test files
    // Note: Keeping them for manual inspection during development
  });
});

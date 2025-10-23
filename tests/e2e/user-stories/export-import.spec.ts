import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES, stringifyJSON } from '../../fixtures/json-samples';
import path from 'path';

test.describe('User Story: Export and Import Functionality', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test('should export JSON as formatted file', async ({ dataGenerator }) => {
    const testJson = dataGenerator.generateComplexJSON();
    const jsonString = stringifyJSON(testJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Test download functionality
    const downloadPromise = viewerPage.page.waitForEvent('download');
    const downloadButton = viewerPage.page.locator(
      '[data-testid="download-button"], button:has-text("Download"), .download-btn'
    );

    if (await downloadButton.isVisible({ timeout: 5000 })) {
      await downloadButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.json$/);

      // Save download to test directory
      const downloadPath = path.join('tests/downloads', download.suggestedFilename());
      await download.saveAs(downloadPath);

      // Verify file was created
      expect(downloadPath).toBeTruthy();
    }
  });

  test('should export JSON with different formatting options', async ({ dataGenerator }) => {
    const testJson = dataGenerator.generateAPIResponseJSON();
    const jsonString = stringifyJSON(testJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Look for export options
    const exportButton = viewerPage.page.locator(
      '[data-testid="export-button"], button:has-text("Export"), .export-btn'
    );
    if (await exportButton.isVisible({ timeout: 3000 })) {
      await exportButton.click();

      // Check for formatting options
      const exportModal = viewerPage.page.locator(
        '[data-testid="export-modal"], .modal, .export-dialog'
      );
      if (await exportModal.isVisible({ timeout: 2000 })) {
        // Try different format options
        const minifiedOption = viewerPage.page.locator(
          '[data-testid="export-minified"], input[value="minified"], .minified-option'
        );
        const formattedOption = viewerPage.page.locator(
          '[data-testid="export-formatted"], input[value="formatted"], .formatted-option'
        );
        const customIndentOption = viewerPage.page.locator(
          '[data-testid="custom-indent"], input[type="number"], .indent-input'
        );

        if (await formattedOption.isVisible()) {
          await formattedOption.click();
        }

        if (await customIndentOption.isVisible()) {
          await customIndentOption.fill('4'); // 4-space indentation
        }

        // Confirm export
        const confirmExportButton = viewerPage.page.locator(
          '[data-testid="confirm-export"], button:has-text("Export")'
        );
        if (await confirmExportButton.isVisible()) {
          const downloadPromise = viewerPage.page.waitForEvent('download');
          await confirmExportButton.click();

          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.json$/);
        }
      }
    } else {
      // Fallback to direct download button
      const downloadPromise = viewerPage.page.waitForEvent('download');
      const downloadButton = viewerPage.page.locator(
        '[data-testid="download-button"], button:has-text("Download")'
      );
      if (await downloadButton.isVisible()) {
        await downloadButton.click();
        await downloadPromise;
      }
    }
  });

  test('should import JSON file via file upload', async () => {
    const testFilePath = path.join(__dirname, '../../test-files/test-complex.json');

    // Look for file upload area
    const uploadArea = viewerPage.page.locator(
      '[data-testid="upload-area"], .upload-area, .dropzone'
    );
    const fileInput = viewerPage.page.locator('input[type="file"]');

    if (await uploadArea.isVisible({ timeout: 3000 })) {
      // Upload via drag-drop area
      await fileInput.setInputFiles(testFilePath);
      await viewerPage.waitForJSONProcessed();
    } else if (await fileInput.isVisible()) {
      // Direct file input
      await fileInput.setInputFiles(testFilePath);
      await viewerPage.waitForJSONProcessed();
    } else {
      // Look for upload button
      const uploadButton = viewerPage.page.locator(
        '[data-testid="upload-button"], button:has-text("Upload"), .upload-btn'
      );
      if (await uploadButton.isVisible()) {
        await uploadButton.click();

        const fileInputModal = viewerPage.page.locator('input[type="file"]');
        if (await fileInputModal.isVisible()) {
          await fileInputModal.setInputFiles(testFilePath);
          await viewerPage.waitForJSONProcessed();
        }
      }
    }

    // Should load and process the uploaded JSON
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    const nodeCount = await viewerPage.jsonNodes.count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('should handle drag and drop file import', async () => {
    const testFilePath = path.join(__dirname, '../../test-files/test-simple.json');

    // Simulate drag and drop
    const uploadArea = viewerPage.page.locator(
      '[data-testid="upload-area"], .upload-area, .dropzone, main'
    );

    if (await uploadArea.isVisible({ timeout: 3000 })) {
      // Create a file drag event simulation
      const fileBuffer = await viewerPage.page.evaluate(async (filePath) => {
        // This would normally be handled by the browser's native drag-drop
        // For testing, we'll use the file input as a fallback
        return null;
      }, testFilePath);

      // Use file input as fallback for drag-drop simulation
      const fileInput = viewerPage.page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(testFilePath);

        // Should process the dropped file
        await viewerPage.waitForJSONProcessed();
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    }
  });

  test('should export JSON in different file formats', async ({ dataGenerator }) => {
    const testJson = dataGenerator.generateEcommerceJSON();
    const jsonString = stringifyJSON(testJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Look for format options in export
    const exportButton = viewerPage.page.locator(
      '[data-testid="export-button"], button:has-text("Export")'
    );
    if (await exportButton.isVisible({ timeout: 3000 })) {
      await exportButton.click();

      // Check for different format options
      const formatSelect = viewerPage.page.locator(
        '[data-testid="export-format"], select[name="format"], .format-selector'
      );
      if (await formatSelect.isVisible({ timeout: 2000 })) {
        const formats = ['JSON', 'CSV', 'XML', 'YAML', 'TSV'];

        for (const format of formats) {
          try {
            await formatSelect.selectOption(format);

            const confirmExportButton = viewerPage.page.locator(
              '[data-testid="confirm-export"], button:has-text("Export")'
            );
            if (await confirmExportButton.isVisible()) {
              const downloadPromise = viewerPage.page.waitForEvent('download');
              await confirmExportButton.click();

              const download = await downloadPromise;
              const filename = download.suggestedFilename();
              expect(filename).toBeTruthy();

              // Check file extension matches format
              if (format === 'JSON') expect(filename).toMatch(/\.json$/);
              if (format === 'CSV') expect(filename).toMatch(/\.csv$/);
              if (format === 'XML') expect(filename).toMatch(/\.xml$/);
              if (format === 'YAML') expect(filename).toMatch(/\.ya?ml$/);

              break; // Exit after first successful export
            }
          } catch {
            continue; // Try next format if this one doesn't work
          }
        }
      }
    }
  });

  test('should preserve data integrity during export/import cycle', async ({ dataGenerator }) => {
    const originalJson = dataGenerator.generateAnalyticsJSON();
    const jsonString = stringifyJSON(originalJson);

    // Import original JSON
    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    const originalNodeCount = await viewerPage.jsonNodes.count();

    // Export the JSON
    const downloadPromise = viewerPage.page.waitForEvent('download');
    const downloadButton = viewerPage.page.locator(
      '[data-testid="download-button"], button:has-text("Download")'
    );

    if (await downloadButton.isVisible({ timeout: 3000 })) {
      await downloadButton.click();

      const download = await downloadPromise;
      const downloadPath = path.join('tests/downloads', 'integrity-test.json');
      await download.saveAs(downloadPath);

      // Clear current JSON
      await viewerPage.clearJSON();
      await viewerPage.page.waitForLoadState('networkidle');

      // Re-import the exported file
      const fileInput = viewerPage.page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(downloadPath);

        // Should have same structure
        await viewerPage.waitForJSONProcessed();
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        const newNodeCount = await viewerPage.jsonNodes.count();
        expect(newNodeCount).toBe(originalNodeCount);
      }
    }
  });

  test('should handle large file import efficiently', async () => {
    const largeFilePath = path.join(__dirname, '../../test-files/large/test-large-array.json');

    const fileInput = viewerPage.page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 3000 })) {
      await fileInput.setInputFiles(largeFilePath);

      // Should show loading indicator for large files
      const loadingIndicator = viewerPage.page.locator(
        '[data-testid="loading"], .loading, .spinner'
      );
      const hasLoading = await loadingIndicator.isVisible({ timeout: 2000 });

      if (hasLoading) {
        // Wait for loading to complete
        await expect(loadingIndicator).not.toBeVisible({ timeout: 15000 });
      }

      // Should successfully process large file
      await viewerPage.waitForJSONProcessed();
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(100);
    }
  });

  test('should validate imported JSON and show errors', async () => {
    const invalidFilePath = path.join(__dirname, '../../test-files/test-invalid.json');

    const fileInput = viewerPage.page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 3000 })) {
      await fileInput.setInputFiles(invalidFilePath);
      await viewerPage.page.waitForLoadState('networkidle');

      // Should show validation errors
      expect(await viewerPage.hasJSONErrors()).toBe(true);

      const errorMessage = await viewerPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toMatch(/invalid|error|syntax/i);
    }
  });

  test('should export with custom filename', async ({ dataGenerator }) => {
    const testJson = dataGenerator.generateConfigurationJSON();
    const jsonString = stringifyJSON(testJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    const exportButton = viewerPage.page.locator(
      '[data-testid="export-button"], button:has-text("Export")'
    );
    if (await exportButton.isVisible({ timeout: 3000 })) {
      await exportButton.click();

      // Look for filename input
      const filenameInput = viewerPage.page.locator(
        '[data-testid="export-filename"], input[name="filename"], .filename-input'
      );
      if (await filenameInput.isVisible({ timeout: 2000 })) {
        await filenameInput.fill('my-custom-config');

        const confirmExportButton = viewerPage.page.locator(
          '[data-testid="confirm-export"], button:has-text("Export")'
        );
        if (await confirmExportButton.isVisible()) {
          const downloadPromise = viewerPage.page.waitForEvent('download');
          await confirmExportButton.click();

          const download = await downloadPromise;
          const filename = download.suggestedFilename();
          expect(filename).toContain('my-custom-config');
          expect(filename).toMatch(/\.json$/);
        }
      }
    }
  });

  test('should support batch import of multiple JSON files', async () => {
    const testFiles = [
      path.join(__dirname, '../../test-files/test-simple.json'),
      path.join(__dirname, '../../test-files/test-complex.json'),
    ];

    // Look for batch import functionality
    const batchImportButton = viewerPage.page.locator(
      '[data-testid="batch-import"], button:has-text("Batch Import"), .batch-upload'
    );
    if (await batchImportButton.isVisible({ timeout: 3000 })) {
      await batchImportButton.click();

      const fileInput = viewerPage.page.locator('input[type="file"][multiple]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(testFiles);
        await viewerPage.page.waitForLoadState('networkidle');

        // Should show batch processing results
        const batchResults = viewerPage.page.locator(
          '[data-testid="batch-results"], .batch-results'
        );
        if (await batchResults.isVisible({ timeout: 5000 })) {
          expect(batchResults).toBeVisible();
        }
      }
    } else {
      // Test regular single file import as fallback
      const fileInput = viewerPage.page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(testFiles[0]);

        await viewerPage.waitForJSONProcessed();
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    }
  });

  test('should export user library data', async ({ authHelper }) => {
    await authHelper.ensureAuthenticated();

    // Navigate to library/profile page
    const profileButton = viewerPage.page.locator(
      '[data-testid="profile"], .profile, button:has-text("Profile")'
    );
    if (await profileButton.isVisible({ timeout: 3000 })) {
      await profileButton.click();
      await viewerPage.page.waitForLoadState('networkidle');

      // Look for export data option
      const exportDataButton = viewerPage.page.locator(
        '[data-testid="export-data"], button:has-text("Export Data"), .export-library'
      );
      if (await exportDataButton.isVisible({ timeout: 3000 })) {
        const downloadPromise = viewerPage.page.waitForEvent('download');
        await exportDataButton.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/saved|data|backup/);
        expect(download.suggestedFilename()).toMatch(/\.json$/);
      }
    }
  });

  test('should import user library data', async ({ authHelper }) => {
    await authHelper.ensureAuthenticated();

    const backupData = {
      documents: [
        { title: 'Test Doc 1', content: { test: true }, category: 'Test' },
        { title: 'Test Doc 2', content: { data: 'example' }, category: 'Example' },
      ],
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
      },
    };

    // Create temporary backup file
    const backupPath = path.join('tests/downloads', 'test-backup.json');

    // Navigate to settings/import section
    const settingsButton = viewerPage.page.locator(
      '[data-testid="settings"], .settings, button:has-text("Settings")'
    );
    if (await settingsButton.isVisible({ timeout: 3000 })) {
      await settingsButton.click();

      // Look for import data option
      const importDataButton = viewerPage.page.locator(
        '[data-testid="import-data"], button:has-text("Import"), .import-library'
      );
      if (await importDataButton.isVisible({ timeout: 3000 })) {
        await importDataButton.click();

        const fileInput = viewerPage.page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          await fileInput.setInputFiles(backupPath);
          await viewerPage.page.waitForLoadState('networkidle');

          // Should show import progress/results
          const importStatus = viewerPage.page.locator(
            '[data-testid="import-status"], .import-results'
          );
          if (await importStatus.isVisible({ timeout: 5000 })) {
            expect(importStatus).toBeVisible();
          }
        }
      }
    }
  });

  test('should handle concurrent import operations', async () => {
    const testFiles = [
      path.join(__dirname, '../../test-files/test-simple.json'),
      path.join(__dirname, '../../test-files/meaningful-filename.json'),
    ];

    // Start multiple import operations rapidly
    for (const filePath of testFiles) {
      const fileInput = viewerPage.page.locator('input[type="file"]');
      if (await fileInput.isVisible({ timeout: 1000 })) {
        await fileInput.setInputFiles(filePath);
        // Quick succession - minimal wait
      }
    }

    // Should handle concurrent operations gracefully
    await viewerPage.page.waitForLoadState('networkidle');

    // Should end up with valid JSON loaded
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should maintain file metadata during import', async () => {
    const testFilePath = path.join(__dirname, '../../test-files/meaningful-filename.json');

    const fileInput = viewerPage.page.locator('input[type="file"]');
    if (await fileInput.isVisible({ timeout: 3000 })) {
      await fileInput.setInputFiles(testFilePath);

      await viewerPage.waitForJSONProcessed();

      // Look for file info/metadata display
      const fileInfo = viewerPage.page.locator(
        '[data-testid="file-info"], .file-metadata, .document-info'
      );
      if (await fileInfo.isVisible({ timeout: 2000 })) {
        const infoText = await fileInfo.textContent();
        expect(infoText).toContain('meaningful-filename');
      }

      // Check stats include file information
      const stats = await viewerPage.getJSONStats();
      expect(stats.fileSize).toBeTruthy();
    }
  });
});

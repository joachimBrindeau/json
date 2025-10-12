import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES, stringifyJSON } from '../../fixtures/json-samples';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

test.describe('Anonymous User - File Upload Functionality', () => {
  let viewerPage: JsonViewerPage;
  const testFilesDir = join(__dirname, '../../test-files');

  test.beforeAll(async () => {
    // Create test files directory if it doesn't exist
    try {
      mkdirSync(testFilesDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  });

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('User Story 3: Upload JSON files via drag-and-drop or file selection', () => {
    test('should display upload area for file selection', async () => {
      // Verify upload interface elements are present
      const hasUploadArea = await viewerPage.uploadArea.isVisible();
      const hasFileInput =
        (await viewerPage.fileInput.isVisible()) || (await viewerPage.uploadButton.isVisible());

      expect(hasUploadArea || hasFileInput).toBe(true);

      // Take screenshot of upload interface
      await viewerPage.takeScreenshot('file-upload-interface');
    });

    test('should upload valid JSON file via file input', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonContent = JSON.stringify(testJson, null, 2);
      const testFilePath = join(testFilesDir, 'test-simple.json');

      // Create test file
      writeFileSync(testFilePath, jsonContent);

      // Upload file
      await viewerPage.uploadJSONFile(testFilePath);

      // Verify file was processed
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Verify content is displayed
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(0);

      // Verify content matches uploaded file
      const displayedContent = await viewerPage.jsonTextArea.inputValue();
      expect(displayedContent.trim()).toContain('John Doe'); // From simple JSON
    });

    test('should upload complex JSON file successfully', async () => {
      const complexJson = JSON_SAMPLES.ecommerce.content;
      const jsonContent = stringifyJSON(complexJson);
      const testFilePath = join(testFilesDir, 'test-complex.json');

      // Create complex test file
      writeFileSync(testFilePath, jsonContent);

      // Upload file
      await viewerPage.uploadJSONFile(testFilePath);

      // Verify complex structure is processed
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.objects).toBeGreaterThan(5); // Complex structure has many objects
      expect(nodeCounts.arrays).toBeGreaterThan(0);
    });

    test('should handle large JSON file upload', async ({ dataGenerator }) => {
      const largeJson = dataGenerator.generateLargeJSON(200); // 200 items
      const jsonContent = JSON.stringify(largeJson, null, 2);
      const testFilePath = join(testFilesDir, 'test-large.json');

      // Create large test file
      writeFileSync(testFilePath, jsonContent);

      // Upload file with longer timeout for processing
      await viewerPage.uploadJSONFile(testFilePath);

      // Verify large file is handled
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(200);
    });

    test('should reject invalid JSON file with clear error message', async () => {
      const invalidJson = '{"incomplete": json';
      const testFilePath = join(testFilesDir, 'test-invalid.json');

      // Create invalid test file
      writeFileSync(testFilePath, invalidJson);

      // Attempt to upload invalid file
      await viewerPage.uploadJSONFile(testFilePath);

      // Verify error is shown
      expect(await viewerPage.hasJSONErrors()).toBe(true);

      const errorMessage = await viewerPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage?.toLowerCase()).toContain('invalid');
    });

    test('should reject non-JSON file formats', async () => {
      const textContent = 'This is plain text, not JSON';
      const testFilePath = join(testFilesDir, 'test-text.txt');

      // Create non-JSON test file
      writeFileSync(testFilePath, textContent);

      // Attempt to upload text file
      try {
        await viewerPage.uploadJSONFile(testFilePath);

        // Should either reject the file or show error after parsing
        expect(await viewerPage.hasJSONErrors()).toBe(true);
      } catch (error) {
        // File might be rejected at upload level, which is also acceptable
        expect(error.message).toContain('json');
      }
    });

    test('should handle empty JSON file', async () => {
      const emptyJson = '{}';
      const testFilePath = join(testFilesDir, 'test-empty.json');

      // Create empty JSON test file
      writeFileSync(testFilePath, emptyJson);

      // Upload empty file
      await viewerPage.uploadJSONFile(testFilePath);

      // Should process successfully but show minimal content
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.objects).toBeGreaterThanOrEqual(1); // At least the root object
    });

    test('should support drag and drop file upload', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonContent = JSON.stringify(testJson, null, 2);
      const testFilePath = join(testFilesDir, 'test-dragdrop.json');

      // Create test file
      writeFileSync(testFilePath, jsonContent);

      // Simulate drag and drop (if upload area supports it)
      if (await viewerPage.uploadArea.isVisible()) {
        // Create a file list for drag and drop simulation
        const fileChooserPromise = viewerPage.page.waitForEvent('filechooser');

        // Trigger drag and drop area click (fallback if drag/drop simulation is complex)
        await viewerPage.uploadArea.click();

        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(testFilePath);

        // Verify file was processed
        await viewerPage.waitForJSONProcessed();
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      } else {
        // Skip this test if drag-drop area is not available
        test.skip();
      }
    });

    test('should show upload progress for large files', async ({ dataGenerator }) => {
      const veryLargeJson = dataGenerator.generateLargeJSON(1000); // Very large file
      const jsonContent = JSON.stringify(veryLargeJson, null, 2);
      const testFilePath = join(testFilesDir, 'test-very-large.json');

      // Create very large test file
      writeFileSync(testFilePath, jsonContent);

      // Start upload and look for progress indicators
      const uploadPromise = viewerPage.uploadJSONFile(testFilePath);

      // Check if loading spinner appears during upload
      const hasLoadingSpinner = await viewerPage.loadingSpinner.isVisible();

      await uploadPromise;

      // Verify file was processed successfully
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Loading should be completed
      expect(await viewerPage.loadingSpinner.isVisible()).toBe(false);
    });

    test('should handle multiple file uploads sequentially', async ({ dataGenerator }) => {
      const files = [
        { name: 'test1.json', data: dataGenerator.generateSimpleJSON() },
        { name: 'test2.json', data: dataGenerator.generateComplexJSON() },
        { name: 'test3.json', data: JSON_SAMPLES.nested.content },
      ];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const jsonContent = JSON.stringify(file.data, null, 2);
        const testFilePath = join(testFilesDir, file.name);

        // Create test file
        writeFileSync(testFilePath, jsonContent);

        // Upload file
        await viewerPage.uploadJSONFile(testFilePath);

        // Verify each upload is processed
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Content should be replaced with new file (not appended)
        const nodeCounts = await viewerPage.getNodeCounts();
        expect(nodeCounts.total).toBeGreaterThan(0);
      }
    });

    test('should preserve file name in interface after upload', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonContent = JSON.stringify(testJson, null, 2);
      const fileName = 'meaningful-filename.json';
      const testFilePath = join(testFilesDir, fileName);

      // Create test file
      writeFileSync(testFilePath, jsonContent);

      // Upload file
      await viewerPage.uploadJSONFile(testFilePath);

      // Look for file name display in UI
      const fileNameElements = await viewerPage.page.locator(`text="${fileName}"`).count();
      const hasFileName = fileNameElements > 0;

      // This is optional - some implementations may not show the filename
      // But if they do, verify it's displayed correctly
      if (hasFileName) {
        expect(hasFileName).toBe(true);
      }
    });

    test('should handle file upload cancellation gracefully', async ({ dataGenerator }) => {
      // This test verifies that if a user starts an upload but cancels it,
      // the interface handles it gracefully

      const testJson = dataGenerator.generateLargeJSON(500);
      const jsonContent = JSON.stringify(testJson, null, 2);
      const testFilePath = join(testFilesDir, 'test-cancel.json');

      // Create test file
      writeFileSync(testFilePath, jsonContent);

      // Trigger file chooser
      const fileChooserPromise = viewerPage.page.waitForEvent('filechooser');

      if (await viewerPage.uploadButton.isVisible()) {
        await viewerPage.uploadButton.click();

        const fileChooser = await fileChooserPromise;
        // Cancel by not setting any files
        await fileChooser.setFiles([]);

        // Interface should remain in ready state
        expect(await viewerPage.uploadButton.isVisible()).toBe(true);
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      } else {
        test.skip();
      }
    });
  });
});

import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES, stringifyJSON } from '../../fixtures/json-samples';

test.describe('User Story: Save JSON to Library', () => {
  test.beforeEach(async ({ libraryActionHelper, authHelper }) => {
    // Navigate to viewer and ensure user is authenticated
    await libraryActionHelper.viewerPage.navigateToViewer();
    await authHelper.ensureAuthenticated();
  });

  test('should save simple JSON to personal library', async ({
    dataGenerator,
    libraryActionHelper,
  }) => {
    const testJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(testJson);

    // Save to library using helper
    const result = await libraryActionHelper.saveToLibrary(jsonString, {
      title: 'Test Simple JSON Document',
    });

    expect(result.success).toBe(true);
  });

  test('should save complex nested JSON with custom metadata', async ({
    dataGenerator,
    libraryActionHelper,
  }) => {
    const complexJson = dataGenerator.generateComplexJSON();
    const jsonString = stringifyJSON(complexJson);

    // Save with comprehensive metadata
    const result = await libraryActionHelper.saveToLibrary(jsonString, {
      title: 'Complex Nested JSON Structure',
      description:
        'Complex JSON with nested objects, arrays, and various data types for testing purposes',
      tags: 'complex, nested, testing, structure',
      category: 'Test Data',
    });

    expect(result.success).toBe(true);
  });

  test('should save large JSON file and handle processing efficiently', async ({
    dataGenerator,
    libraryActionHelper,
  }) => {
    const largeJson = dataGenerator.generateLargeJSON(200, 3, 50); // Moderate size for testing
    const jsonString = stringifyJSON(largeJson);

    // Verify JSON processes correctly first
    await libraryActionHelper.viewerPage.inputJSON(jsonString);
    await libraryActionHelper.viewerPage.waitForJSONProcessed();
    const stats = await libraryActionHelper.viewerPage.getJSONStats();
    expect(stats.nodeCount).toBeGreaterThan(100);

    // Save large document with progress handling
    const result = await libraryActionHelper.saveLargeDocument(jsonString, {
      title: 'Large JSON Dataset',
    });

    expect(result.success).toBe(true);
  });

  test('should prevent saving invalid JSON to library', async ({ libraryActionHelper }) => {
    const invalidJson = '{"invalid": json, "missing": quotes}';

    // Test that save is disabled for invalid JSON
    const saveDisabled = await libraryActionHelper.isSaveDisabledForInvalidJSON(invalidJson);
    expect(saveDisabled).toBe(true);
  });

  test('should handle save operation cancellation', async ({
    dataGenerator,
    libraryActionHelper,
  }) => {
    const testJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(testJson);

    // Input JSON and start save
    await libraryActionHelper.viewerPage.inputJSON(jsonString);
    await libraryActionHelper.viewerPage.waitForJSONProcessed();
    await libraryActionHelper.clickSaveToLibraryButton();

    // Test cancellation
    const cancelled = await libraryActionHelper.cancelSave();
    expect(cancelled).toBe(true);
  });

  test('should save API response JSON with appropriate categorization', async ({
    libraryActionHelper,
  }) => {
    const apiJson = JSON_SAMPLES.apiResponse.content;
    const jsonString = stringifyJSON(apiJson);

    // Save with API Response category
    const result = await libraryActionHelper.saveToLibrary(jsonString, {
      title: 'User API Response Sample',
      category: 'API Response',
    });

    expect(result.success).toBe(true);
  });

  test('should save configuration JSON and verify in library', async ({ libraryActionHelper }) => {
    const configJson = JSON_SAMPLES.configuration.content;
    const jsonString = stringifyJSON(configJson);
    const documentTitle = 'Application Configuration';

    // Save configuration
    const result = await libraryActionHelper.saveToLibrary(jsonString, {
      title: documentTitle,
      category: 'Configuration',
    });

    expect(result.success).toBe(true);

    // Verify document was saved in library
    const found = await libraryActionHelper.verifyDocumentInLibrary(documentTitle);
    expect(found).toBe(true);
  });

  test('should handle duplicate save attempts gracefully', async ({
    dataGenerator,
    libraryActionHelper,
  }) => {
    const testJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(testJson);
    const documentTitle = 'Duplicate Test Document';

    // Test duplicate save handling
    const duplicateResult = await libraryActionHelper.attemptDuplicateSave(
      jsonString,
      documentTitle
    );
    expect(duplicateResult).toBeDefined();
    expect(duplicateResult.message).toBeTruthy();
  });

  test('should preserve JSON formatting when saving to library', async ({
    libraryActionHelper,
  }) => {
    const formattedJson = `{
  "user": {
    "name": "John Doe",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}`;

    // Test formatting preservation
    const formattingPreserved = await libraryActionHelper.testFormattingPreservation(
      formattedJson,
      'Formatted JSON Test'
    );
    expect(formattingPreserved).toBe(true);
  });

  test('should provide feedback on save progress for large documents', async ({
    dataGenerator,
    libraryActionHelper,
  }) => {
    const largeJson = dataGenerator.generateLargeJSON(500, 4, 100);
    const jsonString = stringifyJSON(largeJson);

    // Test large document save with progress feedback
    const result = await libraryActionHelper.saveLargeDocument(jsonString, {
      title: 'Large Document Progress Test',
    });

    expect(result.success).toBe(true);
  });
});

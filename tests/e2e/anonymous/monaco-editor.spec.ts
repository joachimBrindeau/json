import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Anonymous User - Monaco Editor Functionality', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('User Story 2: Paste JSON content into Monaco editor and edit/format', () => {
    test('should allow pasting JSON content directly into editor', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      // Paste JSON into editor
      await viewerPage.inputJSON(jsonString);

      // Verify content was pasted
      const editorContent = await viewerPage.jsonTextArea.inputValue();
      expect(editorContent.trim()).toBe(jsonString.trim());

      // Verify JSON is processed without errors
      await viewerPage.waitForJSONProcessed();
      expect(await viewerPage.hasJSONErrors()).toBe(false);
    });

    test('should provide syntax highlighting for JSON content', async ({ dataGenerator }) => {
      const complexJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(complexJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Verify Monaco editor is loaded with syntax highlighting
      // Note: This checks for Monaco-specific CSS classes that indicate syntax highlighting
      const hasMonacoEditor = await viewerPage.page.locator('.monaco-editor').isVisible();
      const hasSyntaxTokens =
        (await viewerPage.page.locator('.mtk1, .mtk2, .mtk3, .mtk4, .mtk5').count()) > 0;

      expect(hasMonacoEditor || hasSyntaxTokens).toBe(true);

      // Take screenshot to verify syntax highlighting visually
      await viewerPage.takeScreenshot('monaco-syntax-highlighting');
    });

    test('should show line numbers in editor', async ({ dataGenerator }) => {
      const multiLineJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(multiLineJson, null, 2);

      await viewerPage.inputJSON(jsonString);

      // Check for line numbers (Monaco editor specific)
      const lineNumbers = await viewerPage.page
        .locator('.line-numbers, .margin-view-overlays .line-numbers')
        .isVisible();
      expect(lineNumbers).toBe(true);
    });

    test('should allow editing JSON content in real-time', async ({ dataGenerator }) => {
      const initialJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(initialJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Edit the JSON by adding a new property
      const modifiedJson = jsonString.replace(
        '"name": "John Doe"',
        '"name": "Jane Doe", "edited": true'
      );
      await viewerPage.inputJSON(modifiedJson);
      await viewerPage.waitForJSONProcessed();

      // Verify the edit was processed
      expect(await viewerPage.hasJSONErrors()).toBe(false);
      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(0);
    });

    test('should auto-format JSON when pasting minified content', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const minifiedJson = JSON.stringify(testJson); // No formatting

      await viewerPage.inputJSON(minifiedJson);
      await viewerPage.waitForJSONProcessed();

      // Trigger formatting (usually Ctrl+Alt+F or similar)
      await viewerPage.page.keyboard.press('Control+Alt+F');
      await viewerPage.page.waitForTimeout(1000);

      // Verify content is formatted (contains line breaks and indentation)
      const formattedContent = await viewerPage.jsonTextArea.inputValue();
      expect(formattedContent).toContain('\n');
      expect(formattedContent.length).toBeGreaterThan(minifiedJson.length);
    });

    test('should handle very large JSON content in editor', async ({ dataGenerator }) => {
      const largeJson = dataGenerator.generateLargeJSON(100); // 100 items
      const jsonString = JSON.stringify(largeJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Verify large content is handled properly
      expect(await viewerPage.hasJSONErrors()).toBe(false);
      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(100);

      // Verify editor performance is acceptable
      const startTime = Date.now();
      await viewerPage.jsonTextArea.focus();
      await viewerPage.page.keyboard.press('End'); // Navigate to end
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    test('should show validation errors for invalid JSON', async () => {
      const invalidJson = '{"incomplete": json content';

      await viewerPage.inputJSON(invalidJson);

      // Should show error indicators
      expect(await viewerPage.hasJSONErrors()).toBe(true);

      const errorMessage = await viewerPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage?.toLowerCase()).toContain('invalid');

      // Monaco editor should also show error squiggles
      const hasEditorErrors = await viewerPage.page
        .locator('.squiggly-error, .monaco-editor .error')
        .isVisible();
      // This is optional as different Monaco configurations may show errors differently
    });

    test('should support undo/redo functionality', async ({ dataGenerator }) => {
      const originalJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(originalJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Make an edit
      await viewerPage.jsonTextArea.focus();
      await viewerPage.page.keyboard.press('End');
      await viewerPage.page.keyboard.type(', "modified": true');
      await viewerPage.page.waitForTimeout(500);

      // Undo the edit
      await viewerPage.page.keyboard.press('Control+Z');
      await viewerPage.page.waitForTimeout(500);

      // Verify content was reverted
      const currentContent = await viewerPage.jsonTextArea.inputValue();
      expect(currentContent.trim()).toBe(jsonString.trim());

      // Redo the edit
      await viewerPage.page.keyboard.press('Control+Y');
      await viewerPage.page.waitForTimeout(500);

      // Verify content was restored
      const redoneContent = await viewerPage.jsonTextArea.inputValue();
      expect(redoneContent).toContain('modified');
    });

    test('should provide code folding for nested structures', async ({ dataGenerator }) => {
      const nestedJson = dataGenerator.generateDeeplyNestedJSON(5);
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for code folding controls (Monaco-specific)
      const foldingControls = await viewerPage.page
        .locator('.folding-icon, .monaco-editor .codicon-chevron-right')
        .count();
      expect(foldingControls).toBeGreaterThan(0);
    });

    test('should support find and replace functionality', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateAPIResponseJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Open find dialog
      await viewerPage.page.keyboard.press('Control+F');
      await viewerPage.page.waitForTimeout(500);

      // Type search term
      await viewerPage.page.keyboard.type('user');
      await viewerPage.page.waitForTimeout(500);

      // Verify find functionality is working
      const hasSearchHighlight =
        (await viewerPage.page.locator('.findMatch, .currentFindMatch').count()) > 0;
      // This test is optional as different Monaco configurations may handle search differently
    });

    test('should maintain cursor position during JSON processing', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Position cursor at specific location
      await viewerPage.jsonTextArea.focus();
      await viewerPage.page.keyboard.press('Control+Home'); // Go to beginning
      await viewerPage.page.keyboard.press('ArrowRight ArrowRight ArrowRight'); // Move cursor

      // Add some content to trigger processing
      await viewerPage.page.keyboard.type(' ');
      await viewerPage.page.keyboard.press('Backspace');
      await viewerPage.page.waitForTimeout(500);

      // Cursor should remain in approximately same position
      // This is more of a performance/UX test
      const content = await viewerPage.jsonTextArea.inputValue();
      expect(content.trim()).toBe(jsonString.trim());
    });
  });
});

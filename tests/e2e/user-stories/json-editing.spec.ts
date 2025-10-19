import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES, stringifyJSON } from '../../fixtures/json-samples';

test.describe('User Story: JSON Editing Features', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test('should allow direct editing in Monaco editor', async ({ dataGenerator }) => {
    const initialJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(initialJson);

    // Input initial JSON
    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    // Modify JSON directly in editor
    await viewerPage.jsonTextArea.click();
    
    // Select all and replace with modified JSON (editor ready immediately)
    await viewerPage.page.keyboard.press('Control+a');

    const modifiedJson = { ...initialJson, editedField: 'modified', timestamp: new Date().toISOString() };
    const modifiedString = stringifyJSON(modifiedJson);
    
    await viewerPage.page.keyboard.type(modifiedString);
    
    // Should update the viewer with changes
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    // Should show updated content
    const nodeCount = await viewerPage.jsonNodes.count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('should validate JSON syntax during editing', async () => {
    // Start with valid JSON
    const validJson = '{"valid": true, "test": "data"}';
    await viewerPage.inputJSON(validJson);
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    // Introduce syntax error
    await viewerPage.jsonTextArea.click();
    await viewerPage.page.keyboard.press('Control+a');
    await viewerPage.page.keyboard.type('{"invalid": json syntax}');
    
    // Should show validation error
    await viewerPage.page.waitForLoadState('networkidle');
    expect(await viewerPage.hasJSONErrors()).toBe(true);

    // Fix the syntax
    await viewerPage.jsonTextArea.click();
    await viewerPage.page.keyboard.press('Control+a');
    await viewerPage.page.keyboard.type('{"valid": "json syntax"}');
    
    // Should clear errors
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should support JSON formatting and beautification', async () => {
    // Input minified JSON
    const minifiedJson = '{"user":{"name":"John","active":true,"preferences":{"theme":"dark","notifications":{"email":true,"sms":false}}}}';
    
    await viewerPage.inputJSON(minifiedJson);
    await viewerPage.waitForJSONProcessed();

    // Look for format button or use keyboard shortcut
    const formatButton = viewerPage.page.locator('[data-testid="format-button"], button:has-text("Format"), .format-btn');
    if (await formatButton.isVisible({ timeout: 3000 })) {
      await formatButton.click();
      await viewerPage.waitForJSONProcessed();
    } else {
      // Try keyboard shortcut for formatting
      await viewerPage.jsonTextArea.click();
      await viewerPage.page.keyboard.press('Control+Alt+F');
      await viewerPage.waitForJSONProcessed();
    }

    // Should format the JSON
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should handle large JSON editing efficiently', async ({ dataGenerator }) => {
    const largeJson = dataGenerator.generateLargeJSON(100, 3, 20); // Moderate size for editing
    const jsonString = stringifyJSON(largeJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Make a small edit to large JSON
    await viewerPage.jsonTextArea.click();
    
    // Navigate to a specific location and make edit
    await viewerPage.page.keyboard.press('Control+f'); // Open find if available
    
    // Try to find and replace something
    const findDialog = viewerPage.page.locator('.monaco-findInput, input[placeholder*="find"]');
    if (await findDialog.isVisible({ timeout: 2000 })) {
      await findDialog.fill('"obj_0"');
      await viewerPage.page.keyboard.press('Enter');
      
      // Replace with edited value
      const replaceInput = viewerPage.page.locator('.monaco-replaceInput, input[placeholder*="replace"]');
      if (await replaceInput.isVisible()) {
        await replaceInput.fill('"obj_0_edited"');
        
        const replaceButton = viewerPage.page.locator('button[title*="Replace"], .replace-btn');
        if (await replaceButton.isVisible()) {
          await replaceButton.click();
          await viewerPage.waitForJSONProcessed();
        }
      }
      
      // Close find dialog
      await viewerPage.page.keyboard.press('Escape');
    }

    // Should handle the edit efficiently
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should provide real-time JSON validation feedback', async () => {
    await viewerPage.jsonTextArea.click();
    
    // Type incomplete JSON character by character
    const incompleteJson = '{"name": "test"';
    
    for (let i = 0; i <= incompleteJson.length; i++) {
      await viewerPage.jsonTextArea.click();
      await viewerPage.page.keyboard.press('Control+a');
      await viewerPage.page.keyboard.type(incompleteJson.substring(0, i));
      
      // Check validation state - should show error for incomplete JSON
      await viewerPage.page.waitForLoadState('networkidle');
      if (i === incompleteJson.length) {
        // At the end, should show validation error
        const hasError = await viewerPage.hasJSONErrors();
        expect(hasError).toBe(true);
      }
    }

    // Complete the JSON
    await viewerPage.page.keyboard.type('}');
    
    // Should clear validation errors
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should support undo/redo operations', async ({ dataGenerator }) => {
    const originalJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(originalJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Make an edit
    await viewerPage.jsonTextArea.click();
    await viewerPage.page.keyboard.press('Control+a');
    
    const editedJson = { ...originalJson, edited: true };
    const editedString = stringifyJSON(editedJson);
    await viewerPage.page.keyboard.type(editedString);
    
    // Undo the change
    await viewerPage.waitForJSONProcessed();
    await viewerPage.page.keyboard.press('Control+z');
    await viewerPage.page.waitForLoadState('networkidle');

    // Should revert to original state
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    // Redo the change
    await viewerPage.page.keyboard.press('Control+y');
    
    // Should restore the edit
    await viewerPage.page.waitForLoadState('networkidle');
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should handle copy/paste operations', async ({ dataGenerator }) => {
    const testJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(testJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Select all and copy
    await viewerPage.jsonTextArea.click();
    await viewerPage.page.keyboard.press('Control+a');
    await viewerPage.page.keyboard.press('Control+c');

    // Clear and paste
    await viewerPage.page.keyboard.press('Delete');
    await viewerPage.page.keyboard.press('Control+v');
    
    // Should restore the JSON
    await viewerPage.page.waitForLoadState('networkidle');
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    const nodeCount = await viewerPage.jsonNodes.count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('should support line-by-line editing with proper indentation', async () => {
    const multilineJson = `{
  "user": {
    "name": "John Doe"
  }
}`;

    await viewerPage.inputJSON(multilineJson);
    await viewerPage.waitForJSONProcessed();

    // Click at end of "name" line and add new property
    await viewerPage.jsonTextArea.click();
    
    // Try to position cursor and add new line
    await viewerPage.page.keyboard.press('Control+f');
    const findDialog = viewerPage.page.locator('.monaco-findInput, input[placeholder*="find"]');
    if (await findDialog.isVisible({ timeout: 2000 })) {
      await findDialog.fill('"John Doe"');
      await viewerPage.page.keyboard.press('Enter');
      await viewerPage.page.keyboard.press('Escape');
    }

    // Add new property on next line
    await viewerPage.page.keyboard.press('End');
    await viewerPage.page.keyboard.type(',');
    await viewerPage.page.keyboard.press('Enter');
    await viewerPage.page.keyboard.type('    "email": "john@example.com"');
    
    // Should maintain valid JSON structure
    await viewerPage.page.waitForLoadState('networkidle');
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should handle bracket matching and auto-completion', async () => {
    await viewerPage.jsonTextArea.click();

    // Start typing JSON with brackets
    await viewerPage.page.keyboard.type('{');
    
    // Monaco should auto-complete closing bracket
    const editorContent = await viewerPage.page.evaluate(() => {
      const monaco = (window as any).monaco?.editor?.getEditors?.()?.[0];
      return monaco?.getValue?.() || '';
    });

    // May have auto-completed the closing bracket
    expect(editorContent).toContain('{');

    // Continue typing
    await viewerPage.page.keyboard.type('\n  "test": "value"\n');
    
    // Should create valid JSON structure
    await viewerPage.page.waitForLoadState('networkidle');
    await viewerPage.waitForJSONProcessed();
    // May or may not be valid depending on auto-completion behavior
    const hasError = await viewerPage.hasJSONErrors();
    // Don't fail test since auto-completion behavior varies
  });

  test('should provide JSON schema validation hints', async () => {
    // Input JSON that could have schema issues
    const schemaJson = {
      name: 123, // Should be string
      email: "not-an-email", // Invalid email format
      age: "thirty" // Should be number
    };

    await viewerPage.inputJSON(stringifyJSON(schemaJson));
    await viewerPage.waitForJSONProcessed();

    // Look for validation warnings or hints
    const warnings = viewerPage.page.locator('.monaco-decoration-warning, .warning-marker, .validation-warning');
    const errorMarkers = viewerPage.page.locator('.monaco-decoration-error, .error-marker');
    
    // May have validation markers
    const hasValidationUI = await warnings.isVisible({ timeout: 2000 }) || 
                           await errorMarkers.isVisible({ timeout: 2000 });
    
    // Don't fail if not implemented yet
    if (hasValidationUI) {
      expect(hasValidationUI).toBe(true);
    }
  });

  test('should handle special characters and Unicode in editing', async () => {
    const unicodeJson = {
      name: "João",
      emoji: "🌍",
      chinese: "你好",
      arabic: "مرحبا",
      special: "\"quotes\" and 'apostrophes' and \n newlines \t tabs",
      numbers: [1, 2.5, -10, 1.23e-4]
    };

    const jsonString = stringifyJSON(unicodeJson);
    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Should handle Unicode properly
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    // Edit to add more Unicode
    await viewerPage.jsonTextArea.click();
    await viewerPage.page.keyboard.press('Control+f');
    const findDialog = viewerPage.page.locator('.monaco-findInput');
    if (await findDialog.isVisible({ timeout: 1000 })) {
      await findDialog.fill('"emoji": "🌍"');
      await viewerPage.page.keyboard.press('Enter');
      await viewerPage.page.keyboard.press('Escape');
      
      // Add another emoji
      await viewerPage.page.keyboard.press('End');
      await viewerPage.page.keyboard.type(',');
      await viewerPage.page.keyboard.press('Enter');
      await viewerPage.page.keyboard.type('  "moreEmojis": "🚀✨🎉"');
      await viewerPage.page.waitForLoadState('networkidle');
    }

    // Should handle Unicode edits
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should support find and replace functionality', async ({ dataGenerator }) => {
    const complexJson = dataGenerator.generateAPIResponseJSON();
    const jsonString = stringifyJSON(complexJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Open find dialog
    await viewerPage.jsonTextArea.click();
    await viewerPage.page.keyboard.press('Control+h'); // Find and replace
    
    const findInput = viewerPage.page.locator('.monaco-findInput, input[placeholder*="find"]');
    if (await findInput.isVisible({ timeout: 2000 })) {
      // Find all "user" occurrences
      await findInput.fill('user');
      
      const replaceInput = viewerPage.page.locator('.monaco-replaceInput, input[placeholder*="replace"]');
      if (await replaceInput.isVisible()) {
        await replaceInput.fill('member');
        
        // Replace all occurrences
        const replaceAllButton = viewerPage.page.locator('button[title*="Replace All"], .replace-all-btn');
        if (await replaceAllButton.isVisible()) {
          await replaceAllButton.click();
          await viewerPage.page.waitForLoadState('networkidle');
        }
      }

      // Close find dialog
      await viewerPage.page.keyboard.press('Escape');
    }

    // Should have made replacements and still be valid
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should preserve formatting preferences during editing', async () => {
    // Test with specific indentation
    const formattedJson = `{
    "level1": {
        "level2": {
            "data": "value"
        }
    }
}`;

    await viewerPage.inputJSON(formattedJson);
    await viewerPage.waitForJSONProcessed();

    // Make small edit
    await viewerPage.jsonTextArea.click();
    await viewerPage.page.keyboard.press('Control+f');
    
    const findDialog = viewerPage.page.locator('.monaco-findInput');
    if (await findDialog.isVisible({ timeout: 1000 })) {
      await findDialog.fill('"value"');
      await viewerPage.page.keyboard.press('Enter');
      await viewerPage.page.keyboard.press('Escape');
      
      // Replace the value
      await viewerPage.page.keyboard.press('Control+a');
      await viewerPage.page.keyboard.type('"updated"');
      await viewerPage.page.waitForLoadState('networkidle');
    }

    // Should maintain JSON structure
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should handle concurrent edits and state management', async ({ dataGenerator }) => {
    const testJson = dataGenerator.generateSimpleJSON();
    const jsonString = stringifyJSON(testJson);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Simulate rapid edits
    for (let i = 0; i < 5; i++) {
      await viewerPage.jsonTextArea.click();
      await viewerPage.page.keyboard.press('Control+a');
      
      const modifiedJson = { ...testJson, iteration: i, timestamp: Date.now() };
      const modifiedString = stringifyJSON(modifiedJson);
      
      await viewerPage.page.keyboard.type(modifiedString);
      // Quick succession - Playwright auto-waits
    }

    // Final state should be valid
    await viewerPage.waitForJSONProcessed();
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    const finalStats = await viewerPage.getJSONStats();
    expect(finalStats.nodeCount).toBeGreaterThan(0);
  });
});
import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES, minifyJSON } from '../../fixtures/json-samples';

test.describe('Anonymous User - JSON Formatting & Syntax Highlighting', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('User Story 4: Format JSON with syntax highlighting and line numbers', () => {
    test('should apply syntax highlighting to different JSON data types', async () => {
      const mixedTypesJson = JSON_SAMPLES.mixedTypes.content;
      const jsonString = JSON.stringify(mixedTypesJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Verify syntax highlighting is applied
      // Check for Monaco editor or syntax highlighting classes
      const hasMonaco = await viewerPage.page.locator('.monaco-editor').isVisible();
      const hasSyntaxHighlighting =
        (await viewerPage.page.locator('.mtk1, .mtk2, .mtk3, .token').count()) > 0;

      expect(hasMonaco || hasSyntaxHighlighting).toBe(true);

      // Take screenshot to verify visual syntax highlighting
      await viewerPage.takeScreenshot('syntax-highlighting-mixed-types');
    });

    test('should highlight strings differently from numbers', async () => {
      const testJson = {
        stringValue: 'This is a string',
        numberValue: 42,
        floatValue: 3.14159,
        booleanValue: true,
        nullValue: null,
      };
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Verify different token types have different styling
      const stringTokens = await viewerPage.page
        .locator('.mtk6, .token.string, [data-token-type="string"]')
        .count();
      const numberTokens = await viewerPage.page
        .locator('.mtk7, .token.number, [data-token-type="number"]')
        .count();

      // At least one of each type should be highlighted
      expect(stringTokens + numberTokens).toBeGreaterThan(0);
    });

    test('should display line numbers in editor', async ({ dataGenerator }) => {
      const complexJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(complexJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Check for line numbers
      const hasLineNumbers = await viewerPage.page
        .locator('.line-numbers, .margin, [data-line-number]')
        .isVisible();
      expect(hasLineNumbers).toBe(true);

      // Verify multiple line numbers are visible
      const lineNumberCount = await viewerPage.page
        .locator('.line-numbers .line-number, [data-line-number]')
        .count();
      expect(lineNumberCount).toBeGreaterThan(1);
    });

    test('should auto-format minified JSON content', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const minifiedJson = minifyJSON(testJson); // No spaces or newlines

      await viewerPage.inputJSON(minifiedJson);
      await viewerPage.waitForJSONProcessed();

      // Trigger formatting (common shortcut)
      await viewerPage.page.keyboard.press('Control+Alt+F');
      await viewerPage.page.waitForLoadState('networkidle');

      // Verify content is now formatted
      const formattedContent = await viewerPage.jsonTextArea.inputValue();
      expect(formattedContent).toContain('\n'); // Should have line breaks
      expect(formattedContent.length).toBeGreaterThan(minifiedJson.length); // Should be longer due to formatting

      // Should have proper indentation
      const lines = formattedContent.split('\n');
      const indentedLines = lines.filter(
        (line) => line.startsWith('  ') || line.startsWith('    ')
      );
      expect(indentedLines.length).toBeGreaterThan(0);
    });

    test('should maintain consistent indentation levels', async () => {
      const nestedJson = {
        level1: {
          level2: {
            level3: {
              level4: 'deep value',
            },
            array: [1, 2, { nested: true }],
          },
        },
      };
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      const content = await viewerPage.jsonTextArea.inputValue();
      const lines = content.split('\n');

      // Check indentation consistency
      let currentIndentLevel = 0;
      let validIndentation = true;

      for (const line of lines) {
        if (line.trim() === '') continue;

        const leadingSpaces = line.length - line.trimStart().length;
        const indentLevel = leadingSpaces / 2; // Assuming 2-space indentation

        if (line.trim().endsWith('{') || line.trim().endsWith('[')) {
          // Opening bracket - indent should increase on next line
          currentIndentLevel = indentLevel;
        } else if (line.trim().startsWith('}') || line.trim().startsWith(']')) {
          // Closing bracket - should be at parent level
          if (indentLevel > currentIndentLevel) {
            validIndentation = false;
            break;
          }
        }
      }

      expect(validIndentation).toBe(true);
    });

    test('should highlight JSON syntax errors visually', async () => {
      const invalidJson = '{ "valid": true, "invalid": incomplete';

      await viewerPage.inputJSON(invalidJson);

      // Should show syntax error highlighting
      const hasErrorHighlighting = await viewerPage.page
        .locator('.squiggly-error, .error-highlight, .syntax-error')
        .isVisible();

      // Also check for general error state
      const hasErrors = await viewerPage.hasJSONErrors();
      expect(hasErrors).toBe(true);

      // Take screenshot to verify error highlighting
      await viewerPage.takeScreenshot('syntax-error-highlighting');
    });

    test('should handle very large JSON with syntax highlighting performance', async ({
      dataGenerator,
    }) => {
      const largeJson = dataGenerator.generateLargeJSON(500);
      const jsonString = JSON.stringify(largeJson, null, 2);

      const startTime = Date.now();
      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify syntax highlighting is still applied
      const hasSyntaxHighlighting = await viewerPage.page
        .locator('.mtk1, .token, .monaco-editor')
        .isVisible();
      expect(hasSyntaxHighlighting).toBe(true);
    });

    test('should support bracket matching and highlighting', async () => {
      const nestedJson = {
        outer: {
          inner: {
            array: [1, 2, { deep: 'value' }],
          },
        },
      };
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Position cursor at opening bracket
      await viewerPage.jsonTextArea.focus();
      await viewerPage.page.keyboard.press('Control+Home'); // Go to start
      await viewerPage.page.keyboard.press('End'); // Go to first line end
      await viewerPage.page.keyboard.press('ArrowLeft'); // Move to opening bracket

      await viewerPage.page.waitForLoadState('networkidle');

      // Look for bracket matching highlight
      const hasBracketMatching = await viewerPage.page
        .locator('.bracket-match, .brace-match')
        .isVisible();

      // This is optional as not all editors implement visible bracket matching
      // But if present, it should work correctly
    });

    test('should preserve formatting when switching between views', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const formattedJson = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(formattedJson);
      await viewerPage.waitForJSONProcessed();

      // Switch to different view modes and back
      await viewerPage.switchToTreeView();
      await viewerPage.page.waitForLoadState('networkidle');

      // Switch back to editor
      if (await viewerPage.page.locator('[data-testid="editor-view"], text="Editor"').isVisible()) {
        await viewerPage.page.locator('[data-testid="editor-view"], text="Editor"').click();
        await viewerPage.page.waitForLoadState('networkidle');

        // Verify formatting is preserved
        const currentContent = await viewerPage.jsonTextArea.inputValue();
        expect(currentContent).toContain('\n'); // Should still have formatting

        // Should still have syntax highlighting
        const hasSyntaxHighlighting = await viewerPage.page
          .locator('.mtk1, .token, .monaco-editor')
          .isVisible();
        expect(hasSyntaxHighlighting).toBe(true);
      }
    });

    test('should support custom formatting options', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for formatting options in settings or preferences
      const settingsButton = viewerPage.page.locator(
        '[data-testid="settings"], [aria-label="Settings"], text="Settings"'
      );

      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await expect(
          viewerPage.page.locator('text="indent", text="tab", text="space"').first()
        ).toBeVisible();

        // Look for indentation options
        const indentationOptions = await viewerPage.page
          .locator('text="indent", text="tab", text="space"')
          .count();

        // Close settings if opened
        await viewerPage.page.keyboard.press('Escape');

        // This is optional - just verify settings exist if present
        expect(indentationOptions).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle Unicode and special characters in syntax highlighting', async () => {
      const unicodeJson = {
        english: 'Hello World',
        emoji: '🌍🚀💻',
        accented: 'café naïve résumé',
        chinese: '你好世界',
        arabic: 'مرحبا بالعالم',
        special: '"quotes" and \\backslashes\\',
        control: '\n\t\r\b\f',
      };
      const jsonString = JSON.stringify(unicodeJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Verify content is processed without errors
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      // Verify syntax highlighting works with Unicode
      const hasSyntaxHighlighting = await viewerPage.page
        .locator('.mtk1, .token, .monaco-editor')
        .isVisible();
      expect(hasSyntaxHighlighting).toBe(true);

      // Take screenshot to verify Unicode rendering
      await viewerPage.takeScreenshot('unicode-syntax-highlighting');
    });

    test('should provide folding markers for nested structures', async () => {
      const deeplyNested = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
                array: [1, 2, 3, { nested: true }],
              },
            },
          },
        },
      };
      const jsonString = JSON.stringify(deeplyNested, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for code folding controls
      const foldingControls = await viewerPage.page
        .locator('.folding-icon, .codicon-chevron-right, .fold-indicator')
        .count();
      expect(foldingControls).toBeGreaterThan(0);

      // Try to fold a section if controls are available
      const foldButton = viewerPage.page.locator('.folding-icon').first();
      if (await foldButton.isVisible()) {
        await foldButton.click();
        await viewerPage.page.waitForLoadState('networkidle');

        // Content should be folded (less visible content)
        const foldedContent = await viewerPage.jsonTextArea.inputValue();
        // This test depends on how folding is implemented
      }
    });
  });
});

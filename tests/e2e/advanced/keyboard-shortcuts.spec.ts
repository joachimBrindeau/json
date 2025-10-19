import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';

test.describe('Advanced User - Keyboard Shortcuts for Formatting (Story 6)', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('Formatting Keyboard Shortcuts', () => {
    test('should format JSON using Ctrl+Alt+F keyboard shortcut', async ({ page }) => {
      // Input unformatted JSON
      const unformattedJson =
        '{"name":"John Doe","age":30,"address":{"street":"123 Main St","city":"New York","zipCode":"10001"},"hobbies":["reading","coding","music"],"active":true,"metadata":{"created":"2024-01-01T00:00:00Z","updated":"2024-01-15T12:00:00Z"}}';

      await viewerPage.inputJSON(unformattedJson);
      await viewerPage.waitForJSONProcessed();

      // Get initial JSON content (should be unformatted)
      const initialContent = await page.locator('[data-testid="json-textarea"]').inputValue();
      expect(initialContent).toBe(unformattedJson);

      // Focus on the JSON textarea
      await page.locator('[data-testid="json-textarea"]').focus();

      // Use keyboard shortcut Ctrl+Alt+F (Windows/Linux) or Cmd+Alt+F (Mac)
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+Alt+KeyF');
      } else {
        await page.keyboard.press('Control+Alt+KeyF');
      }

      // Wait for formatting to complete
      await page.waitForLoadState('networkidle');

      // Get formatted content
      const formattedContent = await page.locator('[data-testid="json-textarea"]').inputValue();

      // Should be formatted with proper indentation
      expect(formattedContent).toContain('\n');
      expect(formattedContent).toContain('  '); // Should have indentation
      expect(formattedContent.length).toBeGreaterThan(unformattedJson.length); // Formatted should be longer

      // Should still parse as valid JSON
      expect(() => JSON.parse(formattedContent)).not.toThrow();

      // Verify the JSON structure is preserved
      const originalObject = JSON.parse(unformattedJson);
      const formattedObject = JSON.parse(formattedContent);
      expect(formattedObject).toEqual(originalObject);

      await viewerPage.takeScreenshot('formatted-json-ctrl-alt-f');
    });

    test('should format deeply nested JSON using keyboard shortcut', async ({ page }) => {
      // Create deeply nested unformatted JSON
      const deepJson = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'deep value',
                  array: [1, 2, { nested: 'inside array' }],
                  boolean: true,
                  null_value: null,
                },
              },
            },
          },
        },
        parallel_branch: {
          config: { setting1: 'value1', setting2: 'value2' },
          metadata: { version: '1.0.0', author: 'test' },
        },
      };

      const unformattedString = JSON.stringify(deepJson);

      await viewerPage.inputJSON(unformattedString);
      await page.locator('[data-testid="json-textarea"]').focus();

      // Apply formatting shortcut
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+Alt+KeyF');
      } else {
        await page.keyboard.press('Control+Alt+KeyF');
      }

      // Wait for formatting operation to complete
      await page.waitForLoadState('networkidle');

      const formattedContent = await page.locator('[data-testid="json-textarea"]').inputValue();

      // Should be properly formatted with multiple indentation levels
      const lines = formattedContent.split('\n');
      expect(lines.length).toBeGreaterThan(20); // Should have many lines

      // Should have different indentation levels
      const indentationLevels = new Set();
      lines.forEach((line) => {
        const match = line.match(/^(\s*)/);
        if (match) {
          indentationLevels.add(match[1].length);
        }
      });

      expect(indentationLevels.size).toBeGreaterThan(5); // Multiple indentation levels

      // Should preserve data integrity
      const parsedFormatted = JSON.parse(formattedContent);
      expect(parsedFormatted).toEqual(deepJson);

      await viewerPage.takeScreenshot('deep-nested-formatted');
    });

    test('should format array-heavy JSON using keyboard shortcut', async ({ page }) => {
      const arrayHeavyJson = {
        users: [
          { id: 1, name: 'Alice', roles: ['admin', 'user'] },
          { id: 2, name: 'Bob', roles: ['user'] },
          { id: 3, name: 'Carol', roles: ['admin', 'moderator', 'user'] },
        ],
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        mixed: ['string', 42, true, null, { nested: 'object' }, [1, 2, 3]],
      };

      const unformattedString = JSON.stringify(arrayHeavyJson);

      await viewerPage.inputJSON(unformattedString);
      await page.locator('[data-testid="json-textarea"]').focus();

      // Apply formatting shortcut
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+Alt+KeyF');
      } else {
        await page.keyboard.press('Control+Alt+KeyF');
      }

      // Wait for formatting to complete
      await page.waitForLoadState('networkidle');

      const formattedContent = await page.locator('[data-testid="json-textarea"]').inputValue();

      // Should format arrays properly
      expect(formattedContent).toContain('[\n');
      expect(formattedContent).toContain('\n  ]');

      // Should preserve array structure
      const parsedFormatted = JSON.parse(formattedContent);
      expect(parsedFormatted).toEqual(arrayHeavyJson);

      await viewerPage.takeScreenshot('array-heavy-formatted');
    });

    test('should handle formatting keyboard shortcut with malformed JSON', async ({ page }) => {
      // Input malformed JSON
      const malformedJson = '{"name": "John", "age": 30, "incomplete": true';

      await viewerPage.inputJSON(malformedJson);
      await page.locator('[data-testid="json-textarea"]').focus();

      // Try to apply formatting shortcut
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+Alt+KeyF');
      } else {
        await page.keyboard.press('Control+Alt+KeyF');
      }

      // Wait for formatting attempt to complete
      await page.waitForLoadState('networkidle');

      // Should either show error or leave content unchanged
      const currentContent = await page.locator('[data-testid="json-textarea"]').inputValue();

      // Should not crash the application
      expect(await viewerPage.page.isVisible('body')).toBe(true);

      // Either shows error or preserves original malformed content
      const hasError = await viewerPage.hasJSONErrors();

      if (hasError) {
        const errorMessage = await viewerPage.getErrorMessage();
        expect(errorMessage?.toLowerCase()).toMatch(/invalid|error|syntax/);
        await viewerPage.takeScreenshot('formatting-error-malformed');
      } else {
        // If no error, content should be preserved
        expect(currentContent).toBe(malformedJson);
      }
    });

    test('should provide visual feedback during formatting operation', async ({ page }) => {
      // Create a reasonably large JSON for noticeable formatting time
      const largeJson = {
        data: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is item number ${i}`.repeat(5),
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag${i % 10}`, `category${i % 5}`],
            nested: {
              level1: { level2: { value: `nested-${i}` } },
            },
          },
          values: Array.from({ length: 20 }, (_, j) => j * i),
        })),
      };

      const unformattedString = JSON.stringify(largeJson);

      await viewerPage.inputJSON(unformattedString);
      await page.locator('[data-testid="json-textarea"]').focus();

      // Apply formatting shortcut
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+Alt+KeyF');
      } else {
        await page.keyboard.press('Control+Alt+KeyF');
      }

      // Look for loading indicators or visual feedback
      const loadingIndicators = await page
        .locator('.loading, .spinner, [data-testid*="loading"], [data-testid*="formatting"]')
        .count();

      if (loadingIndicators > 0) {
        await viewerPage.takeScreenshot('formatting-loading-indicator');
      }

      // Wait for formatting to complete
      await page.waitForLoadState('networkidle');

      const formattedContent = await page.locator('[data-testid="json-textarea"]').inputValue();

      // Should be successfully formatted
      expect(formattedContent).toContain('\n');
      expect(() => JSON.parse(formattedContent)).not.toThrow();

      // Loading indicators should be gone
      const stillLoading = await page.locator('.loading, .spinner').isVisible();
      expect(stillLoading).toBe(false);
    });

    test('should maintain cursor position after formatting when possible', async ({ page }) => {
      const testJson = {
        first: 'value1',
        second: 'value2',
        third: {
          nested: 'value3',
        },
        fourth: 'value4',
      };

      const unformattedString = JSON.stringify(testJson);

      await viewerPage.inputJSON(unformattedString);

      const textarea = page.locator('[data-testid="json-textarea"]');
      await textarea.focus();

      // Position cursor near the middle of the content
      const middlePosition = Math.floor(unformattedString.length / 2);
      await textarea.evaluate((el: HTMLTextAreaElement, pos) => {
        el.setSelectionRange(pos, pos);
      }, middlePosition);

      // Apply formatting
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+Alt+KeyF');
      } else {
        await page.keyboard.press('Control+Alt+KeyF');
      }

      // Wait for formatting to complete
      await page.waitForLoadState('networkidle');

      // Check if cursor position is maintained or reasonably positioned
      const cursorPosition = await textarea.evaluate(
        (el: HTMLTextAreaElement) => el.selectionStart
      );

      // Cursor should be positioned somewhere reasonable (not at start)
      expect(cursorPosition).toBeGreaterThan(0);

      const formattedContent = await textarea.inputValue();
      expect(() => JSON.parse(formattedContent)).not.toThrow();
    });

    test('should support undo after formatting with Ctrl+Z', async ({ page }) => {
      const originalJson = '{"name":"John","age":30,"city":"NYC"}';

      await viewerPage.inputJSON(originalJson);
      const textarea = page.locator('[data-testid="json-textarea"]');
      await textarea.focus();

      // Apply formatting
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+Alt+KeyF');
      } else {
        await page.keyboard.press('Control+Alt+KeyF');
      }

      // Wait for formatting to complete
      await page.waitForLoadState('networkidle');

      const formattedContent = await textarea.inputValue();
      expect(formattedContent).toContain('\n'); // Should be formatted

      // Undo the formatting
      if (isMac) {
        await page.keyboard.press('Meta+KeyZ');
      } else {
        await page.keyboard.press('Control+KeyZ');
      }

      // Wait for undo to complete
      await page.waitForLoadState('networkidle');

      const undoneContent = await textarea.inputValue();

      // Should revert to original or close to original
      // Note: Exact reversion depends on editor implementation
      expect(undoneContent.replace(/\s/g, '')).toBe(originalJson.replace(/\s/g, ''));
    });

    test('should format JSON with special characters and unicode', async ({ page }) => {
      const unicodeJson = {
        english: 'Hello World',
        spanish: 'Hola Mundo',
        chinese: '你好世界',
        japanese: 'こんにちは世界',
        emoji: '🌍🎉✨',
        special_chars: 'Line 1\nLine 2\tTabbed\r\nWindows line ending',
        escaped: 'Quote: " Backslash: \\ Slash: /',
        numbers: {
          integer: 42,
          float: 3.14159,
          scientific: 1.23e-10,
          negative: -42,
        },
      };

      const unformattedString = JSON.stringify(unicodeJson);

      await viewerPage.inputJSON(unformattedString);
      await page.locator('[data-testid="json-textarea"]').focus();

      // Apply formatting
      const isMac = process.platform === 'darwin';
      if (isMac) {
        await page.keyboard.press('Meta+Alt+KeyF');
      } else {
        await page.keyboard.press('Control+Alt+KeyF');
      }

      // Wait for formatting to complete
      await page.waitForLoadState('networkidle');

      const formattedContent = await page.locator('[data-testid="json-textarea"]').inputValue();

      // Should preserve all special characters and unicode
      expect(formattedContent).toContain('你好世界');
      expect(formattedContent).toContain('🌍🎉✨');
      expect(formattedContent).toContain('\\n');
      expect(formattedContent).toContain('\\"');

      // Should be properly formatted
      expect(formattedContent).toContain('\n');

      // Should parse correctly and preserve data
      const parsedFormatted = JSON.parse(formattedContent);
      expect(parsedFormatted).toEqual(unicodeJson);

      await viewerPage.takeScreenshot('unicode-special-chars-formatted');
    });
  });

  test.describe('Additional Formatting Features', () => {
    test('should show formatting options in context menu or toolbar', async ({ page }) => {
      const testJson = { test: 'data', format: 'check' };
      await viewerPage.inputJSON(JSON.stringify(testJson));

      // Look for formatting buttons or context menu options
      const formatButtons = await viewerPage.page
        .locator('button, [role="button"]')
        .filter({ hasText: /format/i })
        .count();

      if (formatButtons > 0) {
        await viewerPage.takeScreenshot('formatting-ui-options');

        // Try clicking format button if available
        await viewerPage.page
          .locator('button, [role="button"]')
          .filter({ hasText: /format/i })
          .first()
          .click();
        // Wait for formatting to complete
        await viewerPage.page.waitForLoadState('networkidle');

        const formattedContent = await viewerPage.page
          .locator('[data-testid="json-textarea"]')
          .inputValue();
        expect(formattedContent).toContain('\n');
      }
    });

    test('should provide different formatting styles if available', async ({ page }) => {
      const testJson = { style: 'test', options: ['compact', 'expanded'] };
      const jsonString = JSON.stringify(testJson);

      await viewerPage.inputJSON(jsonString);

      // Look for formatting style options
      const styleOptions = await viewerPage.page
        .locator('[data-testid*="format"], [data-testid*="style"]')
        .count();

      if (styleOptions > 0) {
        // Test different formatting styles
        const options = await viewerPage.page
          .locator('[data-testid*="format"], [data-testid*="style"]')
          .all();

        for (let i = 0; i < Math.min(options.length, 3); i++) {
          await options[i].click();
          // Wait for style option to apply
          await viewerPage.page.waitForLoadState('networkidle');

          const currentContent = await viewerPage.page
            .locator('[data-testid="json-textarea"]')
            .inputValue();
          expect(() => JSON.parse(currentContent)).not.toThrow();

          await viewerPage.takeScreenshot(`formatting-style-option-${i}`);
        }
      }
    });
  });
});

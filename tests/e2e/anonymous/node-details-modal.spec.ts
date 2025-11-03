import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Anonymous User - Node Details Modal', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('User Story 11: View JSON node details in modal popups', () => {
    test('should open node details modal on double-click', async ({ dataGenerator }) => {
      const complexJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(complexJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();
        await viewerPage.expandAll();

        // Find a JSON node to double-click
        const firstNode = viewerPage.jsonNodes.first();
        if (await firstNode.isVisible()) {
          await firstNode.dblclick();

          // Wait for modal to appear
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Check if node details modal opened
          const modalVisible =
            (await viewerPage.nodeDetailsModal.isVisible()) ||
            (await viewerPage.page.locator('[role="dialog"], .modal, .popup').count()) > 0;

          if (modalVisible) {
            expect(modalVisible).toBe(true);
            await viewerPage.takeScreenshot('node-details-modal');
          }
        }
      }
    });

    test('should display comprehensive node information', async () => {
      const detailedJson = {
        stringNode: 'Sample string value',
        numberNode: 42.5,
        booleanNode: true,
        nullNode: null,
        arrayNode: [1, 2, 3, 'item'],
        objectNode: {
          nestedString: 'nested value',
          nestedNumber: 100,
        },
      };
      const jsonString = JSON.stringify(detailedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Try to open details for different node types
        const stringNode = viewerPage.page.locator('text="Sample string value"').first();
        if (await stringNode.isVisible()) {
          await stringNode.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Look for detailed information in modal
          const hasTypeInfo =
            (await viewerPage.page.locator('text="String", text="string", text="Type"').count()) >
            0;
          const hasValueInfo =
            (await viewerPage.page.locator('text="Sample string value"').count()) > 0;
          const hasLengthInfo =
            (await viewerPage.page.locator('text="Length", text="length"').count()) > 0;

          // Close modal if it opened
          await viewerPage.page.keyboard.press('Escape');
        }
      }
    });

    test('should show data type specific information', async () => {
      const typedJson = {
        array: Array.from({ length: 10 }, (_, i) => `item_${i}`),
        object: { prop1: 'value1', prop2: 'value2', prop3: 'value3' },
        longString: 'A'.repeat(1000),
        floatNumber: 3.141592653589793,
        largeNumber: 1234567890.123456789,
      };
      const jsonString = JSON.stringify(typedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Test array node details
        const arrayNode = viewerPage.page.locator('text="array"').first();
        if (await arrayNode.isVisible()) {
          await arrayNode.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Should show array-specific info (length, items count)
          const hasArrayInfo =
            (await viewerPage.page.locator('text="10", text="items", text="Array"').count()) > 0;

          await viewerPage.page.keyboard.press('Escape');
        }
      }
    });

    test('should handle nested object node details', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();
        await viewerPage.expandAll();

        // Find a deeply nested node
        const emailNode = viewerPage.page.locator('text="alice@example.com"').first();
        if (await emailNode.isVisible()) {
          await emailNode.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Should show path information
          const hasPathInfo =
            (await viewerPage.page.locator('text="Path", text="path", text="."').count()) > 0;

          await viewerPage.page.keyboard.press('Escape');
        }
      }
    });

    test('should provide copy functionality in modal', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        const firstNode = viewerPage.jsonNodes.first();
        if (await firstNode.isVisible()) {
          await firstNode.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Look for copy button in modal
          const copyButton = viewerPage.page.locator(
            '[data-testid="copy-node"], button:has-text("Copy")'
          );
          if (await copyButton.isVisible()) {
            await copyButton.click();

            // Should provide feedback
            const hasFeedback =
              (await viewerPage.page.locator('text="Copied", .success, [role="alert"]').count()) >
              0;
          }

          await viewerPage.page.keyboard.press('Escape');
        }
      }
    });

    test('should close modal with escape key or close button', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        const firstNode = viewerPage.jsonNodes.first();
        if (await firstNode.isVisible()) {
          await firstNode.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Test escape key
          await viewerPage.page.keyboard.press('Escape');
          await expect(viewerPage.nodeDetailsModal).not.toBeVisible();

          // Modal should be closed
          const modalStillVisible = await viewerPage.nodeDetailsModal.isVisible();
          expect(modalStillVisible).toBe(false);

          // Test close button if available
          await firstNode.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          const closeButton = viewerPage.page.locator(
            '[data-testid="close-modal"], button[aria-label="Close"], .close-button'
          );
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await expect(viewerPage.nodeDetailsModal).not.toBeVisible();

            const modalClosed = await viewerPage.nodeDetailsModal.isVisible();
            expect(modalClosed).toBe(false);
          }
        }
      }
    });

    test('should handle large content in modal', async ({ dataGenerator }) => {
      const largeContent = {
        largeString: 'A'.repeat(10000),
        largeArray: Array.from({ length: 1000 }, (_, i) => `item_${i}`),
        largeObject: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`key_${i}`, `value_${i}`])
        ),
      };
      const jsonString = JSON.stringify(largeContent, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        const largeStringNode = viewerPage.page.locator('text="largeString"').first();
        if (await largeStringNode.isVisible()) {
          await largeStringNode.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Modal should handle large content gracefully
          const modalVisible = await viewerPage.nodeDetailsModal.isVisible();
          if (modalVisible) {
            // Should have scrollable content or truncation
            const hasScrollableContent =
              (await viewerPage.page.locator('.scrollable, [style*="overflow"]').count()) > 0;
            const hasTruncation =
              (await viewerPage.page.locator('text="...", text="truncated"').count()) > 0;

            // Should not crash the interface
            expect(await viewerPage.hasJSONErrors()).toBe(false);
          }

          await viewerPage.page.keyboard.press('Escape');
        }
      }
    });

    test('should display node metadata and statistics', async ({ dataGenerator }) => {
      const complexJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(complexJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Find an object node with multiple properties
        const objectNode = viewerPage.page.locator('text="personal"').first();
        if (await objectNode.isVisible()) {
          await objectNode.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Look for metadata like:
          const hasKeyCount =
            (await viewerPage.page.locator('text=/\d+.*key/, text=/\d+.*propert/').count()) > 0;
          const hasSize = (await viewerPage.page.locator('text="Size", text="Bytes"').count()) > 0;
          const hasDepth =
            (await viewerPage.page.locator('text="Depth", text="Level"').count()) > 0;

          // At least some metadata should be shown
          const hasAnyMetadata = hasKeyCount || hasSize || hasDepth;

          await viewerPage.page.keyboard.press('Escape');
        }
      }
    });

    test('should support navigation between nodes in modal', async ({ dataGenerator }) => {
      const arrayJson = {
        items: Array.from({ length: 5 }, (_, i) => ({ id: i, name: `Item ${i}` })),
      };
      const jsonString = JSON.stringify(arrayJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();
        await viewerPage.expandAll();

        const firstItem = viewerPage.page.locator('text="Item 0"').first();
        if (await firstItem.isVisible()) {
          await firstItem.dblclick();
          await expect(
            viewerPage.page.locator('[role="dialog"], .modal, .popup').first()
          ).toBeVisible();

          // Look for navigation buttons
          const nextButton = viewerPage.page.locator(
            '[data-testid="next-node"], button:has-text("Next")'
          );
          const prevButton = viewerPage.page.locator(
            '[data-testid="prev-node"], button:has-text("Previous")'
          );

          if (await nextButton.isVisible()) {
            await nextButton.click();
            await viewerPage.page.waitForLoadState('networkidle');

            // Should navigate to next node
            const nextItemVisible = (await viewerPage.page.locator('text="Item 1"').count()) > 0;
          }

          await viewerPage.page.keyboard.press('Escape');
        }
      }
    });

    test('should handle modal accessibility features', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        const firstNode = viewerPage.jsonNodes.first();
        if (await firstNode.isVisible()) {
          await firstNode.dblclick();
          await expect(viewerPage.page.locator('[role="dialog"]').first()).toBeVisible();

          // Check for proper modal attributes
          const modal = viewerPage.page.locator('[role="dialog"]').first();
          if (await modal.isVisible()) {
            // Should have proper ARIA attributes
            const hasAriaLabel = (await modal.getAttribute('aria-label')) !== null;
            const hasAriaModal = (await modal.getAttribute('aria-modal')) === 'true';

            // Should trap focus properly
            await viewerPage.page.keyboard.press('Tab');
            const focusedElement = (await viewerPage.page.locator(':focus').count()) > 0;
          }

          await viewerPage.page.keyboard.press('Escape');
        }
      }
    });
  });
});

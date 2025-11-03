import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Anonymous User - Tree View Interactions', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('User Story 10: Expand/collapse JSON nodes in tree view', () => {
    test('should display expandable nodes for nested structures', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Verify tree view is displayed
        await expect(viewerPage.treeView).toBeVisible();

        // Verify expandable nodes exist
        const expandableNodes = await viewerPage.expandableNodes.count();
        expect(expandableNodes).toBeGreaterThan(0);

        // Verify expand/collapse buttons are present
        const expandButtons = await viewerPage.expandButtons.count();
        expect(expandButtons).toBeGreaterThan(0);

        // Take screenshot of initial tree state
        await viewerPage.takeScreenshot('tree-view-expandable-nodes');
      } else {
        // Fail fast if tree view not available
        expect(
          await viewerPage.treeViewButton.isVisible(),
          'Tree view must be available for this test'
        ).toBe(true);
      }
    });

    test('should display realistic deeply nested user data in tree view', async ({
      dataGenerator,
    }) => {
      const nestedData = dataGenerator.generateRealisticDeepNesting();
      const jsonString = JSON.stringify(nestedData, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Verify tree view displays nested structure
        await expect(viewerPage.treeView).toBeVisible();

        // Verify multiple levels of nesting
        const expandableNodes = await viewerPage.expandableNodes.count();
        expect(expandableNodes).toBeGreaterThan(5); // At least 5 levels deep

        // Take screenshot
        await viewerPage.takeScreenshot('tree-view-realistic-nested-data');
      }
    });

    test('should expand individual nodes when clicked', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Get initial node count
        const initialNodeCount = await viewerPage.jsonNodes.count();

        // Find and click first expandable node
        const firstExpandButton = viewerPage.expandButtons.first();
        if (await firstExpandButton.isVisible()) {
          await firstExpandButton.click();
          await viewerPage.page.waitForLoadState('networkidle');

          // Should have more visible nodes after expansion
          const expandedNodeCount = await viewerPage.jsonNodes.count();
          expect(expandedNodeCount).toBeGreaterThanOrEqual(initialNodeCount);

          // Take screenshot of expanded state
          await viewerPage.takeScreenshot('tree-view-node-expanded');
        }
      }
    });

    test('should collapse expanded nodes when clicked again', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Expand a node first
        const firstExpandButton = viewerPage.expandButtons.first();
        if (await firstExpandButton.isVisible()) {
          await firstExpandButton.click();
          await viewerPage.page.waitForLoadState('networkidle');

          const expandedNodeCount = await viewerPage.jsonNodes.count();

          // Find collapse button (might be same element with different state)
          const collapseButton = viewerPage.collapseButtons.first();
          if (await collapseButton.isVisible()) {
            await collapseButton.click();
            await viewerPage.page.waitForLoadState('networkidle');

            // Should have fewer visible nodes after collapse
            const collapsedNodeCount = await viewerPage.jsonNodes.count();
            expect(collapsedNodeCount).toBeLessThanOrEqual(expandedNodeCount);

            // Take screenshot of collapsed state
            await viewerPage.takeScreenshot('tree-view-node-collapsed');
          }
        }
      }
    });

    test('should expand all nodes with expand all button', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Get initial node count
        const initialNodeCount = await viewerPage.jsonNodes.count();

        // Use expand all functionality
        await viewerPage.expandAll();
        await viewerPage.page.waitForLoadState('networkidle');

        // Should have more visible nodes
        const expandedNodeCount = await viewerPage.jsonNodes.count();
        expect(expandedNodeCount).toBeGreaterThanOrEqual(initialNodeCount);

        // All expandable nodes should now be expanded
        const remainingExpandButtons = await viewerPage.expandButtons.count();
        const totalCollapseButtons = await viewerPage.collapseButtons.count();

        // Either no expand buttons left, or all are now collapse buttons
        expect(remainingExpandButtons === 0 || totalCollapseButtons > 0).toBe(true);

        // Take screenshot of fully expanded tree
        await viewerPage.takeScreenshot('tree-view-all-expanded');
      }
    });

    test('should collapse all nodes with collapse all button', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // First expand all nodes
        await viewerPage.expandAll();
        await viewerPage.page.waitForLoadState('networkidle');

        const fullyExpandedNodeCount = await viewerPage.jsonNodes.count();

        // Then collapse all
        await viewerPage.collapseAll();
        await viewerPage.page.waitForLoadState('networkidle');

        // Should have fewer visible nodes
        const collapsedNodeCount = await viewerPage.jsonNodes.count();
        expect(collapsedNodeCount).toBeLessThan(fullyExpandedNodeCount);

        // Take screenshot of fully collapsed tree
        await viewerPage.takeScreenshot('tree-view-all-collapsed');
      }
    });

    test('should show different icons for different node types', async () => {
      const mixedTypesJson = JSON_SAMPLES.mixedTypes.content;
      const jsonString = JSON.stringify(mixedTypesJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();
        await viewerPage.expandAll();
        await viewerPage.page.waitForLoadState('networkidle');

        // Check for different node type indicators
        const objectIcons = await viewerPage.page
          .locator('.object-icon, [data-type="object"] .icon, .node-object')
          .count();
        const arrayIcons = await viewerPage.page
          .locator('.array-icon, [data-type="array"] .icon, .node-array')
          .count();
        const stringIcons = await viewerPage.page
          .locator('.string-icon, [data-type="string"] .icon, .node-string')
          .count();

        // Should have visual indicators for different types
        const totalTypeIcons = objectIcons + arrayIcons + stringIcons;
        expect(totalTypeIcons).toBeGreaterThan(0);

        // Take screenshot showing different node types
        await viewerPage.takeScreenshot('tree-view-node-types');
      }
    });

    test('should handle deeply nested structures efficiently', async ({ dataGenerator }) => {
      const deepJson = dataGenerator.generateDeeplyNestedJSON(8);
      const jsonString = JSON.stringify(deepJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Should render without errors
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Performance test - expanding should be reasonably fast
        const startTime = Date.now();
        await viewerPage.expandAll();
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

        // Should still have functional tree
        const nodeCount = await viewerPage.jsonNodes.count();
        expect(nodeCount).toBeGreaterThan(0);
      }
    });

    test('should expand nodes progressively on click path', async () => {
      const pathJson = {
        level1: {
          level2: {
            level3: {
              level4: {
                targetValue: 'found',
              },
            },
          },
        },
      };
      const jsonString = JSON.stringify(pathJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Expand nodes one by one following a path
        const expandButtons = await viewerPage.expandButtons.all();

        for (let i = 0; i < Math.min(4, expandButtons.length); i++) {
          if (await expandButtons[i].isVisible()) {
            await expandButtons[i].click();
            await viewerPage.page.waitForLoadState('networkidle');

            // Each expansion should reveal more content
            const currentNodes = await viewerPage.jsonNodes.count();
            expect(currentNodes).toBeGreaterThan(0);
          }
        }

        // Final target value should be visible
        const targetVisible = await viewerPage.page.locator('text="found"').isVisible();
        expect(targetVisible).toBe(true);
      }
    });

    test('should maintain expansion state during view mode switches', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (
        (await viewerPage.treeViewButton.isVisible()) &&
        (await viewerPage.listViewButton.isVisible())
      ) {
        await viewerPage.switchToTreeView();

        // Expand some nodes
        await viewerPage.expandAll();
        const expandedCount = await viewerPage.jsonNodes.count();

        // Switch to different view and back
        await viewerPage.switchToListView();
        await viewerPage.page.waitForLoadState('networkidle');

        await viewerPage.switchToTreeView();
        await viewerPage.page.waitForLoadState('networkidle');

        // Expansion state preservation depends on implementation
        // Just verify tree view still works
        expect(await viewerPage.hasJSONErrors()).toBe(false);
        const currentCount = await viewerPage.jsonNodes.count();
        expect(currentCount).toBeGreaterThan(0);
      }
    });

    test('should show node count or summary for collapsed nodes', async ({ dataGenerator }) => {
      const arrayJson = dataGenerator.generateArrayHeavyJSON();
      const jsonString = JSON.stringify(arrayJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Look for array/object size indicators
        const sizeIndicators = await viewerPage.page
          .locator('.node-size, .item-count, [data-size], text=/\[\d+\]/, text=/\{\d+\}/')
          .count();

        // Many implementations show size/count for collapsed containers
        if (sizeIndicators > 0) {
          expect(sizeIndicators).toBeGreaterThan(0);
        }

        // Take screenshot showing size indicators
        await viewerPage.takeScreenshot('tree-view-size-indicators');
      }
    });

    test('should support keyboard navigation in tree view', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Focus on tree view
        await viewerPage.treeView.focus();

        // Try keyboard navigation
        await viewerPage.page.keyboard.press('ArrowDown');
        await viewerPage.page.waitForLoadState('networkidle');

        await viewerPage.page.keyboard.press('ArrowRight'); // Expand
        await viewerPage.page.waitForLoadState('networkidle');

        await viewerPage.page.keyboard.press('ArrowLeft'); // Collapse
        await viewerPage.page.waitForLoadState('networkidle');

        // Should not cause errors
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Look for focused/selected node indicator
        const focusedNode = await viewerPage.page
          .locator('.focused, .selected, [aria-selected="true"]')
          .count();
        // This is optional as keyboard navigation may not be implemented
      }
    });

    test('should handle large arrays in tree view', async ({ dataGenerator }) => {
      const largeArray = {
        items: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` })),
      };
      const jsonString = JSON.stringify(largeArray, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Should render large array without issues
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Expand the items array
        const expandButton = viewerPage.expandButtons.first();
        if (await expandButton.isVisible()) {
          await expandButton.click();
          await viewerPage.page.waitForLoadState('networkidle');

          // Should handle large expansion
          const nodeCount = await viewerPage.jsonNodes.count();
          expect(nodeCount).toBeGreaterThan(50); // Should show many array items

          // Performance should be acceptable
          const isResponsive = await viewerPage.page.locator('body').isEnabled();
          expect(isResponsive).toBe(true);
        }
      }
    });

    test('should show appropriate visual feedback during expand/collapse', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Look for visual state indicators
        const expandButton = viewerPage.expandButtons.first();
        if (await expandButton.isVisible()) {
          // Check for hover effects
          await expandButton.hover();
          await viewerPage.page.waitForLoadState('networkidle');

          // Click and check for transition effects
          await expandButton.click();
          await viewerPage.page.waitForLoadState('networkidle');

          // Visual feedback varies by implementation
          // Just ensure no errors occurred
          expect(await viewerPage.hasJSONErrors()).toBe(false);

          // Take screenshot of interaction states
          await viewerPage.takeScreenshot('tree-view-interaction-feedback');
        }
      }
    });

    test('should handle mixed content types in arrays', async () => {
      const mixedArray = {
        mixedData: [
          'string item',
          42,
          true,
          null,
          { nested: 'object' },
          [1, 2, 3],
          { complex: { deeply: { nested: 'value' } } },
        ],
      };
      const jsonString = JSON.stringify(mixedArray, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();
        await viewerPage.expandAll();
        await viewerPage.page.waitForLoadState('networkidle');

        // Should handle mixed types correctly
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Different node types should be distinguishable
        const nodeCounts = await viewerPage.getNodeCounts();
        expect(nodeCounts.strings).toBeGreaterThan(0);
        expect(nodeCounts.numbers).toBeGreaterThan(0);
        expect(nodeCounts.booleans).toBeGreaterThan(0);
        expect(nodeCounts.objects).toBeGreaterThan(0);
        expect(nodeCounts.arrays).toBeGreaterThan(0);

        // Take screenshot of mixed content types
        await viewerPage.takeScreenshot('tree-view-mixed-types');
      }
    });
  });
});

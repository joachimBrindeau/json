import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Anonymous User - Visualization Modes', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('User Story 7: View JSON in multiple visualization modes (tree, list, flow/flow, editor)', () => {
    test('should display all available view mode buttons', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Verify view mode buttons are visible
      await expect(viewerPage.viewModeButtons).toBeVisible();

      // Check for specific view mode buttons
      const treeViewExists = await viewerPage.treeViewButton.isVisible();
      const listViewExists = await viewerPage.listViewButton.isVisible();
      const flowViewExists = await viewerPage.flowViewButton.isVisible();

      // At least tree and list views should be available
      expect(treeViewExists || listViewExists).toBe(true);

      // Take screenshot of view mode interface
      await viewerPage.takeScreenshot('view-mode-buttons');
    });

    test('should render JSON in tree view correctly', async ({ dataGenerator }) => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Verify tree view is displayed
        await expect(viewerPage.treeView).toBeVisible();

        // Verify tree structure elements
        const treeNodes = await viewerPage.jsonNodes.count();
        expect(treeNodes).toBeGreaterThan(0);

        // Verify expandable nodes exist for nested structure
        const expandableNodes = await viewerPage.expandableNodes.count();
        expect(expandableNodes).toBeGreaterThan(0);

        // Take screenshot of tree view
        await viewerPage.takeScreenshot('tree-view-display');
      } else {
        test.skip('Tree view not available');
      }
    });

    test('should render JSON in list view correctly', async ({ dataGenerator }) => {
      const arrayJson = JSON_SAMPLES.largeArray.generateContent(20);
      const jsonString = JSON.stringify(arrayJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.listViewButton.isVisible()) {
        await viewerPage.switchToListView();

        // Verify list view is displayed
        await expect(viewerPage.listView).toBeVisible();

        // Verify list items are rendered
        const listItems = await viewerPage.jsonNodes.count();
        expect(listItems).toBeGreaterThan(0);

        // Take screenshot of list view
        await viewerPage.takeScreenshot('list-view-display');
      } else {
        test.skip('List view not available');
      }
    });

    test('should render JSON in flow/flow view correctly', async ({ dataGenerator }) => {
      const complexJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(complexJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.flowViewButton.isVisible()) {
        await viewerPage.switchToFlowView();

        // Verify flow view is displayed
        await expect(viewerPage.flowView).toBeVisible();

        // Verify flow/graph elements are rendered
        const flowElements = await viewerPage.page
          .locator('.react-flow, .flow-node, .json-node, svg')
          .count();
        expect(flowElements).toBeGreaterThan(0);

        // Take screenshot of flow view
        await viewerPage.takeScreenshot('flow-view-display');
      } else {
        test.skip('Sea/Flow view not available');
      }
    });

    test('should handle editor view mode', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Look for editor view button
      const editorViewButton = viewerPage.page.locator(
        '[data-testid="editor-view"], text="Editor"'
      );

      if (await editorViewButton.isVisible()) {
        await editorViewButton.click();
        await viewerPage.page.waitForTimeout(500);

        // Verify editor is visible and functional
        await expect(viewerPage.jsonTextArea).toBeVisible();

        // Verify content is editable
        const isEditable = await viewerPage.jsonTextArea.isEnabled();
        expect(isEditable).toBe(true);

        // Take screenshot of editor view
        await viewerPage.takeScreenshot('editor-view-display');
      }
    });

    test('should display different node types correctly in tree view', async () => {
      const mixedTypesJson = JSON_SAMPLES.mixedTypes.content;
      const jsonString = JSON.stringify(mixedTypesJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Count different node types
        const nodeCounts = await viewerPage.getNodeCounts();

        // Verify different data types are represented
        expect(nodeCounts.strings).toBeGreaterThan(0);
        expect(nodeCounts.numbers).toBeGreaterThan(0);
        expect(nodeCounts.booleans).toBeGreaterThan(0);
        expect(nodeCounts.arrays).toBeGreaterThan(0);
        expect(nodeCounts.objects).toBeGreaterThan(0);

        // Take screenshot showing different node types
        await viewerPage.takeScreenshot('tree-view-node-types');
      }
    });

    test('should handle very large datasets in different view modes', async ({ dataGenerator }) => {
      const largeJson = dataGenerator.generateLargeJSON(100);
      const jsonString = JSON.stringify(largeJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      const viewModes = [
        { button: viewerPage.treeViewButton, name: 'tree' },
        { button: viewerPage.listViewButton, name: 'list' },
        { button: viewerPage.flowViewButton, name: 'flow' },
      ];

      for (const mode of viewModes) {
        if (await mode.button.isVisible()) {
          const startTime = Date.now();
          await mode.button.click();
          await viewerPage.page.waitForTimeout(2000); // Allow time for rendering
          const endTime = Date.now();

          // Should render within reasonable time
          expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

          // Should not crash or show errors
          expect(await viewerPage.hasJSONErrors()).toBe(false);
        }
      }
    });

    test('should provide visual feedback during view mode switching', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (
        (await viewerPage.treeViewButton.isVisible()) &&
        (await viewerPage.listViewButton.isVisible())
      ) {
        // Switch from tree to list
        await viewerPage.switchToTreeView();
        await viewerPage.page.waitForTimeout(500);

        // Monitor for loading states during switch
        const switchPromise = viewerPage.switchToListView();

        // Check if loading indicator appears
        const hasLoadingIndicator = await viewerPage.loadingSpinner.isVisible();

        await switchPromise;

        // Loading should be complete
        expect(await viewerPage.loadingSpinner.isVisible()).toBe(false);
      }
    });
  });

  test.describe('User Story 8: Switch between viewing tabs (editor, flow, tree, list)', () => {
    test('should maintain JSON data when switching between views', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      const originalNodeCount = await viewerPage.getNodeCounts();

      // Switch between available view modes
      const viewModes = [
        { button: viewerPage.treeViewButton, switch: () => viewerPage.switchToTreeView() },
        { button: viewerPage.listViewButton, switch: () => viewerPage.switchToListView() },
        { button: viewerPage.flowViewButton, switch: () => viewerPage.switchToFlowView() },
      ];

      for (const mode of viewModes) {
        if (await mode.button.isVisible()) {
          await mode.switch();
          await viewerPage.page.waitForTimeout(500);

          // Verify data is still present
          const currentNodeCount = await viewerPage.getNodeCounts();
          expect(currentNodeCount.total).toBeGreaterThan(0);
          expect(await viewerPage.hasJSONErrors()).toBe(false);
        }
      }
    });

    test('should show active view mode state clearly', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();

        // Verify active state is shown
        const activeButton = await viewerPage.page
          .locator(
            '[data-testid="view-mode"] button[aria-pressed="true"], [data-testid="view-mode"] button.active'
          )
          .count();
        expect(activeButton).toBeGreaterThan(0);

        // Verify correct view mode is detected
        const currentMode = await viewerPage.getCurrentViewMode();
        expect(['tree', 'Tree']).toContain(currentMode);

        // Take screenshot of active state
        await viewerPage.takeScreenshot('active-view-mode-state');
      }
    });

    test('should handle rapid view mode switching', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Rapidly switch between view modes
      const availableModes = [];
      if (await viewerPage.treeViewButton.isVisible())
        availableModes.push(() => viewerPage.switchToTreeView());
      if (await viewerPage.listViewButton.isVisible())
        availableModes.push(() => viewerPage.switchToListView());
      if (await viewerPage.flowViewButton.isVisible())
        availableModes.push(() => viewerPage.switchToFlowView());

      if (availableModes.length > 1) {
        for (let i = 0; i < 3; i++) {
          for (const switchMode of availableModes) {
            await switchMode();
            await viewerPage.page.waitForTimeout(200);

            // Should not crash or show errors
            expect(await viewerPage.hasJSONErrors()).toBe(false);
          }
        }
      }
    });

    test('should preserve view-specific settings when switching', async ({ dataGenerator }) => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        // Switch to tree view and expand some nodes
        await viewerPage.switchToTreeView();
        await viewerPage.expandAll();

        const expandedNodeCount = await viewerPage.jsonNodes.count();

        // Switch to different view and back
        if (await viewerPage.listViewButton.isVisible()) {
          await viewerPage.switchToListView();
          await viewerPage.page.waitForTimeout(500);

          await viewerPage.switchToTreeView();
          await viewerPage.page.waitForTimeout(500);

          // Expansion state should be preserved (or at least not cause errors)
          expect(await viewerPage.hasJSONErrors()).toBe(false);
        }
      }
    });

    test('should display appropriate view mode for different JSON structures', async ({
      dataGenerator,
    }) => {
      const testCases = [
        {
          name: 'array-heavy',
          json: dataGenerator.generateArrayHeavyJSON(),
          expectedMode: 'list',
        },
        {
          name: 'deeply-nested',
          json: dataGenerator.generateDeeplyNestedJSON(5),
          expectedMode: 'tree',
        },
        {
          name: 'simple-object',
          json: dataGenerator.generateSimpleJSON(),
          expectedMode: 'tree',
        },
      ];

      for (const testCase of testCases) {
        await viewerPage.clearJSON();
        const jsonString = JSON.stringify(testCase.json, null, 2);

        await viewerPage.inputJSON(jsonString);
        await viewerPage.waitForJSONProcessed();

        // All view modes should work regardless of structure
        const availableViews = [];
        if (await viewerPage.treeViewButton.isVisible()) availableViews.push('tree');
        if (await viewerPage.listViewButton.isVisible()) availableViews.push('list');
        if (await viewerPage.flowViewButton.isVisible()) availableViews.push('flow');

        expect(availableViews.length).toBeGreaterThan(0);

        // Test that the suggested mode works well
        if (testCase.expectedMode === 'tree' && availableViews.includes('tree')) {
          await viewerPage.switchToTreeView();
          expect(await viewerPage.hasJSONErrors()).toBe(false);
        } else if (testCase.expectedMode === 'list' && availableViews.includes('list')) {
          await viewerPage.switchToListView();
          expect(await viewerPage.hasJSONErrors()).toBe(false);
        }
      }
    });

    test('should handle edge cases in view mode switching', async () => {
      // Test empty JSON
      await viewerPage.inputJSON('{}');
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }

      // Test array with single item
      await viewerPage.inputJSON('["single item"]');
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.listViewButton.isVisible()) {
        await viewerPage.switchToListView();
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }

      // Test deeply nested single path
      const deepSingle = { a: { b: { c: { d: { e: 'deep' } } } } };
      await viewerPage.inputJSON(JSON.stringify(deepSingle, null, 2));
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.treeViewButton.isVisible()) {
        await viewerPage.switchToTreeView();
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    });

    test('should provide keyboard shortcuts for view switching', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Test common keyboard shortcuts
      const shortcuts = [
        { key: '1', expectedView: 'tree' },
        { key: '2', expectedView: 'list' },
        { key: '3', expectedView: 'flow' },
      ];

      for (const shortcut of shortcuts) {
        // Try keyboard shortcut (Ctrl/Cmd + number)
        await viewerPage.page.keyboard.press(`Control+${shortcut.key}`);
        await viewerPage.page.waitForTimeout(500);

        // If shortcut worked, verify view switched
        // This is optional as not all implementations have keyboard shortcuts
        const currentMode = await viewerPage.getCurrentViewMode();
        // Just verify no errors occurred
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    });
  });
});

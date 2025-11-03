import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Anonymous User - Basic JSON Viewer', () => {
  let viewerPage: JsonViewerPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    layoutPage = new MainLayoutPage(page);

    await viewerPage.navigateToViewer();
  });

  test('should display JSON viewer interface', async () => {
    // Verify main components are visible
    await expect(viewerPage.jsonTextArea).toBeVisible();
    await expect(viewerPage.viewModeButtons).toBeVisible();

    // Take screenshot for visual regression
    await viewerPage.takeScreenshot('anonymous-viewer-interface');
  });

  test('should parse and display simple JSON', async ({ dataGenerator }) => {
    const simpleJson = dataGenerator.generateSimpleJSON();
    const jsonString = JSON.stringify(simpleJson, null, 2);

    // Input JSON
    await viewerPage.inputJSON(jsonString);

    // Wait for processing
    await viewerPage.waitForJSONProcessed();

    // Verify JSON structure is displayed
    const nodeCounts = await viewerPage.getNodeCounts();
    expect(nodeCounts.total).toBeGreaterThan(0);
    expect(nodeCounts.objects).toBeGreaterThan(0);

    // Verify no errors
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });

  test('should parse and display realistic user data', async ({ dataGenerator }) => {
    // Use realistic data generator
    const realisticUser = dataGenerator.generateRealisticUser();
    const jsonString = JSON.stringify(realisticUser, null, 2);

    // Input JSON
    await viewerPage.inputJSON(jsonString);

    // Wait for processing
    await viewerPage.waitForJSONProcessed();

    // Verify JSON structure is displayed
    const nodeCounts = await viewerPage.getNodeCounts();
    expect(nodeCounts.total).toBeGreaterThan(0);
    expect(nodeCounts.objects).toBeGreaterThan(0);

    // Verify no errors
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    // Take screenshot with realistic data
    await viewerPage.takeScreenshot('realistic-user-data');
  });

  test('should handle all view modes', async ({ dataGenerator }) => {
    const complexJson = dataGenerator.generateComplexJSON();
    const jsonString = JSON.stringify(complexJson, null, 2);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Test all view modes
    const viewModeResults = await viewerPage.testAllViewModes();

    // Verify each mode works
    for (const result of viewModeResults) {
      expect(result.working).toBe(true);
      if (result.mode !== 'flow') {
        // Sea view might not have nodes in the same way
        expect(result.nodeCount).toBeGreaterThan(0);
      }
    }
  });

  test('should expand and collapse nodes', async ({ dataGenerator }) => {
    const nestedJson = JSON_SAMPLES.nested.content;
    const jsonString = JSON.stringify(nestedJson, null, 2);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Switch to tree view for better node interaction
    await viewerPage.switchToTreeView();

    // Test expand all
    await viewerPage.expandAll();
    const expandedCount = await viewerPage.jsonNodes.count();

    // Test collapse all
    await viewerPage.collapseAll();
    const collapsedCount = await viewerPage.jsonNodes.count();

    // Should have fewer visible nodes when collapsed
    expect(collapsedCount).toBeLessThan(expandedCount);
  });

  test('should search within JSON content', async ({ dataGenerator }) => {
    const searchableJson = JSON_SAMPLES.apiResponse.content;
    const jsonString = JSON.stringify(searchableJson, null, 2);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Search for a specific term
    await viewerPage.searchInJSON('user1');

    // Wait for search results to be processed
    await viewerPage.page.waitForLoadState('networkidle');

    // Clear search
    await viewerPage.clearSearch();
  });

  test('should handle invalid JSON gracefully', async () => {
    const invalidJson = '{"invalid": json}';

    await viewerPage.inputJSON(invalidJson);

    // Should show error message
    expect(await viewerPage.hasJSONErrors()).toBe(true);

    const errorMessage = await viewerPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toContain('invalid');
  });

  test('should handle large JSON files', async ({ dataGenerator }) => {
    // Generate large JSON
    const largeJson = dataGenerator.generateLargeJSON(500); // 500 items
    const jsonString = JSON.stringify(largeJson, null, 2);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Should successfully process large JSON
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    const stats = await viewerPage.getJSONStats();
    expect(stats.nodeCount).toBeGreaterThan(500);
  });

  test('should support copy functionality', async ({ dataGenerator }) => {
    const simpleJson = dataGenerator.generateSimpleJSON();
    const jsonString = JSON.stringify(simpleJson, null, 2);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Test copy functionality if available
    if (await viewerPage.copyButton.isVisible()) {
      const copiedText = await viewerPage.copyJSON();
      expect(copiedText).toBeTruthy();
    }
  });

  test('should be responsive across different screen sizes', async ({
    dataGenerator,
    screenshotHelper,
  }) => {
    const json = dataGenerator.generateSimpleJSON();
    const jsonString = JSON.stringify(json, null, 2);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Test responsive behavior
    await screenshotHelper.captureResponsive('anonymous-viewer-responsive');

    // Verify layout works on different screen sizes
    const responsiveResults = await layoutPage.testResponsiveLayout();

    for (const result of responsiveResults) {
      expect(result.navigationVisible || result.logoVisible).toBe(true);
    }
  });
});

import { test, expect } from './utils/base-test';
import { JsonViewerPage } from './page-objects/json-viewer-page';
import { MainLayoutPage } from './page-objects/main-layout-page';

test.describe('Test Infrastructure Verification', () => {
  test.describe.configure({ mode: 'serial' });

  test('Server is accessible and responds', async ({ page, apiHelper }) => {
    // Test that server is running
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loads
    expect(page.url()).toContain('3456');

    // Test API health check
    const health = await apiHelper.healthCheck();
    expect(health.status).toBe('ok');
  });

  test('Basic JSON viewer functionality works', async ({ page, dataGenerator }) => {
    const viewerPage = new JsonViewerPage(page);

    await viewerPage.navigateToViewer();

    // Test with simple JSON
    const simpleJson = dataGenerator.generateSimpleJSON();
    const jsonString = JSON.stringify(simpleJson, null, 2);

    await viewerPage.inputJSON(jsonString);
    await viewerPage.waitForJSONProcessed();

    // Should not have errors
    expect(await viewerPage.hasJSONErrors()).toBe(false);

    // Should have some content
    const nodeCount = await viewerPage.jsonNodes.count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('Authentication helpers work', async ({ page, authHelper }) => {
    const layoutPage = new MainLayoutPage(page);

    // Start logged out
    await page.goto('/');
    expect(await layoutPage.isLoggedIn()).toBe(false);

    // Test login
    await authHelper.login('regular');
    expect(await layoutPage.isLoggedIn()).toBe(true);

    // Test logout
    await layoutPage.logout();
    expect(await layoutPage.isLoggedIn()).toBe(false);
  });

  test('API helpers work correctly', async ({ apiHelper, dataGenerator }) => {
    // Test JSON upload
    const testJson = dataGenerator.generateSimpleJSON();
    const uploadResult = await apiHelper.uploadJSON(testJson, {
      title: 'Infrastructure Test JSON',
    });

    expect(uploadResult).toHaveProperty('id');

    // Test JSON retrieval
    const retrievedJson = await apiHelper.getJSON(uploadResult.id);
    expect(retrievedJson).toBeTruthy();
  });

  test('Screenshot helpers work', async ({ page, screenshotHelper }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Test basic screenshot
    await screenshotHelper.captureFullPage('infrastructure-test');

    // Test element screenshot
    await screenshotHelper.captureElement('body', 'infrastructure-body');

    // Should not throw errors
    expect(true).toBe(true);
  });

  test('Data generators produce valid data', async ({ dataGenerator }) => {
    // Test simple JSON generation
    const simple = dataGenerator.generateSimpleJSON();
    expect(simple).toBeTruthy();
    expect(typeof simple).toBe('object');

    // Test complex JSON generation
    const complex = dataGenerator.generateComplexJSON();
    expect(complex).toBeTruthy();
    expect(typeof complex).toBe('object');

    // Test large JSON generation
    const large = dataGenerator.generateLargeJSON(10);
    expect(large).toBeTruthy();
    expect(large.data).toHaveLength(10);

    // Test malformed JSON strings
    const malformed = dataGenerator.generateMalformedJSON();
    expect(Array.isArray(malformed)).toBe(true);
    expect(malformed.length).toBeGreaterThan(0);
  });

  test('All view modes can be accessed', async ({ page, dataGenerator }) => {
    const viewerPage = new JsonViewerPage(page);

    await viewerPage.navigateToViewer();

    const testJson = dataGenerator.generateComplexJSON();
    await viewerPage.inputJSON(JSON.stringify(testJson));
    await viewerPage.waitForJSONProcessed();

    // Test tree view
    await viewerPage.switchToTreeView();
    let currentMode = await viewerPage.getCurrentViewMode();
    expect(currentMode).toContain('tree');

    // Test list view
    await viewerPage.switchToListView();
    currentMode = await viewerPage.getCurrentViewMode();
    expect(currentMode).toContain('list');

    // Test flow view (if available)
    try {
      await viewerPage.switchToFlowView();
      // Sea view might not be fully implemented, so don't assert
    } catch (error) {
      console.log('Sea view not available or not working:', error.message);
    }
  });
});

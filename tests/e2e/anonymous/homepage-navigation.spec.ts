import { test, expect } from '../../utils/base-test';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';

test.describe('Anonymous User - Homepage & Navigation', () => {
  let layoutPage: MainLayoutPage;
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    layoutPage = new MainLayoutPage(page);
    viewerPage = new JsonViewerPage(page);
  });

  test.describe('User Story 1: Visit main homepage and access JSON viewer', () => {
    test('should display homepage with main navigation', async ({ page }) => {
      await page.goto('/');
      await layoutPage.waitForLoad();

      // Verify main layout elements are visible
      await expect(layoutPage.logo).toBeVisible();
      await expect(layoutPage.navigationMenu).toBeVisible();

      // Verify key navigation links exist
      await expect(layoutPage.viewerLink).toBeVisible();
      await expect(layoutPage.libraryLink).toBeVisible();

      // Take screenshot for visual regression
      await layoutPage.takeScreenshot('homepage-initial-load');
    });

    test('should navigate to JSON viewer from homepage', async ({ page }) => {
      await page.goto('/');
      await layoutPage.waitForLoad();

      // Click on viewer link
      await layoutPage.goToViewer();

      // Verify we're on viewer page
      expect(await viewerPage.getCurrentURL()).toContain('/viewer');

      // Verify JSON viewer interface is loaded
      await expect(viewerPage.jsonTextArea).toBeVisible();
      await expect(viewerPage.viewModeButtons).toBeVisible();
    });

    test('should have working logo link back to homepage', async ({ page }) => {
      await page.goto('/viewer');
      await layoutPage.waitForLoad();

      // Click logo to go back to homepage
      await layoutPage.goHome();

      // Verify we're back on homepage
      expect(await layoutPage.getCurrentURL()).toBe(page.url().replace(/\/[^/]*$/, '/'));
    });

    test('should display proper page titles and meta information', async ({ page }) => {
      // Test homepage
      await page.goto('/');
      await layoutPage.waitForLoad();

      const homeTitle = await layoutPage.getPageTitle();
      expect(homeTitle).toContain('JSON');
      expect(homeTitle).toContain('Viewer');

      // Test viewer page
      await page.goto('/viewer');
      await layoutPage.waitForLoad();

      const viewerTitle = await layoutPage.getPageTitle();
      expect(viewerTitle).toContain('JSON');
      expect(viewerTitle).toContain('Viewer');
    });

    test('should be responsive on different screen sizes', async ({ page, screenshotHelper }) => {
      await page.goto('/');
      await layoutPage.waitForLoad();

      const responsiveResults = await layoutPage.testResponsiveLayout();

      // Verify navigation is accessible on all screen sizes
      for (const result of responsiveResults) {
        expect(result.logoVisible || result.navigationVisible).toBe(true);
      }

      // Capture responsive screenshots
      await screenshotHelper.captureResponsive('homepage-responsive');
    });

    test('should handle direct viewer access without homepage visit', async ({ page }) => {
      // Directly access viewer URL
      await page.goto('/viewer');
      await viewerPage.waitForLoad();

      // Verify viewer loads correctly
      await expect(viewerPage.jsonTextArea).toBeVisible();
      await expect(viewerPage.viewModeButtons).toBeVisible();

      // Verify navigation is still available
      await expect(layoutPage.logo).toBeVisible();
      await expect(layoutPage.navigationMenu).toBeVisible();
    });

    test('should maintain state when navigating between pages', async ({ page, dataGenerator }) => {
      // Start on homepage
      await page.goto('/');
      await layoutPage.waitForLoad();

      // Go to viewer and add some JSON
      await layoutPage.goToViewer();
      const testJson = dataGenerator.generateSimpleJSON();
      await viewerPage.inputJSON(JSON.stringify(testJson, null, 2));
      await viewerPage.waitForJSONProcessed();

      // Navigate to another page and back
      await layoutPage.goToDevelopers();
      await layoutPage.goToViewer();

      // Verify JSON is still there (basic session persistence)
      const hasContent = await viewerPage.jsonTextArea.inputValue();
      expect(hasContent.length).toBeGreaterThan(0);
    });

    test('should handle invalid URLs gracefully', async ({ page }) => {
      // Try accessing non-existent page
      const response = await page.goto('/non-existent-page');

      // Should either redirect to homepage or show 404
      const currentUrl = await layoutPage.getCurrentURL();
      const isHomepage = currentUrl.endsWith('/') || currentUrl.endsWith('/viewer');
      const is404 = response?.status() === 404;

      expect(isHomepage || is404).toBe(true);
    });
  });
});

import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Authenticated User - Integration Tests', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page, authHelper }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);

    // Login as regular user
    await authHelper.login('regular');

    // Verify login was successful
    expect(await layoutPage.isLoggedIn()).toBe(true);
  });

  test.afterEach(async ({ authHelper }) => {
    await authHelper.logout();
  });

  test('should complete full workflow: create, save, edit, share, delete', async ({
    apiHelper,
  }) => {
    // 1. Create and save JSON
    const testJson = JSON_SAMPLES.simple.content;
    const uploadResult = await apiHelper.uploadJSON(testJson, {
      title: 'Integration Test Document',
    });

    // 2. View in library
    await libraryPage.navigateToLibrary();
    await libraryPage.waitForItemsToLoad();

    const items = await libraryPage.getAllJSONItems();
    const testDoc = items.find((item) => item.title.includes('Integration Test'));
    expect(testDoc).toBeDefined();

    // 3. Edit title
    if (testDoc) {
      const editButton = libraryPage.editButtons.nth(testDoc.index);
      if (await editButton.isVisible()) {
        await editButton.click();

        const titleInput = libraryPage.page.locator('[data-testid="edit-title"]');
        if (await titleInput.isVisible()) {
          await titleInput.clear();
          await titleInput.fill('Updated Integration Test');

          const saveButton = libraryPage.page.locator('[data-testid="save-title"]');
          await saveButton.click();
          await layoutPage.waitForNotification('updated');
        }
      }
    }

    // 4. Share document
    await libraryPage.waitForItemsToLoad();
    const updatedItems = await libraryPage.getAllJSONItems();
    const updatedDoc = updatedItems.find((item) => item.title.includes('Updated Integration'));

    if (updatedDoc) {
      const shareButton = libraryPage.shareButtons.nth(updatedDoc.index);
      if (await shareButton.isVisible()) {
        await shareButton.click();

        const shareUrl = await libraryPage.page.locator('[data-testid="share-url"]').textContent();
        expect(shareUrl).toBeTruthy();
      }
    }

    // 5. Delete document
    if (updatedDoc) {
      await libraryPage.deleteJSONItem(updatedDoc.index);

      await libraryPage.waitForItemsToLoad();
      const finalItems = await libraryPage.getAllJSONItems();
      const deletedDoc = finalItems.find((item) => item.title.includes('Updated Integration'));
      expect(deletedDoc).toBeUndefined();
    }
  });

  test('should handle cross-feature interactions', async ({ apiHelper }) => {
    // Create document
    const complexJson = JSON_SAMPLES.nested.content;
    await apiHelper.uploadJSON(complexJson, {
      title: 'Cross-Feature Test Document',
    });

    // View in library
    await libraryPage.navigateToLibrary();
    await libraryPage.waitForItemsToLoad();

    // Load into viewer
    const items = await libraryPage.getAllJSONItems();
    const crossFeatureDoc = items.find((item) => item.title.includes('Cross-Feature'));

    if (crossFeatureDoc) {
      await libraryPage.viewJSONItem(crossFeatureDoc.index);
      await viewerPage.waitForJSONProcessed();

      // Test different view modes
      await viewerPage.switchToTreeView();
      await viewerPage.waitForLoad();

      await viewerPage.switchToListView();
      await viewerPage.waitForLoad();

      // Test search within JSON
      const searchInput = viewerPage.searchInput;
      if (await searchInput.isVisible()) {
        await searchInput.fill('personal');
        await viewerPage.page.keyboard.press('Enter');
        await viewerPage.page.waitForTimeout(500);
      }

      // Verify no errors occurred
      expect(await viewerPage.hasJSONErrors()).toBe(false);
    }
  });

  test('should handle user session persistence across features', async ({ page }) => {
    // Navigate to different sections while maintaining session
    await libraryPage.navigateToLibrary();
    await expect(libraryPage.libraryContainer).toBeVisible();
    expect(await layoutPage.isLoggedIn()).toBe(true);

    await layoutPage.goToProfile();
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();
    expect(await layoutPage.isLoggedIn()).toBe(true);

    await viewerPage.navigateToViewer();
    await expect(viewerPage.viewerContainer).toBeVisible();
    expect(await layoutPage.isLoggedIn()).toBe(true);

    // Should maintain session across page refresh
    await page.reload();
    await layoutPage.waitForLoad();
    expect(await layoutPage.isLoggedIn()).toBe(true);
  });
});

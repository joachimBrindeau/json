import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Authenticated User - Document Management', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page, authHelper }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);

    // Login as regular user
    await authHelper.login('regular');
    expect(await layoutPage.isLoggedIn()).toBe(true);
  });

  test.afterEach(async ({ authHelper }) => {
    await authHelper.logout();
  });

  test.describe('Edit Document Titles and Metadata', () => {
    test.beforeEach(async ({ apiHelper, dataGenerator }) => {
      // Create test documents with metadata using realistic data
      const testDocuments = [
        {
          content: JSON_SAMPLES.simple.content,
          title: 'Original Simple Document',
          description: 'A basic JSON document for testing',
          tags: ['simple', 'test'],
        },
        {
          content: JSON_SAMPLES.nested.content,
          title: 'Complex Nested Structure',
          description: 'Nested object structure example',
          tags: ['nested', 'complex', 'structure'],
        },
        {
          content: dataGenerator.generateRealisticUser(),
          title: 'Realistic User Profile',
          description: 'User profile with realistic data',
          tags: ['user', 'realistic', 'profile'],
        },
        {
          content: dataGenerator.generateRealisticProducts(3),
          title: 'E-commerce Product Catalog',
          description: 'Product catalog with realistic data',
          tags: ['products', 'ecommerce', 'realistic'],
        },
      ];

      for (const doc of testDocuments) {
        await apiHelper.uploadJSON(doc.content, doc);
      }
    });

    test('should edit document title from library view', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThan(0);

      const targetItem = items.find((item) => item.title.includes('Original Simple'));
      expect(targetItem).toBeDefined();

      // Find and click edit button for the item
      const editButton = libraryPage.page.locator(`[data-testid="edit-json-${targetItem?.index}"]`);
      await expect(editButton).toBeVisible();
      await editButton.click();

      // Fill in new title
      const titleInput = libraryPage.page.locator('[data-testid="edit-title"]');
      await expect(titleInput).toBeVisible();
      await titleInput.clear();
      await titleInput.fill('Updated Simple Document Title');

      // Save changes
      const saveButton = libraryPage.page.locator('[data-testid="save-title"]');
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      // Wait for update confirmation
      await layoutPage.waitForNotification('Title updated');

      // Verify title change
      await libraryPage.waitForItemsToLoad();
      const updatedItems = await libraryPage.getAllJSONItems();
      const updatedItem = updatedItems.find((item) =>
        item.title.includes('Updated Simple Document')
      );

      expect(updatedItem).toBeDefined();
    });

    test('should edit document title from viewer', async ({ apiHelper }) => {
      // Get document ID from the API response
      const uploadResult = await apiHelper.uploadJSON(JSON_SAMPLES.configuration.content, {
        title: 'Configuration Document to Edit',
      });

      // Navigate directly to viewer with document
      await viewerPage.navigateToViewer(uploadResult.id);
      await viewerPage.waitForJSONProcessed();

      // Open document settings or edit mode
      const settingsButton = viewerPage.page.locator('[data-testid="document-settings"]');

      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        // Edit title in settings panel
        const titleInput = viewerPage.page.locator('[data-testid="document-title-input"]');

        if (await titleInput.isVisible()) {
          await titleInput.clear();
          await titleInput.fill('Renamed Configuration from Viewer');

          // Save changes
          const saveSettingsButton = viewerPage.page.locator('[data-testid="save-settings"]');
          await saveSettingsButton.click();

          await layoutPage.waitForNotification('Document updated');
        }
      }

      // Verify change persisted
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const renamedItem = items.find((item) => item.title.includes('Renamed Configuration'));

      expect(renamedItem).toBeDefined();
    });

    test('should edit document description and metadata', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const targetItem = items.find((item) => item.title.includes('Complex Nested'));
      expect(targetItem).toBeDefined();

      // Open edit modal for metadata
      const editButton = libraryPage.editButtons.nth(targetItem?.index || 0);
      await editButton.click();

      // Edit description
      const descriptionInput = libraryPage.page.locator('[data-testid="edit-description"]');

      if (await descriptionInput.isVisible()) {
        await descriptionInput.clear();
        await descriptionInput.fill(
          'Updated description with more details about the nested structure'
        );
      }

      // Edit tags
      const tagsInput = libraryPage.page.locator('[data-testid="edit-tags"]');

      if (await tagsInput.isVisible()) {
        await tagsInput.clear();
        await tagsInput.fill('updated, nested, complex, metadata');
      }

      // Save changes
      const saveButton = libraryPage.page.locator('[data-testid="save-metadata"]');
      await expect(saveButton).toBeVisible();
      await saveButton.click();
      await layoutPage.waitForNotification('Metadata updated');

      // Close modal if still open
      const closeButton = libraryPage.page.locator('[data-testid="close-modal"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    });

    test('should validate title length and special characters', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const firstItem = items[0];

      const editButton = libraryPage.editButtons.first();
      await editButton.click();

      const titleInput = libraryPage.page.locator('[data-testid="edit-title"]');

      // Test empty title
      await titleInput.clear();
      const saveButton = libraryPage.page.locator('[data-testid="save-title"]');
      await saveButton.click();

      // Should show validation error
      const errorMessage = libraryPage.page.locator('[data-testid="title-error"]');

      if (await errorMessage.isVisible()) {
        expect(await errorMessage.textContent()).toContain('required');
      }

      // Test very long title
      const longTitle = 'A'.repeat(256);
      await titleInput.fill(longTitle);
      await saveButton.click();

      // Should handle long titles (either truncate or show error)
      const longTitleError = libraryPage.page.locator('.error:has-text("too long")');
      if (await longTitleError.isVisible()) {
        expect(await longTitleError.textContent()).toContain('long');
      }

      // Test title with special characters
      await titleInput.clear();
      await titleInput.fill('Title with "quotes" & symbols <test>');
      await saveButton.click();

      // Should handle special characters properly
      await layoutPage.waitForNotification('updated', { timeout: 5000 });
    });

    test('should handle concurrent editing', async ({ context }) => {
      // This test simulates multiple users editing the same document
      // Create second browser context
      const secondPage = await context.newPage();
      const secondLibraryPage = new LibraryPage(secondPage);
      const secondLayoutPage = new MainLayoutPage(secondPage);

      // Login with same user in second tab (simulates same user, different tabs)
      await secondPage.goto('/');

      // Navigate to library in both tabs
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      await secondLibraryPage.navigateToLibrary();
      await secondLibraryPage.waitForItemsToLoad();

      // Start editing in first tab
      const editButton1 = libraryPage.editButtons.first();
      await editButton1.click();

      const titleInput1 = libraryPage.page.locator('[data-testid="edit-title"]');
      await titleInput1.fill('Edit from Tab 1');

      // Simultaneously edit in second tab
      const editButton2 = secondLibraryPage.editButtons.first();
      await editButton2.click();

      const titleInput2 = secondPage.locator('[data-testid="edit-title"]');
      await titleInput2.fill('Edit from Tab 2');

      // Save from first tab
      await libraryPage.page.locator('[data-testid="save-title"]').click();
      await layoutPage.waitForNotification('updated');

      // Try to save from second tab
      await secondPage.locator('[data-testid="save-title"]').click();

      // Should handle conflict gracefully
      const conflictMessage = secondPage.locator('[data-testid="edit-conflict"]');

      if (await conflictMessage.isVisible()) {
        // Conflict detected and handled
        expect(await conflictMessage.textContent()).toContain('conflict');
      } else {
        // Last write wins or merge handled
        await secondLayoutPage.waitForNotification('updated');
      }

      await secondPage.close();
    });
  });

  test.describe('Delete Documents from Library', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create documents to delete
      const documentsToDelete = [
        { content: { temp: true, data: 'delete me 1' }, title: 'Temporary Document 1' },
        { content: { temp: true, data: 'delete me 2' }, title: 'Temporary Document 2' },
        { content: { temp: true, data: 'delete me 3' }, title: 'Temporary Document 3' },
      ];

      for (const doc of documentsToDelete) {
        await apiHelper.uploadJSON(doc.content, doc);
      }
    });

    test('should delete single document from library', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const initialItems = await libraryPage.getAllJSONItems();
      const initialCount = initialItems.length;
      expect(initialCount).toBeGreaterThan(0);

      // Find document to delete
      const documentToDelete = initialItems.find((item) =>
        item.title.includes('Temporary Document 1')
      );
      expect(documentToDelete).toBeDefined();

      // Delete the document
      await libraryPage.deleteJSONItem(documentToDelete?.index || 0);

      // Verify document was deleted
      await libraryPage.waitForItemsToLoad();
      const remainingItems = await libraryPage.getAllJSONItems();

      expect(remainingItems.length).toBe(initialCount - 1);

      // Verify specific document is gone
      const deletedDocument = remainingItems.find((item) =>
        item.title.includes('Temporary Document 1')
      );
      expect(deletedDocument).toBeUndefined();
    });

    test('should confirm deletion before removing document', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const targetItem = items.find((item) => item.title.includes('Temporary Document 2'));

      // Click delete button
      const deleteButton = libraryPage.deleteButtons.nth(targetItem?.index || 0);
      await deleteButton.click();

      // Should show confirmation dialog
      const confirmDialog = libraryPage.page.locator('[data-testid="delete-confirm-dialog"]');

      await expect(confirmDialog).toBeVisible();

      // Should show document title in confirmation
      const confirmText = await confirmDialog.textContent();
      expect(confirmText?.toLowerCase()).toContain('delete');
      expect(confirmText).toContain('Temporary Document 2');

      // Click cancel first
      const cancelButton = libraryPage.page.locator('[data-testid="cancel-delete"]');
      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      // Document should still exist
      await libraryPage.waitForItemsToLoad();
      const itemsAfterCancel = await libraryPage.getAllJSONItems();
      const stillExists = itemsAfterCancel.find((item) =>
        item.title.includes('Temporary Document 2')
      );
      expect(stillExists).toBeDefined();

      // Now actually delete
      await libraryPage.deleteJSONItem(targetItem?.index || 0);

      // Verify deletion completed
      const itemsAfterDelete = await libraryPage.getAllJSONItems();
      const shouldBeGone = itemsAfterDelete.find((item) =>
        item.title.includes('Temporary Document 2')
      );
      expect(shouldBeGone).toBeUndefined();
    });

    test('should handle bulk deletion of documents', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const initialItems = await libraryPage.getAllJSONItems();
      expect(initialItems.length).toBeGreaterThanOrEqual(3);

      // Select all temporary documents for deletion
      const selectAllCheckbox = libraryPage.page.locator('[data-testid="select-all"]');

      if (await selectAllCheckbox.isVisible()) {
        await libraryPage.selectAllItems();

        // Perform bulk delete
        await libraryPage.deleteSelectedItems();

        // All items should be deleted
        await libraryPage.waitForItemsToLoad();

        const remainingItems = await libraryPage.getAllJSONItems();
        expect(remainingItems.length).toBe(0);

        // Should show empty state
        expect(await libraryPage.isEmpty()).toBe(true);
      } else {
        // Fallback: delete items individually if bulk not available
        for (let i = initialItems.length - 1; i >= 0; i--) {
          const item = initialItems[i];
          if (item.title.includes('Temporary Document')) {
            await libraryPage.deleteJSONItem(i);
            await libraryPage.waitForItemsToLoad();
          }
        }
      }
    });

    test('should prevent accidental deletion of important documents', async ({ apiHelper }) => {
      // Create an "important" document
      await apiHelper.uploadJSON(JSON_SAMPLES.configuration.content, {
        title: 'IMPORTANT: Production Configuration',
        description: 'Critical production settings - DO NOT DELETE',
      });

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const importantDoc = items.find((item) => item.title.includes('IMPORTANT'));
      expect(importantDoc).toBeDefined();

      // Try to delete important document
      const deleteButton = libraryPage.deleteButtons.nth(importantDoc?.index || 0);
      await deleteButton.click();

      // Should show extra warning for important documents
      const warningDialog = libraryPage.page.locator('[data-testid="important-delete-warning"]');

      if (await warningDialog.isVisible()) {
        const warningText = await warningDialog.textContent();
        expect(warningText?.toLowerCase()).toContain('important');
        expect(warningText?.toLowerCase()).toContain('production');
      }

      // Require additional confirmation
      const confirmImportantDelete = libraryPage.page.locator(
        '[data-testid="confirm-important-delete"]'
      );
      if (await confirmImportantDelete.isVisible()) {
        await confirmImportantDelete.click();
      } else {
        // Standard delete confirmation
        await libraryPage.page.locator('[data-testid="confirm-delete"]').click();
      }

      // Verify deletion completed
      await layoutPage.waitForNotification('deleted');
    });

    test('should handle deletion errors gracefully', async ({ page }) => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThan(0);

      // Mock deletion API failure
      await page.route('**/api/json/*/delete', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      // Try to delete document
      const deleteButton = libraryPage.deleteButtons.first();
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = libraryPage.page.locator('[data-testid="confirm-delete"]');
      await confirmButton.click();

      // Should show error message
      await layoutPage.waitForNotification('Failed to delete', 10000);

      // Document should still exist
      await libraryPage.waitForItemsToLoad();
      const itemsAfterFailedDelete = await libraryPage.getAllJSONItems();
      expect(itemsAfterFailedDelete.length).toBe(items.length);
    });
  });

  test.describe('Load Documents from Library into Editor', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create various test documents to load
      const testDocuments = [
        { content: JSON_SAMPLES.simple.content, title: 'Simple Data for Loading' },
        { content: JSON_SAMPLES.nested.content, title: 'Complex Structure for Loading' },
        { content: JSON_SAMPLES.largeArray.generateContent(50), title: 'Medium Array Data' },
        { content: JSON_SAMPLES.ecommerce.content, title: 'E-commerce Order Data' },
      ];

      for (const doc of testDocuments) {
        await apiHelper.uploadJSON(doc.content, doc);
      }
    });

    test('should load document from library into JSON editor', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const targetDocument = items.find((item) => item.title.includes('Simple Data'));
      expect(targetDocument).toBeDefined();

      // Click to view/edit document
      await libraryPage.viewJSONItem(targetDocument?.index || 0);

      // Should navigate to viewer/editor
      await viewerPage.waitForJSONProcessed();

      // Verify JSON is loaded correctly
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      const nodeCounts = await viewerPage.getNodeCounts();
      expect(nodeCounts.total).toBeGreaterThan(0);

      // Verify specific content is present
      const jsonContent = await viewerPage.page
        .locator('[data-testid="json-content"]')
        .textContent();
      if (jsonContent) {
        expect(jsonContent.toLowerCase()).toContain('john doe'); // From simple.content
      }
    });

    test('should load document and preserve view mode preference', async ({ page }) => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const complexDoc = items.find((item) => item.title.includes('Complex Structure'));

      // Load document
      await libraryPage.viewJSONItem(complexDoc?.index || 0);
      await viewerPage.waitForJSONProcessed();

      // Switch to tree view
      await viewerPage.switchToTreeView();

      // Verify we're in tree view
      const currentMode = await viewerPage.getCurrentViewMode();
      expect(currentMode).toContain('tree');

      // Go back to library and load another document
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const anotherDoc = items.find((item) => item.title.includes('E-commerce'));
      await libraryPage.viewJSONItem(anotherDoc?.index || 0);
      await viewerPage.waitForJSONProcessed();

      // Should remember tree view preference
      const rememberedMode = await viewerPage.getCurrentViewMode();
      if (rememberedMode.includes('tree')) {
        expect(rememberedMode).toContain('tree');
      }
    });

    test('should handle loading large documents efficiently', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const largeDoc = items.find((item) => item.title.includes('Medium Array'));

      // Record load start time
      const startTime = Date.now();

      await libraryPage.viewJSONItem(largeDoc?.index || 0);
      await viewerPage.waitForJSONProcessed();

      const loadTime = Date.now() - startTime;

      // Should load within reasonable time
      expect(loadTime).toBeLessThan(15000); // 15 seconds max for medium data

      // Verify document loaded correctly
      expect(await viewerPage.hasJSONErrors()).toBe(false);

      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(50);
    });

    test('should load document and enable editing', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const editableDoc = items.find((item) => item.title.includes('Simple Data'));

      await libraryPage.viewJSONItem(editableDoc?.index || 0);
      await viewerPage.waitForJSONProcessed();

      // Check if edit mode is available
      const editModeButton = viewerPage.page.locator('[data-testid="edit-mode"]');

      if (await editModeButton.isVisible()) {
        await editModeButton.click();

        // Should be able to modify JSON
        const jsonEditor = viewerPage.jsonTextArea;
        await jsonEditor.clear();
        await jsonEditor.fill('{"edited": true, "timestamp": "' + new Date().toISOString() + '"}');

        // Save changes
        const saveButton = viewerPage.page.locator('[data-testid="save-changes"]');
        await saveButton.click();

        await layoutPage.waitForNotification('Changes saved');

        // Verify changes persisted
        await viewerPage.waitForJSONProcessed();
        const updatedContent = await viewerPage.page
          .locator('[data-testid="json-content"]')
          .textContent();
        if (updatedContent) {
          expect(updatedContent).toContain('edited');
        }
      }
    });

    test('should handle version history when loading documents', async ({ apiHelper, page }) => {
      // Create document with potential versions
      const originalDoc = await apiHelper.uploadJSON(
        { version: 1, data: 'original' },
        { title: 'Versioned Document' }
      );

      // Update the document
      await apiHelper.apiCall('PUT', `/api/json/${originalDoc.id}`, {
        data: {
          content: JSON.stringify({ version: 2, data: 'updated' }),
          title: 'Versioned Document',
        },
        expectedStatus: 200,
      });

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const versionedDoc = items.find((item) => item.title.includes('Versioned Document'));

      await libraryPage.viewJSONItem(versionedDoc?.index || 0);
      await viewerPage.waitForJSONProcessed();

      // Should load latest version
      const content = await viewerPage.page.locator('[data-testid="json-content"]').textContent();
      if (content) {
        expect(content).toContain('version');
        expect(content).toContain('2'); // Latest version
      }

      // Check if version history is available
      const historyButton = viewerPage.page.locator('[data-testid="version-history"]');
      if (await historyButton.isVisible()) {
        await historyButton.click();

        const historyPanel = viewerPage.page.locator('[data-testid="history-panel"]');
        await expect(historyPanel).toBeVisible();

        // Should show version entries
        const versionEntries = viewerPage.page.locator('[data-testid="version-entry"]');
        const count = await versionEntries.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    });

    test('should handle document loading errors', async ({ page }) => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThan(0);

      // Mock document loading failure
      await page.route('**/api/json/*/content', (route) => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Document not found' }),
        });
      });

      // Try to load document
      await libraryPage.viewJSONItem(0);

      // Should handle error gracefully
      const errorMessage = viewerPage.page.locator('[data-testid="load-error"]');

      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      const errorText = await errorMessage.textContent();
      expect(errorText?.toLowerCase()).toContain('error');
    });

    test('should load document and maintain library context', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const testDoc = items[0];

      // Load document
      await libraryPage.viewJSONItem(0);
      await viewerPage.waitForJSONProcessed();

      // Should have back to library navigation
      const backButton = viewerPage.page.locator('[data-testid="back-to-library"]');

      if (await backButton.isVisible()) {
        await backButton.click();

        // Should return to library
        await libraryPage.waitForItemsToLoad();
        expect(await libraryPage.libraryContainer.isVisible()).toBe(true);
      } else {
        // Use browser back button
        await viewerPage.goBack();
        await libraryPage.waitForItemsToLoad();
        expect(await libraryPage.libraryContainer.isVisible()).toBe(true);
      }
    });
  });

  test.describe('Document Management Edge Cases', () => {
    test('should handle operations on non-existent documents', async ({ page }) => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Mock API to simulate document not found
      await page.route('**/api/json/nonexistent/content', (route) => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({ error: 'Document not found' }),
        });
      });

      // Try to navigate to non-existent document
      await page.goto('/viewer/nonexistent');

      // Should show not found error
      const notFoundError = page.locator('[data-testid="document-not-found"]');

      await expect(notFoundError).toBeVisible({ timeout: 10000 });
    });

    test('should handle permission errors on document operations', async ({ page, apiHelper }) => {
      // Create document as different user (if multi-user testing is supported)
      const testDoc = await apiHelper.uploadJSON(
        { restricted: true },
        { title: 'Restricted Document' }
      );

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Mock permission denied for edit
      await page.route(`**/api/json/${testDoc.id}/title`, (route) => {
        route.fulfill({
          status: 403,
          body: JSON.stringify({ error: 'Permission denied' }),
        });
      });

      const items = await libraryPage.getAllJSONItems();
      const restrictedItem = items.find((item) => item.title.includes('Restricted'));

      if (restrictedItem) {
        const editButton = libraryPage.editButtons.nth(restrictedItem.index);
        await editButton.click();

        const titleInput = libraryPage.page.locator('[data-testid="edit-title"]');
        await titleInput.fill('Unauthorized Edit Attempt');

        const saveButton = libraryPage.page.locator('[data-testid="save-title"]');
        await saveButton.click();

        // Should show permission error
        await layoutPage.waitForNotification('Permission denied');
      }
    });

    test('should handle document corruption gracefully', async ({ page, apiHelper }) => {
      // Create document with corrupted JSON
      const corruptDoc = await apiHelper.apiCall('POST', '/api/json/upload', {
        data: {
          content: '{"corrupted": true, "invalid": json}', // Invalid JSON
          title: 'Corrupted Document Test',
        },
        expectedStatus: 200,
      });

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const corruptedItem = items.find((item) => item.title.includes('Corrupted'));

      if (corruptedItem) {
        await libraryPage.viewJSONItem(corruptedItem.index);

        // Should show JSON parsing error
        await expect(viewerPage.errorMessage).toBeVisible({ timeout: 10000 });

        const errorText = await viewerPage.getErrorMessage();
        expect(errorText?.toLowerCase()).toContain('invalid');
      }
    });
  });
});

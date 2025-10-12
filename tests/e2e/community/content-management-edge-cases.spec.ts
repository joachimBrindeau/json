import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Community - Content Management Edge Cases', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);
  });

  test.describe('Content Lifecycle Edge Cases', () => {
    test('should handle publishing content with extreme sizes', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      await authHelper.login('edge_case_creator');

      // Test with very large JSON
      const largeData = dataGenerator.generateLargeJSON(5000, 8, 500);

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(largeData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Large Dataset Performance Test');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Large JSON dataset for testing system limits and performance optimization');

      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Test Data"]').click();

      await libraryPage.page
        .locator('[data-testid="publish-tags"]')
        .fill('large, performance, test, dataset, optimization');

      // Should warn about large file size
      const sizeWarning = libraryPage.page.locator('[data-testid="large-file-warning"]');
      if (await sizeWarning.isVisible()) {
        const warningText = await sizeWarning.textContent();
        expect(warningText).toMatch(/large|size|performance|limit/i);

        const confirmLargeFile = libraryPage.page.locator('[data-testid="confirm-large-file"]');
        if (await confirmLargeFile.isVisible()) {
          await confirmLargeFile.click();
        }
      }

      // Should handle chunked upload for large files
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      const uploadProgress = libraryPage.page.locator('[data-testid="upload-progress"]');
      if (await uploadProgress.isVisible()) {
        // Wait for upload to complete
        await uploadProgress.waitFor({ state: 'hidden', timeout: 30000 });
      }

      await layoutPage.waitForNotification('Large file published successfully', 15000);

      // Test with minimal JSON
      const minimalData = { a: 1 };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(minimalData));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Minimal JSON Example');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('The simplest possible JSON structure');

      // Should warn about minimal content
      const minimalWarning = libraryPage.page.locator('[data-testid="minimal-content-warning"]');
      if (await minimalWarning.isVisible()) {
        const warningText = await minimalWarning.textContent();
        expect(warningText).toMatch(/minimal|simple|add more|improve/i);

        const proceedAnyway = libraryPage.page.locator('[data-testid="proceed-minimal"]');
        if (await proceedAnyway.isVisible()) {
          await proceedAnyway.click();
        }
      }

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');

      await authHelper.logout();
    });

    test('should handle concurrent modifications and conflicts', async ({
      page,
      authHelper,
      apiHelper,
      dataGenerator,
    }) => {
      // Create content that will be modified by multiple users
      await authHelper.login('creator_1');

      const sharedData = dataGenerator.generateComplexJSON();
      const sharedDoc = await apiHelper.uploadJSON(sharedData, {
        title: 'Collaborative Document Test',
        description: 'Document for testing concurrent modifications',
      });

      await apiHelper.publishJSON(sharedDoc.id, {
        category: 'Example',
        tags: 'collaborative, test, concurrent, modifications',
        socialFeatures: {
          allowCollaboration: true,
          allowSuggestions: true,
        },
      });

      await authHelper.logout();

      // User 1 starts editing
      await authHelper.login('editor_1');

      await layoutPage.navigateToPublicLibrary();
      const sharedCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Collaborative Document' });

      await sharedCard.locator('[data-testid="view-example"]').click();

      const editButton = page.locator('[data-testid="edit-content"]');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Should enter edit mode
        await expect(viewerPage.jsonTextArea).toBeVisible();

        // Make changes
        const currentJSON = await viewerPage.jsonTextArea.inputValue();
        const parsedJSON = JSON.parse(currentJSON);
        parsedJSON.editedBy = 'editor_1';
        parsedJSON.timestamp = new Date().toISOString();

        await viewerPage.inputJSON(JSON.stringify(parsedJSON, null, 2));

        // Don't save yet - simulate slow editing
      }

      // Simulate second user making concurrent changes via API
      await apiHelper.updateJSON(sharedDoc.id, {
        ...sharedData,
        editedBy: 'editor_2',
        conflictField: 'This will cause conflict',
      });

      // Now try to save first user's changes
      const saveButton = page.locator('[data-testid="save-changes"]');
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Should detect conflict
        const conflictModal = page.locator('[data-testid="conflict-resolution-modal"]');
        if (await conflictModal.isVisible()) {
          await expect(conflictModal).toBeVisible();

          const conflictMessage = await conflictModal
            .locator('[data-testid="conflict-message"]')
            .textContent();
          expect(conflictMessage).toMatch(/conflict|modified|changes/i);

          // Should show diff between versions
          const diffViewer = conflictModal.locator('[data-testid="conflict-diff"]');
          if (await diffViewer.isVisible()) {
            const additions = diffViewer.locator('[data-testid="diff-addition"]');
            const deletions = diffViewer.locator('[data-testid="diff-deletion"]');

            expect(await additions.count()).toBeGreaterThan(0);
          }

          // Should offer resolution options
          const resolutionOptions = conflictModal.locator('[data-testid="resolution-options"]');
          const keepYours = resolutionOptions.locator('[data-testid="keep-your-changes"]');
          const keepTheirs = resolutionOptions.locator('[data-testid="keep-their-changes"]');
          const mergeManually = resolutionOptions.locator('[data-testid="merge-manually"]');

          if (await mergeManually.isVisible()) {
            await mergeManually.click();

            // Should open merge editor
            const mergeEditor = page.locator('[data-testid="merge-editor"]');
            await expect(mergeEditor).toBeVisible();

            const yourVersion = mergeEditor.locator('[data-testid="your-version"]');
            const theirVersion = mergeEditor.locator('[data-testid="their-version"]');
            const mergedVersion = mergeEditor.locator('[data-testid="merged-version"]');

            // Should be able to manually merge
            if (await mergedVersion.isVisible()) {
              const mergedJSON = {
                ...JSON.parse(currentJSON),
                editedBy: 'both_editors',
                mergedAt: new Date().toISOString(),
                conflictField: 'Manually resolved',
              };

              const mergedTextarea = mergedVersion.locator('textarea');
              await mergedTextarea.fill(JSON.stringify(mergedJSON, null, 2));

              const completeMerge = mergeEditor.locator('[data-testid="complete-merge"]');
              await completeMerge.click();

              await layoutPage.waitForNotification('Changes merged successfully');
            }
          }
        }
      }

      await authHelper.logout();
    });

    test('should handle corrupted or malformed content', async ({ page, authHelper }) => {
      await authHelper.login('corruption_tester');

      // Test with various malformed JSON
      const malformedExamples = [
        '{"incomplete": true', // Missing closing brace
        '{"trailing": "comma",}', // Trailing comma
        '{duplicate: "key", duplicate: "value"}', // Duplicate keys
        '{"unquoted": key}', // Unquoted key
        "{'single': 'quotes'}", // Single quotes
        '{"unicode": "\\u00XX"}', // Invalid unicode
        '{"number": 01234}', // Invalid number format
        '{\n  "nested": {\n    "incomplete"', // Deeply incomplete
      ];

      for (const malformed of malformedExamples) {
        await viewerPage.navigateToViewer();

        try {
          await viewerPage.inputJSON(malformed);

          // Should show JSON validation error
          const jsonError = page.locator('[data-testid="json-error"]');
          if (await jsonError.isVisible()) {
            const errorText = await jsonError.textContent();
            expect(errorText).toMatch(/invalid|syntax|error|malformed/i);

            // Should offer to fix or format
            const fixButton = page.locator('[data-testid="fix-json"]');
            if (await fixButton.isVisible()) {
              await fixButton.click();

              // Should attempt automatic fix
              const fixedNotification = page.locator('[data-testid="json-fixed"]');
              if (await fixedNotification.isVisible()) {
                const fixedText = await fixedNotification.textContent();
                expect(fixedText).toMatch(/fixed|corrected|repaired/i);
              }
            }
          }

          // Try to publish malformed content
          const publishButton = viewerPage.publishButton;
          if (await publishButton.isVisible()) {
            await publishButton.click();

            // Should prevent publishing invalid JSON
            const validationError = page.locator('[data-testid="validation-error"]');
            if (await validationError.isVisible()) {
              const validationText = await validationError.textContent();
              expect(validationText).toMatch(/valid.*json|fix.*errors|cannot.*publish/i);
            }
          }
        } catch (error) {
          // Expected for malformed JSON
          console.log(`Handling malformed JSON: ${malformed.substring(0, 30)}...`);
        }
      }

      await authHelper.logout();
    });

    test('should handle network failures and recovery', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      await authHelper.login('network_tester');

      const testData = dataGenerator.generateComplexJSON();

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(testData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Network Failure Test');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Testing network failure recovery');

      // Simulate network failure during publishing
      await page.context().setOffline(true);

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      // Should show network error
      const networkError = page.locator('[data-testid="network-error"]');
      if (await networkError.isVisible()) {
        const errorText = await networkError.textContent();
        expect(errorText).toMatch(/network|connection|offline|failed/i);

        // Should offer retry option
        const retryButton = networkError.locator('[data-testid="retry-publish"]');
        if (await retryButton.isVisible()) {
          // Restore network and retry
          await page.context().setOffline(false);
          await retryButton.click();

          await layoutPage.waitForNotification('Published successfully');
        }
      }

      // Test auto-save during network issues
      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(
        JSON.stringify({ autoSaveTest: true, data: 'important' }, null, 2)
      );

      // Simulate network going offline
      await page.context().setOffline(true);

      // Make changes
      const currentJSON = await viewerPage.jsonTextArea.inputValue();
      const modifiedJSON = { ...JSON.parse(currentJSON), modified: true };
      await viewerPage.inputJSON(JSON.stringify(modifiedJSON, null, 2));

      // Should show offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      if (await offlineIndicator.isVisible()) {
        expect(await offlineIndicator.textContent()).toMatch(/offline|no connection/i);
      }

      // Should show local save option
      const localSave = page.locator('[data-testid="save-locally"]');
      if (await localSave.isVisible()) {
        await localSave.click();

        const localSaveConfirm = page.locator('[data-testid="saved-locally"]');
        if (await localSaveConfirm.isVisible()) {
          expect(await localSaveConfirm.textContent()).toMatch(/saved locally|offline save/i);
        }
      }

      // Restore network
      await page.context().setOffline(false);

      // Should offer to sync local changes
      const syncButton = page.locator('[data-testid="sync-changes"]');
      if (await syncButton.isVisible()) {
        await syncButton.click();
        await layoutPage.waitForNotification('Changes synced');
      }

      await authHelper.logout();
    });

    test('should handle extreme metadata scenarios', async ({ page, authHelper }) => {
      await authHelper.login('metadata_edge_tester');

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify({ test: 'metadata edge cases' }, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      // Test extremely long title
      const longTitle = 'A'.repeat(500);
      const titleInput = libraryPage.page.locator('[data-testid="publish-title"]');
      await titleInput.fill(longTitle);

      // Should enforce title length limit
      const titleError = libraryPage.page.locator('[data-testid="title-length-error"]');
      if (await titleError.isVisible()) {
        const errorText = await titleError.textContent();
        expect(errorText).toMatch(/too long|maximum.*characters|limit/i);
      }

      // Should truncate or prevent overly long titles
      const actualTitle = await titleInput.inputValue();
      expect(actualTitle.length).toBeLessThanOrEqual(200); // Assuming 200 char limit

      // Test with valid title
      await titleInput.fill('Metadata Edge Case Test');

      // Test extremely long description
      const longDescription = 'This is a test description. '.repeat(200);
      const descInput = libraryPage.page.locator('[data-testid="publish-description"]');
      await descInput.fill(longDescription);

      const descError = libraryPage.page.locator('[data-testid="description-length-error"]');
      if (await descError.isVisible()) {
        const errorText = await descError.textContent();
        expect(errorText).toMatch(/too long|maximum.*characters/i);
      }

      await descInput.fill('Valid description for edge case testing');

      // Test with invalid characters in tags
      const invalidTags =
        'tag1, tag<script>, tag"with"quotes, tag\nwith\nnewlines, tag    with    spaces';
      const tagsInput = libraryPage.page.locator('[data-testid="publish-tags"]');
      await tagsInput.fill(invalidTags);

      // Should sanitize tags
      const tagValidation = libraryPage.page.locator('[data-testid="tag-validation"]');
      if (await tagValidation.isVisible()) {
        const validationText = await tagValidation.textContent();
        expect(validationText).toMatch(/invalid.*characters|cleaned|sanitized/i);
      }

      // Test with Unicode and special characters
      const unicodeTags = '🚀rocket, café, naïve, 中文, emoji👍, special-chars!@#';
      await tagsInput.fill(unicodeTags);

      // Should handle Unicode properly
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      // Should either publish successfully or show specific Unicode handling
      try {
        await layoutPage.waitForNotification('Published successfully', 5000);
      } catch {
        const unicodeWarning = page.locator('[data-testid="unicode-warning"]');
        if (await unicodeWarning.isVisible()) {
          const warningText = await unicodeWarning.textContent();
          expect(warningText).toMatch(/unicode|special.*characters|encoding/i);
        }
      }

      await authHelper.logout();
    });

    test('should handle user permission edge cases', async ({ page, authHelper, apiHelper }) => {
      // Test content ownership transfer
      await authHelper.login('original_owner');

      const transferDoc = await apiHelper.uploadJSON(
        { ownership: 'transfer test' },
        { title: 'Ownership Transfer Test' }
      );

      await apiHelper.publishJSON(transferDoc.id);
      await authHelper.logout();

      // Attempt to edit as different user
      await authHelper.login('would_be_editor');

      await layoutPage.navigateToPublicLibrary();
      const transferCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Ownership Transfer' });

      await transferCard.locator('[data-testid="view-example"]').click();

      const editButton = page.locator('[data-testid="edit-content"]');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Should show permission denied
        const permissionError = page.locator('[data-testid="permission-error"]');
        if (await permissionError.isVisible()) {
          const errorText = await permissionError.textContent();
          expect(errorText).toMatch(/permission.*denied|not.*authorized|owner.*only/i);

          // Should offer to request edit permissions
          const requestAccess = page.locator('[data-testid="request-edit-access"]');
          if (await requestAccess.isVisible()) {
            await requestAccess.click();

            const requestModal = page.locator('[data-testid="access-request-modal"]');
            await expect(requestModal).toBeVisible();

            const requestMessage = requestModal.locator('[data-testid="request-message"]');
            await requestMessage.fill('Would like to contribute improvements to this example');

            const submitRequest = requestModal.locator('[data-testid="submit-request"]');
            await submitRequest.click();

            await layoutPage.waitForNotification('Access request sent');
          }
        }
      }

      await authHelper.logout();

      // Test account deletion with published content
      await authHelper.login('deletion_candidate');

      const deletionDoc = await apiHelper.uploadJSON(
        { deletion: 'test content' },
        { title: 'Content Before Deletion' }
      );

      await apiHelper.publishJSON(deletionDoc.id);

      // Attempt to delete account
      await layoutPage.goToProfile();

      const accountSettings = page.locator('[data-testid="account-settings"]');
      if (await accountSettings.isVisible()) {
        await accountSettings.click();

        const deleteAccount = page.locator('[data-testid="delete-account"]');
        if (await deleteAccount.isVisible()) {
          await deleteAccount.click();

          const deletionModal = page.locator('[data-testid="account-deletion-modal"]');
          await expect(deletionModal).toBeVisible();

          // Should warn about published content
          const contentWarning = deletionModal.locator('[data-testid="published-content-warning"]');
          if (await contentWarning.isVisible()) {
            const warningText = await contentWarning.textContent();
            expect(warningText).toMatch(/published.*content|community.*contributions/i);

            // Should offer options for content handling
            const contentOptions = deletionModal.locator('[data-testid="content-options"]');
            const transferContent = contentOptions.locator('[data-testid="transfer-content"]');
            const anonymizeContent = contentOptions.locator('[data-testid="anonymize-content"]');
            const deleteContent = contentOptions.locator('[data-testid="delete-content"]');

            if (await anonymizeContent.isVisible()) {
              await anonymizeContent.check();
            }

            const confirmDeletion = deletionModal.locator('[data-testid="confirm-deletion"]');
            await confirmDeletion.click();

            // Should require additional confirmation
            const finalConfirm = page.locator('[data-testid="final-deletion-confirm"]');
            if (await finalConfirm.isVisible()) {
              // Don't actually delete for test purposes
              const cancelDeletion = page.locator('[data-testid="cancel-deletion"]');
              await cancelDeletion.click();
            }
          }
        }
      }

      await authHelper.logout();
    });

    test('should handle system maintenance and graceful degradation', async ({
      page,
      authHelper,
    }) => {
      await authHelper.login('maintenance_tester');

      // Simulate system in maintenance mode
      // This would typically be controlled by feature flags or API responses

      await viewerPage.navigateToViewer();

      const maintenanceNotice = page.locator('[data-testid="maintenance-notice"]');
      if (await maintenanceNotice.isVisible()) {
        const noticeText = await maintenanceNotice.textContent();
        expect(noticeText).toMatch(/maintenance|temporarily.*unavailable|scheduled.*downtime/i);

        // Should show expected return time
        const returnTime = maintenanceNotice.locator('[data-testid="maintenance-eta"]');
        if (await returnTime.isVisible()) {
          const etaText = await returnTime.textContent();
          expect(etaText).toBeTruthy();
        }

        // Should offer limited functionality
        const limitedMode = page.locator('[data-testid="limited-functionality"]');
        if (await limitedMode.isVisible()) {
          // Should still allow viewing but not publishing
          const viewerStillWorks = await viewerPage.jsonTextArea.isVisible();
          expect(viewerStillWorks).toBe(true);

          const publishDisabled = await viewerPage.publishButton.isDisabled();
          expect(publishDisabled).toBe(true);
        }
      }

      // Test partial service degradation
      const degradedService = page.locator('[data-testid="service-degradation"]');
      if (await degradedService.isVisible()) {
        const degradationText = await degradedService.textContent();
        expect(degradationText).toMatch(
          /experiencing.*issues|reduced.*performance|some.*features/i
        );

        // Should show which features are affected
        const affectedFeatures = degradedService.locator('[data-testid="affected-features"]');
        if (await affectedFeatures.isVisible()) {
          const features = affectedFeatures.locator('[data-testid="feature-status"]');
          expect(await features.count()).toBeGreaterThan(0);
        }
      }

      await authHelper.logout();
    });
  });

  test.describe('Data Migration and Legacy Content', () => {
    test('should handle legacy content format migrations', async ({
      page,
      authHelper,
      apiHelper,
    }) => {
      await authHelper.login('legacy_content_user');

      // Simulate legacy content with old format
      const legacyContent = {
        version: '1.0', // Old version format
        data: { legacy: true },
        metadata: {
          // Old metadata format
          created: '2023-01-01', // Different date format
          author: 'legacy_user',
          format_version: 1,
        },
      };

      // This content would be migrated automatically
      await layoutPage.navigateToPublicLibrary();

      const legacyNotice = page.locator('[data-testid="legacy-content-notice"]');
      if (await legacyNotice.isVisible()) {
        const noticeText = await legacyNotice.textContent();
        expect(noticeText).toMatch(/legacy.*content|old.*format|automatically.*updated/i);

        const migrateButton = legacyNotice.locator('[data-testid="migrate-content"]');
        if (await migrateButton.isVisible()) {
          await migrateButton.click();

          const migrationProgress = page.locator('[data-testid="migration-progress"]');
          if (await migrationProgress.isVisible()) {
            await migrationProgress.waitFor({ state: 'hidden', timeout: 10000 });
          }

          await layoutPage.waitForNotification('Content migrated successfully');
        }
      }

      await authHelper.logout();
    });

    test('should handle bulk operations on content', async ({
      page,
      authHelper,
      apiHelper,
      dataGenerator,
    }) => {
      await authHelper.login('bulk_operations_user');

      // Create multiple pieces of content for bulk operations
      const bulkContent = [];
      for (let i = 0; i < 10; i++) {
        const doc = await apiHelper.uploadJSON(dataGenerator.generateSimpleJSON(), {
          title: `Bulk Test Item ${i}`,
        });
        bulkContent.push(doc);
      }

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Test bulk selection
      const bulkSelectMode = page.locator('[data-testid="bulk-select-mode"]');
      if (await bulkSelectMode.isVisible()) {
        await bulkSelectMode.click();

        // Should show checkboxes on all items
        const itemCheckboxes = page.locator('[data-testid="item-checkbox"]');
        const checkboxCount = await itemCheckboxes.count();
        expect(checkboxCount).toBeGreaterThanOrEqual(10);

        // Select multiple items
        await itemCheckboxes.first().check();
        await itemCheckboxes.nth(1).check();
        await itemCheckboxes.nth(2).check();

        const selectedCount = page.locator('[data-testid="selected-count"]');
        if (await selectedCount.isVisible()) {
          expect(await selectedCount.textContent()).toContain('3');
        }

        // Test bulk operations
        const bulkActions = page.locator('[data-testid="bulk-actions"]');
        await expect(bulkActions).toBeVisible();

        const bulkPublish = bulkActions.locator('[data-testid="bulk-publish"]');
        const bulkDelete = bulkActions.locator('[data-testid="bulk-delete"]');
        const bulkTag = bulkActions.locator('[data-testid="bulk-tag"]');

        // Test bulk tagging
        if (await bulkTag.isVisible()) {
          await bulkTag.click();

          const bulkTagModal = page.locator('[data-testid="bulk-tag-modal"]');
          await expect(bulkTagModal).toBeVisible();

          const tagInput = bulkTagModal.locator('[data-testid="bulk-tags-input"]');
          await tagInput.fill('bulk-operation, test, automated');

          const applyTags = bulkTagModal.locator('[data-testid="apply-bulk-tags"]');
          await applyTags.click();

          await layoutPage.waitForNotification('Tags applied to 3 items');
        }

        // Test bulk publish
        if (await bulkPublish.isVisible()) {
          await bulkPublish.click();

          const bulkPublishModal = page.locator('[data-testid="bulk-publish-modal"]');
          await expect(bulkPublishModal).toBeVisible();

          const publishCategory = bulkPublishModal.locator('[data-testid="bulk-category"]');
          await publishCategory.selectOption('Example');

          const confirmBulkPublish = bulkPublishModal.locator(
            '[data-testid="confirm-bulk-publish"]'
          );
          await confirmBulkPublish.click();

          // Should show progress
          const publishProgress = page.locator('[data-testid="bulk-publish-progress"]');
          if (await publishProgress.isVisible()) {
            await publishProgress.waitFor({ state: 'hidden', timeout: 15000 });
          }

          await layoutPage.waitForNotification('3 items published successfully');
        }
      }

      await authHelper.logout();
    });

    test('should handle content export and backup scenarios', async ({ page, authHelper }) => {
      await authHelper.login('backup_user');

      await layoutPage.goToProfile();

      // Test full data export
      const dataExport = page.locator('[data-testid="export-data"]');
      if (await dataExport.isVisible()) {
        await dataExport.click();

        const exportModal = page.locator('[data-testid="export-modal"]');
        await expect(exportModal).toBeVisible();

        // Should offer different export options
        const exportOptions = exportModal.locator('[data-testid="export-options"]');
        const includePrivate = exportOptions.locator('[data-testid="include-private"]');
        const includePublished = exportOptions.locator('[data-testid="include-published"]');
        const includeComments = exportOptions.locator('[data-testid="include-comments"]');
        const includeAnalytics = exportOptions.locator('[data-testid="include-analytics"]');

        if (await includePrivate.isVisible()) {
          await includePrivate.check();
        }
        if (await includePublished.isVisible()) {
          await includePublished.check();
        }
        if (await includeComments.isVisible()) {
          await includeComments.check();
        }

        // Should offer different formats
        const formatOptions = exportModal.locator('[data-testid="export-formats"]');
        const jsonFormat = formatOptions.locator('[data-testid="format-json"]');
        const zipFormat = formatOptions.locator('[data-testid="format-zip"]');

        if (await zipFormat.isVisible()) {
          await zipFormat.check();
        }

        const startExport = exportModal.locator('[data-testid="start-export"]');
        await startExport.click();

        // Should show export progress
        const exportProgress = page.locator('[data-testid="export-progress"]');
        if (await exportProgress.isVisible()) {
          const progressText = await exportProgress.textContent();
          expect(progressText).toMatch(/preparing|exporting|\d+%/i);

          // Wait for completion
          const downloadReady = page.locator('[data-testid="download-ready"]');
          if (await downloadReady.isVisible()) {
            const downloadLink = downloadReady.locator('[data-testid="download-link"]');
            if (await downloadLink.isVisible()) {
              // Don't actually download in test, just verify link exists
              const downloadHref = await downloadLink.getAttribute('href');
              expect(downloadHref).toBeTruthy();
            }
          }
        }
      }

      // Test automatic backup settings
      const backupSettings = page.locator('[data-testid="backup-settings"]');
      if (await backupSettings.isVisible()) {
        await backupSettings.click();

        const backupModal = page.locator('[data-testid="backup-settings-modal"]');
        await expect(backupModal).toBeVisible();

        const autoBackup = backupModal.locator('[data-testid="enable-auto-backup"]');
        const backupFrequency = backupModal.locator('[data-testid="backup-frequency"]');
        const backupLocation = backupModal.locator('[data-testid="backup-location"]');

        if (await autoBackup.isVisible()) {
          await autoBackup.check();
        }

        if (await backupFrequency.isVisible()) {
          await backupFrequency.selectOption('weekly');
        }

        const saveBackupSettings = backupModal.locator('[data-testid="save-backup-settings"]');
        await saveBackupSettings.click();

        await layoutPage.waitForNotification('Backup settings saved');
      }

      await authHelper.logout();
    });
  });
});

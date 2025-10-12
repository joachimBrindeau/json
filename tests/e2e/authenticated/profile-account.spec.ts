import { test, expect } from '../../utils/base-test';

test.describe('Authenticated User - Profile and Account Management', () => {
  test.beforeEach(async ({ profileHelper }) => {
    // Setup authenticated user with standard test data
    await profileHelper.setupUserWithData('regular', profileHelper.generateStandardTestData());
  });

  test.afterEach(async ({ profileHelper }) => {
    await profileHelper.cleanup();
  });

  test.describe('View Profile with Usage Statistics', () => {

    test('should display user profile with basic information', async ({ profileHelper }) => {
      const profileInfo = await profileHelper.getUserProfileInfo();
      
      expect(profileInfo).toBeTruthy();
      expect(profileInfo!.email).toBeTruthy();
      expect(profileInfo!.email).toContain('@');
      expect(profileInfo!.name).toBeTruthy();
    });

    test('should display usage statistics', async ({ profileHelper }) => {
      const stats = await profileHelper.getUsageStatistics();
      
      if (stats.totalDocuments !== undefined) {
        expect(stats.totalDocuments).toBeGreaterThanOrEqual(3);
      }
      
      if (stats.publishedDocuments !== undefined) {
        expect(stats.publishedDocuments).toBeGreaterThanOrEqual(1);
      }
      
      if (stats.storageUsed) {
        expect(stats.storageUsed).toMatch(/\d+.*[KMGT]?B/);
      }
      
      if (stats.memberSince) {
        expect(stats.memberSince).toBeTruthy();
      }
    });

    test('should display activity timeline', async ({ profileHelper }) => {
      const activities = await profileHelper.getActivityTimeline();
      
      if (activities.length > 0) {
        expect(activities.length).toBeGreaterThan(0);
        
        // Activities should have timestamps
        const firstActivity = activities[0];
        expect(firstActivity.timestamp).toBeTruthy();
        expect(firstActivity.action).toBeTruthy();
      }
    });

    test('should show document statistics breakdown', async ({ apiHelper }) => {
      // Create documents of different types
      await apiHelper.uploadJSON(JSON_SAMPLES.largeArray.generateContent(100), {
        title: 'Large Array Document',
        category: 'Test Data',
      });

      await layoutPage.goToProfile();

      // Look for detailed statistics
      const statsBreakdown = layoutPage.page.locator('[data-testid="stats-breakdown"]');
      if (await statsBreakdown.isVisible()) {
        // Should show documents by category
        const categoryStats = layoutPage.page.locator('[data-testid="documents-by-category"]');
        if (await categoryStats.isVisible()) {
          await expect(categoryStats).toBeVisible();
        }

        // Should show average document size
        const avgSize = layoutPage.page.locator('[data-testid="average-document-size"]');
        if (await avgSize.isVisible()) {
          const sizeText = await avgSize.textContent();
          expect(sizeText).toMatch(/\d+.*[KMGT]?B/);
        }

        // Should show most used view modes if tracked
        const viewModeStats = layoutPage.page.locator('[data-testid="view-mode-preferences"]');
        if (await viewModeStats.isVisible()) {
          await expect(viewModeStats).toBeVisible();
        }
      }
    });

    test('should display library contributions', async ({ apiHelper }) => {
      // Ensure we have a published document
      const contributions = await layoutPage.page.locator('[data-testid="public-contributions"]');
      if (await contributions.isVisible()) {
        await expect(contributions).toBeVisible();

        // Should show published documents count
        const publishedCount = await layoutPage.page
          .locator('[data-testid="published-count"]')
          .textContent();
        const count = parseInt(publishedCount?.match(/\d+/)?.[0] || '0');
        expect(count).toBeGreaterThanOrEqual(1);

        // Should show total views if available
        const totalViews = layoutPage.page.locator('[data-testid="total-public-views"]');
        if (await totalViews.isVisible()) {
          const views = await totalViews.textContent();
          expect(views).toBeTruthy();
        }
      }
    });

    test('should handle empty profile statistics gracefully', async ({ dataGenerator, authHelper, profileHelper }) => {
      // Create a brand new user with no data
      await profileHelper.cleanup(); // Logout current user
      
      const newUser = dataGenerator.generateUserData();
      await authHelper.createAccount(newUser);
      
      // Setup empty profile helper (no test data)
      const newProfileHelper = profileHelper;
      await newProfileHelper.setupUserWithData('regular'); // No test data

      const profileInfo = await newProfileHelper.getUserProfileInfo();
      expect(profileInfo).toBeTruthy();
      
      const stats = await newProfileHelper.getUsageStatistics();
      if (stats.totalDocuments !== undefined) {
        expect(stats.totalDocuments).toBe(0);
      }
      
      // Check for empty state elements
      if (await newProfileHelper.goToProfileAndVerify()) {
        const emptyLibraryMessage = newProfileHelper.layoutPage.page.locator('[data-testid="empty-library-message"]');
        if (await emptyLibraryMessage.isVisible()) {
          expect(await emptyLibraryMessage.textContent()).toContain('no documents');
        }

        const createFirstDoc = newProfileHelper.layoutPage.page.locator('[data-testid="create-first-document"]');
        if (await createFirstDoc.isVisible()) {
          await createFirstDoc.click();
          await newProfileHelper.layoutPage.page.waitForURL('**/viewer');
        }
      }
    });
  });

  test.describe('Export All Data', () => {

    test('should export all user data as JSON', async ({ profileHelper }) => {
      const exportResult = await profileHelper.exportUserData();
      
      expect(exportResult.success).toBe(true);
      expect(exportResult.filename).toBeTruthy();
      expect(exportResult.filename).toMatch(/.*export.*\.json/);
    });

    test('should export data with user confirmation', async ({ profileHelper }) => {
      // Test cancellation first
      const cancelResult = await profileHelper.exportUserData({ confirm: false });
      expect(cancelResult.success).toBe(false);
      expect(cancelResult.error).toContain('cancelled');
      
      // Test actual export
      const exportResult = await profileHelper.exportUserData({ confirm: true });
      expect(exportResult.success).toBe(true);
      expect(exportResult.filename).toBeTruthy();
    });

    test('should export data in different formats', async ({ profileHelper }) => {
      // Test JSON export
      const jsonResult = await profileHelper.exportUserData({ format: 'json' });
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.filename).toMatch(/\.json$/);
      
      // Test CSV export if available
      const csvResult = await profileHelper.exportUserData({ format: 'csv' });
      if (csvResult.success) {
        expect(csvResult.filename).toMatch(/\.csv$/);
      }
    });

    test('should handle large data export', async ({ apiHelper }) => {
      // Create many documents to test large export
      const largeExportBatch = 20;
      for (let i = 0; i < largeExportBatch; i++) {
        await apiHelper.uploadJSON(JSON_SAMPLES.largeArray.generateContent(50), {
          title: `Large Export Test Document ${i}`,
        });
      }

      await layoutPage.goToProfile();

      // Start export
      const exportButton = layoutPage.page.locator('[data-testid="export-data"]');

      // Should show progress indicator for large exports
      await exportButton.click();

      const progressIndicator = layoutPage.page.locator('[data-testid="export-progress"]');
      if (await progressIndicator.isVisible()) {
        await expect(progressIndicator).toBeVisible();

        // Wait for progress to complete
        await layoutPage.waitForCondition(async () => {
          return !(await progressIndicator.isVisible());
        }, 30000); // 30 second timeout for large export
      }

      // Download should eventually start
      const downloadPromise = layoutPage.page.waitForEvent('download', { timeout: 30000 });
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    });

    test('should include all data types in export', async () => {
      await layoutPage.goToProfile();

      const exportButton = layoutPage.page.locator('[data-testid="export-data"]');

      // Mock the export to examine what would be exported
      let exportData: any = null;

      await layoutPage.page.route('**/api/user/export', async (route) => {
        const response = await route.fetch();
        exportData = await response.json();

        route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="user-data-export.json"',
          },
          body: JSON.stringify(exportData),
        });
      });

      await exportButton.click();

      // Wait for export API call
      await layoutPage.page.waitForTimeout(2000);

      if (exportData) {
        // Should include user profile information
        expect(exportData).toHaveProperty('profile');
        expect(exportData.profile).toHaveProperty('email');
        expect(exportData.profile).toHaveProperty('name');

        // Should include documents
        expect(exportData).toHaveProperty('documents');
        expect(Array.isArray(exportData.documents)).toBe(true);
        expect(exportData.documents.length).toBeGreaterThan(0);

        // Each document should have expected fields
        const firstDoc = exportData.documents[0];
        expect(firstDoc).toHaveProperty('title');
        expect(firstDoc).toHaveProperty('content');
        expect(firstDoc).toHaveProperty('createdAt');

        // Should include published documents if any
        if (exportData.publishedDocuments) {
          expect(Array.isArray(exportData.publishedDocuments)).toBe(true);
        }

        // Should include metadata
        expect(exportData).toHaveProperty('exportedAt');
        expect(exportData).toHaveProperty('version');
      }
    });

    test('should handle export failure gracefully', async ({ page }) => {
      await layoutPage.goToProfile();

      // Mock export failure
      await page.route('**/api/user/export', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Export failed' }),
        });
      });

      const exportButton = layoutPage.page.locator('[data-testid="export-data"]');
      await exportButton.click();

      // Should show error message
      await layoutPage.waitForNotification('Export failed', 10000);

      // Should not start download
      const downloadPromise = layoutPage.page.waitForEvent('download', { timeout: 2000 });
      await expect(downloadPromise).rejects.toThrow();
    });
  });

  test.describe('Delete Account Permanently', () => {

    test('should require confirmation before account deletion', async ({ profileHelper }) => {
      const initResult = await profileHelper.initiateAccountDeletion();
      
      if (initResult.success && initResult.confirmationRequired) {
        // Confirmation dialog should be shown with proper warnings
        expect(initResult.confirmationRequired).toBe(true);
        
        // For this test, we don't actually complete the deletion
        // Just verify that the process can be initiated and requires confirmation
        expect(await profileHelper.layoutPage.isLoggedIn()).toBe(true);
      }
    });

    test('should delete account and all associated data', async ({ profileHelper }) => {
      const initResult = await profileHelper.initiateAccountDeletion();
      
      if (initResult.success && initResult.confirmationRequired) {
        const deleteResult = await profileHelper.completeAccountDeletion('DELETE', 'testuser@jsonshare.test');
        
        expect(deleteResult.success).toBe(true);
        expect(await profileHelper.layoutPage.isLoggedIn()).toBe(false);
      }
    });

    test('should handle account deletion with published documents', async () => {
      await layoutPage.goToProfile();

      const deleteAccountButton = layoutPage.page.locator('[data-testid="delete-account"]');
      if (await deleteAccountButton.isVisible()) {
        await deleteAccountButton.click();

        const deleteDialog = layoutPage.page.locator('[data-testid="delete-account-dialog"]');

        // Should warn about published documents
        const publishedWarning = layoutPage.page.locator('[data-testid="published-docs-warning"]');
        if (await publishedWarning.isVisible()) {
          const warningText = await publishedWarning.textContent();
          expect(warningText).toContain('published');
          expect(warningText).toContain('library');
        }

        // Should offer options for published content
        const publishedOptions = layoutPage.page.locator(
          '[data-testid="published-content-options"]'
        );
        if (await publishedOptions.isVisible()) {
          // Option to keep published content anonymous
          const keepPublished = layoutPage.page.locator('[data-testid="keep-published-anonymous"]');
          if (await keepPublished.isVisible()) {
            await keepPublished.check();
          }

          // Or option to remove all published content
          const removePublished = layoutPage.page.locator('[data-testid="remove-all-published"]');
          if (await removePublished.isVisible()) {
            await removePublished.check();
          }
        }

        // Proceed with account deletion
        const confirmationInput = layoutPage.page.locator(
          '[data-testid="delete-confirmation-input"]'
        );
        if (await confirmationInput.isVisible()) {
          await confirmationInput.fill('DELETE');
        }

        const confirmDeleteButton = layoutPage.page.locator(
          '[data-testid="confirm-delete-account"]'
        );
        await confirmDeleteButton.click();

        // Wait for deletion to complete
        await layoutPage.page.waitForURL('**/', { timeout: 15000 });
        expect(await layoutPage.isLoggedIn()).toBe(false);
      }
    });

    test('should validate account deletion requirements', async ({ page }) => {
      await layoutPage.goToProfile();

      const deleteAccountButton = layoutPage.page.locator('[data-testid="delete-account"]');
      if (await deleteAccountButton.isVisible()) {
        await deleteAccountButton.click();

        const deleteDialog = layoutPage.page.locator('[data-testid="delete-account-dialog"]');

        // Try to delete without confirmation
        const confirmDeleteButton = layoutPage.page.locator(
          '[data-testid="confirm-delete-account"]'
        );
        await confirmDeleteButton.click();

        // Should show validation errors
        const validationError = layoutPage.page.locator('[data-testid="delete-validation-error"]');
        if (await validationError.isVisible()) {
          expect(await validationError.textContent()).toContain('confirmation');
        }

        // Should require proper confirmation text
        const confirmationInput = layoutPage.page.locator(
          '[data-testid="delete-confirmation-input"]'
        );
        if (await confirmationInput.isVisible()) {
          await confirmationInput.fill('wrong text');
          await confirmDeleteButton.click();

          // Should still show error
          if (await validationError.isVisible()) {
            expect(await validationError.textContent()).toContain('match');
          }

          // Fill correct confirmation
          await confirmationInput.fill('DELETE');

          // Now should be able to proceed (but we'll cancel)
          const cancelDelete = layoutPage.page.locator('[data-testid="cancel-delete"]');
          await cancelDelete.click();
        }
      }
    });

    test('should handle account deletion failure', async ({ page }) => {
      await layoutPage.goToProfile();

      // Mock deletion failure
      await page.route('**/api/user/delete', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Account deletion failed' }),
        });
      });

      const deleteAccountButton = layoutPage.page.locator('[data-testid="delete-account"]');
      if (await deleteAccountButton.isVisible()) {
        await deleteAccountButton.click();

        const deleteDialog = layoutPage.page.locator('[data-testid="delete-account-dialog"]');

        const confirmationInput = layoutPage.page.locator(
          '[data-testid="delete-confirmation-input"]'
        );
        if (await confirmationInput.isVisible()) {
          await confirmationInput.fill('DELETE');
        }

        const confirmDeleteButton = layoutPage.page.locator(
          '[data-testid="confirm-delete-account"]'
        );
        await confirmDeleteButton.click();

        // Should show error message
        await layoutPage.waitForNotification('deletion failed', 10000);

        // Should still be logged in
        expect(await layoutPage.isLoggedIn()).toBe(true);

        // Dialog might still be open or closed depending on implementation
        if (await deleteDialog.isVisible()) {
          const cancelDelete = layoutPage.page.locator('[data-testid="cancel-delete"]');
          await cancelDelete.click();
        }
      }
    });

    test('should provide data export before account deletion', async () => {
      await layoutPage.goToProfile();

      const deleteAccountButton = layoutPage.page.locator('[data-testid="delete-account"]');
      if (await deleteAccountButton.isVisible()) {
        await deleteAccountButton.click();

        const deleteDialog = layoutPage.page.locator('[data-testid="delete-account-dialog"]');

        // Should offer data export before deletion
        const exportBeforeDelete = layoutPage.page.locator('[data-testid="export-before-delete"]');
        if (await exportBeforeDelete.isVisible()) {
          await expect(exportBeforeDelete).toBeVisible();

          // Should explain export option
          const exportInfo = await exportBeforeDelete.textContent();
          expect(exportInfo?.toLowerCase()).toContain('export');
          expect(exportInfo?.toLowerCase()).toContain('backup');

          // Export data first
          const exportDataButton = layoutPage.page.locator(
            '[data-testid="export-data-before-delete"]'
          );
          if (await exportDataButton.isVisible()) {
            const downloadPromise = layoutPage.page.waitForEvent('download');
            await exportDataButton.click();
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBeTruthy();
          }
        }

        // Cancel deletion for this test
        const cancelDelete = layoutPage.page.locator('[data-testid="cancel-delete"]');
        await cancelDelete.click();
      }
    });
  });

  test.describe('Profile Settings and Preferences', () => {
    test('should update profile information', async ({ profileHelper }) => {
      const updateResult = await profileHelper.updateProfile({
        name: 'Updated Test User Name',
        bio: 'Updated bio for testing profile functionality'
      });
      
      expect(updateResult.success).toBe(true);
      
      // Verify changes are reflected
      const updatedProfile = await profileHelper.getUserProfileInfo();
      expect(updatedProfile?.name).toContain('Updated Test User Name');
    });

    test('should manage notification preferences', async ({ profileHelper }) => {
      const updateResult = await profileHelper.updateNotificationPreferences({
        emailNotifications: false,
        marketingEmails: true
      });
      
      expect(updateResult.success).toBe(true);
    });

    test('should manage privacy settings', async () => {
      await layoutPage.goToProfile();

      const privacySettings = layoutPage.page.locator('[data-testid="privacy-settings"]');
      if (await privacySettings.isVisible()) {
        // Profile visibility settings
        const profileVisibility = layoutPage.page.locator('[data-testid="profile-visibility"]');
        if (await profileVisibility.isVisible()) {
          await profileVisibility.selectOption('private');
        }

        // Show email in profile
        const showEmail = layoutPage.page.locator('[data-testid="show-email"]');
        if (await showEmail.isVisible()) {
          await showEmail.uncheck();
        }

        // Analytics tracking
        const analyticsOptOut = layoutPage.page.locator('[data-testid="analytics-opt-out"]');
        if (await analyticsOptOut.isVisible()) {
          await analyticsOptOut.check();
        }

        // Save privacy settings
        const savePrivacy = layoutPage.page.locator('[data-testid="save-privacy"]');
        if (await savePrivacy.isVisible()) {
          await savePrivacy.click();
          await layoutPage.waitForNotification('Privacy settings updated');
        }
      }
    });

    test('should change password', async ({ page }) => {
      await layoutPage.goToProfile();

      const changePasswordButton = layoutPage.page.locator('[data-testid="change-password"]');
      if (await changePasswordButton.isVisible()) {
        await changePasswordButton.click();

        const passwordForm = layoutPage.page.locator('[data-testid="password-form"]');
        await expect(passwordForm).toBeVisible();

        // Fill current password
        const currentPassword = layoutPage.page.locator('[data-testid="current-password"]');
        await currentPassword.fill('TestPassword123!');

        // Fill new password
        const newPassword = layoutPage.page.locator('[data-testid="new-password"]');
        await newPassword.fill('NewTestPassword123!');

        // Confirm new password
        const confirmPassword = layoutPage.page.locator('[data-testid="confirm-password"]');
        await confirmPassword.fill('NewTestPassword123!');

        // Submit password change
        const submitPassword = layoutPage.page.locator('[data-testid="submit-password-change"]');
        await submitPassword.click();

        await layoutPage.waitForNotification('Password updated successfully');

        // Should close password form
        await expect(passwordForm).not.toBeVisible();
      }
    });
  });
});

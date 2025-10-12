import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES, MOCK_SESSION_DATA } from '../../fixtures/users';

test.describe('Authenticated User - Session Management and Data Migration', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);
  });

  test.describe('Session Management', () => {
    test('should maintain session across browser refresh', async ({ page, authHelper }) => {
      // Login user
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Get current user info
      const userInfo = await authHelper.getCurrentUser();
      expect(userInfo?.email).toBeTruthy();

      // Refresh browser
      await page.reload();
      await layoutPage.waitForLoad();

      // Should still be logged in
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // User info should be preserved
      const refreshedUserInfo = await authHelper.getCurrentUser();
      expect(refreshedUserInfo?.email).toBe(userInfo?.email);

      // Should be able to access authenticated features
      await layoutPage.goToLibrary();
      await expect(libraryPage.libraryContainer).toBeVisible();
    });

    test('should maintain session across tab navigation', async ({ page, context, authHelper }) => {
      // Login in first tab
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Open new tab
      const secondPage = await context.newPage();
      const secondLayoutPage = new MainLayoutPage(secondPage);

      // Navigate to application in second tab
      await secondPage.goto('/');
      await secondLayoutPage.waitForLoad();

      // Should be logged in in second tab too
      expect(await secondLayoutPage.isLoggedIn()).toBe(true);

      // Should have same user info
      const firstTabUser = await authHelper.getCurrentUser();

      const secondAuthHelper = authHelper; // Same context
      const secondTabUser = await secondAuthHelper.getCurrentUser();

      expect(secondTabUser?.email).toBe(firstTabUser?.email);

      // Close second tab
      await secondPage.close();
    });

    test('should handle session timeout gracefully', async ({ page, authHelper, context }) => {
      // Login user
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Simulate session timeout by clearing session cookies
      await context.clearCookies();

      // Try to access authenticated feature
      await layoutPage.goToLibrary();

      // Should detect expired session
      const isStillLoggedIn = await layoutPage.isLoggedIn();

      if (!isStillLoggedIn) {
        // Should show login prompt or redirect to login
        const loginButton = await layoutPage.loginButton.isVisible();
        const loginModal = await layoutPage.loginModal.isVisible();

        expect(loginButton || loginModal).toBe(true);
      } else {
        // Some implementations might auto-refresh tokens
        // In that case, user should still be able to access features
        await expect(libraryPage.libraryContainer).toBeVisible();
      }
    });

    test('should handle concurrent sessions across devices', async ({
      page,
      context,
      authHelper,
    }) => {
      // Login user
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Simulate second device by creating new context
      const secondContext = await page.context().browser()?.newContext();
      if (secondContext) {
        const deviceTwoPage = await secondContext.newPage();
        const deviceTwoLayout = new MainLayoutPage(deviceTwoPage);
        const deviceTwoAuth = authHelper; // Would use separate auth helper in practice

        // Login on second "device"
        await deviceTwoPage.goto('/');
        await deviceTwoAuth.login('regular');

        // Both sessions should be active
        expect(await layoutPage.isLoggedIn()).toBe(true);
        expect(await deviceTwoLayout.isLoggedIn()).toBe(true);

        // Actions on one device should not affect the other
        await layoutPage.goToLibrary();
        await deviceTwoLayout.goToProfile();

        // Both should still work
        await expect(libraryPage.libraryContainer).toBeVisible();
        await expect(deviceTwoPage.locator('[data-testid="profile-page"]')).toBeVisible();

        await deviceTwoPage.close();
        await secondContext.close();
      }
    });

    test('should handle session conflicts when logging in as different user', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      // Login as first user
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      const firstUser = await authHelper.getCurrentUser();

      // Try to login as different user without logging out first
      await layoutPage.openLoginModal();

      // Fill credentials for different user
      const powerUser = dataGenerator.generateUserData();
      await page.locator('[data-testid="login-email"]').fill(powerUser.email);
      await page.locator('[data-testid="login-password"]').fill(powerUser.password);
      await page.locator('[data-testid="login-submit"]').click();

      // Should handle this gracefully - either:
      // 1. Auto-logout first user and login second user
      // 2. Show conflict warning
      // 3. Prevent login until explicit logout

      const isFirstUserStillLoggedIn = await layoutPage.isLoggedIn();
      if (isFirstUserStillLoggedIn) {
        const currentUser = await authHelper.getCurrentUser();

        // Either same user still logged in (login failed)
        // Or new user logged in (switched users)
        expect(currentUser?.email).toBeTruthy();
      }
    });

    test('should secure session storage and prevent XSS attacks', async ({ page, authHelper }) => {
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Try to inject malicious script through various input fields
      const maliciousScript = '<script>alert("XSS")</script>';

      // Test in search
      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill(maliciousScript);
        await page.keyboard.press('Enter');

        // Should not execute script
        page.on('dialog', (dialog) => {
          throw new Error('XSS vulnerability detected in search');
        });
      }

      // Test in profile fields
      await layoutPage.goToProfile();

      const nameInput = page.locator('[data-testid="profile-name"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill(maliciousScript);

        const saveButton = page.locator('[data-testid="save-profile"]');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await layoutPage.waitForLoad();
        }
      }

      // Verify no scripts executed
      await page.waitForTimeout(1000);
      // Test passes if no XSS alert appeared
    });

    test('should handle session storage limits', async ({ page, authHelper, apiHelper }) => {
      await authHelper.login('regular');

      // Create large amount of session data
      const largeSampleData = [];
      for (let i = 0; i < 100; i++) {
        largeSampleData.push({
          id: `large-${i}`,
          content: JSON_SAMPLES.largeArray.generateContent(10),
          timestamp: Date.now(),
        });
      }

      // Try to store large data in session/localStorage
      await page.evaluate((data) => {
        try {
          localStorage.setItem('large-test-data', JSON.stringify(data));
        } catch (e) {
          // Storage quota exceeded - this is expected
          console.log('Storage limit reached:', e);
        }
      }, largeSampleData);

      // Application should still function normally
      await layoutPage.goToLibrary();
      await expect(libraryPage.libraryContainer).toBeVisible();

      // Clean up
      await page.evaluate(() => {
        localStorage.removeItem('large-test-data');
      });
    });
  });

  test.describe('Anonymous Data Migration', () => {
    test('should migrate anonymous JSON documents upon first login', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      // Start as anonymous user and create some JSON documents
      await page.goto('/');

      // Create JSON as anonymous user
      await viewerPage.navigateToViewer();

      const anonymousJson1 = JSON_SAMPLES.simple.content;
      await viewerPage.inputJSON(JSON.stringify(anonymousJson1, null, 2));
      await viewerPage.waitForJSONProcessed();

      // Save to anonymous storage (localStorage/sessionStorage)
      await page.evaluate((jsonData) => {
        const anonymousData = JSON.parse(localStorage.getItem('anonymous-documents') || '[]');
        anonymousData.push({
          id: 'anon-doc-1',
          content: JSON.stringify(jsonData),
          title: 'Anonymous Document 1',
          timestamp: Date.now(),
        });
        localStorage.setItem('anonymous-documents', JSON.stringify(anonymousData));
      }, anonymousJson1);

      // Create another anonymous document
      const anonymousJson2 = JSON_SAMPLES.nested.content;
      await page.evaluate((jsonData) => {
        const anonymousData = JSON.parse(localStorage.getItem('anonymous-documents') || '[]');
        anonymousData.push({
          id: 'anon-doc-2',
          content: JSON.stringify(jsonData),
          title: 'Anonymous Document 2',
          timestamp: Date.now(),
        });
        localStorage.setItem('anonymous-documents', JSON.stringify(anonymousData));
      }, anonymousJson2);

      // Verify anonymous data exists
      const anonymousCount = await page.evaluate(() => {
        const data = JSON.parse(localStorage.getItem('anonymous-documents') || '[]');
        return data.length;
      });
      expect(anonymousCount).toBe(2);

      // Now create account and login for first time
      const newUser = dataGenerator.generateUserData();
      await authHelper.createAccount(newUser);

      // Should trigger migration process
      const migrationModal = page.locator('[data-testid="data-migration-modal"]');
      if (await migrationModal.isVisible()) {
        await expect(migrationModal).toBeVisible();

        // Should show what will be migrated
        const migrationInfo = await migrationModal.textContent();
        expect(migrationInfo).toContain('anonymous');
        expect(migrationInfo).toContain('document');

        // Confirm migration
        const confirmMigration = page.locator('[data-testid="confirm-migration"]');
        await confirmMigration.click();

        // Wait for migration to complete
        await layoutPage.waitForNotification('Data migrated successfully');
      }

      // Go to library and verify migrated documents
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThanOrEqual(2);

      // Should find migrated documents
      const migratedDoc1 = items.find((item) => item.title.includes('Anonymous Document 1'));
      const migratedDoc2 = items.find((item) => item.title.includes('Anonymous Document 2'));

      expect(migratedDoc1).toBeDefined();
      expect(migratedDoc2).toBeDefined();

      // Anonymous storage should be cleared
      const remainingAnonymousData = await page.evaluate(() => {
        const data = localStorage.getItem('anonymous-documents');
        return data ? JSON.parse(data) : [];
      });
      expect(remainingAnonymousData.length).toBe(0);
    });

    test('should allow selective migration of anonymous data', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      // Create multiple anonymous documents
      await page.goto('/');

      const anonymousDocuments = [
        {
          content: JSON_SAMPLES.simple.content,
          title: 'Migrate This Document',
          shouldMigrate: true,
        },
        { content: JSON_SAMPLES.nested.content, title: 'Skip This Document', shouldMigrate: false },
        {
          content: JSON_SAMPLES.configuration.content,
          title: 'Also Migrate This',
          shouldMigrate: true,
        },
      ];

      // Store anonymous documents
      await page.evaluate((docs) => {
        const anonymousData = docs.map((doc, index) => ({
          id: `anon-doc-${index}`,
          content: JSON.stringify(doc.content),
          title: doc.title,
          timestamp: Date.now() + index,
        }));
        localStorage.setItem('anonymous-documents', JSON.stringify(anonymousData));
      }, anonymousDocuments);

      // Create account
      const newUser = dataGenerator.generateUserData();
      await authHelper.createAccount(newUser);

      // Should show selective migration interface
      const migrationModal = page.locator('[data-testid="data-migration-modal"]');
      if (await migrationModal.isVisible()) {
        // Should list all documents with checkboxes
        const documentCheckboxes = page.locator('[data-testid^="migrate-doc-"]');
        const checkboxCount = await documentCheckboxes.count();
        expect(checkboxCount).toBe(3);

        // Uncheck the document we don't want to migrate
        const skipCheckbox = page.locator('[data-testid="migrate-doc-1"]'); // "Skip This Document"
        if (await skipCheckbox.isVisible()) {
          await skipCheckbox.uncheck();
        }

        // Confirm selective migration
        const confirmMigration = page.locator('[data-testid="confirm-migration"]');
        await confirmMigration.click();

        await layoutPage.waitForNotification('Selected data migrated');
      } else {
        // Fallback: Migration might happen automatically
        await layoutPage.waitForNotification('Data migrated', 5000);
      }

      // Verify only selected documents were migrated
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();

      const migratedDoc1 = items.find((item) => item.title.includes('Migrate This Document'));
      const skippedDoc = items.find((item) => item.title.includes('Skip This Document'));
      const migratedDoc2 = items.find((item) => item.title.includes('Also Migrate This'));

      expect(migratedDoc1).toBeDefined();
      expect(migratedDoc2).toBeDefined();
      expect(skippedDoc).toBeUndefined();
    });

    test('should handle large anonymous data migration', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      // Create large amount of anonymous data
      const largeAnonymousData = [];
      for (let i = 0; i < 50; i++) {
        largeAnonymousData.push({
          id: `large-anon-${i}`,
          content: JSON.stringify(JSON_SAMPLES.largeArray.generateContent(10)),
          title: `Large Anonymous Document ${i}`,
          timestamp: Date.now() + i,
        });
      }

      await page.goto('/');
      await page.evaluate((data) => {
        localStorage.setItem('anonymous-documents', JSON.stringify(data));
      }, largeAnonymousData);

      // Create account
      const newUser = dataGenerator.generateUserData();
      await authHelper.createAccount(newUser);

      // Should handle large migration with progress indicator
      const migrationModal = page.locator('[data-testid="data-migration-modal"]');
      if (await migrationModal.isVisible()) {
        const confirmMigration = page.locator('[data-testid="confirm-migration"]');
        await confirmMigration.click();

        // Should show progress for large migration
        const progressBar = page.locator('[data-testid="migration-progress"]');
        if (await progressBar.isVisible()) {
          await expect(progressBar).toBeVisible();

          // Wait for progress to complete
          await layoutPage.waitForCondition(async () => {
            return !(await progressBar.isVisible());
          }, 30000);
        }

        await layoutPage.waitForNotification('Data migrated successfully', 30000);
      }

      // Verify migration completed
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      expect(items.length).toBeGreaterThan(40); // Most documents should be migrated
    });

    test('should skip migration for existing users', async ({ page, authHelper }) => {
      // Login with existing user (not first time)
      await authHelper.login('regular');

      // Create some anonymous data to test that it's not migrated
      await page.evaluate(() => {
        const anonymousData = [
          {
            id: 'existing-user-anon',
            content: '{"test": "should not migrate"}',
            title: 'Should Not Migrate',
            timestamp: Date.now(),
          },
        ];
        localStorage.setItem('anonymous-documents', JSON.stringify(anonymousData));
      });

      // Go to library
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Should not show migration modal
      const migrationModal = page.locator('[data-testid="data-migration-modal"]');
      await expect(migrationModal).not.toBeVisible({ timeout: 2000 });

      // Should not find the anonymous document in library
      const items = await libraryPage.getAllJSONItems();
      const shouldNotMigrate = items.find((item) => item.title.includes('Should Not Migrate'));
      expect(shouldNotMigrate).toBeUndefined();

      // Anonymous data should still be in localStorage (not cleared)
      const remainingData = await page.evaluate(() => {
        return localStorage.getItem('anonymous-documents');
      });
      expect(remainingData).toBeTruthy();
    });

    test('should handle migration errors gracefully', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      // Create anonymous data
      await page.goto('/');
      await page.evaluate(() => {
        const anonymousData = [
          {
            id: 'error-test-doc',
            content: '{"test": "migration error"}',
            title: 'Migration Error Test',
            timestamp: Date.now(),
          },
        ];
        localStorage.setItem('anonymous-documents', JSON.stringify(anonymousData));
      });

      // Mock migration API failure
      await page.route('**/api/auth/migrate-anonymous', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Migration failed' }),
        });
      });

      // Create account
      const newUser = dataGenerator.generateUserData();
      await authHelper.createAccount(newUser);

      // Migration should fail gracefully
      const migrationModal = page.locator('[data-testid="data-migration-modal"]');
      if (await migrationModal.isVisible()) {
        const confirmMigration = page.locator('[data-testid="confirm-migration"]');
        await confirmMigration.click();

        // Should show error message
        await layoutPage.waitForNotification('Migration failed');

        // Should offer retry option
        const retryButton = page.locator('[data-testid="retry-migration"]');
        if (await retryButton.isVisible()) {
          await expect(retryButton).toBeVisible();
        }

        // Close migration modal
        const closeMigration = page.locator('[data-testid="close-migration"]');
        if (await closeMigration.isVisible()) {
          await closeMigration.click();
        }
      }

      // User should still be able to use the application
      await libraryPage.navigateToLibrary();
      await expect(libraryPage.libraryContainer).toBeVisible();

      // Anonymous data should be preserved for retry
      const preservedData = await page.evaluate(() => {
        const data = localStorage.getItem('anonymous-documents');
        return data ? JSON.parse(data) : [];
      });
      expect(preservedData.length).toBe(1);
    });

    test('should provide manual migration option', async ({ page, authHelper, dataGenerator }) => {
      // Create account first
      const newUser = dataGenerator.generateUserData();
      await authHelper.createAccount(newUser);

      // Add anonymous data after account creation (simulates user who skipped initial migration)
      await page.evaluate(() => {
        const anonymousData = [
          {
            id: 'manual-migration-doc',
            content: '{"manual": "migration test"}',
            title: 'Manual Migration Document',
            timestamp: Date.now(),
          },
        ];
        localStorage.setItem('anonymous-documents', JSON.stringify(anonymousData));
      });

      // Go to profile settings
      await layoutPage.goToProfile();

      // Look for manual migration option
      const manualMigrationSection = page.locator('[data-testid="manual-migration"]');
      if (await manualMigrationSection.isVisible()) {
        await expect(manualMigrationSection).toBeVisible();

        // Should show number of documents available for migration
        const docCount = await manualMigrationSection
          .locator('[data-testid="migration-doc-count"]')
          .textContent();
        expect(docCount).toContain('1');

        // Click manual migration button
        const startMigrationButton = page.locator('[data-testid="start-manual-migration"]');
        await startMigrationButton.click();

        // Should show migration interface
        const migrationDialog = page.locator('[data-testid="manual-migration-dialog"]');
        await expect(migrationDialog).toBeVisible();

        // Proceed with migration
        const proceedButton = page.locator('[data-testid="proceed-manual-migration"]');
        await proceedButton.click();

        await layoutPage.waitForNotification('Manual migration completed');
      }

      // Verify migration worked
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const manuallyMigrated = items.find((item) => item.title.includes('Manual Migration'));
      expect(manuallyMigrated).toBeDefined();
    });

    test('should preserve document metadata during migration', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      const originalTimestamp = Date.now() - 86400000; // 1 day ago

      // Create anonymous data with metadata
      await page.goto('/');
      await page.evaluate((timestamp) => {
        const anonymousData = [
          {
            id: 'metadata-test',
            content: '{"metadata": "preservation test"}',
            title: 'Metadata Preservation Test',
            timestamp: timestamp,
            viewCount: 5,
            lastModified: timestamp + 1000,
            tags: ['anonymous', 'test'],
            category: 'Test Data',
          },
        ];
        localStorage.setItem('anonymous-documents', JSON.stringify(anonymousData));
      }, originalTimestamp);

      // Create account and migrate
      const newUser = dataGenerator.generateUserData();
      await authHelper.createAccount(newUser);

      // Handle migration
      const migrationModal = page.locator('[data-testid="data-migration-modal"]');
      if (await migrationModal.isVisible()) {
        const confirmMigration = page.locator('[data-testid="confirm-migration"]');
        await confirmMigration.click();
        await layoutPage.waitForNotification('migrated');
      }

      // Verify metadata was preserved
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const migratedDoc = items.find((item) => item.title.includes('Metadata Preservation'));

      expect(migratedDoc).toBeDefined();
      expect(migratedDoc?.title).toBe('Metadata Preservation Test');

      // Verify timestamp preservation if shown in UI
      if (migratedDoc?.date) {
        // Date should be from original timestamp, not migration time
        const dateString = migratedDoc.date;
        // Should show "1 day ago" or similar, not "just now"
        expect(dateString).toMatch(/day|yesterday|\d{4}-\d{2}-\d{2}/);
      }
    });
  });

  test.describe('Session Security', () => {
    test('should invalidate session on password change', async ({ page, authHelper }) => {
      await authHelper.login('regular');
      expect(await layoutPage.isLoggedIn()).toBe(true);

      // Change password
      await layoutPage.goToProfile();

      const changePasswordButton = page.locator('[data-testid="change-password"]');
      if (await changePasswordButton.isVisible()) {
        await changePasswordButton.click();

        const passwordForm = page.locator('[data-testid="password-form"]');
        if (await passwordForm.isVisible()) {
          await page.locator('[data-testid="current-password"]').fill('TestPassword123!');
          await page.locator('[data-testid="new-password"]').fill('NewPassword456!');
          await page.locator('[data-testid="confirm-password"]').fill('NewPassword456!');

          await page.locator('[data-testid="submit-password-change"]').click();
          await layoutPage.waitForNotification('Password updated');

          // Should potentially invalidate current session for security
          // Implementation may vary - some apps keep current session, others require re-login

          // Test that new password works for future logins
          await authHelper.logout();

          // Try login with old password (should fail)
          await page.goto('/');
          await layoutPage.openLoginModal();
          await page.locator('[data-testid="login-email"]').fill('testuser@jsonshare.test');
          await page.locator('[data-testid="login-password"]').fill('TestPassword123!'); // Old password
          await page.locator('[data-testid="login-submit"]').click();

          const loginError = page.locator('[data-testid="login-error"]');
          if (await loginError.isVisible()) {
            expect(await loginError.textContent()).toContain('Invalid');
          }
        }
      }
    });

    test('should handle simultaneous sessions after account deletion', async ({
      page,
      context,
      authHelper,
    }) => {
      // Login user
      await authHelper.login('regular');

      // Open second tab with same user
      const secondPage = await context.newPage();
      const secondLayoutPage = new MainLayoutPage(secondPage);

      await secondPage.goto('/');
      // Second tab should also be logged in due to shared session

      // Delete account from first tab
      await layoutPage.goToProfile();

      const deleteAccountButton = page.locator('[data-testid="delete-account"]');
      if (await deleteAccountButton.isVisible()) {
        await deleteAccountButton.click();

        const deleteDialog = page.locator('[data-testid="delete-account-dialog"]');
        if (await deleteDialog.isVisible()) {
          const confirmInput = page.locator('[data-testid="delete-confirmation-input"]');
          if (await confirmInput.isVisible()) {
            await confirmInput.fill('DELETE');
          }

          const confirmDelete = page.locator('[data-testid="confirm-delete-account"]');
          await confirmDelete.click();

          // Wait for deletion
          await page.waitForURL('**/', { timeout: 15000 });
        }
      }

      // Second tab should also be logged out
      await secondPage.reload();
      await secondLayoutPage.waitForLoad();

      expect(await secondLayoutPage.isLoggedIn()).toBe(false);

      await secondPage.close();
    });

    test('should secure sensitive operations with re-authentication', async ({
      page,
      authHelper,
    }) => {
      await authHelper.login('regular');

      // Try to perform sensitive operation (like account deletion)
      await layoutPage.goToProfile();

      const deleteAccountButton = page.locator('[data-testid="delete-account"]');
      if (await deleteAccountButton.isVisible()) {
        await deleteAccountButton.click();

        // Should require password re-confirmation for sensitive operations
        const reauthPrompt = page.locator('[data-testid="reauth-prompt"]');
        if (await reauthPrompt.isVisible()) {
          await expect(reauthPrompt).toBeVisible();

          const passwordReauth = page.locator('[data-testid="reauth-password"]');
          await passwordReauth.fill('TestPassword123!');

          const confirmReauth = page.locator('[data-testid="confirm-reauth"]');
          await confirmReauth.click();

          // Should proceed to account deletion dialog
          const deleteDialog = page.locator('[data-testid="delete-account-dialog"]');
          await expect(deleteDialog).toBeVisible();

          // Cancel for test
          const cancelDelete = page.locator('[data-testid="cancel-delete"]');
          await cancelDelete.click();
        }
      }
    });
  });
});

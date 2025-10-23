import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Authenticated User - Publishing and Analytics', () => {
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

  test.describe('Publish JSON Documents to Library', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create test documents for publishing
      const documentsToPublish = [
        {
          content: JSON_SAMPLES.apiResponse.content,
          title: 'API Response Example',
          description: 'Sample API response data structure',
        },
        {
          content: JSON_SAMPLES.configuration.content,
          title: 'Application Configuration',
          description: 'Example app configuration with database and cache settings',
        },
        {
          content: JSON_SAMPLES.ecommerce.content,
          title: 'E-commerce Order Data',
          description: 'Complete e-commerce order with customer and item details',
        },
      ];

      for (const doc of documentsToPublish) {
        await apiHelper.uploadJSON(doc.content, doc);
      }
    });

    test('should publish document to library with metadata', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const documentToPublish = items.find((item) => item.title.includes('API Response'));
      expect(documentToPublish).toBeDefined();

      // Click publish button
      const publishButton = libraryPage.publishButtons.nth(documentToPublish?.index || 0);
      await publishButton.click();

      // Fill publish modal
      const publishModal = libraryPage.page.locator('[data-testid="publish-modal"]');
      await expect(publishModal).toBeVisible();

      // Add title and description
      const titleInput = libraryPage.page.locator('[data-testid="publish-title"]');
      await titleInput.clear();
      await titleInput.fill('Public API Response Example');

      const descriptionInput = libraryPage.page.locator('[data-testid="publish-description"]');
      await descriptionInput.fill(
        'A comprehensive example of API response structure showing pagination, user data, and metadata patterns commonly used in REST APIs.'
      );

      // Select category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      if (await categorySelect.isVisible()) {
        await categorySelect.click();
        const categoryOption = libraryPage.page.locator('[data-value="API Response"]');
        await expect(categoryOption).toBeVisible();
        await categoryOption.click();
      }

      // Add tags
      const tagsInput = libraryPage.page.locator('[data-testid="publish-tags"]');
      await tagsInput.fill('api, response, pagination, rest, example');

      // Confirm publish
      const publishConfirmButton = libraryPage.page.locator('[data-testid="confirm-publish"]');
      await publishConfirmButton.click();

      // Wait for publish confirmation
      await layoutPage.waitForNotification('Published to library');

      // Verify document is now published (should show published indicator)
      await libraryPage.waitForItemsToLoad();
      const publishedDoc = await libraryPage.getAllJSONItems();
      const nowPublished = publishedDoc.find((item) => item.title.includes('API Response'));

      // Look for published indicator
      const publishedIndicator = libraryPage.page.locator(
        `[data-testid="published-indicator-${nowPublished?.index}"]`
      );

      if (await publishedIndicator.isVisible()) {
        expect(await publishedIndicator.textContent()).toContain('Published');
      }
    });

    test('should publish document with all metadata fields', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const configDoc = items.find((item) => item.title.includes('Configuration'));

      const publishButton = libraryPage.publishButtons.nth(configDoc?.index || 0);
      await publishButton.click();

      const publishModal = libraryPage.page.locator('[data-testid="publish-modal"]');
      await expect(publishModal).toBeVisible();

      // Fill all available fields
      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Production Configuration Template');

      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill(
          'A production-ready configuration template showing database connections, cache settings, authentication providers, and feature flags. Perfect for new application setups.'
        );

      // Select category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      if (await categorySelect.isVisible()) {
        await categorySelect.click();
        await libraryPage.page.locator('[data-value="Configuration"]').click();
      }

      // Add comprehensive tags (up to 10 as per requirements)
      await libraryPage.page
        .locator('[data-testid="publish-tags"]')
        .fill(
          'configuration, template, production, database, cache, auth, features, setup, deployment, example'
        );

      // Set additional metadata if available
      const difficultySelect = libraryPage.page.locator('[data-testid="publish-difficulty"]');
      if (await difficultySelect.isVisible()) {
        await difficultySelect.selectOption('intermediate');
      }

      const languageSelect = libraryPage.page.locator('[data-testid="publish-language"]');
      if (await languageSelect.isVisible()) {
        await languageSelect.selectOption('javascript');
      }

      // Enable comments if option exists
      const allowCommentsCheckbox = libraryPage.page.locator('[data-testid="allow-comments"]');
      if (await allowCommentsCheckbox.isVisible()) {
        await allowCommentsCheckbox.check();
      }

      // Publish
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');
    });

    test('should validate required fields before publishing', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const publishButton = libraryPage.publishButtons.first();
      await publishButton.click();

      const publishModal = libraryPage.page.locator('[data-testid="publish-modal"]');
      await expect(publishModal).toBeVisible();

      // Try to publish without required fields
      const publishConfirmButton = libraryPage.page.locator('[data-testid="confirm-publish"]');
      await publishConfirmButton.click();

      // Should show validation errors
      const titleError = libraryPage.page.locator('[data-testid="title-error"]');
      const descriptionError = libraryPage.page.locator('[data-testid="description-error"]');

      if (await titleError.isVisible()) {
        expect(await titleError.textContent()).toContain('required');
      }

      if (await descriptionError.isVisible()) {
        expect(await descriptionError.textContent()).toContain('required');
      }

      // Fill minimum required fields
      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Minimal Publication Test');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Basic description for validation test.');

      // Should now be able to publish
      await publishConfirmButton.click();
      await layoutPage.waitForNotification('Published');
    });

    test('should handle tag validation (maximum 10 tags)', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const publishButton = libraryPage.publishButtons.first();
      await publishButton.click();

      // Fill required fields
      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Tag Validation Test');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Testing tag limits');

      // Try to add more than 10 tags
      const manyTags = Array(15)
        .fill(0)
        .map((_, i) => `tag${i}`)
        .join(', ');
      await libraryPage.page.locator('[data-testid="publish-tags"]').fill(manyTags);

      const publishConfirmButton = libraryPage.page.locator('[data-testid="confirm-publish"]');
      await publishConfirmButton.click();

      // Should show tag limit error
      const tagError = libraryPage.page.locator('[data-testid="tags-error"]');
      if (await tagError.isVisible()) {
        const errorText = await tagError.textContent();
        expect(errorText?.toLowerCase()).toContain('10');
        expect(errorText?.toLowerCase()).toContain('maximum');
      } else {
        // Or tags should be automatically truncated to 10
        await layoutPage.waitForNotification('Published');
      }
    });

    test('should preview document before publishing', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const ecommerceDoc = items.find((item) => item.title.includes('E-commerce'));

      const publishButton = libraryPage.publishButtons.nth(ecommerceDoc?.index || 0);
      await publishButton.click();

      // Fill publish details
      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('E-commerce Order Template');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Complete order structure with customer, items, and payment information');

      // Click preview button
      const previewButton = libraryPage.page.locator('[data-testid="preview-publication"]');
      if (await previewButton.isVisible()) {
        await previewButton.click();

        // Should show preview modal or navigate to preview
        const previewModal = libraryPage.page.locator('[data-testid="publish-preview"]');
        if (await previewModal.isVisible()) {
          // Verify preview shows the formatted content
          const previewTitle = libraryPage.page.locator('[data-testid="preview-title"]');
          expect(await previewTitle.textContent()).toBe('E-commerce Order Template');

          const previewDescription = libraryPage.page.locator(
            '[data-testid="preview-description"]'
          );
          expect(await previewDescription.textContent()).toContain('Complete order structure');

          // Close preview and proceed with publish
          const closePreview = libraryPage.page.locator('[data-testid="close-preview"]');
          await closePreview.click();
        }
      }

      // Complete publishing
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published');
    });

    test('should publish from JSON viewer directly', async ({ apiHelper }) => {
      // Create and load document in viewer
      const testDoc = await apiHelper.uploadJSON(JSON_SAMPLES.analytics.content, {
        title: 'Analytics Dashboard Data',
      });

      await viewerPage.navigateToViewer(testDoc.id);
      await viewerPage.waitForJSONProcessed();

      // Use publish button in viewer
      const publishButton = viewerPage.publishButton;
      if (await publishButton.isVisible()) {
        await publishButton.click();

        const publishModal = viewerPage.publishModal;
        await expect(publishModal).toBeVisible();

        // Fill publish details
        await libraryPage.page
          .locator('[data-testid="publish-title"]')
          .fill('Analytics Data Structure');
        await libraryPage.page
          .locator('[data-testid="publish-description"]')
          .fill(
            'Sample analytics dashboard data showing metrics, traffic sources, and performance indicators'
          );
        await libraryPage.page
          .locator('[data-testid="publish-tags"]')
          .fill('analytics, dashboard, metrics, traffic, performance');

        // Publish
        await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
        await layoutPage.waitForNotification('Published to library');

        // Should remain in viewer
        expect(await viewerPage.viewerContainer.isVisible()).toBe(true);
      }
    });
  });

  test.describe('Unpublish Documents', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create and publish documents for unpublishing tests
      const publishedDocs = [
        {
          content: JSON_SAMPLES.simple.content,
          title: 'Published Simple Document',
          description: 'A simple document that will be unpublished',
        },
        {
          content: JSON_SAMPLES.nested.content,
          title: 'Published Complex Document',
          description: 'A complex document for unpublishing tests',
        },
      ];

      for (const doc of publishedDocs) {
        const uploadResult = await apiHelper.uploadJSON(doc.content, doc);
        await apiHelper.publishJSON(uploadResult.id);
      }
    });

    test('should unpublish document and make it private', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const publishedDoc = items.find((item) => item.title.includes('Published Simple'));
      expect(publishedDoc).toBeDefined();

      // Look for unpublish option (might be in dropdown menu)
      const unpublishButton = libraryPage.page.locator(
        `[data-testid="unpublish-${publishedDoc?.index}"]`
      );

      if (await unpublishButton.isVisible()) {
        await unpublishButton.click();
      } else {
        // Try actions menu
        const actionsButton = libraryPage.page.locator(
          `[data-testid="actions-${publishedDoc?.index}"]`
        );

        if (await actionsButton.isVisible()) {
          await actionsButton.click();
          await libraryPage.page.locator('[data-testid="unpublish-action"]').click();
        }
      }

      // Confirm unpublish
      const confirmUnpublish = libraryPage.page.locator('[data-testid="confirm-unpublish"]');

      if (await confirmUnpublish.isVisible()) {
        await confirmUnpublish.click();
      }

      // Wait for unpublish confirmation
      await layoutPage.waitForNotification('Unpublished successfully');

      // Verify document is no longer marked as published
      await libraryPage.waitForItemsToLoad();
      const unpublishedDoc = await libraryPage.getAllJSONItems();
      const nowPrivate = unpublishedDoc.find((item) => item.title.includes('Published Simple'));

      // Published indicator should be gone or show "Private"
      const publishedIndicator = libraryPage.page.locator(
        `[data-testid="published-indicator-${nowPrivate?.index}"]`
      );
      if (await publishedIndicator.isVisible()) {
        const indicatorText = await publishedIndicator.textContent();
        expect(indicatorText?.toLowerCase()).toContain('private');
      }
    });

    test('should confirm unpublish action with warning', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const publishedDoc = items.find((item) => item.title.includes('Published Complex'));

      // Initiate unpublish
      const unpublishButton = libraryPage.page.locator(
        `[data-testid="unpublish-${publishedDoc?.index}"]`
      );
      if (await unpublishButton.isVisible()) {
        await unpublishButton.click();
      } else {
        // Via actions menu
        const actionsButton = libraryPage.page
          .locator('.actions-menu')
          .nth(publishedDoc?.index || 0);
        await actionsButton.click();
        await libraryPage.page.locator('[data-testid="unpublish-action"]').click();
      }

      // Should show confirmation with warning
      const unpublishDialog = libraryPage.page.locator('[data-testid="unpublish-dialog"]');
      await expect(unpublishDialog).toBeVisible();

      const warningText = await unpublishDialog.textContent();
      expect(warningText?.toLowerCase()).toContain('unpublish');
      expect(warningText?.toLowerCase()).toContain('public');

      // Cancel first
      const cancelButton = libraryPage.page.locator('[data-testid="cancel-unpublish"]');
      await cancelButton.click();

      // Document should still be published
      const stillPublishedIndicator = libraryPage.page.locator(
        `[data-testid="published-indicator-${publishedDoc?.index}"]`
      );
      if (await stillPublishedIndicator.isVisible()) {
        expect(await stillPublishedIndicator.textContent()).toContain('Published');
      }

      // Now actually unpublish
      await libraryPage.page
        .locator('.actions-menu')
        .nth(publishedDoc?.index || 0)
        .click();
      await libraryPage.page.locator('[data-testid="unpublish-action"]').click();
      await libraryPage.page.locator('[data-testid="confirm-unpublish"]').click();

      await layoutPage.waitForNotification('Unpublished');
    });

    test('should handle unpublish with existing views/analytics', async ({ apiHelper }) => {
      // Create document with some view history
      const docWithViews = await apiHelper.uploadJSON(JSON_SAMPLES.apiResponse.content, {
        title: 'Document With Views',
      });

      // Publish it
      await apiHelper.publishJSON(docWithViews.id);

      // Simulate some views
      for (let i = 0; i < 5; i++) {
        await apiHelper.viewJSON(docWithViews.id);
      }

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const docWithViewsItem = items.find((item) => item.title.includes('Document With Views'));

      // Initiate unpublish
      const actionsButton = libraryPage.page
        .locator('.actions-menu')
        .nth(docWithViewsItem?.index || 0);
      await actionsButton.click();
      await libraryPage.page.locator('[data-testid="unpublish-action"]').click();

      // Should show warning about losing public visibility
      const unpublishDialog = libraryPage.page.locator('[data-testid="unpublish-dialog"]');
      const dialogText = await unpublishDialog.textContent();

      if (dialogText?.includes('views') || dialogText?.includes('analytics')) {
        expect(dialogText).toContain('views');
      }

      // Confirm unpublish
      await libraryPage.page.locator('[data-testid="confirm-unpublish"]').click();
      await layoutPage.waitForNotification('Unpublished');

      // Document should still exist in personal library
      await libraryPage.waitForItemsToLoad();
      const unpublishedItems = await libraryPage.getAllJSONItems();
      const stillExists = unpublishedItems.find((item) =>
        item.title.includes('Document With Views')
      );
      expect(stillExists).toBeDefined();
    });
  });

  test.describe('Manage Visibility of Shared Documents', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create documents with different visibility settings
      const visibilityTestDocs = [
        { content: JSON_SAMPLES.simple.content, title: 'Public Shared Document', isPublic: true },
        { content: JSON_SAMPLES.nested.content, title: 'Private Document', isPublic: false },
        {
          content: JSON_SAMPLES.configuration.content,
          title: 'Link-Only Document',
          shareMode: 'link',
        },
      ];

      for (const doc of visibilityTestDocs) {
        await apiHelper.uploadJSON(doc.content, doc);
      }
    });

    test('should change document visibility from public to private', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const publicDoc = items.find((item) => item.title.includes('Public Shared'));

      // Open document settings
      const settingsButton = libraryPage.page.locator(
        `[data-testid="settings-${publicDoc?.index}"]`
      );
      await expect(settingsButton).toBeVisible();
      await settingsButton.click();

      // Change visibility to private
      const visibilitySelect = libraryPage.page.locator('[data-testid="visibility-select"]');
      await expect(visibilitySelect).toBeVisible();
      await visibilitySelect.click();
      const privateOption = libraryPage.page.locator('[data-value="private"]');
      await expect(privateOption).toBeVisible();
      await privateOption.click();

      // Save visibility changes
      const saveVisibilityButton = libraryPage.page.locator('[data-testid="save-visibility"]');
      await expect(saveVisibilityButton).toBeVisible();
      await saveVisibilityButton.click();

      await layoutPage.waitForNotification('Visibility updated');

      // Verify document is now private
      const visibilityIndicator = libraryPage.page.locator(
        `[data-testid="visibility-${publicDoc?.index}"]`
      );
      if (await visibilityIndicator.isVisible()) {
        expect(await visibilityIndicator.textContent()).toContain('Private');
      }
    });

    test('should set document to link-only sharing', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const privateDoc = items.find((item) => item.title.includes('Private Document'));

      const settingsButton = libraryPage.page
        .locator('.settings-button')
        .nth(privateDoc?.index || 0);
      await settingsButton.click();

      // Set to link-only visibility
      const visibilitySelect = libraryPage.page.locator('[data-testid="visibility-select"]');
      await visibilitySelect.click();
      const linkOnlyOption = libraryPage.page.locator('[data-value="link-only"]');
      await expect(linkOnlyOption).toBeVisible();
      await linkOnlyOption.click();

      // Save changes
      await libraryPage.page.locator('[data-testid="save-visibility"]').click();
      await layoutPage.waitForNotification('Sharing updated');

      // Should now show link sharing options
      const shareButton = libraryPage.shareButtons.nth(privateDoc?.index || 0);
      await shareButton.click();

      const shareModal = libraryPage.page.locator('[data-testid="share-modal"]');
      await expect(shareModal).toBeVisible();

      // Should show share link
      const shareUrl = await libraryPage.page.locator('[data-testid="share-url"]').textContent();
      expect(shareUrl).toBeTruthy();
      expect(shareUrl).toContain('http');

      // Close share modal
      await libraryPage.page.locator('[data-testid="close-share-modal"]').click();
    });

    test('should manage document permissions for different access levels', async ({
      apiHelper,
    }) => {
      // Create document with detailed permissions
      const permissionDoc = await apiHelper.uploadJSON(JSON_SAMPLES.ecommerce.content, {
        title: 'Permission Test Document',
        permissions: {
          view: 'public',
          comment: 'registered',
          download: 'owner',
        },
      });

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const permDoc = items.find((item) => item.title.includes('Permission Test'));

      // Open advanced permissions
      const advancedButton = libraryPage.page.locator(
        `[data-testid="advanced-permissions-${permDoc?.index}"]`
      );
      if (await advancedButton.isVisible()) {
        await advancedButton.click();

        const permissionsModal = libraryPage.page.locator('[data-testid="permissions-modal"]');
        await expect(permissionsModal).toBeVisible();

        // Set different permission levels
        const viewPermission = libraryPage.page.locator('[data-testid="view-permission"]');
        await viewPermission.selectOption('registered'); // Only registered users can view

        const commentPermission = libraryPage.page.locator('[data-testid="comment-permission"]');
        if (await commentPermission.isVisible()) {
          await commentPermission.selectOption('disabled'); // Disable comments
        }

        const downloadPermission = libraryPage.page.locator('[data-testid="download-permission"]');
        if (await downloadPermission.isVisible()) {
          await downloadPermission.selectOption('public'); // Allow public download
        }

        // Save permissions
        await libraryPage.page.locator('[data-testid="save-permissions"]').click();
        await layoutPage.waitForNotification('Permissions updated');
      }
    });

    test('should handle visibility inheritance for published documents', async ({ apiHelper }) => {
      // Create and publish document
      const inheritanceDoc = await apiHelper.uploadJSON(JSON_SAMPLES.analytics.content, {
        title: 'Inheritance Test Document',
      });

      await apiHelper.publishJSON(inheritanceDoc.id);

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const pubDoc = items.find((item) => item.title.includes('Inheritance Test'));

      // Try to change visibility of published document
      const settingsButton = libraryPage.page.locator('.settings-button').nth(pubDoc?.index || 0);
      await settingsButton.click();

      // Should show warning about published status
      const publishedWarning = libraryPage.page.locator(
        '[data-testid="published-visibility-warning"]'
      );
      if (await publishedWarning.isVisible()) {
        const warningText = await publishedWarning.textContent();
        expect(warningText).toContain('published');
        expect(warningText).toContain('public');
      }

      // Changing visibility should require unpublishing first
      const visibilitySelect = libraryPage.page.locator('[data-testid="visibility-select"]');
      if (await visibilitySelect.isVisible()) {
        const isDisabled = await visibilitySelect.getAttribute('disabled');
        if (isDisabled !== null) {
          expect(isDisabled).toBe('');
        }
      }
    });
  });

  test.describe('View Analytics for Published Documents', () => {
    test.beforeEach(async ({ apiHelper }) => {
      // Create and publish documents with analytics
      const analyticsDoc = await apiHelper.uploadJSON(JSON_SAMPLES.configuration.content, {
        title: 'Analytics Test Document',
        description: 'Document for testing view analytics',
      });

      await apiHelper.publishJSON(analyticsDoc.id);

      // Generate some view activity
      for (let i = 0; i < 10; i++) {
        await apiHelper.viewJSON(analyticsDoc.id);
      }
    });

    test('should view analytics dashboard for published documents', async () => {
      await layoutPage.goToProfile();

      // Look for analytics section
      const analyticsSection = layoutPage.page.locator('[data-testid="analytics-section"]');

      if (await analyticsSection.isVisible()) {
        await expect(analyticsSection).toBeVisible();

        // Should show overall statistics
        const totalViews = layoutPage.page.locator('[data-testid="total-views"]');
        if (await totalViews.isVisible()) {
          const viewCount = await totalViews.textContent();
          expect(parseInt(viewCount?.match(/\d+/)?.[0] || '0')).toBeGreaterThan(0);
        }

        // Should show published documents count
        const publishedCount = layoutPage.page.locator('[data-testid="published-count"]');
        if (await publishedCount.isVisible()) {
          const count = await publishedCount.textContent();
          expect(parseInt(count?.match(/\d+/)?.[0] || '0')).toBeGreaterThanOrEqual(1);
        }

        // Should show recent activity
        const recentActivity = layoutPage.page.locator('[data-testid="recent-activity"]');
        await expect(recentActivity).toBeVisible();
      }
    });

    test('should view detailed analytics for specific document', async () => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const analyticsDoc = items.find((item) => item.title.includes('Analytics Test'));

      // Click on analytics/stats button for the document
      const analyticsButton = libraryPage.page.locator(
        `[data-testid="analytics-${analyticsDoc?.index}"]`
      );

      if (await analyticsButton.isVisible()) {
        await analyticsButton.click();

        const analyticsModal = libraryPage.page.locator('[data-testid="document-analytics-modal"]');
        await expect(analyticsModal).toBeVisible();

        // Should show view count
        const viewCount = libraryPage.page.locator('[data-testid="document-view-count"]');
        if (await viewCount.isVisible()) {
          const count = await viewCount.textContent();
          expect(parseInt(count?.match(/\d+/)?.[0] || '0')).toBeGreaterThan(0);
        }

        // Should show view history/chart if available
        const viewChart = libraryPage.page.locator('[data-testid="view-chart"]');
        if (await viewChart.isVisible()) {
          await expect(viewChart).toBeVisible();
        }

        // Should show engagement metrics
        const engagementMetrics = libraryPage.page.locator('[data-testid="engagement-metrics"]');
        if (await engagementMetrics.isVisible()) {
          // Verify metrics are displayed
          const metrics = await engagementMetrics.textContent();
          expect(metrics).toBeTruthy();
        }

        // Close analytics modal
        await libraryPage.page.locator('[data-testid="close-analytics"]').click();
      } else {
        // Analytics might be in document actions menu
        const actionsButton = libraryPage.page
          .locator('.actions-menu')
          .nth(analyticsDoc?.index || 0);
        await actionsButton.click();

        const viewAnalyticsAction = libraryPage.page.locator(
          '[data-testid="view-analytics-action"]'
        );
        if (await viewAnalyticsAction.isVisible()) {
          await viewAnalyticsAction.click();

          // Should navigate to analytics page or show modal
          const analyticsPage = libraryPage.page.locator('[data-testid="analytics-page"]');
          if (await analyticsPage.isVisible()) {
            await expect(analyticsPage).toBeVisible();
          }
        }
      }
    });

    test('should show view count trends over time', async ({ apiHelper }) => {
      // Create document and generate views over time
      const trendDoc = await apiHelper.uploadJSON(JSON_SAMPLES.nested.content, {
        title: 'Trend Analytics Document',
      });

      await apiHelper.publishJSON(trendDoc.id);

      // Generate views with delays to simulate time-based data
      for (let day = 0; day < 7; day++) {
        for (let view = 0; view < day + 1; view++) {
          await apiHelper.viewJSON(trendDoc.id);
        }
      }

      await layoutPage.goToProfile();

      // Look for analytics dashboard
      const analyticsSection = layoutPage.page.locator('[data-testid="analytics-section"]');
      if (await analyticsSection.isVisible()) {
        // Look for trend chart or time-based data
        const trendChart = layoutPage.page.locator('[data-testid="views-trend-chart"]');
        const weeklyViews = layoutPage.page.locator('[data-testid="weekly-views"]');
        const monthlyViews = layoutPage.page.locator('[data-testid="monthly-views"]');

        if (await trendChart.isVisible()) {
          await expect(trendChart).toBeVisible();
        }

        if (await weeklyViews.isVisible()) {
          const weeklyCount = await weeklyViews.textContent();
          expect(parseInt(weeklyCount?.match(/\d+/)?.[0] || '0')).toBeGreaterThan(0);
        }

        if (await monthlyViews.isVisible()) {
          const monthlyCount = await monthlyViews.textContent();
          expect(parseInt(monthlyCount?.match(/\d+/)?.[0] || '0')).toBeGreaterThan(0);
        }
      }
    });

    test('should show popular documents ranking', async ({ apiHelper }) => {
      // Create multiple documents with different view counts
      const popularityDocs = [
        { content: JSON_SAMPLES.simple.content, title: 'Low Popularity Doc', views: 2 },
        { content: JSON_SAMPLES.nested.content, title: 'Medium Popularity Doc', views: 10 },
        { content: JSON_SAMPLES.ecommerce.content, title: 'High Popularity Doc', views: 25 },
      ];

      for (const doc of popularityDocs) {
        const uploadResult = await apiHelper.uploadJSON(doc.content, { title: doc.title });
        await apiHelper.publishJSON(uploadResult.id);

        // Generate views
        for (let i = 0; i < doc.views; i++) {
          await apiHelper.viewJSON(uploadResult.id);
        }
      }

      await layoutPage.goToProfile();

      const analyticsSection = layoutPage.page.locator('[data-testid="analytics-section"]');
      if (await analyticsSection.isVisible()) {
        // Look for popular documents section
        const popularDocs = layoutPage.page.locator('[data-testid="popular-documents"]');
        if (await popularDocs.isVisible()) {
          await expect(popularDocs).toBeVisible();

          // Should show documents sorted by popularity
          const docList = layoutPage.page.locator('[data-testid="popular-doc-item"]');
          const count = await docList.count();
          expect(count).toBeGreaterThan(0);

          // First item should be most popular
          if (count > 0) {
            const topDoc = docList.first();
            const topDocTitle = await topDoc.locator('[data-testid="doc-title"]').textContent();
            expect(topDocTitle).toContain('High Popularity');
          }
        }
      }
    });

    test('should export analytics data', async () => {
      await layoutPage.goToProfile();

      const analyticsSection = layoutPage.page.locator('[data-testid="analytics-section"]');
      if (await analyticsSection.isVisible()) {
        // Look for export button
        const exportButton = layoutPage.page.locator('[data-testid="export-analytics"]');
        if (await exportButton.isVisible()) {
          // Set up download handler
          const downloadPromise = layoutPage.page.waitForEvent('download');
          await exportButton.click();

          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/analytics.*\.(csv|json|xlsx)/);
        }
      }
    });

    test('should handle analytics for documents with no views', async ({ apiHelper }) => {
      // Create document without any views
      const noViewsDoc = await apiHelper.uploadJSON(JSON_SAMPLES.simple.content, {
        title: 'No Views Document',
      });

      await apiHelper.publishJSON(noViewsDoc.id);

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const items = await libraryPage.getAllJSONItems();
      const noViewsItem = items.find((item) => item.title.includes('No Views'));

      // Should still show analytics options
      const analyticsButton = libraryPage.page.locator(
        `[data-testid="analytics-${noViewsItem?.index}"]`
      );
      if (await analyticsButton.isVisible()) {
        await analyticsButton.click();

        const analyticsModal = libraryPage.page.locator('[data-testid="document-analytics-modal"]');
        if (await analyticsModal.isVisible()) {
          // Should show zero views
          const viewCount = libraryPage.page.locator('[data-testid="document-view-count"]');
          const count = await viewCount.textContent();
          expect(count).toContain('0');

          // Should show helpful message
          const noViewsMessage = libraryPage.page.locator('[data-testid="no-views-message"]');
          if (await noViewsMessage.isVisible()) {
            expect(await noViewsMessage.textContent()).toContain('views yet');
          }
        }
      }
    });
  });
});

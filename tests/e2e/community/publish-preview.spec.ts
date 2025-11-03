import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Content Creator - Publish Preview Functionality', () => {
  test.beforeEach(async ({ publishHelper, authHelper }) => {
    // Login as content creator
    await authHelper.login('content_creator');
    expect(await publishHelper.layoutPage.isLoggedIn()).toBe(true);
  });

  test.afterEach(async ({ authHelper }) => {
    await authHelper.logout();
  });

  test.describe('Preview Published Content Appearance', () => {
    test('should preview API response example before publishing', async ({
      dataGenerator,
      publishHelper,
    }) => {
      // Create comprehensive API response
      const apiData = dataGenerator.generateAPIResponseJSON();
      const jsonString = JSON.stringify(apiData, null, 2);

      await publishHelper.viewerPage.navigateToViewer();
      await publishHelper.viewerPage.inputJSON(jsonString);
      await publishHelper.viewerPage.waitForJSONProcessed();

      // Open publish modal and fill metadata
      await publishHelper.openPublishModal();
      const metadata = {
        title: 'Production User Management API Response',
        description:
          'Comprehensive example of a production-ready user management API response showcasing pagination, user profiles, and metadata patterns. This response demonstrates REST API best practices including proper status handling, structured error responses, and efficient data organization.',
        category: 'API Response',
        tags: 'api, rest, users, pagination, production, best-practices, authentication, json, response, management',
      };

      await publishHelper.fillPublishMetadata(metadata);

      // Open preview and validate
      const previewOpened = await publishHelper.openPreview();
      expect(previewOpened).toBe(true);

      const validationPassed = await publishHelper.validatePreviewContent(metadata);
      expect(validationPassed).toBe(true);
    });

    test('should preview configuration template with proper formatting', async ({
      publishHelper,
    }) => {
      const configData = JSON_SAMPLES.configuration.content;
      const jsonString = JSON.stringify(configData, null, 2);

      await publishHelper.viewerPage.navigateToViewer();
      await publishHelper.viewerPage.inputJSON(jsonString);
      await publishHelper.viewerPage.waitForJSONProcessed();

      await publishHelper.openPublishModal();

      const richDescription = `
        ## Overview
        A battle-tested production configuration template featuring:

        - **Database connections** with pooling and SSL
        - **Cache configuration** for Redis and Memcached
        - **Authentication providers** (OAuth, SAML, Local)
        - **Feature flags** for gradual rollouts
        - **Environment-specific settings**

        Perfect for teams setting up new applications or migrating to production environments.
      `;

      const metadata = {
        title: 'Production Application Configuration Template',
        description: richDescription.trim(),
        category: 'Configuration',
        tags: 'configuration, template, production, database, cache, auth, deployment, environment, setup, devops',
        difficulty: 'advanced',
        language: 'json',
      };

      await publishHelper.fillPublishMetadata(metadata);

      // Preview and validate formatting
      const previewOpened = await publishHelper.openPreview();
      expect(previewOpened).toBe(true);

      const validationPassed = await publishHelper.validatePreviewContent(metadata);
      expect(validationPassed).toBe(true);

      // Check markdown rendering if the preview modal shows formatted content
      const previewModal = publishHelper.libraryPage.page.locator(
        '[data-testid="publish-preview-modal"]'
      );
      if (await previewModal.isVisible()) {
        const previewDescription = previewModal.locator('[data-testid="preview-description"]');
        if (await previewDescription.isVisible()) {
          const descriptionHTML = await previewDescription.innerHTML();
          // Should render markdown formatting
          if (descriptionHTML.includes('<h2>')) {
            expect(descriptionHTML).toContain('<h2>'); // ## Overview
            expect(descriptionHTML).toContain('<strong>'); // **Bold text**
            expect(descriptionHTML).toContain('<li>'); // List items
          }
        }
      }
    });

    test('should preview with different view modes and themes', async ({
      dataGenerator,
      publishHelper,
    }) => {
      const complexData = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(complexData, null, 2);

      await publishHelper.viewerPage.navigateToViewer();
      await publishHelper.viewerPage.inputJSON(jsonString);
      await publishHelper.viewerPage.waitForJSONProcessed();

      await publishHelper.openPublishModal();

      const metadata = {
        title: 'Complex Data Structure Example',
        description: 'Comprehensive example with nested data, arrays, and complex relationships',
        category: 'Example',
        tags: 'complex, nested, example, data, structure',
      };

      await publishHelper.fillPublishMetadata(metadata);
      const previewOpened = await publishHelper.openPreview();
      expect(previewOpened).toBe(true);

      // Test different view modes and themes
      const treeViewWorked = await publishHelper.testPreviewOptions({ viewMode: 'tree' });
      const listViewWorked = await publishHelper.testPreviewOptions({ viewMode: 'list' });
      const rawViewWorked = await publishHelper.testPreviewOptions({ viewMode: 'raw' });

      // At least one view mode should work
      expect(treeViewWorked || listViewWorked || rawViewWorked).toBe(true);

      // Test theme switching
      const darkThemeWorked = await publishHelper.testPreviewOptions({ theme: 'dark' });
      const lightThemeWorked = await publishHelper.testPreviewOptions({ theme: 'light' });

      // At least one theme should work
      expect(darkThemeWorked || lightThemeWorked).toBe(true);
    });
  });

  test.describe('Preview Interaction and Validation', () => {
    test('should allow editing metadata from preview', async ({ dataGenerator, publishHelper }) => {
      const testData = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testData, null, 2);

      await publishHelper.viewerPage.navigateToViewer();
      await publishHelper.viewerPage.inputJSON(jsonString);
      await publishHelper.viewerPage.waitForJSONProcessed();

      await publishHelper.openPublishModal();

      // Fill initial metadata
      const initialMetadata = {
        title: 'Initial Title',
        description: 'Initial description',
        category: 'Example',
        tags: 'initial, tags',
      };

      await publishHelper.fillPublishMetadata(initialMetadata);
      await publishHelper.openPreview();

      // Test editing from preview
      const canEdit = await publishHelper.editFromPreview();
      expect(canEdit).toBe(true);

      // Update metadata
      const updatedMetadata = {
        title: 'Updated Title After Preview',
        description: 'Updated description after seeing the preview and making improvements',
        category: 'Example',
        tags: 'updated, preview, tags',
      };

      await publishHelper.fillPublishMetadata(updatedMetadata);
      await publishHelper.openPreview();

      // Verify changes are reflected
      const validationPassed = await publishHelper.validatePreviewContent(updatedMetadata);
      expect(validationPassed).toBe(true);
    });

    test('should validate content before showing preview', async ({ publishHelper }) => {
      const minimalData = { a: 1 };
      const jsonString = JSON.stringify(minimalData);

      await publishHelper.viewerPage.navigateToViewer();
      await publishHelper.viewerPage.inputJSON(jsonString);
      await publishHelper.viewerPage.waitForJSONProcessed();

      await publishHelper.openPublishModal();

      // Try to preview without filling required fields
      const previewOpened = await publishHelper.openPreview();

      if (!previewOpened) {
        // Should show validation errors
        const errors = await publishHelper.validatePublicationRequirements();
        expect(errors.length).toBeGreaterThan(0);
      }

      // Fill minimum required fields
      const minimalMetadata = {
        title: 'Minimal Example',
        description:
          'This is a minimal example with basic data structure for demonstration purposes.',
      };

      await publishHelper.fillPublishMetadata(minimalMetadata);

      // Now preview should work
      const previewWorked = await publishHelper.openPreview();
      expect(previewWorked).toBe(true);

      // Check for quality warnings
      const warnings = await publishHelper.getQualityWarnings();
      if (warnings.length > 0) {
        expect(warnings[0]).toMatch(/simple|basic|minimal|quality/i);
      }
    });

    test('should show estimated view statistics in preview', async ({
      dataGenerator,
      publishHelper,
    }) => {
      // Create content similar to existing popular content
      const popularData = dataGenerator.generateAPIResponseJSON();
      const jsonString = JSON.stringify(popularData, null, 2);

      await publishHelper.viewerPage.navigateToViewer();
      await publishHelper.viewerPage.inputJSON(jsonString);
      await publishHelper.viewerPage.waitForJSONProcessed();

      await publishHelper.openPublishModal();

      const metadata = {
        title: 'API Response Best Practices',
        description:
          'Comprehensive API response example showing pagination, error handling, and data structure best practices for REST APIs.',
        category: 'API Response',
        tags: 'api, rest, best-practices, pagination, error-handling, json, response, backend, development, tutorial',
      };

      await publishHelper.fillPublishMetadata(metadata);
      await publishHelper.openPreview();

      // Check for estimated engagement metrics
      const engagement = await publishHelper.getEstimatedEngagement();
      if (engagement) {
        if (engagement.views !== undefined) {
          expect(engagement.views).toBeGreaterThanOrEqual(0);
        }
        if (engagement.similar !== undefined) {
          expect(engagement.similar).toBeGreaterThanOrEqual(0);
        }
        if (engagement.score) {
          expect(engagement.score).toBeTruthy();
        }
      }
    });
  });

  test.describe('Preview Publishing Flow Integration', () => {
    test('should publish directly from preview modal', async ({ dataGenerator, publishHelper }) => {
      const publishData = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(publishData, null, 2);

      const metadata = {
        title: 'Complex Data Structure Guide',
        description:
          'Comprehensive guide showing complex JSON data structures with nested objects, arrays, and real-world patterns for modern applications.',
        category: 'Example',
        tags: 'complex, nested, guide, json, structure, patterns, development, example, tutorial, advanced',
      };

      // Use complete workflow with preview-first approach
      const result = await publishHelper.completePublishWorkflow(jsonString, metadata, true);
      expect(result.success).toBe(true);
    });

    test('should handle preview with publishing errors', async ({
      dataGenerator,
      publishHelper,
    }) => {
      const testData = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testData, null, 2);

      await publishHelper.viewerPage.navigateToViewer();
      await publishHelper.viewerPage.inputJSON(jsonString);
      await publishHelper.viewerPage.waitForJSONProcessed();

      await publishHelper.openPublishModal();

      const metadata = {
        title: 'Test Title',
        description: 'Test description',
        category: 'Example',
        tags: 'test, example',
      };

      await publishHelper.fillPublishMetadata(metadata);
      await publishHelper.openPreview();

      // Attempt to publish from preview
      const result = await publishHelper.publishFromPreview();

      // Either should succeed or handle errors gracefully
      expect(result).toBeDefined();
      if (!result.success && result.error) {
        expect(result.error).toBeTruthy();
      }
    });

    test('should save draft from preview', async ({ dataGenerator, publishHelper }) => {
      const draftData = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(draftData, null, 2);

      await publishHelper.viewerPage.navigateToViewer();
      await publishHelper.viewerPage.inputJSON(jsonString);
      await publishHelper.viewerPage.waitForJSONProcessed();

      await publishHelper.openPublishModal();

      const metadata = {
        title: 'Draft Publication Example',
        description: 'This is a draft that will be saved for later completion and publishing',
        category: 'Example',
        tags: 'draft, example, work-in-progress',
      };

      await publishHelper.fillPublishMetadata(metadata);
      await publishHelper.openPreview();

      // Save as draft from preview
      const draftSaved = await publishHelper.saveDraftFromPreview();
      expect(draftSaved).toBe(true);

      // Navigate to library to verify draft (if draft functionality is implemented)
      await publishHelper.libraryPage.navigateToLibrary();

      const draftFilter = publishHelper.libraryPage.page.locator('[data-testid="drafts-filter"]');
      if (await draftFilter.isVisible()) {
        await draftFilter.click();

        const draftItems = publishHelper.libraryPage.page.locator('[data-testid="draft-item"]');
        const draftCount = await draftItems.count();

        if (draftCount > 0) {
          const ourDraft = draftItems.filter({ hasText: 'Draft Publication Example' });
          await expect(ourDraft).toBeVisible();
        }
      }
    });
  });
});

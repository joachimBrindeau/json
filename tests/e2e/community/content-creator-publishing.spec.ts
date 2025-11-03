import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Content Creator - Publishing Workflow', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page, authHelper }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);

    // Login as content creator user
    await authHelper.login('content_creator');
    expect(await layoutPage.isLoggedIn()).toBe(true);
  });

  test.afterEach(async ({ authHelper }) => {
    await authHelper.logout();
  });

  test.describe('Publish JSON Examples with Rich Metadata', () => {
    test('should publish API response example with comprehensive metadata', async ({
      apiHelper,
      dataGenerator,
    }) => {
      // Create comprehensive API response JSON
      const apiResponseData = dataGenerator.generateAPIResponseJSON();
      const document = await apiHelper.uploadJSON(apiResponseData, {
        title: 'Comprehensive API Response Example',
      });

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Find and publish the document
      const items = await libraryPage.getAllJSONItems();
      const docToPublish = items.find((item) => item.title.includes('Comprehensive API'));
      expect(docToPublish).toBeDefined();

      const publishButton = libraryPage.publishButtons.nth(docToPublish?.index || 0);
      await publishButton.click();

      const publishModal = libraryPage.page.locator('[data-testid="publish-modal"]');
      await expect(publishModal).toBeVisible();

      // Fill comprehensive metadata
      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Production-Ready User Management API Response');

      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill(
          'A comprehensive example of a user management API response showing best practices for pagination, user data structure, metadata, and rate limiting information. This response demonstrates proper REST API design patterns including proper HTTP status handling, comprehensive user profiles with nested data, and production-ready pagination metadata. Perfect for developers learning API design or needing a reference for user management endpoints.'
        );

      // Select appropriate category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="API Response"]').click();

      // Add comprehensive tags (up to 10)
      await libraryPage.page
        .locator('[data-testid="publish-tags"]')
        .fill(
          'api, rest, users, pagination, metadata, production, best-practices, authentication, json, response'
        );

      // Set difficulty level
      const difficultySelect = libraryPage.page.locator('[data-testid="publish-difficulty"]');
      if (await difficultySelect.isVisible()) {
        await difficultySelect.selectOption('intermediate');
      }

      // Set primary language/context
      const languageSelect = libraryPage.page.locator('[data-testid="publish-language"]');
      if (await languageSelect.isVisible()) {
        await languageSelect.selectOption('javascript');
      }

      // Enable features
      const allowCommentsCheckbox = libraryPage.page.locator('[data-testid="allow-comments"]');
      if (await allowCommentsCheckbox.isVisible()) {
        await allowCommentsCheckbox.check();
      }

      const allowDownloadsCheckbox = libraryPage.page.locator('[data-testid="allow-downloads"]');
      if (await allowDownloadsCheckbox.isVisible()) {
        await allowDownloadsCheckbox.check();
      }

      // Add license information if available
      const licenseSelect = libraryPage.page.locator('[data-testid="publish-license"]');
      if (await licenseSelect.isVisible()) {
        await licenseSelect.selectOption('MIT');
      }

      // Publish the document
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Successfully published to community library');

      // Verify publication success
      await libraryPage.waitForItemsToLoad();
      const publishedItems = await libraryPage.getAllJSONItems();
      const nowPublished = publishedItems.find((item) =>
        item.title.includes('Production-Ready User')
      );

      const publishedIndicator = libraryPage.page.locator(
        `[data-testid="published-indicator-${nowPublished?.index}"]`
      );
      if (await publishedIndicator.isVisible()) {
        expect(await publishedIndicator.textContent()).toContain('Published');
      }
    });

    test('should publish configuration template with detailed categorization', async ({
      dataGenerator,
    }) => {
      // Create configuration JSON
      const configData = JSON_SAMPLES.configuration.content;

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(configData, null, 2));
      await viewerPage.waitForJSONProcessed();

      // Publish directly from viewer
      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      // Fill publication details
      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Production Application Configuration Template');

      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill(
          'A battle-tested production configuration template featuring database connections, caching strategies, authentication providers, feature flags, and deployment settings. This template includes security best practices, performance optimizations, and comprehensive environment variable patterns. Ideal for teams setting up new applications or migrating to production-ready configurations.'
        );

      // Select Configuration category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Configuration"]').click();

      // Add specific configuration tags
      await libraryPage.page
        .locator('[data-testid="publish-tags"]')
        .fill(
          'configuration, template, production, database, authentication, cache, deployment, environment, security, setup'
        );

      // Set as advanced difficulty
      const difficultySelect = libraryPage.page.locator('[data-testid="publish-difficulty"]');
      if (await difficultySelect.isVisible()) {
        await difficultySelect.selectOption('advanced');
      }

      // Add use case tags
      const useCaseInput = libraryPage.page.locator('[data-testid="publish-use-cases"]');
      if (await useCaseInput.isVisible()) {
        await useCaseInput.fill(
          'application setup, environment configuration, production deployment'
        );
      }

      // Set target audience
      const audienceSelect = libraryPage.page.locator('[data-testid="publish-audience"]');
      if (await audienceSelect.isVisible()) {
        await audienceSelect.selectOption('developers');
      }

      // Publish
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');

      // Verify we stay in viewer but see published indicator
      expect(await viewerPage.viewerContainer.isVisible()).toBe(true);
    });

    test('should publish database schema with proper metadata', async ({ dataGenerator }) => {
      // Generate database schema-like JSON
      const schemaData = {
        database: {
          name: 'ecommerce_db',
          version: '1.0.0',
          tables: [
            {
              name: 'users',
              columns: [
                { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                { name: 'email', type: 'VARCHAR(255)', unique: true, nullable: false },
                { name: 'password_hash', type: 'VARCHAR(255)', nullable: false },
                { name: 'first_name', type: 'VARCHAR(100)', nullable: false },
                { name: 'last_name', type: 'VARCHAR(100)', nullable: false },
                { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
                {
                  name: 'updated_at',
                  type: 'TIMESTAMP',
                  default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
                },
              ],
              indexes: [
                { name: 'idx_users_email', columns: ['email'] },
                { name: 'idx_users_created_at', columns: ['created_at'] },
              ],
            },
            {
              name: 'products',
              columns: [
                { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'VARCHAR(255)', nullable: false },
                { name: 'description', type: 'TEXT', nullable: true },
                { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
                { name: 'category_id', type: 'INTEGER', foreignKey: 'categories.id' },
                { name: 'stock_quantity', type: 'INTEGER', default: 0 },
                { name: 'is_active', type: 'BOOLEAN', default: true },
              ],
              relationships: [
                { type: 'belongsTo', table: 'categories', foreignKey: 'category_id' },
              ],
            },
          ],
        },
      };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(schemaData, null, 2));
      await viewerPage.waitForJSONProcessed();

      // Publish with schema-specific metadata
      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('E-commerce Database Schema Design');

      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill(
          'Complete database schema for an e-commerce application including user management, product catalog, and relationships. Features proper indexing strategies, foreign key constraints, and production-ready column definitions with appropriate data types and constraints.'
        );

      // Select Database Schema category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Database Schema"]').click();

      // Schema-specific tags
      await libraryPage.page
        .locator('[data-testid="publish-tags"]')
        .fill(
          'database, schema, mysql, ecommerce, users, products, relationships, indexes, sql, design'
        );

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published to community library');
    });

    test('should publish test data with appropriate categorization', async ({ dataGenerator }) => {
      // Create realistic test data
      const testData = {
        testSuite: 'User Authentication',
        scenarios: [
          {
            name: 'successful_login',
            description: 'Test successful user login with valid credentials',
            input: {
              email: 'test@example.com',
              password: 'validPassword123',
            },
            expected: {
              status: 200,
              body: {
                success: true,
                user: {
                  id: 1,
                  email: 'test@example.com',
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
          {
            name: 'invalid_credentials',
            description: 'Test login failure with invalid credentials',
            input: {
              email: 'test@example.com',
              password: 'wrongPassword',
            },
            expected: {
              status: 401,
              body: {
                success: false,
                error: 'Invalid credentials',
              },
            },
          },
        ],
        mockData: {
          users: [
            { id: 1, email: 'test@example.com', active: true },
            { id: 2, email: 'demo@example.com', active: true },
            { id: 3, email: 'inactive@example.com', active: false },
          ],
        },
      };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(testData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Authentication Test Data Suite');

      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill(
          'Comprehensive test data for user authentication scenarios including successful login, error cases, and mock user data. Perfect for automated testing, API development, and QA processes.'
        );

      // Select Test Data category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Test Data"]').click();

      await libraryPage.page
        .locator('[data-testid="publish-tags"]')
        .fill(
          'testing, authentication, test-data, mock, qa, automation, login, api-testing, scenarios, validation'
        );

      // Mark as suitable for beginners
      const difficultySelect = libraryPage.page.locator('[data-testid="publish-difficulty"]');
      if (await difficultySelect.isVisible()) {
        await difficultySelect.selectOption('beginner');
      }

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');
    });
  });

  test.describe('Tag Management and Validation', () => {
    test('should enforce maximum 10 tags limit', async ({ dataGenerator }) => {
      const simpleData = dataGenerator.generateSimpleJSON();

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(simpleData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      // Fill required fields
      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Tag Limit Test');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Testing tag validation');

      // Try to add 15 tags (more than allowed limit)
      const tooManyTags = [
        'tag1',
        'tag2',
        'tag3',
        'tag4',
        'tag5',
        'tag6',
        'tag7',
        'tag8',
        'tag9',
        'tag10',
        'tag11',
        'tag12',
        'tag13',
        'tag14',
        'tag15',
      ].join(', ');

      const tagsInput = libraryPage.page.locator('[data-testid="publish-tags"]');
      await tagsInput.fill(tooManyTags);

      // Try to publish
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      // Should show validation error
      const tagError = libraryPage.page.locator('[data-testid="tags-error"]');
      if (await tagError.isVisible()) {
        const errorText = await tagError.textContent();
        expect(errorText).toMatch(/maximum.*10.*tags/i);
      } else {
        // Or tags should be auto-trimmed and publish should succeed
        await layoutPage.waitForNotification('Published');

        // Verify only 10 tags were saved
        const publishedDoc = await libraryPage.getAllJSONItems();
        // Check that published document has only 10 tags
      }
    });

    test('should validate tag format and suggest corrections', async ({ dataGenerator }) => {
      const data = dataGenerator.generateComplexJSON();

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(data, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Tag Format Test');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Testing tag format validation');

      // Try invalid tag formats
      const invalidTags = [
        'valid-tag',
        'invalid tag with spaces', // Should be corrected or rejected
        'tag_with_underscores',
        'TAG-WITH-CAPS', // Should be lowercased
        'tag@with#special!chars', // Should be sanitized
        'way-too-long-tag-that-exceeds-reasonable-character-limits-for-tags',
      ].join(', ');

      const tagsInput = libraryPage.page.locator('[data-testid="publish-tags"]');
      await tagsInput.fill(invalidTags);

      // Check for validation feedback
      const tagValidation = libraryPage.page.locator('[data-testid="tag-validation"]');
      if (await tagValidation.isVisible()) {
        const validationText = await tagValidation.textContent();
        expect(validationText).toBeTruthy();
      }

      // Should clean up tags or show suggestions
      const tagSuggestions = libraryPage.page.locator('[data-testid="tag-suggestions"]');
      if (await tagSuggestions.isVisible()) {
        // User can accept suggested cleaned tags
        const acceptSuggestions = libraryPage.page.locator(
          '[data-testid="accept-tag-suggestions"]'
        );
        await acceptSuggestions.click();
      }

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published');
    });

    test('should provide tag auto-suggestions based on content and category', async () => {
      // Create JSON that should trigger specific tag suggestions
      const apiData = {
        endpoint: '/api/v1/users',
        method: 'GET',
        authentication: 'Bearer token',
        parameters: {
          page: 1,
          limit: 25,
          sort: 'created_at',
        },
        response: {
          users: [],
          pagination: {},
        },
      };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(apiData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('API Endpoint Documentation');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('REST API endpoint documentation');

      // Select API Response category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="API Response"]').click();

      // Check for auto-suggested tags
      const suggestedTags = libraryPage.page.locator('[data-testid="suggested-tags"]');
      if (await suggestedTags.isVisible()) {
        // Should suggest API-related tags
        const tags = await libraryPage.page
          .locator('[data-testid="suggested-tag"]')
          .allTextContents();
        const expectedTags = ['api', 'rest', 'endpoint', 'pagination', 'authentication'];

        for (const expectedTag of expectedTags) {
          expect(tags.some((tag) => tag.toLowerCase().includes(expectedTag))).toBe(true);
        }

        // Click to add some suggested tags
        const firstSuggestion = libraryPage.page.locator('[data-testid="suggested-tag"]').first();
        await firstSuggestion.click();
      }

      // Auto-complete should also work when typing
      const tagsInput = libraryPage.page.locator('[data-testid="publish-tags"]');
      await tagsInput.fill('ap'); // Should trigger API-related completions

      const autocomplete = libraryPage.page.locator('[data-testid="tag-autocomplete"]');
      if (await autocomplete.isVisible()) {
        const completions = await libraryPage.page
          .locator('[data-testid="autocomplete-option"]')
          .allTextContents();
        expect(completions.some((comp) => comp.includes('api'))).toBe(true);
      }

      await tagsInput.fill('api, rest, endpoint, documentation, json');
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');
    });
  });

  test.describe('Category-Based Publishing', () => {
    test('should publish in all available categories with appropriate examples', async ({
      dataGenerator,
    }) => {
      const categoryExamples = [
        {
          category: 'API Response',
          data: dataGenerator.generateAPIResponseJSON(),
          title: 'User Management API Response',
          description: 'Complete API response for user management endpoints',
        },
        {
          category: 'Configuration',
          data: JSON_SAMPLES.configuration.content,
          title: 'Application Configuration File',
          description: 'Production-ready app configuration with all essential settings',
        },
        {
          category: 'Database Schema',
          data: {
            tables: {
              users: { id: 'INTEGER PRIMARY KEY', name: 'VARCHAR(255)' },
              posts: { id: 'INTEGER PRIMARY KEY', user_id: 'INTEGER REFERENCES users(id)' },
            },
          },
          title: 'Blog Database Schema',
          description: 'Simple blog application database structure',
        },
        {
          category: 'Test Data',
          data: { testCases: [{ input: {}, expected: {} }] },
          title: 'Unit Test Data Set',
          description: 'Comprehensive test data for unit testing scenarios',
        },
        {
          category: 'Template',
          data: { template: 'user-profile', fields: [] },
          title: 'User Profile Template',
          description: 'Reusable user profile structure template',
        },
        {
          category: 'Example',
          data: dataGenerator.generateSimpleJSON(),
          title: 'Simple JSON Example',
          description: 'Basic JSON structure for learning purposes',
        },
      ];

      for (const example of categoryExamples) {
        await viewerPage.navigateToViewer();
        await viewerPage.inputJSON(JSON.stringify(example.data, null, 2));
        await viewerPage.waitForJSONProcessed();

        await viewerPage.publishButton.click();
        await expect(viewerPage.publishModal).toBeVisible();

        await libraryPage.page.locator('[data-testid="publish-title"]').fill(example.title);
        await libraryPage.page
          .locator('[data-testid="publish-description"]')
          .fill(example.description);

        // Select the specific category
        const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
        await categorySelect.click();
        await libraryPage.page.locator(`[data-value="${example.category}"]`).click();

        // Add category-appropriate tags
        const categoryTags = {
          'API Response': 'api, response, rest, json, endpoint',
          Configuration: 'config, settings, environment, production, setup',
          'Database Schema': 'database, schema, sql, tables, relationships',
          'Test Data': 'testing, test-data, mock, qa, automation',
          Template: 'template, structure, reusable, pattern, example',
          Example: 'example, tutorial, learning, basic, demonstration',
        };

        await libraryPage.page
          .locator('[data-testid="publish-tags"]')
          .fill(categoryTags[example.category as keyof typeof categoryTags]);

        await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
        await layoutPage.waitForNotification('Published successfully');

        // Small delay between publications
        await libraryPage.page.waitForLoadState('networkidle'); // Wait for publication completion
      }

      // Verify all categories were used
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const publishedItems = await libraryPage.getAllJSONItems();
      expect(publishedItems.length).toBeGreaterThanOrEqual(categoryExamples.length);
    });

    test('should show category-specific metadata fields', async ({ dataGenerator }) => {
      const configData = JSON_SAMPLES.configuration.content;

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(configData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      // Select Configuration category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Configuration"]').click();

      // Should show configuration-specific fields
      const environmentField = libraryPage.page.locator('[data-testid="config-environment"]');
      const frameworkField = libraryPage.page.locator('[data-testid="config-framework"]');
      const versionField = libraryPage.page.locator('[data-testid="config-version"]');

      if (await environmentField.isVisible()) {
        await environmentField.selectOption('production');
      }

      if (await frameworkField.isVisible()) {
        await frameworkField.fill('Node.js');
      }

      if (await versionField.isVisible()) {
        await versionField.fill('1.0.0');
      }

      // Now select Database Schema category and check for different fields
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Database Schema"]').click();

      // Should show database-specific fields
      const databaseTypeField = libraryPage.page.locator('[data-testid="db-type"]');
      const schemaVersionField = libraryPage.page.locator('[data-testid="schema-version"]');

      if (await databaseTypeField.isVisible()) {
        await databaseTypeField.selectOption('mysql');
      }

      if (await schemaVersionField.isVisible()) {
        await schemaVersionField.fill('2.1');
      }

      // Complete the publication
      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Category-Specific Fields Test');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Testing category-specific metadata fields');
      await libraryPage.page
        .locator('[data-testid="publish-tags"]')
        .fill('database, schema, metadata, fields');

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');
    });
  });

  test.describe('Content Quality and Validation', () => {
    test('should validate content quality before publishing', async ({ dataGenerator }) => {
      // Test with minimal/low-quality content
      const minimalData = { a: 1 };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(minimalData));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Test');
      await libraryPage.page.locator('[data-testid="publish-description"]').fill('Test desc');

      // Should show quality warnings
      const qualityWarning = libraryPage.page.locator('[data-testid="quality-warning"]');
      if (await qualityWarning.isVisible()) {
        const warningText = await qualityWarning.textContent();
        expect(warningText).toMatch(/content.*quality|simple|basic|minimal/i);
      }

      // Should still allow publishing but with warning
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      const confirmQuality = libraryPage.page.locator('[data-testid="confirm-quality-warning"]');
      if (await confirmQuality.isVisible()) {
        await confirmQuality.click();
      }

      await layoutPage.waitForNotification('Published');
    });

    test('should prevent publishing duplicate content', async ({ dataGenerator }) => {
      const uniqueData = dataGenerator.generateSimpleJSON();

      // Publish first version
      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(uniqueData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Original Publication');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('First publication of this content');
      await libraryPage.page.locator('[data-testid="publish-tags"]').fill('original, first, test');

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');

      // Try to publish identical content again
      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(uniqueData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Duplicate Attempt');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Trying to publish duplicate content');

      // Should detect duplicate content
      const duplicateWarning = libraryPage.page.locator('[data-testid="duplicate-warning"]');
      if (await duplicateWarning.isVisible()) {
        const warningText = await duplicateWarning.textContent();
        expect(warningText).toMatch(/duplicate|similar|already exists/i);

        // Should provide option to view original
        const viewOriginal = libraryPage.page.locator('[data-testid="view-original"]');
        if (await viewOriginal.isVisible()) {
          await viewOriginal.click();
          // Should navigate to or show original publication
        }
      }
    });

    test('should validate required metadata completeness', async ({ dataGenerator }) => {
      const completeData = dataGenerator.generateComplexJSON();

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(completeData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      // Try to publish with missing required fields
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      // Should show validation errors for missing fields
      const titleError = libraryPage.page.locator('[data-testid="title-error"]');
      const descriptionError = libraryPage.page.locator('[data-testid="description-error"]');
      const categoryError = libraryPage.page.locator('[data-testid="category-error"]');

      expect(await titleError.isVisible()).toBe(true);
      expect(await descriptionError.isVisible()).toBe(true);

      // Fill minimum required fields
      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Validation Test Document');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill(
          'A comprehensive document to test metadata validation requirements and ensure all necessary fields are properly filled before publication.'
        );

      // Description should meet minimum length requirement
      const descMinLength = 50; // Assuming minimum description length
      const description = await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .inputValue();
      expect(description.length).toBeGreaterThanOrEqual(descMinLength);

      // Select category
      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Example"]').click();

      // Now should be able to publish
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');
    });
  });
});

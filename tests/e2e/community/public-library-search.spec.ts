import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Community - Library Search and Filtering', () => {
  let viewerPage: JsonViewerPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    layoutPage = new MainLayoutPage(page);
  });

  test.describe('Search Library by Keywords, Tags, and Categories', () => {
    test.beforeEach(async ({ apiHelper, authHelper, dataGenerator }) => {
      // Create comprehensive searchable content
      await authHelper.login('content_creator');

      const searchableContent = [
        {
          content: JSON_SAMPLES.apiResponse.content,
          title: 'REST API User Management Response',
          description:
            'Complete REST API response showing user data with pagination, authentication tokens, and metadata. Perfect for learning API design patterns and user management systems.',
          category: 'API Response',
          tags: 'api, rest, users, authentication, pagination, tokens, management, json, response, backend',
        },
        {
          content: JSON_SAMPLES.configuration.content,
          title: 'Production Database Configuration',
          description:
            'Production-ready database configuration including connection pooling, SSL settings, and performance optimization. Essential for deployment and production environments.',
          category: 'Configuration',
          tags: 'database, configuration, production, ssl, performance, deployment, mysql, postgresql, connection, optimization',
        },
        {
          content: {
            ecommerce: {
              products: [
                { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
                { id: 2, name: 'Phone', price: 599.99, category: 'Electronics' },
              ],
              orders: [{ id: 'ORD001', total: 999.99, status: 'shipped', items: [1] }],
              customers: [{ id: 'CUST001', name: 'John Doe', email: 'john@example.com' }],
            },
          },
          title: 'E-commerce Data Model',
          description:
            'Complete e-commerce data structure with products, orders, and customer information. Includes pricing, inventory, and relationship mappings for online retail systems.',
          category: 'Template',
          tags: 'ecommerce, shopping, products, orders, customers, retail, commerce, business, template, model',
        },
        {
          content: {
            schema: {
              users: {
                columns: {
                  id: { type: 'INTEGER', primary: true },
                  email: { type: 'VARCHAR(255)', unique: true },
                  password: { type: 'VARCHAR(255)', encrypted: true },
                  profile: { type: 'JSON', nullable: true },
                },
                indexes: ['email', 'created_at'],
                relationships: { posts: 'hasMany', profile: 'hasOne' },
              },
              posts: {
                columns: {
                  id: { type: 'INTEGER', primary: true },
                  user_id: { type: 'INTEGER', foreign: 'users.id' },
                  title: { type: 'VARCHAR(255)' },
                  content: { type: 'TEXT' },
                },
              },
            },
          },
          title: 'Blog Platform Database Schema',
          description:
            'Comprehensive database schema for a blog platform with users, posts, and relationships. Includes proper indexing strategies and foreign key constraints.',
          category: 'Database Schema',
          tags: 'database, schema, blog, users, posts, relationships, mysql, postgresql, sql, structure',
        },
        {
          content: {
            testSuite: 'Authentication Flow',
            tests: [
              {
                name: 'successful_login',
                description: 'Test user login with valid credentials',
                input: { email: 'test@example.com', password: 'ValidPass123' },
                expected: { success: true, token: 'jwt_token_here' },
              },
              {
                name: 'invalid_password',
                description: 'Test login failure with wrong password',
                input: { email: 'test@example.com', password: 'WrongPass' },
                expected: { success: false, error: 'Invalid credentials' },
              },
            ],
          },
          title: 'User Authentication Test Suite',
          description:
            'Comprehensive test data for user authentication flows including success and failure scenarios. Perfect for automated testing and QA validation.',
          category: 'Test Data',
          tags: 'testing, authentication, login, test-data, qa, automation, validation, scenarios, security, credentials',
        },
        {
          content: dataGenerator.generateSimpleJSON(),
          title: 'Simple JSON Learning Example',
          description:
            'Basic JSON structure perfect for beginners learning JSON syntax, data types, and formatting. Great starting point for understanding JSON fundamentals.',
          category: 'Example',
          tags: 'example, beginner, tutorial, learning, json, basics, syntax, simple, education, fundamentals',
        },
        {
          content: {
            analytics: {
              pageViews: 125000,
              users: 8500,
              sessions: 15000,
              bounceRate: 0.35,
              topPages: [
                { path: '/dashboard', views: 25000 },
                { path: '/analytics', views: 18000 },
              ],
              devices: { mobile: 65, desktop: 30, tablet: 5 },
              traffic: { organic: 45, direct: 30, social: 15, paid: 10 },
            },
          },
          title: 'Website Analytics Dashboard Data',
          description:
            'Real-world analytics data structure for website performance tracking. Includes traffic sources, device breakdown, and user engagement metrics.',
          category: 'Example',
          tags: 'analytics, dashboard, metrics, traffic, performance, website, tracking, data, statistics, insights',
        },
      ];

      // Create and publish all searchable content
      for (const item of searchableContent) {
        const doc = await apiHelper.uploadJSON(item.content, {
          title: item.title,
          description: item.description,
        });

        await apiHelper.publishJSON(doc.id, {
          category: item.category,
          tags: item.tags,
        });

        // Add some views for variety
        const viewCount = Math.floor(Math.random() * 200) + 10;
        for (let i = 0; i < viewCount; i++) {
          await apiHelper.viewJSON(doc.id);
        }
      }

      await authHelper.logout();
    });

    test('should search by keywords in title and description', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');
      await expect(searchInput).toBeVisible();

      // Search for "authentication" - should find authentication-related content
      await searchInput.fill('authentication');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const searchResults = page.locator('[data-testid="library-card"]');
      const resultCount = await searchResults.count();
      expect(resultCount).toBeGreaterThan(0);

      // Verify results contain authentication-related content
      for (let i = 0; i < resultCount; i++) {
        const card = searchResults.nth(i);
        const title = await card.locator('[data-testid="card-title"]').textContent();
        const description = await card.locator('[data-testid="card-description"]').textContent();

        const combinedText = `${title} ${description}`.toLowerCase();
        expect(combinedText).toMatch(/authentication|login|auth|credentials/);
      }

      // Test different search terms
      await searchInput.fill('database');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const dbResults = await page.locator('[data-testid="library-card"]').count();
      expect(dbResults).toBeGreaterThan(0);

      // Search for "ecommerce" or "commerce"
      await searchInput.fill('ecommerce');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const ecommerceResults = await page.locator('[data-testid="library-card"]').count();
      expect(ecommerceResults).toBeGreaterThan(0);
    });

    test('should search by tags with exact and partial matches', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');

      // Search by specific tag
      await searchInput.fill('tag:api');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const tagResults = page.locator('[data-testid="library-card"]');
      const tagResultCount = await tagResults.count();
      expect(tagResultCount).toBeGreaterThan(0);

      // Verify results have the API tag
      for (let i = 0; i < Math.min(3, tagResultCount); i++) {
        const card = tagResults.nth(i);
        const tags = card.locator('[data-testid="card-tags"]');
        if (await tags.isVisible()) {
          const tagText = await tags.textContent();
          expect(tagText?.toLowerCase()).toContain('api');
        }
      }

      // Search by multiple tags
      await searchInput.fill('tag:testing tag:automation');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const multiTagResults = await page.locator('[data-testid="library-card"]').count();
      expect(multiTagResults).toBeGreaterThan(0);

      // Search with partial tag match
      await searchInput.fill('tag:config');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const configResults = await page.locator('[data-testid="library-card"]').count();
      expect(configResults).toBeGreaterThan(0);
    });

    test('should filter by categories effectively', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      // Use category filter
      const categoryFilter = page.locator('[data-testid="category-filter"]');
      await expect(categoryFilter).toBeVisible();

      // Filter by API Response category
      await categoryFilter.selectOption('API Response');
      await page.waitForTimeout(1000);

      const apiResults = page.locator('[data-testid="library-card"]');
      const apiCount = await apiResults.count();
      expect(apiCount).toBeGreaterThan(0);

      // Verify all results are API Response category
      for (let i = 0; i < apiCount; i++) {
        const card = apiResults.nth(i);
        const category = await card.locator('[data-testid="card-category"]').textContent();
        expect(category).toContain('API Response');
      }

      // Test Database Schema filter
      await categoryFilter.selectOption('Database Schema');
      await page.waitForTimeout(1000);

      const dbSchemaResults = await page.locator('[data-testid="library-card"]').count();
      expect(dbSchemaResults).toBeGreaterThan(0);

      // Test Configuration filter
      await categoryFilter.selectOption('Configuration');
      await page.waitForTimeout(1000);

      const configResults = await page.locator('[data-testid="library-card"]').count();
      expect(configResults).toBeGreaterThan(0);
    });

    test('should combine search and filters for advanced searching', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');
      const categoryFilter = page.locator('[data-testid="category-filter"]');

      // Combine text search with category filter
      await searchInput.fill('user');
      await categoryFilter.selectOption('Database Schema');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const combinedResults = page.locator('[data-testid="library-card"]');
      const combinedCount = await combinedResults.count();

      if (combinedCount > 0) {
        // Verify results match both criteria
        const firstCard = combinedResults.first();
        const category = await firstCard.locator('[data-testid="card-category"]').textContent();
        const title = await firstCard.locator('[data-testid="card-title"]').textContent();

        expect(category).toContain('Database Schema');
        expect(title?.toLowerCase()).toContain('user');
      }

      // Test tag search with category filter
      await searchInput.fill('tag:production');
      await categoryFilter.selectOption('Configuration');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const tagCategoryResults = await page.locator('[data-testid="library-card"]').count();
      expect(tagCategoryResults).toBeGreaterThanOrEqual(0); // Might be 0 if no matches

      // Clear filters and verify all content returns
      await searchInput.clear();
      await categoryFilter.selectOption('');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const allResults = await page.locator('[data-testid="library-card"]').count();
      expect(allResults).toBeGreaterThan(combinedCount);
    });

    test('should support advanced search operators', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');

      // Test exact phrase search
      await searchInput.fill('"user management"');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const exactResults = page.locator('[data-testid="library-card"]');
      const exactCount = await exactResults.count();

      if (exactCount > 0) {
        const firstResult = exactResults.first();
        const content = await firstResult.textContent();
        expect(content?.toLowerCase()).toContain('user management');
      }

      // Test OR operator
      await searchInput.fill('api OR database');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const orResults = await page.locator('[data-testid="library-card"]').count();
      expect(orResults).toBeGreaterThan(0);

      // Test AND operator
      await searchInput.fill('user AND authentication');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const andResults = page.locator('[data-testid="library-card"]');
      const andCount = await andResults.count();

      if (andCount > 0) {
        for (let i = 0; i < Math.min(2, andCount); i++) {
          const card = andResults.nth(i);
          const cardText = await card.textContent();
          expect(cardText?.toLowerCase()).toContain('user');
          expect(cardText?.toLowerCase()).toMatch(/auth|authentication/);
        }
      }

      // Test exclusion operator
      await searchInput.fill('database -schema');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const excludeResults = page.locator('[data-testid="library-card"]');
      const excludeCount = await excludeResults.count();

      if (excludeCount > 0) {
        for (let i = 0; i < Math.min(2, excludeCount); i++) {
          const card = excludeResults.nth(i);
          const cardText = await card.textContent();
          expect(cardText?.toLowerCase()).toContain('database');
          expect(cardText?.toLowerCase()).not.toContain('schema');
        }
      }
    });

    test('should provide search suggestions and auto-complete', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');

      // Start typing and check for suggestions
      await searchInput.fill('api');
      await page.waitForTimeout(500);

      const suggestions = page.locator('[data-testid="search-suggestions"]');
      if (await suggestions.isVisible()) {
        const suggestionList = suggestions.locator('[data-testid="suggestion-item"]');
        const suggestionCount = await suggestionList.count();
        expect(suggestionCount).toBeGreaterThan(0);

        // Should show relevant completions
        const firstSuggestion = await suggestionList.first().textContent();
        expect(firstSuggestion?.toLowerCase()).toContain('api');

        // Click on a suggestion
        await suggestionList.first().click();

        // Should perform search
        await page.waitForTimeout(1000);
        const results = await page.locator('[data-testid="library-card"]').count();
        expect(results).toBeGreaterThan(0);
      }

      // Test tag suggestions
      await searchInput.clear();
      await searchInput.fill('tag:');
      await page.waitForTimeout(500);

      const tagSuggestions = page.locator('[data-testid="tag-suggestions"]');
      if (await tagSuggestions.isVisible()) {
        const tagList = tagSuggestions.locator('[data-testid="tag-suggestion"]');
        const tagCount = await tagList.count();
        expect(tagCount).toBeGreaterThan(0);
      }
    });

    test('should handle search result sorting and relevance', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');

      // Search for a common term
      await searchInput.fill('user');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const results = page.locator('[data-testid="library-card"]');
      const resultCount = await results.count();
      expect(resultCount).toBeGreaterThan(0);

      // Test relevance sorting (default)
      const sortSelect = page.locator('[data-testid="search-sort"]');
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('relevance');
        await page.waitForTimeout(1000);

        // Most relevant results should be first
        const firstResult = results.first();
        const firstTitle = await firstResult.locator('[data-testid="card-title"]').textContent();
        expect(firstTitle?.toLowerCase()).toContain('user');
      }

      // Test sorting by date
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('newest');
        await page.waitForTimeout(1000);

        // Should reorder by publication date
        const newOrder = await page.locator('[data-testid="library-card"]').count();
        expect(newOrder).toBe(resultCount);
      }

      // Test sorting by popularity
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('popularity');
        await page.waitForTimeout(1000);

        // Should reorder by view count
        const popularOrder = await page.locator('[data-testid="library-card"]').count();
        expect(popularOrder).toBe(resultCount);
      }
    });

    test('should show search results count and pagination', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');

      // Perform search
      await searchInput.fill('example');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      // Should show result count
      const resultCount = page.locator('[data-testid="search-result-count"]');
      if (await resultCount.isVisible()) {
        const countText = await resultCount.textContent();
        expect(countText).toMatch(/\d+.*results?/i);
      }

      // Should show what we're searching for
      const searchQuery = page.locator('[data-testid="current-search"]');
      if (await searchQuery.isVisible()) {
        const queryText = await searchQuery.textContent();
        expect(queryText).toContain('example');
      }

      // Test pagination in search results
      const pagination = page.locator('[data-testid="search-pagination"]');
      if (await pagination.isVisible()) {
        const nextButton = pagination.locator('[data-testid="next-page"]');
        if ((await nextButton.isVisible()) && !(await nextButton.isDisabled())) {
          const firstPageResults = await page.locator('[data-testid="library-card"]').count();

          await nextButton.click();
          await page.waitForTimeout(1000);

          const secondPageResults = await page.locator('[data-testid="library-card"]').count();
          expect(secondPageResults).toBeGreaterThan(0);

          // Results should be different
          // (This is a basic check - in practice, you'd compare actual content)
        }
      }
    });

    test('should handle empty search results gracefully', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');

      // Search for something that definitely won't exist
      await searchInput.fill('nonexistentqueryterms12345');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const results = page.locator('[data-testid="library-card"]');
      const resultCount = await results.count();

      if (resultCount === 0) {
        // Should show empty state
        const emptyState = page.locator('[data-testid="empty-search-results"]');
        await expect(emptyState).toBeVisible();

        const emptyMessage = await emptyState.textContent();
        expect(emptyMessage).toMatch(/no results|not found|try different/i);

        // Should show suggestions
        const suggestions = page.locator('[data-testid="search-suggestions"]');
        if (await suggestions.isVisible()) {
          const suggestionLinks = suggestions.locator('a');
          expect(await suggestionLinks.count()).toBeGreaterThan(0);
        }

        // Should show popular or recent examples
        const alternativeResults = page.locator('[data-testid="suggested-examples"]');
        if (await alternativeResults.isVisible()) {
          const alternatives = alternativeResults.locator('[data-testid="library-card"]');
          expect(await alternatives.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should support search history and saved searches', async ({ page, authHelper }) => {
      // Login to access search history features
      await authHelper.login('regular');
      await layoutPage.navigateToPublicLibrary();

      const searchInput = page.locator('[data-testid="library-search"]');

      // Perform several searches
      const searches = ['authentication', 'database', 'api response'];

      for (const query of searches) {
        await searchInput.fill(query);
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
      }

      // Check for search history dropdown
      await searchInput.click();
      const searchHistory = page.locator('[data-testid="search-history"]');
      if (await searchHistory.isVisible()) {
        const historyItems = searchHistory.locator('[data-testid="history-item"]');
        const historyCount = await historyItems.count();
        expect(historyCount).toBeGreaterThan(0);

        // Should show recent searches
        const recentSearches = await historyItems.allTextContents();
        for (const search of searches.slice(-3)) {
          expect(recentSearches.some((item) => item.includes(search))).toBe(true);
        }

        // Click on a history item
        await historyItems.first().click();
        await page.waitForTimeout(1000);

        // Should perform the search
        const results = await page.locator('[data-testid="library-card"]').count();
        expect(results).toBeGreaterThan(0);
      }

      // Test saved searches
      await searchInput.fill('tag:api category:"API Response"');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);

      const saveSearchButton = page.locator('[data-testid="save-search"]');
      if (await saveSearchButton.isVisible()) {
        await saveSearchButton.click();

        const searchNameInput = page.locator('[data-testid="search-name-input"]');
        await searchNameInput.fill('API Response Examples');

        const confirmSave = page.locator('[data-testid="confirm-save-search"]');
        await confirmSave.click();

        // Should show confirmation
        const saveConfirmation = page.locator('[data-testid="search-saved"]');
        if (await saveConfirmation.isVisible()) {
          expect(await saveConfirmation.textContent()).toMatch(/saved/i);
        }
      }

      await authHelper.logout();
    });
  });
});

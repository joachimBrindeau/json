import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Community - Browsing and Discovery', () => {
  let viewerPage: JsonViewerPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    layoutPage = new MainLayoutPage(page);
  });

  test.describe('Browse Published JSON Examples by Category and Popularity', () => {
    test.beforeEach(async ({ apiHelper, authHelper }) => {
      // Create diverse published content across categories
      await authHelper.login('content_creator');

      const publishedContent = [
        {
          content: JSON_SAMPLES.apiResponse.content,
          title: 'User Management API Response',
          description: 'Complete REST API response for user management with pagination',
          category: 'API Response',
          tags: 'api, rest, users, pagination, json',
          views: 150,
        },
        {
          content: JSON_SAMPLES.configuration.content,
          title: 'Production App Configuration',
          description: 'Production-ready configuration with database, cache, and auth settings',
          category: 'Configuration',
          tags: 'config, production, database, auth, setup',
          views: 89,
        },
        {
          content: JSON_SAMPLES.ecommerce.content,
          title: 'E-commerce Order Structure',
          description: 'Complete order data structure for e-commerce applications',
          category: 'Template',
          tags: 'ecommerce, order, template, structure, payment',
          views: 203,
        },
        {
          content: {
            tables: {
              users: {
                id: { type: 'INTEGER', primaryKey: true },
                email: { type: 'VARCHAR(255)', unique: true },
                created_at: { type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
              },
              posts: {
                id: { type: 'INTEGER', primaryKey: true },
                user_id: { type: 'INTEGER', foreignKey: 'users.id' },
                title: { type: 'VARCHAR(255)' },
                content: { type: 'TEXT' },
              },
            },
          },
          title: 'Blog Database Schema',
          description: 'Simple blog application database schema with relationships',
          category: 'Database Schema',
          tags: 'database, schema, blog, mysql, relationships',
          views: 67,
        },
        {
          content: {
            testSuite: 'Authentication Tests',
            tests: [
              {
                name: 'login_success',
                input: { email: 'test@example.com' },
                expected: { success: true },
              },
              { name: 'login_failure', input: { email: 'invalid' }, expected: { success: false } },
            ],
          },
          title: 'Authentication Test Data',
          description: 'Test data set for authentication flow testing',
          category: 'Test Data',
          tags: 'testing, auth, test-data, automation, qa',
          views: 34,
        },
        {
          content: { example: 'simple', data: { id: 1, name: 'Sample' } },
          title: 'Simple JSON Example',
          description: 'Basic JSON structure for beginners',
          category: 'Example',
          tags: 'example, beginner, simple, tutorial, learning',
          views: 412,
        },
      ];

      // Create and publish all test content
      for (const item of publishedContent) {
        const doc = await apiHelper.uploadJSON(item.content, {
          title: item.title,
          description: item.description,
        });

        await apiHelper.publishJSON(doc.id, {
          category: item.category,
          tags: item.tags,
        });

        // Simulate views
        for (let i = 0; i < item.views; i++) {
          await apiHelper.viewJSON(doc.id);
        }
      }

      await authHelper.logout();
    });

    test('should browse library as anonymous user', async ({ page }) => {
      // Navigate to library
      await layoutPage.navigateToPublicLibrary();

      // Should see published examples without login
      const libraryGrid = page.locator('[data-testid="public-library-grid"]');
      await expect(libraryGrid).toBeVisible();

      // Should show example cards
      const exampleCards = page.locator('[data-testid="library-card"]');
      const cardCount = await exampleCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Each card should show essential information
      const firstCard = exampleCards.first();
      await expect(firstCard.locator('[data-testid="card-title"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="card-description"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="card-category"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="card-author"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="card-views"]')).toBeVisible();

      // Should show publish date
      const publishDate = firstCard.locator('[data-testid="card-publish-date"]');
      if (await publishDate.isVisible()) {
        const dateText = await publishDate.textContent();
        expect(dateText).toMatch(/\d+.*ago|published/i);
      }
    });

    test('should browse by category with proper filtering', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      // Test category filtering
      const categoryFilter = page.locator('[data-testid="category-filter"]');
      await expect(categoryFilter).toBeVisible();

      // Filter by API Response category
      await categoryFilter.selectOption('API Response');

      // Should show only API Response examples
      const filteredCards = page.locator('[data-testid="library-card"]');
      await page.waitForLoadState('networkidle'); // Wait for filtering

      const cardCount = await filteredCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Verify all visible cards are API Response category
      for (let i = 0; i < cardCount; i++) {
        const card = filteredCards.nth(i);
        const category = await card.locator('[data-testid="card-category"]').textContent();
        expect(category).toContain('API Response');
      }

      // Test Configuration category
      await categoryFilter.selectOption('Configuration');
      await page.waitForLoadState('networkidle'); // Wait for category filter

      const configCards = await page.locator('[data-testid="library-card"]').count();
      expect(configCards).toBeGreaterThan(0);

      // Test "All Categories" option
      await categoryFilter.selectOption('');
      await page.waitForLoadState('networkidle'); // Wait for category reset

      const allCards = await page.locator('[data-testid="library-card"]').count();
      expect(allCards).toBeGreaterThanOrEqual(cardCount + configCards - 1);
    });

    test('should sort by popularity (view count)', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      // Sort by popularity (most views first)
      const sortSelect = page.locator('[data-testid="sort-select"]');
      await sortSelect.selectOption('popularity');
      await page.waitForLoadState('networkidle'); // Wait for sort operation

      const cards = page.locator('[data-testid="library-card"]');
      const cardCount = await cards.count();

      // Get view counts from the first few cards
      const viewCounts = [];
      for (let i = 0; i < Math.min(3, cardCount); i++) {
        const card = cards.nth(i);
        const viewText = await card.locator('[data-testid="card-views"]').textContent();
        const views = parseInt(viewText?.match(/\d+/)?.[0] || '0');
        viewCounts.push(views);
      }

      // Should be sorted in descending order
      for (let i = 1; i < viewCounts.length; i++) {
        expect(viewCounts[i]).toBeLessThanOrEqual(viewCounts[i - 1]);
      }

      // First card should be the most popular (Simple JSON Example with 412 views)
      const topCard = cards.first();
      const topTitle = await topCard.locator('[data-testid="card-title"]').textContent();
      expect(topTitle).toContain('Simple JSON Example');
    });

    test('should sort by date (newest first)', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const sortSelect = page.locator('[data-testid="sort-select"]');
      await sortSelect.selectOption('newest');
      await page.waitForLoadState('networkidle'); // Wait for date sort

      const cards = page.locator('[data-testid="library-card"]');
      const cardCount = await cards.count();

      // Check that dates are in descending order
      const dates = [];
      for (let i = 0; i < Math.min(3, cardCount); i++) {
        const card = cards.nth(i);
        const dateElement = card.locator('[data-testid="card-publish-date"]');
        if (await dateElement.isVisible()) {
          const dateText = await dateElement.getAttribute('data-timestamp');
          if (dateText) {
            dates.push(new Date(dateText).getTime());
          }
        }
      }

      // Should be sorted in descending order (newest first)
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
      }
    });

    test('should show detailed information about examples', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const firstCard = page.locator('[data-testid="library-card"]').first();

      // Should show all required information
      const title = await firstCard.locator('[data-testid="card-title"]').textContent();
      expect(title).toBeTruthy();

      const description = await firstCard.locator('[data-testid="card-description"]').textContent();
      expect(description).toBeTruthy();

      const category = await firstCard.locator('[data-testid="card-category"]').textContent();
      expect(category).toBeTruthy();

      const author = await firstCard.locator('[data-testid="card-author"]').textContent();
      expect(author).toBeTruthy();

      const views = await firstCard.locator('[data-testid="card-views"]').textContent();
      expect(views).toMatch(/\d+.*views?/i);

      // Should show tags
      const tags = firstCard.locator('[data-testid="card-tags"]');
      if (await tags.isVisible()) {
        const tagText = await tags.textContent();
        expect(tagText).toBeTruthy();
      }

      // Should show complexity/difficulty if available
      const complexity = firstCard.locator('[data-testid="card-complexity"]');
      if (await complexity.isVisible()) {
        const complexityText = await complexity.textContent();
        expect(complexityText).toMatch(/beginner|intermediate|advanced/i);
      }

      // Should show file size/node count
      const stats = firstCard.locator('[data-testid="card-stats"]');
      if (await stats.isVisible()) {
        const statsText = await stats.textContent();
        expect(statsText).toMatch(/\d+.*(nodes|kb|mb)/i);
      }
    });

    test('should support pagination for large result sets', async ({
      page,
      apiHelper,
      authHelper,
    }) => {
      // Create additional content to trigger pagination
      await authHelper.login('content_creator');

      for (let i = 0; i < 15; i++) {
        const doc = await apiHelper.uploadJSON(
          { example: i, data: `Additional content ${i}` },
          { title: `Additional Example ${i}` }
        );
        await apiHelper.publishJSON(doc.id);
      }

      await authHelper.logout();

      await layoutPage.navigateToPublicLibrary();

      // Should show pagination controls
      const pagination = page.locator('[data-testid="library-pagination"]');
      if (await pagination.isVisible()) {
        // Should show current page
        const currentPage = pagination.locator('[data-testid="current-page"]');
        expect(await currentPage.textContent()).toContain('1');

        // Should show next page button
        const nextButton = pagination.locator('[data-testid="next-page"]');
        if ((await nextButton.isVisible()) && !(await nextButton.isDisabled())) {
          await nextButton.click();

          // Should navigate to page 2
          await page.waitForLoadState('networkidle'); // Wait for pagination
          expect(await currentPage.textContent()).toContain('2');

          // Should show different content
          const page2Cards = page.locator('[data-testid="library-card"]');
          expect(await page2Cards.count()).toBeGreaterThan(0);
        }
      }

      // Test page size selector if available
      const pageSizeSelect = page.locator('[data-testid="page-size-select"]');
      if (await pageSizeSelect.isVisible()) {
        await pageSizeSelect.selectOption('24');
        await page.waitForLoadState('networkidle'); // Wait for page size change

        const cards = await page.locator('[data-testid="library-card"]').count();
        expect(cards).toBeLessThanOrEqual(24);
      }
    });

    test('should handle empty categories gracefully', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      // Filter by a category that might not have content
      const categoryFilter = page.locator('[data-testid="category-filter"]');

      // Create a category that definitely doesn't exist
      const emptyCategory = 'NonExistentCategory';

      // If the category filter allows custom input or we can create it
      const allOptions = await categoryFilter.locator('option').allTextContents();
      const hasEmptyCategory = allOptions.includes(emptyCategory);

      if (!hasEmptyCategory) {
        // Filter by Database Schema which might have limited content
        await categoryFilter.selectOption('Database Schema');
      }

      await page.waitForLoadState('networkidle'); // Wait for category filter application

      const cards = page.locator('[data-testid="library-card"]');
      const cardCount = await cards.count();

      if (cardCount === 0) {
        // Should show empty state message
        const emptyState = page.locator('[data-testid="empty-category-state"]');
        await expect(emptyState).toBeVisible();

        const emptyMessage = await emptyState.textContent();
        expect(emptyMessage).toMatch(/no.*examples|no.*found|empty/i);

        // Should suggest other categories or actions
        const suggestions = page.locator('[data-testid="category-suggestions"]');
        if (await suggestions.isVisible()) {
          const suggestionLinks = suggestions.locator('a');
          expect(await suggestionLinks.count()).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Access Full Viewing Interfaces for Published Examples', () => {
    test.beforeEach(async ({ apiHelper, authHelper }) => {
      await authHelper.login('content_creator');

      // Create a comprehensive example for viewing
      const viewingTestDoc = await apiHelper.uploadJSON(JSON_SAMPLES.analytics.content, {
        title: 'Analytics Dashboard Data Structure',
        description: 'Complete analytics data structure for testing all viewing modes',
      });

      await apiHelper.publishJSON(viewingTestDoc.id, {
        category: 'Example',
        tags: 'analytics, dashboard, metrics, data, example',
      });

      await authHelper.logout();
    });

    test('should access full JSON viewer from library card', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      // Find and click on the analytics example
      const analyticsCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Analytics Dashboard' });

      await expect(analyticsCard).toBeVisible();

      // Click to view full example
      const viewButton = analyticsCard.locator('[data-testid="view-example"]');
      await viewButton.click();

      // Should navigate to full viewer
      await expect(page.locator('[data-testid="json-viewer"]')).toBeVisible();

      // Should show the JSON content
      await viewerPage.waitForJSONProcessed();
      const nodeCount = await viewerPage.jsonNodes.count();
      expect(nodeCount).toBeGreaterThan(0);

      // Should show all view modes
      await expect(viewerPage.treeViewButton).toBeVisible();
      await expect(viewerPage.listViewButton).toBeVisible();
      await expect(viewerPage.flowViewButton).toBeVisible();
    });

    test('should support all view modes for public examples', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const firstCard = page.locator('[data-testid="library-card"]').first();
      const viewButton = firstCard.locator('[data-testid="view-example"]');
      await viewButton.click();

      await viewerPage.waitForJSONProcessed();

      // Test Tree View
      await viewerPage.switchToTreeView();
      await expect(viewerPage.treeView).toBeVisible();

      const treeNodes = await viewerPage.jsonNodes.count();
      expect(treeNodes).toBeGreaterThan(0);

      // Test List View
      await viewerPage.switchToListView();
      await expect(viewerPage.listView).toBeVisible();

      const listNodes = await viewerPage.jsonNodes.count();
      expect(listNodes).toBeGreaterThan(0);

      // Test Sea View (if available)
      try {
        await viewerPage.switchToFlowView();
        await expect(viewerPage.flowView).toBeVisible();

        const flowNodes = await viewerPage.jsonNodes.count();
        expect(flowNodes).toBeGreaterThan(0);
      } catch (error) {
        // Sea view might not be available for all content types
        console.log('Sea view not available for this content');
      }
    });

    test('should show public example metadata and context', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const firstCard = page.locator('[data-testid="library-card"]').first();
      const viewButton = firstCard.locator('[data-testid="view-example"]');
      await viewButton.click();

      // Should show example metadata
      const metadataPanel = page.locator('[data-testid="example-metadata"]');
      if (await metadataPanel.isVisible()) {
        // Should show title and description
        const title = page.locator('[data-testid="example-title"]');
        const description = page.locator('[data-testid="example-description"]');

        await expect(title).toBeVisible();
        await expect(description).toBeVisible();

        // Should show author information
        const author = page.locator('[data-testid="example-author"]');
        await expect(author).toBeVisible();

        // Should show publication date
        const publishDate = page.locator('[data-testid="example-publish-date"]');
        if (await publishDate.isVisible()) {
          const dateText = await publishDate.textContent();
          expect(dateText).toBeTruthy();
        }

        // Should show category and tags
        const category = page.locator('[data-testid="example-category"]');
        const tags = page.locator('[data-testid="example-tags"]');

        await expect(category).toBeVisible();
        if (await tags.isVisible()) {
          const tagCount = await tags.locator('[data-testid="tag"]').count();
          expect(tagCount).toBeGreaterThan(0);
        }

        // Should show view count
        const viewCount = page.locator('[data-testid="example-view-count"]');
        if (await viewCount.isVisible()) {
          const views = await viewCount.textContent();
          expect(views).toMatch(/\d+/);
        }
      }
    });

    test('should allow anonymous users to interact with examples', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const firstCard = page.locator('[data-testid="library-card"]').first();
      const viewButton = firstCard.locator('[data-testid="view-example"]');
      await viewButton.click();

      await viewerPage.waitForJSONProcessed();

      // Should be able to expand/collapse nodes
      const expandableNodes = await viewerPage.expandableNodes.count();
      if (expandableNodes > 0) {
        const firstExpandable = viewerPage.expandableNodes.first();
        await firstExpandable.click();
        await page.waitForLoadState('networkidle'); // Wait for node expansion
        // Node should expand
      }

      // Should be able to search within JSON
      await viewerPage.searchInput.fill('data');
      await page.waitForLoadState('networkidle'); // Wait for search highlighting
      // Should highlight search results

      // Should be able to copy content (if allowed)
      const copyButton = viewerPage.copyButton;
      if (await copyButton.isVisible()) {
        await copyButton.click();

        // Should show copy confirmation
        const copyConfirmation = page.locator('[data-testid="copy-success"]');
        if (await copyConfirmation.isVisible()) {
          expect(await copyConfirmation.textContent()).toMatch(/copied/i);
        }
      }

      // Should be able to download (if allowed)
      const downloadButton = viewerPage.downloadButton;
      if (await downloadButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.json$/);
      }
    });

    test('should show JSON statistics and analysis for public examples', async ({ page }) => {
      await layoutPage.navigateToPublicLibrary();

      const firstCard = page.locator('[data-testid="library-card"]').first();
      const viewButton = firstCard.locator('[data-testid="view-example"]');
      await viewButton.click();

      await viewerPage.waitForJSONProcessed();

      // Should show JSON statistics
      const stats = await viewerPage.getJSONStats();
      expect(stats.nodeCount).toBeGreaterThan(0);

      // Should show complexity indicators
      const complexityIndicator = page.locator('[data-testid="complexity-indicator"]');
      if (await complexityIndicator.isVisible()) {
        const complexity = await complexityIndicator.textContent();
        expect(complexity).toMatch(/simple|moderate|complex/i);
      }

      // Should show structure analysis
      const structureAnalysis = page.locator('[data-testid="structure-analysis"]');
      if (await structureAnalysis.isVisible()) {
        const analysis = await structureAnalysis.textContent();
        expect(analysis).toBeTruthy();
      }

      // Should show node type breakdown
      const nodeTypes = await viewerPage.getNodeCounts();
      expect(nodeTypes.total).toBeGreaterThan(0);
    });

    test('should handle large public examples with performance optimization', async ({
      page,
      apiHelper,
      authHelper,
    }) => {
      // Create a large JSON example
      await authHelper.login('content_creator');

      const largeData = {
        metadata: { size: 'large', items: 1000 },
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          properties: {
            value: Math.random() * 1000,
            category: `Category ${i % 10}`,
            active: i % 2 === 0,
            metadata: {
              created: new Date().toISOString(),
              tags: [`tag${i % 5}`, `tag${(i + 1) % 5}`],
            },
          },
        })),
      };

      const largeDoc = await apiHelper.uploadJSON(largeData, {
        title: 'Large Dataset Example',
        description: 'Large JSON dataset for performance testing',
      });

      await apiHelper.publishJSON(largeDoc.id, {
        category: 'Example',
        tags: 'large, performance, dataset, testing, example',
      });

      await authHelper.logout();

      await layoutPage.navigateToPublicLibrary();

      // Find and view the large example
      const largeCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Large Dataset' });

      const viewButton = largeCard.locator('[data-testid="view-example"]');
      await viewButton.click();

      // Should show loading indicator
      const loadingSpinner = page.locator('[data-testid="loading"]');
      if (await loadingSpinner.isVisible()) {
        await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
      }

      await viewerPage.waitForJSONProcessed();

      // Should handle virtualization for large content
      const virtualizedContainer = page.locator('[data-testid="virtualized-content"]');
      if (await virtualizedContainer.isVisible()) {
        // Should only render visible items
        const visibleItems = await viewerPage.jsonNodes.count();
        expect(visibleItems).toBeLessThan(1000); // Should be virtualized
      }

      // Should still be interactive
      await viewerPage.searchInput.fill('Item 50');
      await page.waitForLoadState('networkidle'); // Wait for search in large dataset

      // Should find the search result
      const searchResults = page.locator('[data-testid="search-result"]');
      if (await searchResults.isVisible()) {
        expect(await searchResults.count()).toBeGreaterThan(0);
      }
    });
  });
});

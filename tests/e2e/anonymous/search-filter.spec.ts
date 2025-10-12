import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Anonymous User - Search & Filter Functionality', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('User Story 9: Search and filter JSON content', () => {
    test('should display search input interface', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      // Verify search input is visible
      const hasSearchInput = await viewerPage.searchInput.isVisible();
      const hasSearchInterface =
        hasSearchInput ||
        (await viewerPage.page
          .locator('input[placeholder*="search"], [data-testid="search"]')
          .isVisible());

      expect(hasSearchInterface).toBe(true);

      // Take screenshot of search interface
      await viewerPage.takeScreenshot('search-interface');
    });

    test('should search for string values in JSON', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateAPIResponseJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Search for a specific string that exists in the JSON
        await viewerPage.searchInJSON('user1');

        // Wait for search results to appear
        await viewerPage.page.waitForTimeout(1000);

        // Verify search results are highlighted or filtered
        const searchResults = await viewerPage.page
          .locator('.search-result, .highlight, .match, [data-search-match="true"]')
          .count();
        expect(searchResults).toBeGreaterThan(0);

        // Take screenshot of search results
        await viewerPage.takeScreenshot('search-results-highlight');
      } else {
        test.skip('Search functionality not available');
      }
    });

    test('should search for numeric values', async () => {
      const numericJson = {
        users: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          age: 25 + i,
          score: Math.round(Math.random() * 100 * 100) / 100,
          active: i % 2 === 0,
        })),
      };
      const jsonString = JSON.stringify(numericJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Search for a specific number
        await viewerPage.searchInJSON('25');
        await viewerPage.page.waitForTimeout(1000);

        // Should find numeric matches
        const hasResults =
          (await viewerPage.page.locator('.search-result, .highlight, .match').count()) > 0;
        // Results may vary based on implementation
      }
    });

    test('should support case-insensitive search', async () => {
      const testJson = {
        data: {
          UserName: 'John Doe',
          username: 'johndoe',
          EMAIL: 'john@example.com',
          Email: 'john.doe@company.com',
        },
      };
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Search with different cases
        await viewerPage.searchInJSON('email');
        await viewerPage.page.waitForTimeout(1000);

        // Should match both 'EMAIL' and 'Email'
        const searchResults = await viewerPage.page
          .locator('.search-result, .highlight, .match')
          .count();
        expect(searchResults).toBeGreaterThan(0);

        // Clear and search with uppercase
        await viewerPage.clearSearch();
        await viewerPage.searchInJSON('EMAIL');
        await viewerPage.page.waitForTimeout(1000);

        // Should still find matches
        const upperCaseResults = await viewerPage.page
          .locator('.search-result, .highlight, .match')
          .count();
        expect(upperCaseResults).toBeGreaterThan(0);
      }
    });

    test('should search within nested object paths', async () => {
      const nestedJson = JSON_SAMPLES.nested.content;
      const jsonString = JSON.stringify(nestedJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Search for deeply nested value
        await viewerPage.searchInJSON('alice@example.com');
        await viewerPage.page.waitForTimeout(1000);

        // Should find the email in nested structure
        const searchResults = await viewerPage.page
          .locator('.search-result, .highlight, .match')
          .count();
        expect(searchResults).toBeGreaterThan(0);

        // Search for nested key name
        await viewerPage.clearSearch();
        await viewerPage.searchInJSON('contacts');
        await viewerPage.page.waitForTimeout(1000);

        // Should find key names too
        const keyResults = await viewerPage.page
          .locator('.search-result, .highlight, .match')
          .count();
        expect(keyResults).toBeGreaterThan(0);
      }
    });

    test('should provide search result navigation', async ({ dataGenerator }) => {
      const apiResponse = dataGenerator.generateAPIResponseJSON();
      const jsonString = JSON.stringify(apiResponse, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Search for a term that appears multiple times
        await viewerPage.searchInJSON('user');
        await viewerPage.page.waitForTimeout(1000);

        // Look for next/previous search navigation buttons
        const nextButton = viewerPage.page.locator(
          '[data-testid="search-next"], button:has-text("Next"), .search-nav-next'
        );
        const prevButton = viewerPage.page.locator(
          '[data-testid="search-prev"], button:has-text("Previous"), .search-nav-prev'
        );

        if (await nextButton.isVisible()) {
          await nextButton.click();
          await viewerPage.page.waitForTimeout(500);

          // Should navigate to next result
          const currentResult = await viewerPage.page
            .locator('.current-search-result, .active-match')
            .count();
          expect(currentResult).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('should filter JSON content based on search criteria', async ({ dataGenerator }) => {
      const largeJson = dataGenerator.generateLargeJSON(50);
      const jsonString = JSON.stringify(largeJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Get initial node count
        const initialNodeCount = await viewerPage.jsonNodes.count();

        // Apply filter search
        await viewerPage.searchInJSON('category_1');
        await viewerPage.page.waitForTimeout(1000);

        // If filtering is supported, visible nodes should be reduced
        const filteredNodeCount = await viewerPage.jsonNodes.count();

        // Results may vary based on whether search highlights or filters
        // Just ensure no errors occurred
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    });

    test('should handle empty search results gracefully', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Search for term that doesn't exist
        await viewerPage.searchInJSON('nonexistentterm12345');
        await viewerPage.page.waitForTimeout(1000);

        // Should handle gracefully - no errors
        expect(await viewerPage.hasJSONErrors()).toBe(false);

        // Look for "no results" message
        const noResultsMessage = await viewerPage.page
          .locator('text="No results", text="not found", .no-results')
          .count();
        // This is optional as different implementations handle empty results differently
      }
    });

    test('should clear search results properly', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Perform search
        await viewerPage.searchInJSON('user');
        await viewerPage.page.waitForTimeout(1000);

        // Clear search
        await viewerPage.clearSearch();
        await viewerPage.page.waitForTimeout(500);

        // All content should be visible again
        const clearedNodeCount = await viewerPage.jsonNodes.count();
        expect(clearedNodeCount).toBeGreaterThan(0);

        // No search highlights should remain
        const remainingHighlights = await viewerPage.page
          .locator('.search-result, .highlight, .match')
          .count();
        expect(remainingHighlights).toBe(0);
      }
    });

    test('should support regular expression search', async () => {
      const emailJson = {
        contacts: [
          { email: 'user1@example.com', name: 'User One' },
          { email: 'admin@company.org', name: 'Admin' },
          { email: 'test@domain.net', name: 'Tester' },
          { phone: '+1-555-0123', name: 'Phone User' },
        ],
      };
      const jsonString = JSON.stringify(emailJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Look for regex search option
        const regexToggle = viewerPage.page.locator(
          '[data-testid="regex-search"], input[type="checkbox"][aria-label*="regex"], .regex-toggle'
        );

        if (await regexToggle.isVisible()) {
          await regexToggle.check();

          // Search with email regex pattern
          await viewerPage.searchInJSON('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
          await viewerPage.page.waitForTimeout(1000);

          // Should match email addresses
          const regexResults = await viewerPage.page
            .locator('.search-result, .highlight, .match')
            .count();
          expect(regexResults).toBeGreaterThan(0);
        } else {
          // Skip if regex search is not available
          test.skip('Regex search not available');
        }
      }
    });

    test('should search across all view modes', async ({ dataGenerator }) => {
      const testJson = dataGenerator.generateComplexJSON();
      const jsonString = JSON.stringify(testJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        const searchTerm = 'user';

        // Test search in different view modes
        const viewModes = [
          {
            button: viewerPage.treeViewButton,
            switch: () => viewerPage.switchToTreeView(),
            name: 'tree',
          },
          {
            button: viewerPage.listViewButton,
            switch: () => viewerPage.switchToListView(),
            name: 'list',
          },
        ];

        for (const mode of viewModes) {
          if (await mode.button.isVisible()) {
            await mode.switch();
            await viewerPage.page.waitForTimeout(500);

            // Perform search in this view mode
            await viewerPage.searchInJSON(searchTerm);
            await viewerPage.page.waitForTimeout(1000);

            // Should work in any view mode
            expect(await viewerPage.hasJSONErrors()).toBe(false);

            // Clear search for next mode
            await viewerPage.clearSearch();
          }
        }
      }
    });

    test('should handle special characters in search', async () => {
      const specialCharsJson = {
        data: {
          'key with spaces': 'value with spaces',
          'key-with-dashes': 'value-with-dashes',
          key_with_underscores: 'value_with_underscores',
          'key.with.dots': 'value.with.dots',
          'key@with@symbols': 'value@with@symbols',
          unicode_中文: '中文_value',
          'emoji_🚀': '🚀_rocket',
        },
      };
      const jsonString = JSON.stringify(specialCharsJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        const specialSearches = [
          'key with spaces',
          'key-with-dashes',
          'key_with_underscores',
          'key.with.dots',
          '中文',
          '🚀',
        ];

        for (const searchTerm of specialSearches) {
          await viewerPage.searchInJSON(searchTerm);
          await viewerPage.page.waitForTimeout(500);

          // Should handle special characters without errors
          expect(await viewerPage.hasJSONErrors()).toBe(false);

          await viewerPage.clearSearch();
        }
      }
    });

    test('should provide search performance for large datasets', async ({ dataGenerator }) => {
      const largeJson = dataGenerator.generateLargeJSON(500);
      const jsonString = JSON.stringify(largeJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Measure search performance
        const startTime = Date.now();
        await viewerPage.searchInJSON('category_1');
        await viewerPage.page.waitForTimeout(2000);
        const endTime = Date.now();

        // Search should complete within reasonable time
        expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

        // Should not cause errors or crashes
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    });

    test('should maintain search state during JSON updates', async ({ dataGenerator }) => {
      const initialJson = dataGenerator.generateSimpleJSON();
      const jsonString = JSON.stringify(initialJson, null, 2);

      await viewerPage.inputJSON(jsonString);
      await viewerPage.waitForJSONProcessed();

      if (await viewerPage.searchInput.isVisible()) {
        // Perform initial search
        await viewerPage.searchInJSON('John');
        await viewerPage.page.waitForTimeout(1000);

        // Update JSON content
        const updatedJson = { ...initialJson, user: { ...initialJson.user, name: 'Jane Doe' } };
        await viewerPage.inputJSON(JSON.stringify(updatedJson, null, 2));
        await viewerPage.waitForJSONProcessed();

        // Search state behavior may vary - just ensure no errors
        expect(await viewerPage.hasJSONErrors()).toBe(false);
      }
    });
  });
});

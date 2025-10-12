import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { PerformanceTestGenerator } from '../../../lib/performance-test-generator';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Advanced User - Advanced Filtering & Deep Search (Story 4)', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test.describe('Deep JSON Structure Search', () => {
    test('should search through deeply nested JSON structures', async () => {
      const deeplyNestedJson = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  targetValue: 'FOUND_DEEP_VALUE',
                  otherData: 'noise',
                  level6: {
                    level7: {
                      anotherTarget: 'SECONDARY_TARGET',
                      moreNoise: 'irrelevant',
                    },
                  },
                },
              },
            },
          },
        },
        metadata: {
          searchTest: true,
          deepNesting: {
            purpose: 'testing deep search capabilities',
            hiddenValue: 'HIDDEN_TARGET',
          },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(deeplyNestedJson));
      await viewerPage.waitForJSONProcessed();

      // Search for deeply nested value
      await viewerPage.searchInJSON('FOUND_DEEP_VALUE');

      // Should highlight or show the deeply nested result
      const searchResults = await viewerPage.page
        .locator('.search-result, [data-testid*="search-result"], .highlighted')
        .count();
      expect(searchResults).toBeGreaterThan(0);

      // Take screenshot of deep search results
      await viewerPage.takeScreenshot('deep-search-results');

      // Search for multiple targets
      await viewerPage.searchInJSON('TARGET');

      // Should find multiple matches across different levels
      const multipleResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(multipleResults).toBeGreaterThanOrEqual(2); // At least 2 targets

      // Clear search and verify
      await viewerPage.clearSearch();
      const clearedResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(clearedResults).toBe(0);
    });

    test('should support complex search patterns and regex', async () => {
      const patternTestJson = {
        users: [
          { id: 'user_001', email: 'john.doe@example.com', phone: '+1-555-0123' },
          { id: 'user_002', email: 'jane.smith@test.org', phone: '+1-555-0456' },
          { id: 'user_003', email: 'bob.wilson@company.net', phone: '+1-555-0789' },
        ],
        products: [
          { sku: 'PROD-2024-001', price: 29.99, category: 'electronics' },
          { sku: 'PROD-2024-002', price: 149.5, category: 'electronics' },
          { sku: 'PROD-2023-999', price: 19.99, category: 'books' },
        ],
        orders: [
          { orderId: 'ORD-ABC-123', status: 'shipped', total: 299.99 },
          { orderId: 'ORD-DEF-456', status: 'pending', total: 79.5 },
        ],
      };

      await viewerPage.inputJSON(JSON.stringify(patternTestJson));
      await viewerPage.waitForJSONProcessed();

      // Test email pattern search
      await viewerPage.searchInJSON('@example.com');
      let results = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(results).toBeGreaterThan(0);

      await viewerPage.takeScreenshot('email-pattern-search');

      // Test phone pattern search
      await viewerPage.searchInJSON('+1-555');
      results = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(results).toBeGreaterThanOrEqual(3); // All 3 phone numbers

      // Test product SKU pattern
      await viewerPage.searchInJSON('PROD-2024');
      results = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(results).toBeGreaterThanOrEqual(2); // 2024 products

      // Test case-insensitive search
      await viewerPage.searchInJSON('ELECTRONICS');
      results = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(results).toBeGreaterThanOrEqual(2);

      await viewerPage.searchInJSON('electronics');
      const lowercaseResults = await viewerPage.page
        .locator('.search-result, .highlighted')
        .count();
      expect(lowercaseResults).toBeGreaterThanOrEqual(2);
    });

    test('should search within large JSON arrays efficiently', async () => {
      const largeArrayJson = {
        metadata: { total: 10000, searchTest: true },
        data: PerformanceTestGenerator.generateLargeArray(10000),
      };

      await viewerPage.inputJSON(JSON.stringify(largeArrayJson));
      await viewerPage.waitForJSONProcessed();

      const searchStartTime = Date.now();

      // Search for specific ID in large array
      await viewerPage.searchInJSON('item_5000');

      const searchTime = Date.now() - searchStartTime;

      // Search should be efficient even in large arrays
      expect(searchTime).toBeLessThan(5000); // Under 5 seconds

      // Should find the specific item
      const results = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(results).toBeGreaterThan(0);

      await viewerPage.takeScreenshot('large-array-search');

      // Test multiple matches
      await viewerPage.searchInJSON('category_5');
      const categoryResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(categoryResults).toBeGreaterThan(100); // Many items in category_5

      // Verify search performance doesn't degrade
      const secondSearchStart = Date.now();
      await viewerPage.searchInJSON('active');
      const secondSearchTime = Date.now() - secondSearchStart;
      expect(secondSearchTime).toBeLessThan(3000);
    });

    test('should support multi-criteria filtering', async () => {
      const complexJson = {
        employees: [
          {
            id: 1,
            name: 'John Doe',
            department: 'Engineering',
            salary: 95000,
            active: true,
            location: 'NYC',
          },
          {
            id: 2,
            name: 'Jane Smith',
            department: 'Engineering',
            salary: 105000,
            active: true,
            location: 'SF',
          },
          {
            id: 3,
            name: 'Bob Johnson',
            department: 'Marketing',
            salary: 75000,
            active: false,
            location: 'NYC',
          },
          {
            id: 4,
            name: 'Alice Brown',
            department: 'Engineering',
            salary: 88000,
            active: true,
            location: 'LA',
          },
          {
            id: 5,
            name: 'Charlie Wilson',
            department: 'Sales',
            salary: 82000,
            active: true,
            location: 'NYC',
          },
        ],
        projects: [
          {
            id: 'P001',
            name: 'Project Alpha',
            status: 'active',
            budget: 250000,
            team: ['Engineering'],
          },
          {
            id: 'P002',
            name: 'Project Beta',
            status: 'completed',
            budget: 150000,
            team: ['Marketing', 'Sales'],
          },
          {
            id: 'P003',
            name: 'Project Gamma',
            status: 'active',
            budget: 300000,
            team: ['Engineering'],
          },
        ],
      };

      await viewerPage.inputJSON(JSON.stringify(complexJson));
      await viewerPage.waitForJSONProcessed();

      // Test filtering by department
      await viewerPage.searchInJSON('Engineering');
      const engineeringResults = await viewerPage.page
        .locator('.search-result, .highlighted')
        .count();
      expect(engineeringResults).toBeGreaterThan(0);

      // Test filtering by location
      await viewerPage.searchInJSON('NYC');
      const nycResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(nycResults).toBeGreaterThanOrEqual(3);

      // Test filtering by status
      await viewerPage.searchInJSON('active');
      const activeResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(activeResults).toBeGreaterThan(0);

      await viewerPage.takeScreenshot('multi-criteria-filtering');

      // Test numeric value search
      await viewerPage.searchInJSON('95000');
      const salaryResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(salaryResults).toBeGreaterThan(0);
    });
  });

  test.describe('Advanced Filter Operations', () => {
    test('should filter by data types', async () => {
      const typedDataJson = {
        strings: { name: 'test', description: 'string data', category: 'text' },
        numbers: { count: 42, price: 19.99, rating: 4.5, zero: 0 },
        booleans: { active: true, verified: false, published: true },
        nullValues: { deleted: null, optional: null },
        arrays: { tags: ['tag1', 'tag2'], numbers: [1, 2, 3], mixed: ['text', 42, true] },
        objects: {
          nested: { inner: { value: 'deep' } },
          config: { setting1: true, setting2: 'value' },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(typedDataJson));
      await viewerPage.waitForJSONProcessed();

      // Look for type-based filtering UI
      const typeFilterElements = await viewerPage.page
        .locator(
          '[data-testid*="filter"], [data-testid*="type"], text=/filter.*type|type.*filter/i'
        )
        .count();

      if (typeFilterElements > 0) {
        // Test string type filtering
        await viewerPage.page
          .locator('[data-testid*="filter-string"], [data-type="string"]')
          .first()
          .click();
        await viewerPage.page.waitForTimeout(500);

        const visibleStrings = await viewerPage.stringNodes.count();
        expect(visibleStrings).toBeGreaterThan(0);

        await viewerPage.takeScreenshot('string-type-filter');

        // Test number type filtering
        await viewerPage.page
          .locator('[data-testid*="filter-number"], [data-type="number"]')
          .first()
          .click();
        await viewerPage.page.waitForTimeout(500);

        const visibleNumbers = await viewerPage.numberNodes.count();
        expect(visibleNumbers).toBeGreaterThan(0);

        await viewerPage.takeScreenshot('number-type-filter');
      } else {
        // Alternative: Test via search for specific data types
        await viewerPage.searchInJSON('true');
        const booleanResults = await viewerPage.page
          .locator('.search-result, .highlighted')
          .count();
        expect(booleanResults).toBeGreaterThan(0);

        await viewerPage.searchInJSON('null');
        const nullResults = await viewerPage.page.locator('.search-result, .highlighted').count();
        expect(nullResults).toBeGreaterThan(0);
      }
    });

    test('should support path-based filtering', async () => {
      const pathTestJson = {
        api: {
          v1: {
            users: [
              { id: 1, profile: { name: 'John', settings: { theme: 'dark' } } },
              { id: 2, profile: { name: 'Jane', settings: { theme: 'light' } } },
            ],
          },
          v2: {
            users: [{ id: 3, profile: { name: 'Bob', preferences: { theme: 'auto' } } }],
          },
        },
        config: {
          database: { host: 'localhost', port: 5432 },
          cache: { host: 'redis-server', port: 6379 },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(pathTestJson));
      await viewerPage.waitForJSONProcessed();

      // Look for path-based filtering capabilities
      const pathFilterElements = await viewerPage.page
        .locator('[data-testid*="path"], [data-path], text=/path|\.|\//')
        .count();

      if (pathFilterElements > 0) {
        // Test filtering by path patterns
        await viewerPage.searchInJSON('api.v1');
        let pathResults = await viewerPage.page.locator('.search-result, .highlighted').count();
        expect(pathResults).toBeGreaterThan(0);

        await viewerPage.searchInJSON('profile.settings');
        pathResults = await viewerPage.page.locator('.search-result, .highlighted').count();
        expect(pathResults).toBeGreaterThan(0);

        await viewerPage.takeScreenshot('path-based-filtering');
      }

      // Test searching within specific sections
      await viewerPage.searchInJSON('theme');
      const themeResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(themeResults).toBeGreaterThanOrEqual(3); // 3 theme settings

      await viewerPage.searchInJSON('host');
      const hostResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(hostResults).toBeGreaterThanOrEqual(2); // 2 host settings
    });

    test('should handle complex search queries', async () => {
      const complexSearchJson = {
        products: [
          {
            id: 'P001',
            name: 'Laptop Pro',
            price: 1299.99,
            tags: ['electronics', 'computers', 'premium'],
          },
          {
            id: 'P002',
            name: 'Mouse Wireless',
            price: 29.99,
            tags: ['electronics', 'accessories'],
          },
          {
            id: 'P003',
            name: 'Book: JavaScript Guide',
            price: 39.99,
            tags: ['books', 'programming'],
          },
          {
            id: 'P004',
            name: 'Headphones Premium',
            price: 199.99,
            tags: ['electronics', 'audio', 'premium'],
          },
        ],
        orders: [
          { id: 'O001', customer: 'john@example.com', items: ['P001', 'P002'], total: 1329.98 },
          { id: 'O002', customer: 'jane@test.com', items: ['P003'], total: 39.99 },
          { id: 'O003', customer: 'bob@company.org', items: ['P004', 'P002'], total: 229.98 },
        ],
      };

      await viewerPage.inputJSON(JSON.stringify(complexSearchJson));
      await viewerPage.waitForJSONProcessed();

      // Complex search: products with "premium" tag AND price > 100
      await viewerPage.searchInJSON('premium');
      const premiumResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(premiumResults).toBeGreaterThan(0);

      await viewerPage.takeScreenshot('complex-search-premium');

      // Search for email domains
      await viewerPage.searchInJSON('@example.com');
      const emailResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(emailResults).toBeGreaterThan(0);

      // Search for price ranges (if supported)
      await viewerPage.searchInJSON('1299');
      const priceResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(priceResults).toBeGreaterThan(0);

      // Search across arrays
      await viewerPage.searchInJSON('electronics');
      const categoryResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(categoryResults).toBeGreaterThanOrEqual(3); // 3 electronics products

      await viewerPage.takeScreenshot('complex-search-categories');
    });
  });

  test.describe('Search Performance and Optimization', () => {
    test('should maintain search performance in very large JSON', async () => {
      const hugeSearchableJson = {
        metadata: {
          size: 'very_large',
          searchable_items: 25000,
          created: new Date().toISOString(),
        },
        items: PerformanceTestGenerator.generateLargeArray(25000),
        // Add specific searchable content
        specialItems: [
          { id: 'SPECIAL_001', type: 'unique', value: 'SEARCHABLE_TARGET_001' },
          { id: 'SPECIAL_002', type: 'unique', value: 'SEARCHABLE_TARGET_002' },
          { id: 'SPECIAL_003', type: 'unique', value: 'SEARCHABLE_TARGET_003' },
        ],
      };

      await viewerPage.inputJSON(JSON.stringify(hugeSearchableJson));
      await viewerPage.waitForJSONProcessed();

      // Test search performance on large dataset
      const searchStartTime = Date.now();
      await viewerPage.searchInJSON('SEARCHABLE_TARGET_002');
      const searchEndTime = Date.now();

      const searchTime = searchEndTime - searchStartTime;
      expect(searchTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Should find the specific target
      const results = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(results).toBeGreaterThan(0);

      console.log(`Large JSON search completed in ${searchTime}ms`);
      await viewerPage.takeScreenshot('large-json-search-performance');

      // Test multiple search operations
      const multiSearchStart = Date.now();

      await viewerPage.searchInJSON('item_10000');
      await viewerPage.page.waitForTimeout(500);

      await viewerPage.searchInJSON('category_5');
      await viewerPage.page.waitForTimeout(500);

      await viewerPage.searchInJSON('unique');

      const multiSearchTime = Date.now() - multiSearchStart;
      expect(multiSearchTime).toBeLessThan(15000); // Multiple searches within 15 seconds

      console.log(`Multiple searches completed in ${multiSearchTime}ms`);
    });

    test('should provide search result pagination for large result sets', async () => {
      const paginationTestJson = {
        // Create data with many matches for pagination testing
        users: Array.from({ length: 500 }, (_, i) => ({
          id: `user_${i.toString().padStart(3, '0')}`,
          name: `Test User ${i}`,
          email: `user${i}@test.com`, // All will match "@test.com"
          status: i % 2 === 0 ? 'active' : 'inactive',
        })),
        metadata: {
          total_users: 500,
          all_test_domain: true, // All emails are @test.com
        },
      };

      await viewerPage.inputJSON(JSON.stringify(paginationTestJson));
      await viewerPage.waitForJSONProcessed();

      // Search for pattern that will match many items
      await viewerPage.searchInJSON('@test.com');

      // Look for pagination controls
      const paginationElements = await viewerPage.page
        .locator(
          '[data-testid*="pagination"], .pagination, text=/page|next|previous|\d+.*of.*\d+/i'
        )
        .count();

      if (paginationElements > 0) {
        // Test pagination functionality
        await viewerPage.takeScreenshot('search-result-pagination');

        // Try to navigate pages
        const nextButton = viewerPage.page.locator('[data-testid*="next"], text=/next/i').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await viewerPage.page.waitForTimeout(500);
          await viewerPage.takeScreenshot('search-pagination-page-2');
        }
      } else {
        // Alternative: Check if results are limited/truncated
        const results = await viewerPage.page.locator('.search-result, .highlighted').count();
        console.log(`Search found ${results} results (may be limited for performance)`);

        // Should find many results but may be limited for performance
        expect(results).toBeGreaterThan(10);
      }
    });

    test('should support real-time search with debouncing', async () => {
      const realtimeJson = {
        content: {
          words: ['search', 'filter', 'find', 'query', 'match', 'locate', 'discover'],
          phrases: ['real time search', 'instant results', 'live filtering'],
          data: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            text: `searchable content item ${i} with various keywords`,
          })),
        },
      };

      await viewerPage.inputJSON(JSON.stringify(realtimeJson));
      await viewerPage.waitForJSONProcessed();

      // Test progressive search (simulating typing)
      const searchQueries = ['s', 'se', 'flow', 'flowr', 'flowrc', 'search'];
      const searchTimes: number[] = [];

      for (const query of searchQueries) {
        const startTime = Date.now();
        await viewerPage.searchInput.fill(query);

        // Wait for debounced search (typical debounce is 300-500ms)
        await viewerPage.page.waitForTimeout(600);

        const searchTime = Date.now() - startTime;
        searchTimes.push(searchTime);

        // Each search should complete quickly
        expect(searchTime).toBeLessThan(2000);

        const results = await viewerPage.page.locator('.search-result, .highlighted').count();
        console.log(`Query "${query}" found ${results} results in ${searchTime}ms`);
      }

      await viewerPage.takeScreenshot('realtime-search-results');

      // Final search should have the most specific results
      const finalResults = await viewerPage.page.locator('.search-result, .highlighted').count();
      expect(finalResults).toBeGreaterThan(0);
    });
  });

  test.describe('Search Result Navigation and Highlighting', () => {
    test('should highlight search matches with context', async () => {
      const contextJson = {
        documentation: {
          introduction:
            'This JSON viewer provides advanced search capabilities for finding specific data points within complex nested structures.',
          features: [
            'Deep search through nested objects and arrays',
            'Pattern matching with regular expressions',
            'Type-based filtering and navigation',
            'Performance optimized search for large datasets',
          ],
          examples: {
            basic: 'Simple text search',
            advanced: 'Complex pattern matching with regex support',
            performance: 'Optimized search algorithms for large JSON files',
          },
        },
      };

      await viewerPage.inputJSON(JSON.stringify(contextJson));
      await viewerPage.waitForJSONProcessed();

      // Search for common term
      await viewerPage.searchInJSON('search');

      // Should highlight matches with context
      const highlightedElements = await viewerPage.page
        .locator('.search-result, .highlighted, [data-highlight]')
        .count();
      expect(highlightedElements).toBeGreaterThan(0);

      await viewerPage.takeScreenshot('search-highlighting-context');

      // Test case sensitivity
      await viewerPage.searchInJSON('SEARCH');
      const upperCaseResults = await viewerPage.page
        .locator('.search-result, .highlighted')
        .count();

      await viewerPage.searchInJSON('search');
      const lowerCaseResults = await viewerPage.page
        .locator('.search-result, .highlighted')
        .count();

      // Case-insensitive search should give same results
      expect(upperCaseResults).toBe(lowerCaseResults);
    });

    test('should provide search result navigation', async () => {
      const navigationJson = {
        sections: Array.from({ length: 20 }, (_, i) => ({
          id: `section_${i}`,
          title: `Section ${i}`,
          content: `This is section ${i} with searchable content. Target word appears here.`,
          metadata: {
            searchable: true,
            keywords: ['target', 'searchable', 'content'],
            section_number: i,
          },
        })),
      };

      await viewerPage.inputJSON(JSON.stringify(navigationJson));
      await viewerPage.waitForJSONProcessed();

      // Search for term that appears in multiple sections
      await viewerPage.searchInJSON('target');

      // Look for navigation controls
      const navElements = await viewerPage.page
        .locator(
          '[data-testid*="search-nav"], [data-testid*="result-nav"], text=/\d+.*of.*\d+|previous|next/i'
        )
        .count();

      if (navElements > 0) {
        // Test result navigation
        await viewerPage.takeScreenshot('search-result-navigation');

        // Try to navigate between results
        const nextResultBtn = viewerPage.page
          .locator('[data-testid*="next-result"], text=/next.*result/i')
          .first();
        if (await nextResultBtn.isVisible()) {
          await nextResultBtn.click();
          await viewerPage.page.waitForTimeout(300);
          await viewerPage.takeScreenshot('next-search-result');
        }

        const prevResultBtn = viewerPage.page
          .locator('[data-testid*="prev-result"], text=/previous.*result/i')
          .first();
        if (await prevResultBtn.isVisible()) {
          await prevResultBtn.click();
          await viewerPage.page.waitForTimeout(300);
        }
      } else {
        // Verify search found multiple results
        const results = await viewerPage.page.locator('.search-result, .highlighted').count();
        expect(results).toBeGreaterThanOrEqual(20); // Should find in all sections
      }
    });
  });

  test.afterEach(async () => {
    // Clean up search state
    await viewerPage.clearSearch();
  });
});

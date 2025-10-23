import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Developer - Library API Access', () => {
  test.describe('Library Content Retrieval', () => {
    test('should access and browse library via REST API with comprehensive filtering', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      // First, ensure we have some public content to test with
      await authHelper.loginAPI('developer');

      // Create several public JSON examples for testing
      const publicJsons = [
        {
          content: JSON_SAMPLES.ecommerce.content,
          title: 'E-commerce Order Example',
          description: 'Complete e-commerce order with customer, items, and payment details',
          category: 'API Response',
          tags: ['ecommerce', 'order', 'payment', 'example'],
        },
        {
          content: JSON_SAMPLES.analytics.content,
          title: 'Website Analytics Data',
          description: 'Monthly website analytics with traffic sources and user metrics',
          category: 'Analytics',
          tags: ['analytics', 'metrics', 'website', 'traffic'],
        },
        {
          content: JSON_SAMPLES.configuration.content,
          title: 'Application Configuration',
          description: 'Full application configuration with database, auth, and features',
          category: 'Configuration',
          tags: ['config', 'database', 'auth', 'settings'],
        },
        {
          content: JSON_SAMPLES.apiResponse.content,
          title: 'User Management API Response',
          description: 'API response for user management with pagination and metadata',
          category: 'API Response',
          tags: ['api', 'users', 'pagination', 'response'],
        },
      ];

      const createdJsons = [];
      for (const json of publicJsons) {
        const response = await apiHelper.apiCall('POST', '/api/json/create', {
          data: { ...json, isPublic: true },
          expectedStatus: 201,
        });
        createdJsons.push(response.data);
      }

      // Test basic library listing
      const libraryResponse = await apiHelper.apiCall('GET', '/api/saved', {
        expectedStatus: 200,
      });

      expect(libraryResponse.data).toHaveProperty('items');
      expect(libraryResponse.data).toHaveProperty('pagination');
      expect(Array.isArray(libraryResponse.data.items)).toBe(true);
      expect(libraryResponse.data.items.length).toBeGreaterThan(0);

      // Test pagination
      const paginatedResponse = await apiHelper.apiCall('GET', '/api/saved', {
        params: {
          page: '1',
          limit: '2',
          sortBy: 'created',
          sortOrder: 'desc',
        },
        expectedStatus: 200,
      });

      expect(paginatedResponse.data.items).toHaveLength(2);
      expect(paginatedResponse.data.pagination).toHaveProperty('page', 1);
      expect(paginatedResponse.data.pagination).toHaveProperty('limit', 2);
      expect(paginatedResponse.data.pagination).toHaveProperty('total');
      expect(paginatedResponse.data.pagination).toHaveProperty('totalPages');

      // Test filtering by category
      const categoryResponse = await apiHelper.apiCall('GET', '/api/saved', {
        params: {
          category: 'API Response',
          limit: '10',
        },
        expectedStatus: 200,
      });

      expect(categoryResponse.data.items.length).toBeGreaterThanOrEqual(2);
      categoryResponse.data.items.forEach((item) => {
        expect(item.category).toBe('API Response');
      });

      // Test filtering by tags
      const tagResponse = await apiHelper.apiCall('GET', '/api/saved', {
        params: {
          tags: 'ecommerce,analytics',
          operator: 'OR',
          limit: '10',
        },
        expectedStatus: 200,
      });

      expect(tagResponse.data.items.length).toBeGreaterThanOrEqual(2);
      tagResponse.data.items.forEach((item) => {
        const hasTags = item.tags.some((tag) => ['ecommerce', 'analytics'].includes(tag));
        expect(hasTags).toBe(true);
      });

      // Test search functionality
      const searchResponse = await apiHelper.apiCall('GET', '/api/library/search', {
        params: {
          q: 'configuration database',
          searchFields: 'title,description,tags',
          limit: '5',
        },
        expectedStatus: 200,
      });

      expect(searchResponse.data).toHaveProperty('results');
      expect(searchResponse.data).toHaveProperty('query', 'configuration database');
      expect(searchResponse.data.results.length).toBeGreaterThan(0);

      // Test advanced filtering
      const advancedResponse = await apiHelper.apiCall('POST', '/api/library/filter', {
        data: {
          filters: {
            category: ['API Response', 'Configuration'],
            tags: {
              include: ['api', 'config'],
              exclude: ['deprecated'],
            },
            dateRange: {
              from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
              to: new Date().toISOString(),
            },
            complexity: {
              minNodes: 10,
              maxDepth: 15,
            },
          },
          sort: {
            field: 'popularity',
            order: 'desc',
          },
          limit: 10,
          offset: 0,
        },
        expectedStatus: 200,
      });

      expect(advancedResponse.data).toHaveProperty('items');
      expect(advancedResponse.data).toHaveProperty('totalMatched');
      expect(advancedResponse.data.items.length).toBeGreaterThan(0);
    });

    test('should retrieve individual JSON examples from library with metadata', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Create a detailed public JSON for testing
      const detailedJson = {
        content: {
          ...JSON_SAMPLES.ecommerce.content,
          metadata: {
            created: new Date().toISOString(),
            version: '1.0.0',
            schema: 'ecommerce-order-v1',
          },
        },
        title: 'Detailed E-commerce Example',
        description: 'A comprehensive e-commerce order example with full metadata',
        category: 'API Response',
        tags: ['ecommerce', 'detailed', 'metadata', 'example'],
        isPublic: true,
      };

      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: detailedJson,
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Test retrieving full JSON content
      const contentResponse = await apiHelper.apiCall('GET', `/api/library/${jsonId}`, {
        expectedStatus: 200,
      });

      expect(contentResponse.data).toHaveProperty('id', jsonId);
      expect(contentResponse.data).toHaveProperty('title', detailedJson.title);
      expect(contentResponse.data).toHaveProperty('description', detailedJson.description);
      expect(contentResponse.data).toHaveProperty('category', detailedJson.category);
      expect(contentResponse.data).toHaveProperty('tags');
      expect(contentResponse.data).toHaveProperty('content');
      expect(contentResponse.data).toHaveProperty('metadata');
      expect(contentResponse.data).toHaveProperty('stats');

      // Test retrieving just metadata without content
      const metadataResponse = await apiHelper.apiCall('GET', `/api/library/${jsonId}/metadata`, {
        expectedStatus: 200,
      });

      expect(metadataResponse.data).toHaveProperty('id', jsonId);
      expect(metadataResponse.data).toHaveProperty('title');
      expect(metadataResponse.data).toHaveProperty('stats');
      expect(metadataResponse.data).not.toHaveProperty('content');

      // Test retrieving only the JSON content
      const rawContentResponse = await apiHelper.apiCall('GET', `/api/library/${jsonId}/content`, {
        expectedStatus: 200,
      });

      expect(rawContentResponse.data).toHaveProperty('order');
      expect(rawContentResponse.data.metadata).toHaveProperty('version', '1.0.0');

      // Test different content formats
      const formats = ['json', 'pretty', 'minified', 'yaml'];

      for (const format of formats) {
        const formatResponse = await apiHelper.apiCall('GET', `/api/library/${jsonId}/content`, {
          params: { format },
          expectedStatus: 200,
        });

        expect(formatResponse.status).toBe(200);

        if (format === 'pretty') {
          expect(typeof formatResponse.data).toBe('string');
          expect(formatResponse.data).toContain('\\n'); // Should have newlines for pretty printing
        } else if (format === 'minified') {
          expect(typeof formatResponse.data).toBe('string');
          expect(formatResponse.data).not.toContain('\\n'); // Should be minified
        }
      }

      // Test retrieving JSON schema/structure
      const schemaResponse = await apiHelper.apiCall('GET', `/api/library/${jsonId}/schema`, {
        expectedStatus: 200,
      });

      expect(schemaResponse.data).toHaveProperty('schema');
      expect(schemaResponse.data).toHaveProperty('structure');
      expect(schemaResponse.data.schema).toHaveProperty('type');
      expect(schemaResponse.data.structure).toHaveProperty('nodeCount');
      expect(schemaResponse.data.structure).toHaveProperty('maxDepth');

      // Test analytics for public JSON
      const analyticsResponse = await apiHelper.apiCall('GET', `/api/library/${jsonId}/analytics`, {
        expectedStatus: 200,
      });

      expect(analyticsResponse.data).toHaveProperty('views');
      expect(analyticsResponse.data).toHaveProperty('downloads');
      expect(analyticsResponse.data).toHaveProperty('embeds');
      expect(analyticsResponse.data).toHaveProperty('popularity');

      // Increment view count and verify
      await apiHelper.apiCall('POST', `/api/library/${jsonId}/view`, {
        data: {
          referrer: 'test-suite',
          userAgent: 'Test Browser',
        },
        expectedStatus: 200,
      });

      const updatedAnalytics = await apiHelper.apiCall('GET', `/api/library/${jsonId}/analytics`, {
        expectedStatus: 200,
      });

      expect(updatedAnalytics.data.views).toBeGreaterThan(analyticsResponse.data.views);
    });

    test('should support bulk operations and batch retrieval from library', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Create multiple public JSONs for bulk testing
      const bulkJsons = [];
      for (let i = 0; i < 5; i++) {
        const response = await apiHelper.apiCall('POST', '/api/json/create', {
          data: {
            content: { bulkTest: true, index: i, data: `bulk-item-${i}` },
            title: `Bulk Test JSON ${i}`,
            description: `Bulk test item number ${i}`,
            category: 'Test Data',
            tags: ['bulk', 'test', `item-${i}`],
            isPublic: true,
          },
          expectedStatus: 201,
        });
        bulkJsons.push(response.data.id);
      }

      // Test bulk retrieval by IDs
      const bulkRetrievalResponse = await apiHelper.apiCall('POST', '/api/library/bulk', {
        data: {
          ids: bulkJsons,
          includeContent: true,
          includeMetadata: true,
          includeStats: false,
        },
        expectedStatus: 200,
      });

      expect(bulkRetrievalResponse.data).toHaveProperty('items');
      expect(bulkRetrievalResponse.data.items).toHaveLength(5);

      bulkRetrievalResponse.data.items.forEach((item, index) => {
        expect(item).toHaveProperty('id', bulkJsons[index]);
        expect(item).toHaveProperty('content');
        expect(item).toHaveProperty('metadata');
        expect(item).not.toHaveProperty('stats');
      });

      // Test bulk metadata retrieval
      const bulkMetadataResponse = await apiHelper.apiCall('POST', '/api/library/bulk-metadata', {
        data: {
          ids: bulkJsons.slice(0, 3),
          fields: ['title', 'description', 'category', 'tags', 'created'],
        },
        expectedStatus: 200,
      });

      expect(bulkMetadataResponse.data.items).toHaveLength(3);
      bulkMetadataResponse.data.items.forEach((item) => {
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('category');
        expect(item).not.toHaveProperty('content');
      });

      // Test bulk download in different formats
      const bulkDownloadResponse = await apiHelper.apiCall('POST', '/api/library/bulk-download', {
        data: {
          ids: bulkJsons.slice(0, 2),
          format: 'zip',
          includeMetadata: true,
          naming: 'title',
        },
        expectedStatus: 200,
      });

      expect(bulkDownloadResponse.status).toBe(200);
      expect(bulkDownloadResponse.response.headers()['content-type']).toContain('application/zip');

      // Test collection creation and retrieval
      const collectionResponse = await apiHelper.apiCall('POST', '/api/library/collections', {
        data: {
          name: 'Bulk Test Collection',
          description: 'Collection of bulk test items',
          items: bulkJsons,
          isPublic: true,
        },
        expectedStatus: 201,
      });

      const collectionId = collectionResponse.data.id;

      // Retrieve the collection
      const retrieveCollectionResponse = await apiHelper.apiCall(
        'GET',
        `/api/library/collections/${collectionId}`,
        {
          expectedStatus: 200,
        }
      );

      expect(retrieveCollectionResponse.data).toHaveProperty('name', 'Bulk Test Collection');
      expect(retrieveCollectionResponse.data).toHaveProperty('items');
      expect(retrieveCollectionResponse.data.items).toHaveLength(5);
    });
  });

  test.describe('Library Categories and Tags', () => {
    test('should retrieve and manage category and tag hierarchies', async ({ apiHelper }) => {
      // Get all available categories
      const categoriesResponse = await apiHelper.apiCall('GET', '/api/library/categories', {
        expectedStatus: 200,
      });

      expect(categoriesResponse.data).toHaveProperty('categories');
      expect(Array.isArray(categoriesResponse.data.categories)).toBe(true);

      const categories = categoriesResponse.data.categories;
      expect(categories.length).toBeGreaterThan(0);

      categories.forEach((category) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('count');
        expect(category).toHaveProperty('description');
      });

      // Get category details with examples
      const firstCategory = categories[0];
      const categoryDetailResponse = await apiHelper.apiCall(
        'GET',
        `/api/library/categories/${firstCategory.name}`,
        {
          expectedStatus: 200,
        }
      );

      expect(categoryDetailResponse.data).toHaveProperty('category');
      expect(categoryDetailResponse.data).toHaveProperty('examples');
      expect(categoryDetailResponse.data).toHaveProperty('commonTags');
      expect(categoryDetailResponse.data).toHaveProperty('subcategories');

      // Test tag cloud and popular tags
      const tagsResponse = await apiHelper.apiCall('GET', '/api/library/tags', {
        params: {
          limit: '50',
          minCount: '2',
          sortBy: 'popularity',
        },
        expectedStatus: 200,
      });

      expect(tagsResponse.data).toHaveProperty('tags');
      expect(Array.isArray(tagsResponse.data.tags)).toBe(true);

      tagsResponse.data.tags.forEach((tag) => {
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('count');
        expect(tag.count).toBeGreaterThanOrEqual(2);
      });

      // Test tag suggestions and auto-complete
      const tagSuggestionsResponse = await apiHelper.apiCall(
        'GET',
        '/api/library/tags/suggestions',
        {
          params: {
            query: 'api',
            limit: '10',
            category: 'API Response',
          },
          expectedStatus: 200,
        }
      );

      expect(tagSuggestionsResponse.data).toHaveProperty('suggestions');
      expect(Array.isArray(tagSuggestionsResponse.data.suggestions)).toBe(true);

      // Test related tags
      if (tagsResponse.data.tags.length > 0) {
        const firstTag = tagsResponse.data.tags[0].name;
        const relatedTagsResponse = await apiHelper.apiCall(
          'GET',
          `/api/library/tags/${firstTag}/related`,
          {
            params: { limit: '10' },
            expectedStatus: 200,
          }
        );

        expect(relatedTagsResponse.data).toHaveProperty('relatedTags');
        expect(Array.isArray(relatedTagsResponse.data.relatedTags)).toBe(true);
      }

      // Test tag hierarchy and parent-child relationships
      const tagHierarchyResponse = await apiHelper.apiCall('GET', '/api/library/tags/hierarchy', {
        expectedStatus: 200,
      });

      expect(tagHierarchyResponse.data).toHaveProperty('hierarchy');
      expect(tagHierarchyResponse.data.hierarchy).toHaveProperty('root');
    });

    test('should support trending and featured content discovery', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Create some content and simulate interactions to generate trending data
      const trendingContent = [
        {
          content: { trending: true, type: 'hot', data: 'trending-item-1' },
          title: 'Hot Trending JSON 1',
          category: 'Example',
          tags: ['trending', 'hot', 'popular'],
        },
        {
          content: { trending: true, type: 'rising', data: 'trending-item-2' },
          title: 'Rising Trending JSON 2',
          category: 'Example',
          tags: ['trending', 'rising', 'new'],
        },
      ];

      const trendingIds = [];
      for (const content of trendingContent) {
        const response = await apiHelper.apiCall('POST', '/api/json/create', {
          data: { ...content, isPublic: true },
          expectedStatus: 201,
        });
        trendingIds.push(response.data.id);

        // Simulate views to make it trending
        for (let i = 0; i < 10; i++) {
          await apiHelper.apiCall('POST', `/api/library/${response.data.id}/view`, {
            data: { referrer: `trending-test-${i}` },
            expectedStatus: 200,
          });
        }
      }

      // Get trending content
      const trendingResponse = await apiHelper.apiCall('GET', '/api/library/trending', {
        params: {
          timeframe: '7d',
          limit: '10',
          category: 'all',
        },
        expectedStatus: 200,
      });

      expect(trendingResponse.data).toHaveProperty('trending');
      expect(trendingResponse.data).toHaveProperty('timeframe', '7d');
      expect(Array.isArray(trendingResponse.data.trending)).toBe(true);

      // Get featured content
      const featuredResponse = await apiHelper.apiCall('GET', '/api/library/featured', {
        expectedStatus: 200,
      });

      expect(featuredResponse.data).toHaveProperty('featured');
      expect(Array.isArray(featuredResponse.data.featured)).toBe(true);

      // Get recently added content
      const recentResponse = await apiHelper.apiCall('GET', '/api/library/recent', {
        params: {
          limit: '20',
          category: 'all',
        },
        expectedStatus: 200,
      });

      expect(recentResponse.data).toHaveProperty('recent');
      expect(recentResponse.data.recent.length).toBeGreaterThan(0);

      // Get popular content by different metrics
      const popularityMetrics = ['views', 'downloads', 'embeds', 'stars'];

      for (const metric of popularityMetrics) {
        const popularResponse = await apiHelper.apiCall('GET', '/api/library/popular', {
          params: {
            metric,
            timeframe: '30d',
            limit: '10',
          },
          expectedStatus: 200,
        });

        expect(popularResponse.data).toHaveProperty('popular');
        expect(popularResponse.data).toHaveProperty('metric', metric);
        expect(Array.isArray(popularResponse.data.popular)).toBe(true);
      }

      // Test content recommendations based on content
      if (trendingIds.length > 0) {
        const recommendationsResponse = await apiHelper.apiCall(
          'GET',
          `/api/library/${trendingIds[0]}/recommendations`,
          {
            params: {
              algorithm: 'content-based',
              limit: '5',
            },
            expectedStatus: 200,
          }
        );

        expect(recommendationsResponse.data).toHaveProperty('recommendations');
        expect(Array.isArray(recommendationsResponse.data.recommendations)).toBe(true);
      }
    });
  });

  test.describe('Library Search and Analytics', () => {
    test('should provide comprehensive search capabilities with faceted search', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Create diverse content for search testing
      const searchTestContent = [
        {
          content: { searchTest: true, type: 'user-management', users: ['admin', 'user'] },
          title: 'User Management System API',
          description: 'Complete user management API with authentication and authorization',
          category: 'API Response',
          tags: ['api', 'users', 'authentication', 'management'],
        },
        {
          content: {
            searchTest: true,
            type: 'data-analytics',
            metrics: { views: 1000, clicks: 250 },
          },
          title: 'Data Analytics Dashboard',
          description: 'Analytics dashboard data with metrics and visualizations',
          category: 'Analytics',
          tags: ['analytics', 'dashboard', 'metrics', 'visualization'],
        },
        {
          content: {
            searchTest: true,
            type: 'config-file',
            database: { host: 'localhost', port: 5432 },
          },
          title: 'Application Configuration File',
          description: 'Production application configuration with database settings',
          category: 'Configuration',
          tags: ['config', 'database', 'production', 'settings'],
        },
      ];

      for (const content of searchTestContent) {
        await apiHelper.apiCall('POST', '/api/json/create', {
          data: { ...content, isPublic: true },
          expectedStatus: 201,
        });
      }

      // Test basic text search
      const textSearchResponse = await apiHelper.apiCall('GET', '/api/library/search', {
        params: {
          q: 'user management api',
          fields: 'title,description,content',
          limit: '10',
        },
        expectedStatus: 200,
      });

      expect(textSearchResponse.data).toHaveProperty('query', 'user management api');
      expect(textSearchResponse.data).toHaveProperty('results');
      expect(textSearchResponse.data).toHaveProperty('facets');
      expect(textSearchResponse.data.results.length).toBeGreaterThan(0);

      // Test faceted search
      const facetedSearchResponse = await apiHelper.apiCall('POST', '/api/library/search/faceted', {
        data: {
          query: 'analytics',
          facets: {
            category: ['Analytics', 'API Response'],
            tags: ['analytics', 'api'],
            dateRange: {
              field: 'created',
              from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              to: new Date().toISOString(),
            },
          },
          sort: {
            field: 'relevance',
            order: 'desc',
          },
          limit: 20,
          offset: 0,
          highlight: {
            fields: ['title', 'description'],
            fragments: 3,
          },
        },
        expectedStatus: 200,
      });

      expect(facetedSearchResponse.data).toHaveProperty('results');
      expect(facetedSearchResponse.data).toHaveProperty('facets');
      expect(facetedSearchResponse.data).toHaveProperty('totalHits');

      // Verify highlighting in results
      if (facetedSearchResponse.data.results.length > 0) {
        const firstResult = facetedSearchResponse.data.results[0];
        expect(firstResult).toHaveProperty('highlights');
      }

      // Test advanced search with boolean operators
      const advancedSearchResponse = await apiHelper.apiCall(
        'POST',
        '/api/library/search/advanced',
        {
          data: {
            query: {
              bool: {
                must: [{ match: { title: 'management' } }, { match: { category: 'API Response' } }],
                should: [
                  { match: { tags: 'authentication' } },
                  { match: { description: 'authorization' } },
                ],
                must_not: [{ match: { tags: 'deprecated' } }],
              },
            },
            aggregations: {
              categories: {
                terms: { field: 'category' },
              },
              tags: {
                terms: { field: 'tags', size: 20 },
              },
              dateHistogram: {
                date_histogram: {
                  field: 'created',
                  interval: 'day',
                },
              },
            },
          },
          expectedStatus: 200,
        }
      );

      expect(advancedSearchResponse.data).toHaveProperty('results');
      expect(advancedSearchResponse.data).toHaveProperty('aggregations');

      // Test search suggestions and autocomplete
      const suggestionsResponse = await apiHelper.apiCall(
        'GET',
        '/api/library/search/suggestions',
        {
          params: {
            q: 'analyt',
            suggestionTypes: 'completion,phrase,term',
            limit: '10',
          },
          expectedStatus: 200,
        }
      );

      expect(suggestionsResponse.data).toHaveProperty('suggestions');
      expect(suggestionsResponse.data.suggestions).toHaveProperty('completion');
      expect(suggestionsResponse.data.suggestions).toHaveProperty('phrase');
      expect(suggestionsResponse.data.suggestions).toHaveProperty('term');

      // Test saved searches and search history
      const saveSearchResponse = await apiHelper.apiCall('POST', '/api/library/search/save', {
        data: {
          name: 'My Analytics Search',
          query: 'analytics dashboard',
          filters: { category: 'Analytics' },
          isPublic: false,
        },
        expectedStatus: 201,
      });

      expect(saveSearchResponse.data).toHaveProperty('savedSearchId');

      const savedSearchesResponse = await apiHelper.apiCall('GET', '/api/library/search/saved', {
        expectedStatus: 200,
      });

      expect(savedSearchesResponse.data).toHaveProperty('savedSearches');
      expect(Array.isArray(savedSearchesResponse.data.savedSearches)).toBe(true);
    });

    test('should provide detailed analytics and usage statistics for library', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Create content for analytics testing
      const analyticsContent = {
        content: { analytics: true, data: 'analytics-test' },
        title: 'Analytics Test JSON',
        description: 'JSON for testing analytics functionality',
        category: 'Test Data',
        tags: ['analytics', 'test', 'statistics'],
        isPublic: true,
      };

      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: analyticsContent,
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Simulate various interactions
      const interactions = [
        { type: 'view', count: 25 },
        { type: 'download', count: 5 },
        { type: 'embed', count: 3 },
        { type: 'share', count: 2 },
      ];

      for (const interaction of interactions) {
        for (let i = 0; i < interaction.count; i++) {
          await apiHelper.apiCall('POST', `/api/library/${jsonId}/${interaction.type}`, {
            data: {
              referrer: `test-referrer-${i}`,
              userAgent: 'Test Analytics Browser',
              country: 'US',
              region: 'CA',
            },
            expectedStatus: 200,
          });
        }
      }

      // Test individual JSON analytics
      const jsonAnalyticsResponse = await apiHelper.apiCall(
        'GET',
        `/api/library/${jsonId}/analytics`,
        {
          params: {
            timeframe: '30d',
            granularity: 'day',
            includeGeo: 'true',
            includeReferrers: 'true',
          },
          expectedStatus: 200,
        }
      );

      expect(jsonAnalyticsResponse.data).toHaveProperty('views');
      expect(jsonAnalyticsResponse.data).toHaveProperty('downloads');
      expect(jsonAnalyticsResponse.data).toHaveProperty('embeds');
      expect(jsonAnalyticsResponse.data).toHaveProperty('shares');
      expect(jsonAnalyticsResponse.data).toHaveProperty('geography');
      expect(jsonAnalyticsResponse.data).toHaveProperty('referrers');
      expect(jsonAnalyticsResponse.data).toHaveProperty('timeline');

      expect(jsonAnalyticsResponse.data.views).toBeGreaterThanOrEqual(25);
      expect(jsonAnalyticsResponse.data.downloads).toBeGreaterThanOrEqual(5);

      // Test library-wide analytics
      const libraryAnalyticsResponse = await apiHelper.apiCall(
        'GET',
        '/api/library/analytics/overview',
        {
          params: {
            timeframe: '7d',
            includeBreakdowns: 'true',
          },
          expectedStatus: 200,
        }
      );

      expect(libraryAnalyticsResponse.data).toHaveProperty('totalViews');
      expect(libraryAnalyticsResponse.data).toHaveProperty('totalDownloads');
      expect(libraryAnalyticsResponse.data).toHaveProperty('totalItems');
      expect(libraryAnalyticsResponse.data).toHaveProperty('activeUsers');
      expect(libraryAnalyticsResponse.data).toHaveProperty('topCategories');
      expect(libraryAnalyticsResponse.data).toHaveProperty('topTags');
      expect(libraryAnalyticsResponse.data).toHaveProperty('popularItems');

      // Test category analytics
      const categoryAnalyticsResponse = await apiHelper.apiCall(
        'GET',
        '/api/library/analytics/categories',
        {
          expectedStatus: 200,
        }
      );

      expect(categoryAnalyticsResponse.data).toHaveProperty('categories');
      expect(Array.isArray(categoryAnalyticsResponse.data.categories)).toBe(true);

      categoryAnalyticsResponse.data.categories.forEach((category) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('totalItems');
        expect(category).toHaveProperty('totalViews');
        expect(category).toHaveProperty('averageRating');
      });

      // Test usage trends
      const trendsResponse = await apiHelper.apiCall('GET', '/api/library/analytics/trends', {
        params: {
          metrics: 'views,downloads,uploads',
          timeframe: '30d',
          interval: 'day',
        },
        expectedStatus: 200,
      });

      expect(trendsResponse.data).toHaveProperty('trends');
      expect(trendsResponse.data.trends).toHaveProperty('views');
      expect(trendsResponse.data.trends).toHaveProperty('downloads');
      expect(trendsResponse.data.trends).toHaveProperty('uploads');

      // Test user behavior analytics
      const behaviorResponse = await apiHelper.apiCall('GET', '/api/library/analytics/behavior', {
        params: {
          timeframe: '7d',
          includePathAnalysis: 'true',
          includeSessionData: 'true',
        },
        expectedStatus: 200,
      });

      expect(behaviorResponse.data).toHaveProperty('avgSessionDuration');
      expect(behaviorResponse.data).toHaveProperty('bounceRate');
      expect(behaviorResponse.data).toHaveProperty('topEntryPoints');
      expect(behaviorResponse.data).toHaveProperty('topExitPoints');
      expect(behaviorResponse.data).toHaveProperty('conversionRates');

      // Test real-time analytics
      const realtimeResponse = await apiHelper.apiCall('GET', '/api/library/analytics/realtime', {
        expectedStatus: 200,
      });

      expect(realtimeResponse.data).toHaveProperty('activeUsers');
      expect(realtimeResponse.data).toHaveProperty('currentViews');
      expect(realtimeResponse.data).toHaveProperty('topContent');
      expect(realtimeResponse.data).toHaveProperty('lastUpdate');

      // Test custom analytics reports
      const customReportResponse = await apiHelper.apiCall(
        'POST',
        '/api/library/analytics/reports/custom',
        {
          data: {
            name: 'Test Analytics Report',
            metrics: ['views', 'downloads', 'uniqueUsers'],
            dimensions: ['category', 'country', 'referrer'],
            filters: {
              category: ['Test Data'],
              dateRange: {
                from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                to: new Date().toISOString(),
              },
            },
            sort: {
              metric: 'views',
              order: 'desc',
            },
          },
          expectedStatus: 200,
        }
      );

      expect(customReportResponse.data).toHaveProperty('reportData');
      expect(customReportResponse.data).toHaveProperty('summary');
      expect(customReportResponse.data.reportData).toHaveProperty('rows');
      expect(Array.isArray(customReportResponse.data.reportData.rows)).toBe(true);
    });
  });

  test.describe('Library API Integration and SDKs', () => {
    test('should support API versioning and backward compatibility', async ({ apiHelper }) => {
      const apiVersions = ['v1', 'v2', 'latest'];

      for (const version of apiVersions) {
        // Test version-specific endpoints
        const versionResponse = await apiHelper.apiCall('GET', `/api/${version}/library/public`, {
          expectedStatus: 200,
        });

        expect(versionResponse.data).toHaveProperty('items');
        expect(versionResponse.data).toHaveProperty('version');

        if (version !== 'latest') {
          expect(versionResponse.data.version).toContain(version);
        }

        // Test version-specific features
        if (version === 'v2' || version === 'latest') {
          // v2+ features
          const enhancedResponse = await apiHelper.apiCall(
            'GET',
            `/api/${version}/library/public`,
            {
              params: {
                include: 'metadata,stats,related',
                format: 'enhanced',
              },
              expectedStatus: 200,
            }
          );

          expect(enhancedResponse.data.items[0]).toHaveProperty('metadata');
          expect(enhancedResponse.data.items[0]).toHaveProperty('stats');
        }
      }

      // Test API deprecation warnings
      const deprecatedResponse = await apiHelper.apiCall(
        'GET',
        '/api/v1/library/public/deprecated-endpoint',
        {
          expectedStatus: 200,
        }
      );

      expect(deprecatedResponse.response.headers()['x-api-deprecated']).toBeDefined();
      expect(deprecatedResponse.response.headers()['x-api-sunset']).toBeDefined();
    });

    test('should provide SDK examples and integration guides', async ({ apiHelper }) => {
      // Test SDK documentation endpoints
      const sdkDocsResponse = await apiHelper.apiCall('GET', '/api/docs/sdks', {
        expectedStatus: 200,
      });

      expect(sdkDocsResponse.data).toHaveProperty('sdks');
      expect(Array.isArray(sdkDocsResponse.data.sdks)).toBe(true);

      const supportedSDKs = ['javascript', 'python', 'php', 'ruby', 'go', 'java'];
      supportedSDKs.forEach((sdk) => {
        const sdkInfo = sdkDocsResponse.data.sdks.find((s) => s.language === sdk);
        expect(sdkInfo).toBeDefined();
        expect(sdkInfo).toHaveProperty('version');
        expect(sdkInfo).toHaveProperty('downloadUrl');
        expect(sdkInfo).toHaveProperty('documentation');
      });

      // Test code examples for different languages
      for (const sdk of supportedSDKs.slice(0, 3)) {
        // Test first 3 SDKs
        const examplesResponse = await apiHelper.apiCall('GET', `/api/docs/examples/${sdk}`, {
          expectedStatus: 200,
        });

        expect(examplesResponse.data).toHaveProperty('language', sdk);
        expect(examplesResponse.data).toHaveProperty('examples');
        expect(Array.isArray(examplesResponse.data.examples)).toBe(true);

        const examples = examplesResponse.data.examples;
        expect(examples.some((ex) => ex.operation === 'list-public-library')).toBe(true);
        expect(examples.some((ex) => ex.operation === 'get-json-content')).toBe(true);
        expect(examples.some((ex) => ex.operation === 'search-library')).toBe(true);
      }

      // Test interactive API explorer
      const apiExplorerResponse = await apiHelper.apiCall('GET', '/api/docs/explorer', {
        expectedStatus: 200,
      });

      expect(apiExplorerResponse.data).toHaveProperty('endpoints');
      expect(apiExplorerResponse.data).toHaveProperty('schemas');
      expect(apiExplorerResponse.data).toHaveProperty('examples');

      // Test OpenAPI specification
      const openApiResponse = await apiHelper.apiCall('GET', '/api/docs/openapi.json', {
        expectedStatus: 200,
      });

      expect(openApiResponse.data).toHaveProperty('openapi');
      expect(openApiResponse.data).toHaveProperty('info');
      expect(openApiResponse.data).toHaveProperty('paths');
      expect(openApiResponse.data.paths).toHaveProperty('/api/saved');
    });
  });
});

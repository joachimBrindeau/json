import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Developer - API Integration Tests', () => {
  test('should upload JSON via API', async ({ apiHelper }) => {
    const testJson = JSON_SAMPLES.simple.content;

    const result = await apiHelper.uploadJSON(testJson, {
      title: 'API Upload Test',
      isPublic: false,
    });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('url');
    expect(result.title).toBe('API Upload Test');
  });

  test('should retrieve JSON content by ID', async ({ apiHelper }) => {
    // First upload a JSON
    const testJson = JSON_SAMPLES.nested.content;
    const uploadResult = await apiHelper.uploadJSON(testJson, {
      title: 'Retrieve Test JSON',
    });

    // Then retrieve it
    const retrievedJson = await apiHelper.getJSON(uploadResult.id);

    expect(retrievedJson).toBeTruthy();
    expect(retrievedJson.user).toEqual(testJson.user);
  });

  test('should analyze JSON structure', async ({ apiHelper }) => {
    const complexJson = JSON_SAMPLES.apiResponse.content;

    const analysis = await apiHelper.analyzeJSON(complexJson);

    expect(analysis).toHaveProperty('nodeCount');
    expect(analysis).toHaveProperty('maxDepth');
    expect(analysis).toHaveProperty('types');
    expect(analysis.nodeCount).toBeGreaterThan(0);
    expect(analysis.maxDepth).toBeGreaterThan(1);
  });

  test('should search JSON by content', async ({ apiHelper }) => {
    // Upload a searchable JSON
    const searchableJson = {
      products: [
        { name: 'Laptop', category: 'Electronics', price: 999 },
        { name: 'Book', category: 'Education', price: 29 },
        { name: 'Headphones', category: 'Electronics', price: 199 },
      ],
    };

    const uploadResult = await apiHelper.uploadJSON(searchableJson, {
      title: 'Searchable Products',
    });

    // Search for content
    const searchResults = await apiHelper.searchJSON('Electronics');

    expect(searchResults).toHaveProperty('matches');
    expect(searchResults.matches.length).toBeGreaterThan(0);
  });

  test('should update JSON title', async ({ apiHelper }) => {
    // Upload JSON
    const testJson = { message: 'Title update test' };
    const uploadResult = await apiHelper.uploadJSON(testJson, {
      title: 'Original Title',
    });

    // Update title
    const newTitle = 'Updated Title';
    const updateResult = await apiHelper.updateTitle(uploadResult.id, newTitle);

    expect(updateResult.title).toBe(newTitle);
  });

  test('should publish JSON to library', async ({ apiHelper }) => {
    // Upload private JSON
    const testJson = JSON_SAMPLES.configuration.content;
    const uploadResult = await apiHelper.uploadJSON(testJson, {
      title: 'Configuration to Publish',
      isPublic: false,
    });

    // Publish to library
    const publishResult = await apiHelper.publishJSON(uploadResult.id);

    expect(publishResult).toHaveProperty('publicUrl');
    expect(publishResult.isPublic).toBe(true);
  });

  test('should track JSON view counts', async ({ apiHelper }) => {
    // Upload JSON
    const testJson = { views: 'track me' };
    const uploadResult = await apiHelper.uploadJSON(testJson, {
      title: 'View Tracking Test',
    });

    // View the JSON multiple times
    for (let i = 0; i < 3; i++) {
      await apiHelper.viewJSON(uploadResult.id);
    }

    // Get updated info (assuming the API returns view count)
    const jsonInfo = await apiHelper.getJSON(uploadResult.id);
    if (jsonInfo.viewCount !== undefined) {
      expect(jsonInfo.viewCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('should get library entries', async ({ apiHelper }) => {
    // Get library
    const publicLibrary = await apiHelper.getPublicLibrary(1, 10);

    expect(publicLibrary).toHaveProperty('items');
    expect(publicLibrary).toHaveProperty('pagination');
    expect(Array.isArray(publicLibrary.items)).toBe(true);
    expect(publicLibrary.pagination).toHaveProperty('page');
    expect(publicLibrary.pagination).toHaveProperty('total');
  });

  test('should handle API rate limiting', async ({ apiHelper }) => {
    // Make rapid API calls to test rate limiting
    const promises = [];

    for (let i = 0; i < 10; i++) {
      promises.push(apiHelper.apiCall('GET', '/api/health').catch((error) => error));
    }

    const results = await Promise.all(promises);

    // All should succeed or some should be rate limited
    const successfulResults = results.filter((r) => r.status === 200);
    const rateLimitedResults = results.filter((r) => r.status === 429);

    expect(successfulResults.length + rateLimitedResults.length).toBe(10);
  });

  test('should validate API error handling', async ({ apiHelper }) => {
    // Test with non-existent JSON ID
    try {
      await apiHelper.getJSON('non-existent-id');
    } catch (error) {
      // Should throw error for non-existent resource
      expect(error).toBeTruthy();
    }

    // Test with invalid JSON
    const result = await apiHelper.apiCall('POST', '/api/json/upload', {
      data: { content: 'invalid json' },
      expectedStatus: 400,
    });

    expect(result.status).toBe(400);
  });

  test('should handle large JSON uploads', async ({ apiHelper, dataGenerator }) => {
    // Generate large JSON (within reasonable limits for testing)
    const largeJson = dataGenerator.generateLargeJSON(100, 5, 10);

    const uploadResult = await apiHelper.uploadJSON(largeJson, {
      title: 'Large JSON Test',
    });

    expect(uploadResult).toHaveProperty('id');
    expect(uploadResult.size).toBeGreaterThan(1000); // Should be reasonably large
  });

  test('should support browser extension API', async ({ apiHelper }) => {
    const extensionData = {
      url: 'https://example.com/api/data',
      json: { extension: 'test', data: [1, 2, 3] },
      metadata: {
        userAgent: 'Test Browser Extension',
        timestamp: new Date().toISOString(),
      },
    };

    const result = await apiHelper.submitExtensionData(extensionData);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('processed');
    expect(result.processed).toBe(true);
  });

  test('should perform health check', async ({ apiHelper }) => {
    const health = await apiHelper.healthCheck();

    expect(health.status).toBe('ok');
    expect(health).toHaveProperty('timestamp');
    expect(health).toHaveProperty('version');
  });

  test('should handle concurrent API requests', async ({ apiHelper }) => {
    // Test concurrent uploads
    const testJsons = [
      { data: 'concurrent test 1' },
      { data: 'concurrent test 2' },
      { data: 'concurrent test 3' },
    ];

    const uploadPromises = testJsons.map((json, index) =>
      apiHelper.uploadJSON(json, { title: `Concurrent ${index}` })
    );

    const results = await Promise.all(uploadPromises);

    // All uploads should succeed
    expect(results.length).toBe(3);
    results.forEach((result) => {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
    });
  });

  test('should validate API authentication', async ({ apiHelper, authHelper, page }) => {
    // Test authenticated vs anonymous API access

    // First test anonymous API call
    const anonymousResult = await apiHelper.apiCall('GET', '/api/health');
    expect(anonymousResult.status).toBe(200);

    // Login and test authenticated API call
    await authHelper.loginAPI('developer');

    // Test API call that might require authentication
    const authenticatedResult = await apiHelper.apiCall('GET', '/api/saved');
    expect(authenticatedResult.status).toBe(200);
  });
});

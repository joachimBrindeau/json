import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES, generateLargeJSON } from '../../fixtures/json-samples';

test.describe('Developer - REST API Integration', () => {
  test.describe('JSON Sharing API', () => {
    test('should create shareable JSON via REST API', async ({ apiHelper, dataGenerator }) => {
      const testData = {
        title: 'API Created JSON',
        content: JSON_SAMPLES.ecommerce.content,
        description: 'Created via REST API for testing',
        isPublic: false,
        tags: ['api-test', 'ecommerce'],
      };

      const response = await apiHelper.apiCall('POST', '/api/json/create', {
        data: testData,
        expectedStatus: 201,
      });

      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('shareUrl');
      expect(response.data.title).toBe(testData.title);
      expect(response.data.isPublic).toBe(false);
      expect(response.data.tags).toEqual(expect.arrayContaining(testData.tags));
    });

    test('should update JSON content via REST API', async ({ apiHelper }) => {
      // Create initial JSON
      const initialData = { version: 1, data: 'initial' };
      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: { title: 'Update Test', content: initialData },
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Update the content
      const updatedData = { version: 2, data: 'updated', newField: 'added' };
      const updateResponse = await apiHelper.apiCall('PUT', `/api/json/${jsonId}`, {
        data: { content: updatedData },
        expectedStatus: 200,
      });

      expect(updateResponse.data.updated).toBe(true);

      // Verify the update
      const getResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/content`, {
        expectedStatus: 200,
      });

      expect(getResponse.data.version).toBe(2);
      expect(getResponse.data.newField).toBe('added');
    });

    test('should delete JSON via REST API', async ({ apiHelper }) => {
      // Create JSON to delete
      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: { title: 'Delete Test', content: { toDelete: true } },
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Delete the JSON
      const deleteResponse = await apiHelper.apiCall('DELETE', `/api/json/${jsonId}`, {
        expectedStatus: 204,
      });

      // Verify deletion
      const getResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/content`, {
        expectedStatus: 404,
      });

      expect(getResponse.status).toBe(404);
    });

    test('should manage JSON metadata via REST API', async ({ apiHelper }) => {
      const jsonId = (
        await apiHelper.apiCall('POST', '/api/json/create', {
          data: { title: 'Metadata Test', content: { test: 'data' } },
          expectedStatus: 201,
        })
      ).data.id;

      // Update metadata
      const metadataUpdate = {
        title: 'Updated Metadata Title',
        description: 'New description via API',
        tags: ['updated', 'metadata', 'test'],
        category: 'API Response',
      };

      const updateResponse = await apiHelper.apiCall('PATCH', `/api/json/${jsonId}/metadata`, {
        data: metadataUpdate,
        expectedStatus: 200,
      });

      expect(updateResponse.data.title).toBe(metadataUpdate.title);
      expect(updateResponse.data.description).toBe(metadataUpdate.description);
      expect(updateResponse.data.tags).toEqual(expect.arrayContaining(metadataUpdate.tags));
    });

    test('should list user JSONs via REST API', async ({ apiHelper, authHelper, page }) => {
      // Login first
      await authHelper.loginAPI('developer');

      // Create multiple JSONs
      const jsonIds = [];
      for (let i = 0; i < 3; i++) {
        const response = await apiHelper.apiCall('POST', '/api/json/create', {
          data: { title: `List Test ${i}`, content: { index: i } },
          expectedStatus: 201,
        });
        jsonIds.push(response.data.id);
      }

      // List user JSONs
      const listResponse = await apiHelper.apiCall('GET', '/api/json/list', {
        params: { limit: '10', offset: '0' },
        expectedStatus: 200,
      });

      expect(listResponse.data).toHaveProperty('items');
      expect(listResponse.data).toHaveProperty('total');
      expect(listResponse.data.items.length).toBeGreaterThanOrEqual(3);

      // Verify created JSONs are in the list
      const itemIds = listResponse.data.items.map((item) => item.id);
      jsonIds.forEach((id) => {
        expect(itemIds).toContain(id);
      });
    });

    test('should search JSONs via REST API', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Create searchable content
      const searchableData = {
        users: [
          { name: 'Alice Developer', role: 'frontend' },
          { name: 'Bob Engineer', role: 'backend' },
          { name: 'Charlie Designer', role: 'ui-ux' },
        ],
        project: 'API Search Test',
      };

      await apiHelper.apiCall('POST', '/api/json/create', {
        data: {
          title: 'Searchable JSON',
          content: searchableData,
          tags: ['search-test', 'users'],
        },
        expectedStatus: 201,
      });

      // Search by content
      const searchResponse = await apiHelper.apiCall('POST', '/api/json/search', {
        data: { query: 'Alice Developer', searchType: 'content' },
        expectedStatus: 200,
      });

      expect(searchResponse.data.results.length).toBeGreaterThan(0);
      expect(searchResponse.data.results[0]).toHaveProperty('matches');

      // Search by title
      const titleSearchResponse = await apiHelper.apiCall('POST', '/api/json/search', {
        data: { query: 'Searchable', searchType: 'title' },
        expectedStatus: 200,
      });

      expect(titleSearchResponse.data.results.length).toBeGreaterThan(0);

      // Search by tags
      const tagSearchResponse = await apiHelper.apiCall('POST', '/api/json/search', {
        data: { query: 'search-test', searchType: 'tags' },
        expectedStatus: 200,
      });

      expect(tagSearchResponse.data.results.length).toBeGreaterThan(0);
    });
  });

  test.describe('API Authentication & Authorization', () => {
    test('should require authentication for protected endpoints', async ({ apiHelper }) => {
      // Test endpoints that require authentication
      const protectedEndpoints = [
        { method: 'POST', path: '/api/json/create' },
        { method: 'GET', path: '/api/json/list' },
        { method: 'DELETE', path: '/api/json/dummy-id' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await apiHelper.apiCall(endpoint.method as any, endpoint.path, {
          expectedStatus: 401,
        });
        expect(response.status).toBe(401);
      }
    });

    test('should validate API key authentication', async ({ apiHelper }) => {
      // Test with invalid API key
      const invalidKeyResponse = await apiHelper.apiCall('GET', '/api/json/list', {
        headers: { Authorization: 'Bearer invalid-key' },
        expectedStatus: 401,
      });
      expect(invalidKeyResponse.status).toBe(401);

      // Test with valid API key (mock or test key)
      const validKeyResponse = await apiHelper.apiCall('GET', '/api/health', {
        headers: { Authorization: 'Bearer test-api-key' },
        expectedStatus: 200,
      });
      expect(validKeyResponse.status).toBe(200);
    });

    test('should enforce rate limiting per API key', async ({ apiHelper }) => {
      const rapidRequests = Array.from({ length: 20 }, (_, i) =>
        apiHelper
          .apiCall('GET', '/api/health', {
            headers: { 'X-API-Key': 'test-key' },
          })
          .catch((err) => ({ status: err.status || 429, error: err }))
      );

      const responses = await Promise.all(rapidRequests);
      const rateLimited = responses.filter((r) => r.status === 429);

      // Should have some rate limited responses
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  test.describe('API Error Handling', () => {
    test('should return proper error responses for malformed JSON', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const malformedData = {
        title: 'Invalid JSON Test',
        content: '{ invalid json structure',
      };

      const response = await apiHelper.apiCall('POST', '/api/json/create', {
        data: malformedData,
        expectedStatus: 400,
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('Invalid JSON');
    });

    test('should handle missing required fields', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      const incompleteData = {
        content: { test: 'data' },
        // Missing required 'title' field
      };

      const response = await apiHelper.apiCall('POST', '/api/json/create', {
        data: incompleteData,
        expectedStatus: 400,
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('required');
    });

    test('should handle resource not found errors', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      const nonExistentId = 'non-existent-json-id';

      const getResponse = await apiHelper.apiCall('GET', `/api/json/${nonExistentId}/content`, {
        expectedStatus: 404,
      });

      expect(getResponse.status).toBe(404);
      expect(getResponse.data).toHaveProperty('error');

      const deleteResponse = await apiHelper.apiCall('DELETE', `/api/json/${nonExistentId}`, {
        expectedStatus: 404,
      });

      expect(deleteResponse.status).toBe(404);
    });

    test('should handle payload size limits', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Create extremely large JSON (beyond typical limits)
      const largeContent = generateLargeJSON(10000, 10, 1000);

      const response = await apiHelper.apiCall('POST', '/api/json/create', {
        data: {
          title: 'Oversized JSON',
          content: largeContent,
        },
        expectedStatus: 413,
      });

      expect(response.status).toBe(413);
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('too large');
    });
  });

  test.describe('API Performance & Reliability', () => {
    test('should handle concurrent API requests efficiently', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const startTime = Date.now();

      // Create multiple concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        apiHelper.apiCall('POST', '/api/json/create', {
          data: {
            title: `Concurrent Test ${i}`,
            content: { index: i, timestamp: Date.now() },
          },
          expectedStatus: 201,
        })
      );

      const results = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      // All should succeed
      expect(results.length).toBe(10);
      results.forEach((result, i) => {
        expect(result.status).toBe(201);
        expect(result.data.title).toBe(`Concurrent Test ${i}`);
      });

      // Should complete within reasonable time (adjust based on system performance)
      expect(endTime - startTime).toBeLessThan(10000);
    });

    test('should maintain API response consistency', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Create JSON and retrieve it multiple times
      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: { title: 'Consistency Test', content: { test: 'data' } },
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Retrieve the same JSON multiple times
      const retrievalPromises = Array.from({ length: 5 }, () =>
        apiHelper.apiCall('GET', `/api/json/${jsonId}/content`, {
          expectedStatus: 200,
        })
      );

      const retrievalResults = await Promise.all(retrievalPromises);

      // All responses should be identical
      const firstResponse = JSON.stringify(retrievalResults[0].data);
      retrievalResults.forEach((result) => {
        expect(JSON.stringify(result.data)).toBe(firstResponse);
      });
    });

    test('should provide API response time metrics', async ({ apiHelper }) => {
      const startTime = Date.now();

      const response = await apiHelper.apiCall('GET', '/api/health', {
        expectedStatus: 200,
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Response should be fast (under 1 second)
      expect(responseTime).toBeLessThan(1000);
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('responseTime');
    });
  });

  test.describe('API Data Validation', () => {
    test('should validate JSON content structure', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Test various valid JSON structures
      const validStructures = [
        { type: 'object', data: { key: 'value' } },
        { type: 'array', data: [1, 2, 3] },
        { type: 'string', data: 'valid string' },
        { type: 'number', data: 42 },
        { type: 'boolean', data: true },
        { type: 'null', data: null },
      ];

      for (const structure of validStructures) {
        const response = await apiHelper.apiCall('POST', '/api/json/create', {
          data: {
            title: `Valid ${structure.type}`,
            content: structure.data,
          },
          expectedStatus: 201,
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
      }
    });

    test('should validate metadata constraints', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Test title length limits
      const longTitle = 'A'.repeat(500);
      const longTitleResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: {
          title: longTitle,
          content: { test: 'data' },
        },
        expectedStatus: 400,
      });
      expect(longTitleResponse.status).toBe(400);

      // Test tag limits
      const tooManyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      const tooManyTagsResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: {
          title: 'Too Many Tags',
          content: { test: 'data' },
          tags: tooManyTags,
        },
        expectedStatus: 400,
      });
      expect(tooManyTagsResponse.status).toBe(400);
    });

    test('should sanitize user input', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      const maliciousData = {
        title: '<script>alert("xss")</script>Malicious Title',
        description: '<iframe src="javascript:alert()"></iframe>Bad description',
        content: {
          xss: '<script>console.log("malicious")</script>',
          normal: 'safe data',
        },
      };

      const response = await apiHelper.apiCall('POST', '/api/json/create', {
        data: maliciousData,
        expectedStatus: 201,
      });

      expect(response.status).toBe(201);

      // Get the created JSON to verify sanitization
      const getResponse = await apiHelper.apiCall('GET', `/api/json/${response.data.id}`, {
        expectedStatus: 200,
      });

      // Title should be sanitized
      expect(getResponse.data.title).not.toContain('<script>');
      expect(getResponse.data.description).not.toContain('<iframe>');
    });
  });
});

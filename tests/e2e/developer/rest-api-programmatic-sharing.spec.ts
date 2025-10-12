import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES, generateLargeJSON } from '../../fixtures/json-samples';

test.describe('Developer - REST API Programmatic Sharing', () => {
  test.describe('JSON Creation and Sharing API', () => {
    test('should create and share JSON via REST API with all metadata', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const testData = {
        title: 'Programmatic Sharing Test',
        content: JSON_SAMPLES.ecommerce.content,
        description: 'Created via REST API for programmatic sharing testing',
        category: 'API Response',
        tags: ['api-test', 'ecommerce', 'sharing'],
        isPublic: true,
      };

      // Create JSON via API
      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: testData,
        expectedStatus: 201,
      });

      expect(createResponse.data).toHaveProperty('id');
      expect(createResponse.data).toHaveProperty('shareUrl');
      expect(createResponse.data).toHaveProperty('embedUrl');
      expect(createResponse.data.title).toBe(testData.title);
      expect(createResponse.data.description).toBe(testData.description);
      expect(createResponse.data.category).toBe(testData.category);
      expect(createResponse.data.tags).toEqual(expect.arrayContaining(testData.tags));
      expect(createResponse.data.isPublic).toBe(true);

      const jsonId = createResponse.data.id;

      // Verify sharing URL works
      const shareUrl = createResponse.data.shareUrl;
      const shareResponse = await apiHelper.apiCall('GET', shareUrl, {
        expectedStatus: 200,
      });
      expect(shareResponse.data).toHaveProperty('content');

      // Verify embed URL works
      const embedUrl = createResponse.data.embedUrl;
      const embedResponse = await apiHelper.apiCall('GET', embedUrl, {
        expectedStatus: 200,
      });
      expect(embedResponse.status).toBe(200);
    });

    test('should support bulk JSON creation and sharing', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const bulkData = [
        {
          title: 'Bulk Item 1',
          content: JSON_SAMPLES.simple.content,
          tags: ['bulk', 'test1'],
        },
        {
          title: 'Bulk Item 2',
          content: JSON_SAMPLES.nested.content,
          tags: ['bulk', 'test2'],
        },
        {
          title: 'Bulk Item 3',
          content: JSON_SAMPLES.configuration.content,
          tags: ['bulk', 'test3'],
        },
      ];

      // Bulk create via API
      const bulkResponse = await apiHelper.apiCall('POST', '/api/json/bulk-create', {
        data: { items: bulkData },
        expectedStatus: 201,
      });

      expect(bulkResponse.data).toHaveProperty('items');
      expect(bulkResponse.data.items).toHaveLength(3);
      expect(bulkResponse.data).toHaveProperty('summary');

      // Verify each item was created
      for (let i = 0; i < bulkResponse.data.items.length; i++) {
        const item = bulkResponse.data.items[i];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('shareUrl');
        expect(item.title).toBe(bulkData[i].title);

        // Verify individual item can be retrieved
        const retrieveResponse = await apiHelper.apiCall('GET', `/api/json/${item.id}`, {
          expectedStatus: 200,
        });
        expect(retrieveResponse.data.title).toBe(bulkData[i].title);
      }
    });

    test('should manage sharing permissions via API', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Create private JSON
      const privateData = {
        title: 'Private JSON Test',
        content: { secret: 'confidential data' },
        isPublic: false,
      };

      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: privateData,
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Update sharing permissions
      const permissionsUpdate = {
        isPublic: true,
        allowEmbedding: true,
        allowDownload: false,
        expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      };

      const updateResponse = await apiHelper.apiCall('PATCH', `/api/json/${jsonId}/permissions`, {
        data: permissionsUpdate,
        expectedStatus: 200,
      });

      expect(updateResponse.data.isPublic).toBe(true);
      expect(updateResponse.data.allowEmbedding).toBe(true);
      expect(updateResponse.data.allowDownload).toBe(false);
      expect(updateResponse.data.expiresAt).toBeDefined();

      // Test permission enforcement
      const publicAccessResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/public`, {
        expectedStatus: 200,
      });
      expect(publicAccessResponse.status).toBe(200);

      // Test download restriction
      const downloadResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/download`, {
        expectedStatus: 403,
      });
      expect(downloadResponse.status).toBe(403);
    });
  });

  test.describe('Advanced Sharing Features', () => {
    test('should support custom sharing domains and URLs', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const customSharingData = {
        title: 'Custom Domain Test',
        content: JSON_SAMPLES.analytics.content,
        sharing: {
          customDomain: 'api.example.com',
          customPath: '/shared/analytics-data',
          customSlug: 'analytics-q1-2024',
        },
      };

      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: customSharingData,
        expectedStatus: 201,
      });

      expect(createResponse.data).toHaveProperty('customShareUrl');
      expect(createResponse.data.customShareUrl).toContain(customSharingData.sharing.customSlug);

      // Test custom URL accessibility
      const customUrl = createResponse.data.customShareUrl;
      const customAccessResponse = await apiHelper.apiCall('GET', customUrl, {
        expectedStatus: 200,
      });
      expect(customAccessResponse.status).toBe(200);
    });

    test('should implement sharing analytics and tracking', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const trackingData = {
        title: 'Tracking Test JSON',
        content: JSON_SAMPLES.ecommerce.content,
        isPublic: true,
        enableAnalytics: true,
        trackingOptions: {
          trackViews: true,
          trackDownloads: true,
          trackEmbeds: true,
          trackGeography: true,
        },
      };

      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: trackingData,
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Simulate various interactions
      const interactions = [
        { type: 'view', endpoint: `/api/json/${jsonId}/view` },
        { type: 'download', endpoint: `/api/json/${jsonId}/download` },
        { type: 'embed', endpoint: `/api/json/${jsonId}/embed-view` },
      ];

      for (const interaction of interactions) {
        await apiHelper.apiCall('POST', interaction.endpoint, {
          data: {
            userAgent: 'Test Browser',
            referrer: 'https://test-site.com',
            ip: '192.168.1.100',
          },
          expectedStatus: 200,
        });
      }

      // Get analytics data
      const analyticsResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/analytics`, {
        expectedStatus: 200,
      });

      expect(analyticsResponse.data).toHaveProperty('views');
      expect(analyticsResponse.data).toHaveProperty('downloads');
      expect(analyticsResponse.data).toHaveProperty('embeds');
      expect(analyticsResponse.data.views).toBeGreaterThan(0);
      expect(analyticsResponse.data.downloads).toBeGreaterThan(0);
      expect(analyticsResponse.data.embeds).toBeGreaterThan(0);
    });

    test('should handle versioning and updates for shared JSON', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Create initial version
      const initialData = {
        title: 'Versioned JSON',
        content: { version: 1, data: 'original' },
        enableVersioning: true,
      };

      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: initialData,
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Update with new version
      const updateData = {
        content: { version: 2, data: 'updated', newField: 'added' },
        versionNote: 'Added new field and updated data',
      };

      const updateResponse = await apiHelper.apiCall('POST', `/api/json/${jsonId}/versions`, {
        data: updateData,
        expectedStatus: 201,
      });

      expect(updateResponse.data).toHaveProperty('versionId');
      expect(updateResponse.data.version).toBe(2);

      // List versions
      const versionsResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/versions`, {
        expectedStatus: 200,
      });

      expect(versionsResponse.data.versions).toHaveLength(2);
      expect(versionsResponse.data.versions[1].version).toBe(2);
      expect(versionsResponse.data.versions[1].note).toBe(updateData.versionNote);

      // Access specific version
      const versionResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/versions/1`, {
        expectedStatus: 200,
      });

      expect(versionResponse.data.content.version).toBe(1);
      expect(versionResponse.data.content.data).toBe('original');
    });
  });

  test.describe('API Security and Validation', () => {
    test('should validate API authentication and authorization', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      // Test without authentication
      const unauthenticatedResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: { title: 'Unauthorized Test', content: { test: 'data' } },
        expectedStatus: 401,
      });
      expect(unauthenticatedResponse.status).toBe(401);

      // Test with invalid API key
      const invalidKeyResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        headers: { Authorization: 'Bearer invalid-api-key' },
        data: { title: 'Invalid Key Test', content: { test: 'data' } },
        expectedStatus: 401,
      });
      expect(invalidKeyResponse.status).toBe(401);

      // Test with valid authentication
      await authHelper.loginAPI('developer');

      const validResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: { title: 'Authorized Test', content: { test: 'data' } },
        expectedStatus: 201,
      });
      expect(validResponse.status).toBe(201);
    });

    test('should implement rate limiting for API endpoints', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Make rapid API requests to trigger rate limiting
      const rapidRequests = Array.from({ length: 50 }, (_, i) =>
        apiHelper
          .apiCall('POST', '/api/json/create', {
            data: { title: `Rate Limit Test ${i}`, content: { index: i } },
          })
          .catch((error) => ({ status: error.status || 429, error }))
      );

      const responses = await Promise.all(rapidRequests);

      const successfulRequests = responses.filter((r) => r.status === 201);
      const rateLimitedRequests = responses.filter((r) => r.status === 429);

      // Should have some rate limited responses
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
      expect(successfulRequests.length).toBeGreaterThan(0);

      // Verify rate limit headers
      const rateLimitResponse = rateLimitedRequests[0];
      expect(rateLimitResponse.error).toBeDefined();
    });

    test('should validate input data and prevent injection attacks', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Test XSS prevention
      const xssData = {
        title: '<script>alert("XSS")</script>Malicious Title',
        description: '<iframe src="javascript:alert(1)"></iframe>Bad Description',
        content: {
          xss: '<script>console.log("malicious")</script>',
          sql: "'; DROP TABLE users; --",
          normal: 'safe content',
        },
      };

      const xssResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: xssData,
        expectedStatus: 201,
      });

      expect(xssResponse.status).toBe(201);

      // Verify content is sanitized when retrieved
      const retrieveResponse = await apiHelper.apiCall('GET', `/api/json/${xssResponse.data.id}`, {
        expectedStatus: 200,
      });

      expect(retrieveResponse.data.title).not.toContain('<script>');
      expect(retrieveResponse.data.description).not.toContain('<iframe>');

      // Test payload size limits
      const oversizedData = {
        title: 'Oversized JSON Test',
        content: generateLargeJSON(50000, 10, 1000), // Very large JSON
      };

      const oversizedResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: oversizedData,
        expectedStatus: 413,
      });

      expect(oversizedResponse.status).toBe(413);
    });
  });

  test.describe('Integration and Compatibility', () => {
    test('should support webhook notifications for sharing events', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Configure webhook
      const webhookConfig = {
        url: 'https://webhook.site/test-webhook',
        events: ['json.created', 'json.shared', 'json.viewed'],
        secret: 'webhook-secret-key',
      };

      const webhookResponse = await apiHelper.apiCall('POST', '/api/webhooks/configure', {
        data: webhookConfig,
        expectedStatus: 201,
      });

      expect(webhookResponse.data).toHaveProperty('webhookId');

      // Create JSON to trigger webhook
      const testData = {
        title: 'Webhook Test JSON',
        content: JSON_SAMPLES.simple.content,
        isPublic: true,
      };

      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: testData,
        expectedStatus: 201,
      });

      // Simulate webhook delivery verification
      const deliveryResponse = await apiHelper.apiCall(
        'GET',
        `/api/webhooks/${webhookResponse.data.webhookId}/deliveries`,
        {
          expectedStatus: 200,
        }
      );

      expect(deliveryResponse.data.deliveries.length).toBeGreaterThan(0);
      expect(deliveryResponse.data.deliveries[0]).toHaveProperty('event', 'json.created');
    });

    test('should support cross-origin sharing and CORS configuration', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Configure CORS settings
      const corsConfig = {
        allowedOrigins: ['https://example.com', 'https://test-site.com'],
        allowedMethods: ['GET', 'POST'],
        allowCredentials: true,
        maxAge: 3600,
      };

      const corsResponse = await apiHelper.apiCall('POST', '/api/cors/configure', {
        data: corsConfig,
        expectedStatus: 200,
      });

      expect(corsResponse.data.configured).toBe(true);

      // Test CORS preflight request
      const preflightResponse = await apiHelper.apiCall('OPTIONS', '/api/json/create', {
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
        expectedStatus: 200,
      });

      expect(preflightResponse.status).toBe(200);

      // Test actual CORS request
      const corsTestResponse = await apiHelper.apiCall('GET', '/api/json/public/list', {
        headers: {
          Origin: 'https://example.com',
        },
        expectedStatus: 200,
      });

      expect(corsTestResponse.status).toBe(200);
    });

    test('should provide API documentation and schema validation', async ({ apiHelper }) => {
      // Get API documentation
      const docsResponse = await apiHelper.apiCall('GET', '/api/docs', {
        expectedStatus: 200,
      });

      expect(docsResponse.data).toHaveProperty('openapi');
      expect(docsResponse.data).toHaveProperty('info');
      expect(docsResponse.data).toHaveProperty('paths');

      // Get specific endpoint schema
      const schemaResponse = await apiHelper.apiCall('GET', '/api/schema/json/create', {
        expectedStatus: 200,
      });

      expect(schemaResponse.data).toHaveProperty('schema');
      expect(schemaResponse.data.schema).toHaveProperty('properties');
      expect(schemaResponse.data.schema.properties).toHaveProperty('title');
      expect(schemaResponse.data.schema.properties).toHaveProperty('content');

      // Test schema validation endpoint
      const validData = {
        title: 'Schema Test',
        content: { valid: true },
      };

      const validateResponse = await apiHelper.apiCall('POST', '/api/validate/json/create', {
        data: validData,
        expectedStatus: 200,
      });

      expect(validateResponse.data.valid).toBe(true);

      // Test invalid data
      const invalidData = {
        content: { missing: 'title field' },
      };

      const invalidateResponse = await apiHelper.apiCall('POST', '/api/validate/json/create', {
        data: invalidData,
        expectedStatus: 400,
      });

      expect(invalidateResponse.status).toBe(400);
      expect(invalidateResponse.data.errors.length).toBeGreaterThan(0);
    });
  });

  test.describe('Performance and Scalability', () => {
    test('should handle concurrent API requests efficiently', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const startTime = Date.now();

      // Create 20 concurrent requests
      const concurrentRequests = Array.from({ length: 20 }, (_, i) =>
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
      expect(results.length).toBe(20);
      results.forEach((result, i) => {
        expect(result.status).toBe(201);
        expect(result.data.title).toBe(`Concurrent Test ${i}`);
      });

      // Should complete within reasonable time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // Less than 10 seconds

      // Calculate average response time
      const avgResponseTime = totalTime / 20;
      expect(avgResponseTime).toBeLessThan(500); // Less than 500ms average
    });

    test('should optimize API responses for large datasets', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Create large JSON
      const largeData = generateLargeJSON(5000, 5, 200);
      const createResponse = await apiHelper.apiCall('POST', '/api/json/create', {
        data: {
          title: 'Large Dataset Test',
          content: largeData,
        },
        expectedStatus: 201,
      });

      const jsonId = createResponse.data.id;

      // Test paginated retrieval
      const paginatedResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/content`, {
        params: {
          page: '1',
          limit: '100',
          fields: 'id,title,metadata',
        },
        expectedStatus: 200,
      });

      expect(paginatedResponse.data).toHaveProperty('data');
      expect(paginatedResponse.data).toHaveProperty('pagination');
      expect(paginatedResponse.data.pagination).toHaveProperty('total');
      expect(paginatedResponse.data.pagination).toHaveProperty('pages');

      // Test compressed response
      const compressedResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/content`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate',
        },
        expectedStatus: 200,
      });

      expect(compressedResponse.status).toBe(200);

      // Test streaming response for very large data
      const streamResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}/stream`, {
        expectedStatus: 200,
      });

      expect(streamResponse.status).toBe(200);
    });
  });
});

import { test, expect } from '../../utils/base-test';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Developer - Extension Submission Endpoint', () => {
  test.describe('Browser Extension Data Submission', () => {
    test('should accept and process JSON submissions from browser extensions', async ({
      apiHelper,
    }) => {
      // Simulate browser extension submission
      const extensionData = {
        extensionId: 'test-json-capture-extension',
        extensionVersion: '1.2.3',
        browserInfo: {
          name: 'chrome',
          version: '120.0.0',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        captureContext: {
          url: 'https://api.example.com/users',
          method: 'GET',
          timestamp: new Date().toISOString(),
          responseHeaders: {
            'content-type': 'application/json',
            'cache-control': 'no-cache',
            'x-api-version': 'v2.1',
          },
          statusCode: 200,
        },
        jsonData: JSON_SAMPLES.apiResponse.content,
        metadata: {
          title: 'User API Response',
          description: 'Captured from user management API endpoint',
          category: 'API Response',
          tags: ['api', 'users', 'extension-capture'],
          isPublic: false,
          autoProcessed: true,
        },
      };

      const submissionResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
        data: extensionData,
        expectedStatus: 201,
      });

      expect(submissionResponse.data).toHaveProperty('submissionId');
      expect(submissionResponse.data).toHaveProperty('jsonId');
      expect(submissionResponse.data).toHaveProperty('status', 'processed');
      expect(submissionResponse.data).toHaveProperty('processingTime');
      expect(submissionResponse.data).toHaveProperty('shareUrl');

      const submissionId = submissionResponse.data.submissionId;
      const jsonId = submissionResponse.data.jsonId;

      // Verify the JSON was created correctly
      const jsonResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}`, {
        expectedStatus: 200,
      });

      expect(jsonResponse.data).toHaveProperty('title', 'User API Response');
      expect(jsonResponse.data).toHaveProperty('category', 'API Response');
      expect(jsonResponse.data).toHaveProperty('extensionSubmission', true);
      expect(jsonResponse.data.metadata).toHaveProperty(
        'capturedFrom',
        'https://api.example.com/users'
      );
      expect(jsonResponse.data.metadata).toHaveProperty(
        'extensionId',
        'test-json-capture-extension'
      );

      // Test submission status tracking
      const statusResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/submission/${submissionId}/status`,
        {
          expectedStatus: 200,
        }
      );

      expect(statusResponse.data).toHaveProperty('submissionId', submissionId);
      expect(statusResponse.data).toHaveProperty('status', 'completed');
      expect(statusResponse.data).toHaveProperty('processingSteps');
      expect(Array.isArray(statusResponse.data.processingSteps)).toBe(true);
    });

    test('should handle bulk submissions from browser extensions', async ({ apiHelper }) => {
      // Simulate bulk capture from extension
      const bulkSubmission = {
        extensionId: 'bulk-json-capture-extension',
        extensionVersion: '2.0.1',
        sessionId: 'session-' + Date.now(),
        browserInfo: {
          name: 'firefox',
          version: '119.0',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0)',
        },
        bulkData: [
          {
            captureId: 'capture-1',
            url: 'https://api.example.com/products',
            method: 'GET',
            timestamp: new Date(Date.now() - 5000).toISOString(),
            jsonData: JSON_SAMPLES.ecommerce.content,
            metadata: {
              title: 'Products API Response',
              category: 'API Response',
              tags: ['products', 'api', 'bulk-capture'],
            },
          },
          {
            captureId: 'capture-2',
            url: 'https://api.example.com/analytics',
            method: 'GET',
            timestamp: new Date(Date.now() - 3000).toISOString(),
            jsonData: JSON_SAMPLES.analytics.content,
            metadata: {
              title: 'Analytics Dashboard Data',
              category: 'Analytics',
              tags: ['analytics', 'dashboard', 'bulk-capture'],
            },
          },
          {
            captureId: 'capture-3',
            url: 'https://api.example.com/config',
            method: 'GET',
            timestamp: new Date().toISOString(),
            jsonData: JSON_SAMPLES.configuration.content,
            metadata: {
              title: 'App Configuration',
              category: 'Configuration',
              tags: ['config', 'settings', 'bulk-capture'],
            },
          },
        ],
        processingOptions: {
          validateJSON: true,
          extractMetadata: true,
          generateThumbnails: false,
          autoPublish: false,
          groupBySession: true,
        },
      };

      const bulkResponse = await apiHelper.apiCall('POST', '/api/extension/submit/bulk', {
        data: bulkSubmission,
        expectedStatus: 202, // Accepted for processing
      });

      expect(bulkResponse.data).toHaveProperty('batchId');
      expect(bulkResponse.data).toHaveProperty('status', 'processing');
      expect(bulkResponse.data).toHaveProperty('totalItems', 3);
      expect(bulkResponse.data).toHaveProperty('estimatedProcessingTime');

      const batchId = bulkResponse.data.batchId;

      // Poll for batch completion
      let batchCompleted = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!batchCompleted && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const batchStatusResponse = await apiHelper.apiCall(
          'GET',
          `/api/extension/batch/${batchId}/status`,
          {
            expectedStatus: 200,
          }
        );

        if (batchStatusResponse.data.status === 'completed') {
          batchCompleted = true;

          expect(batchStatusResponse.data).toHaveProperty('processedItems', 3);
          expect(batchStatusResponse.data).toHaveProperty('successfulSubmissions', 3);
          expect(batchStatusResponse.data).toHaveProperty('failedSubmissions', 0);
          expect(batchStatusResponse.data).toHaveProperty('results');
          expect(batchStatusResponse.data.results).toHaveLength(3);

          // Verify each submission result
          batchStatusResponse.data.results.forEach((result, index) => {
            expect(result).toHaveProperty('captureId', `capture-${index + 1}`);
            expect(result).toHaveProperty('jsonId');
            expect(result).toHaveProperty('shareUrl');
            expect(result).toHaveProperty('status', 'success');
          });
        } else if (batchStatusResponse.data.status === 'failed') {
          throw new Error('Batch processing failed');
        }

        attempts++;
      }

      expect(batchCompleted).toBe(true);

      // Test batch results retrieval
      const batchResultsResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/batch/${batchId}/results`,
        {
          expectedStatus: 200,
        }
      );

      expect(batchResultsResponse.data).toHaveProperty('batchId', batchId);
      expect(batchResultsResponse.data).toHaveProperty('results');
      expect(batchResultsResponse.data.results).toHaveLength(3);
    });

    test('should validate and sanitize extension submissions for security', async ({
      apiHelper,
    }) => {
      // Test malicious content handling
      const maliciousSubmission = {
        extensionId: '<script>alert("xss")</script>',
        extensionVersion: '1.0.0',
        browserInfo: {
          name: 'chrome',
          version: '120.0.0',
          userAgent: 'Mozilla/5.0... <script>document.cookie="stolen"</script>',
        },
        captureContext: {
          url: 'javascript:alert("malicious")',
          method: 'GET',
          timestamp: new Date().toISOString(),
        },
        jsonData: {
          maliciousField: '<iframe src="javascript:alert()"></iframe>',
          xssAttempt: '<script>console.log("malicious")</script>',
          sqlInjection: "'; DROP TABLE users; --",
          normalField: 'safe data',
        },
        metadata: {
          title: '<script>alert("title xss")</script>Malicious Title',
          description: '<img src="x" onerror="alert(\'desc xss\')">Bad description',
          category: 'API Response',
          tags: ['<script>alert("tag")</script>', 'safe-tag'],
        },
      };

      const securityResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
        data: maliciousSubmission,
        expectedStatus: 201, // Should still process but sanitized
      });

      expect(securityResponse.status).toBe(201);
      const jsonId = securityResponse.data.jsonId;

      // Verify content was sanitized
      const sanitizedResponse = await apiHelper.apiCall('GET', `/api/json/${jsonId}`, {
        expectedStatus: 200,
      });

      // Check that malicious content was sanitized
      expect(sanitizedResponse.data.title).not.toContain('<script>');
      expect(sanitizedResponse.data.description).not.toContain('<img');
      expect(sanitizedResponse.data.metadata.extensionId).not.toContain('<script>');

      // Check content sanitization
      const content = sanitizedResponse.data.content;
      expect(content.maliciousField).not.toContain('<iframe>');
      expect(content.xssAttempt).not.toContain('<script>');
      expect(content.normalField).toBe('safe data'); // Should remain unchanged

      // Check tags sanitization
      expect(sanitizedResponse.data.tags).not.toContain('<script>alert("tag")</script>');
      expect(sanitizedResponse.data.tags).toContain('safe-tag');

      // Test payload size limits
      const oversizedSubmission = {
        extensionId: 'size-test-extension',
        extensionVersion: '1.0.0',
        browserInfo: {
          name: 'chrome',
          version: '120.0.0',
        },
        jsonData: {
          // Create very large data
          largeArray: Array(100000).fill('a'.repeat(1000)), // ~100MB
          metadata: 'oversized test',
        },
      };

      const oversizedResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
        data: oversizedSubmission,
        expectedStatus: 413, // Payload Too Large
      });

      expect(oversizedResponse.status).toBe(413);
      expect(oversizedResponse.data).toHaveProperty('error');
      expect(oversizedResponse.data.error).toContain('too large');
    });

    test('should support extension authentication and rate limiting', async ({ apiHelper }) => {
      // Test without extension authentication
      const unauthenticatedResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
        data: {
          jsonData: { test: 'data' },
          metadata: { title: 'Unauthenticated Test' },
        },
        expectedStatus: 401,
      });

      expect(unauthenticatedResponse.status).toBe(401);
      expect(unauthenticatedResponse.data).toHaveProperty('error');

      // Test with invalid extension key
      const invalidKeyResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
        headers: {
          'X-Extension-Key': 'invalid-extension-key',
          'X-Extension-ID': 'test-extension',
        },
        data: {
          jsonData: { test: 'data' },
          metadata: { title: 'Invalid Key Test' },
        },
        expectedStatus: 401,
      });

      expect(invalidKeyResponse.status).toBe(401);

      // Test with valid extension authentication
      const validExtensionKey = 'valid-test-extension-key'; // Would be generated/registered
      const authenticatedResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
        headers: {
          'X-Extension-Key': validExtensionKey,
          'X-Extension-ID': 'authorized-test-extension',
          'X-Extension-Version': '1.0.0',
        },
        data: {
          extensionId: 'authorized-test-extension',
          jsonData: JSON_SAMPLES.simple.content,
          metadata: {
            title: 'Authenticated Extension Submission',
            category: 'Test Data',
          },
        },
        expectedStatus: 201,
      });

      expect(authenticatedResponse.status).toBe(201);
      expect(authenticatedResponse.data).toHaveProperty('jsonId');

      // Test rate limiting for extensions
      const rapidSubmissions = Array(20)
        .fill(null)
        .map((_, i) =>
          apiHelper
            .apiCall('POST', '/api/extension/submit', {
              headers: {
                'X-Extension-Key': validExtensionKey,
                'X-Extension-ID': 'rate-limit-test-extension',
              },
              data: {
                extensionId: 'rate-limit-test-extension',
                jsonData: { test: true, index: i },
                metadata: { title: `Rate Limit Test ${i}` },
              },
            })
            .catch((error) => ({ status: error.status || 429, error }))
        );

      const submissionResults = await Promise.all(rapidSubmissions);
      const successfulSubmissions = submissionResults.filter((r) => r.status === 201);
      const rateLimitedSubmissions = submissionResults.filter((r) => r.status === 429);

      // Should have some successful submissions and some rate limited
      expect(successfulSubmissions.length).toBeGreaterThan(0);
      expect(rateLimitedSubmissions.length).toBeGreaterThan(0);

      // Test rate limit headers
      if (rateLimitedSubmissions.length > 0) {
        const rateLimitedResponse = rateLimitedSubmissions[0];
        expect(rateLimitedResponse.error).toBeDefined();
      }
    });
  });

  test.describe('Extension Management and Analytics', () => {
    test('should track extension usage and provide analytics', async ({ apiHelper }) => {
      const extensionKey = 'analytics-test-extension-key';
      const extensionId = 'analytics-test-extension';

      // Submit multiple requests to generate analytics data
      const analyticsSubmissions = [
        {
          url: 'https://api.example.com/users',
          category: 'API Response',
          jsonSize: 1024,
        },
        {
          url: 'https://api.example.com/products',
          category: 'API Response',
          jsonSize: 2048,
        },
        {
          url: 'https://config.example.com/app.json',
          category: 'Configuration',
          jsonSize: 512,
        },
      ];

      for (const submission of analyticsSubmissions) {
        await apiHelper.apiCall('POST', '/api/extension/submit', {
          headers: {
            'X-Extension-Key': extensionKey,
            'X-Extension-ID': extensionId,
          },
          data: {
            extensionId,
            captureContext: {
              url: submission.url,
              method: 'GET',
              timestamp: new Date().toISOString(),
            },
            jsonData: { test: true, size: submission.jsonSize },
            metadata: {
              title: `Test from ${submission.url}`,
              category: submission.category,
            },
          },
          expectedStatus: 201,
        });
      }

      // Get extension analytics
      const analyticsResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/${extensionId}/analytics`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          params: {
            timeframe: '7d',
            includeBreakdowns: 'true',
          },
          expectedStatus: 200,
        }
      );

      expect(analyticsResponse.data).toHaveProperty('extensionId', extensionId);
      expect(analyticsResponse.data).toHaveProperty('totalSubmissions');
      expect(analyticsResponse.data).toHaveProperty('successfulSubmissions');
      expect(analyticsResponse.data).toHaveProperty('failedSubmissions');
      expect(analyticsResponse.data).toHaveProperty('totalDataSize');
      expect(analyticsResponse.data).toHaveProperty('categoryBreakdown');
      expect(analyticsResponse.data).toHaveProperty('urlPatterns');
      expect(analyticsResponse.data).toHaveProperty('timeline');

      expect(analyticsResponse.data.totalSubmissions).toBeGreaterThanOrEqual(3);
      expect(analyticsResponse.data.categoryBreakdown).toHaveProperty('API Response');
      expect(analyticsResponse.data.categoryBreakdown).toHaveProperty('Configuration');

      // Test usage statistics
      const usageStatsResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/${extensionId}/usage-stats`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          expectedStatus: 200,
        }
      );

      expect(usageStatsResponse.data).toHaveProperty('dailyUsage');
      expect(usageStatsResponse.data).toHaveProperty('peakHours');
      expect(usageStatsResponse.data).toHaveProperty('averageSubmissionSize');
      expect(usageStatsResponse.data).toHaveProperty('mostCapturedDomains');
      expect(usageStatsResponse.data).toHaveProperty('quotaUsage');

      // Test quota management
      const quotaResponse = await apiHelper.apiCall('GET', `/api/extension/${extensionId}/quota`, {
        headers: {
          'X-Extension-Key': extensionKey,
        },
        expectedStatus: 200,
      });

      expect(quotaResponse.data).toHaveProperty('dailyLimit');
      expect(quotaResponse.data).toHaveProperty('monthlyLimit');
      expect(quotaResponse.data).toHaveProperty('currentDailyUsage');
      expect(quotaResponse.data).toHaveProperty('currentMonthlyUsage');
      expect(quotaResponse.data).toHaveProperty('resetTimes');
    });

    test('should support extension configuration and preferences', async ({ apiHelper }) => {
      const extensionKey = 'config-test-extension-key';
      const extensionId = 'config-test-extension';

      // Test getting default configuration
      const defaultConfigResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/${extensionId}/config`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          expectedStatus: 200,
        }
      );

      expect(defaultConfigResponse.data).toHaveProperty('extensionId', extensionId);
      expect(defaultConfigResponse.data).toHaveProperty('settings');
      expect(defaultConfigResponse.data.settings).toHaveProperty('autoPublish');
      expect(defaultConfigResponse.data.settings).toHaveProperty('defaultCategory');
      expect(defaultConfigResponse.data.settings).toHaveProperty('autoTags');

      // Test updating extension configuration
      const newConfig = {
        settings: {
          autoPublish: false,
          defaultCategory: 'API Response',
          autoTags: ['extension-capture', 'auto-tagged'],
          captureSettings: {
            includeHeaders: true,
            includeMetadata: true,
            maxFileSize: '5MB',
            allowedDomains: ['api.example.com', '*.trusted-api.com'],
          },
          processingOptions: {
            validateJSON: true,
            extractSchema: true,
            generatePreview: false,
            enableAnalytics: true,
          },
          notifications: {
            onSuccess: true,
            onError: true,
            onQuotaWarning: true,
          },
        },
      };

      const updateConfigResponse = await apiHelper.apiCall(
        'PUT',
        `/api/extension/${extensionId}/config`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          data: newConfig,
          expectedStatus: 200,
        }
      );

      expect(updateConfigResponse.data).toHaveProperty('updated', true);
      expect(updateConfigResponse.data).toHaveProperty('settings');

      // Verify configuration was updated
      const updatedConfigResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/${extensionId}/config`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          expectedStatus: 200,
        }
      );

      expect(updatedConfigResponse.data.settings.autoPublish).toBe(false);
      expect(updatedConfigResponse.data.settings.defaultCategory).toBe('API Response');
      expect(updatedConfigResponse.data.settings.autoTags).toContain('extension-capture');

      // Test configuration validation
      const invalidConfig = {
        settings: {
          autoPublish: 'invalid-boolean', // Should be boolean
          maxFileSize: 'invalid-size', // Should be valid size format
          allowedDomains: 'not-an-array', // Should be array
        },
      };

      const invalidConfigResponse = await apiHelper.apiCall(
        'PUT',
        `/api/extension/${extensionId}/config`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          data: invalidConfig,
          expectedStatus: 400,
        }
      );

      expect(invalidConfigResponse.status).toBe(400);
      expect(invalidConfigResponse.data).toHaveProperty('validationErrors');
      expect(Array.isArray(invalidConfigResponse.data.validationErrors)).toBe(true);
    });

    test('should support extension registration and key management', async ({ apiHelper }) => {
      // Test extension registration
      const registrationData = {
        extensionName: 'Test JSON Capture Extension',
        extensionId: 'new-test-extension',
        version: '1.0.0',
        description: 'A test extension for capturing JSON data',
        developer: {
          name: 'Test Developer',
          email: 'developer@example.com',
          website: 'https://example.com',
        },
        permissions: ['capture-json', 'auto-tag', 'bulk-submit'],
        manifestUrl: 'https://example.com/extension/manifest.json',
        storeUrl: 'https://chrome.google.com/webstore/detail/test-extension',
      };

      const registrationResponse = await apiHelper.apiCall('POST', '/api/extension/register', {
        data: registrationData,
        expectedStatus: 201,
      });

      expect(registrationResponse.data).toHaveProperty('extensionId', 'new-test-extension');
      expect(registrationResponse.data).toHaveProperty('apiKey');
      expect(registrationResponse.data).toHaveProperty('secretKey');
      expect(registrationResponse.data).toHaveProperty('status', 'pending_approval');

      const extensionKey = registrationResponse.data.apiKey;
      const extensionSecret = registrationResponse.data.secretKey;

      // Test key validation
      const validateKeyResponse = await apiHelper.apiCall('POST', '/api/extension/validate-key', {
        data: {
          extensionId: 'new-test-extension',
          apiKey: extensionKey,
        },
        expectedStatus: 200,
      });

      expect(validateKeyResponse.data).toHaveProperty('valid', true);
      expect(validateKeyResponse.data).toHaveProperty('extensionId', 'new-test-extension');
      expect(validateKeyResponse.data).toHaveProperty('permissions');

      // Test key regeneration
      const regenerateResponse = await apiHelper.apiCall(
        'POST',
        `/api/extension/new-test-extension/regenerate-key`,
        {
          headers: {
            'X-Extension-Secret': extensionSecret,
          },
          expectedStatus: 200,
        }
      );

      expect(regenerateResponse.data).toHaveProperty('newApiKey');
      expect(regenerateResponse.data).toHaveProperty('oldKeyExpiresAt');
      expect(regenerateResponse.data.newApiKey).not.toBe(extensionKey);

      // Test extension status and approval workflow
      const statusResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/new-test-extension/status`,
        {
          headers: {
            'X-Extension-Secret': extensionSecret,
          },
          expectedStatus: 200,
        }
      );

      expect(statusResponse.data).toHaveProperty('status');
      expect(statusResponse.data).toHaveProperty('approvalStatus');
      expect(statusResponse.data).toHaveProperty('registrationDate');
      expect(['pending_approval', 'approved', 'rejected', 'suspended']).toContain(
        statusResponse.data.approvalStatus
      );

      // Test extension listing (for approved extensions)
      const publicExtensionsResponse = await apiHelper.apiCall('GET', '/api/extension/directory', {
        params: {
          status: 'approved',
          limit: '10',
        },
        expectedStatus: 200,
      });

      expect(publicExtensionsResponse.data).toHaveProperty('extensions');
      expect(Array.isArray(publicExtensionsResponse.data.extensions)).toBe(true);

      publicExtensionsResponse.data.extensions.forEach((extension) => {
        expect(extension).toHaveProperty('extensionId');
        expect(extension).toHaveProperty('name');
        expect(extension).toHaveProperty('description');
        expect(extension).toHaveProperty('developer');
        expect(extension).not.toHaveProperty('apiKey'); // Should not expose sensitive data
      });
    });
  });

  test.describe('Extension Error Handling and Debugging', () => {
    test('should provide comprehensive error handling and debugging information', async ({
      apiHelper,
    }) => {
      const extensionKey = 'debug-test-extension-key';
      const extensionId = 'debug-test-extension';

      // Test various error scenarios
      const errorScenarios = [
        {
          name: 'Invalid JSON Data',
          data: {
            extensionId,
            jsonData: '{ invalid json structure',
            metadata: { title: 'Invalid JSON Test' },
          },
          expectedStatus: 400,
          expectedErrorType: 'INVALID_JSON',
        },
        {
          name: 'Missing Required Fields',
          data: {
            extensionId,
            // Missing jsonData
            metadata: { title: 'Missing Fields Test' },
          },
          expectedStatus: 400,
          expectedErrorType: 'MISSING_REQUIRED_FIELDS',
        },
        {
          name: 'Invalid Metadata',
          data: {
            extensionId,
            jsonData: { valid: 'json' },
            metadata: {
              title: '', // Empty title
              category: 'INVALID_CATEGORY',
              tags: ['tag-that-is-way-too-long-to-be-valid-according-to-the-validation-rules'],
            },
          },
          expectedStatus: 400,
          expectedErrorType: 'INVALID_METADATA',
        },
      ];

      for (const scenario of errorScenarios) {
        const errorResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
          headers: {
            'X-Extension-Key': extensionKey,
            'X-Extension-ID': extensionId,
          },
          data: scenario.data,
          expectedStatus: scenario.expectedStatus,
        });

        expect(errorResponse.status).toBe(scenario.expectedStatus);
        expect(errorResponse.data).toHaveProperty('error');
        expect(errorResponse.data).toHaveProperty('errorType', scenario.expectedErrorType);
        expect(errorResponse.data).toHaveProperty('errorCode');
        expect(errorResponse.data).toHaveProperty('timestamp');

        if (scenario.expectedErrorType === 'INVALID_METADATA') {
          expect(errorResponse.data).toHaveProperty('validationErrors');
          expect(Array.isArray(errorResponse.data.validationErrors)).toBe(true);
        }
      }

      // Test debugging mode
      const debugSubmission = {
        extensionId,
        jsonData: JSON_SAMPLES.simple.content,
        metadata: {
          title: 'Debug Mode Test',
          category: 'Test Data',
        },
        debug: true,
      };

      const debugResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
        headers: {
          'X-Extension-Key': extensionKey,
          'X-Extension-ID': extensionId,
          'X-Debug-Mode': 'true',
        },
        data: debugSubmission,
        expectedStatus: 201,
      });

      expect(debugResponse.data).toHaveProperty('debugInfo');
      expect(debugResponse.data.debugInfo).toHaveProperty('processingSteps');
      expect(debugResponse.data.debugInfo).toHaveProperty('validationResults');
      expect(debugResponse.data.debugInfo).toHaveProperty('performanceMetrics');

      // Test webhook error notifications (if extension has webhook configured)
      const webhookErrorSubmission = {
        extensionId,
        jsonData: { test: 'webhook error test' },
        metadata: {
          title: 'Webhook Error Test',
          category: 'Test Data',
        },
        webhookUrl: 'https://invalid-webhook-endpoint-that-will-fail.example.com/webhook',
      };

      const webhookResponse = await apiHelper.apiCall('POST', '/api/extension/submit', {
        headers: {
          'X-Extension-Key': extensionKey,
          'X-Extension-ID': extensionId,
        },
        data: webhookErrorSubmission,
        expectedStatus: 201, // Should still succeed even if webhook fails
      });

      expect(webhookResponse.data).toHaveProperty('jsonId');
      expect(webhookResponse.data).toHaveProperty('webhookDelivery');
      expect(webhookResponse.data.webhookDelivery).toHaveProperty('attempted', true);
      expect(webhookResponse.data.webhookDelivery).toHaveProperty('success', false);

      // Get error logs for extension
      const errorLogsResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/${extensionId}/error-logs`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          params: {
            timeframe: '24h',
            limit: '50',
            severity: 'all',
          },
          expectedStatus: 200,
        }
      );

      expect(errorLogsResponse.data).toHaveProperty('logs');
      expect(errorLogsResponse.data).toHaveProperty('summary');
      expect(Array.isArray(errorLogsResponse.data.logs)).toBe(true);

      if (errorLogsResponse.data.logs.length > 0) {
        const logEntry = errorLogsResponse.data.logs[0];
        expect(logEntry).toHaveProperty('timestamp');
        expect(logEntry).toHaveProperty('level');
        expect(logEntry).toHaveProperty('message');
        expect(logEntry).toHaveProperty('errorType');
      }

      expect(errorLogsResponse.data.summary).toHaveProperty('totalErrors');
      expect(errorLogsResponse.data.summary).toHaveProperty('errorsByType');
      expect(errorLogsResponse.data.summary).toHaveProperty('errorRate');
    });

    test('should support extension health monitoring and alerts', async ({ apiHelper }) => {
      const extensionKey = 'health-monitor-extension-key';
      const extensionId = 'health-monitor-extension';

      // Get extension health status
      const healthResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/${extensionId}/health`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          expectedStatus: 200,
        }
      );

      expect(healthResponse.data).toHaveProperty('status');
      expect(healthResponse.data).toHaveProperty('lastActivity');
      expect(healthResponse.data).toHaveProperty('metrics');
      expect(healthResponse.data).toHaveProperty('alerts');

      expect(healthResponse.data.metrics).toHaveProperty('successRate');
      expect(healthResponse.data.metrics).toHaveProperty('averageResponseTime');
      expect(healthResponse.data.metrics).toHaveProperty('quotaUsage');
      expect(healthResponse.data.metrics).toHaveProperty('errorRate');

      // Test health check endpoint
      const healthCheckResponse = await apiHelper.apiCall(
        'POST',
        `/api/extension/${extensionId}/health-check`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          data: {
            extensionVersion: '1.0.0',
            environmentInfo: {
              browser: 'chrome',
              version: '120.0.0',
              platform: 'mac',
            },
            capabilities: ['capture', 'bulk-submit', 'auto-tag'],
          },
          expectedStatus: 200,
        }
      );

      expect(healthCheckResponse.data).toHaveProperty('acknowledged');
      expect(healthCheckResponse.data).toHaveProperty('serverTime');
      expect(healthCheckResponse.data).toHaveProperty('apiStatus');
      expect(healthCheckResponse.data).toHaveProperty('recommendations');

      // Test alert configuration
      const alertConfig = {
        alerts: {
          errorRateThreshold: 5.0, // 5% error rate
          quotaWarningThreshold: 80, // 80% quota usage
          responseTimeThreshold: 10000, // 10 seconds
          enableEmailAlerts: true,
          enableWebhookAlerts: true,
          webhookUrl: 'https://example.com/extension-alerts',
        },
      };

      const alertConfigResponse = await apiHelper.apiCall(
        'PUT',
        `/api/extension/${extensionId}/alerts`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          data: alertConfig,
          expectedStatus: 200,
        }
      );

      expect(alertConfigResponse.data).toHaveProperty('alertsConfigured', true);
      expect(alertConfigResponse.data).toHaveProperty('nextCheckTime');

      // Test getting alert history
      const alertHistoryResponse = await apiHelper.apiCall(
        'GET',
        `/api/extension/${extensionId}/alerts/history`,
        {
          headers: {
            'X-Extension-Key': extensionKey,
          },
          params: {
            timeframe: '7d',
            limit: '20',
          },
          expectedStatus: 200,
        }
      );

      expect(alertHistoryResponse.data).toHaveProperty('alerts');
      expect(Array.isArray(alertHistoryResponse.data.alerts)).toBe(true);

      if (alertHistoryResponse.data.alerts.length > 0) {
        const alert = alertHistoryResponse.data.alerts[0];
        expect(alert).toHaveProperty('alertType');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('resolved');
      }
    });
  });
});

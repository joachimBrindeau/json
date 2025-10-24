import { test, expect } from '../../utils/base-test';

test.describe('Developer - Health Check Endpoints for API Monitoring', () => {
  test.describe('Basic Health Check Endpoints', () => {
    test('should provide comprehensive system health status', async ({ apiHelper }) => {
      // Test basic health check endpoint
      const healthResponse = await apiHelper.apiCall('GET', '/api/health', {
        expectedStatus: 200,
      });

      expect(healthResponse.data).toHaveProperty('status', 'ok');
      expect(healthResponse.data).toHaveProperty('timestamp');
      expect(healthResponse.data).toHaveProperty('version');
      expect(healthResponse.data).toHaveProperty('uptime');
      expect(healthResponse.data).toHaveProperty('environment');

      // Verify timestamp is recent
      const timestamp = new Date(healthResponse.data.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - timestamp.getTime();
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds

      // Test detailed health check
      const detailedHealthResponse = await apiHelper.apiCall('GET', '/api/health/detailed', {
        expectedStatus: 200,
      });

      expect(detailedHealthResponse.data).toHaveProperty('status');
      expect(detailedHealthResponse.data).toHaveProperty('services');
      expect(detailedHealthResponse.data).toHaveProperty('metrics');
      expect(detailedHealthResponse.data).toHaveProperty('dependencies');

      // Verify services status
      const services = detailedHealthResponse.data.services;
      expect(services).toHaveProperty('database');
      expect(services).toHaveProperty('redis');
      expect(services).toHaveProperty('storage');
      expect(services).toHaveProperty('auth');

      Object.keys(services).forEach((serviceName) => {
        const service = services[serviceName];
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('responseTime');
        expect(service).toHaveProperty('lastChecked');
        expect(['healthy', 'degraded', 'unhealthy']).toContain(service.status);
      });

      // Verify metrics
      const metrics = detailedHealthResponse.data.metrics;
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('network');

      expect(metrics.memory).toHaveProperty('used');
      expect(metrics.memory).toHaveProperty('total');
      expect(metrics.memory).toHaveProperty('percentage');
      expect(metrics.cpu).toHaveProperty('usage');
      expect(metrics.disk).toHaveProperty('used');
      expect(metrics.disk).toHaveProperty('available');
    });

    test('should provide service-specific health checks', async ({ apiHelper }) => {
      const services = ['database', 'redis', 'storage', 'auth', 'search'];

      for (const service of services) {
        const serviceHealthResponse = await apiHelper.apiCall('GET', `/api/health/${service}`, {
          expectedStatus: 200,
        });

        expect(serviceHealthResponse.data).toHaveProperty('service', service);
        expect(serviceHealthResponse.data).toHaveProperty('status');
        expect(serviceHealthResponse.data).toHaveProperty('responseTime');
        expect(serviceHealthResponse.data).toHaveProperty('details');

        if (service === 'database') {
          expect(serviceHealthResponse.data.details).toHaveProperty('connectionPool');
          expect(serviceHealthResponse.data.details).toHaveProperty('activeConnections');
          expect(serviceHealthResponse.data.details).toHaveProperty('queryTime');
        }

        if (service === 'redis') {
          expect(serviceHealthResponse.data.details).toHaveProperty('memory');
          expect(serviceHealthResponse.data.details).toHaveProperty('connectedClients');
          expect(serviceHealthResponse.data.details).toHaveProperty('keyspaceHits');
          expect(serviceHealthResponse.data.details).toHaveProperty('keyspaceMisses');
        }

        if (service === 'storage') {
          expect(serviceHealthResponse.data.details).toHaveProperty('bucketAccess');
          expect(serviceHealthResponse.data.details).toHaveProperty('uploadTest');
          expect(serviceHealthResponse.data.details).toHaveProperty('deleteTest');
        }

        if (service === 'auth') {
          expect(serviceHealthResponse.data.details).toHaveProperty('providers');
          expect(serviceHealthResponse.data.details).toHaveProperty('sessionStore');
          expect(serviceHealthResponse.data.details).toHaveProperty('tokenValidation');
        }
      }
    });

    test('should provide readiness and liveness probes', async ({ apiHelper }) => {
      // Test readiness probe (ready to serve traffic)
      const readinessResponse = await apiHelper.apiCall('GET', '/api/health/ready', {
        expectedStatus: 200,
      });

      expect(readinessResponse.data).toHaveProperty('ready');
      expect(readinessResponse.data).toHaveProperty('services');
      expect(readinessResponse.data.ready).toBe(true);

      // All critical services should be ready
      const criticalServices = ['database', 'auth'];
      criticalServices.forEach((service) => {
        expect(readinessResponse.data.services).toHaveProperty(service);
        expect(readinessResponse.data.services[service].ready).toBe(true);
      });

      // Test liveness probe (application is alive)
      const livenessResponse = await apiHelper.apiCall('GET', '/api/health/live', {
        expectedStatus: 200,
      });

      expect(livenessResponse.data).toHaveProperty('alive', true);
      expect(livenessResponse.data).toHaveProperty('timestamp');
      expect(livenessResponse.data).toHaveProperty('pid');

      // Test startup probe (application has started successfully)
      const startupResponse = await apiHelper.apiCall('GET', '/api/health/startup', {
        expectedStatus: 200,
      });

      expect(startupResponse.data).toHaveProperty('started', true);
      expect(startupResponse.data).toHaveProperty('startTime');
      expect(startupResponse.data).toHaveProperty('initializationSteps');

      const initSteps = startupResponse.data.initializationSteps;
      expect(initSteps).toHaveProperty('database');
      expect(initSteps).toHaveProperty('redis');
      expect(initSteps).toHaveProperty('storage');
      expect(initSteps).toHaveProperty('routes');

      Object.values(initSteps).forEach((step) => {
        expect(step).toHaveProperty('completed', true);
        expect(step).toHaveProperty('duration');
      });
    });
  });

  test.describe('Performance and Resource Monitoring', () => {
    test('should provide comprehensive performance metrics', async ({ apiHelper }) => {
      // Test performance metrics endpoint
      const metricsResponse = await apiHelper.apiCall('GET', '/api/health/metrics', {
        expectedStatus: 200,
      });

      expect(metricsResponse.data).toHaveProperty('system');
      expect(metricsResponse.data).toHaveProperty('application');
      expect(metricsResponse.data).toHaveProperty('business');
      expect(metricsResponse.data).toHaveProperty('timestamp');

      // System metrics
      const systemMetrics = metricsResponse.data.system;
      expect(systemMetrics).toHaveProperty('memory');
      expect(systemMetrics).toHaveProperty('cpu');
      expect(systemMetrics).toHaveProperty('disk');
      expect(systemMetrics).toHaveProperty('network');
      expect(systemMetrics).toHaveProperty('load');

      expect(systemMetrics.memory).toHaveProperty('rss');
      expect(systemMetrics.memory).toHaveProperty('heapTotal');
      expect(systemMetrics.memory).toHaveProperty('heapUsed');
      expect(systemMetrics.memory).toHaveProperty('external');

      // Application metrics
      const appMetrics = metricsResponse.data.application;
      expect(appMetrics).toHaveProperty('requestRate');
      expect(appMetrics).toHaveProperty('responseTime');
      expect(appMetrics).toHaveProperty('errorRate');
      expect(appMetrics).toHaveProperty('activeConnections');

      expect(appMetrics.requestRate).toHaveProperty('1min');
      expect(appMetrics.requestRate).toHaveProperty('5min');
      expect(appMetrics.requestRate).toHaveProperty('15min');

      expect(appMetrics.responseTime).toHaveProperty('p50');
      expect(appMetrics.responseTime).toHaveProperty('p95');
      expect(appMetrics.responseTime).toHaveProperty('p99');
      expect(appMetrics.responseTime).toHaveProperty('mean');

      // Business metrics
      const businessMetrics = metricsResponse.data.business;
      expect(businessMetrics).toHaveProperty('totalJsonUploads');
      expect(businessMetrics).toHaveProperty('totalPublicLibraryViews');
      expect(businessMetrics).toHaveProperty('activeUsers');
      expect(businessMetrics).toHaveProperty('extensionSubmissions');

      // Test metrics with time range
      const historicalMetricsResponse = await apiHelper.apiCall('GET', '/api/health/metrics', {
        params: {
          from: new Date(Date.now() - 3600000).toISOString(), // Last hour
          to: new Date().toISOString(),
          granularity: '5min',
        },
        expectedStatus: 200,
      });

      expect(historicalMetricsResponse.data).toHaveProperty('timeSeries');
      expect(Array.isArray(historicalMetricsResponse.data.timeSeries)).toBe(true);

      if (historicalMetricsResponse.data.timeSeries.length > 0) {
        const dataPoint = historicalMetricsResponse.data.timeSeries[0];
        expect(dataPoint).toHaveProperty('timestamp');
        expect(dataPoint).toHaveProperty('metrics');
      }
    });

    test('should monitor database performance and connection health', async ({ apiHelper }) => {
      const dbHealthResponse = await apiHelper.apiCall('GET', '/api/health/database', {
        expectedStatus: 200,
      });

      expect(dbHealthResponse.data).toHaveProperty('status');
      expect(dbHealthResponse.data).toHaveProperty('connectionPool');
      expect(dbHealthResponse.data).toHaveProperty('performance');
      expect(dbHealthResponse.data).toHaveProperty('replication');

      // Connection pool metrics
      const poolMetrics = dbHealthResponse.data.connectionPool;
      expect(poolMetrics).toHaveProperty('total');
      expect(poolMetrics).toHaveProperty('active');
      expect(poolMetrics).toHaveProperty('idle');
      expect(poolMetrics).toHaveProperty('waiting');
      expect(poolMetrics).toHaveProperty('maxWait');

      // Performance metrics
      const perfMetrics = dbHealthResponse.data.performance;
      expect(perfMetrics).toHaveProperty('averageQueryTime');
      expect(perfMetrics).toHaveProperty('slowQueries');
      expect(perfMetrics).toHaveProperty('locksWaiting');
      expect(perfMetrics).toHaveProperty('transactionsPerSecond');

      // Test database connectivity with actual query
      const dbTestResponse = await apiHelper.apiCall('POST', '/api/health/database/test', {
        data: {
          testType: 'full',
          includeWrite: true,
          includeRead: true,
        },
        expectedStatus: 200,
      });

      expect(dbTestResponse.data).toHaveProperty('tests');
      expect(dbTestResponse.data.tests).toHaveProperty('connection');
      expect(dbTestResponse.data.tests).toHaveProperty('read');
      expect(dbTestResponse.data.tests).toHaveProperty('write');
      expect(dbTestResponse.data.tests).toHaveProperty('transaction');

      Object.values(dbTestResponse.data.tests).forEach((test: any) => {
        expect(test).toHaveProperty('success');
        expect(test).toHaveProperty('duration');
        expect(test.success).toBe(true);
      });
    });

    test('should monitor API endpoint performance and availability', async ({ apiHelper }) => {
      // Test API endpoints health
      const apiHealthResponse = await apiHelper.apiCall('GET', '/api/health/endpoints', {
        expectedStatus: 200,
      });

      expect(apiHealthResponse.data).toHaveProperty('endpoints');
      expect(Array.isArray(apiHealthResponse.data.endpoints)).toBe(true);

      const criticalEndpoints = [
        '/api/json/upload',
        '/api/json/[id]/content',
        '/api/saved',
        '/api/extension/submit',
        '/api/health',
      ];

      const endpointData = apiHealthResponse.data.endpoints;
      criticalEndpoints.forEach((endpoint) => {
        const endpointInfo = endpointData.find((ep) => ep.path === endpoint);
        expect(endpointInfo).toBeDefined();
        expect(endpointInfo).toHaveProperty('status');
        expect(endpointInfo).toHaveProperty('responseTime');
        expect(endpointInfo).toHaveProperty('successRate');
        expect(endpointInfo).toHaveProperty('requestCount');
      });

      // Test specific endpoint health
      const endpointTestResponse = await apiHelper.apiCall('POST', '/api/health/endpoints/test', {
        data: {
          endpoints: ['/api/json/upload', '/api/health'],
          testType: 'synthetic',
          timeout: 5000,
        },
        expectedStatus: 200,
      });

      expect(endpointTestResponse.data).toHaveProperty('results');
      expect(Array.isArray(endpointTestResponse.data.results)).toBe(true);

      endpointTestResponse.data.results.forEach((result) => {
        expect(result).toHaveProperty('endpoint');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('responseTime');
        expect(result).toHaveProperty('statusCode');
      });

      // Test rate limiting health
      const rateLimitResponse = await apiHelper.apiCall('GET', '/api/health/rate-limiting', {
        expectedStatus: 200,
      });

      expect(rateLimitResponse.data).toHaveProperty('status');
      expect(rateLimitResponse.data).toHaveProperty('windows');
      expect(rateLimitResponse.data).toHaveProperty('blockedRequests');
      expect(rateLimitResponse.data).toHaveProperty('allowedRequests');

      expect(rateLimitResponse.data.windows).toHaveProperty('1min');
      expect(rateLimitResponse.data.windows).toHaveProperty('1hour');
      expect(rateLimitResponse.data.windows).toHaveProperty('1day');
    });
  });

  test.describe('External Dependencies and Third-Party Services', () => {
    test('should monitor external service dependencies', async ({ apiHelper }) => {
      const depsResponse = await apiHelper.apiCall('GET', '/api/health/dependencies', {
        expectedStatus: 200,
      });

      expect(depsResponse.data).toHaveProperty('external');
      expect(depsResponse.data).toHaveProperty('summary');

      const externalDeps = depsResponse.data.external;

      // Common external dependencies
      const expectedDeps = ['storage', 'email', 'auth-providers', 'cdn'];

      expectedDeps.forEach((dep) => {
        if (externalDeps[dep]) {
          expect(externalDeps[dep]).toHaveProperty('status');
          expect(externalDeps[dep]).toHaveProperty('responseTime');
          expect(externalDeps[dep]).toHaveProperty('lastCheck');
          expect(['healthy', 'degraded', 'unhealthy', 'unknown']).toContain(
            externalDeps[dep].status
          );
        }
      });

      // Test OAuth provider health
      if (externalDeps['auth-providers']) {
        const authProvidersHealth = await apiHelper.apiCall('GET', '/api/health/auth-providers', {
          expectedStatus: 200,
        });

        expect(authProvidersHealth.data).toHaveProperty('providers');

        const providers = authProvidersHealth.data.providers;
        ['google', 'github'].forEach((provider) => {
          if (providers[provider]) {
            expect(providers[provider]).toHaveProperty('status');
            expect(providers[provider]).toHaveProperty('lastTest');
            expect(providers[provider]).toHaveProperty('configuration');
          }
        });
      }

      // Test storage service health
      if (externalDeps['storage']) {
        const storageHealthResponse = await apiHelper.apiCall('POST', '/api/health/storage/test', {
          data: {
            testOperations: ['upload', 'download', 'delete'],
            testFileSize: 1024, // 1KB test file
          },
          expectedStatus: 200,
        });

        expect(storageHealthResponse.data).toHaveProperty('tests');
        expect(storageHealthResponse.data.tests).toHaveProperty('upload');
        expect(storageHealthResponse.data.tests).toHaveProperty('download');
        expect(storageHealthResponse.data.tests).toHaveProperty('delete');

        Object.values(storageHealthResponse.data.tests).forEach((test) => {
          expect(test).toHaveProperty('success');
          expect(test).toHaveProperty('duration');
        });
      }
    });

    test('should provide CDN and static asset health monitoring', async ({ apiHelper }) => {
      const cdnHealthResponse = await apiHelper.apiCall('GET', '/api/health/cdn', {
        expectedStatus: 200,
      });

      expect(cdnHealthResponse.data).toHaveProperty('status');
      expect(cdnHealthResponse.data).toHaveProperty('endpoints');
      expect(cdnHealthResponse.data).toHaveProperty('cacheHitRatio');
      expect(cdnHealthResponse.data).toHaveProperty('bandwidth');

      // Test static assets availability
      const assetsTestResponse = await apiHelper.apiCall('POST', '/api/health/assets/test', {
        data: {
          assets: ['/embed/widget.js', '/embed/auto-init.js', '/static/styles.css'],
        },
        expectedStatus: 200,
      });

      expect(assetsTestResponse.data).toHaveProperty('results');
      expect(Array.isArray(assetsTestResponse.data.results)).toBe(true);

      assetsTestResponse.data.results.forEach((result) => {
        expect(result).toHaveProperty('asset');
        expect(result).toHaveProperty('available');
        expect(result).toHaveProperty('responseTime');
        expect(result).toHaveProperty('size');
      });
    });
  });

  test.describe('Alerts and Monitoring Integration', () => {
    test('should support custom health check configurations and thresholds', async ({
      apiHelper,
    }) => {
      // Get current health check configuration
      const configResponse = await apiHelper.apiCall('GET', '/api/health/config', {
        expectedStatus: 200,
      });

      expect(configResponse.data).toHaveProperty('checks');
      expect(configResponse.data).toHaveProperty('thresholds');
      expect(configResponse.data).toHaveProperty('alerts');

      // Test threshold configuration
      const thresholds = configResponse.data.thresholds;
      expect(thresholds).toHaveProperty('response_time');
      expect(thresholds).toHaveProperty('error_rate');
      expect(thresholds).toHaveProperty('memory_usage');
      expect(thresholds).toHaveProperty('cpu_usage');

      // Update health check configuration (if allowed)
      const updateConfigResponse = await apiHelper.apiCall('PUT', '/api/health/config', {
        data: {
          thresholds: {
            response_time: { warning: 1000, critical: 5000 },
            error_rate: { warning: 0.01, critical: 0.05 },
            memory_usage: { warning: 0.8, critical: 0.95 },
            cpu_usage: { warning: 0.7, critical: 0.9 },
          },
          checks: {
            database: { interval: 30, timeout: 10 },
            redis: { interval: 30, timeout: 5 },
            storage: { interval: 60, timeout: 15 },
          },
        },
        expectedStatus: 200,
      });

      expect(updateConfigResponse.data).toHaveProperty('updated', true);

      // Test alert configuration
      const alertConfigResponse = await apiHelper.apiCall('GET', '/api/health/alerts/config', {
        expectedStatus: 200,
      });

      expect(alertConfigResponse.data).toHaveProperty('webhooks');
      expect(alertConfigResponse.data).toHaveProperty('email');
      expect(alertConfigResponse.data).toHaveProperty('slack');
      expect(alertConfigResponse.data).toHaveProperty('rules');

      // Test alert history
      const alertHistoryResponse = await apiHelper.apiCall('GET', '/api/health/alerts/history', {
        params: {
          timeframe: '24h',
          severity: 'all',
          limit: '50',
        },
        expectedStatus: 200,
      });

      expect(alertHistoryResponse.data).toHaveProperty('alerts');
      expect(alertHistoryResponse.data).toHaveProperty('summary');
      expect(Array.isArray(alertHistoryResponse.data.alerts)).toBe(true);

      if (alertHistoryResponse.data.alerts.length > 0) {
        const alert = alertHistoryResponse.data.alerts[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('component');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('resolved');
      }
    });

    test('should provide webhook notifications for health events', async ({ apiHelper }) => {
      // Test webhook configuration
      const webhookConfigResponse = await apiHelper.apiCall('GET', '/api/health/webhooks/config', {
        expectedStatus: 200,
      });

      expect(webhookConfigResponse.data).toHaveProperty('endpoints');
      expect(Array.isArray(webhookConfigResponse.data.endpoints)).toBe(true);

      // Configure a test webhook
      const webhookSetupResponse = await apiHelper.apiCall(
        'POST',
        '/api/health/webhooks/configure',
        {
          data: {
            url: 'https://webhook.site/test-health-webhook',
            events: ['service_down', 'high_error_rate', 'resource_threshold'],
            secret: 'webhook-secret-key',
            enabled: true,
            retryPolicy: {
              maxRetries: 3,
              backoffMultiplier: 2,
            },
          },
          expectedStatus: 201,
        }
      );

      expect(webhookSetupResponse.data).toHaveProperty('webhookId');
      expect(webhookSetupResponse.data).toHaveProperty('configured', true);

      const webhookId = webhookSetupResponse.data.webhookId;

      // Test webhook delivery
      const testWebhookResponse = await apiHelper.apiCall(
        'POST',
        `/api/health/webhooks/${webhookId}/test`,
        {
          data: {
            eventType: 'test_event',
            payload: {
              service: 'database',
              status: 'degraded',
              message: 'Connection pool exhausted',
            },
          },
          expectedStatus: 200,
        }
      );

      expect(testWebhookResponse.data).toHaveProperty('delivered');
      expect(testWebhookResponse.data).toHaveProperty('responseTime');
      expect(testWebhookResponse.data).toHaveProperty('responseCode');

      // Get webhook delivery history
      const deliveryHistoryResponse = await apiHelper.apiCall(
        'GET',
        `/api/health/webhooks/${webhookId}/deliveries`,
        {
          params: {
            limit: '20',
            timeframe: '24h',
          },
          expectedStatus: 200,
        }
      );

      expect(deliveryHistoryResponse.data).toHaveProperty('deliveries');
      expect(Array.isArray(deliveryHistoryResponse.data.deliveries)).toBe(true);

      if (deliveryHistoryResponse.data.deliveries.length > 0) {
        const delivery = deliveryHistoryResponse.data.deliveries[0];
        expect(delivery).toHaveProperty('timestamp');
        expect(delivery).toHaveProperty('eventType');
        expect(delivery).toHaveProperty('success');
        expect(delivery).toHaveProperty('responseTime');
      }
    });

    test('should integrate with external monitoring systems', async ({ apiHelper }) => {
      // Test Prometheus metrics endpoint
      const prometheusResponse = await apiHelper.apiCall('GET', '/api/health/metrics/prometheus', {
        expectedStatus: 200,
      });

      // Should return Prometheus format metrics
      expect(typeof prometheusResponse.data).toBe('string');
      expect(prometheusResponse.response.headers()['content-type']).toContain('text/plain');

      // Verify common Prometheus metrics are present
      const metricsText = prometheusResponse.data;
      expect(metricsText).toContain('# HELP');
      expect(metricsText).toContain('# TYPE');
      expect(metricsText).toContain('http_requests_total');
      expect(metricsText).toContain('http_request_duration');
      expect(metricsText).toContain('system_memory_usage');

      // Test health check JSON for external monitoring
      const jsonHealthResponse = await apiHelper.apiCall('GET', '/api/health/status.json', {
        expectedStatus: 200,
      });

      expect(jsonHealthResponse.data).toHaveProperty('status');
      expect(jsonHealthResponse.data).toHaveProperty('version');
      expect(jsonHealthResponse.data).toHaveProperty('checks');

      // Test XML health check for legacy systems
      const xmlHealthResponse = await apiHelper.apiCall('GET', '/api/health/status.xml', {
        expectedStatus: 200,
      });

      expect(xmlHealthResponse.response.headers()['content-type']).toContain('application/xml');

      // Test custom monitoring integration
      const customMonitoringResponse = await apiHelper.apiCall('GET', '/api/health/custom', {
        params: {
          format: 'datadog',
          include: 'metrics,services,dependencies',
        },
        expectedStatus: 200,
      });

      expect(customMonitoringResponse.data).toHaveProperty('series');
      expect(Array.isArray(customMonitoringResponse.data.series)).toBe(true);

      if (customMonitoringResponse.data.series.length > 0) {
        const metric = customMonitoringResponse.data.series[0];
        expect(metric).toHaveProperty('metric');
        expect(metric).toHaveProperty('points');
        expect(metric).toHaveProperty('tags');
      }
    });
  });

  test.describe('Health Check Performance and Reliability', () => {
    test('should ensure health check endpoints are fast and reliable', async ({ apiHelper }) => {
      const endpoints = ['/api/health', '/api/health/live', '/api/health/ready'];

      for (const endpoint of endpoints) {
        const iterations = 10;
        const responseTimes = [];

        // Measure response times across multiple requests
        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();

          const response = await apiHelper.apiCall('GET', endpoint, {
            expectedStatus: 200,
          });

          const endTime = Date.now();
          const responseTime = endTime - startTime;
          responseTimes.push(responseTime);

          expect(response.status).toBe(200);
        }

        // Calculate statistics
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const maxResponseTime = Math.max(...responseTimes);
        const minResponseTime = Math.min(...responseTimes);

        // Health checks should be fast
        expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
        expect(maxResponseTime).toBeLessThan(2000); // Max under 2 seconds

        console.log(`${endpoint} performance:`, {
          avg: Math.round(avgResponseTime),
          max: maxResponseTime,
          min: minResponseTime,
        });
      }
    });

    test('should handle concurrent health check requests efficiently', async ({ apiHelper }) => {
      const concurrentRequests = 20;
      const endpoint = '/api/health';

      const startTime = Date.now();

      // Make concurrent requests
      const requests = Array(concurrentRequests)
        .fill(null)
        .map(() =>
          apiHelper.apiCall('GET', endpoint, {
            expectedStatus: 200,
          })
        );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status', 'ok');
      });

      // Should handle concurrent load efficiently
      expect(totalTime).toBeLessThan(5000); // Total time under 5 seconds

      const avgTimePerRequest = totalTime / concurrentRequests;
      expect(avgTimePerRequest).toBeLessThan(1000); // Average under 1 second

      console.log('Concurrent health check performance:', {
        totalRequests: concurrentRequests,
        totalTime: totalTime,
        avgTimePerRequest: Math.round(avgTimePerRequest),
      });
    });

    test('should maintain health check accuracy during system stress', async ({ apiHelper }) => {
      // Create some load on the system by making multiple API calls
      const loadRequests = Array(50)
        .fill(null)
        .map(
          (_, i) =>
            apiHelper
              .apiCall('POST', '/api/json/upload', {
                data: {
                  content: JSON.stringify({
                    stress: true,
                    index: i,
                    data: Array(100).fill(`item-${i}`),
                  }),
                  title: `Stress Test JSON ${i}`,
                },
              })
              .catch(() => ({ status: 'error' })) // Handle potential failures gracefully
        );

      // Run health checks during the load
      const healthCheckPromises = Array(10)
        .fill(null)
        .map(
          (_, i) =>
            new Promise((resolve) => {
              setTimeout(async () => {
                try {
                  const healthResponse = await apiHelper.apiCall('GET', '/api/health/detailed', {
                    expectedStatus: 200,
                  });
                  resolve({ success: true, data: healthResponse.data });
                } catch (error) {
                  resolve({ success: false, error });
                }
              }, i * 100); // Stagger health checks
            })
        );

      // Wait for all operations to complete
      const [loadResults, healthResults] = await Promise.all([
        Promise.all(loadRequests),
        Promise.all(healthCheckPromises),
      ]);

      // Verify health checks remained accurate
      const successfulHealthChecks = healthResults.filter(
        (result: any) => result.success
      );
      expect(successfulHealthChecks.length).toBeGreaterThan(8); // At least 80% success rate

      successfulHealthChecks.forEach((healthCheck: any) => {
        expect(healthCheck.data).toHaveProperty('status');
        expect(healthCheck.data).toHaveProperty('services');
        expect(healthCheck.data).toHaveProperty('metrics');

        // Services should still report accurately
        Object.values(healthCheck.data.services).forEach((service: any) => {
          expect(service).toHaveProperty('status');
          expect(service).toHaveProperty('responseTime');
          expect(['healthy', 'degraded', 'unhealthy']).toContain(service.status);
        });
      });

      console.log('System stress test results:', {
        loadRequestsCompleted: loadResults.length,
        successfulHealthChecks: successfulHealthChecks.length,
        healthCheckSuccessRate: (successfulHealthChecks.length / healthResults.length) * 100,
      });
    });
  });
});

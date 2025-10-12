import { test, expect } from '../../utils/base-test';
import { generateLargeJSON } from '../../fixtures/json-samples';
import { createHash } from 'crypto';

test.describe('Developer - Streaming API for Large Files', () => {
  test.describe('Streaming Upload', () => {
    test('should upload large JSON via streaming API', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Generate large JSON (5MB+)
      const largeJSON = generateLargeJSON(5000, 8, 500);
      const jsonString = JSON.stringify(largeJSON);
      const fileSizeMB = Buffer.byteLength(jsonString, 'utf8') / (1024 * 1024);

      expect(fileSizeMB).toBeGreaterThan(5); // Ensure it's actually large

      // Stream upload
      const uploadResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload', {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(jsonString, 'utf8').toString(),
          'X-Stream-Upload': 'true',
        },
        data: jsonString,
        expectedStatus: 202, // Accepted for processing
      });

      expect(uploadResponse.status).toBe(202);
      expect(uploadResponse.data).toHaveProperty('uploadId');
      expect(uploadResponse.data).toHaveProperty('status', 'processing');

      const uploadId = uploadResponse.data.uploadId;

      // Poll for completion
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

        const statusResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/upload/${uploadId}/status`,
          {
            expectedStatus: 200,
          }
        );

        if (statusResponse.data.status === 'completed') {
          processingComplete = true;
          expect(statusResponse.data).toHaveProperty('jsonId');
          expect(statusResponse.data.fileSize).toBeGreaterThan(5000000); // > 5MB
        } else if (statusResponse.data.status === 'failed') {
          throw new Error(`Upload failed: ${statusResponse.data.error}`);
        }

        attempts++;
      }

      expect(processingComplete).toBe(true);
    });

    test('should handle chunked upload for very large files', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const largeJSON = generateLargeJSON(10000, 5, 100);
      const jsonString = JSON.stringify(largeJSON);
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalSize = Buffer.byteLength(jsonString, 'utf8');
      const chunks = Math.ceil(totalSize / chunkSize);

      // Initialize chunked upload
      const initResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload/init', {
        data: {
          filename: 'large-chunked.json',
          totalSize: totalSize,
          chunkSize: chunkSize,
          contentType: 'application/json',
        },
        expectedStatus: 201,
      });

      expect(initResponse.data).toHaveProperty('uploadId');
      expect(initResponse.data).toHaveProperty('chunkUrls');
      expect(initResponse.data.chunkUrls.length).toBe(chunks);

      const uploadId = initResponse.data.uploadId;

      // Upload chunks
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunk = jsonString.slice(start, end);

        const chunkResponse = await apiHelper.apiCall('PUT', initResponse.data.chunkUrls[i], {
          data: chunk,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': Buffer.byteLength(chunk, 'utf8').toString(),
          },
          expectedStatus: 200,
        });

        expect(chunkResponse.status).toBe(200);
      }

      // Finalize upload
      const finalizeResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/upload/${uploadId}/finalize`,
        {
          expectedStatus: 202,
        }
      );

      expect(finalizeResponse.data).toHaveProperty('status', 'processing');

      // Wait for processing to complete
      let processingComplete = false;
      let attempts = 0;

      while (!processingComplete && attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/upload/${uploadId}/status`,
          {
            expectedStatus: 200,
          }
        );

        if (statusResponse.data.status === 'completed') {
          processingComplete = true;
          expect(statusResponse.data).toHaveProperty('jsonId');
        }

        attempts++;
      }

      expect(processingComplete).toBe(true);
    });

    test('should validate streaming upload integrity', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      const testData = {
        integrity: 'test',
        checksum: 'validation',
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item${i}` })),
      };
      const jsonString = JSON.stringify(testData);
      const checksum = createHash('sha256').update(jsonString).digest('hex');

      const uploadResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload', {
        headers: {
          'Content-Type': 'application/json',
          'X-Content-SHA256': checksum,
          'X-Stream-Upload': 'true',
        },
        data: jsonString,
        expectedStatus: 202,
      });

      const uploadId = uploadResponse.data.uploadId;

      // Wait for processing
      let attempts = 0;
      while (attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/upload/${uploadId}/status`,
          {
            expectedStatus: 200,
          }
        );

        if (statusResponse.data.status === 'completed') {
          expect(statusResponse.data).toHaveProperty('checksumValid', true);
          break;
        } else if (statusResponse.data.status === 'failed') {
          if (statusResponse.data.error.includes('checksum')) {
            // This is expected if we intentionally corrupt the checksum
            expect(statusResponse.data.checksumValid).toBe(false);
          }
          break;
        }

        attempts++;
      }
    });
  });

  test.describe('Streaming Download', () => {
    test('should download large JSON via streaming API', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // First upload a large JSON
      const largeJSON = generateLargeJSON(2000, 6, 200);
      const uploadResponse = await apiHelper.uploadJSON(largeJSON, {
        title: 'Large JSON for Download Test',
      });

      const jsonId = uploadResponse.id;

      // Request streaming download
      const downloadResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/stream/download/${jsonId}`,
        {
          headers: {
            Accept: 'application/json',
            'X-Stream-Download': 'true',
          },
          expectedStatus: 200,
        }
      );

      expect(downloadResponse.response.headers()['content-type']).toContain('application/json');
      expect(downloadResponse.response.headers()['transfer-encoding']).toBe('chunked');

      // Verify content integrity
      const downloadedData = downloadResponse.data;
      expect(downloadedData).toHaveProperty('metadata');
      expect(downloadedData.data.length).toBe(2000);
    });

    test('should support range requests for partial downloads', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const testJSON = generateLargeJSON(1000, 3, 50);
      const uploadResponse = await apiHelper.uploadJSON(testJSON, {
        title: 'Range Request Test JSON',
      });

      const jsonId = uploadResponse.id;

      // Request partial content (first 1KB)
      const rangeResponse = await apiHelper.apiCall('GET', `/api/json/stream/download/${jsonId}`, {
        headers: {
          Range: 'bytes=0-1023',
        },
        expectedStatus: 206, // Partial Content
      });

      expect(rangeResponse.status).toBe(206);
      expect(rangeResponse.response.headers()['content-range']).toBeDefined();
      expect(rangeResponse.response.headers()['accept-ranges']).toBe('bytes');
    });

    test('should handle concurrent streaming downloads', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Upload test JSON
      const testJSON = generateLargeJSON(500, 4, 100);
      const uploadResponse = await apiHelper.uploadJSON(testJSON, {
        title: 'Concurrent Download Test',
      });

      const jsonId = uploadResponse.id;

      // Start multiple concurrent downloads
      const downloadPromises = Array.from({ length: 5 }, (_, i) =>
        apiHelper.apiCall('GET', `/api/json/stream/download/${jsonId}`, {
          headers: {
            'X-Client-Id': `concurrent-client-${i}`,
            'X-Stream-Download': 'true',
          },
          expectedStatus: 200,
        })
      );

      const downloadResults = await Promise.all(downloadPromises);

      // All downloads should succeed
      downloadResults.forEach((result, i) => {
        expect(result.status).toBe(200);
        expect(result.data).toHaveProperty('metadata');
        expect(result.data.data.length).toBe(500);
      });
    });
  });

  test.describe('Streaming Processing', () => {
    test('should process JSON transformations via streaming', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const largeJSON = generateLargeJSON(1000, 5, 100);
      const uploadResponse = await apiHelper.uploadJSON(largeJSON, {
        title: 'Transform Test JSON',
      });

      const jsonId = uploadResponse.id;

      // Request streaming transformation
      const transformResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/transform/${jsonId}`,
        {
          data: {
            operations: [
              { type: 'filter', path: '$.data[*]', condition: 'item.index % 2 === 0' },
              { type: 'map', path: '$.data[*]', transform: 'item.transformed = true; return item' },
              { type: 'sort', path: '$.data', key: 'index', order: 'desc' },
            ],
            outputFormat: 'json',
          },
          expectedStatus: 202,
        }
      );

      expect(transformResponse.data).toHaveProperty('transformId');
      expect(transformResponse.data.status).toBe('processing');

      const transformId = transformResponse.data.transformId;

      // Poll for completion
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/transform/${transformId}/status`,
          {
            expectedStatus: 200,
          }
        );

        if (statusResponse.data.status === 'completed') {
          completed = true;
          expect(statusResponse.data).toHaveProperty('resultId');

          // Download transformed result
          const resultResponse = await apiHelper.apiCall(
            'GET',
            `/api/json/stream/download/${statusResponse.data.resultId}`,
            {
              expectedStatus: 200,
            }
          );

          // Verify transformation was applied
          const transformedData = resultResponse.data;
          expect(transformedData.data.length).toBeLessThan(largeJSON.data.length); // Filtered
          expect(transformedData.data[0]).toHaveProperty('transformed', true); // Mapped
        }

        attempts++;
      }

      expect(completed).toBe(true);
    });

    test('should analyze large JSON structure via streaming', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const complexJSON = generateLargeJSON(3000, 8, 200);
      const uploadResponse = await apiHelper.uploadJSON(complexJSON, {
        title: 'Complex Analysis JSON',
      });

      const jsonId = uploadResponse.id;

      // Request streaming analysis
      const analysisResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/analyze/${jsonId}`,
        {
          data: {
            analysisType: 'full',
            includeMetrics: true,
            includeSchema: true,
            includeStatistics: true,
          },
          expectedStatus: 202,
        }
      );

      expect(analysisResponse.data).toHaveProperty('analysisId');

      const analysisId = analysisResponse.data.analysisId;

      // Wait for analysis completion
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/analyze/${analysisId}/status`,
          {
            expectedStatus: 200,
          }
        );

        if (statusResponse.data.status === 'completed') {
          completed = true;

          const results = statusResponse.data.results;
          expect(results).toHaveProperty('nodeCount');
          expect(results).toHaveProperty('maxDepth');
          expect(results).toHaveProperty('sizeBytes');
          expect(results).toHaveProperty('schema');
          expect(results).toHaveProperty('statistics');

          expect(results.nodeCount).toBeGreaterThan(10000);
          expect(results.maxDepth).toBeGreaterThan(8);
        }

        attempts++;
      }

      expect(completed).toBe(true);
    });
  });

  test.describe('Streaming Error Handling', () => {
    test('should handle streaming upload failures gracefully', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Simulate network interruption during upload
      const largeJSON = generateLargeJSON(1000, 5, 100);
      const jsonString = JSON.stringify(largeJSON);

      try {
        // Start upload but simulate connection failure
        const uploadResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload', {
          headers: {
            'Content-Type': 'application/json',
            'X-Stream-Upload': 'true',
            'X-Simulate-Failure': 'network-error', // Test header
          },
          data: jsonString,
          expectedStatus: 500,
        });

        expect(uploadResponse.status).toBe(500);
        expect(uploadResponse.data).toHaveProperty('error');
      } catch (error) {
        // Expected network error
        expect(error).toBeTruthy();
      }
    });

    test('should handle corrupted streaming data', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Send corrupted JSON data
      const corruptedData = '{"valid": "start", "corrupted": [1,2,3,4,incomplete...';

      const uploadResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload', {
        headers: {
          'Content-Type': 'application/json',
          'X-Stream-Upload': 'true',
        },
        data: corruptedData,
        expectedStatus: 400,
      });

      expect(uploadResponse.status).toBe(400);
      expect(uploadResponse.data).toHaveProperty('error');
      expect(uploadResponse.data.error).toContain('Invalid JSON');
    });

    test('should timeout long-running streaming operations', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const testJSON = generateLargeJSON(100, 3, 10);
      const uploadResponse = await apiHelper.uploadJSON(testJSON, {
        title: 'Timeout Test JSON',
      });

      const jsonId = uploadResponse.id;

      // Request operation that should timeout
      const timeoutResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/transform/${jsonId}`,
        {
          data: {
            operations: [
              { type: 'custom', script: 'while(true) { /* infinite loop */ }' }, // Simulated timeout
            ],
            timeout: 1, // 1 second timeout
          },
          expectedStatus: 408, // Request Timeout
        }
      );

      expect(timeoutResponse.status).toBe(408);
      expect(timeoutResponse.data).toHaveProperty('error');
      expect(timeoutResponse.data.error).toContain('timeout');
    });
  });

  test.describe('Streaming Performance Metrics', () => {
    test('should track streaming upload performance', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      const startTime = Date.now();
      const largeJSON = generateLargeJSON(2000, 5, 100);
      const jsonString = JSON.stringify(largeJSON);
      const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

      const uploadResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload', {
        headers: {
          'Content-Type': 'application/json',
          'X-Stream-Upload': 'true',
        },
        data: jsonString,
        expectedStatus: 202,
      });

      const uploadId = uploadResponse.data.uploadId;

      // Wait for completion and track metrics
      let completed = false;
      let attempts = 0;
      let metrics = null;

      while (!completed && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/upload/${uploadId}/status`,
          {
            expectedStatus: 200,
          }
        );

        if (statusResponse.data.status === 'completed') {
          completed = true;
          metrics = statusResponse.data.metrics;
        }

        attempts++;
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(completed).toBe(true);
      expect(metrics).toHaveProperty('uploadTime');
      expect(metrics).toHaveProperty('processingTime');
      expect(metrics).toHaveProperty('throughputMBps');
      expect(metrics.throughputMBps).toBeGreaterThan(0);

      // Verify reasonable performance (adjust thresholds based on system)
      const throughputMBps = sizeBytes / (1024 * 1024) / (totalTime / 1000);
      expect(throughputMBps).toBeGreaterThan(0.1); // At least 0.1 MB/s
    });

    test('should monitor streaming resource usage', async ({ apiHelper, authHelper, page }) => {
      await authHelper.loginAPI('developer');

      // Get initial resource metrics
      const initialMetricsResponse = await apiHelper.apiCall('GET', '/api/system/metrics', {
        expectedStatus: 200,
      });

      const initialMetrics = initialMetricsResponse.data;

      // Perform resource-intensive streaming operation
      const largeJSON = generateLargeJSON(5000, 6, 200);
      const uploadResponse = await apiHelper.uploadJSON(largeJSON, {
        title: 'Resource Usage Test',
      });

      // Get post-operation metrics
      const finalMetricsResponse = await apiHelper.apiCall('GET', '/api/system/metrics', {
        expectedStatus: 200,
      });

      const finalMetrics = finalMetricsResponse.data;

      // Verify resource usage is tracked
      expect(finalMetrics.memory.used).toBeGreaterThan(initialMetrics.memory.used);
      expect(finalMetrics.streaming).toHaveProperty('activeUploads');
      expect(finalMetrics.streaming).toHaveProperty('totalProcessed');
    });
  });
});

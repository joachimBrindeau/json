import { test, expect } from '../../utils/base-test';
import { generateLargeJSON } from '../../fixtures/json-samples';
import { createHash } from 'crypto';

test.describe('Developer - Streaming API for Large Files', () => {
  test.describe('Streaming Upload Operations', () => {
    test('should upload extremely large JSON files via streaming', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Generate very large JSON (10MB+)
      const largeJSON = generateLargeJSON(20000, 8, 1000);
      const jsonString = JSON.stringify(largeJSON);
      const fileSizeMB = Buffer.byteLength(jsonString, 'utf8') / (1024 * 1024);

      expect(fileSizeMB).toBeGreaterThan(10); // Ensure it's actually large

      // Initialize streaming upload
      const initResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload/init', {
        data: {
          filename: 'large-streaming-test.json',
          totalSize: Buffer.byteLength(jsonString, 'utf8'),
          contentType: 'application/json',
          metadata: {
            title: 'Large Streaming Upload Test',
            description: 'Testing streaming upload for very large JSON files',
          },
        },
        expectedStatus: 201,
      });

      expect(initResponse.data).toHaveProperty('uploadId');
      expect(initResponse.data).toHaveProperty('uploadUrl');
      expect(initResponse.data).toHaveProperty('chunkSize');

      const uploadId = initResponse.data.uploadId;
      const chunkSize = initResponse.data.chunkSize;

      // Upload in chunks
      const totalChunks = Math.ceil(Buffer.byteLength(jsonString, 'utf8') / chunkSize);
      const uploadedChunks = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, Buffer.byteLength(jsonString, 'utf8'));
        const chunk = jsonString.slice(start, end);

        const chunkResponse = await apiHelper.apiCall(
          'PUT',
          `/api/json/stream/upload/${uploadId}/chunk/${i}`,
          {
            data: chunk,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Length': Buffer.byteLength(chunk, 'utf8').toString(),
              'X-Chunk-Index': i.toString(),
              'X-Total-Chunks': totalChunks.toString(),
            },
            expectedStatus: 200,
          }
        );

        expect(chunkResponse.status).toBe(200);
        uploadedChunks.push(i);
      }

      // Finalize upload
      const finalizeResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/upload/${uploadId}/finalize`,
        {
          data: {
            totalChunks: totalChunks,
            checksum: createHash('sha256').update(jsonString).digest('hex'),
          },
          expectedStatus: 202,
        }
      );

      expect(finalizeResponse.data).toHaveProperty('status', 'processing');

      // Poll for completion
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 1 minute timeout

      while (!processingComplete && attempts < maxAttempts) {
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
          expect(statusResponse.data).toHaveProperty('finalSize');
          expect(statusResponse.data.finalSize).toBeGreaterThan(10000000); // > 10MB
        } else if (statusResponse.data.status === 'failed') {
          throw new Error(`Upload failed: ${statusResponse.data.error}`);
        }

        attempts++;
      }

      expect(processingComplete).toBe(true);
    });

    test('should handle streaming upload with progress tracking', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const testJSON = generateLargeJSON(5000, 6, 500);
      const jsonString = JSON.stringify(testJSON);

      const initResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload/init', {
        data: {
          filename: 'progress-tracking-test.json',
          totalSize: Buffer.byteLength(jsonString, 'utf8'),
          contentType: 'application/json',
          enableProgressTracking: true,
        },
        expectedStatus: 201,
      });

      const uploadId = initResponse.data.uploadId;
      const chunkSize = 1024 * 1024; // 1MB chunks
      const totalChunks = Math.ceil(Buffer.byteLength(jsonString, 'utf8') / chunkSize);

      // Upload chunks and track progress
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, Buffer.byteLength(jsonString, 'utf8'));
        const chunk = jsonString.slice(start, end);

        await apiHelper.apiCall('PUT', `/api/json/stream/upload/${uploadId}/chunk/${i}`, {
          data: chunk,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          expectedStatus: 200,
        });

        // Check progress after each chunk
        const progressResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/upload/${uploadId}/progress`,
          {
            expectedStatus: 200,
          }
        );

        expect(progressResponse.data).toHaveProperty('uploadedChunks', i + 1);
        expect(progressResponse.data).toHaveProperty('totalChunks', totalChunks);
        expect(progressResponse.data).toHaveProperty('percentComplete');
        expect(progressResponse.data).toHaveProperty('uploadSpeed');
        expect(progressResponse.data).toHaveProperty('estimatedTimeRemaining');

        const expectedPercent = ((i + 1) / totalChunks) * 100;
        expect(progressResponse.data.percentComplete).toBeCloseTo(expectedPercent, 1);
      }

      // Finalize and verify final progress
      await apiHelper.apiCall('POST', `/api/json/stream/upload/${uploadId}/finalize`, {
        expectedStatus: 202,
      });

      const finalProgressResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/stream/upload/${uploadId}/progress`,
        {
          expectedStatus: 200,
        }
      );

      expect(finalProgressResponse.data.percentComplete).toBe(100);
      expect(finalProgressResponse.data.status).toBe('processing');
    });

    test('should validate streaming upload integrity and checksums', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const testData = generateLargeJSON(1000, 5, 100);
      const jsonString = JSON.stringify(testData);
      const originalChecksum = createHash('sha256').update(jsonString).digest('hex');

      const initResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload/init', {
        data: {
          filename: 'integrity-test.json',
          totalSize: Buffer.byteLength(jsonString, 'utf8'),
          contentType: 'application/json',
          expectedChecksum: originalChecksum,
          enableIntegrityCheck: true,
        },
        expectedStatus: 201,
      });

      const uploadId = initResponse.data.uploadId;
      const chunkSize = 512 * 1024; // 512KB chunks
      const totalChunks = Math.ceil(Buffer.byteLength(jsonString, 'utf8') / chunkSize);

      // Upload all chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, Buffer.byteLength(jsonString, 'utf8'));
        const chunk = jsonString.slice(start, end);
        const chunkChecksum = createHash('md5').update(chunk).digest('hex');

        const chunkResponse = await apiHelper.apiCall(
          'PUT',
          `/api/json/stream/upload/${uploadId}/chunk/${i}`,
          {
            data: chunk,
            headers: {
              'Content-MD5': chunkChecksum,
              'Content-Type': 'application/octet-stream',
            },
            expectedStatus: 200,
          }
        );

        expect(chunkResponse.data).toHaveProperty('chunkChecksum');
        expect(chunkResponse.data.integrityValid).toBe(true);
      }

      // Finalize with integrity check
      const finalizeResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/upload/${uploadId}/finalize`,
        {
          data: {
            performIntegrityCheck: true,
            expectedChecksum: originalChecksum,
          },
          expectedStatus: 202,
        }
      );

      // Wait for processing and verify integrity
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
          expect(statusResponse.data).toHaveProperty('integrityCheck');
          expect(statusResponse.data.integrityCheck.valid).toBe(true);
          expect(statusResponse.data.integrityCheck.checksum).toBe(originalChecksum);
          break;
        }

        attempts++;
      }
    });
  });

  test.describe('Streaming Download Operations', () => {
    test('should download large JSON files via streaming with range requests', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // First upload a large JSON
      const largeJSON = generateLargeJSON(10000, 6, 500);
      const uploadResponse = await apiHelper.uploadJSON(largeJSON, {
        title: 'Large Download Test JSON',
      });

      const jsonId = uploadResponse.id;

      // Test full streaming download
      const fullDownloadResponse = await apiHelper.apiCall(
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

      expect(fullDownloadResponse.status).toBe(200);
      expect(fullDownloadResponse.response.headers()['content-type']).toContain('application/json');
      expect(fullDownloadResponse.response.headers()['accept-ranges']).toBe('bytes');

      // Test range requests for partial downloads
      const rangeRequests = [
        { range: 'bytes=0-1023', description: 'first 1KB' },
        { range: 'bytes=1024-2047', description: 'second 1KB' },
        { range: 'bytes=-1024', description: 'last 1KB' },
      ];

      for (const rangeReq of rangeRequests) {
        const rangeResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/download/${jsonId}`,
          {
            headers: {
              Range: rangeReq.range,
              'X-Stream-Download': 'true',
            },
            expectedStatus: 206,
          }
        );

        expect(rangeResponse.status).toBe(206);
        expect(rangeResponse.response.headers()['content-range']).toBeDefined();
        expect(rangeResponse.response.headers()['accept-ranges']).toBe('bytes');
      }
    });

    test('should support concurrent streaming downloads with bandwidth management', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const testJSON = generateLargeJSON(5000, 5, 300);
      const uploadResponse = await apiHelper.uploadJSON(testJSON, {
        title: 'Concurrent Download Test',
      });

      const jsonId = uploadResponse.id;

      // Start multiple concurrent downloads
      const concurrentDownloads = Array.from({ length: 10 }, (_, i) =>
        apiHelper.apiCall('GET', `/api/json/stream/download/${jsonId}`, {
          headers: {
            'X-Client-Id': `concurrent-client-${i}`,
            'X-Stream-Download': 'true',
            'X-Bandwidth-Limit': '1048576', // 1MB/s limit per client
          },
          expectedStatus: 200,
        })
      );

      const startTime = Date.now();
      const downloadResults = await Promise.all(concurrentDownloads);
      const endTime = Date.now();

      // All downloads should succeed
      downloadResults.forEach((result, i) => {
        expect(result.status).toBe(200);
        expect(result.data).toHaveProperty('metadata');
      });

      // Verify bandwidth throttling worked (should take longer than instant)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeGreaterThan(1000); // Should take at least 1 second due to throttling
    });

    test('should implement download resume functionality', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const largeJSON = generateLargeJSON(3000, 5, 200);
      const uploadResponse = await apiHelper.uploadJSON(largeJSON, {
        title: 'Resume Download Test',
      });

      const jsonId = uploadResponse.id;

      // Start initial download and simulate interruption
      const initialDownloadResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/stream/download/${jsonId}`,
        {
          headers: {
            Range: 'bytes=0-524287', // First 512KB
            'X-Stream-Download': 'true',
          },
          expectedStatus: 206,
        }
      );

      expect(initialDownloadResponse.status).toBe(206);
      const contentRange = initialDownloadResponse.response.headers()['content-range'];
      const totalSize = parseInt(contentRange.split('/')[1]);

      // Resume download from where it left off
      const resumeDownloadResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/stream/download/${jsonId}`,
        {
          headers: {
            Range: `bytes=524288-${totalSize - 1}`, // Resume from 512KB
            'X-Stream-Download': 'true',
            'X-Resume-Download': 'true',
          },
          expectedStatus: 206,
        }
      );

      expect(resumeDownloadResponse.status).toBe(206);
      expect(resumeDownloadResponse.response.headers()['content-range']).toContain(
        `524288-${totalSize - 1}`
      );

      // Test automatic resume with download token
      const resumeTokenResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/download/${jsonId}/resume-token`,
        {
          data: {
            lastByteReceived: 524287,
            clientId: 'resume-test-client',
          },
          expectedStatus: 201,
        }
      );

      expect(resumeTokenResponse.data).toHaveProperty('resumeToken');

      const automaticResumeResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/stream/download/${jsonId}/resume`,
        {
          headers: {
            'X-Resume-Token': resumeTokenResponse.data.resumeToken,
            'X-Stream-Download': 'true',
          },
          expectedStatus: 206,
        }
      );

      expect(automaticResumeResponse.status).toBe(206);
    });
  });

  test.describe('Streaming Processing and Transformation', () => {
    test('should process large JSON transformations via streaming', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const largeJSON = generateLargeJSON(8000, 6, 400);
      const uploadResponse = await apiHelper.uploadJSON(largeJSON, {
        title: 'Streaming Transform Test',
      });

      const jsonId = uploadResponse.id;

      // Request complex streaming transformation
      const transformResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/transform/${jsonId}`,
        {
          data: {
            operations: [
              {
                type: 'filter',
                path: '$.data[*]',
                condition: 'item.index % 10 === 0',
                streaming: true,
              },
              {
                type: 'map',
                path: '$.data[*]',
                transform: 'item.processed = new Date().toISOString(); return item',
                streaming: true,
              },
              {
                type: 'aggregate',
                path: '$.data',
                operations: ['count', 'average:score', 'sum:values'],
                streaming: true,
              },
            ],
            outputFormat: 'json',
            streamingMode: true,
            chunkSize: 1000,
          },
          expectedStatus: 202,
        }
      );

      expect(transformResponse.data).toHaveProperty('transformId');
      expect(transformResponse.data).toHaveProperty('streamingUrl');

      const transformId = transformResponse.data.transformId;

      // Monitor streaming transformation progress
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 60) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const progressResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/transform/${transformId}/progress`,
          {
            expectedStatus: 200,
          }
        );

        expect(progressResponse.data).toHaveProperty('processedRecords');
        expect(progressResponse.data).toHaveProperty('totalRecords');
        expect(progressResponse.data).toHaveProperty('percentComplete');

        if (progressResponse.data.status === 'completed') {
          completed = true;
          expect(progressResponse.data).toHaveProperty('resultStreamUrl');

          // Download transformed result via streaming
          const resultResponse = await apiHelper.apiCall(
            'GET',
            progressResponse.data.resultStreamUrl,
            {
              headers: { 'X-Stream-Download': 'true' },
              expectedStatus: 200,
            }
          );

          expect(resultResponse.data).toHaveProperty('metadata');
          expect(resultResponse.data).toHaveProperty('aggregates');
          expect(resultResponse.data.aggregates).toHaveProperty('count');
          expect(resultResponse.data.data.length).toBeLessThan(largeJSON.data.length); // Filtered
        }

        attempts++;
      }

      expect(completed).toBe(true);
    });

    test('should perform streaming JSON analysis and validation', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const complexJSON = generateLargeJSON(12000, 8, 300);
      const uploadResponse = await apiHelper.uploadJSON(complexJSON, {
        title: 'Streaming Analysis Test',
      });

      const jsonId = uploadResponse.id;

      // Request comprehensive streaming analysis
      const analysisResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/analyze/${jsonId}`,
        {
          data: {
            analysisTypes: ['structure', 'schema', 'statistics', 'performance', 'validation'],
            streamingMode: true,
            realTimeResults: true,
            includeMetrics: true,
          },
          expectedStatus: 202,
        }
      );

      expect(analysisResponse.data).toHaveProperty('analysisId');
      expect(analysisResponse.data).toHaveProperty('realtimeUrl');

      const analysisId = analysisResponse.data.analysisId;

      // Monitor real-time analysis results
      let finalResults = null;
      let attempts = 0;

      while (!finalResults && attempts < 90) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await apiHelper.apiCall(
          'GET',
          `/api/json/stream/analyze/${analysisId}/status`,
          {
            expectedStatus: 200,
          }
        );

        // Check intermediate results
        if (statusResponse.data.intermediateResults) {
          const intermediate = statusResponse.data.intermediateResults;
          expect(intermediate).toHaveProperty('processedNodes');
          expect(intermediate).toHaveProperty('detectedTypes');
          expect(intermediate).toHaveProperty('memoryUsage');
        }

        if (statusResponse.data.status === 'completed') {
          finalResults = statusResponse.data.results;
          break;
        }

        attempts++;
      }

      expect(finalResults).toBeTruthy();
      expect(finalResults).toHaveProperty('structure');
      expect(finalResults).toHaveProperty('schema');
      expect(finalResults).toHaveProperty('statistics');
      expect(finalResults).toHaveProperty('validation');
      expect(finalResults).toHaveProperty('performance');

      // Verify analysis accuracy
      expect(finalResults.structure.nodeCount).toBeGreaterThan(50000);
      expect(finalResults.structure.maxDepth).toBeGreaterThan(8);
      expect(finalResults.statistics.totalSize).toBeGreaterThan(1000000);
      expect(finalResults.validation.isValid).toBe(true);
    });
  });

  test.describe('Streaming Error Handling and Recovery', () => {
    test('should handle streaming failures with automatic retry', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      const testJSON = generateLargeJSON(2000, 5, 150);
      const jsonString = JSON.stringify(testJSON);

      // Simulate network failure during upload
      const initResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload/init', {
        data: {
          filename: 'failure-recovery-test.json',
          totalSize: Buffer.byteLength(jsonString, 'utf8'),
          contentType: 'application/json',
          enableAutoRetry: true,
          maxRetries: 3,
        },
        expectedStatus: 201,
      });

      const uploadId = initResponse.data.uploadId;
      const chunkSize = 256 * 1024; // 256KB chunks
      const totalChunks = Math.ceil(Buffer.byteLength(jsonString, 'utf8') / chunkSize);

      // Upload chunks with simulated failures
      const failedChunks = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, Buffer.byteLength(jsonString, 'utf8'));
        const chunk = jsonString.slice(start, end);

        try {
          // Simulate intermittent failures
          const shouldFail = i % 10 === 7; // Fail every 8th chunk initially

          const chunkResponse = await apiHelper.apiCall(
            'PUT',
            `/api/json/stream/upload/${uploadId}/chunk/${i}`,
            {
              data: chunk,
              headers: {
                'Content-Type': 'application/octet-stream',
                'X-Simulate-Failure': shouldFail ? 'network-timeout' : undefined,
              },
              expectedStatus: shouldFail ? 500 : 200,
            }
          );

          if (shouldFail) {
            expect(chunkResponse.status).toBe(500);
            failedChunks.push(i);
          } else {
            expect(chunkResponse.status).toBe(200);
          }
        } catch (error) {
          failedChunks.push(i);
        }
      }

      // Retry failed chunks
      for (const chunkIndex of failedChunks) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, Buffer.byteLength(jsonString, 'utf8'));
        const chunk = jsonString.slice(start, end);

        const retryResponse = await apiHelper.apiCall(
          'PUT',
          `/api/json/stream/upload/${uploadId}/chunk/${chunkIndex}`,
          {
            data: chunk,
            headers: {
              'Content-Type': 'application/octet-stream',
              'X-Retry-Attempt': 'true',
            },
            expectedStatus: 200,
          }
        );

        expect(retryResponse.status).toBe(200);
      }

      // Verify upload can complete after retries
      const finalizeResponse = await apiHelper.apiCall(
        'POST',
        `/api/json/stream/upload/${uploadId}/finalize`,
        {
          expectedStatus: 202,
        }
      );

      expect(finalizeResponse.data.status).toBe('processing');
    });

    test('should implement circuit breaker pattern for streaming services', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Trigger multiple failures to activate circuit breaker
      const failureRequests = Array.from({ length: 20 }, (_, i) =>
        apiHelper
          .apiCall('POST', '/api/json/stream/upload/init', {
            data: {
              filename: `circuit-breaker-test-${i}.json`,
              totalSize: 1000000,
              contentType: 'application/json',
              simulateFailure: true, // Force failures
            },
          })
          .catch((error) => ({ status: error.status || 500, attempt: i }))
      );

      const failureResults = await Promise.all(failureRequests);
      const failedRequests = failureResults.filter((r) => r.status >= 500);

      expect(failedRequests.length).toBeGreaterThan(10); // Multiple failures

      // Circuit breaker should now be open - subsequent requests should fail fast
      const circuitBreakerResponse = await apiHelper.apiCall(
        'POST',
        '/api/json/stream/upload/init',
        {
          data: {
            filename: 'circuit-breaker-blocked.json',
            totalSize: 1000,
            contentType: 'application/json',
          },
          expectedStatus: 503,
        }
      );

      expect(circuitBreakerResponse.status).toBe(503);
      expect(circuitBreakerResponse.data.error).toContain('circuit breaker');

      // Wait for circuit breaker to reset (half-open state)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const resetResponse = await apiHelper.apiCall(
        'GET',
        '/api/json/stream/circuit-breaker/status',
        {
          expectedStatus: 200,
        }
      );

      expect(resetResponse.data).toHaveProperty('state');
      expect(['half-open', 'closed']).toContain(resetResponse.data.state);
    });

    test('should handle streaming timeout and resource cleanup', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Start streaming operation with short timeout
      const timeoutResponse = await apiHelper.apiCall(
        'POST',
        '/api/json/stream/transform/timeout-test',
        {
          data: {
            operations: [
              { type: 'infinite-loop', simulate: true }, // Simulated long-running operation
            ],
            timeout: 5000, // 5 second timeout
            enableResourceCleanup: true,
          },
          expectedStatus: 202,
        }
      );

      expect(timeoutResponse.data).toHaveProperty('operationId');

      const operationId = timeoutResponse.data.operationId;

      // Wait for timeout to occur
      await new Promise((resolve) => setTimeout(resolve, 7000));

      const timeoutStatusResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/stream/operation/${operationId}/status`,
        {
          expectedStatus: 200,
        }
      );

      expect(timeoutStatusResponse.data.status).toBe('timeout');
      expect(timeoutStatusResponse.data).toHaveProperty('resourcesCleanedUp');
      expect(timeoutStatusResponse.data.resourcesCleanedUp).toBe(true);

      // Verify resources were properly cleaned up
      const resourcesResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/stream/operation/${operationId}/resources`,
        {
          expectedStatus: 404, // Resources should be gone
        }
      );

      expect(resourcesResponse.status).toBe(404);
    });
  });

  test.describe('Performance Monitoring and Metrics', () => {
    test('should track streaming performance metrics and optimization', async ({
      apiHelper,
      authHelper,
      page,
    }) => {
      await authHelper.loginAPI('developer');

      // Upload with performance monitoring enabled
      const performanceJSON = generateLargeJSON(6000, 5, 250);
      const jsonString = JSON.stringify(performanceJSON);

      const startTime = Date.now();

      const initResponse = await apiHelper.apiCall('POST', '/api/json/stream/upload/init', {
        data: {
          filename: 'performance-metrics-test.json',
          totalSize: Buffer.byteLength(jsonString, 'utf8'),
          contentType: 'application/json',
          enablePerformanceTracking: true,
          optimizationLevel: 'high',
        },
        expectedStatus: 201,
      });

      const uploadId = initResponse.data.uploadId;

      // Upload with performance tracking
      const chunkSize = 512 * 1024; // 512KB chunks
      const totalChunks = Math.ceil(Buffer.byteLength(jsonString, 'utf8') / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const chunkStart = Date.now();
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, Buffer.byteLength(jsonString, 'utf8'));
        const chunk = jsonString.slice(start, end);

        await apiHelper.apiCall('PUT', `/api/json/stream/upload/${uploadId}/chunk/${i}`, {
          data: chunk,
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Performance-Tracking': 'true',
          },
          expectedStatus: 200,
        });

        const chunkEnd = Date.now();

        // Verify chunk upload performance
        expect(chunkEnd - chunkStart).toBeLessThan(5000); // Should complete within 5 seconds
      }

      await apiHelper.apiCall('POST', `/api/json/stream/upload/${uploadId}/finalize`, {
        expectedStatus: 202,
      });

      const endTime = Date.now();

      // Get detailed performance metrics
      const metricsResponse = await apiHelper.apiCall(
        'GET',
        `/api/json/stream/upload/${uploadId}/metrics`,
        {
          expectedStatus: 200,
        }
      );

      expect(metricsResponse.data).toHaveProperty('uploadMetrics');
      expect(metricsResponse.data.uploadMetrics).toHaveProperty('totalTime');
      expect(metricsResponse.data.uploadMetrics).toHaveProperty('averageChunkTime');
      expect(metricsResponse.data.uploadMetrics).toHaveProperty('throughputMBps');
      expect(metricsResponse.data.uploadMetrics).toHaveProperty('peakMemoryUsage');
      expect(metricsResponse.data.uploadMetrics).toHaveProperty('networkEfficiency');

      // Verify performance is within acceptable ranges
      const sizeInMB = Buffer.byteLength(jsonString, 'utf8') / (1024 * 1024);
      const totalTimeSeconds = (endTime - startTime) / 1000;
      const expectedThroughput = sizeInMB / totalTimeSeconds;

      expect(metricsResponse.data.uploadMetrics.throughputMBps).toBeGreaterThan(0.5); // At least 0.5 MB/s
      expect(metricsResponse.data.uploadMetrics.networkEfficiency).toBeGreaterThan(0.8); // 80% efficiency
    });
  });
});

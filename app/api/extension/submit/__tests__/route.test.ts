/**
 * Integration tests for extension submit endpoint
 * Tests JSON submission with audit functionality, security features, and validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, OPTIONS } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    jsonDocument: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/json', () => ({
  analyzeJsonStream: vi.fn(),
  createPerformanceMonitor: vi.fn(() => ({
    end: () => ({ duration: 10, memoryUsage: 1000, timestamp: Date.now() }),
  })),
  auditJson: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn((_context) => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    })),
  },
  logError: vi.fn(),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  publishLimiter: {
    isAllowed: vi.fn(() => true),
    getResetTime: vi.fn(() => new Date(Date.now() + 900000)),
    getRemainingAttempts: vi.fn(() => 5),
  },
}));

vi.mock('@/lib/config', () => ({
  config: {
    performance: {
      maxJsonSizeBytes: 10 * 1024 * 1024, // 10MB
      maxJsonSizeMB: 10,
      jsonStreamingChunkSize: 1024 * 1024, // 1MB
    },
  },
}));

import { prisma } from '@/lib/db';
import { analyzeJsonStream, auditJson } from '@/lib/json';
import { publishLimiter } from '@/lib/middleware/rate-limit';

describe('Extension Submit Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rate limiter to allow by default
    vi.mocked(publishLimiter.isAllowed).mockReturnValue(true);
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost/api/extension/submit', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  };

  it('should include audit results in response', async () => {
    const mockAnalysis = {
      size: 1000,
      nodeCount: 50,
      maxDepth: 3,
      complexity: 'Low' as const,
      checksum: 'test-checksum',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    };

    const mockAudit: Awaited<ReturnType<typeof auditJson>> = {
      isValid: true,
      issues: [{ type: 'info', message: 'Test issue' }],
      stats: {
        size: 1000,
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low',
      },
      recommendations: ['Test recommendation'],
    };

    vi.mocked(analyzeJsonStream).mockResolvedValue(mockAnalysis);
    vi.mocked(auditJson).mockResolvedValue(mockAudit);
    vi.mocked(prisma.jsonDocument.create).mockResolvedValue({
      id: 'test-id',
      shareId: 'test-share-id',
      size: BigInt(1000),
      nodeCount: 50,
      maxDepth: 3,
      complexity: 'Low',
    } as any);

    const request = createRequest({
      jsonData: { name: 'test', value: 123 },
      sourceType: 'chrome-extension',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.audit).toBeDefined();
    expect(data.data.audit.isValid).toBe(true);
    expect(data.data.audit.issues).toHaveLength(1);
    expect(data.data.audit.recommendations).toHaveLength(1);
  });

  it('should handle audit failures gracefully', async () => {
    const mockAnalysis = {
      size: 1000,
      nodeCount: 50,
      maxDepth: 3,
      complexity: 'Low' as const,
      checksum: 'test-checksum',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    };

    vi.mocked(analyzeJsonStream).mockResolvedValue(mockAnalysis);
    vi.mocked(auditJson).mockRejectedValue(new Error('Audit failed'));
    vi.mocked(prisma.jsonDocument.create).mockResolvedValue({
      id: 'test-id',
      shareId: 'test-share-id',
      size: BigInt(1000),
      nodeCount: 50,
      maxDepth: 3,
      complexity: 'Low',
    } as any);

    const request = createRequest({
      jsonData: { name: 'test' },
      sourceType: 'chrome-extension',
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still succeed even if audit fails
    expect(data.success).toBe(true);
    expect(data.data.audit).toBeDefined();
    // Should have fallback audit data (stats not included in response)
    expect(data.data.audit.isValid).toBe(true);
    expect(data.data.audit.issues).toBeDefined();
    expect(data.data.audit.recommendations).toBeDefined();
  });

  it('should return error for invalid JSON', async () => {
    const request = createRequest({
      jsonData: 'invalid json {',
      sourceType: 'chrome-extension',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should return error when jsonData is missing', async () => {
    const request = createRequest({
      sourceType: 'chrome-extension',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(response.status).toBe(400);
  });

  describe('Rate Limiting', () => {
    it('should reject requests exceeding rate limit', async () => {
      vi.mocked(publishLimiter.isAllowed).mockReturnValue(false);

      const request = createRequest({
        jsonData: { test: 'data' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('rate limit');
    });

    it('should include rate limit metadata in error response', async () => {
      const resetTime = new Date(Date.now() + 900000);
      vi.mocked(publishLimiter.isAllowed).mockReturnValue(false);
      vi.mocked(publishLimiter.getResetTime).mockReturnValue(resetTime);
      vi.mocked(publishLimiter.getRemainingAttempts).mockReturnValue(0);

      const request = createRequest({
        jsonData: { test: 'data' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.resetTime).toBeDefined();
      expect(data.metadata.remaining).toBe(0);
    });
  });

  describe('Validation', () => {
    it('should reject invalid JSON string', async () => {
      const request = createRequest({
        jsonData: 'invalid json {',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject JSON exceeding size limit (string)', async () => {
      const largeJson = 'x'.repeat(10 * 1024 * 1024 + 1); // > 10MB
      const request = createRequest({
        jsonData: largeJson,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });

    it('should reject JSON exceeding size limit (object)', async () => {
      const largeObject = { data: 'x'.repeat(10 * 1024 * 1024 + 1) };
      const request = createRequest({
        jsonData: largeObject,
      });

      vi.mocked(analyzeJsonStream).mockResolvedValue({
        size: 10 * 1024 * 1024 + 1,
        nodeCount: 1,
        maxDepth: 1,
        complexity: 'Low' as const,
        checksum: 'test',
        paths: [],
        largeArrays: [],
        deepObjects: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.success).toBe(false);
      expect(data.error).toContain('exceeds maximum');
    });

    it('should reject invalid sourceUrl format', async () => {
      const request = createRequest({
        jsonData: { test: 'data' },
        sourceUrl: 'not-a-valid-url',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should accept valid sourceUrl', async () => {
      const mockAnalysis = {
        size: 1000,
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low' as const,
        checksum: 'test-checksum',
        paths: [],
        largeArrays: [],
        deepObjects: [],
      };

      vi.mocked(analyzeJsonStream).mockResolvedValue(mockAnalysis);
      vi.mocked(auditJson).mockResolvedValue({
        isValid: true,
        issues: [],
        stats: mockAnalysis,
        recommendations: [],
      });
      vi.mocked(prisma.jsonDocument.create).mockResolvedValue({
        id: 'test-id',
        shareId: 'test-share-id',
        size: BigInt(1000),
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low',
      } as any);

      const request = createRequest({
        jsonData: { test: 'data' },
        sourceUrl: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers in response', async () => {
      const mockAnalysis = {
        size: 1000,
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low' as const,
        checksum: 'test-checksum',
        paths: [],
        largeArrays: [],
        deepObjects: [],
      };

      vi.mocked(analyzeJsonStream).mockResolvedValue(mockAnalysis);
      vi.mocked(auditJson).mockResolvedValue({
        isValid: true,
        issues: [],
        stats: mockAnalysis,
        recommendations: [],
      });
      vi.mocked(prisma.jsonDocument.create).mockResolvedValue({
        id: 'test-id',
        shareId: 'test-share-id',
        size: BigInt(1000),
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low',
      } as any);

      const request = createRequest(
        { jsonData: { test: 'data' } },
        { origin: 'https://example.com' }
      );

      const response = await POST(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });

    it('should handle OPTIONS request', async () => {
      const request = new NextRequest('http://localhost/api/extension/submit', {
        method: 'OPTIONS',
        headers: { origin: 'https://example.com' },
      });

      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });
  });

  describe('Backward Compatibility', () => {
    it('should accept source field as fallback to sourceType', async () => {
      const mockAnalysis = {
        size: 1000,
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low' as const,
        checksum: 'test-checksum',
        paths: [],
        largeArrays: [],
        deepObjects: [],
      };

      vi.mocked(analyzeJsonStream).mockResolvedValue(mockAnalysis);
      vi.mocked(auditJson).mockResolvedValue({
        isValid: true,
        issues: [],
        stats: mockAnalysis,
        recommendations: [],
      });
      vi.mocked(prisma.jsonDocument.create).mockResolvedValue({
        id: 'test-id',
        shareId: 'test-share-id',
        size: BigInt(1000),
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low',
      } as any);

      const request = createRequest({
        jsonData: { test: 'data' },
        source: 'n8n-workflow', // Old field name
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Verify that the document was created with workflow type
      expect(prisma.jsonDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('n8n Workflow'),
          }),
        })
      );
    });

    it('should accept string JSON format', async () => {
      const mockAnalysis = {
        size: 1000,
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low' as const,
        checksum: 'test-checksum',
        paths: [],
        largeArrays: [],
        deepObjects: [],
      };

      vi.mocked(analyzeJsonStream).mockResolvedValue(mockAnalysis);
      vi.mocked(auditJson).mockResolvedValue({
        isValid: true,
        issues: [],
        stats: mockAnalysis,
        recommendations: [],
      });
      vi.mocked(prisma.jsonDocument.create).mockResolvedValue({
        id: 'test-id',
        shareId: 'test-share-id',
        size: BigInt(1000),
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low',
      } as any);

      const request = createRequest({
        jsonData: JSON.stringify({ test: 'data' }), // String format
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Source Type Handling', () => {
    it('should handle n8n-workflow source type', async () => {
      const mockAnalysis = {
        size: 1000,
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low' as const,
        checksum: 'test-checksum',
        paths: [],
        largeArrays: [],
        deepObjects: [],
      };

      vi.mocked(analyzeJsonStream).mockResolvedValue(mockAnalysis);
      vi.mocked(auditJson).mockResolvedValue({
        isValid: true,
        issues: [],
        stats: mockAnalysis,
        recommendations: [],
      });
      vi.mocked(prisma.jsonDocument.create).mockResolvedValue({
        id: 'test-id',
        shareId: 'test-share-id',
        size: BigInt(1000),
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low',
      } as any);

      const request = createRequest({
        jsonData: { test: 'data' },
        sourceType: 'n8n-workflow',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.jsonDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('n8n Workflow'),
          }),
        })
      );
    });

    it('should default to n8n-node when source type not provided', async () => {
      const mockAnalysis = {
        size: 1000,
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low' as const,
        checksum: 'test-checksum',
        paths: [],
        largeArrays: [],
        deepObjects: [],
      };

      vi.mocked(analyzeJsonStream).mockResolvedValue(mockAnalysis);
      vi.mocked(auditJson).mockResolvedValue({
        isValid: true,
        issues: [],
        stats: mockAnalysis,
        recommendations: [],
      });
      vi.mocked(prisma.jsonDocument.create).mockResolvedValue({
        id: 'test-id',
        shareId: 'test-share-id',
        size: BigInt(1000),
        nodeCount: 50,
        maxDepth: 3,
        complexity: 'Low',
      } as any);

      const request = createRequest({
        jsonData: { test: 'data' },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(prisma.jsonDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('n8n Node Output'),
          }),
        })
      );
    });
  });
});


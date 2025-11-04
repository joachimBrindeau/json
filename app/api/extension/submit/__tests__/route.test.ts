/**
 * Integration tests for extension submit endpoint
 * Tests JSON submission with audit functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
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
  },
}));

import { prisma } from '@/lib/db';
import { analyzeJsonStream, auditJson } from '@/lib/json';

describe('Extension Submit Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost/api/extension/submit', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
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
    // Should have fallback audit data
    expect(data.data.audit.stats).toBeDefined();
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
});


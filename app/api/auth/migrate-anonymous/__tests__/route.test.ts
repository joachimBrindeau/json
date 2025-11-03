/**
 * Integration tests for migrate-anonymous API endpoint
 * Tests anonymous document migration functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    jsonDocument: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        jsonDocument: {
          updateMany: vi.fn(),
        },
      })
    ),
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

describe('POST /api/auth/migrate-anonymous', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({ anonymousJsonIds: [] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should allow authenticated users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({ anonymousJsonIds: [] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
    });

    it('should accept empty anonymousJsonIds array', async () => {
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({ anonymousJsonIds: [] }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.migratedCount).toBe(0);
    });

    it('should accept valid anonymousJsonIds array', async () => {
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['id-1', 'id-2', 'id-3'],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should accept optional anonymousSessionId', async () => {
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['id-1'],
          anonymousSessionId: 'session-123',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should reject invalid request body', async () => {
      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: 'not-an-array', // Invalid type
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Document Migration', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
    });

    it('should migrate anonymous documents by ID', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          shareId: 'share-1',
          title: 'Test Doc 1',
          description: null,
          publishedAt: null,
          richContent: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: null,
          content: '{}',
          metadata: null,
          size: BigInt(100),
          nodeCount: 0,
          maxDepth: 0,
          complexity: 'Low',
          version: 1,
          checksum: null,
          isAnonymous: true,
          visibility: 'private',
          category: null,
          viewCount: 0,
          slug: null,
          tags: [],
          expiresAt: null,
          accessedAt: new Date(),
        },
        {
          id: 'doc-2',
          shareId: 'share-2',
          title: 'Test Doc 2',
          description: null,
          publishedAt: null,
          richContent: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: null,
          content: '{}',
          metadata: null,
          size: BigInt(200),
          nodeCount: 0,
          maxDepth: 0,
          complexity: 'Low',
          version: 1,
          checksum: null,
          isAnonymous: true,
          visibility: 'private',
          category: null,
          viewCount: 0,
          slug: null,
          tags: [],
          expiresAt: null,
          accessedAt: new Date(),
        },
      ];

      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue(mockDocuments);
      vi.mocked(prisma.$transaction).mockResolvedValue({ count: 2 });

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['doc-1', 'doc-2'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.migratedCount).toBe(2);
      expect(data.data.documents).toHaveLength(2);
    });

    it('should migrate anonymous documents by shareId', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          shareId: 'share-1',
          title: 'Test Doc 1',
          description: null,
          publishedAt: null,
          richContent: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: null,
          content: '{}',
          metadata: null,
          size: BigInt(100),
          nodeCount: 0,
          maxDepth: 0,
          complexity: 'Low',
          version: 1,
          checksum: null,
          isAnonymous: true,
          visibility: 'private',
          category: null,
          viewCount: 0,
          slug: null,
          tags: [],
          expiresAt: null,
          accessedAt: new Date(),
        },
      ];

      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue(mockDocuments);
      vi.mocked(prisma.$transaction).mockResolvedValue({ count: 1 });

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['share-1'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.migratedCount).toBe(1);
    });

    it('should only migrate anonymous documents', async () => {
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['doc-1', 'doc-2'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.migratedCount).toBe(0);
      expect(prisma.jsonDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                isAnonymous: true,
                userId: null,
              }),
            ]),
          }),
        })
      );
    });

    it('should handle no matching documents', async () => {
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['non-existent-1', 'non-existent-2'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.migratedCount).toBe(0);
      expect(data.data.message).toContain('No matching documents found');
    });

    it('should use transaction for migration', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          shareId: 'share-1',
          title: 'Test Doc 1',
          description: null,
          publishedAt: null,
          richContent: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: null,
          content: '{}',
          metadata: null,
          size: BigInt(100),
          nodeCount: 0,
          maxDepth: 0,
          complexity: 'Low',
          version: 1,
          checksum: null,
          isAnonymous: true,
          visibility: 'private',
          category: null,
          viewCount: 0,
          slug: null,
          tags: [],
          expiresAt: null,
          accessedAt: new Date(),
        },
      ];

      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue(mockDocuments);
      vi.mocked(prisma.$transaction).mockResolvedValue({ count: 1 });

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['doc-1'],
        }),
      });

      await POST(request);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.jsonDocument.findMany).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['doc-1'],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle transaction errors', async () => {
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([
        {
          id: 'doc-1',
          shareId: 'share-1',
          title: 'Test Doc 1',
          description: null,
          publishedAt: null,
          richContent: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: null,
          content: '{}',
          metadata: null,
          size: BigInt(100),
          nodeCount: 0,
          maxDepth: 0,
          complexity: 'Low',
          version: 1,
          checksum: null,
          isAnonymous: true,
          visibility: 'private',
          category: null,
          viewCount: 0,
          slug: null,
          tags: [],
          expiresAt: null,
          accessedAt: new Date(),
        },
      ]);
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Transaction failed'));

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['doc-1'],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});

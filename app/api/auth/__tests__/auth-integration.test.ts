/**
 * Integration tests for authentication API endpoints
 * Tests signup, login, logout, and account deletion flows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as signupPOST } from '../signup/route';
import { DELETE as deleteAccountDELETE } from '../delete-account/route';
import { POST as migrateAnonymousPOST } from '../migrate-anonymous/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
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

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn((password) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: vi.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`)),
  validatePasswordStrength: vi.fn(() => ({ isValid: true, errors: [] })),
}));

vi.mock('@/lib/auth/email-verification', () => ({
  sendVerificationEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/middleware/rate-limit', () => ({
  signupLimiter: {
    isAllowed: vi.fn(() => true),
    getResetTime: vi.fn(() => null),
    getRemainingAttempts: vi.fn(() => 5),
  },
}));

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { hashPassword } from '@/lib/auth/password';

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Signup Flow', () => {
    it('should create a new user account', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const request = new NextRequest('http://localhost:3456/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await signupPOST(request, { params: Promise.resolve({}) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.user).toBeDefined();
      expect(data.data.user.email).toBe('test@example.com');
      expect(hashPassword).toHaveBeenCalledWith('password123');
    });

    it('should reject duplicate email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      } as any);

      const request = new NextRequest('http://localhost:3456/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await signupPOST(request, { params: Promise.resolve({}) });

      expect(response.status).toBe(409);
    });

    it('should validate email format', async () => {
      const request = new NextRequest('http://localhost:3456/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        }),
      });

      const response = await signupPOST(request, { params: Promise.resolve({}) });

      expect(response.status).toBe(400);
    });

    it('should validate password length', async () => {
      const request = new NextRequest('http://localhost:3456/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'short',
        }),
      });

      const response = await signupPOST(request, { params: Promise.resolve({}) });

      expect(response.status).toBe(400);
    });

    it('should require name field', async () => {
      const request = new NextRequest('http://localhost:3456/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await signupPOST(request, { params: Promise.resolve({}) });

      expect(response.status).toBe(400);
    });

    it('should normalize email addresses', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const request = new NextRequest('http://localhost:3456/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'Test@Example.COM',
          password: 'password123',
        }),
      });

      const response = await signupPOST(request, { params: Promise.resolve({}) });

      expect(response.status).toBe(201);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
          }),
        })
      );
    });
  });

  describe('Account Deletion Flow', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };

    it('should delete user account', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      } as any);
      vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

      const request = new NextRequest('http://localhost:3456/api/auth/delete-account', {
        method: 'DELETE',
      });

      const response = await deleteAccountDELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.message).toContain('deleted successfully');
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should require authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3456/api/auth/delete-account', {
        method: 'DELETE',
      });

      const response = await deleteAccountDELETE(request);

      expect(response.status).toBe(401);
    });

    it('should handle non-existent user', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3456/api/auth/delete-account', {
        method: 'DELETE',
      });

      const response = await deleteAccountDELETE(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Anonymous Data Migration Flow', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };

    it('should migrate anonymous documents on signup', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          shareId: 'share-1',
          title: 'Anonymous Doc 1',
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
          title: 'Anonymous Doc 2',
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

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue(mockDocuments);
      vi.mocked(prisma.$transaction).mockResolvedValue({ count: 2 });

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['doc-1', 'doc-2'],
        }),
      });

      const response = await migrateAnonymousPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.migratedCount).toBe(2);
      expect(data.data.documents).toHaveLength(2);
    });

    it('should handle empty migration list', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: [],
        }),
      });

      const response = await migrateAnonymousPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.migratedCount).toBe(0);
    });
  });

  describe('Complete User Journey', () => {
    it('should handle signup -> migrate -> delete flow', async () => {
      // Step 1: Signup
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const signupRequest = new NextRequest('http://localhost:3456/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const signupResponse = await signupPOST(signupRequest, { params: Promise.resolve({}) });
      expect(signupResponse.status).toBe(201);

      // Step 2: Migrate anonymous data
      const mockSession = {
        user: mockUser,
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue([
        {
          id: 'doc-1',
          shareId: 'share-1',
          title: 'Anonymous Doc',
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
      vi.mocked(prisma.$transaction).mockResolvedValue({ count: 1 });

      const migrateRequest = new NextRequest('http://localhost:3456/api/auth/migrate-anonymous', {
        method: 'POST',
        body: JSON.stringify({
          anonymousJsonIds: ['doc-1'],
        }),
      });

      const migrateResponse = await migrateAnonymousPOST(migrateRequest);
      expect(migrateResponse.status).toBe(200);

      // Step 3: Delete account
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.user.delete).mockResolvedValue({} as any);

      const deleteRequest = new NextRequest('http://localhost:3456/api/auth/delete-account', {
        method: 'DELETE',
      });

      const deleteResponse = await deleteAccountDELETE(deleteRequest);
      expect(deleteResponse.status).toBe(200);
    });
  });
});

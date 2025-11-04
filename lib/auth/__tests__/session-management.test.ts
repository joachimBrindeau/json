/**
 * Session Management Unit Tests
 * Tests session configuration, JWT handling, and session callbacks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SESSION_CONFIG } from '../constants';
import { authCallbacks } from '../callbacks';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

vi.mock('../adapter', () => ({
  getPrismaClient: vi.fn(() => ({
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  })),
}));

vi.mock('../account-linking', () => ({
  linkOAuthAccount: vi.fn(),
}));

describe('Session Management', () => {
  describe('Session Configuration', () => {
    it('should use JWT strategy', () => {
      expect(SESSION_CONFIG.strategy).toBe('jwt');
    });

    it('should have 30-day session expiration', () => {
      const expectedSeconds = 30 * 24 * 60 * 60; // 30 days
      expect(SESSION_CONFIG.maxAge).toBe(expectedSeconds);
    });

    it('should calculate correct expiration time', () => {
      const now = Date.now();
      const expirationMs = SESSION_CONFIG.maxAge * 1000;
      const expectedExpiration = now + expirationMs;

      // Allow 1 second tolerance
      expect(expectedExpiration).toBeGreaterThan(now);
      expect(expectedExpiration).toBeLessThan(now + expirationMs + 1000);
    });
  });

  describe('JWT Callback', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should populate JWT with user data on initial sign in', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      };

      const token = await authCallbacks.jwt!({
        token: {},
        user: mockUser,
        account: null,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });

      expect(token.id).toBe('user-123');
      expect(token.email).toBe('test@example.com');
      expect(token.name).toBe('Test User');
      expect(token.image).toBe('https://example.com/avatar.jpg');
    });

    it('should preserve existing token data when user is not provided', async () => {
      const existingToken = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      };

      const token = await authCallbacks.jwt!({
        token: existingToken,
        user: undefined,
        account: null,
        profile: undefined,
        trigger: 'update',
        isNewUser: false,
        session: undefined,
      });

      expect(token).toEqual(existingToken);
    });

    it('should handle user without image', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      };

      const token = await authCallbacks.jwt!({
        token: {},
        user: mockUser,
        account: null,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });

      expect(token.id).toBe('user-123');
      expect(token.image).toBeNull();
    });

    it('should handle user without name', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: null,
        image: null,
      };

      const token = await authCallbacks.jwt!({
        token: {},
        user: mockUser,
        account: null,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });

      expect(token.id).toBe('user-123');
      expect(token.name).toBeNull();
    });
  });

  describe('Session Callback', () => {
    it('should populate session with JWT data', async () => {
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      };

      const mockSession = {
        user: {},
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      const session = await authCallbacks.session!({
        session: mockSession,
        token: mockToken,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      });

      expect(session.user.id).toBe('user-123');
      expect(session.user.email).toBe('test@example.com');
      expect(session.user.name).toBe('Test User');
      expect(session.user.image).toBe('https://example.com/avatar.jpg');
    });

    it('should handle token without image', async () => {
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockSession = {
        user: {},
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      const session = await authCallbacks.session!({
        session: mockSession,
        token: mockToken,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      });

      // Image can be null or undefined, both are valid
      expect(session.user.image).toBeFalsy();
    });

    it('should preserve session expiration', async () => {
      const mockToken = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const expirationDate = new Date(Date.now() + 86400000).toISOString();
      const mockSession = {
        user: {},
        expires: expirationDate,
      };

      const session = await authCallbacks.session!({
        session: mockSession,
        token: mockToken,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      });

      expect(session.expires).toBe(expirationDate);
    });
  });

  describe('Session Expiration', () => {
    it('should calculate correct expiration timestamp', () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const maxAge = SESSION_CONFIG.maxAge;
      const expectedExpiration = now + maxAge;

      expect(expectedExpiration).toBeGreaterThan(now);
      expect(expectedExpiration - now).toBe(maxAge);
    });

    it('should have expiration in the future', () => {
      const now = Date.now();
      const expirationMs = SESSION_CONFIG.maxAge * 1000;
      const futureExpiration = now + expirationMs;

      expect(futureExpiration).toBeGreaterThan(now);
    });

    it('should expire after 30 days', () => {
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
      expect(SESSION_CONFIG.maxAge).toBe(thirtyDaysInSeconds);
    });
  });

  describe('Session Data Integrity', () => {
    it('should maintain user ID through JWT and session callbacks', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      };

      // JWT callback
      const token = await authCallbacks.jwt!({
        token: {},
        user: mockUser,
        account: null,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });

      // Session callback
      const session = await authCallbacks.session!({
        session: {
          user: {},
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        token,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      });

      expect(session.user.id).toBe(userId);
    });

    it('should maintain email through JWT and session callbacks', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email,
        name: 'Test User',
        image: null,
      };

      const token = await authCallbacks.jwt!({
        token: {},
        user: mockUser,
        account: null,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });

      const session = await authCallbacks.session!({
        session: {
          user: {},
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        token,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      });

      expect(session.user.email).toBe(email);
    });
  });
});

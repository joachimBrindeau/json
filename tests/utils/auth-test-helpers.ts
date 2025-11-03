/**
 * Authentication Test Helpers
 * Reusable utilities and fixtures for authentication testing
 */

import { vi } from 'vitest';
import type { Session } from 'next-auth';
import type { User } from '@prisma/client';

/**
 * Mock user data factory
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed_password123',
  image: null,
  emailVerified: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastLoginAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Mock session data factory
 */
export const createMockSession = (overrides?: Partial<Session>): Session => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
  },
  expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
  ...overrides,
});

/**
 * Mock admin session
 */
export const createMockAdminSession = (): Session =>
  createMockSession({
    user: {
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      image: null,
    },
  });

/**
 * Mock anonymous JSON document
 */
export const createMockDocument = (overrides?: any) => ({
  id: 'doc-123',
  shareId: 'share-123',
  title: 'Test Document',
  content: { test: 'data' },
  userId: null,
  size: 1024,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  expiresAt: new Date('2024-12-31'),
  isPublic: false,
  ...overrides,
});

/**
 * Mock Prisma client for authentication tests
 */
export const createMockPrisma = () => ({
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  account: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  jsonDocument: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn((callback) => {
    if (typeof callback === 'function') {
      return callback({
        jsonDocument: {
          updateMany: vi.fn(),
        },
      });
    }
    return Promise.resolve([]);
  }),
});

/**
 * Mock NextAuth getServerSession
 */
export const mockGetServerSession = (session: Session | null = null) => {
  return vi.fn().mockResolvedValue(session);
};

/**
 * Create a mock NextRequest for testing
 */
export const createMockRequest = (
  options: {
    method?: string;
    url?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) => {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body = null,
    headers = {},
  } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  });
};

/**
 * Extract JSON from Response object
 */
export const getResponseJson = async (response: Response) => {
  return response.json();
};

/**
 * Assert response status and get JSON
 */
export const expectResponseStatus = async (response: Response, expectedStatus: number) => {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(`Expected status ${expectedStatus} but got ${response.status}. Body: ${body}`);
  }
  return response.json();
};

/**
 * Common test data
 */
export const TEST_CREDENTIALS = {
  valid: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
  weak: {
    email: 'weak@example.com',
    password: '123',
    name: 'Weak User',
  },
  admin: {
    email: 'admin@example.com',
    password: 'adminpass123',
    name: 'Admin User',
  },
};

/**
 * OAuth provider test data
 */
export const OAUTH_TEST_DATA = {
  github: {
    provider: 'github',
    providerAccountId: 'github-123',
    access_token: 'github_token_123',
    token_type: 'bearer',
    scope: 'read:user user:email',
  },
  google: {
    provider: 'google',
    providerAccountId: 'google-123',
    access_token: 'google_token_123',
    token_type: 'bearer',
    scope: 'openid profile email',
  },
};

/**
 * Wait for async operations in tests
 */
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock password utilities
 */
export const mockPasswordUtils = () => ({
  hashPassword: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: vi.fn((password: string, hash: string) =>
    Promise.resolve(hash === `hashed_${password}`)
  ),
  validatePasswordStrength: vi.fn((password: string) => ({
    isValid: password.length >= 8,
    errors: password.length < 8 ? ['Password too short'] : [],
    strength: password.length >= 12 ? 'strong' : 'medium',
  })),
});

/**
 * Assert error response structure
 */
export const expectErrorResponse = async (
  response: Response,
  expectedStatus: number,
  expectedMessage?: string
) => {
  const data = await response.json();

  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus} but got ${response.status}`);
  }

  if (!data.error && !data.message) {
    throw new Error('Response does not contain error or message field');
  }

  if (expectedMessage) {
    const actualMessage = data.error || data.message || data.data?.message;
    if (!actualMessage?.includes(expectedMessage)) {
      throw new Error(
        `Expected message to contain "${expectedMessage}" but got "${actualMessage}"`
      );
    }
  }

  return data;
};

/**
 * Assert success response structure
 */
export const expectSuccessResponse = async (response: Response, expectedStatus: number = 200) => {
  const data = await response.json();

  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus} but got ${response.status}. Body: ${JSON.stringify(data)}`
    );
  }

  if (!data.success && data.success !== undefined) {
    throw new Error('Response does not indicate success');
  }

  return data;
};

/**
 * Create mock account for OAuth testing
 */
export const createMockAccount = (overrides?: any) => ({
  id: 'account-123',
  userId: 'test-user-id',
  type: 'oauth',
  provider: 'github',
  providerAccountId: 'github-123',
  refresh_token: null,
  access_token: 'token_123',
  expires_at: null,
  token_type: 'bearer',
  scope: 'read:user',
  id_token: null,
  session_state: null,
  ...overrides,
});

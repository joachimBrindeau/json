/**
 * Vitest setup file
 * Runs before all tests to configure the test environment
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock Next.js environment
(process as any).env.NODE_ENV = 'test';
process.env.NEXTAUTH_URL = 'http://localhost:3456';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock logger globally with child method support
vi.mock('@/lib/logger', () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => mockLogger), // Return the same mock logger
  };
  return {
    logger: mockLogger,
  };
});

// Setup global test utilities
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

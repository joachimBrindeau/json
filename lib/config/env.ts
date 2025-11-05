/**
 * Centralized Environment Configuration
 *
 * Type-safe access to all environment variables with validation.
 * This file consolidates all process.env usage across the application.
 */

import { z } from 'zod';

// Check if we're on the server
const isServer = typeof window === 'undefined';

// Load environment variables from .env file only on server-side
// This prevents dotenv from being bundled in client code
if (isServer) {
  try {
     
    require('dotenv/config');
  } catch {
    // dotenv not available or already loaded by Next.js
  }
}

// Check if we're in test mode (treat Playwright builds like test)
// Also check for Vitest environment variable (Vitest sets VITEST env var)
const isTest =
  process.env.NODE_ENV === 'test' ||
  process.env.PLAYWRIGHT === '1' ||
  process.env.VITEST !== undefined;

// Shared environment schema for fields common to both server and client
const sharedEnvSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Public URLs (accessible in browser)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .default('https://json-viewer.io'),
  NEXT_PUBLIC_WEBSOCKET_URL: z
    .string()
    .url('NEXT_PUBLIC_WEBSOCKET_URL must be a valid WebSocket URL')
    .optional(),
  NEXT_PUBLIC_BUILD_ID: z.string().optional(),

  // Performance Settings
  MAX_JSON_SIZE_MB: z.string().regex(/^\d+$/, 'MAX_JSON_SIZE_MB must be a number').default('2048'),
  JSON_STREAMING_CHUNK_SIZE: z
    .string()
    .regex(/^\d+$/, 'JSON_STREAMING_CHUNK_SIZE must be a number')
    .default('1048576'),

  // Analytics & Tracking (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_FB_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_HOTJAR_ID: z.string().optional(),

  // SEO Verification (optional)
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional(),
  YANDEX_VERIFICATION: z.string().optional(),
  BING_VERIFICATION: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),

  // Build & CI
  BUILD_ID: z.string().optional(),
  CI: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),

  // Playwright Testing
  PLAYWRIGHT_BASE_URL: z.string().url().optional(),
  BASE_URL: z.string().url().optional(),
});

// Server-only environment schema (extends shared)
const serverEnvSchema = sharedEnvSchema.extend({
  // Database (optional in test mode)
  DATABASE_URL: isTest
    ? z.string().optional().default('postgresql://test:test@localhost:5432/test')
    : z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // Redis (optional in test mode)
  REDIS_URL: z
    .string()
    .url('REDIS_URL must be a valid Redis URL')
    .default('redis://localhost:6379'),

  // NextAuth (optional in test mode)
  NEXTAUTH_URL: isTest
    ? z.string().optional().default('http://localhost:3456')
    : z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: isTest
    ? z.string().optional().default('test-secret-with-at-least-32-chars-for-testing-purposes')
    : z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // OAuth Providers (optional in test mode)
  GITHUB_CLIENT_ID: isTest
    ? z.string().optional().default('test-github-client-id')
    : z.string().min(1, 'GITHUB_CLIENT_ID is required'),
  GITHUB_CLIENT_SECRET: isTest
    ? z.string().optional().default('test-github-client-secret')
    : z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),
  GOOGLE_CLIENT_ID: isTest
    ? z.string().optional().default('test-google-client-id')
    : z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: isTest
    ? z.string().optional().default('test-google-client-secret')
    : z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  // Admin
  SUPERADMIN_EMAILS: z
    .string()
    .optional()
    .transform((val) => val?.split(',').map((email) => email.trim()) || []),

  // Email/SMTP Configuration (optional in test mode)
  SMTP_HOST: isTest
    ? z.string().optional().default('smtp.sendgrid.net')
    : z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: isTest
    ? z.string().optional().default('587')
    : z.string().regex(/^\d+$/, 'SMTP_PORT must be a number'),
  SMTP_USERNAME: isTest
    ? z.string().optional().default('apikey')
    : z.string().min(1, 'SMTP_USERNAME is required'),
  SMTP_PASSWORD: isTest
    ? z.string().optional().default('test-smtp-password')
    : z.string().min(1, 'SMTP_PASSWORD is required'),
  SMTP_FROM_EMAIL: z
    .string()
    .email('SMTP_FROM_EMAIL must be a valid email')
    .optional()
    .default('noreply@json-viewer.io'),
  SMTP_FROM_NAME: z.string().optional().default('JSON Viewer'),
});

// Client-safe environment schema (only shared/public variables)
const clientEnvSchema = sharedEnvSchema;

/**
 * Build environment object from process.env
 * Shared logic for both client and server validation
 */
function buildEnvObject() {
  return {
    // Node Environment
    NODE_ENV: process.env.NODE_ENV,

    // Database (server only, but included for consistency)
    DATABASE_URL: process.env.DATABASE_URL,

    // Redis (server only)
    REDIS_URL: process.env.REDIS_URL,

    // NextAuth (server only)
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

    // OAuth Providers (server only)
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // Admin (server only)
    SUPERADMIN_EMAILS: process.env.SUPERADMIN_EMAILS,

    // Email/SMTP (server only)
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USERNAME: process.env.SMTP_USERNAME,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,

    // Public URLs (client + server)
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,

    // Performance (client + server)
    MAX_JSON_SIZE_MB: process.env.MAX_JSON_SIZE_MB,
    JSON_STREAMING_CHUNK_SIZE: process.env.JSON_STREAMING_CHUNK_SIZE,

    // Analytics (client + server)
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_FB_PIXEL_ID: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
    NEXT_PUBLIC_HOTJAR_ID: process.env.NEXT_PUBLIC_HOTJAR_ID,

    // SEO (client + server)
    GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    YANDEX_VERIFICATION: process.env.YANDEX_VERIFICATION,
    BING_VERIFICATION: process.env.BING_VERIFICATION,
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,

    // Build (client + server)
    BUILD_ID: process.env.BUILD_ID,
    CI: process.env.CI,

    // Testing (client + server)
    PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL,
    BASE_URL: process.env.BASE_URL,
  };
}

// Parse and validate environment variables at module load time
function validateEnv() {
  const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true';
  // Detect Next.js build phase (during 'next build')
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || process.env.npm_lifecycle_event === 'build';
  
  try {
    const envObject = buildEnvObject();

    // On the client, only validate public environment variables
    if (!isServer) {
      const parsed = clientEnvSchema.parse(envObject);
      // Type assertion needed because client schema is subset of full schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parsed as any;
    }

    // Allow skipping strict validation during image builds or Next.js build phase where .env is not available
    if (skipValidation || isBuildPhase) {
      // Return the raw env object without throwing; runtime container will validate with real env
      // Type assertion needed because we're bypassing validation in build phase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return envObject as any;
    }

    // In test mode, use more lenient validation with defaults
    if (isTest) {
      try {
        const parsed = serverEnvSchema.parse(envObject);
        return parsed;
      } catch (error) {
        // In test mode, if validation fails, return envObject with defaults applied
        // This allows tests to run without full environment setup
        if (error instanceof z.ZodError) {
          console.warn('⚠️  Environment validation failed in test mode, using defaults');
          // Type assertion needed for test mode fallback when validation fails
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return envObject as any;
        }
        throw error;
      }
    }

    // On the server, validate all environment variables
    const parsed = serverEnvSchema.parse(envObject);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((issue) => {
        console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
      });
      throw new Error('Invalid environment configuration. Please check your .env file.');
    }
    throw error;
  }
}

// Validate and export configuration
export const env = validateEnv();

// Type-safe environment configuration object
export const config = {
  // Environment
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  nodeEnv: env.NODE_ENV,

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
  },

  // Authentication
  auth: {
    url: env.NEXTAUTH_URL,
    secret: env.NEXTAUTH_SECRET,
    superadminEmails: env.SUPERADMIN_EMAILS,
    providers: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
  },

  // Email/SMTP
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT, 10),
      username: env.SMTP_USERNAME,
      password: env.SMTP_PASSWORD,
      secure: false, // Use TLS (port 587)
    },
    from: {
      email: env.SMTP_FROM_EMAIL,
      name: env.SMTP_FROM_NAME,
    },
    enabled: !!(env.SMTP_HOST && env.SMTP_USERNAME && env.SMTP_PASSWORD),
  },

  // Public URLs
  app: {
    url: env.NEXT_PUBLIC_APP_URL,
    websocketUrl: env.NEXT_PUBLIC_WEBSOCKET_URL,
    buildId: env.NEXT_PUBLIC_BUILD_ID || env.BUILD_ID || Date.now().toString(),
  },

  // Performance
  performance: {
    maxJsonSizeMB: parseInt(env.MAX_JSON_SIZE_MB, 10),
    maxJsonSizeBytes: parseInt(env.MAX_JSON_SIZE_MB, 10) * 1024 * 1024,
    jsonStreamingChunkSize: parseInt(env.JSON_STREAMING_CHUNK_SIZE, 10),
  },

  // Analytics
  analytics: {
    ga: {
      measurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      enabled: !!env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
    facebook: {
      pixelId: env.NEXT_PUBLIC_FB_PIXEL_ID,
      enabled: !!env.NEXT_PUBLIC_FB_PIXEL_ID,
    },
    hotjar: {
      id: env.NEXT_PUBLIC_HOTJAR_ID,
      enabled: !!env.NEXT_PUBLIC_HOTJAR_ID,
    },
  },

  // SEO
  seo: {
    verification: {
      google: env.GOOGLE_SITE_VERIFICATION || env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: env.YANDEX_VERIFICATION,
      bing: env.BING_VERIFICATION,
    },
    facebook: {
      appId: env.FACEBOOK_APP_ID,
    },
  },

  // Build & CI
  build: {
    id: env.BUILD_ID,
    isCI: env.CI === true,
  },

  // Testing
  testing: {
    baseUrl: env.PLAYWRIGHT_BASE_URL || env.BASE_URL || 'http://localhost:3456',
  },
} as const;

// Export individual environment variables for backward compatibility
// This allows gradual migration from process.env usage
export const {
  NODE_ENV,
  DATABASE_URL,
  REDIS_URL,
  NEXTAUTH_URL,
  NEXTAUTH_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_WEBSOCKET_URL,
  NEXT_PUBLIC_BUILD_ID,
  MAX_JSON_SIZE_MB,
  JSON_STREAMING_CHUNK_SIZE,
  NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_FB_PIXEL_ID,
  NEXT_PUBLIC_HOTJAR_ID,
  GOOGLE_SITE_VERIFICATION,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  YANDEX_VERIFICATION,
  BING_VERIFICATION,
  FACEBOOK_APP_ID,
  BUILD_ID,
  CI,
  PLAYWRIGHT_BASE_URL,
  BASE_URL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_FROM_EMAIL,
  SMTP_FROM_NAME,
} = env;

// Type exports
export type Env = z.infer<typeof serverEnvSchema>;
export type Config = typeof config;

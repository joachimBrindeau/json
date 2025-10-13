/**
 * Centralized Environment Configuration
 *
 * Type-safe access to all environment variables with validation.
 * This file consolidates all process.env usage across the application.
 */

import { z } from 'zod';

// Environment schema with validation rules
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis URL').default('redis://localhost:6379'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // OAuth Providers
  GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  // Public URLs (accessible in browser)
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').default('https://json-viewer.io'),
  NEXT_PUBLIC_WEBSOCKET_URL: z.string().url('NEXT_PUBLIC_WEBSOCKET_URL must be a valid WebSocket URL').optional(),
  NEXT_PUBLIC_BUILD_ID: z.string().optional(),

  // Performance Settings
  MAX_JSON_SIZE_MB: z.string().regex(/^\d+$/, 'MAX_JSON_SIZE_MB must be a number').default('2048'),
  JSON_STREAMING_CHUNK_SIZE: z.string().regex(/^\d+$/, 'JSON_STREAMING_CHUNK_SIZE must be a number').default('1048576'),

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
  CI: z.string().optional().transform(val => val === 'true' || val === '1'),

  // Playwright Testing
  PLAYWRIGHT_BASE_URL: z.string().url().optional(),
  BASE_URL: z.string().url().optional(),
});

// Parse and validate environment variables at module load time
function validateEnv() {
  try {
    const parsed = envSchema.parse({
      // Node Environment
      NODE_ENV: process.env.NODE_ENV,

      // Database
      DATABASE_URL: process.env.DATABASE_URL,

      // Redis
      REDIS_URL: process.env.REDIS_URL,

      // NextAuth
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

      // OAuth Providers
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

      // Public URLs
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
      NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,

      // Performance
      MAX_JSON_SIZE_MB: process.env.MAX_JSON_SIZE_MB,
      JSON_STREAMING_CHUNK_SIZE: process.env.JSON_STREAMING_CHUNK_SIZE,

      // Analytics
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      NEXT_PUBLIC_FB_PIXEL_ID: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
      NEXT_PUBLIC_HOTJAR_ID: process.env.NEXT_PUBLIC_HOTJAR_ID,

      // SEO
      GOOGLE_SITE_VERIFICATION: process.env.GOOGLE_SITE_VERIFICATION,
      NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      YANDEX_VERIFICATION: process.env.YANDEX_VERIFICATION,
      BING_VERIFICATION: process.env.BING_VERIFICATION,
      FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,

      // Build
      BUILD_ID: process.env.BUILD_ID,
      CI: process.env.CI,

      // Testing
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL,
      BASE_URL: process.env.BASE_URL,
    });

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
} = env;

// Type exports
export type Env = z.infer<typeof envSchema>;
export type Config = typeof config;

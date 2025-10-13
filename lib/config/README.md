# Environment Configuration Module

Centralized, type-safe environment configuration system with runtime validation.

## Overview

This module provides a single source of truth for all environment variables used across the application. It includes:

- ✅ **Type Safety**: Full TypeScript support with type inference
- ✅ **Validation**: Runtime validation using Zod schemas
- ✅ **Default Values**: Sensible defaults for optional variables
- ✅ **Clear Documentation**: Self-documenting configuration structure
- ✅ **Error Handling**: Helpful error messages for missing/invalid variables

## Usage

### Basic Usage

```typescript
import { config } from '@/lib/config';

// Type-safe access to configuration
const dbUrl = config.database.url;
const isProduction = config.isProduction;
const maxJsonSize = config.performance.maxJsonSizeBytes;
```

### Environment Checks

```typescript
import { config } from '@/lib/config';

if (config.isDevelopment) {
  console.log('Running in development mode');
}

if (config.analytics.ga.enabled) {
  // Initialize Google Analytics
}
```

### Authentication Configuration

```typescript
import { config } from '@/lib/config';

const githubConfig = config.auth.providers.github;
const authUrl = config.auth.url;
```

### Direct Environment Variable Access

For backward compatibility or special cases:

```typescript
import { env, NODE_ENV, DATABASE_URL } from '@/lib/config';

// Access raw environment object
console.log(env.NODE_ENV);

// Or individual exports
console.log(NODE_ENV);
console.log(DATABASE_URL);
```

## Configuration Structure

### Environment Detection

```typescript
config.isDevelopment  // true if NODE_ENV === 'development'
config.isProduction   // true if NODE_ENV === 'production'
config.isTest         // true if NODE_ENV === 'test'
config.nodeEnv        // 'development' | 'production' | 'test'
```

### Database

```typescript
config.database.url   // PostgreSQL connection string
```

### Redis

```typescript
config.redis.url      // Redis connection string
```

### Authentication

```typescript
config.auth.url                           // NextAuth base URL
config.auth.secret                        // NextAuth JWT secret
config.auth.providers.github.clientId     // GitHub OAuth client ID
config.auth.providers.github.clientSecret // GitHub OAuth client secret
config.auth.providers.google.clientId     // Google OAuth client ID
config.auth.providers.google.clientSecret // Google OAuth client secret
```

### Application URLs

```typescript
config.app.url           // Public application URL
config.app.websocketUrl  // WebSocket URL (optional)
config.app.buildId       // Build identifier
```

### Performance

```typescript
config.performance.maxJsonSizeMB           // Max JSON size in MB
config.performance.maxJsonSizeBytes        // Max JSON size in bytes
config.performance.jsonStreamingChunkSize  // Streaming chunk size
```

### Analytics

```typescript
config.analytics.ga.measurementId   // Google Analytics ID
config.analytics.ga.enabled         // Is GA configured?
config.analytics.facebook.pixelId   // Facebook Pixel ID
config.analytics.facebook.enabled   // Is FB Pixel configured?
config.analytics.hotjar.id          // Hotjar site ID
config.analytics.hotjar.enabled     // Is Hotjar configured?
```

### SEO

```typescript
config.seo.verification.google  // Google Search Console verification
config.seo.verification.yandex  // Yandex verification
config.seo.verification.bing    // Bing verification
config.seo.facebook.appId       // Facebook App ID
```

### Build & CI

```typescript
config.build.id    // Build identifier
config.build.isCI  // Running in CI environment
```

### Testing

```typescript
config.testing.baseUrl  // Playwright base URL
```

## Environment Variables

### Required Variables

These must be set for the application to start:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - NextAuth base URL
- `NEXTAUTH_SECRET` - NextAuth JWT secret (min 32 characters)
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Optional Variables with Defaults

- `NODE_ENV` - Default: `'development'`
- `REDIS_URL` - Default: `'redis://localhost:6379'`
- `NEXT_PUBLIC_APP_URL` - Default: `'https://json-viewer.io'`
- `MAX_JSON_SIZE_MB` - Default: `'2048'`
- `JSON_STREAMING_CHUNK_SIZE` - Default: `'1048576'`

### Optional Variables

All analytics, SEO verification, and testing variables are optional.

## Migration Guide

### Step 1: Import the Config Module

Replace direct `process.env` access:

**Before:**
```typescript
const dbUrl = process.env.DATABASE_URL;
const isDev = process.env.NODE_ENV === 'development';
```

**After:**
```typescript
import { config } from '@/lib/config';

const dbUrl = config.database.url;
const isDev = config.isDevelopment;
```

### Step 2: Update Common Patterns

#### Database Configuration

**Before:**
```typescript
datasourceUrl: process.env.DATABASE_URL
```

**After:**
```typescript
import { config } from '@/lib/config';

datasourceUrl: config.database.url
```

#### Environment Checks

**Before:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}
```

**After:**
```typescript
import { config } from '@/lib/config';

if (config.isDevelopment) {
  console.log('Debug info');
}
```

#### Performance Settings

**Before:**
```typescript
const maxSize = parseInt(process.env.MAX_JSON_SIZE_MB || '2048') * 1024 * 1024;
```

**After:**
```typescript
import { config } from '@/lib/config';

const maxSize = config.performance.maxJsonSizeBytes;
```

#### Analytics

**Before:**
```typescript
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
if (GA_ID) {
  // Initialize analytics
}
```

**After:**
```typescript
import { config } from '@/lib/config';

if (config.analytics.ga.enabled) {
  const gaId = config.analytics.ga.measurementId;
  // Initialize analytics
}
```

### Step 3: Client-Side Usage

For client-side code, use the config module the same way:

```typescript
'use client';

import { config } from '@/lib/config';

export function Analytics() {
  // Only public NEXT_PUBLIC_* variables are accessible
  const appUrl = config.app.url;
  const gaId = config.analytics.ga.measurementId;

  // This will work in the browser
}
```

**Note:** Server-only variables (like `DATABASE_URL`, `NEXTAUTH_SECRET`) will cause build errors if accessed in client components. This is intentional and helps prevent security issues.

## Validation Errors

If environment validation fails, you'll see clear error messages:

```
❌ Environment validation failed:
  • DATABASE_URL: DATABASE_URL must be a valid PostgreSQL URL
  • NEXTAUTH_SECRET: NEXTAUTH_SECRET must be at least 32 characters
  • GITHUB_CLIENT_ID: GITHUB_CLIENT_ID is required
```

## Adding New Environment Variables

1. Add to the Zod schema in `env.ts`:

```typescript
const envSchema = z.object({
  // ... existing variables
  NEW_VARIABLE: z.string().min(1, 'NEW_VARIABLE is required'),
});
```

2. Add to the parsing in `validateEnv()`:

```typescript
NEW_VARIABLE: process.env.NEW_VARIABLE,
```

3. Add to the config object:

```typescript
export const config = {
  // ... existing config
  newFeature: {
    variable: env.NEW_VARIABLE,
  },
} as const;
```

4. Export for backward compatibility:

```typescript
export const { NEW_VARIABLE } = env;
```

5. Update `.env.example` with documentation

## Best Practices

1. ✅ **Always use the config module** instead of `process.env`
2. ✅ **Use the structured config object** for better organization
3. ✅ **Check `.enabled` flags** before using analytics/tracking
4. ✅ **Use type-safe environment checks** (`config.isDevelopment`)
5. ✅ **Document new variables** in `.env.example`
6. ❌ **Never access `process.env` directly** in application code
7. ❌ **Never commit real credentials** to `.env` or `.env.example`

## Troubleshooting

### "Invalid environment configuration" Error

Check that all required variables are set in your `.env` file. Compare with `.env.example` to see what's missing.

### Build Fails with "Cannot access X on client"

You're trying to access a server-only variable in a client component. Move the logic to a server component or API route.

### Variable Not Updating

The environment is validated at module load time. Restart your development server after changing `.env`.

## Files

- `lib/config/env.ts` - Main configuration module with validation
- `lib/config/index.ts` - Public exports
- `lib/config/README.md` - This documentation
- `.env.example` - Template with all available variables
- `.env` - Your local configuration (not committed to git)

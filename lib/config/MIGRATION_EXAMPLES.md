# Environment Configuration Migration Examples

Step-by-step examples for migrating from `process.env` to the centralized config module.

## Quick Reference

```typescript
// Import the config module
import { config } from '@/lib/config';

// Or import specific helpers
import { config, env } from '@/lib/config';
```

## Real-World Migration Examples

### Example 1: Database Configuration (`lib/db.ts`)

**Before:**
```typescript
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**After:**
```typescript
import { config } from '@/lib/config';

export const prisma = new PrismaClient({
  log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: config.database.url,
});

if (!config.isProduction) globalForPrisma.prisma = prisma;
```

**Benefits:**
- ✅ Type-safe environment checks
- ✅ No string comparisons
- ✅ Cleaner, more readable code

---

### Example 2: Redis Configuration (`lib/redis.ts`)

**Before:**
```typescript
const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
```

**After:**
```typescript
import { config } from '@/lib/config';

const redis =
  globalForRedis.redis ||
  new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
  });

if (!config.isProduction) {
  globalForRedis.redis = redis;
}
```

**Benefits:**
- ✅ Default value handled in config
- ✅ Single source of truth
- ✅ Validated URL at startup

---

### Example 3: Authentication (`lib/auth/index.ts`)

**Before:**
```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};
```

**After:**
```typescript
import { config } from '@/lib/config';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: config.auth.providers.github.clientId,
      clientSecret: config.auth.providers.github.clientSecret,
    }),
    GoogleProvider({
      clientId: config.auth.providers.google.clientId,
      clientSecret: config.auth.providers.google.clientSecret,
    }),
  ],
  secret: config.auth.secret,
};
```

**Benefits:**
- ✅ No need for `!` assertion (already validated)
- ✅ Organized provider configuration
- ✅ Better autocomplete in IDE

---

### Example 4: Performance Settings (Multiple Files)

**Files:** `app/api/json/upload/route.ts`, `app/api/json/route.ts`

**Before:**
```typescript
const maxSize = parseInt(process.env.MAX_JSON_SIZE_MB || '2048') * 1024 * 1024;
const maxChunkSize = parseInt(process.env.JSON_STREAMING_CHUNK_SIZE || '1048576');
```

**After:**
```typescript
import { config } from '@/lib/config';

const maxSize = config.performance.maxJsonSizeBytes;
const maxChunkSize = config.performance.jsonStreamingChunkSize;
```

**Benefits:**
- ✅ Pre-calculated byte values
- ✅ No repeated parsing logic
- ✅ Consistent across all files
- ✅ Type-safe numbers (not strings)

---

### Example 5: Analytics Component (`components/shared/seo/analytics.tsx`)

**Before:**
```typescript
export function Analytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;

  if (!GA_MEASUREMENT_ID && !FB_PIXEL_ID && !HOTJAR_ID) {
    return null;
  }

  return (
    <>
      {GA_MEASUREMENT_ID && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      )}
      {/* More analytics code... */}
    </>
  );
}
```

**After:**
```typescript
import { config } from '@/lib/config';

export function Analytics() {
  const hasAnalytics =
    config.analytics.ga.enabled ||
    config.analytics.facebook.enabled ||
    config.analytics.hotjar.enabled;

  if (!hasAnalytics) {
    return null;
  }

  return (
    <>
      {config.analytics.ga.enabled && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${config.analytics.ga.measurementId}`}
          strategy="afterInteractive"
        />
      )}
      {/* More analytics code... */}
    </>
  );
}
```

**Benefits:**
- ✅ Cleaner conditional checks
- ✅ `.enabled` flags make intent clear
- ✅ Organized analytics configuration

---

### Example 6: SEO Configuration (`lib/seo/index.ts`)

**Before:**
```typescript
export const DEFAULT_SEO_CONFIG = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://json-viewer.io',
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: {
      'msvalidate.01': process.env.BING_VERIFICATION || '',
    },
  },
  openGraph: {
    site_name: 'JSON Viewer & Editor',
    'fb:app_id': process.env.FACEBOOK_APP_ID || '',
  },
};
```

**After:**
```typescript
import { config } from '@/lib/config';

export const DEFAULT_SEO_CONFIG = {
  siteUrl: config.app.url,
  verification: {
    google: config.seo.verification.google,
    yandex: config.seo.verification.yandex,
    other: {
      'msvalidate.01': config.seo.verification.bing || '',
    },
  },
  openGraph: {
    site_name: 'JSON Viewer & Editor',
    'fb:app_id': config.seo.facebook.appId || '',
  },
};
```

**Benefits:**
- ✅ Organized SEO configuration
- ✅ No fallback logic needed (handled in config)
- ✅ Single source for app URL

---

### Example 7: API Error Handling (`lib/api/utils.ts`)

**Before:**
```typescript
return NextResponse.json(
  {
    error: message,
    details: process.env.NODE_ENV === 'development'
      ? { stack: error.stack }
      : undefined,
  },
  { status }
);
```

**After:**
```typescript
import { config } from '@/lib/config';

return NextResponse.json(
  {
    error: message,
    details: config.isDevelopment
      ? { stack: error.stack }
      : undefined,
  },
  { status }
);
```

**Benefits:**
- ✅ Cleaner conditional logic
- ✅ Type-safe boolean check
- ✅ Consistent across codebase

---

### Example 8: Logger Configuration (`lib/logger.ts`)

**Before:**
```typescript
const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  // ... other options
});
```

**After:**
```typescript
import { config } from '@/lib/config';

const logger = pino({
  level: config.isDevelopment ? 'debug' : 'info',
  // ... other options
});
```

**Benefits:**
- ✅ Cleaner code
- ✅ Consistent with other environment checks

---

### Example 9: Health Check API (`app/api/health/route.ts`)

**Before:**
```typescript
return NextResponse.json({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
});
```

**After:**
```typescript
import { config } from '@/lib/config';

return NextResponse.json({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  environment: config.nodeEnv,
});
```

**Benefits:**
- ✅ Default handled in config
- ✅ Type-safe value
- ✅ No fallback needed

---

### Example 10: Playwright Test Configuration

**Before:**
```typescript
export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3456',
  },
});
```

**After:**
```typescript
import { config } from '@/lib/config';

export default defineConfig({
  forbidOnly: config.build.isCI,
  retries: config.build.isCI ? 2 : 0,
  workers: config.build.isCI ? 1 : undefined,
  use: {
    baseURL: config.testing.baseUrl,
  },
});
```

**Benefits:**
- ✅ Cleaner boolean conversion
- ✅ Organized test configuration
- ✅ Default URL handled

---

## Pattern Migration Guide

### Pattern: Environment Detection

| Before | After |
|--------|-------|
| `process.env.NODE_ENV === 'development'` | `config.isDevelopment` |
| `process.env.NODE_ENV === 'production'` | `config.isProduction` |
| `process.env.NODE_ENV === 'test'` | `config.isTest` |
| `process.env.NODE_ENV !== 'production'` | `!config.isProduction` |

### Pattern: Optional Variables with Defaults

| Before | After |
|--------|-------|
| `process.env.VAR \|\| 'default'` | Use `config` (default handled) |
| `parseInt(process.env.VAR \|\| '100')` | Use `config` (pre-parsed) |
| `!!process.env.VAR` | Use `.enabled` flags in config |

### Pattern: URL Configuration

| Before | After |
|--------|-------|
| `process.env.NEXT_PUBLIC_APP_URL` | `config.app.url` |
| `process.env.DATABASE_URL` | `config.database.url` |
| `process.env.REDIS_URL` | `config.redis.url` |

### Pattern: Authentication

| Before | After |
|--------|-------|
| `process.env.GITHUB_CLIENT_ID!` | `config.auth.providers.github.clientId` |
| `process.env.NEXTAUTH_SECRET` | `config.auth.secret` |

### Pattern: Analytics Checks

| Before | After |
|--------|-------|
| `const id = process.env.GA_ID; if (id) { ... }` | `if (config.analytics.ga.enabled) { ... }` |

---

## Step-by-Step Migration Process

### 1. Add Import
```typescript
import { config } from '@/lib/config';
```

### 2. Replace Environment Variables
Use find-and-replace to update common patterns:
- Find: `process.env.NODE_ENV === 'development'`
- Replace: `config.isDevelopment`

### 3. Remove Fallbacks
If the config already has defaults, remove redundant fallback logic:
```typescript
// Before: Multiple places with fallbacks
const url = process.env.REDIS_URL || 'redis://localhost:6379';

// After: Single place in config, no fallback needed
const url = config.redis.url;
```

### 4. Simplify Conditionals
```typescript
// Before: String comparison
if (process.env.NODE_ENV === 'development') { }

// After: Boolean flag
if (config.isDevelopment) { }
```

### 5. Remove Type Assertions
```typescript
// Before: Manual assertion
const secret = process.env.SECRET!;

// After: Already validated
const secret = config.auth.secret;
```

### 6. Test
Run your tests to ensure everything works:
```bash
npm run test
npm run build
```

---

## Common Pitfalls

### ❌ Don't: Mix old and new patterns
```typescript
// Bad: Inconsistent
const isDev = process.env.NODE_ENV === 'development';
const dbUrl = config.database.url;
```

### ✅ Do: Use config consistently
```typescript
// Good: Consistent
const isDev = config.isDevelopment;
const dbUrl = config.database.url;
```

### ❌ Don't: Use config in .env files
```env
# Bad: Can't use config in .env
DATABASE_URL="${config.database.url}"
```

### ✅ Do: Set values directly in .env
```env
# Good: Direct values
DATABASE_URL="postgresql://localhost:5432/db"
```

### ❌ Don't: Bypass validation
```typescript
// Bad: Going around validation
const url = process.env.DATABASE_URL;
```

### ✅ Do: Use validated config
```typescript
// Good: Type-safe and validated
const url = config.database.url;
```

---

## Testing Your Migration

### 1. Unit Test the Config

```typescript
import { config } from '@/lib/config';

describe('Environment Configuration', () => {
  it('should have valid database URL', () => {
    expect(config.database.url).toMatch(/^postgresql:/);
  });

  it('should have correct environment flags', () => {
    const envFlags = [
      config.isDevelopment,
      config.isProduction,
      config.isTest,
    ];
    expect(envFlags.filter(Boolean).length).toBe(1);
  });

  it('should have analytics configuration', () => {
    if (config.analytics.ga.enabled) {
      expect(config.analytics.ga.measurementId).toBeTruthy();
    }
  });
});
```

### 2. Integration Test

```typescript
import { config } from '@/lib/config';
import { PrismaClient } from '@prisma/client';

describe('Database Integration', () => {
  it('should connect with config URL', async () => {
    const prisma = new PrismaClient({
      datasourceUrl: config.database.url,
    });

    await expect(prisma.$connect()).resolves.not.toThrow();
    await prisma.$disconnect();
  });
});
```

### 3. E2E Test

Verify the application starts and runs correctly:
```bash
# Start with config
npm run dev

# Run E2E tests
npm run test:e2e
```

---

## Rollback Strategy

If you need to rollback:

1. **Gradual Migration**: The config exports individual variables for compatibility
   ```typescript
   import { DATABASE_URL } from '@/lib/config';
   // Use like process.env.DATABASE_URL
   ```

2. **File-by-File**: Revert individual files using git
   ```bash
   git checkout HEAD -- lib/db.ts
   ```

3. **Feature Flag**: Temporarily support both patterns
   ```typescript
   // Temporary during migration
   const isDev = config?.isDevelopment ?? process.env.NODE_ENV === 'development';
   ```

---

## Success Checklist

- [ ] All `process.env` references updated (except in `lib/config/env.ts`)
- [ ] Tests passing with new configuration
- [ ] Application builds successfully
- [ ] Development server starts without errors
- [ ] Production build works correctly
- [ ] All team members updated on changes
- [ ] Documentation updated
- [ ] `.env.example` reflects all variables

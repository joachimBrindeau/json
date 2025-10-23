# TypeScript Error Fix Guide

**Project:** json-viewer-io  
**Date:** 2025-10-23  
**Current Status:** 368 TypeScript errors across 47 files  
**Target:** 0 errors

---

## Table of Contents

1. [Overview](#overview)
2. [Error Categories & Patterns](#error-categories--patterns)
3. [Fix Patterns by Category](#fix-patterns-by-category)
4. [Implementation Strategy](#implementation-strategy)
5. [Validation Steps](#validation-steps)

---

## Overview

This guide provides systematic fix patterns for all 368 TypeScript errors identified in the baseline audit. The errors fall into 6 main categories:

| Category                               | Count | Priority | Est. Effort |
| -------------------------------------- | ----- | -------- | ----------- |
| A. Next.js 15 Route Handler Signatures | ~60   | P0       | 4-6 hours   |
| B. Playwright Test API Type Mismatches | ~150  | P1       | 8-12 hours  |
| C. Session Management Test Types       | ~20   | P1       | 2-3 hours   |
| D. Prisma Mock Type Incompatibilities  | ~20   | P1       | 2-3 hours   |
| E. Missing Test Helper Methods         | ~10   | P1       | 2-3 hours   |
| F. Implicit Any & Window Properties    | ~108  | P1       | 4-6 hours   |

**Total Estimated Effort:** 22-33 hours

---

## Error Categories & Patterns

### Category A: Next.js 15 Route Handler Signatures (P0)

**Root Cause:** Next.js 15 changed route handler signatures from `(request, context)` to `(request)` only.

**Affected Files (~15 files):**

- `app/api/auth/__tests__/auth-integration.test.ts`
- `app/api/auth/migrate-anonymous/__tests__/route.test.ts`
- `app/api/auth/reset-password/__tests__/route.test.ts`
- All `app/api/*/__tests__/*.test.ts` files

**Error Pattern:**

```typescript
error TS2554: Expected 1 arguments, but got 2.
```

**Fix Pattern:**

```typescript
// ❌ BEFORE (Next.js 14 signature)
const response = await POST(request, { params: Promise.resolve({ id: '123' }) });

// ✅ AFTER (Next.js 15 signature)
// Option 1: Route doesn't use params - remove context entirely
const response = await POST(request);

// Option 2: Route uses params - pass via request URL
const url = new URL(request.url);
url.searchParams.set('id', '123');
const modifiedRequest = new Request(url, request);
const response = await POST(modifiedRequest);

// Option 3: For dynamic routes - extract params from URL in route handler
// In route.ts:
export async function POST(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop(); // Extract from path
  // ... rest of handler
}
```

**Examples:**

```typescript
// Example 1: Simple POST without params
// BEFORE:
const response = await POST(
  new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  { params: Promise.resolve({}) }
);

// AFTER:
const response = await POST(
  new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
);

// Example 2: GET with dynamic params
// BEFORE:
const response = await GET(new Request('http://localhost:3000/api/json/123'), {
  params: Promise.resolve({ id: '123' }),
});

// AFTER:
const response = await GET(new Request('http://localhost:3000/api/json/123'));
// Route handler extracts '123' from request.url
```

---

### Category B: Playwright Test API Type Mismatches (P1)

**Root Cause:** Multiple Playwright API type issues including test timeout signatures, assertion signatures, and type inference problems.

**Affected Files (~30 files):**

- All `tests/e2e/**/*.spec.ts` files

#### B1: Test Timeout Signature Issues

**Error Pattern:**

```typescript
error TS2559: Type '() => Promise<void>' has no properties in common with type 'TestDetails'.
```

**Code Pattern:**

```typescript
test(
  'should process large JSON files',
  async () => {
    // test body
  },
  CHUNKING_TIMEOUT // 180_000
);
```

**Analysis:** This is a **false positive** from TypeScript's type inference. The Playwright `test()` function has overloaded signatures:

- `test(title, callback)` - normal test
- `test(title, callback, options)` - test with options
- `test(title, callback, timeout)` - test with timeout (number)

TypeScript incorrectly infers the third parameter as `TestDetails` instead of `number | { timeout: number }`.

**Fix Pattern:**

```typescript
// Option 1: Use timeout option object (preferred - most explicit)
test(
  'should process large JSON files',
  async () => {
    // test body
  },
  { timeout: CHUNKING_TIMEOUT }
);

// Option 2: Inline timeout in test.setTimeout() (alternative)
test('should process large JSON files', async ({ page }) => {
  test.setTimeout(CHUNKING_TIMEOUT);
  // test body
});

// Option 3: Use test.slow() multiplier for reasonable timeouts
test('should process large JSON files', async ({ page }) => {
  test.slow(); // Triples default timeout
  // test body
});
```

**Files to Update:**

- `tests/e2e/advanced/chunked-json-processing.spec.ts` (5 occurrences)
- `tests/e2e/advanced/export-functionality.spec.ts`
- `tests/e2e/advanced/large-json-performance.spec.ts`
- Any test with custom timeout as third parameter

#### B2: Assertion Signature Issues

**Error Pattern:**

```typescript
error TS2769: No overload matches this call.
  Argument of type '{ min: number }' is not assignable to parameter of type 'number'.
```

**Fix Pattern:**

```typescript
// ❌ BEFORE
await expect(elements).toHaveCount({ min: 3 });

// ✅ AFTER - Use exact count
await expect(elements).toHaveCount(3);

// ✅ OR - Use comparison methods
const count = await elements.count();
expect(count).toBeGreaterThanOrEqual(3);

// ✅ OR - Custom assertion for range
const count = await elements.count();
expect(count).toBeGreaterThanOrEqual(3);
expect(count).toBeLessThanOrEqual(10);
```

#### B3: URLSearchParams Type Issues

**Error Pattern:**

```typescript
error TS2769: No overload matches this call.
  Type 'URLSearchParams' is not assignable to type 'string | string[][] | Record<string, string> | undefined'.
```

**Fix Pattern:**

```typescript
// ❌ BEFORE
const params = new URLSearchParams(queryParams);
const url = `${baseUrl}?${params}`;

// ✅ AFTER - Convert to string explicitly
const params = new URLSearchParams(queryParams);
const url = `${baseUrl}?${params.toString()}`;
```

---

### Category C: Session Management Test Types (P1)

**Root Cause:** next-auth session/JWT callback types don't match actual usage patterns.

**Affected Files (~5 files):**

- `lib/auth/__tests__/session-management.test.ts`
- `lib/auth/__tests__/callbacks.test.ts`

**Error Pattern:**

```typescript
error TS2322: Type '{ token: JWT; user: User; }' is not assignable to type 'JWT'.
```

**Fix Pattern:**

```typescript
// ❌ BEFORE
const result = await jwtCallback({
  token: mockToken,
  user: mockUser,
});

// ✅ AFTER - Properly type the callback params
import { JWT } from 'next-auth/jwt';
import { User } from 'next-auth';

interface JWTCallbackParams {
  token: JWT;
  user?: User;
  account?: Account | null;
  profile?: Profile;
  isNewUser?: boolean;
  trigger?: 'signIn' | 'signUp' | 'update';
  session?: any;
}

const result = await jwtCallback({
  token: mockToken,
  user: mockUser,
  trigger: 'signIn',
} as JWTCallbackParams);
```

**Type Definition File:**

Create or update `types/next-auth.d.ts`:

```typescript
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role?: string;
    sub: string;
  }
}
```

---

### Category D: Prisma Mock Type Incompatibilities (P1)

**Root Cause:** Mock Prisma documents missing required model fields.

**Affected Files (~5 files):**

- `app/api/auth/__tests__/auth-integration.test.ts`
- `app/api/auth/migrate-anonymous/__tests__/route.test.ts`

**Error Pattern:**

```typescript
error TS2741: Property 'createdAt' is missing in type but required in type 'JsonDocument'.
```

**Fix Pattern:**

```typescript
// ❌ BEFORE - Incomplete mock
const mockDocument = {
  id: 'doc-123',
  title: 'Test',
  content: {},
  userId: 'user-123',
};

// ✅ AFTER - Complete mock with all required Prisma fields
import { JsonDocument, Prisma } from '@prisma/client';

const mockDocument: JsonDocument = {
  id: 'doc-123',
  title: 'Test',
  content: {} as Prisma.JsonValue,
  userId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  isPublic: false,
  description: null,
  tags: [],
  category: null,
  viewCount: 0,
  richContent: null,
};

// ✅ OR - Use Partial<JsonDocument> for flexible mocks
const mockDocument: Partial<JsonDocument> = {
  id: 'doc-123',
  title: 'Test',
  content: {} as Prisma.JsonValue,
  userId: 'user-123',
};

// Cast when needed
prisma.jsonDocument.findUnique.mockResolvedValue(mockDocument as JsonDocument);
```

**Helper Function Pattern:**

```typescript
// tests/helpers/mock-factories.ts
import { JsonDocument, User, Prisma } from '@prisma/client';

export function createMockDocument(overrides: Partial<JsonDocument> = {}): JsonDocument {
  return {
    id: 'doc-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Document',
    content: { test: 'data' } as Prisma.JsonValue,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: false,
    description: null,
    tags: [],
    category: null,
    viewCount: 0,
    richContent: null,
    ...overrides,
  };
}

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'USER',
    ...overrides,
  };
}

// Usage in tests:
const mockDoc = createMockDocument({ title: 'My Test', isPublic: true });
```

---

### Category E: Missing Test Helper Methods (P1)

**Root Cause:** Test files reference helper methods that don't exist yet.

**Affected Files (~10 files):**

- `tests/e2e/user-stories/*.spec.ts`

**Missing Methods:**

1. `AuthHelper.ensureAuthenticated()`
2. `DataGenerator.generateEcommerceJSON()`
3. `DataGenerator.generateAnalyticsJSON()`
4. Page object methods (various)

**Fix Pattern:**

#### E1: AuthHelper.ensureAuthenticated()

```typescript
// tests/helpers/auth-helper.ts
import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Ensures the user is authenticated, creating a session if needed
   */
  async ensureAuthenticated(credentials?: { email?: string; password?: string }): Promise<void> {
    const defaultCredentials = {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'password123',
    };

    const creds = { ...defaultCredentials, ...credentials };

    // Check if already authenticated
    const isAuthenticated = await this.isAuthenticated();
    if (isAuthenticated) {
      return;
    }

    // Navigate to login
    await this.page.goto('/auth/login');

    // Fill login form
    await this.page.fill('input[name="email"]', creds.email);
    await this.page.fill('input[name="password"]', creds.password);
    await this.page.click('button[type="submit"]');

    // Wait for redirect
    await this.page.waitForURL(/\/(dashboard|library|$)/);
  }

  async isAuthenticated(): Promise<boolean> {
    // Check for auth cookie or session indicator
    const cookies = await this.page.context().cookies();
    return cookies.some(
      (cookie) =>
        cookie.name === 'next-auth.session-token' ||
        cookie.name === '__Secure-next-auth.session-token'
    );
  }

  async logout(): Promise<void> {
    await this.page.goto('/api/auth/signout');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/');
  }
}
```

#### E2: DataGenerator Methods

```typescript
// tests/helpers/data-generator.ts
export class DataGenerator {
  /**
   * Generate realistic e-commerce JSON data
   */
  static generateEcommerceJSON(
    options: {
      productCount?: number;
      includeOrders?: boolean;
    } = {}
  ): object {
    const { productCount = 50, includeOrders = true } = options;

    return {
      store: {
        name: 'Sample E-Commerce Store',
        currency: 'USD',
        timezone: 'America/New_York',
      },
      products: Array.from({ length: productCount }, (_, i) => ({
        id: `prod_${i + 1}`,
        name: `Product ${i + 1}`,
        description: `Description for product ${i + 1}`,
        price: (Math.random() * 100 + 10).toFixed(2),
        category: ['Electronics', 'Clothing', 'Home', 'Sports'][i % 4],
        inStock: Math.random() > 0.2,
        rating: (Math.random() * 2 + 3).toFixed(1),
        reviews: Math.floor(Math.random() * 500),
        tags: [`tag_${(i % 10) + 1}`, `feature_${(i % 5) + 1}`],
      })),
      ...(includeOrders && {
        orders: Array.from({ length: 20 }, (_, i) => ({
          id: `order_${i + 1}`,
          customerId: `cust_${Math.floor(Math.random() * 100) + 1}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          total: (Math.random() * 500 + 50).toFixed(2),
          status: ['pending', 'shipped', 'delivered', 'cancelled'][i % 4],
          items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
            productId: `prod_${Math.floor(Math.random() * productCount) + 1}`,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: (Math.random() * 100 + 10).toFixed(2),
          })),
        })),
      }),
    };
  }

  /**
   * Generate analytics JSON data
   */
  static generateAnalyticsJSON(
    options: {
      days?: number;
      metricsPerDay?: number;
    } = {}
  ): object {
    const { days = 30, metricsPerDay = 24 } = options;

    return {
      metadata: {
        reportType: 'analytics',
        generatedAt: new Date().toISOString(),
        period: { days, metricsPerDay },
      },
      metrics: Array.from({ length: days }, (_, dayIndex) => ({
        date: new Date(Date.now() - (days - dayIndex) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        pageViews: Math.floor(Math.random() * 10000 + 5000),
        uniqueVisitors: Math.floor(Math.random() * 5000 + 2000),
        bounceRate: (Math.random() * 0.3 + 0.2).toFixed(3),
        avgSessionDuration: Math.floor(Math.random() * 300 + 60),
        hourlyData: Array.from({ length: metricsPerDay }, (_, hour) => ({
          hour,
          views: Math.floor(Math.random() * 500 + 100),
          conversions: Math.floor(Math.random() * 50 + 10),
          revenue: (Math.random() * 1000 + 100).toFixed(2),
        })),
      })),
      topPages: Array.from({ length: 10 }, (_, i) => ({
        path: `/page-${i + 1}`,
        views: Math.floor(Math.random() * 50000 + 10000),
        avgTime: Math.floor(Math.random() * 180 + 30),
        exitRate: (Math.random() * 0.5 + 0.1).toFixed(3),
      })),
      sources: [
        { name: 'Direct', percentage: 35, visits: 35000 },
        { name: 'Organic Search', percentage: 28, visits: 28000 },
        { name: 'Social Media', percentage: 20, visits: 20000 },
        { name: 'Referral', percentage: 12, visits: 12000 },
        { name: 'Email', percentage: 5, visits: 5000 },
      ],
    };
  }
}
```

---

### Category F: Implicit Any & Window Properties (P1)

**Root Cause:** Missing type declarations for global window properties and implicit any types.

**Affected Files (~20 files):**

- Various E2E tests that access `window` object

#### F1: Window Property Extensions

**Fix Pattern:**

```typescript
// tests/types/window.d.ts (create this file)
declare global {
  interface Window {
    // Performance monitoring
    memoryBefore?: number;
    startTime?: number;
    memoryReadings?: Array<{
      timestamp: number;
      used: number;
      total: number;
    }>;
    monitorMemory?: () => void;
    memoryInterval?: NodeJS.Timeout;

    // Test utilities
    testData?: any;
    processedData?: any;
    errorLog?: string[];

    // Feature flags (if used)
    featureFlags?: Record<string, boolean>;

    // Custom app properties
    jsonViewerState?: any;
  }
}

export {};
```

**Usage in Tests:**

```typescript
// ✅ Now properly typed
await page.evaluate(() => {
  window.memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
  window.startTime = performance.now();
});

const metrics = await page.evaluate(() => ({
  memoryUsed: window.memoryBefore || 0,
  elapsed: window.startTime ? performance.now() - window.startTime : 0,
}));
```

#### F2: Implicit Any Types

**Fix Pattern:**

```typescript
// ❌ BEFORE
const data = results.map((r) => r.value); // r implicitly any

// ✅ AFTER - Add explicit type
interface ResultItem {
  value: number;
  timestamp: number;
}

const data = results.map((r: ResultItem) => r.value);

// ✅ OR - Use type assertion if structure is dynamic
const data = (results as any[]).map((r) => r.value);
```

---

## Implementation Strategy

### Phase 1: Quick Wins (2-3 hours)

1. **Run Prettier** (P1 - 5 minutes)

   ```bash
   npm run format
   git add .
   git commit -m "chore: run Prettier format across codebase"
   ```

2. **Create Type Definition Files** (30 minutes)
   - `types/next-auth.d.ts`
   - `tests/types/window.d.ts`
   - `tests/helpers/mock-factories.ts`

3. **Add Missing Test Helpers** (2-3 hours)
   - Implement `AuthHelper.ensureAuthenticated()`
   - Implement `DataGenerator` methods

### Phase 2: API Route Tests (4-6 hours)

Fix all Next.js 15 route handler signature issues:

1. Create search/replace pattern
2. Update all test files systematically
3. Validate with `npx tsc --noEmit`

### Phase 3: Playwright Tests (8-12 hours)

Fix Playwright test API issues:

1. Fix timeout signatures (2 hours)
2. Fix assertion signatures (3 hours)
3. Add Window type extensions (1 hour)
4. Fix implicit any types (2-3 hours)
5. Update Prisma mocks (2-3 hours)

### Phase 4: Validation (1 hour)

```bash
# Run TypeScript check
npx tsc --noEmit

# Should output: "Found 0 errors."

# Run tests to ensure nothing broke
npm test
npm run test:e2e:smoke
```

---

## Validation Steps

### Step 1: Incremental Validation

After each fix category, run:

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

Track progress:

- Start: 368 errors
- After Phase 1: ~340 errors
- After Phase 2: ~280 errors
- After Phase 3: ~0 errors

### Step 2: Test Validation

```bash
# Unit tests should pass
npm test

# E2E smoke tests should pass
npm run test:e2e:smoke

# Full E2E suite
npm run test:e2e
```

### Step 3: Build Validation

```bash
# Production build should succeed
npm run build

# Type check should pass
npm run type-check
```

---

## Quick Reference: Common Fixes

### Fix 1: Route Handler Signature

```typescript
// Before: await POST(req, { params: ... })
// After:  await POST(req)
```

### Fix 2: Test Timeout

```typescript
// Before: test(title, callback, 180_000)
// After:  test(title, callback, { timeout: 180_000 })
```

### Fix 3: Assertion Count

```typescript
// Before: expect(el).toHaveCount({ min: 3 })
// After:  expect(await el.count()).toBeGreaterThanOrEqual(3)
```

### Fix 4: Prisma Mock

```typescript
// Before: { id, title, content }
// After:  createMockDocument({ id, title, content })
```

### Fix 5: Window Property

```typescript
// Before: window.customProp (implicit any)
// After:  Add to types/window.d.ts
```

---

## Success Criteria

- ✅ `npx tsc --noEmit` reports 0 errors
- ✅ All unit tests pass (`npm test`)
- ✅ All E2E smoke tests pass (`npm run test:e2e:smoke`)
- ✅ Production build succeeds (`npm run build`)
- ✅ No new ESLint errors introduced

---

## Notes

- **Test Coverage:** Focus on fixing types without changing test logic
- **False Positives:** Some Playwright errors are type inference issues, not real bugs
- **Prisma Mocks:** Use factory functions for consistency
- **Next.js 15:** Route handler signature change is a breaking change
- **Incremental Progress:** Fix and validate category by category

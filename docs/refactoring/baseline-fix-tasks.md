# Baseline Quality Gates - Fix Tasks

**Generated:** 2025-10-23T10:12:00Z  
**Source:** Baseline Quality Gates Report  
**Status:** Ready for Assignment

---

## P0: Critical Fixes (Block All Development)

### P0-1: Fix Next.js 15 Route Handler Signatures in Tests

**Priority:** P0  
**Estimated Effort:** 4-6 hours  
**Owner:** TBD  
**Due Date:** TBD

**Description:**  
All API route test files are using the old Next.js 14 route handler signature with a second `context` parameter. Next.js 15 removed this parameter, causing 60+ type errors across test files.

**Files Affected (~15 files):**

- `app/api/auth/__tests__/auth-integration.test.ts` (9 errors)
- `app/api/auth/migrate-anonymous/__tests__/route.test.ts` (18 errors)
- All other API route test files with similar patterns

**Current Pattern (❌ Fails):**

```typescript
const response = await POST(request, { params: Promise.resolve({}) });
const response = await DELETE(request, mockSession);
```

**Required Pattern (✅ Fixed):**

```typescript
const response = await POST(request);
// Access params via request.url or Next.js helpers
```

**Acceptance Criteria:**

- [ ] All route handler test calls updated to single-parameter signature
- [ ] `tsc --noEmit` runs clean for all API test files
- [ ] All affected tests still pass
- [ ] No regression in test coverage

**Related Tasks:** P0-2 (Prisma mock fixes may be needed)

---

### P0-2: Fix Prisma Mock Type Incompatibilities

**Priority:** P0  
**Estimated Effort:** 2-3 hours  
**Owner:** TBD  
**Due Date:** TBD

**Description:**  
Mock Prisma documents in tests are missing required model properties, causing type errors when passed to `mockResolvedValue()`.

**Files Affected:**

- `app/api/auth/__tests__/auth-integration.test.ts` (3+ errors)
- `app/api/auth/migrate-anonymous/__tests__/route.test.ts` (3+ errors)

**Current Pattern (❌ Fails):**

```typescript
const mockDocuments = [{ id: 'doc-1', shareId: 'share-1', title: 'Test', size: BigInt(100) }];
vi.mocked(prisma.jsonDocument.findMany).mockResolvedValue(mockDocuments);
```

**Required Pattern (✅ Fixed):**

```typescript
const mockDocuments: JsonDocument[] = [
  {
    id: 'doc-1',
    shareId: 'share-1',
    title: 'Test',
    size: BigInt(100),
    content: {},
    description: null,
    publishedAt: null,
    richContent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-1',
    isPublic: false,
    // ... all other required fields
  },
];
```

**Acceptance Criteria:**

- [ ] All mock documents include all required Prisma model fields
- [ ] Type errors resolved in affected test files
- [ ] Tests pass with complete mock data

---

## P1: High Priority (Complete Before Major Refactoring)

### P1-1: Run Prettier Auto-Format Across Codebase

**Priority:** P1  
**Estimated Effort:** 5 minutes + commit time  
**Owner:** TBD  
**Due Date:** TBD

**Description:**  
376 files have formatting inconsistencies. This should be fixed immediately to establish a clean baseline before any refactoring work begins.

**Command:**

```bash
npm run format
git add .
git commit -m "chore: auto-format codebase with Prettier"
```

**Files Affected:** 376 files across:

- API routes (~50 files)
- Components (~180 files)
- Tests (~100 files)
- Config files (~10 files)
- Other source files (~36 files)

**Acceptance Criteria:**

- [ ] `npm run format:check` passes with 0 warnings
- [ ] No functional changes (verify with git diff)
- [ ] Changes committed to repository
- [ ] CI formatting check added to prevent future violations

**Notes:**

- Ensure `.prettierignore` excludes build artifacts and large generated files
- Run this task early to avoid merge conflicts with other refactoring work

---

### P1-2: Fix Playwright Test API Type Mismatches

**Priority:** P1  
**Estimated Effort:** 8-12 hours  
**Owner:** TBD  
**Due Date:** TBD

**Description:**  
~150+ TypeScript errors in E2E tests due to Playwright API changes and missing type declarations.

**Sub-tasks:**

#### P1-2a: Fix toHaveCount() Usage (~50 errors)

**Pattern (❌ Fails):**

```typescript
await expect(elements).toHaveCount({ min: 3 });
```

**Pattern (✅ Fixed):**

```typescript
const count = await elements.count();
expect(count).toBeGreaterThanOrEqual(3);
```

**Files:** ~20 E2E test files

#### P1-2b: Add Window Interface Extensions (~60 errors)

**Pattern (❌ Fails):**

```typescript
const data = await page.evaluate(() => window.customProperty);
// Error: Property 'customProperty' does not exist on Window
```

**Pattern (✅ Fixed):**

```typescript
// In test file or global.d.ts
declare global {
  interface Window {
    customProperty: any;
    capturedEvents?: Array<{ type: string; data: any }>;
    callbackData?: any;
    // ... all custom properties
  }
}
```

**Files:** Multiple E2E test files accessing custom window properties

#### P1-2c: Fix Implicit Any Types (~30 errors)

**Pattern (❌ Fails):**

```typescript
items.forEach((item) => { ... }); // Parameter 'item' implicitly has 'any' type
```

**Pattern (✅ Fixed):**

```typescript
items.forEach((item: ExpectedType) => { ... });
```

**Files:** Various E2E test files

#### P1-2d: Fix URLSearchParams Type Issues (~10 errors)

**Pattern (❌ Fails):**

```typescript
const params = new URLSearchParams(config.params);
// Error: Type incompatibility with optional properties
```

**Pattern (✅ Fixed):**

```typescript
const params = new URLSearchParams(
  Object.entries(config.params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => [key, String(value)])
);
```

**Files:** Developer embed test files

**Acceptance Criteria:**

- [ ] All Playwright test type errors resolved
- [ ] E2E test suite runs without TypeScript errors
- [ ] Tests maintain existing functionality
- [ ] Window interface extensions documented

---

### P1-3: Implement Missing Test Helper Methods

**Priority:** P1  
**Estimated Effort:** 2-3 hours  
**Owner:** TBD  
**Due Date:** TBD

**Description:**  
Several test files reference helper methods that don't exist, causing compilation failures.

**Missing Methods:**

#### 1. AuthHelper.ensureAuthenticated()

**Files Affected:**

- `tests/e2e/user-stories/export-import.spec.ts` (2 calls)
- `tests/e2e/user-stories/save-to-library.spec.ts` (1 call)
- `tests/e2e/user-stories/share-functionality.spec.ts` (2 calls)

**Implementation Needed:**

```typescript
// In tests/utils/auth-helper.ts or similar
class AuthHelper {
  async ensureAuthenticated() {
    // Check if user is authenticated, login if not
    // Return session or throw if authentication fails
  }
}
```

#### 2. DataGenerator Methods

**Files Affected:**

- `tests/e2e/user-stories/export-import.spec.ts`
- `tests/e2e/user-stories/share-functionality.spec.ts`

**Missing Methods:**

- `generateEcommerceJSON()`
- `generateAnalyticsJSON()`
- `generateConfigurationJSON()` (exists as `generateConfiguration()` - needs alias)

**Implementation Needed:**

```typescript
// In tests/utils/data-generator.ts
class DataGenerator {
  generateEcommerceJSON() {
    return {
      products: [...],
      orders: [...],
      customers: [...]
    };
  }

  generateAnalyticsJSON() {
    return {
      pageViews: [...],
      events: [...],
      conversions: [...]
    };
  }

  // Alias or rename existing method
  generateConfigurationJSON() {
    return this.generateConfiguration();
  }
}
```

**Acceptance Criteria:**

- [ ] All missing methods implemented in helper classes
- [ ] Tests calling these methods compile and run successfully
- [ ] Methods return appropriate test data
- [ ] Documentation added for new helper methods

---

## P2: Medium Priority (Address During Refactoring)

### P2-1: Remove Unused ESLint Disable Directives

**Priority:** P2  
**Estimated Effort:** 30 minutes  
**Owner:** TBD  
**Due Date:** TBD

**Description:**  
11 unnecessary `eslint-disable` comments should be removed as they're disabling rules that aren't triggering.

**Files Affected:**

- `components/features/modals/share-modal.tsx` (3 `no-console` disables)
- `components/features/viewer/ViewerActions.tsx` (1 `no-console` disable)
- `hooks/use-api-data.ts` (1 `react-hooks/exhaustive-deps` disable)
- `lib/store/backend.ts` (2 `no-console` disables)
- `tests/e2e/smoke.spec.ts` (4 `no-console` disables)

**Action:**
Remove lines like:

```typescript
// eslint-disable-next-line no-console
```

**Acceptance Criteria:**

- [ ] All unused disable directives removed
- [ ] `npm run lint` passes with 0 warnings
- [ ] No new ESLint errors introduced

---

### P2-2: Extract Duplicated Code in API Route

**Priority:** P2  
**Estimated Effort:** 1 hour  
**Owner:** TBD  
**Due Date:** TBD

**Description:**  
Code duplication detected in `app/api/json/find-by-content/route.ts` with 18 lines (114 tokens) duplicated.

**File:** `app/api/json/find-by-content/route.ts`  
**Lines:** 54:12-72:3 and 80:4-98:7

**Action:**

1. Identify the duplicated logic (likely error handling or request processing)
2. Extract into a shared utility function
3. Replace both instances with calls to the shared function

**Example Refactoring:**

```typescript
// Before (duplicated)
try {
  // ... request processing logic ...
} catch (error) {
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}

// After (extracted)
async function processRequest(handler: () => Promise<any>) {
  try {
    return await handler();
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**Acceptance Criteria:**

- [ ] Duplicated code extracted into reusable function
- [ ] Both call sites use the shared function
- [ ] Tests pass
- [ ] jscpd reports 0 duplications in this file

---

## Summary

### Effort Breakdown

- **P0 Tasks:** 6-9 hours
- **P1 Tasks:** 10-15 hours
- **P2 Tasks:** 1.5 hours
- **Total:** ~18-26 hours

### Dependencies

1. P1-1 (Prettier) should be done first to avoid conflicts
2. P0-1 and P0-2 can be done in parallel or sequentially
3. P1-2 (Playwright) can start after P0 tasks are complete
4. P1-3 (Test helpers) can be done independently
5. P2 tasks can be addressed during regular refactoring cycles

### Blockers

- P0 tasks block all TypeScript-dependent work
- P1-1 (Prettier) blocks clean diffs for other work

---

## Next Actions

1. ✅ Baseline report generated
2. ⏳ Create tasks in project tracking system
3. ⏳ Assign owners to P0 tasks
4. ⏳ Schedule P0 fix work immediately
5. ⏳ Add quality gate checks to CI/CD pipeline

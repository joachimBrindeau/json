# Testing Standards & Best Practices

**Version:** 1.0  
**Last Updated:** 2025-10-18  
**Status:** ✅ Active

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Forbidden Patterns](#forbidden-patterns)
3. [Required Patterns](#required-patterns)
4. [Configuration Standards](#configuration-standards)
5. [Test Data Patterns](#test-data-patterns)
6. [Quick Reference](#quick-reference)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

This document defines mandatory testing standards to ensure:
- **Reliability**: Tests fail deterministically when code breaks
- **Speed**: Fast execution through state-based waits
- **Maintainability**: Clear patterns that prevent technical debt

### Summary of Infrastructure Improvements

Over 5 phases, we transformed the testing infrastructure from permissive to strict:

**Phase 1 - Foundation:**
- Strict Playwright configuration (0 retries, 30s timeout, forbidOnly)
- Deterministic faker seeding (TEST_SEED=12345)

**Phase 2 - Anti-Pattern Removal:**
- Removed 17 `test.skip()` instances
- Removed 50 `.or()` fallback selectors
- Removed 300+ `waitForTimeout()` arbitrary delays

**Phase 3 - Realistic Data:**
- Integrated faker.js with deterministic seeding
- Created 12 realistic data generators
- Replaced hardcoded test data

**Phase 4 - Quality Gates:**
- Pre-commit hooks preventing anti-patterns
- ESLint rules for test files
- CI/CD enforcement

**Phase 5 - Documentation:**
- Comprehensive testing standards (this document)
- Updated audit with completion metrics

### Benefits Achieved

✅ **Reliability**: Tests fail when they should (no retries masking issues)  
✅ **Speed**: ~30% faster execution (state-based waits vs fixed timeouts)  
✅ **Maintainability**: Quality gates prevent regression  
✅ **Debugging**: Deterministic failures with realistic data

---

## Forbidden Patterns

These patterns are **strictly forbidden** and will be caught by quality gates:

### 1. `test.skip()` - Conditional Test Skipping

**Why it's forbidden:**
- Hides missing configuration or infrastructure
- Tests silently pass when they should fail
- Reduces test coverage without visibility

**What to use instead:**
Use strict assertions that fail if prerequisites are missing.

**Examples:**

❌ **WRONG** - Hides missing OAuth configuration:
```typescript
if (!OAUTH_PROVIDERS.google.enabled) {
  test.skip('Google OAuth not configured');
}

test('Google OAuth login', async ({ page }) => {
  // Test code that never runs
});
```

✅ **CORRECT** - Fails explicitly if not configured:
```typescript
test('Google OAuth login', async ({ page }) => {
  // Force proper setup - test fails if OAuth not configured
  expect(OAUTH_PROVIDERS.google.enabled).toBe(true);
  
  // Actual test code
  await page.goto('/login');
  await page.click('[data-testid="google-login"]');
  // ... rest of test
});
```

---

### 2. `.or()` - Fallback Selector Chains

**Why it's forbidden:**
- Hides incorrect test-ids and selector issues
- Masks UI changes that should fail tests
- Makes it impossible to know which selector is actually used

**What to use instead:**
Single, correct selector with proper test-id. If selector is wrong, test should fail immediately.

**Examples:**

❌ **WRONG** - 4-way fallback hiding complete uncertainty:
```typescript
const jsonInput = page
  .locator('.monaco-editor textarea')
  .or(page.locator('textarea[placeholder*="JSON"]'))
  .or(page.locator('[data-testid="json-input"]'))
  .or(page.locator('textarea'))
  .first();
```

❌ **WRONG** - Hiding button label changes:
```typescript
const googleButton = page
  .locator('[data-testid="google-signup"]')
  .or(page.locator('text="Continue with Google"'));
```

✅ **CORRECT** - Single, correct selector:
```typescript
// If test-id exists, use it
const jsonInput = page.locator('[data-testid="json-input"]');

// If no test-id, add one to the component
// Then use the single selector
const googleButton = page.locator('[data-testid="google-signup"]');
```

**Adding test-ids to components:**
```tsx
// Add to your React component
<button data-testid="google-signup">
  Continue with Google
</button>
```

---

### 3. `waitForTimeout()` - Arbitrary Delays

**Why it's forbidden:**
- Creates flaky tests (too short = fails, too long = slow)
- Masks timing issues instead of fixing them
- Slows down test execution significantly

**What to use instead:**
State-based waits that complete as soon as the condition is met.

**Examples:**

❌ **WRONG** - Arbitrary time guess:
```typescript
await page.click('[data-testid="save-button"]');
await page.waitForTimeout(2000); // Hope 2s is enough
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
```

❌ **WRONG** - "Wait for React hydration":
```typescript
await page.goto('/dashboard');
await page.waitForTimeout(3000); // Guessing hydration time
```

✅ **CORRECT** - Wait for actual state (network idle):
```typescript
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```

✅ **CORRECT** - Wait for element visibility:
```typescript
await page.click('[data-testid="save-button"]');
// Waits until element appears (up to expect timeout)
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
```

✅ **CORRECT** - Wait for element to be actionable:
```typescript
const button = page.locator('[data-testid="submit"]');
await button.waitFor({ state: 'visible' });
await expect(button).toBeEnabled();
await button.click();
```

---

### 4. `test.only()` - Focused Test Execution

**Why it's forbidden:**
- Debugging artifact that should never be committed
- Reduces CI test coverage silently
- Easy to forget and commit accidentally

**What to use instead:**
Use Playwright's command-line filtering for development.

**Examples:**

❌ **WRONG** - Debugging artifact:
```typescript
test.only('debugging this specific test', async ({ page }) => {
  // ...
});
```

✅ **CORRECT** - Use command-line filtering:
```bash
# Run single test file
npx playwright test auth-flows.spec.ts

# Run tests matching pattern
npx playwright test --grep "login"

# Run single test by line number
npx playwright test auth-flows.spec.ts:45
```

---

## Required Patterns

These patterns are **mandatory** for all tests:

### 1. Deterministic Test Data with Faker

**Why it's required:**
- Reproducible test failures
- Consistent results across runs and developers
- Realistic data that tests edge cases

**How to use:**

```typescript
import { test, expect } from '../../utils/base-test';

test('my test', async ({ page, dataGenerator }) => {
  // Generate realistic, deterministic user
  const user = dataGenerator.generateRealisticUser();
  
  // Result is always the same because faker is seeded
  console.log(user.email); // Always same email for same seed
  
  // Use in test
  await page.fill('[data-testid="email"]', user.email);
});
```

**Available generators:**
```typescript
// Users
dataGenerator.generateRealisticUser()      // Single user
dataGenerator.generateRealisticUsers(10)   // Array of users

// Products
dataGenerator.generateRealisticProduct()   // Single product
dataGenerator.generateRealisticProducts(5) // Array of products

// API Responses
dataGenerator.generateRealisticAPIResponse()

// Complex structures
dataGenerator.generateRealisticDeepNesting()
dataGenerator.generateRealisticMixedTypes()
```

**Seed configuration:**
The faker seed is set in [`tests/utils/faker-config.ts`](tests/utils/faker-config.ts):
```typescript
export const TEST_SEED = 12345;
```

---

### 2. State-Based Waits

**Required for:**
- All page navigation
- All element interactions
- All async operations

**Common patterns:**

**Wait for network idle:**
```typescript
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```

**Wait for element visibility:**
```typescript
const element = page.locator('[data-testid="my-element"]');
await element.waitFor({ state: 'visible' });
```

**Wait for element to be enabled:**
```typescript
const button = page.locator('[data-testid="submit"]');
await expect(button).toBeEnabled();
```

**Wait for custom condition:**
```typescript
// Wait for specific text to appear
await page.waitForSelector('text="Processing complete"');

// Wait for element count
await expect(page.locator('.item')).toHaveCount(5);

// Wait for URL change
await page.waitForURL('**/dashboard');
```

---

### 3. Strict Assertions (Validate Before Interaction)

**Why it's required:**
- Tests fail immediately when something is wrong
- Clear error messages
- No silent failures

**Pattern:**

```typescript
// ✅ CORRECT - Validate before every interaction
const saveButton = page.locator('[data-testid="save-button"]');

// 1. Assert element exists and is visible
await expect(saveButton).toBeVisible();

// 2. Assert element is enabled (not disabled)
await expect(saveButton).toBeEnabled();

// 3. Now safe to interact
await saveButton.click();

// 4. Validate result
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
```

---

## Configuration Standards

### Playwright Configuration

Our strict configuration in [`playwright.config.ts`](playwright.config.ts):

```typescript
{
  // No retries - tests must pass first time
  retries: 0,
  
  // Prevent test.only() in all environments
  forbidOnly: true,
  
  // Fail fast - 30s total timeout
  timeout: 30_000,
  
  // Fail fast - 5s assertion timeout
  expect: {
    timeout: 5_000
  },
  
  // Action timeout - 15s
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000
  }
}
```

**Why these values:**
- `retries: 0` - Forces us to fix flaky tests, not mask them
- `forbidOnly: true` - Prevents debugging artifacts in commits
- `timeout: 30_000` - Fast feedback, forces efficient tests
- `expect.timeout: 5_000` - Quick assertions, fail fast

---

### Faker Configuration

Deterministic seeding in [`tests/utils/faker-config.ts`](tests/utils/faker-config.ts):

```typescript
import { faker } from '@faker-js/faker';

export const TEST_SEED = 12345;

export function initializeFaker(seed: number = TEST_SEED) {
  faker.seed(seed);
  // All faker calls now produce deterministic results
}
```

Called in [`tests/utils/global-setup.ts`](tests/utils/global-setup.ts):
```typescript
import { initializeFaker } from './faker-config';

export default function globalSetup() {
  initializeFaker();
}
```

---

### Quality Gates Summary

**Pre-commit Hook:** [`scripts/pre-commit-test-check.sh`](scripts/pre-commit-test-check.sh)
- Checks staged test files for anti-patterns
- Blocks commit if violations found
- Runs in <1 second

**ESLint Rules:** [`eslint.config.tests.mjs`](eslint.config.tests.mjs)
- IDE integration for real-time feedback
- Same patterns as pre-commit hook
- Enforced in CI/CD

**GitHub Actions:** [`.github/workflows/test-quality.yml`](.github/workflows/test-quality.yml)
- Runs on all PRs
- Prevents merging with violations
- Provides clear error messages

---

## Test Data Patterns

### Realistic User Data

```typescript
const user = dataGenerator.generateRealisticUser();

// Example output (deterministic with seed 12345):
{
  "id": "a0b48eea-8c0d-445a-8238-2f260e5e78e2",
  "name": "Samuel DuBuque",
  "email": "samuel.dubuque@example.com",
  "username": "samueldubuque",
  "avatar": "https://cloudflare-ipfs.com/ipfs/.../avatar.jpg",
  "phone": "610-836-0294",
  "birthdate": "1990-02-14",
  "address": {
    "street": "5820 Dulce Heights",
    "city": "Derickhaven",
    "state": "Mississippi",
    "country": "United States",
    "zipCode": "04878"
  },
  "company": {
    "name": "Legros Group",
    "catchPhrase": "Diverse demand-driven frame"
  }
}
```

### Realistic Product Data

```typescript
const product = dataGenerator.generateRealisticProduct();

// Example output:
{
  "id": "b1c59ffa-9d1e-556b-9349-3g371f6f89f3",
  "name": "Ergonomic Steel Keyboard",
  "description": "The beautiful range of Apple Naturalé...",
  "price": 299.99,
  "category": "Electronics",
  "inStock": true,
  "rating": 4.5,
  "reviews": [
    {
      "author": "Jane Smith",
      "rating": 5,
      "comment": "Great product!",
      "date": "2024-01-15"
    }
  ]
}
```

### Realistic API Response

```typescript
const apiResponse = dataGenerator.generateRealisticAPIResponse();

// Example output:
{
  "status": "success",
  "data": {
    "items": [...], // Array of realistic items
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 157,
      "totalPages": 8
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Nested JSON Structures

```typescript
const nested = dataGenerator.generateRealisticDeepNesting();

// Example output (5 levels deep):
{
  "level1": {
    "level2": {
      "level3": {
        "level4": {
          "level5": {
            "value": "deep value"
          }
        }
      }
    }
  }
}
```

---

## Quick Reference

### Common Testing Needs

| Need | Solution | Example |
|------|----------|---------|
| **Wait for network** | `waitUntil: 'networkidle'` | `await page.goto('/page', { waitUntil: 'networkidle' })` |
| **Wait for element** | `waitFor({ state })` | `await element.waitFor({ state: 'visible' })` |
| **Wait for text** | `waitForSelector('text=...')` | `await page.waitForSelector('text="Success"')` |
| **Validate before click** | `expect().toBeVisible()` + `toBeEnabled()` | `await expect(btn).toBeVisible(); await btn.click()` |
| **Generate user** | `dataGenerator.generateRealisticUser()` | `const user = dataGenerator.generateRealisticUser()` |
| **Generate product** | `dataGenerator.generateRealisticProduct()` | `const product = dataGenerator.generateRealisticProduct()` |
| **Custom schema** | `generateFromCustomSchema(schema)` | `const data = dataGenerator.generateFromCustomSchema(mySchema)` |

### Running Tests

```bash
# Run all tests
npx playwright test

# Run single file
npx playwright test auth-flows.spec.ts

# Run tests matching pattern
npx playwright test --grep "login"

# Run in UI mode (debugging)
npx playwright test --ui

# Run with specific browser
npx playwright test --project=chromium

# Check for anti-patterns
npm run test:quality-check

# Lint test files
npm run lint:tests
```

---

## Troubleshooting

### "Element not found" Errors

**Problem:**
```
Error: locator.click: Target closed
```

**Solutions:**

1. **Add explicit wait:**
```typescript
const element = page.locator('[data-testid="my-element"]');
await element.waitFor({ state: 'visible' });
await element.click();
```

2. **Check selector is correct:**
```typescript
// Debug: Print all matching elements
const count = await page.locator('[data-testid="my-element"]').count();
console.log(`Found ${count} elements`);

// If count is 0, selector is wrong
```

3. **Wait for page to be ready:**
```typescript
await page.goto('/page', { waitUntil: 'networkidle' });
```

---

### Flaky Tests

**Problem:**
Test passes sometimes, fails other times.

**Solutions:**

1. **Check for `waitForTimeout()`:**
```bash
grep -r "waitForTimeout" tests/
```
Replace all with state-based waits.

2. **Add assertions before interactions:**
```typescript
// ✅ CORRECT
await expect(button).toBeVisible();
await expect(button).toBeEnabled();
await button.click();
```

3. **Use `waitUntil: 'networkidle'`:**
```typescript
await page.goto('/page', { waitUntil: 'networkidle' });
```

4. **Check for race conditions:**
```typescript
// ❌ WRONG - Race condition
await page.click('[data-testid="save"]');
await page.click('[data-testid="next"]'); // Might click before save completes

// ✅ CORRECT - Wait for save to complete
await page.click('[data-testid="save"]');
await expect(page.locator('[data-testid="success"]')).toBeVisible();
await page.click('[data-testid="next"]');
```

---

### Pre-commit Hook Failures

**Problem:**
```
❌ ERROR: waitForTimeout() found in staged files
```

**Solutions:**

1. **Fix the violation:**
Replace `waitForTimeout()` with state-based wait.

2. **Verify fix:**
```bash
npm run test:quality-check
```

3. **If you see false positive:**
```bash
# Check what's actually staged
git diff --cached | grep "waitForTimeout"

# If legitimate use case (rare), discuss with team
```

4. **Emergency bypass** (only if approved by team lead):
```bash
git commit --no-verify
```

---

### CI vs Local Test Differences

**Problem:**
Tests pass locally but fail in CI.

**Possible causes:**

1. **Different data due to non-deterministic faker:**
   - **Check:** Is faker seed configured in global-setup?
   - **Fix:** Ensure `initializeFaker()` is called

2. **Timing differences (CI slower):**
   - **Check:** Are you using `waitForTimeout()`?
   - **Fix:** Replace with state-based waits

3. **Environment variables:**
   - **Check:** Are env vars set in CI?
   - **Fix:** Add to GitHub Actions secrets

4. **Browser differences:**
   - **Check:** Does test specify browser?
   - **Fix:** Run same browser locally: `npx playwright test --project=chromium`

---

### "test.only() detected" Error

**Problem:**
```
❌ ERROR: test.only() detected in commit
```

**Solution:**

1. **Remove test.only():**
```typescript
// Change this:
test.only('my test', async ({ page }) => {

// To this:
test('my test', async ({ page }) => {
```

2. **Use command-line filtering instead:**
```bash
npx playwright test --grep "my test"
```

---

## Additional Resources

- **Faker.js Documentation:** https://fakerjs.dev/
- **Playwright Best Practices:** https://playwright.dev/docs/best-practices
- **JSON Schema Faker:** https://json-schema-faker.js.org/
- **Testing Infrastructure Audit:** [`TESTING_INFRASTRUCTURE_AUDIT.md`](TESTING_INFRASTRUCTURE_AUDIT.md)
- **Quality Gates Setup:** [`QUALITY_GATES_SETUP.md`](QUALITY_GATES_SETUP.md)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-18 | Initial release after Phase 5 completion |

---

**Status:** ✅ Active and Enforced  
**Compliance:** Mandatory for all test code  
**Enforcement:** Pre-commit hooks, ESLint, CI/CD
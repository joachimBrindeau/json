# Comprehensive Test Utilities

This directory contains comprehensive test utilities designed to eliminate duplication across the JSON Share test suite and provide standardized, reusable testing patterns.

## Overview

The test utilities are organized into four main categories:

1. **Test Factories** (`test-factories.ts`) - Generate consistent test data
2. **Common Assertions** (`common-assertions.ts`) - Standardized verification patterns
3. **Setup Helpers** (`setup-helpers.ts`) - Test environment setup and teardown
4. **Page Helpers** (`page-helpers.ts`) - Common UI interactions and navigation

## Usage

All utilities are automatically available in tests through the extended base test:

```typescript
import { test, expect } from '../utils/base-test';

test('example test', async ({ 
  testFactories, 
  commonAssertions, 
  setupHelpers, 
  pageHelpers 
}) => {
  // Use utilities directly
  const testData = testFactories.createTestDocument();
  await setupHelpers.setupAnonymousTest();
  await pageHelpers.navigateToViewer();
  await commonAssertions.assertJsonVisible();
});
```

## Test Factories (`TestFactories`)

Creates consistent test data with factory patterns to eliminate hardcoded test data duplication.

### Core Methods

#### User Creation
```typescript
// Create unique test user
const user = testFactories.createTestUser({
  email: 'custom@example.com',
  role: 'admin'
});

// Create multiple users
const users = testFactories.createTestUsers(5);

// Use predefined fixture user
const fixtureUser = testFactories.createFixtureUser('regular');
```

#### Document Creation
```typescript
// Create test document with various sizes
const smallDoc = testFactories.createTestDocument({ size: 'small' });
const largeDoc = testFactories.createTestDocument({ size: 'large' });

// Create multiple documents
const docs = testFactories.createTestDocuments(10, { 
  isPublic: true,
  category: 'api'
});

// Create documents for specific scenarios
const shareData = testFactories.createScenarioData('sharing');
const libraryData = testFactories.createScenarioData('library');
```

#### Performance Data
```typescript
// Create large datasets for performance testing
const performanceData = testFactories.createLargeTestData({
  objectCount: 1000,
  arraySize: 100,
  nestingDepth: 5,
  includeLargeStrings: true
});
```

### Test Scenarios
Pre-configured data for common test scenarios:

```typescript
// User registration flow
const registrationData = TestScenarios.createRegistrationFlow();

// Document sharing workflow  
const sharingData = TestScenarios.createSharingWorkflow();

// Library browsing
const libraryData = TestScenarios.createLibraryScenario();

// Performance testing
const perfData = TestScenarios.createPerformanceScenario('large');
```

## Common Assertions (`CommonAssertions`)

Standardized assertion patterns that verify application behavior consistently across tests.

### JSON Display Assertions
```typescript
// Basic JSON visibility check
await commonAssertions.assertJsonVisible();

// Detailed JSON verification
await commonAssertions.assertJsonVisible({
  expectedNodeCount: 50,
  expectedObjectCount: 10,
  viewMode: 'tree',
  checkForErrors: true
});
```

### Authentication Assertions
```typescript
// Verify user is authenticated
await commonAssertions.assertAuthenticated({
  expectedEmail: 'user@example.com',
  expectedName: 'Test User',
  checkUserMenu: true
});

// Verify anonymous state
await commonAssertions.assertAnonymous();
```

### Document and Library Assertions
```typescript
// Verify document save
await commonAssertions.assertDocumentSaved({
  expectedTitle: 'My Document',
  expectedId: 'doc-123',
  checkInLibrary: true
});

// Verify share link functionality
await commonAssertions.assertShareLinkWorks(shareUrl, {
  checkAnonymousAccess: true,
  expectedTitle: 'Shared Doc',
  checkEmbedding: true
});

// Verify library contents
await commonAssertions.assertLibraryContains([
  { title: 'Doc 1', isPublic: true },
  { title: 'Doc 2', isPublic: false }
], { 
  exactMatch: true,
  libraryType: 'public'
});
```

### Search and Modal Assertions
```typescript
// Test search functionality
await commonAssertions.assertSearchWorks('search term', ['Expected Result']);

// Verify modal behavior
await commonAssertions.assertModalOpen('save', {
  expectedTitle: 'Save Document',
  checkCloseButton: true
});

// Check error states
await commonAssertions.assertErrorDisplayed('network', {
  expectedMessage: 'Connection failed',
  dismissible: true
});
```

## Setup Helpers (`SetupHelpers`)

Standardized setup and teardown patterns for different test environments.

### Environment Setup

#### Authenticated Tests
```typescript
// Basic authenticated setup
const userData = await setupHelpers.setupAuthenticatedTest({
  userType: 'regular',
  navigateTo: '/library',
  createTestData: true,
  testDocuments: 5
});
```

#### Anonymous Tests
```typescript
// Anonymous user setup
const sessionData = await setupHelpers.setupAnonymousTest({
  navigateTo: '/',
  waitForReady: true,
  createSessionData: true
});
```

#### Performance Tests
```typescript
// Large data performance setup
const perfData = await setupHelpers.setupLargeDataTest({
  dataSize: 'extreme',
  userType: 'developer',
  preloadData: true,
  monitorPerformance: true
});
```

#### Library Tests
```typescript
// Library with predefined content
const libraryData = await setupHelpers.setupLibraryTest({
  publicDocuments: 10,
  privateDocuments: 5,
  categories: ['api', 'config', 'sample'],
  tags: ['json', 'test', 'demo']
});
```

### Cleanup and Monitoring
```typescript
// Comprehensive cleanup
await setupHelpers.cleanupTestData({
  clearStorage: true,
  logout: true,
  documentIds: ['doc1', 'doc2']
});

// Error monitoring
const errorMonitor = await setupHelpers.setupErrorMonitoring();
if (errorMonitor.hasErrors()) {
  console.log(errorMonitor.getErrors());
}

// Performance monitoring
const perfMonitor = await setupHelpers.setupPerformanceMonitoring();
const metrics = await perfMonitor.getMetrics();

// Network interception for error testing
const networkControl = await setupHelpers.setupNetworkInterception({
  blockPatterns: ['**/api/**'],
  slowNetwork: true
});
```

### Utility Functions
```typescript
// Wait for application readiness
await setupHelpers.waitForAppReady();

// Quick setup functions
await quickSetupAnonymous(page, authHelper);
await quickSetupAuthenticated(page, context, authHelper, apiHelper);
await quickCleanup(page, context, authHelper, { documentIds: ['doc1'] });
```

## Page Helpers (`PageHelpers`)

Common UI interaction patterns and navigation utilities.

### Navigation
```typescript
// Standard navigation
await pageHelpers.navigateToHome();
await pageHelpers.navigateToViewer('doc-id');
await pageHelpers.navigateToLibrary();
await pageHelpers.navigateToPublicLibrary();
await pageHelpers.navigateToProfile();
await pageHelpers.navigateToShare('share-id');
await pageHelpers.navigateToEmbed('share-id');
```

### JSON Interactions
```typescript
// File upload
await pageHelpers.uploadJsonFile('./test-data.json');

// Direct text input
await pageHelpers.inputJsonText({ key: 'value' });
await pageHelpers.inputJsonText('{"key": "value"}');

// View mode switching
await pageHelpers.switchViewMode('tree');
await pageHelpers.switchViewMode('raw');
await pageHelpers.switchViewMode('formatted');

// Search and navigation
await pageHelpers.searchJsonContent('search term');
await pageHelpers.toggleJsonNode('data.users[0]');

// Content actions
await pageHelpers.copyJsonContent();
const download = await pageHelpers.downloadJson();
```

### Modal Interactions
```typescript
// Open modals
await pageHelpers.openLoginModal();
await pageHelpers.openShareModal();
await pageHelpers.openSaveModal();

// Close any modal
await pageHelpers.closeModal();
```

### Form Handling
```typescript
// Fill document form
await pageHelpers.fillDocumentForm({
  title: 'Document Title',
  description: 'Document description',
  tags: ['tag1', 'tag2'],
  category: 'api',
  isPublic: true
});

// Submit form
await pageHelpers.submitForm();
```

### Library Operations
```typescript
// Library filtering and search
await pageHelpers.filterByCategory('api');
await pageHelpers.filterByTag('json');
await pageHelpers.searchLibrary('search term');

// Item selection
await pageHelpers.selectLibraryItem('Document Title');
```

### Utility Functions
```typescript
// Wait for operations
await pageHelpers.waitForPageLoad();
await pageHelpers.waitForJsonProcessing();

// Screenshots and notifications
await pageHelpers.takeScreenshot('test-step');
await pageHelpers.waitForNotification('Save successful');

// Element interaction
await pageHelpers.scrollToElement('.target-element');

// Standalone utility functions
await quickNavigate(page, '/viewer');
await quickInputJson(page, testData);
await handleModal(page, 'open', 'share');
await quickSubmitForm(page, formData);
```

## Best Practices

### 1. Use Factories for Test Data
Instead of hardcoding test data:
```typescript
// ❌ Don't do this
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

// ✅ Use factories
const testUser = testFactories.createTestUser({
  role: 'admin'
});
```

### 2. Use Setup Helpers for Environment
Instead of manual setup:
```typescript
// ❌ Don't do this  
await authHelper.login('regular');
await page.goto('/library');
await page.waitForLoadState('networkidle');

// ✅ Use setup helpers
await setupHelpers.setupAuthenticatedTest({
  userType: 'regular',
  navigateTo: '/library'
});
```

### 3. Use Common Assertions
Instead of repeated assertion patterns:
```typescript
// ❌ Don't do this
await expect(page.locator('.json-viewer')).toBeVisible();
await expect(page.locator('.json-error')).toHaveCount(0);
const nodes = await page.locator('.tree-node').count();
expect(nodes).toBeGreaterThan(0);

// ✅ Use common assertions
await commonAssertions.assertJsonVisible({
  expectedNodeCount: 10,
  checkForErrors: true
});
```

### 4. Use Page Helpers for Interactions
Instead of low-level page interactions:
```typescript
// ❌ Don't do this
await page.locator('input[type="file"]').setInputFiles('test.json');
await page.waitForSelector('.json-viewer');
await page.locator('button:has-text("Tree")').click();

// ✅ Use page helpers
await pageHelpers.uploadJsonFile('test.json');
await pageHelpers.switchViewMode('tree');
```

## Migration Guide

To migrate existing tests to use the new utilities:

1. **Replace hardcoded test data** with factory methods
2. **Replace manual setup/teardown** with setup helpers
3. **Replace custom assertions** with common assertions
4. **Replace page interactions** with page helpers
5. **Update test structure** to use the new fixtures

See `tests/examples/utility-usage-example.spec.ts` for comprehensive examples of how to use all utilities together.

## Benefits

Using these utilities provides:

- **Reduced Duplication**: Common patterns standardized across tests
- **Improved Maintainability**: Changes in one place affect all tests
- **Better Readability**: Tests focus on business logic, not setup
- **Consistent Data**: Factory-generated data ensures test reliability  
- **Faster Development**: Pre-built patterns speed up test creation
- **Better Error Handling**: Standardized error scenarios and recovery
- **Performance Testing**: Built-in large data generation and monitoring
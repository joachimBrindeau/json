# E2E Testing Infrastructure

This directory contains the complete Playwright E2E testing infrastructure for the JSON Viewer application.

## Directory Structure

```
tests/
├── e2e/                    # Test files organized by user type
│   ├── anonymous/          # Tests for anonymous users
│   ├── authenticated/      # Tests for logged-in users
│   ├── developer/          # API and integration tests
│   ├── advanced/           # Power user features tests
│   └── community/          # Content creator tests
├── fixtures/               # Test data and JSON samples
│   ├── users.ts           # User fixtures and permissions
│   └── json-samples.ts    # Various JSON samples for testing
├── page-objects/          # Page Object Models (POM)
│   ├── base-page.ts       # Base page with common utilities
│   ├── main-layout-page.ts # Main layout and navigation
│   ├── json-viewer-page.ts # JSON viewer functionality
│   └── library-page.ts    # Library management
├── utils/                 # Test utilities and helpers
│   ├── base-test.ts       # Extended test with custom fixtures
│   ├── auth-helper.ts     # Authentication utilities
│   ├── api-helper.ts      # API testing utilities
│   ├── screenshot-helper.ts # Screenshot and visual testing
│   ├── data-generator.ts  # Test data generators
│   ├── global-setup.ts    # Global test setup
│   └── global-teardown.ts # Global test cleanup
└── test-results/          # Test artifacts (screenshots, videos, reports)
    └── screenshots/
```

## Available Test Scripts

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### Test Categories

```bash
# Test specific user groups
npm run test:e2e:anonymous      # Anonymous user tests
npm run test:e2e:authenticated  # Authenticated user tests
npm run test:e2e:developer      # Developer/API tests
npm run test:e2e:advanced       # Advanced features
npm run test:e2e:community      # Community features

# Smoke tests (critical paths only)
npm run test:e2e:smoke
```

### CI/CD Integration

```bash
# CI-optimized test run
npm run test:e2e:ci

# View test reports
npm run test:report
```

### Development Tools

```bash
# Install browsers
npm run test:install

# Install browsers with system dependencies
npm run test:install-deps

# Generate test code automatically
npm run test:codegen
```

## Test Configuration

The tests are configured via `playwright.config.ts` with:

- **Multi-browser support**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Automatic server startup**: Starts dev server before tests
- **Parallel execution**: Tests run in parallel for speed
- **Retry logic**: Automatic retries on CI
- **Visual testing**: Screenshots and video recording
- **Multiple reporters**: HTML, JUnit, JSON outputs

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';

test.describe('Feature Name', () => {
  let viewerPage: JsonViewerPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    await viewerPage.navigateToViewer();
  });

  test('should do something', async ({ dataGenerator }) => {
    const testJson = dataGenerator.generateSimpleJSON();
    await viewerPage.inputJSON(JSON.stringify(testJson));
    
    expect(await viewerPage.hasJSONErrors()).toBe(false);
  });
});
```

### Using Custom Fixtures

The base test extends Playwright with custom fixtures:

- **authHelper**: Handle user authentication
- **apiHelper**: Make API calls and assertions
- **screenshotHelper**: Capture screenshots and visual comparisons
- **dataGenerator**: Generate test data dynamically

### Test Data

Use the `JSON_SAMPLES` fixture for consistent test data:

```typescript
import { JSON_SAMPLES } from '../../fixtures/json-samples';

// Use predefined samples
const testData = JSON_SAMPLES.simple.content;

// Generate dynamic data
const largeData = JSON_SAMPLES.largeArray.generateContent(1000);
```

### Authentication Testing

```typescript
test.beforeEach(async ({ authHelper }) => {
  await authHelper.login('regular'); // or 'admin', 'developer', etc.
});

test.afterEach(async ({ authHelper }) => {
  await authHelper.logout();
});
```

## Test Categories by User Type

### Anonymous Users (`tests/e2e/anonymous/`)
- Basic JSON viewing functionality
- File upload and parsing
- View mode switching
- Error handling
- Performance with large files

### Authenticated Users (`tests/e2e/authenticated/`)
- Library management
- JSON saving and sharing
- User profile management
- Publishing to public library

### Developers (`tests/e2e/developer/`)
- API testing and integration
- Rate limiting validation
- Error handling
- Performance testing
- Browser extension simulation

### Advanced Users (`tests/e2e/advanced/`)
- Complex JSON manipulation
- Performance optimization features
- Advanced search and filtering
- Bulk operations

### Community (`tests/e2e/community/`)
- Public library interactions
- Content sharing and discovery
- Community features

## Best Practices

1. **Use Page Objects**: Encapsulate page interactions in page objects
2. **DRY Principle**: Reuse helpers and fixtures
3. **Descriptive Tests**: Clear test names and descriptions
4. **Independent Tests**: Each test should be able to run independently
5. **Clean State**: Use setup/teardown to ensure clean test state
6. **Error Handling**: Test both success and failure scenarios
7. **Performance Aware**: Consider test execution time
8. **Visual Testing**: Use screenshots for UI validation

## Debugging Tests

1. **Use UI Mode**: `npm run test:e2e:ui` for interactive debugging
2. **Debug Mode**: `npm run test:e2e:debug` for step-by-step execution
3. **Screenshots**: Automatic screenshots on failure
4. **Videos**: Test execution videos for failed tests
5. **Traces**: Detailed execution traces available

## CI/CD Integration

Tests are configured for CI environments with:
- Headless execution
- JUnit reporting
- Parallel execution control
- Retry strategies
- Artifact collection

## Extending the Framework

To add new test categories:

1. Create new directory under `tests/e2e/`
2. Add corresponding npm script in `package.json`
3. Create page objects for new features
4. Add test fixtures as needed
5. Update this documentation

## Performance Considerations

- Tests run in parallel by default
- Use `test.slow()` for performance-heavy tests
- Consider test data size and complexity
- Monitor test execution time and optimize as needed
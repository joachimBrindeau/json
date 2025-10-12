# Authenticated User E2E Tests

This directory contains comprehensive E2E tests for all 18 authenticated user stories from the USER_STORIES.md file. The tests are organized by functionality and follow the DRY, KISS, and YAGNI principles.

## Test Files Overview

### 1. `auth-flows.spec.ts` - Authentication Flow Tests
Covers user stories 1-2 and 14:
- ✅ Sign up using email/password, GitHub, or Google OAuth
- ✅ Sign in using multiple authentication methods
- ✅ Sign out of account
- Edge cases: validation errors, network failures, session management

### 2. `library-management.spec.ts` - Library Management Tests
Covers user stories 3-5:
- ✅ Save JSON documents to personal library
- ✅ View personal library with all saved JSONs
- ✅ Search, sort, and filter library by title, date, size, criteria
- Performance testing with large datasets
- Pagination and view modes

### 3. `document-management.spec.ts` - Document Management Tests
Covers user stories 6-8:
- ✅ Edit document titles and metadata
- ✅ Delete documents from library
- ✅ Load documents from library into editor
- Bulk operations and concurrent editing
- Version history and conflict resolution

### 4. `publishing.spec.ts` - Publishing and Analytics Tests
Covers user stories 9-11 and 17-18:
- ✅ Publish JSON documents to public library
- ✅ Unpublish documents to make private again
- ✅ Add titles, descriptions, categories, tags when publishing
- ✅ View analytics for published documents (view counts)
- ✅ Manage visibility of shared documents
- Rich metadata and content moderation

### 5. `profile-account.spec.ts` - Profile and Account Management Tests
Covers user stories 12-13 and 15:
- ✅ View profile with usage statistics
- ✅ Export all data as JSON
- ✅ Delete account permanently
- Profile settings and preferences
- Privacy and notification settings

### 6. `session-migration.spec.ts` - Session and Data Migration Tests
Covers user story 16:
- ✅ Migrate anonymous data to account upon first login
- Session security and management
- Cross-tab session handling
- Data preservation and integrity

### 7. `user-library.spec.ts` - Integration Tests
- End-to-end workflow testing
- Cross-feature interaction testing
- Session persistence validation

## Test Architecture

### Page Objects Used
- `JsonViewerPage` - JSON viewer and editor interactions
- `LibraryPage` - Personal library management
- `MainLayoutPage` - Navigation and layout interactions

### Test Fixtures Used
- `TEST_USERS` - Pre-defined test user accounts
- `JSON_SAMPLES` - Variety of JSON test data
- `OAUTH_PROVIDERS` - OAuth configuration for testing

### Custom Helpers Used
- `authHelper` - Authentication utilities
- `apiHelper` - Direct API interaction for setup
- `screenshotHelper` - Visual testing support
- `dataGenerator` - Dynamic test data generation

## Running the Tests

### All Authenticated Tests
```bash
npm run test:e2e:authenticated
```

### Individual Test Files
```bash
# Authentication flows
npx playwright test tests/e2e/authenticated/auth-flows.spec.ts

# Library management
npx playwright test tests/e2e/authenticated/library-management.spec.ts

# Document management
npx playwright test tests/e2e/authenticated/document-management.spec.ts

# Publishing and analytics
npx playwright test tests/e2e/authenticated/publishing.spec.ts

# Profile and account
npx playwright test tests/e2e/authenticated/profile-account.spec.ts

# Session and migration
npx playwright test tests/e2e/authenticated/session-migration.spec.ts

# Integration tests
npx playwright test tests/e2e/authenticated/user-library.spec.ts
```

### Debug Mode
```bash
npx playwright test tests/e2e/authenticated --debug
```

### UI Mode (Interactive)
```bash
npx playwright test tests/e2e/authenticated --ui
```

## Test Data Management

### User Accounts
Tests use predefined test users from `fixtures/users.ts`:
- `regular` - Standard user account
- `admin` - Administrator account
- `powerUser` - User with enhanced permissions
- `temp1`, `temp2` - Temporary users for isolation

### JSON Test Data
Rich variety of JSON samples from `fixtures/json-samples.ts`:
- `simple` - Basic JSON structures
- `nested` - Complex nested objects
- `largeArray` - Performance testing data
- `apiResponse` - Real-world API response structure
- `configuration` - Application config examples
- `analytics` - Dashboard and metrics data

### Dynamic Data Generation
The `DataGenerator` utility creates:
- User profiles with realistic data
- Large JSON structures for performance testing
- Complex nested data with configurable depth
- Edge cases and malformed JSON

## Test Categories

### Functional Tests
- Core feature functionality
- User interaction flows
- Data persistence
- Input validation

### Integration Tests
- Cross-feature interactions
- End-to-end workflows
- Session management
- Data migration

### Edge Case Tests
- Error handling
- Network failures
- Large data sets
- Concurrent operations
- Security scenarios

### Performance Tests
- Large file handling
- Bulk operations
- Search and filtering
- Migration operations

## Best Practices Followed

### DRY (Don't Repeat Yourself)
- Shared page objects and utilities
- Common test setup and teardown
- Reusable test data and fixtures

### KISS (Keep It Simple, Stupid)
- Clear test names and descriptions
- Simple, focused test cases
- Minimal test dependencies

### YAGNI (You Aren't Gonna Need It)
- Tests only what's required by user stories
- No over-engineering of test infrastructure
- Focused on current functionality

## Authentication Strategy

### Test Isolation
- Each test file manages its own authentication
- Clean login/logout in setup/teardown
- User account isolation prevents cross-test interference

### Multiple Auth Methods
- Email/password authentication
- OAuth providers (Google, GitHub) when enabled
- Session persistence testing
- Security validation

### Session Management
- Cross-tab session handling
- Session timeout scenarios
- Re-authentication for sensitive operations
- Session data migration

## Error Handling

### Network Failures
- API request failures
- Timeout scenarios
- Retry mechanisms

### Data Issues
- Malformed JSON handling
- Large file processing
- Concurrent access conflicts

### UI Interactions
- Element not found scenarios
- Loading state handling
- Modal and overlay interactions

## Assertions and Validations

### UI State Validation
- Element visibility and content
- Navigation state
- Form validation messages

### Data Integrity
- JSON structure preservation
- Metadata accuracy
- Search result correctness

### Performance Expectations
- Load time thresholds
- Operation completion timeouts
- Resource usage monitoring

## Maintenance

### Adding New Tests
1. Identify the user story being tested
2. Choose appropriate test file based on functionality
3. Use existing page objects and utilities
4. Follow established patterns for setup/teardown
5. Add descriptive test names and comments

### Updating Tests
- Keep tests aligned with UI changes
- Update selectors when HTML structure changes
- Maintain test data relevance
- Review performance thresholds periodically

### Debugging Failures
- Use `--debug` mode for step-by-step execution
- Check screenshots in `test-results/` directory
- Review network requests in trace viewer
- Validate test data setup and cleanup

## Coverage Report

This test suite provides comprehensive coverage of all 18 authenticated user stories:

| User Story | Test File | Status |
|------------|-----------|---------|
| 1. Sign up with multiple methods | auth-flows.spec.ts | ✅ |
| 2. Sign in with multiple methods | auth-flows.spec.ts | ✅ |
| 3. Save JSON to library | library-management.spec.ts | ✅ |
| 4. View personal library | library-management.spec.ts | ✅ |
| 5. Search, sort, filter library | library-management.spec.ts | ✅ |
| 6. Edit document metadata | document-management.spec.ts | ✅ |
| 7. Delete documents | document-management.spec.ts | ✅ |
| 8. Load documents into editor | document-management.spec.ts | ✅ |
| 9. Publish to public library | publishing.spec.ts | ✅ |
| 10. Unpublish documents | publishing.spec.ts | ✅ |
| 11. Add publishing metadata | publishing.spec.ts | ✅ |
| 12. View profile with statistics | profile-account.spec.ts | ✅ |
| 13. Export all data | profile-account.spec.ts | ✅ |
| 14. Sign out | auth-flows.spec.ts | ✅ |
| 15. Delete account | profile-account.spec.ts | ✅ |
| 16. Migrate anonymous data | session-migration.spec.ts | ✅ |
| 17. View document analytics | publishing.spec.ts | ✅ |
| 18. Manage document visibility | publishing.spec.ts | ✅ |

**Total Coverage: 18/18 User Stories (100%)**
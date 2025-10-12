# Anonymous User E2E Tests

This directory contains comprehensive end-to-end tests for all 22 anonymous user stories in the JSON Viewer application. The tests are organized into logical groupings for better maintenance and execution.

## Test Files Overview

### 1. `homepage-navigation.spec.ts`
**User Story 1**: Visit main homepage and access JSON viewer
- Homepage display and navigation
- JSON viewer access from homepage
- Responsive design testing
- Navigation state management
- URL handling and routing

### 2. `monaco-editor.spec.ts`
**User Story 2**: Paste JSON content into Monaco editor and edit/format
- Monaco editor functionality
- JSON paste and input handling
- Syntax highlighting verification
- Line numbers display
- Real-time editing and validation
- Auto-formatting capabilities
- Undo/redo functionality
- Code folding and find/replace

### 3. `file-upload.spec.ts`
**User Story 3**: Upload JSON files via drag-and-drop or file selection
- File upload interface testing
- Valid JSON file processing
- Invalid file handling and error messages
- Large file upload performance
- Drag-and-drop functionality
- Multiple file upload scenarios
- Upload progress indicators

### 4. `json-formatting.spec.ts`
**User Story 4**: Format JSON with syntax highlighting and line numbers
- Syntax highlighting for different data types
- Line number display and formatting
- Auto-formatting of minified JSON
- Indentation consistency
- Error highlighting for invalid JSON
- Performance with large JSON files
- Unicode and special character handling
- Bracket matching and code folding

### 5. `copy-download.spec.ts`
**User Stories 5-6**: Copy JSON content to clipboard & Download JSON as a file
- Copy functionality with clipboard integration
- Download file generation and naming
- Large content handling
- Success feedback and error handling
- Format preservation in downloads
- Cross-view mode functionality
- Special character and Unicode support

### 6. `visualization-modes.spec.ts`
**User Stories 7-8**: View JSON in multiple visualization modes & Switch between viewing tabs
- Tree, list, sea/flow, and editor view modes
- View mode switching and state management
- Different node type rendering
- Large dataset handling across views
- Visual feedback during mode switches
- Active view state indicators
- Performance testing for view transitions
- Keyboard navigation support

### 7. `search-filter.spec.ts`
**User Story 9**: Search and filter JSON content
- Search interface and functionality
- String, numeric, and nested path searching
- Case-insensitive search capabilities
- Search result highlighting and navigation
- Content filtering based on criteria
- Empty result handling
- Regular expression search support
- Cross-view mode search functionality
- Special character and Unicode search
- Performance with large datasets

### 8. `tree-view-interaction.spec.ts`
**User Story 10**: Expand/collapse JSON nodes in tree view
- Expandable node display and interaction
- Individual node expand/collapse
- Expand all/collapse all functionality
- Different node type icons and indicators
- Deep nesting structure handling
- Progressive path expansion
- State persistence during view switches
- Node count and summary displays
- Keyboard navigation in tree view
- Large array handling in tree mode
- Mixed content type support

### 9. `node-details-modal.spec.ts`
**User Story 11**: View JSON node details in modal popups
- Node details modal opening via double-click
- Comprehensive node information display
- Data type specific information
- Nested object path information
- Copy functionality within modals
- Modal closing mechanisms (ESC, close button)
- Large content handling in modals
- Node metadata and statistics
- Navigation between nodes in modal
- Accessibility features for modals

### 10. `sharing-analytics.spec.ts`
**User Stories 12-14 & 22**: Shareable links, JSON statistics, and theme switching
- Share functionality and URL generation
- Shared JSON access via public URLs
- Unique share URL generation
- JSON structure preservation in shares
- Basic and detailed JSON statistics
- Node count by type calculations
- File size and processing time metrics
- Complexity metrics for deep structures
- Statistics updates on JSON changes
- Edge case statistics handling
- Theme switching functionality
- Content preservation during theme changes
- Theme application across components
- Theme persistence across sessions
- Auto theme detection support

### 11. `public-library-embed.spec.ts`
**User Stories 15-21**: Public library, developer docs, embed functionality, and ultra-optimization
- Public library navigation and browsing
- JSON example display and metadata
- Category-based browsing
- Search and filter in public library
- JSON example viewing from library
- Library statistics and organization
- Pagination for large libraries
- Developer documentation access
- API documentation display
- Integration examples provision
- Embed code generation
- Embed appearance customization
- Working embed URL generation
- Embed parameter handling
- Ultra-optimized viewer performance
- Large JSON file efficiency
- Deep nesting performance
- Virtualization for large arrays

## Test Infrastructure

All tests utilize the existing Playwright infrastructure:
- **Base Test**: Extended Playwright test with custom fixtures
- **Page Objects**: Reusable page interaction patterns
- **Test Fixtures**: Predefined JSON samples and data generators
- **Helper Utilities**: Authentication, API, screenshot, and data generation helpers

## Key Testing Principles Applied

### 1. DRY (Don't Repeat Yourself)
- Reusable page objects for common interactions
- Shared test fixtures and data generators
- Common setup and teardown patterns
- Utility functions for repetitive tasks

### 2. KISS (Keep It Simple, Stupid)
- Clear, descriptive test names
- Simple test structure and flow
- Focused test scenarios
- Minimal complexity in test logic

### 3. YAGNI (You Ain't Gonna Need It)
- Tests focus on actual user scenarios
- No over-engineering of test infrastructure
- Practical test cases without excessive edge cases
- Essential assertions without redundancy

## Test Data Strategy

### Realistic Test Scenarios
- Real-world JSON structures (e-commerce, API responses, configuration)
- Various data types and nesting levels
- Edge cases (empty objects, large arrays, deep nesting)
- Invalid JSON for error handling
- Unicode and special characters

### Data-Driven Testing
- Parameterized tests for different JSON structures
- Multiple test scenarios with varied data sets
- Dynamic data generation for performance testing
- Consistent test data across related tests

## Performance Considerations

### Fast and Reliable Tests
- Optimized wait strategies
- Efficient element selection
- Minimal unnecessary delays
- Parallel test execution where possible

### Large File Testing
- Progressive size testing (small → medium → large)
- Performance benchmarks and thresholds
- Memory usage considerations
- Timeout handling for heavy operations

## Error Handling and Edge Cases

### Comprehensive Coverage
- Invalid JSON handling
- Network failure scenarios
- Large dataset edge cases
- Empty state handling
- Browser compatibility issues

### Graceful Degradation
- Feature availability checks
- Progressive enhancement testing
- Fallback functionality verification
- Accessibility compliance

## Screenshot and Visual Testing

### Visual Regression Prevention
- Key interface state screenshots
- Responsive design verification
- Theme switching visual checks
- Error state visual confirmation

## Execution Strategy

### Test Organization
- Logical grouping by user story themes
- Independent test execution capability
- Clear test dependencies and prerequisites
- Modular test structure for maintenance

### CI/CD Integration
- Parallel execution support
- Multiple browser testing
- Automated screenshot comparison
- Performance regression detection

## Usage

```bash
# Run all anonymous user tests
npm run test:e2e:anonymous

# Run specific test file
npm run test:e2e tests/e2e/anonymous/homepage-navigation.spec.ts

# Run with UI mode for debugging
npm run test:e2e:ui tests/e2e/anonymous/

# Run in headed mode to see browser
npm run test:e2e:headed tests/e2e/anonymous/
```

## Test Coverage

These tests provide comprehensive coverage of all 22 anonymous user stories:

1. ✅ Homepage access and navigation
2. ✅ Monaco editor JSON input and editing
3. ✅ File upload (drag-drop and selection)
4. ✅ JSON formatting with syntax highlighting
5. ✅ Copy JSON to clipboard
6. ✅ Download JSON as file
7. ✅ Multiple visualization modes
8. ✅ View mode tab switching
9. ✅ Search and filter JSON content
10. ✅ Tree view node expand/collapse
11. ✅ Node details in modal popups
12. ✅ Create shareable links
13. ✅ Access shared JSON via URLs
14. ✅ View JSON statistics
15. ✅ Ultra-optimized viewer with virtualization
16. ✅ Browse public JSON library
17. ✅ Search/filter public library
18. ✅ Developer documentation access
19. ✅ Generate embed codes
20. ✅ Customize embed appearance
21. ✅ Access embedded viewers
22. ✅ Theme switching (light/dark/auto)

## Maintenance

### Regular Updates
- Keep tests synchronized with UI changes
- Update selectors when components change
- Refresh test data as needed
- Monitor test execution times

### Best Practices
- Review failed tests promptly
- Keep test code clean and documented
- Update screenshots when UI changes
- Maintain test environment consistency

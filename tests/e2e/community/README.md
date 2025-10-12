# Community E2E Test Suite

This directory contains comprehensive end-to-end tests for the content creator and community features of the JSON viewer application. The test suite covers all 9 user stories related to community interaction, content publishing, and social features.

## Test Files Overview

### 1. `content-creator-publishing.spec.ts`
**User Story Coverage:**
- Publish JSON examples with rich metadata (title, description, category, tags)
- Categorize JSON examples (API Response, Configuration, Database Schema, Test Data, Template, Example)
- Add up to 10 tags to published content for discoverability

**Key Test Areas:**
- Publishing workflow with comprehensive metadata
- Category-specific publishing with appropriate examples
- Tag management and validation (10-tag limit)
- Content quality validation
- Metadata completeness requirements

### 2. `community-browsing-discovery.spec.ts`
**User Story Coverage:**
- Browse published JSON examples by category and popularity
- Access full viewing interfaces for published examples

**Key Test Areas:**
- Anonymous browsing of public library
- Category-based filtering and sorting
- Popularity sorting (by view count)
- Detailed content information display
- Pagination for large result sets
- Full JSON viewer integration for public content
- View mode support (tree, list, sea views)
- Performance optimization for large examples

### 3. `public-library-search.spec.ts`
**User Story Coverage:**
- Search the public library by keywords, tags, and categories

**Key Test Areas:**
- Keyword search in titles and descriptions
- Tag-based search with exact and partial matches
- Category filtering integration
- Advanced search operators (AND, OR, exclusion, exact phrases)
- Search suggestions and auto-complete
- Result ranking by relevance, date, and popularity
- Search result pagination and count display
- Handling empty search results
- Search history and saved searches

### 4. `publish-preview.spec.ts`
**User Story Coverage:**
- Preview how published content will appear before publishing

**Key Test Areas:**
- Comprehensive preview modal functionality
- Rich metadata formatting preview (including Markdown)
- Multiple view mode testing in preview
- Theme switching in preview environment
- Interactive preview-to-edit workflow
- Content validation before preview
- Estimated engagement metrics display
- Direct publishing from preview
- Draft saving from preview
- Error handling in preview mode

### 5. `creator-analytics-engagement.spec.ts`
**User Story Coverage:**
- View engagement metrics (views, popularity) for published content

**Key Test Areas:**
- Analytics dashboard with overview statistics
- Individual content performance metrics
- View trends over time with charts
- Detailed analytics for specific content
- Popular tags and category performance analysis
- Trending and viral content identification
- Community engagement patterns
- Content optimization recommendations
- Analytics data export in multiple formats
- Shareable analytics reports

### 6. `content-quality-moderation.spec.ts`
**User Story Coverage:**
- Content quality validation and community standards enforcement

**Key Test Areas:**
- Pre-publication content quality validation
- Content standards and guidelines enforcement
- Sensitive data detection and flagging
- Originality validation and plagiarism prevention
- Automated content scoring system
- Community reporting mechanisms
- Automated content moderation
- Moderator review workflow
- Content appeal process
- Community guidelines and education resources

### 7. `social-features-interaction.spec.ts`
**User Story Coverage:**
- Social interaction and community features

**Key Test Areas:**
- Comment system with threading
- Comment voting and moderation
- Content forking and remixing
- Attribution and content lineage tracking
- Collaborative editing and version control
- User reputation and achievement system
- Community recognition and leaderboards
- Activity feeds and community updates
- User following and personalized feeds

### 8. `content-management-edge-cases.spec.ts`
**User Story Coverage:**
- Edge cases and error scenarios in content management

**Key Test Areas:**
- Extreme file sizes (very large and minimal JSON)
- Concurrent modification conflicts
- Corrupted or malformed content handling
- Network failure recovery
- Extreme metadata scenarios
- User permission edge cases
- System maintenance and graceful degradation
- Legacy content format migrations
- Bulk operations on content
- Content export and backup scenarios

## Test Features and Patterns

### Realistic Test Data
- Uses `dataGenerator` helper for creating realistic JSON examples
- Leverages existing `JSON_SAMPLES` for consistent test data
- Creates diverse content across all supported categories
- Simulates real-world usage patterns

### Community-Focused Testing
- Tests anonymous browsing capabilities
- Validates authenticated user interactions
- Covers multi-user collaboration scenarios
- Tests social features like comments, voting, and following

### Content Creator Workflows
- End-to-end publishing workflow testing
- Rich metadata and tagging validation
- Preview functionality testing
- Analytics and engagement tracking
- Content quality and moderation

### Error Handling and Edge Cases
- Network failure scenarios
- Malformed content handling
- Concurrent editing conflicts
- Permission and security edge cases
- System maintenance scenarios

## Test Infrastructure Integration

### Follows Existing Patterns
- Uses established `base-test.ts` with custom fixtures
- Integrates with `authHelper`, `apiHelper`, and `dataGenerator`
- Leverages existing page objects (`JsonViewerPage`, `LibraryPage`, `MainLayoutPage`)
- Follows DRY, KISS, and YAGNI principles

### Authentication Scenarios
- Content creators (`content_creator`, `social_creator`)
- Community members (`community_member_1`, `community_member_2`, etc.)
- Moderators (`moderator`)
- Anonymous users (no authentication)
- Edge case users (`edge_case_creator`, `network_tester`, etc.)

### API Integration
- Uses `apiHelper` for content creation and manipulation
- Simulates engagement (views, likes, downloads)
- Creates realistic community interaction data
- Tests API-driven features alongside UI interactions

## Running the Tests

```bash
# Run all community tests
npx playwright test tests/e2e/community/

# Run specific test files
npx playwright test tests/e2e/community/content-creator-publishing.spec.ts
npx playwright test tests/e2e/community/public-library-search.spec.ts

# Run with specific browsers
npx playwright test tests/e2e/community/ --project=chromium
npx playwright test tests/e2e/community/ --project=firefox

# Run in headed mode for debugging
npx playwright test tests/e2e/community/ --headed

# Generate test report
npx playwright test tests/e2e/community/ --reporter=html
```

## Test Data and Setup

### Prerequisites
- Authentication system must be properly configured
- API endpoints for content creation and management
- Database seeded with appropriate test users
- Community features enabled in application configuration

### Test Users
The tests assume the following user types are available:
- `content_creator` - Primary content creator with publishing permissions
- `community_member_1`, `community_member_2`, etc. - Regular community users
- `moderator` - User with moderation privileges
- `regular_user` - Standard authenticated user
- Various edge case users for specific scenarios

### Environment Configuration
Tests are designed to work with the existing application infrastructure and follow the established patterns from other test directories.

## Contributing

When adding new community tests:
1. Follow the established naming conventions
2. Use the existing page objects and helpers
3. Create realistic test scenarios
4. Include both positive and negative test cases
5. Test edge cases and error conditions
6. Document any new test patterns or utilities

## Coverage

These tests provide comprehensive coverage for:
- ✅ All 9 content creator/community user stories
- ✅ Publishing workflow with rich metadata
- ✅ Community browsing and discovery
- ✅ Search and filtering capabilities
- ✅ Preview functionality
- ✅ Analytics and engagement metrics
- ✅ Content quality and moderation
- ✅ Social features and interaction
- ✅ Edge cases and error scenarios
- ✅ Multi-user collaboration features
- ✅ Content management lifecycle

The test suite ensures that the community-driven aspects of the JSON viewer application work correctly across all user types and scenarios.
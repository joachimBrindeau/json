# Environment Variables Analysis

Comprehensive analysis of all environment variables used across the codebase.

## Summary Statistics

- **Total Files Analyzed**: 34 files
- **Total `process.env` References**: 66 occurrences
- **Unique Environment Variables**: 24 variables
- **Required Variables**: 7
- **Optional Variables**: 17

## Environment Variables Inventory

### 🔴 Required Variables (Application Cannot Start Without These)

| Variable | Type | Usage | Default | Files Using |
|----------|------|-------|---------|-------------|
| `DATABASE_URL` | String (URL) | PostgreSQL connection string | None | `lib/db.ts`, `lib/auth/index.ts`, `app/sitemap.ts`, `app/api/admin/seo/route.ts` |
| `NEXTAUTH_URL` | String (URL) | NextAuth callback URL | None | `lib/auth/index.ts` |
| `NEXTAUTH_SECRET` | String | JWT encryption secret | None | `lib/auth/index.ts` |
| `GITHUB_CLIENT_ID` | String | GitHub OAuth client ID | None | `lib/auth/index.ts` |
| `GITHUB_CLIENT_SECRET` | String | GitHub OAuth client secret | None | `lib/auth/index.ts` |
| `GOOGLE_CLIENT_ID` | String | Google OAuth client ID | None | `lib/auth/index.ts` |
| `GOOGLE_CLIENT_SECRET` | String | Google OAuth client secret | None | `lib/auth/index.ts` |

### 🟡 Optional Variables with Defaults

| Variable | Type | Default | Usage | Files Using |
|----------|------|---------|-------|-------------|
| `NODE_ENV` | Enum | `'development'` | Environment detection | 16 files |
| `REDIS_URL` | String (URL) | `'redis://localhost:6379'` | Redis connection | `lib/redis.ts` |
| `NEXT_PUBLIC_APP_URL` | String (URL) | `'https://json-viewer.io'` | Public app URL | `lib/seo/index.ts`, `app/page.tsx`, `app/embed/[id]/page.tsx`, `app/llms.txt/route.ts` |
| `MAX_JSON_SIZE_MB` | String (Number) | `'2048'` | Max JSON file size | `lib/api/examples/refactored-upload-route.ts`, `app/api/json/upload/route.ts`, `app/api/json/route.ts` |
| `JSON_STREAMING_CHUNK_SIZE` | String (Number) | `'1048576'` | Streaming chunk size | `lib/api/examples/refactored-upload-route.ts`, `app/api/json/upload/route.ts` |
| `NEXT_PUBLIC_BUILD_ID` | String | `Date.now().toString()` | Build identifier | `next.config.ts`, `lib/version.ts` |
| `BUILD_ID` | String | `Date.now().toString()` | Build identifier (alternative) | `next.config.ts`, `lib/version.ts` |

### 🟢 Optional Variables (No Defaults)

#### Analytics & Tracking

| Variable | Purpose | Files Using |
|----------|---------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics | `components/shared/seo/analytics.tsx` |
| `NEXT_PUBLIC_FB_PIXEL_ID` | Facebook Pixel | `components/shared/seo/analytics.tsx` |
| `NEXT_PUBLIC_HOTJAR_ID` | Hotjar tracking | `components/shared/seo/analytics.tsx` |

#### SEO Verification

| Variable | Purpose | Files Using |
|----------|---------|-------------|
| `GOOGLE_SITE_VERIFICATION` | Google Search Console | `lib/seo/index.ts` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console (public) | `lib/seo/index.ts`, `app/convert/metadata.ts` |
| `YANDEX_VERIFICATION` | Yandex Webmaster | `lib/seo/index.ts` |
| `BING_VERIFICATION` | Bing Webmaster | `lib/seo/index.ts` |
| `FACEBOOK_APP_ID` | Facebook App ID | `lib/seo/index.ts` |

#### Testing & CI

| Variable | Purpose | Files Using |
|----------|---------|-------------|
| `CI` | CI environment indicator | `config/playwright.config.noserver.ts`, `config/playwright.simple.config.ts`, `config/playwright.config.ts` |
| `PLAYWRIGHT_BASE_URL` | Playwright test URL | `config/playwright.config.ts` |
| `BASE_URL` | Test base URL | `tests/e2e/developer/iframe-javascript-widget-embedding.spec.ts`, `tests/e2e/developer/embedding-functionality.spec.ts` |

#### Other

| Variable | Purpose | Files Using |
|----------|---------|-------------|
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket URL | Not currently used in scanned files |
| `npm_package_version` | Package version | `app/api/admin/system/stats/route.ts` |

## Usage Patterns Analysis

### By File Type

**Configuration Files** (6 files)
- `next.config.ts` - Build configuration
- `config/playwright.*.ts` - Test configuration

**Library/Utilities** (11 files)
- `lib/db.ts` - Database configuration
- `lib/redis.ts` - Redis configuration
- `lib/auth/index.ts` - Authentication setup
- `lib/seo/index.ts` - SEO configuration
- `lib/version.ts` - Version management
- `lib/api/client.ts` - API client
- `lib/api/utils.ts` - API utilities
- `lib/logger.ts` - Logging configuration
- `lib/utils/app-errors.ts` - Error handling
- `lib/store/backend.ts` - Store backend
- `lib/db/queries/common.ts` - Database queries

**Components** (4 files)
- `components/shared/seo/analytics.tsx` - Analytics tracking
- `components/shared/seo/web-vitals.tsx` - Performance monitoring
- `components/shared/service-worker-manager.tsx` - Service worker

**Pages/Routes** (8 files)
- `app/page.tsx` - Home page
- `app/layout.tsx` - Root layout
- `app/profile/page.tsx` - Profile page
- `app/embed/[id]/page.tsx` - Embed page
- `app/sitemap.ts` - Sitemap generation
- `app/llms.txt/route.ts` - LLM context
- `app/blog/layout.tsx` - Blog layout
- `app/edit/page.tsx` - Edit page

**API Routes** (5 files)
- `app/api/json/upload/route.ts` - JSON upload
- `app/api/json/route.ts` - JSON operations
- `app/api/health/route.ts` - Health check
- `app/api/admin/seo/route.ts` - SEO admin
- `app/api/admin/system/stats/route.ts` - System stats

**Tests** (2 files)
- `tests/e2e/developer/iframe-javascript-widget-embedding.spec.ts`
- `tests/e2e/developer/embedding-functionality.spec.ts`

### Common Patterns

#### 1. Environment Detection (16 occurrences)
```typescript
process.env.NODE_ENV === 'development'
process.env.NODE_ENV === 'production'
process.env.NODE_ENV !== 'production'
```

**Files**: `lib/db.ts`, `lib/logger.ts`, `lib/api/client.ts`, `lib/utils/app-errors.ts`, `lib/auth/index.ts`, `components/shared/seo/web-vitals.tsx`, `components/shared/service-worker-manager.tsx`, `lib/api/utils.ts`, `lib/db/queries/common.ts`, `app/layout.tsx`, `app/profile/page.tsx`, `app/api/health/route.ts`, `lib/store/backend.ts`, `next.config.ts`

**Migration Priority**: HIGH - Used frequently across the application

#### 2. CI Detection (4 occurrences)
```typescript
!!process.env.CI
process.env.CI ? 2 : 0
process.env.CI ? 1 : undefined
```

**Files**: All Playwright configuration files

**Migration Priority**: LOW - Isolated to test configuration

#### 3. URL Configuration (8 occurrences)
```typescript
process.env.NEXT_PUBLIC_APP_URL || 'https://json-viewer.io'
process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3456'
```

**Migration Priority**: MEDIUM - Used in SEO and testing

#### 4. Performance Settings (6 occurrences)
```typescript
parseInt(process.env.MAX_JSON_SIZE_MB || '2048') * 1024 * 1024
parseInt(process.env.JSON_STREAMING_CHUNK_SIZE || '1048576')
```

**Migration Priority**: HIGH - Repeated logic should be centralized

#### 5. Database Availability Checks (3 occurrences)
```typescript
if (!process.env.DATABASE_URL)
!!process.env.DATABASE_URL
```

**Files**: `lib/auth/index.ts`, `app/sitemap.ts`, `app/api/admin/seo/route.ts`

**Migration Priority**: MEDIUM - Should use centralized validation

## Security Considerations

### 🔐 Secrets (Never expose to client)
- `DATABASE_URL` - Database credentials
- `NEXTAUTH_SECRET` - Authentication secret
- `GITHUB_CLIENT_SECRET` - OAuth secret
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `REDIS_URL` - May contain password

### 🌐 Public Variables (Safe for client-side)
All variables prefixed with `NEXT_PUBLIC_*`:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WEBSOCKET_URL`
- `NEXT_PUBLIC_BUILD_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_FB_PIXEL_ID`
- `NEXT_PUBLIC_HOTJAR_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

## Recommendations

### High Priority

1. **Consolidate Performance Calculations**
   - Current: 6 duplicate parsing operations
   - Solution: Use `config.performance.maxJsonSizeBytes` from centralized config
   - Impact: Eliminates repeated logic and potential inconsistencies

2. **Standardize Environment Checks**
   - Current: 16 direct `process.env.NODE_ENV` comparisons
   - Solution: Use `config.isDevelopment`, `config.isProduction`, `config.isTest`
   - Impact: Cleaner code, type-safe environment detection

3. **Centralize Database Availability Checks**
   - Current: 3 different patterns for checking database availability
   - Solution: Use `config.database.url` with try-catch in validation
   - Impact: Consistent error handling

### Medium Priority

1. **Update URL References**
   - Migrate to `config.app.url` and `config.testing.baseUrl`
   - Benefit: Single source of truth for URLs

2. **Consolidate Build ID Logic**
   - Current: Duplicated in `next.config.ts` and `lib/version.ts`
   - Solution: Use `config.app.buildId`
   - Impact: Consistent build identification

3. **Standardize Analytics Initialization**
   - Use `config.analytics.*.enabled` flags
   - Benefit: Cleaner conditional logic

### Low Priority

1. **Update Test Configuration**
   - Playwright configs can use centralized config
   - Impact: Minimal, isolated to test setup

2. **Consider Removing Unused Variables**
   - `NEXT_PUBLIC_WEBSOCKET_URL` - Not found in scanned code
   - Action: Verify usage or remove from documentation

## Migration Checklist

- [ ] **Phase 1: Core Infrastructure**
  - [x] Create `lib/config/env.ts` with validation
  - [x] Create `.env.example` with documentation
  - [x] Create migration documentation
  - [ ] Update `lib/db.ts` to use config
  - [ ] Update `lib/redis.ts` to use config
  - [ ] Update `lib/auth/index.ts` to use config

- [ ] **Phase 2: Application Code**
  - [ ] Update performance calculations (6 files)
  - [ ] Update environment checks (16 files)
  - [ ] Update URL references (8 files)
  - [ ] Update analytics components (3 files)

- [ ] **Phase 3: API Routes**
  - [ ] Update `/api/json/upload/route.ts`
  - [ ] Update `/api/json/route.ts`
  - [ ] Update `/api/health/route.ts`
  - [ ] Update `/api/admin/*` routes

- [ ] **Phase 4: Pages & Components**
  - [ ] Update page components (5 files)
  - [ ] Update SEO components (2 files)
  - [ ] Update error handling utilities

- [ ] **Phase 5: Configuration & Tests**
  - [ ] Update Next.js config
  - [ ] Update Playwright configs (optional)
  - [ ] Update test files (optional)

- [ ] **Phase 6: Validation**
  - [ ] Run full test suite
  - [ ] Verify all environment variables are covered
  - [ ] Check for any remaining `process.env` usage
  - [ ] Update team documentation

## Testing Strategy

1. **Unit Tests**
   - Validate environment parsing
   - Test default values
   - Test validation errors

2. **Integration Tests**
   - Verify config works in all environments (dev, prod, test)
   - Test missing variable handling
   - Test optional variable behavior

3. **Migration Testing**
   - Create `.env.test` with various scenarios
   - Verify backward compatibility
   - Test gradual migration approach

## Performance Impact

**Expected Impact**: Minimal to Positive

- **Validation**: One-time cost at application startup (~5-10ms)
- **Access**: Slightly faster than `process.env` (pre-parsed values)
- **Bundle Size**: +~2KB for Zod validation schema
- **Type Checking**: Zero runtime cost, compile-time only

## Rollback Plan

If issues arise during migration:

1. The config module exports individual variables for backward compatibility
2. Each file can be migrated independently
3. Use feature flags to toggle between old and new approaches if needed
4. Git history allows reverting individual file changes

## Success Metrics

- ✅ Zero `process.env` references in application code (excluding config module)
- ✅ All environment variables documented in `.env.example`
- ✅ Type-safe access to all configuration
- ✅ Clear error messages for missing/invalid variables
- ✅ Consistent configuration patterns across codebase

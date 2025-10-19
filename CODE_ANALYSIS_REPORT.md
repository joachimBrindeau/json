# Code Analysis Report - Unused & Duplicate Components

Generated: 2025-10-19
Tools Used: jscpd, ts-prune

## Executive Summary

- **Total Files Analyzed**: 70 TypeScript/TSX files
- **Duplicate Code**: 25 clones found (2.45% of codebase)
- **Unused Exports**: 150+ exports identified
- **Recommendation**: Medium priority cleanup (manageable technical debt)

---

## 1. Duplicate Code Analysis (jscpd)

### Overall Statistics
```
Format: TypeScript
Files: 70
Total Lines: 14,601
Total Tokens: 105,483
Clones Found: 25
Duplicated Lines: 358 (2.45%)
Duplicated Tokens: 2,882 (2.73%)
```

### Critical Duplicates to Refactor

#### 🔴 HIGH PRIORITY

**1. API Response Helpers** (`lib/api/responses.ts`)
- **6 identical clones** of error response builder (10 lines each)
- Lines: 198-208, 216-226, 238-248, 256-266, 274-284, 292-302, 335-345
- **Action**: Extract into single `buildErrorResponse()` utility function
- **Impact**: Reduces 60+ lines of duplicate code

**2. Document Query Patterns** (`lib/db/queries/documents.ts`)
- **5 major clones** in pagination logic (12-32 lines each)
- Lines: 179-211, 250-282, 470-497, 529-554, 641-668
- **Action**: Create reusable pagination builder function
- **Impact**: Reduces 100+ lines of duplicate code

**3. Environment Config** (`lib/config/env.ts`)
- **Large duplicate** config validation (32 lines)
- Lines: 56-88, 90-122
- **Action**: Extract into validation helper
- **Impact**: DRY principle violation, error-prone

#### 🟡 MEDIUM PRIORITY

**4. Toast Helpers** (`lib/utils/toast-helpers.ts`)
- 3 similar toast builders (25-27 lines each)
- Lines: 43-69, 101-128, 129-154
- **Action**: Create toast factory with config options

**5. Query Common Patterns** (`lib/db/queries/common.ts`)
- Duplicate pagination logic (34 lines)
- Lines: 202-235, 267-301
- **Action**: Merge with documents.ts pagination refactor

**6. Analytics Queries** (`lib/db/queries/analytics.ts`)
- 2 date range builders (8-12 lines each)
- **Action**: Extract date range utility

**7. Store Sync Logic** (`lib/store/backend.ts` & `lib/store/client.ts`)
- Shared sync pattern (17 lines)
- Lines: backend.ts:697-714, client.ts:67-84
- **Action**: Create shared sync utility

---

## 2. Unused Exports Analysis (ts-prune)

### Components

#### Unused Hooks (can likely be removed)
```typescript
hooks/use-api-mutation.ts:
  - useApiPut (line 148)
  - useApiPatch (line 178)

hooks/use-editor-settings.ts:
  - useEditorSettings (line 19)

hooks/use-lazy-load.ts:
  - useLazyLoad (line 11)

hooks/use-viewer-settings.ts:
  - usePerformanceSettings (line 33)

hooks/use-validated-form.ts:
  - FormData (line 119) - generic type, may conflict
```

#### Unused Components (verify before removal)
```typescript
components/layout/index.ts:
  - AppLayout (line 6)
  - MobileLayoutWrapper (line 8)

components/shared/index.ts:
  - BaseModal, ConfirmationModal, InfoModal, SuccessModal
  - CompactNodeRenderer, ListNodeRenderer, TreeNodeRenderer
  - Multiple empty states: TreeEmptyState, SeaEmptyState, etc.
  - JsonViewerBase (line 8)

components/shared/lazy-components.tsx:
  - LazyUltraJsonViewer (line 13)
  - LazyMonacoEditorWithSkeleton (line 68)
  - LazyReactFlowWithSkeleton (line 76)
  - LazyJsonViewerWithSkeleton (line 66)
  - LazyUnifiedShareModal (line 44)
  - LazyUnifiedShareModalWithSuspense (line 110)

components/ui/loading-states.tsx:
  - LoadingSpinner, JsonLoading, ProcessingLoading
  - SkeletonCard, JsonViewerSkeleton
```

#### Unused Features (cleanup candidates)
```typescript
components/features/viewer/index.ts:
  - ViewerRaw (line 29)
  - UltraJsonViewer (line 40)
  - JsonCompare (line 41)
  - JsonActionButtons (line 42)

components/features/viewer/flow/index.ts:
  - FlowArrayNode, FlowPrimitiveNode (lines 24-25)
  - FlowBooleanChip, FlowNullChip (lines 26-27)
  - FlowNodeShell (line 28)
  - FlowCollapseButton (line 37)

components/features/viewer/flow/FlowLegendPanel.tsx:
  - FlowLegendPanel (line 12)

components/features/viewer/flow/FlowStatsPanel.tsx:
  - FlowStatsPanel (line 17)
```

#### Unused SEO Components (verify necessity)
```typescript
components/shared/seo/:
  - Analytics (analytics.tsx:46)
  - useAnalytics (analytics.tsx:209)
  - FAQSection (faq-section.tsx:57)
  - PerformanceOptimizations (performance-optimizations.tsx:17)
  - PerformanceSchema (performance-optimizations.tsx:158)
```

### Library Utilities

#### Unused Lib Functions
```typescript
lib/version.ts:
  - handleVersionUpdate (line 38)
  - BUILD_TIME (line 9)

lib/logger.ts:
  - LogLevel (line 8)
  - Logger class (line 63)
  - default export (line 77)

lib/db.ts:
  - closeConnections (line 54)

lib/performance-test-generator.ts:
  - TestDataOptions (line 4)
  - generateExtremeTestJSON (line 236)
```

---

## 3. Recommended Actions

### Phase 1: High Impact Refactoring (1-2 days)
1. ✅ **Consolidate API Response Builders** (`lib/api/responses.ts`)
   - Create single `buildErrorResponse()` function
   - Reduces 60+ duplicate lines
   
2. ✅ **Extract Pagination Logic** (`lib/db/queries/`)
   - Create `buildPaginatedQuery()` helper
   - Reduces 100+ duplicate lines
   
3. ✅ **Refactor Environment Config** (`lib/config/env.ts`)
   - Extract validation into reusable function

### Phase 2: Component Cleanup (2-3 days)
1. ⚠️ **Verify & Remove Unused Components**
   - Check each unused export with global search
   - Remove confirmed unused code
   - Update index.ts barrel exports

2. ⚠️ **Consolidate Loading States**
   - Merge similar loading/skeleton components
   - Create unified loading component system

3. ⚠️ **Clean Up Lazy Components**
   - Remove unused lazy wrappers
   - Keep only actively used lazy-loaded components

### Phase 3: Medium Priority (3-5 days)
1. Refactor toast helpers into factory pattern
2. Consolidate store sync logic
3. Clean up analytics queries duplication
4. Review and consolidate empty state components

### Phase 4: Documentation & Testing (1 day)
1. Update import statements after removals
2. Test build after each cleanup phase
3. Update component documentation
4. Run full test suite

---

## 4. Risk Assessment

| Risk Level | Description | Mitigation |
|------------|-------------|------------|
| 🟢 Low | Duplicate code refactoring | Covered by existing tests |
| 🟡 Medium | Removing unused exports | Verify with global search first |
| 🔴 High | Removing SEO/Analytics | Verify business requirements |

---

## 5. Estimated Impact

### Code Reduction
- **Duplicate code removal**: ~200-300 lines
- **Unused exports removal**: ~500-1000 lines
- **Total reduction**: 5-8% of codebase

### Maintenance Benefits
- Easier debugging (less code to search)
- Faster builds (fewer files to process)
- Reduced bundle size (unused code tree-shaken)
- Better code organization

### Performance Benefits
- Smaller bundle size (~5-10KB reduction)
- Faster TypeScript compilation
- Improved tree-shaking effectiveness

---

## 6. Next Steps

1. **Review this report** with the team
2. **Prioritize cleanup phases** based on project timeline
3. **Create cleanup branch** for systematic refactoring
4. **Run tests after each phase** to ensure no breakage
5. **Update documentation** to reflect simplified architecture

---

## Tools Configuration

### jscpd Settings Used
```bash
npx jscpd \
  --pattern "components/**/*.tsx" \
  --pattern "lib/**/*.ts" \
  --min-lines 5 \
  --min-tokens 50 \
  --reporters "console" \
  --format "typescript,javascript" \
  --ignore "**/*.test.ts,**/*.test.tsx,**/node_modules/**"
```

### ts-prune Settings Used
```bash
npx ts-prune \
  --project tsconfig.json \
  --ignore ".*\.test\.tsx?$|.*\.spec\.tsx?$"
```

---

## Appendix: Full Unused Exports List

See ts-prune output for complete list of 150+ unused exports across:
- hooks/ (14 exports)
- components/layout/ (5 exports)
- components/shared/ (50+ exports)
- components/ui/ (40+ exports)
- components/features/ (40+ exports)
- lib/ (20+ exports)
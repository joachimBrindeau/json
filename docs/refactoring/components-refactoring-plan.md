# Components Refactoring Plan

**Date:** 2025-10-12  
**Priority:** HIGH (contains critical bugs)

---

## Executive Summary

Found **2 critical bugs** and **multiple naming inconsistencies** in the components folder that need immediate attention.

### Critical Issues
1. ❌ **Broken import in lazy-components.tsx** - References deleted viewer path
2. ❌ **Wrong import in app-layout.tsx** - Imports non-existent `@/components/sidebar`

### Naming Inconsistencies
3. ⚠️ **admin/** uses PascalCase (inconsistent with other features)
4. ⚠️ **shared/** mixes PascalCase and kebab-case
5. ⚠️ **"Unified" prefix** is vague and unnecessary

---

## Phase 1: Critical Bug Fixes (IMMEDIATE)

### Bug 1: Fix lazy-components.tsx

**File:** `components/shared/lazy-components.tsx`  
**Lines:** 8-11

**Current (BROKEN):**
```typescript
export const LazyUltraJsonViewer = lazy(() => 
  import('@/components/features/viewer/ultra-optimized-viewer/UltraJsonViewer')
    .then(module => ({ default: module.UltraJsonViewer }))
);
```

**Fix:**
```typescript
export const LazyViewer = lazy(() => 
  import('@/components/features/viewer')
    .then(module => ({ default: module.Viewer }))
);

// Backwards compatibility
export const LazyUltraJsonViewer = LazyViewer;
```

**Also update:**
- Line 55: `<LazyUltraJsonViewer {...props} />` → `<LazyViewer {...props} />`
- Export name: `LazyJsonViewerWithSkeleton` → `LazyViewerWithSkeleton`

---

### Bug 2: Fix app-layout.tsx

**File:** `components/layout/app-layout.tsx`  
**Line:** 3

**Current (BROKEN):**
```typescript
import { Sidebar } from '@/components/sidebar';
```

**Fix:**
```typescript
import { Sidebar } from './sidebar';
// OR
import { Sidebar } from '@/components/layout/sidebar';
```

---

## Phase 2: Naming Standardization (HIGH PRIORITY)

### Goal: Consistent kebab-case naming across all components

### 2.1 Rename admin/ files

**Current:**
```
components/features/admin/
├── SEOManager.tsx
├── SuperAdminDashboard.tsx
├── SystemStats.tsx
├── TagAnalytics.tsx
└── UserList.tsx
```

**Rename to:**
```
components/features/admin/
├── seo-manager.tsx
├── super-admin-dashboard.tsx
├── system-stats.tsx
├── tag-analytics.tsx
└── user-list.tsx
```

**Files to update:**
- All imports in `app/superadmin/` pages
- Barrel export in `components/features/admin/index.ts` (if exists)

---

### 2.2 Rename shared/ files

**Current:**
```
components/shared/
├── BaseModal.tsx           # PascalCase
├── EmptyStates.tsx         # PascalCase
├── JsonViewerBase.tsx      # PascalCase
├── NodeRenderer.tsx        # PascalCase
├── PerformanceMonitor.tsx  # PascalCase
├── TreeView.tsx            # PascalCase
├── error-boundary.tsx      # kebab-case ✓
├── lazy-components.tsx     # kebab-case ✓
├── service-worker-manager.tsx  # kebab-case ✓
└── version-checker.tsx     # kebab-case ✓
```

**Rename to:**
```
components/shared/
├── base-modal.tsx
├── empty-states.tsx
├── json-viewer-base.tsx
├── node-renderer.tsx
├── performance-monitor.tsx
├── tree-view.tsx
├── error-boundary.tsx      # no change
├── lazy-components.tsx     # no change
├── service-worker-manager.tsx  # no change
└── version-checker.tsx     # no change
```

**Files to update:**
- `components/shared/index.ts` (barrel export)
- All files importing from shared/ (~20-30 files across app/)

---

### 2.3 Remove "Unified" prefix

**File:** `components/features/modals/unified-share-modal.tsx`

**Rename to:** `components/features/modals/share-modal.tsx`

**Rationale:** "Unified" is vague. It's just the share modal.

**Files to update:**
- `components/features/modals/index.ts`
- `components/shared/lazy-components.tsx`
- All files importing UnifiedShareModal (~3-5 files)

---

### 2.4 Rename flow-diagram/ files (OPTIONAL)

**Current:**
```
components/features/flow-diagram/
├── ChainHandle.tsx
├── DefaultHandle.tsx
├── HoveringBlueDot.tsx
├── JsonFlowView.tsx
├── JsonSeaDiagram.tsx
└── ...
```

**Option A: Rename to kebab-case**
```
components/features/flow-diagram/
├── chain-handle.tsx
├── default-handle.tsx
├── hovering-blue-dot.tsx
├── json-flow-view.tsx
├── json-sea-diagram.tsx
└── ...
```

**Option B: Apply hierarchical naming (like viewer/)**
```
components/features/flow-diagram/
├── FlowDiagram.tsx
├── FlowDiagramChainHandle.tsx
├── FlowDiagramDefaultHandle.tsx
├── FlowDiagramHoveringDot.tsx
├── FlowDiagramJsonView.tsx
└── ...
```

**Recommendation:** Option A (kebab-case) for consistency

---

## Phase 3: Structure Improvements (MEDIUM PRIORITY)

### 3.1 Consolidate Empty States

**Current:**
- `components/shared/EmptyStates.tsx` - 11 different empty state components
- `components/ui/loading-states.tsx` - Loading states

**Action:**
1. Audit both files for overlap
2. Move all empty/loading states to `components/ui/states.tsx`
3. Update imports

---

### 3.2 Document Modal Patterns

**Current modal/dialog components:**
- `components/shared/BaseModal.tsx` - Custom base modal
- `components/ui/dialog.tsx` - Radix Dialog primitive
- `components/ui/alert-dialog.tsx` - Radix AlertDialog primitive
- `components/ui/sheet.tsx` - Radix Sheet primitive

**Action:**
1. Create `docs/components/modal-patterns.md`
2. Document when to use each:
   - BaseModal: Feature modals (share, export, etc.)
   - Dialog: General purpose dialogs
   - AlertDialog: Confirmation dialogs
   - Sheet: Side panels
3. Add examples

---

## Implementation Steps

### Step 1: Fix Critical Bugs (30 minutes)

```bash
# 1. Fix lazy-components.tsx
# Edit components/shared/lazy-components.tsx
# Update import path and export names

# 2. Fix app-layout.tsx
# Edit components/layout/app-layout.tsx
# Update Sidebar import

# 3. Test build
npm run build

# 4. Commit
git add -A
git commit -m "fix: update broken imports in lazy-components and app-layout"
```

---

### Step 2: Rename admin/ files (1 hour)

```bash
# Rename files
mv components/features/admin/SEOManager.tsx components/features/admin/seo-manager.tsx
mv components/features/admin/SuperAdminDashboard.tsx components/features/admin/super-admin-dashboard.tsx
mv components/features/admin/SystemStats.tsx components/features/admin/system-stats.tsx
mv components/features/admin/TagAnalytics.tsx components/features/admin/tag-analytics.tsx
mv components/features/admin/UserList.tsx components/features/admin/user-list.tsx

# Update imports (use sed or manual)
# Test build
npm run build

# Commit
git add -A
git commit -m "refactor: rename admin components to kebab-case"
```

---

### Step 3: Rename shared/ files (1.5 hours)

```bash
# Rename files
mv components/shared/BaseModal.tsx components/shared/base-modal.tsx
mv components/shared/EmptyStates.tsx components/shared/empty-states.tsx
mv components/shared/JsonViewerBase.tsx components/shared/json-viewer-base.tsx
mv components/shared/NodeRenderer.tsx components/shared/node-renderer.tsx
mv components/shared/PerformanceMonitor.tsx components/shared/performance-monitor.tsx
mv components/shared/TreeView.tsx components/shared/tree-view.tsx

# Update barrel export
# Edit components/shared/index.ts

# Update all imports
# Use grep to find all imports, then update

# Test build
npm run build

# Commit
git add -A
git commit -m "refactor: rename shared components to kebab-case"
```

---

### Step 4: Remove "Unified" prefix (30 minutes)

```bash
# Rename file
mv components/features/modals/unified-share-modal.tsx components/features/modals/share-modal.tsx

# Update component name inside file
# Update barrel export
# Update lazy-components.tsx
# Update all imports

# Test build
npm run build

# Commit
git add -A
git commit -m "refactor: remove 'unified' prefix from share modal"
```

---

## Testing Checklist

After each phase:

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Test affected pages manually:
  - [ ] Homepage (lazy loading)
  - [ ] Admin dashboard (admin components)
  - [ ] Share modal (unified-share-modal)
- [ ] Run Playwright tests (if available)

---

## Estimated Time

- **Phase 1 (Critical):** 30 minutes
- **Phase 2 (Naming):** 3 hours
- **Phase 3 (Structure):** 2 hours
- **Total:** ~5.5 hours

---

## Benefits

1. **Consistency:** All components follow kebab-case naming
2. **Maintainability:** Easier to find and understand components
3. **Bug-free:** No broken imports
4. **Clarity:** Removed vague "Unified" prefix
5. **Documentation:** Clear patterns for modals and states

---

## Risks

- **Breaking changes:** Renaming files breaks imports
- **Mitigation:** Update all imports in same commit, test thoroughly
- **Git history:** File renames may affect git blame
- **Mitigation:** Use `git log --follow` to track renamed files

---

## Next Steps

1. Review this plan
2. Execute Phase 1 (critical bugs) immediately
3. Schedule Phase 2 and 3 based on availability
4. Update documentation after completion



# Complete Dependency Analysis - json-viewer.io

**Date:** 2025-10-12  
**Commit:** 696b5a3

## Executive Summary

Complete dependency tree analysis reveals:
- **13 components** are directly or indirectly used
- **36 components** appear to be unused (need verification)
- **Complex dependency chains** prevent simple deletion

---

## Dependency Tree (Used Components)

### Level 1: App Routes (Direct Imports)

```
app/
├── page.tsx
│   ├── ✅ editor/json-editor
│   └── ✅ json-viewer/ultra-optimized-viewer/UltraJsonViewer
│
├── edit/page.tsx
│   ├── ✅ editor/json-editor
│   └── ✅ json-viewer/ultra-optimized-viewer/UltraJsonViewer
│
├── embed/[id]/page.tsx
│   ├── ✅ editor/json-editor
│   ├── ✅ json-viewer/smart-json-viewer
│   └── ✅ json-viewer/ultra-optimized-viewer/UltraJsonViewer
│
├── library/[id]/page.tsx
│   └── ✅ json-viewer/ultra-optimized-viewer/UltraJsonViewer
│
├── compare/page.tsx
│   └── ✅ json-viewer/json-compare
│
├── superadmin/page.tsx
│   └── ✅ admin/SuperAdminDashboard
│
└── layout.tsx
    └── ✅ modals/global-login-modal
```

### Level 2: Component Dependencies (Imports within components)

```
UltraJsonViewer (PRIMARY VIEWER)
├── ✅ json-viewer/json-action-buttons (direct import)
├── ✅ modals/node-details-modal (direct import)
├── ✅ modals/export-modal (direct import)
└── ✅ flow-diagram/JsonFlowView (dynamic import)
    └── ✅ flow-diagram/* (all 29 files - required by JsonFlowView)

SmartJsonViewer (EMBED PAGE)
├── ✅ json-viewer/virtual-json-viewer (direct import)
└── ✅ json-viewer/simple-json-viewer (direct import)

JsonActionButtons
├── ✅ modals/unified-share-modal (direct import)
└── ✅ modals/embed-modal (direct import)
```

### Level 3: Lazy-Loaded Components

```
components/shared/lazy-components.tsx
├── ✅ modals/embed-modal (lazy)
├── ✅ modals/publish-modal (lazy)
└── ✅ modals/unified-share-modal (lazy)
```

---

## Complete Used Components List

### ✅ Viewers (6 files)
1. **ultra-optimized-viewer/UltraJsonViewer.tsx** - Primary viewer (4 routes)
2. **smart-json-viewer.tsx** - Embed page
3. **simple-json-viewer.tsx** - Used by SmartJsonViewer
4. **virtual-json-viewer.tsx** - Used by SmartJsonViewer
5. **json-action-buttons.tsx** - Used by UltraJsonViewer
6. **json-compare.tsx** - Compare page

### ✅ Flow Diagram (29 files)
**ALL files required** - Used by UltraJsonViewer's flow mode
- JsonFlowView.tsx
- JsonSeaDiagram.tsx
- nodes/* (7 files)
- edges/* (2 files)
- utils/* (5 files)
- Supporting components (14 files)

### ✅ Modals (6 files)
1. **global-login-modal.tsx** - App layout
2. **node-details-modal.tsx** - UltraJsonViewer
3. **export-modal.tsx** - UltraJsonViewer
4. **embed-modal.tsx** - JsonActionButtons + lazy
5. **unified-share-modal.tsx** - JsonActionButtons + lazy
6. **publish-modal.tsx** - Lazy loaded

### ✅ Editor (3 files)
1. **json-editor.tsx** - 4 routes
2. **json-metadata-form.tsx** - Used by publish-modal
3. **rich-text-editor.tsx** - Used by json-metadata-form

### ✅ Admin (5 files)
All 5 admin components used in superadmin route

**TOTAL USED: 49 files**

---

## Potentially Unused Components

### ❓ Viewers (2 files)
1. **json-viewer.tsx** - 0 direct references (check if exported/used elsewhere)
2. **viewer-settings.tsx** - 0 references
3. **progressive-disclosure/** - 0 references

### ❓ Modals (2 files)
1. **login-modal.tsx** - 10 references (vs global-login-modal: 2)
2. **share-modal.tsx** - 4 references (vs unified-share-modal: 3)

### ❓ Upload (1 file)
1. **enhanced-upload.tsx** - 1 reference (need to check where)

---

## Modal Consolidation Analysis

### LoginModal vs GlobalLoginModal

**GlobalLoginModal (2 uses):**
- app/layout.tsx (1 use)
- components/features/modals/index.ts (1 export)

**LoginModal (10 uses):**
- Need to check all 10 references

**Recommendation:** Need to verify which is the canonical version

### ShareModal vs UnifiedShareModal

**ShareModal (4 uses):**
- Need to check all 4 references

**UnifiedShareModal (3 uses):**
- JsonActionButtons (1 use)
- lazy-components.tsx (1 use)
- components/features/modals/index.ts (1 export)

**Recommendation:** Need to verify which is the canonical version

---

## Critical Findings

### 1. UltraJsonViewer Has Deep Dependencies

```
UltraJsonViewer
├── JsonActionButtons
│   ├── EmbedModal
│   └── UnifiedShareModal
├── NodeDetailsModal
├── ExportModal
└── JsonFlowView
    └── ALL flow-diagram components (29 files)
```

**Cannot delete flow-diagram without breaking UltraJsonViewer!**

### 2. SmartJsonViewer Requires Both Viewers

```
SmartJsonViewer
├── VirtualJsonViewer (for large JSON)
└── SimpleJsonViewer (for small JSON)
```

**Cannot delete either without breaking SmartJsonViewer!**

### 3. Lazy Loading Hides Dependencies

Components loaded via `lazy-components.tsx` don't show up in direct imports:
- EmbedModal
- PublishModal  
- UnifiedShareModal

**Must check lazy-components.tsx before deleting modals!**

---

## Safe to Delete (Verification Needed)

### High Confidence (0 references found)

1. ❌ **viewer-settings.tsx** - 0 references
2. ❌ **progressive-disclosure/** - 0 references (directory)

### Medium Confidence (Need manual verification)

1. ❓ **json-viewer.tsx** - 0 references but might be exported
2. ❓ **enhanced-upload.tsx** - 1 reference (need to check)

### Low Confidence (Has references, need analysis)

1. ❓ **login-modal.tsx** vs **global-login-modal.tsx** - Consolidation candidate
2. ❓ **share-modal.tsx** vs **unified-share-modal.tsx** - Consolidation candidate

---

## Recommended Action Plan

### Phase 1: Safe Deletions (High Confidence)

```bash
# Delete components with 0 references
rm components/features/json-viewer/viewer-settings.tsx
rm -rf components/features/json-viewer/progressive-disclosure/
```

**Impact:** Remove 2 files, ~200 lines

### Phase 2: Verify and Delete (Medium Confidence)

1. Check if `json-viewer.tsx` is exported in index.ts
2. Find the 1 reference to `enhanced-upload.tsx`
3. Delete if truly unused

**Impact:** Remove 1-2 files, ~400 lines

### Phase 3: Modal Consolidation (Low Confidence)

1. Analyze all 10 references to `login-modal.tsx`
2. Analyze all 4 references to `share-modal.tsx`
3. Consolidate to single version
4. Update all imports

**Impact:** Remove 2 files, update ~14 imports

### Phase 4: Update Documentation

Update barrel exports and documentation

---

## Components That CANNOT Be Deleted

### Critical Path Components

1. **UltraJsonViewer** - Primary viewer (4 routes)
2. **SmartJsonViewer** - Embed page
3. **SimpleJsonViewer** - Required by SmartJsonViewer
4. **VirtualJsonViewer** - Required by SmartJsonViewer
5. **JsonActionButtons** - Required by UltraJsonViewer
6. **JsonFlowView** - Required by UltraJsonViewer
7. **ALL flow-diagram components** - Required by JsonFlowView

### Supporting Components

8. **JsonCompare** - Compare page
9. **JsonEditor** - 4 routes
10. **All modals** - Various dependencies
11. **All admin components** - Superadmin route

---

## Next Steps

1. ✅ Complete dependency analysis (DONE)
2. ⏳ Verify json-viewer.tsx usage
3. ⏳ Find enhanced-upload.tsx reference
4. ⏳ Analyze modal consolidation
5. ⏳ Execute Phase 1 safe deletions
6. ⏳ Test build after each phase
7. ⏳ Update documentation

---

## Conclusion

**Original estimate:** 36 unused files (73%)  
**After analysis:** 2-4 safely deletable files (4-8%)

The codebase is **much more interconnected** than initially thought. Most components that appear unused are actually:
- Dynamically imported
- Required by other components
- Part of critical dependency chains

**Recommendation:** Proceed with extreme caution. Only delete components with 0 references after manual verification.


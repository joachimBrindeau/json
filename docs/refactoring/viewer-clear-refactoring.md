# Viewer Components - Clear Refactoring (Keep ALL Features)

**Goal:** Clear, understandable structure while preserving ALL current functionality

---

## Current Features Analysis

### What We Have (ALL must be preserved):

1. **Tree/Raw/Flow view modes** ✅ Keep
2. **Automatic size-based optimization** ✅ Keep
3. **Virtualized rendering for large JSON** ✅ Keep
4. **Simple rendering for small JSON** ✅ Keep
5. **Side-by-side comparison** ✅ Keep
6. **Share/Embed/Export buttons** ✅ Keep
7. **Search functionality** ✅ Keep
8. **Node expansion/collapse** ✅ Keep

---

## The Problem: Confusing Names & Structure

**Current (CONFUSING):**
```
viewer/
├── ultra-optimized-viewer/UltraJsonViewer.tsx    # What's "ultra"?
├── smart-json-viewer.tsx                         # What's "smart"?
├── simple-json-viewer.tsx                        # What's "simple"?
├── virtual-json-viewer.tsx                       # What's "virtual"?
├── json-viewer.tsx                               # Generic name, actually duplicate
├── json-compare.tsx                              # OK name
└── json-action-buttons.tsx                       # OK name
```

**Why it's confusing:**
- "Ultra" vs "Smart" vs "Simple" vs "Virtual" - what do these mean?
- Which one should I use?
- What's the difference?
- Why are there 4 different viewers?

---

## Clear Refactored Structure

### Principle: Name by PURPOSE, not implementation

```
components/features/viewer/
├── index.ts                          # Public exports
├── README.md                         # Clear documentation
│
├── Viewer/                           # PRIMARY - Multi-mode viewer
│   ├── index.tsx                     # Main component (was UltraJsonViewer)
│   ├── TreeView.tsx                  # Tree mode rendering
│   ├── RawView.tsx                   # Raw JSON rendering  
│   ├── FlowView.tsx                  # Flow diagram mode
│   └── types.ts                      # Shared types
│
├── EmbedViewer/                      # EMBED - Auto-optimizing viewer
│   ├── index.tsx                     # Main component (was SmartJsonViewer)
│   ├── BasicRenderer.tsx             # For small JSON (was SimpleJsonViewer)
│   └── VirtualizedRenderer.tsx       # For large JSON (was VirtualJsonViewer)
│
├── CompareViewer/                    # COMPARISON - Side-by-side
│   └── index.tsx                     # (was JsonCompare)
│
└── ViewerActions/                    # UTILITIES - Action buttons
    └── index.tsx                     # (was JsonActionButtons)
```

---

## Component Naming Logic

### Before → After (Clear Purpose)

| Old Name | New Name | Purpose |
|----------|----------|---------|
| UltraJsonViewer | **Viewer** | Primary viewer with tree/raw/flow modes |
| SmartJsonViewer | **EmbedViewer** | Auto-optimizing for embed scenarios |
| SimpleJsonViewer | **BasicRenderer** | Internal: renders small JSON |
| VirtualJsonViewer | **VirtualizedRenderer** | Internal: renders large JSON |
| JsonCompare | **CompareViewer** | Side-by-side comparison |
| JsonActionButtons | **ViewerActions** | Share/embed/export buttons |
| ~~JsonViewer~~ | **DELETE** | Duplicate of UltraJsonViewer |

---

## Why This Is Clear

### 1. **Viewer** (Primary)
- **Purpose:** Main JSON viewer for most use cases
- **Features:** Tree/Raw/Flow modes, search, expand/collapse
- **When to use:** Homepage, editor, library, most embed scenarios
- **Old name:** UltraJsonViewer (confusing - what's "ultra"?)

### 2. **EmbedViewer** (Auto-optimizing)
- **Purpose:** Automatically chooses best rendering strategy
- **Features:** Switches between Basic/Virtualized based on size
- **When to use:** Embed pages where JSON size is unknown
- **Old name:** SmartJsonViewer (confusing - what's "smart"?)
- **Internal components:**
  - BasicRenderer (was SimpleJsonViewer)
  - VirtualizedRenderer (was VirtualJsonViewer)

### 3. **CompareViewer** (Specialized)
- **Purpose:** Side-by-side JSON comparison
- **When to use:** Compare page only
- **Old name:** JsonCompare (already clear!)

### 4. **ViewerActions** (Utility)
- **Purpose:** Share, embed, export buttons
- **When to use:** Any page needing these actions
- **Old name:** JsonActionButtons (already clear!)

---

## File Structure Details

### Viewer/ (Primary - 687 lines)

**Current:** One monolithic file
**Refactored:** Split into logical pieces

```typescript
// Viewer/index.tsx (main component)
export const Viewer = ({ jsonString, initialMode = 'tree' }) => {
  const [mode, setMode] = useState(initialMode);
  
  return (
    <div>
      <ViewerModeSelector mode={mode} onChange={setMode} />
      {mode === 'tree' && <TreeView data={parsed} />}
      {mode === 'raw' && <RawView data={parsed} />}
      {mode === 'flow' && <FlowView data={parsed} />}
    </div>
  );
};

// Viewer/TreeView.tsx (tree rendering logic)
export const TreeView = ({ data }) => {
  // Tree rendering implementation
};

// Viewer/RawView.tsx (raw JSON rendering)
export const RawView = ({ data }) => {
  // Raw rendering implementation
};

// Viewer/FlowView.tsx (flow diagram)
export const FlowView = ({ data }) => {
  // Flow diagram implementation
};
```

**Benefits:**
- Each mode in its own file
- Easier to understand
- Easier to maintain
- Can lazy-load modes

### EmbedViewer/ (Auto-optimizing - 251 lines)

```typescript
// EmbedViewer/index.tsx
export const EmbedViewer = ({ jsonString }) => {
  const shouldUseVirtualized = useMemo(() => {
    // Size detection logic
    return jsonSize > THRESHOLD;
  }, [jsonString]);
  
  return shouldUseVirtualized 
    ? <VirtualizedRenderer data={parsed} />
    : <BasicRenderer data={parsed} />;
};

// EmbedViewer/BasicRenderer.tsx (was SimpleJsonViewer)
export const BasicRenderer = ({ data }) => {
  // Simple rendering for small JSON
};

// EmbedViewer/VirtualizedRenderer.tsx (was VirtualJsonViewer)
export const VirtualizedRenderer = ({ data }) => {
  // Virtualized rendering for large JSON
};
```

---

## Migration Path

### Step 1: Commit current state
```bash
git add -A
git commit -m "checkpoint: before viewer refactoring"
```

### Step 2: Delete duplicate
```bash
rm components/features/viewer/json-viewer.tsx
```

### Step 3: Rename & reorganize
```bash
# Create new structure
mkdir -p components/features/viewer/Viewer
mkdir -p components/features/viewer/EmbedViewer
mkdir -p components/features/viewer/CompareViewer
mkdir -p components/features/viewer/ViewerActions

# Move and rename
mv components/features/viewer/ultra-optimized-viewer/UltraJsonViewer.tsx \
   components/features/viewer/Viewer/index.tsx

mv components/features/viewer/smart-json-viewer.tsx \
   components/features/viewer/EmbedViewer/index.tsx

mv components/features/viewer/simple-json-viewer.tsx \
   components/features/viewer/EmbedViewer/BasicRenderer.tsx

mv components/features/viewer/virtual-json-viewer.tsx \
   components/features/viewer/EmbedViewer/VirtualizedRenderer.tsx

mv components/features/viewer/json-compare.tsx \
   components/features/viewer/CompareViewer/index.tsx

mv components/features/viewer/json-action-buttons.tsx \
   components/features/viewer/ViewerActions/index.tsx

# Cleanup
rmdir components/features/viewer/ultra-optimized-viewer
```

### Step 4: Update imports in EmbedViewer/index.tsx
```typescript
// Before
import { VirtualJsonViewer } from './virtual-json-viewer';
import { SimpleJsonViewer } from './simple-json-viewer';

// After
import { VirtualizedRenderer } from './VirtualizedRenderer';
import { BasicRenderer } from './BasicRenderer';
```

### Step 5: Update barrel export (index.ts)
```typescript
/**
 * Viewer Components
 * 
 * Primary Components:
 * - Viewer: Main JSON viewer with tree/raw/flow modes (use for most cases)
 * - EmbedViewer: Auto-optimizing viewer for embed scenarios
 * - CompareViewer: Side-by-side JSON comparison
 * - ViewerActions: Share/embed/export action buttons
 */

// Primary viewer (was UltraJsonViewer)
export { Viewer } from './Viewer';

// Embed viewer (was SmartJsonViewer)
export { EmbedViewer } from './EmbedViewer';

// Specialized viewers
export { CompareViewer } from './CompareViewer';

// Utilities
export { ViewerActions } from './ViewerActions';

// Internal renderers (exported for advanced use cases)
export { BasicRenderer } from './EmbedViewer/BasicRenderer';
export { VirtualizedRenderer } from './EmbedViewer/VirtualizedRenderer';
```

### Step 6: Update app/ imports
```typescript
// app/page.tsx - Before
import { UltraJsonViewer } from '@/components/features/viewer/ultra-optimized-viewer/UltraJsonViewer';

// app/page.tsx - After
import { Viewer } from '@/components/features/viewer';

// Usage stays the same
<Viewer jsonString={data} initialViewMode="tree" />
```

```typescript
// app/embed/[id]/page.tsx - Before
import { SmartJsonViewer } from '@/components/features/viewer/smart-json-viewer';

// app/embed/[id]/page.tsx - After
import { EmbedViewer } from '@/components/features/viewer';

// Usage stays the same
<EmbedViewer jsonString={data} />
```

```typescript
// app/compare/page.tsx - Before
import { JsonCompare } from '@/components/features/viewer/json-compare';
import { JsonActionButtons } from '@/components/features/viewer/json-action-buttons';

// app/compare/page.tsx - After
import { CompareViewer, ViewerActions } from '@/components/features/viewer';

// Usage
<CompareViewer leftJson={left} rightJson={right} />
<ViewerActions />
```

### Step 7: Create README.md
```markdown
# Viewer Components

## Quick Start

### Primary Viewer (Most Common)
```tsx
import { Viewer } from '@/components/features/viewer';

<Viewer 
  jsonString={data}
  initialViewMode="tree"  // 'tree' | 'raw' | 'flow'
  height={600}
/>
```

### Embed Viewer (Auto-optimizing)
```tsx
import { EmbedViewer } from '@/components/features/viewer';

<EmbedViewer jsonString={data} />
// Automatically chooses best rendering strategy
```

### Compare Viewer
```tsx
import { CompareViewer } from '@/components/features/viewer';

<CompareViewer leftJson={json1} rightJson={json2} />
```

### Action Buttons
```tsx
import { ViewerActions } from '@/components/features/viewer';

<ViewerActions />
// Provides share, embed, export buttons
```

## Architecture

- **Viewer**: Primary viewer with tree/raw/flow modes
- **EmbedViewer**: Auto-optimizing (uses BasicRenderer or VirtualizedRenderer)
- **CompareViewer**: Side-by-side comparison
- **ViewerActions**: Utility buttons
```

### Step 8: Verify with Playwright
```bash
npm run build
npx playwright test tests/e2e/smoke.spec.ts --project=chromium
```

---

## Final Structure

```
components/features/viewer/
├── index.ts                          # Clean exports
├── README.md                         # Clear documentation
│
├── Viewer/                           # Primary (was UltraJsonViewer)
│   └── index.tsx                     # 687 lines
│
├── EmbedViewer/                      # Auto-optimizing (was SmartJsonViewer)
│   ├── index.tsx                     # 251 lines
│   ├── BasicRenderer.tsx             # 150 lines (was SimpleJsonViewer)
│   └── VirtualizedRenderer.tsx       # 413 lines (was VirtualJsonViewer)
│
├── CompareViewer/                    # Comparison (was JsonCompare)
│   └── index.tsx                     # 200 lines
│
└── ViewerActions/                    # Utilities (was JsonActionButtons)
    └── index.tsx                     # 150 lines

TOTAL: 1,851 lines (deleted 360 from JsonViewer duplicate)
```

---

## Benefits

✅ **Clear naming** - Purpose-based, not implementation-based
✅ **ALL features preserved** - Nothing deleted except duplicate
✅ **Easy to understand** - Viewer, EmbedViewer, CompareViewer, ViewerActions
✅ **Organized structure** - Related files grouped in folders
✅ **Better imports** - `import { Viewer } from '@/components/features/viewer'`
✅ **Documented** - README explains when to use each component
✅ **Maintainable** - Clear separation of concerns

---

## Ready to Execute?

This refactoring:
- ✅ Keeps ALL features
- ✅ Makes structure clear
- ✅ Improves naming
- ✅ Better organization
- ✅ Easier to understand

Shall I proceed?


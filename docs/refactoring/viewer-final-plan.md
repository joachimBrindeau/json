# Viewer Final Refactoring Plan - Each Mode Has Its Component

**Goal:** Clean structure where each view mode is its own component

---

## Final Structure

```
components/features/viewer/
├── index.ts                          # Public exports
├── README.md                         # Documentation
│
├── Viewer/                           # Main orchestrator
│   └── index.tsx                     # Switches between modes
│
├── TreeMode/                         # Tree view mode
│   ├── index.tsx                     # Main tree component
│   ├── TreeNode.tsx                  # Node rendering
│   ├── useTreeState.ts               # Expand/collapse logic
│   └── useTreeSearch.ts              # Search logic
│
├── RawMode/                          # Raw JSON mode
│   └── index.tsx                     # Formatted JSON display
│
├── FlowMode/                         # Flow diagram mode
│   └── index.tsx                     # Visual flow (wraps JsonFlowView)
│
├── CompareMode/                      # Comparison mode
│   └── index.tsx                     # Side-by-side diff
│
├── shared/                           # Shared utilities
│   ├── types.ts                      # Common types
│   ├── useJsonParser.ts              # JSON parsing hook
│   ├── useAutoOptimize.ts            # Auto-detect virtualization
│   └── ViewerActions.tsx             # Action buttons
│
└── [DELETE ALL OLD FILES]
```

---

## Component Breakdown

### 1. Viewer/ (Main Orchestrator - ~100 lines)

**Purpose:** Coordinate between modes, handle mode switching

```typescript
// Viewer/index.tsx
'use client';

import { useState, useMemo } from 'react';
import { TreeMode } from '../TreeMode';
import { RawMode } from '../RawMode';
import { FlowMode } from '../FlowMode';
import { ViewerActions } from '../shared/ViewerActions';
import { useJsonParser } from '../shared/useJsonParser';
import { useAutoOptimize } from '../shared/useAutoOptimize';

export type ViewMode = 'tree' | 'raw' | 'flow';

interface ViewerProps {
  jsonString: string;
  initialMode?: ViewMode;
  enableActions?: boolean;
  height?: number;
}

export const Viewer = ({ 
  jsonString, 
  initialMode = 'tree',
  enableActions = true,
  height = 600
}: ViewerProps) => {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  
  // Parse JSON (shared logic)
  const { data, error, stats } = useJsonParser(jsonString);
  
  // Auto-detect if virtualization needed (shared logic)
  const { shouldVirtualize } = useAutoOptimize(jsonString, data);
  
  if (error) {
    return <div className="error">Invalid JSON: {error}</div>;
  }
  
  return (
    <div className="viewer-container">
      {/* Header with mode selector */}
      <div className="viewer-header">
        <ModeSelector mode={mode} onChange={setMode} />
        <Stats {...stats} />
        {enableActions && <ViewerActions />}
      </div>
      
      {/* Content - each mode is its own component */}
      <div className="viewer-content">
        {mode === 'tree' && (
          <TreeMode 
            data={data} 
            virtualized={shouldVirtualize}
            height={height}
          />
        )}
        
        {mode === 'raw' && (
          <RawMode 
            data={data}
            height={height}
          />
        )}
        
        {mode === 'flow' && (
          <FlowMode 
            data={data}
            height={height}
          />
        )}
      </div>
    </div>
  );
};
```

---

### 2. TreeMode/ (Tree View - ~300 lines)

**Purpose:** Hierarchical tree rendering with expand/collapse

**Files:**
- `index.tsx` - Main tree component
- `TreeNode.tsx` - Individual node rendering
- `useTreeState.ts` - Expand/collapse state management
- `useTreeSearch.ts` - Search/filter logic

```typescript
// TreeMode/index.tsx
'use client';

import { useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { TreeNode } from './TreeNode';
import { useTreeState } from './useTreeState';
import { useTreeSearch } from './useTreeSearch';

interface TreeModeProps {
  data: any;
  virtualized?: boolean;
  height?: number;
}

export const TreeMode = ({ data, virtualized = false, height = 600 }: TreeModeProps) => {
  // Convert data to tree nodes
  const { nodes, expandedNodes, toggleNode } = useTreeState(data);
  
  // Search functionality
  const { searchTerm, setSearchTerm, filteredNodes } = useTreeSearch(nodes);
  
  // Virtualized rendering for large datasets
  if (virtualized) {
    return (
      <div>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <List
          height={height}
          itemCount={filteredNodes.length}
          itemSize={(index) => 32}
          width="100%"
        >
          {({ index, style }) => (
            <TreeNode
              node={filteredNodes[index]}
              isExpanded={expandedNodes.has(filteredNodes[index].id)}
              onToggle={toggleNode}
              searchTerm={searchTerm}
              style={style}
            />
          )}
        </List>
      </div>
    );
  }
  
  // Simple rendering for small datasets
  return (
    <div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <div className="tree-nodes">
        {filteredNodes.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            isExpanded={expandedNodes.has(node.id)}
            onToggle={toggleNode}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
};
```

```typescript
// TreeMode/TreeNode.tsx
'use client';

import { memo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface TreeNodeProps {
  node: JsonNode;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  searchTerm?: string;
  style?: React.CSSProperties;
}

export const TreeNode = memo(({ 
  node, 
  isExpanded, 
  onToggle, 
  searchTerm,
  style 
}: TreeNodeProps) => {
  const hasChildren = node.childCount > 0;
  const isHighlighted = searchTerm && 
    node.key.toLowerCase().includes(searchTerm.toLowerCase());
  
  return (
    <div 
      style={style}
      className={`tree-node ${isHighlighted ? 'highlighted' : ''}`}
    >
      {/* Indentation */}
      <div style={{ marginLeft: `${node.level * 16}px` }} />
      
      {/* Expand/collapse button */}
      {hasChildren && (
        <button onClick={() => onToggle(node.id)}>
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </button>
      )}
      
      {/* Key */}
      <span className="node-key">{node.key}:</span>
      
      {/* Value */}
      <span className={`node-value type-${node.type}`}>
        {formatValue(node.value, node.type)}
      </span>
    </div>
  );
});
```

---

### 3. RawMode/ (Raw JSON - ~50 lines)

**Purpose:** Display formatted JSON text

```typescript
// RawMode/index.tsx
'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RawModeProps {
  data: any;
  height?: number;
}

export const RawMode = ({ data, height = 600 }: RawModeProps) => {
  const formatted = useMemo(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);
  
  return (
    <ScrollArea style={{ height }}>
      <pre className="raw-json">
        <code>{formatted}</code>
      </pre>
    </ScrollArea>
  );
};
```

---

### 4. FlowMode/ (Flow Diagram - ~50 lines)

**Purpose:** Visual flow diagram (wraps existing JsonFlowView)

```typescript
// FlowMode/index.tsx
'use client';

import dynamic from 'next/dynamic';

const JsonFlowView = dynamic(
  () => import('@/components/features/flow-diagram/JsonFlowView'),
  { 
    ssr: false,
    loading: () => <div>Loading flow view...</div>
  }
);

interface FlowModeProps {
  data: any;
  height?: number;
}

export const FlowMode = ({ data, height = 600 }: FlowModeProps) => {
  return (
    <div style={{ height }}>
      <JsonFlowView data={data} />
    </div>
  );
};
```

---

### 5. CompareMode/ (Comparison - ~200 lines)

**Purpose:** Side-by-side JSON comparison

```typescript
// CompareMode/index.tsx
'use client';

import { useMemo } from 'react';
import { TreeMode } from '../TreeMode';
import { useDiff } from './useDiff';

interface CompareModeProps {
  leftData: any;
  rightData: any;
  height?: number;
}

export const CompareMode = ({ leftData, rightData, height = 600 }: CompareModeProps) => {
  const { differences, leftHighlights, rightHighlights } = useDiff(leftData, rightData);
  
  return (
    <div className="compare-container">
      <div className="compare-stats">
        {differences.length} differences found
      </div>
      
      <div className="compare-panels">
        <div className="compare-left">
          <TreeMode 
            data={leftData} 
            height={height}
            highlights={leftHighlights}
          />
        </div>
        
        <div className="compare-right">
          <TreeMode 
            data={rightData} 
            height={height}
            highlights={rightHighlights}
          />
        </div>
      </div>
    </div>
  );
};
```

---

### 6. shared/ (Shared Utilities)

**Purpose:** Reusable logic across modes

```typescript
// shared/useJsonParser.ts
export const useJsonParser = (jsonString: string) => {
  return useMemo(() => {
    try {
      const data = JSON.parse(jsonString);
      const stats = {
        size: jsonString.length,
        type: Array.isArray(data) ? 'array' : typeof data,
        keys: Object.keys(data).length
      };
      return { data, stats, error: null };
    } catch (e) {
      return { data: null, stats: null, error: e.message };
    }
  }, [jsonString]);
};

// shared/useAutoOptimize.ts
export const useAutoOptimize = (jsonString: string, data: any) => {
  return useMemo(() => {
    const size = jsonString.length;
    const shouldVirtualize = size > 1024 * 1024; // 1MB
    return { shouldVirtualize };
  }, [jsonString, data]);
};

// shared/ViewerActions.tsx
export const ViewerActions = () => {
  return (
    <div className="viewer-actions">
      <ShareButton />
      <EmbedButton />
      <ExportButton />
    </div>
  );
};
```

---

## What Gets Deleted

### Delete ALL old files:
1. ✅ `json-viewer.tsx` (360 lines) - Duplicate
2. ✅ `simple-json-viewer.tsx` (165 lines) - Wrapper
3. ✅ `smart-json-viewer.tsx` (251 lines) - Merge logic into Viewer
4. ✅ `virtual-json-viewer.tsx` (413 lines) - Merge into TreeMode
5. ✅ `ultra-optimized-viewer/UltraJsonViewer.tsx` (687 lines) - Split into modes
6. ✅ `json-compare.tsx` (200 lines) - Becomes CompareMode
7. ✅ `json-action-buttons.tsx` (150 lines) - Becomes shared/ViewerActions

**Total deleted: 2,226 lines**

---

## New File Sizes

```
Viewer/index.tsx              ~100 lines  (orchestrator)
TreeMode/index.tsx            ~150 lines  (tree rendering)
TreeMode/TreeNode.tsx         ~80 lines   (node component)
TreeMode/useTreeState.ts      ~100 lines  (state management)
TreeMode/useTreeSearch.ts     ~50 lines   (search logic)
RawMode/index.tsx             ~50 lines   (raw display)
FlowMode/index.tsx            ~50 lines   (flow wrapper)
CompareMode/index.tsx         ~200 lines  (comparison)
shared/useJsonParser.ts       ~30 lines   (parsing)
shared/useAutoOptimize.ts     ~30 lines   (optimization)
shared/ViewerActions.tsx      ~100 lines  (actions)
shared/types.ts               ~50 lines   (types)

TOTAL: ~990 lines (vs 2,226 lines = 56% reduction)
```

---

## Benefits

✅ **Each mode is its own component** - Clear separation
✅ **No wrappers** - Direct, clean code
✅ **Shared logic extracted** - DRY principle
✅ **Easy to understand** - Each file has one job
✅ **Easy to test** - Each mode can be tested independently
✅ **Easy to extend** - Add new modes easily
✅ **56% less code** - Eliminated duplication

---

## Public API

```typescript
// Simple usage
import { Viewer } from '@/components/features/viewer';

<Viewer jsonString={data} />

// With specific mode
<Viewer jsonString={data} initialMode="tree" />

// Individual modes (advanced)
import { TreeMode, RawMode, FlowMode } from '@/components/features/viewer';

<TreeMode data={parsed} />
<RawMode data={parsed} />
<FlowMode data={parsed} />

// Comparison
import { CompareMode } from '@/components/features/viewer';

<CompareMode leftData={json1} rightData={json2} />
```

---

## Migration Steps

1. Create new structure with mode components
2. Extract shared logic (useJsonParser, useAutoOptimize, etc)
3. Build TreeMode from UltraJsonViewer + VirtualJsonViewer
4. Build RawMode (simple)
5. Build FlowMode (wrapper)
6. Build CompareMode from json-compare
7. Build Viewer orchestrator
8. Delete all old files
9. Update imports in app/
10. Test with Playwright

---

**This gives you:**
- Each mode = its own component ✅
- Clean structure ✅
- No duplication ✅
- All features preserved ✅

**Ready to execute?**


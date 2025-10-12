# Viewer Clean Structure - Hierarchical Names, Flat Structure

**Goal:** Clean, flat structure with hierarchical naming

---

## Final Structure (FLAT)

```
components/features/viewer/
├── index.ts                          # Public exports
├── README.md                         # Documentation
│
├── Viewer.tsx                        # Main orchestrator (~100 lines)
│
├── ViewerTree.tsx                    # Tree view mode (~150 lines)
├── ViewerTreeNode.tsx                # Tree node component (~80 lines)
├── ViewerTreeState.ts                # Tree state hook (~100 lines)
├── ViewerTreeSearch.ts               # Tree search hook (~50 lines)
│
├── ViewerRaw.tsx                     # Raw JSON mode (~50 lines)
│
├── ViewerFlow.tsx                    # Flow diagram mode (~50 lines)
│
├── ViewerCompare.tsx                 # Comparison mode (~200 lines)
│
├── ViewerActions.tsx                 # Action buttons (~100 lines)
│
├── useJsonParser.ts                  # JSON parsing hook (~30 lines)
├── useAutoOptimize.ts                # Auto-optimization hook (~30 lines)
└── types.ts                          # Shared types (~50 lines)

TOTAL: 13 files, ~990 lines
```

---

## Naming Convention

**Pattern:** `Viewer[Feature]`

- **Viewer.tsx** - Main component
- **ViewerTree.tsx** - Tree mode
- **ViewerTreeNode.tsx** - Tree node (sub-component)
- **ViewerTreeState.ts** - Tree state (hook)
- **ViewerTreeSearch.ts** - Tree search (hook)
- **ViewerRaw.tsx** - Raw mode
- **ViewerFlow.tsx** - Flow mode
- **ViewerCompare.tsx** - Compare mode
- **ViewerActions.tsx** - Action buttons

**Benefits:**
- ✅ All viewer files grouped together alphabetically
- ✅ Clear hierarchy through naming
- ✅ No unnecessary folders
- ✅ Easy to find files
- ✅ Flat structure

---

## Component Details

### Viewer.tsx (Main Orchestrator)

```typescript
'use client';

import { useState } from 'react';
import { ViewerTree } from './ViewerTree';
import { ViewerRaw } from './ViewerRaw';
import { ViewerFlow } from './ViewerFlow';
import { ViewerActions } from './ViewerActions';
import { useJsonParser } from './useJsonParser';
import { useAutoOptimize } from './useAutoOptimize';

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
  const { data, error, stats } = useJsonParser(jsonString);
  const { shouldVirtualize } = useAutoOptimize(jsonString, data);
  
  if (error) return <div>Invalid JSON: {error}</div>;
  
  return (
    <div className="viewer">
      <div className="viewer-header">
        <ModeSelector mode={mode} onChange={setMode} />
        <Stats {...stats} />
        {enableActions && <ViewerActions />}
      </div>
      
      <div className="viewer-content">
        {mode === 'tree' && <ViewerTree data={data} virtualized={shouldVirtualize} height={height} />}
        {mode === 'raw' && <ViewerRaw data={data} height={height} />}
        {mode === 'flow' && <ViewerFlow data={data} height={height} />}
      </div>
    </div>
  );
};
```

---

### ViewerTree.tsx (Tree Mode)

```typescript
'use client';

import { VariableSizeList as List } from 'react-window';
import { ViewerTreeNode } from './ViewerTreeNode';
import { useViewerTreeState } from './ViewerTreeState';
import { useViewerTreeSearch } from './ViewerTreeSearch';

interface ViewerTreeProps {
  data: any;
  virtualized?: boolean;
  height?: number;
}

export const ViewerTree = ({ data, virtualized = false, height = 600 }: ViewerTreeProps) => {
  const { nodes, expandedNodes, toggleNode } = useViewerTreeState(data);
  const { searchTerm, setSearchTerm, filteredNodes } = useViewerTreeSearch(nodes);
  
  if (virtualized) {
    return (
      <div>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <List height={height} itemCount={filteredNodes.length} itemSize={() => 32}>
          {({ index, style }) => (
            <ViewerTreeNode
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
  
  return (
    <div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      {filteredNodes.map(node => (
        <ViewerTreeNode
          key={node.id}
          node={node}
          isExpanded={expandedNodes.has(node.id)}
          onToggle={toggleNode}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
};
```

---

### ViewerTreeNode.tsx (Tree Node Component)

```typescript
'use client';

import { memo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { JsonNode } from './types';

interface ViewerTreeNodeProps {
  node: JsonNode;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  searchTerm?: string;
  style?: React.CSSProperties;
}

export const ViewerTreeNode = memo(({ 
  node, 
  isExpanded, 
  onToggle, 
  searchTerm,
  style 
}: ViewerTreeNodeProps) => {
  const hasChildren = node.childCount > 0;
  const isHighlighted = searchTerm && 
    node.key.toLowerCase().includes(searchTerm.toLowerCase());
  
  return (
    <div style={style} className={`tree-node ${isHighlighted ? 'highlighted' : ''}`}>
      <div style={{ marginLeft: `${node.level * 16}px` }} />
      {hasChildren && (
        <button onClick={() => onToggle(node.id)}>
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </button>
      )}
      <span className="node-key">{node.key}:</span>
      <span className={`node-value type-${node.type}`}>
        {formatValue(node.value, node.type)}
      </span>
    </div>
  );
});

ViewerTreeNode.displayName = 'ViewerTreeNode';
```

---

### ViewerRaw.tsx (Raw Mode)

```typescript
'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewerRawProps {
  data: any;
  height?: number;
}

export const ViewerRaw = ({ data, height = 600 }: ViewerRawProps) => {
  const formatted = useMemo(() => JSON.stringify(data, null, 2), [data]);
  
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

### ViewerFlow.tsx (Flow Mode)

```typescript
'use client';

import dynamic from 'next/dynamic';

const JsonFlowView = dynamic(
  () => import('@/components/features/flow-diagram/JsonFlowView'),
  { ssr: false, loading: () => <div>Loading...</div> }
);

interface ViewerFlowProps {
  data: any;
  height?: number;
}

export const ViewerFlow = ({ data, height = 600 }: ViewerFlowProps) => {
  return (
    <div style={{ height }}>
      <JsonFlowView data={data} />
    </div>
  );
};
```

---

### ViewerCompare.tsx (Compare Mode)

```typescript
'use client';

import { useMemo } from 'react';
import { ViewerTree } from './ViewerTree';

interface ViewerCompareProps {
  leftData: any;
  rightData: any;
  height?: number;
}

export const ViewerCompare = ({ leftData, rightData, height = 600 }: ViewerCompareProps) => {
  const differences = useMemo(() => {
    // Diff logic
    return [];
  }, [leftData, rightData]);
  
  return (
    <div className="compare-container">
      <div className="compare-stats">{differences.length} differences</div>
      <div className="compare-panels">
        <div className="compare-left">
          <ViewerTree data={leftData} height={height} />
        </div>
        <div className="compare-right">
          <ViewerTree data={rightData} height={height} />
        </div>
      </div>
    </div>
  );
};
```

---

### ViewerActions.tsx (Action Buttons)

```typescript
'use client';

import { UnifiedShareModal } from '@/components/features/modals';
import { EmbedModal } from '@/components/features/modals';
import { ExportModal } from '@/components/features/modals';

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

### Hooks

```typescript
// useJsonParser.ts
export const useJsonParser = (jsonString: string) => {
  return useMemo(() => {
    try {
      const data = JSON.parse(jsonString);
      return { data, error: null, stats: { size: jsonString.length } };
    } catch (e) {
      return { data: null, error: e.message, stats: null };
    }
  }, [jsonString]);
};

// useAutoOptimize.ts
export const useAutoOptimize = (jsonString: string, data: any) => {
  return useMemo(() => {
    const shouldVirtualize = jsonString.length > 1024 * 1024; // 1MB
    return { shouldVirtualize };
  }, [jsonString]);
};

// ViewerTreeState.ts
export const useViewerTreeState = (data: any) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const nodes = useMemo(() => flattenToNodes(data), [data]);
  const toggleNode = useCallback((id) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  return { nodes, expandedNodes, toggleNode };
};

// ViewerTreeSearch.ts
export const useViewerTreeSearch = (nodes: JsonNode[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes;
    return nodes.filter(n => n.key.includes(searchTerm));
  }, [nodes, searchTerm]);
  return { searchTerm, setSearchTerm, filteredNodes };
};
```

---

## Public API (index.ts)

```typescript
/**
 * Viewer Components
 * 
 * Main Components:
 * - Viewer: Primary JSON viewer with tree/raw/flow modes
 * - ViewerCompare: Side-by-side comparison
 * 
 * Individual Modes (advanced usage):
 * - ViewerTree: Tree view mode
 * - ViewerRaw: Raw JSON mode
 * - ViewerFlow: Flow diagram mode
 * 
 * Utilities:
 * - ViewerActions: Share/embed/export buttons
 */

// Main components
export { Viewer } from './Viewer';
export { ViewerCompare } from './ViewerCompare';

// Individual modes (for advanced usage)
export { ViewerTree } from './ViewerTree';
export { ViewerRaw } from './ViewerRaw';
export { ViewerFlow } from './ViewerFlow';

// Utilities
export { ViewerActions } from './ViewerActions';

// Types
export type { ViewMode, JsonNode } from './types';
```

---

## File Organization

All files in one flat directory, grouped by prefix:

```
viewer/
├── Viewer.tsx                    # Main
├── ViewerActions.tsx             # Actions
├── ViewerCompare.tsx             # Compare
├── ViewerFlow.tsx                # Flow mode
├── ViewerRaw.tsx                 # Raw mode
├── ViewerTree.tsx                # Tree mode
├── ViewerTreeNode.tsx            # Tree node
├── ViewerTreeSearch.ts           # Tree search hook
├── ViewerTreeState.ts            # Tree state hook
├── index.ts                      # Exports
├── types.ts                      # Types
├── useAutoOptimize.ts            # Hook
└── useJsonParser.ts              # Hook
```

**Alphabetically sorted, easy to find!**

---

## What Gets Deleted

All 7 old files:
1. ✅ json-viewer.tsx
2. ✅ simple-json-viewer.tsx
3. ✅ smart-json-viewer.tsx
4. ✅ virtual-json-viewer.tsx
5. ✅ ultra-optimized-viewer/UltraJsonViewer.tsx
6. ✅ json-compare.tsx
7. ✅ json-action-buttons.tsx

---

## Benefits

✅ **Flat structure** - No unnecessary folders
✅ **Hierarchical naming** - Clear relationships through names
✅ **Easy to find** - Alphabetically sorted
✅ **Clear grouping** - All Viewer* files together
✅ **56% less code** - 990 lines vs 2,226 lines
✅ **All features preserved**

---

**Ready to execute?**


# Flow Components - DRY KISS SOLID Audit

## Executive Summary

Found **7 major opportunities** for simplification and streamlining in Flow components:
- **~150 lines of duplicate code** across node components
- **4 reusable components** can be extracted
- **2 custom hooks** can consolidate logic
- **Estimated effort:** 4-6 hours
- **Impact:** HIGH - Better maintainability, consistency, testability

---

## 🔴 Critical Issues (DRY Violations)

### 1. **Duplicate NodeToolbar Implementation**
**Files:** `FlowObjectNode.tsx` (lines 42-102), `FlowArrayNode.tsx` (lines 42-85)  
**Duplicate Lines:** ~44 lines × 2 = 88 lines  
**Severity:** HIGH

**Problem:**
Both components have nearly identical NodeToolbar implementations with:
- Same structure and styling
- Same buttons (Copy, Expand/Collapse)
- Same connection stats display
- Same event handlers

**Current Code (FlowObjectNode.tsx):**
```typescript
<NodeToolbar
  isVisible
  position={Position.Top}
  align="center"
  offset={10}
  className="flex gap-1 bg-white dark:bg-gray-950 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-800"
>
  <button onClick={handleCopy} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" title="Copy JSON">
    <Copy className="h-3.5 w-3.5" />
  </button>
  {hasChildren && onToggleCollapse && (
    <button onClick={handleToggle} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" title={isCollapsed ? 'Expand' : 'Collapse'}>
      {isCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
    </button>
  )}
  <div className="flex items-center gap-2 px-2 text-xs text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800">
    {/* Connection stats */}
  </div>
</NodeToolbar>
```

**Same code in FlowArrayNode.tsx (lines 42-85)**

**Solution:**
Extract to `FlowNodeToolbar` component:

```typescript
// components/features/viewer/flow/FlowNodeToolbar.tsx
interface FlowNodeToolbarProps {
  nodeId: string;
  stringifiedJson: string;
  hasChildren: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (nodeId: string) => void;
  sourceConnections: Connection[];
  targetConnections: Connection[];
  connectedNodesData: Node[];
  copyDescription: string; // "Object JSON" or "Array JSON"
}

export const FlowNodeToolbar = ({ ... }: FlowNodeToolbarProps) => {
  const { toast } = useToast();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(stringifiedJson);
    toast({ title: 'Copied!', description: copyDescription });
  };

  const handleToggle = () => {
    if (onToggleCollapse) onToggleCollapse(nodeId);
  };

  return (
    <NodeToolbar isVisible position={Position.Top} align="center" offset={10} className={TOOLBAR_STYLES}>
      <ToolbarButton onClick={handleCopy} title="Copy JSON" icon={Copy} />
      {hasChildren && onToggleCollapse && (
        <ToolbarButton 
          onClick={handleToggle} 
          title={isCollapsed ? 'Expand' : 'Collapse'}
          icon={isCollapsed ? Maximize2 : Minimize2}
        />
      )}
      <ConnectionStats 
        sourceConnections={sourceConnections}
        targetConnections={targetConnections}
        connectedNodesData={connectedNodesData}
      />
    </NodeToolbar>
  );
};
```

**Benefits:**
- Eliminates 88 lines of duplicate code
- Single source of truth for toolbar behavior
- Easier to add new toolbar features
- Consistent styling and behavior

---

### 2. **Duplicate Node Hooks Pattern**
**Files:** `FlowObjectNode.tsx` (lines 11-38), `FlowArrayNode.tsx` (lines 12-38)  
**Duplicate Lines:** ~27 lines × 2 = 54 lines  
**Severity:** HIGH

**Problem:**
Both components use identical hook patterns:

```typescript
const edges = useEdges();
const { toast } = useToast();
const hasChildren = edges.some((edge) => edge.source === id);

// Track connections
const sourceConnections = useHandleConnections({ type: 'source', nodeId: id });
const targetConnections = useHandleConnections({ type: 'target', nodeId: id });

// Get connected nodes data
const connectedNodeIds = sourceConnections.map(conn => conn.target);
const connectedNodesData = useNodesData(connectedNodeIds);

const handleCopy = () => { /* ... */ };
const handleToggle = () => { /* ... */ };
```

**Solution:**
Create `useFlowNodeToolbar` custom hook:

```typescript
// components/features/viewer/flow/hooks/useFlowNodeToolbar.ts
interface UseFlowNodeToolbarParams {
  nodeId: string;
  stringifiedJson: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (nodeId: string) => void;
  copyDescription: string;
}

export const useFlowNodeToolbar = ({
  nodeId,
  stringifiedJson,
  isCollapsed,
  onToggleCollapse,
  copyDescription,
}: UseFlowNodeToolbarParams) => {
  const edges = useEdges();
  const { toast } = useToast();
  
  const hasChildren = edges.some((edge) => edge.source === nodeId);
  
  const sourceConnections = useHandleConnections({ type: 'source', nodeId });
  const targetConnections = useHandleConnections({ type: 'target', nodeId });
  
  const connectedNodeIds = sourceConnections.map(conn => conn.target);
  const connectedNodesData = useNodesData(connectedNodeIds);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(stringifiedJson);
    toast({ title: 'Copied!', description: copyDescription });
  }, [stringifiedJson, copyDescription, toast]);

  const handleToggle = useCallback(() => {
    if (onToggleCollapse) onToggleCollapse(nodeId);
  }, [nodeId, onToggleCollapse]);

  return {
    hasChildren,
    sourceConnections,
    targetConnections,
    connectedNodesData,
    handleCopy,
    handleToggle,
  };
};
```

**Usage:**
```typescript
// FlowObjectNode.tsx
const toolbarProps = useFlowNodeToolbar({
  nodeId: id,
  stringifiedJson: data.stringifiedJson,
  isCollapsed: data.isCollapsed,
  onToggleCollapse: data.onToggleCollapse,
  copyDescription: 'Object JSON copied to clipboard',
});

return (
  <>
    <FlowNodeToolbar {...toolbarProps} nodeId={id} stringifiedJson={data.stringifiedJson} />
    <FlowNodeShell nodeId={id} nodeType={NodeType.Object}>
      {/* ... */}
    </FlowNodeShell>
  </>
);
```

**Benefits:**
- Eliminates 54 lines of duplicate code
- Centralized connection tracking logic
- Easier to test
- Consistent behavior across nodes

---

### 3. **Duplicate Styling Constants**
**Files:** Multiple node components  
**Duplicate Lines:** ~10 occurrences  
**Severity:** MEDIUM

**Problem:**
Repeated className strings:
- Toolbar: `"flex gap-1 bg-white dark:bg-gray-950 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-800"`
- Button: `"p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"`
- Stats: `"flex items-center gap-2 px-2 text-xs text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800"`

**Solution:**
Create style constants file:

```typescript
// components/features/viewer/flow/utils/flow-styles.ts
export const FLOW_STYLES = {
  toolbar: 'flex gap-1 bg-white dark:bg-gray-950 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-800',
  toolbarButton: 'p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors',
  connectionStats: 'flex items-center gap-2 px-2 text-xs text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-800',
  connectionStat: 'flex items-center gap-1',
} as const;
```

**Benefits:**
- Single source of truth for styling
- Easy to update styles globally
- Better consistency
- Reduced bundle size (string deduplication)

---

## 🟡 Medium Priority Issues (KISS Violations)

### 4. **Complex Conditional Rendering in FlowPrimitiveNode**
**File:** `FlowPrimitiveNode.tsx` (lines 14-30)  
**Severity:** MEDIUM

**Problem:**
Four separate conditional blocks for rendering different data types:

```typescript
{data.dataType === JsonDataType.String && <span>{data.stringifiedJson}</span>}
{data.dataType === JsonDataType.Number && <span>{data.value}</span>}
{data.dataType === JsonDataType.Boolean && <FlowBooleanChip value={data.value} />}
{data.dataType === JsonDataType.Null && <FlowNullChip />}
```

**Solution:**
Use lookup pattern (KISS):

```typescript
const PRIMITIVE_RENDERERS = {
  [JsonDataType.String]: (data: PrimitiveNodeData) => (
    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-mono">
      {data.stringifiedJson}
    </span>
  ),
  [JsonDataType.Number]: (data: PrimitiveNodeData) => (
    <span className="text-green-600 font-mono text-sm">{data.value}</span>
  ),
  [JsonDataType.Boolean]: (data: PrimitiveNodeData) => (
    <FlowBooleanChip value={data.value as boolean} size="sm" />
  ),
  [JsonDataType.Null]: () => <FlowNullChip size="sm" />,
} as const;

// In component:
const PrimitiveNodeComponent = ({ id, data }: NodeProps<PrimitiveNodeData>) => {
  const renderer = PRIMITIVE_RENDERERS[data.dataType];
  
  return (
    <FlowNodeShell nodeId={id} nodeType={NodeType.Primitive}>
      <FlowNodeHandles nodeId={id} hasDefaultTarget hasDefaultSource={false} />
      <div className="text-center">{renderer(data)}</div>
    </FlowNodeShell>
  );
};
```

**Benefits:**
- Simpler, more readable code
- Easier to add new data types
- Better performance (no multiple conditionals)
- Follows KISS principle

---

### 5. **Duplicate Parser Logic for Object/Array**
**File:** `flow-parser.ts` (lines 309-343)  
**Severity:** MEDIUM

**Problem:**
Nearly identical logic for parsing objects vs arrays:

```typescript
if (isObject(json)) {
  const childCount = Object.keys(json).length;
  const rootNode = createRootNode(rootNodeId, 'object', childCount);
  flowNodes.push(rootNode);
  
  const nextDepth = ROOT_NODE_DEPTH + 1;
  const nextParentNodePathIds = [rootNodeId];
  const objectNodes = parseObject(context, json, nextDepth, nextParentNodePathIds, null, false);
  flowNodes.push(...objectNodes);
  
  if (objectNodes.length > 0) {
    context.defaultEdges.push(createDefaultEdge({ ... }));
  }
} else if (isArray(json)) {
  // Nearly identical code for arrays
}
```

**Solution:**
Extract common logic:

```typescript
const parseRootData = (
  context: ParserContext,
  json: object | unknown[],
  rootNodeId: string,
  type: 'object' | 'array'
): SeaNode[] => {
  const childCount = type === 'object' ? Object.keys(json).length : (json as unknown[]).length;
  const rootNode = createRootNode(rootNodeId, type, childCount);
  
  const nextDepth = ROOT_NODE_DEPTH + 1;
  const nextParentNodePathIds = [rootNodeId];
  
  const childNodes = type === 'object'
    ? parseObject(context, json as object, nextDepth, nextParentNodePathIds, null, false)
    : parseArray(context, json as unknown[], nextDepth, nextParentNodePathIds, rootNodeId, undefined);
  
  // Create edge from root to first child (only for objects)
  if (type === 'object' && childNodes.length > 0) {
    context.defaultEdges.push(createDefaultEdge({
      sourceNodeId: rootNodeId,
      targetNodeId: childNodes[0].id,
      sourceHandleId: 'root-output',
      targetHandleId: undefined,
    }));
  }
  
  return [rootNode, ...childNodes];
};

// Usage:
export const jsonParser = (json: object | unknown[]): { flowNodes: SeaNode[]; edges: Edge[] } => {
  const context: ParserContext = { ... };
  const rootNodeId = formatNodeId(context.nodeSequence);
  context.nodeSequence++;
  
  const flowNodes = isObject(json)
    ? parseRootData(context, json, rootNodeId, 'object')
    : parseRootData(context, json, rootNodeId, 'array');
  
  return { flowNodes, edges: [...context.defaultEdges, ...context.chainEdges] };
};
```

**Benefits:**
- Eliminates ~20 lines of duplicate code
- Single source of truth for root parsing
- Easier to maintain
- Follows DRY principle

---

## 🟢 Low Priority Issues (SOLID Violations)

### 6. **Missing Component Abstraction - ToolbarButton**
**Severity:** LOW

**Problem:**
Toolbar buttons are inline JSX with repeated structure.

**Solution:**
```typescript
// components/features/viewer/flow/ToolbarButton.tsx
interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  icon: LucideIcon;
}

export const ToolbarButton = ({ onClick, title, icon: Icon }: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    className={FLOW_STYLES.toolbarButton}
    title={title}
  >
    <Icon className="h-3.5 w-3.5" />
  </button>
);
```

---

### 7. **Missing Component Abstraction - ConnectionStats**
**Severity:** LOW

**Problem:**
Connection stats display is duplicated.

**Solution:**
```typescript
// components/features/viewer/flow/ConnectionStats.tsx
interface ConnectionStatsProps {
  sourceConnections: Connection[];
  targetConnections: Connection[];
  connectedNodesData: Node[];
}

export const ConnectionStats = ({
  sourceConnections,
  targetConnections,
  connectedNodesData,
}: ConnectionStatsProps) => (
  <div className={FLOW_STYLES.connectionStats}>
    <div className={FLOW_STYLES.connectionStat} title={`Incoming: ${targetConnections.length}`}>
      <ArrowDownToLine className="h-3 w-3" />
      <span>{targetConnections.length}</span>
    </div>
    <div
      className={FLOW_STYLES.connectionStat}
      title={
        connectedNodesData.length > 0
          ? `Connected to: ${connectedNodesData.map(n => n?.data?.label || n?.id).join(', ')}`
          : `Outgoing: ${sourceConnections.length}`
      }
    >
      <ArrowUpFromLine className="h-3 w-3" />
      <span>{sourceConnections.length}</span>
    </div>
  </div>
);
```

---

## Implementation Plan

### Phase 1: Extract Reusable Components (2 hours)
1. Create `flow-styles.ts` with style constants
2. Create `ToolbarButton.tsx` component
3. Create `ConnectionStats.tsx` component
4. Create `FlowNodeToolbar.tsx` component

### Phase 2: Create Custom Hook (1 hour)
5. Create `useFlowNodeToolbar.ts` hook
6. Update FlowObjectNode to use hook
7. Update FlowArrayNode to use hook

### Phase 3: Simplify Logic (1 hour)
8. Refactor FlowPrimitiveNode with lookup pattern
9. Refactor flow-parser.ts with parseRootData

### Phase 4: Testing (1 hour)
10. Test all node types render correctly
11. Test toolbar interactions
12. Test connection tracking
13. Verify no regressions

**Total Effort:** 4-6 hours  
**Lines Reduced:** ~150 lines  
**Components Created:** 4  
**Hooks Created:** 1

---

## Success Metrics

**Before:**
- Duplicate code: ~150 lines
- Node components: 113-122 lines each
- Reusable components: 0
- Custom hooks: 0

**After:**
- Duplicate code: <10 lines
- Node components: ~40-50 lines each (60% reduction)
- Reusable components: 4
- Custom hooks: 1
- Maintainability: ⭐⭐⭐⭐⭐


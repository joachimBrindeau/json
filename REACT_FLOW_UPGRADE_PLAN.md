# React Flow Upgrade Plan

## Overview

Comprehensive plan to upgrade from legacy `reactflow` v11 to modern `@xyflow/react` and implement all latest features.

## Current Status

- **Package:** `reactflow` v11.11.4 (LEGACY)
- **Target:** `@xyflow/react` v12+ (MODERN)
- **Total Tasks:** 12
- **Estimated Effort:** 2-3 weeks

## Task Breakdown

### Phase 1: Core Migration (Week 1)

#### Task 1: Upgrade React Flow to @xyflow/react
**Priority:** 🔴 CRITICAL  
**Effort:** Medium  
**Impact:** High

**Actions:**
1. Update package.json dependency
2. Run `npm install @xyflow/react`
3. Remove old `reactflow` package
4. Verify installation

**Files:**
- `package.json`

**Command:**
```bash
npm uninstall reactflow
npm install @xyflow/react
```

---

#### Task 2: Update React Flow imports across codebase
**Priority:** 🔴 CRITICAL  
**Effort:** Low  
**Impact:** High

**Changes Required:**

**Before:**
```typescript
import ReactFlow, { ... } from 'reactflow';
import 'reactflow/dist/style.css';
```

**After:**
```typescript
import { ReactFlow, ... } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
```

**Files to Update:**
- `components/features/viewer/flow/FlowView.tsx`
- `components/features/viewer/ViewerFlow.tsx`
- `components/features/viewer/flow/hooks/useFlowNodes.ts`
- `components/features/viewer/flow/hooks/useFlowParser.ts`
- All custom node components
- All custom edge components

---

#### Task 3: Refactor to use useNodesState and useEdgesState
**Priority:** 🟡 HIGH  
**Effort:** Medium  
**Impact:** Medium

**Current Implementation:**
```typescript
// Manual state management in useFlowNodes
const [nodes, setNodes] = useState(initialNodes);
const [edges, setEdges] = useState(initialEdges);
```

**New Implementation:**
```typescript
import { useNodesState, useEdgesState } from '@xyflow/react';

const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```

**Benefits:**
- Optimized re-renders
- Built-in change handlers
- Cleaner code

**Files:**
- `components/features/viewer/flow/hooks/useFlowNodes.ts`
- `components/features/viewer/flow/FlowView.tsx`

---

#### Task 12: Test upgraded React Flow implementation
**Priority:** 🔴 CRITICAL  
**Effort:** Medium  
**Impact:** High

**Test Cases:**
1. Node rendering (all types: Root, Object, Array, Primitive)
2. Edge connections (default and chain edges)
3. Collapse/expand functionality
4. Node details modal
5. Layout algorithm (dagre positioning)
6. MiniMap display
7. Controls (zoom, fit view)
8. Background rendering
9. Node selection
10. Edge selection

**Acceptance Criteria:**
- All existing features work
- No console errors
- No visual regressions
- Performance is same or better

---

### Phase 2: UX Enhancements (Week 2)

#### Task 4: Add NodeToolbar to custom nodes
**Priority:** 🟡 HIGH  
**Effort:** Low  
**Impact:** High

**Implementation:**
```typescript
import { NodeToolbar, Position } from '@xyflow/react';

<NodeToolbar position={Position.Top} align="center">
  <button onClick={handleCopy}>📋 Copy</button>
  <button onClick={handleExpand}>⬍ Expand</button>
  <button onClick={handleDelete}>🗑 Delete</button>
  <button onClick={handleDetails}>ℹ️ Details</button>
</NodeToolbar>
```

**Files:**
- `components/features/viewer/flow/nodes/FlowRootNode.tsx`
- `components/features/viewer/flow/nodes/FlowObjectNode.tsx`
- `components/features/viewer/flow/nodes/FlowArrayNode.tsx`

**Benefits:**
- Quick actions without double-click
- Better UX
- Context-sensitive operations

---

#### Task 5: Implement useReactFlow controls
**Priority:** 🟡 HIGH  
**Effort:** Low  
**Impact:** Medium

**Implementation:**
```typescript
import { useReactFlow, Panel } from '@xyflow/react';

function FlowControls() {
  const { fitView, zoomIn, zoomOut, setCenter, getNodes } = useReactFlow();

  const handleCenterRoot = () => {
    const rootNode = getNodes().find(n => n.type === 'root');
    if (rootNode) {
      setCenter(
        rootNode.position.x + (rootNode.width || 0) / 2,
        rootNode.position.y + (rootNode.height || 0) / 2,
        { zoom: 1.5, duration: 800 }
      );
    }
  };

  return (
    <Panel position="top-left">
      <button onClick={() => fitView({ padding: 0.2, duration: 800 })}>
        Fit View
      </button>
      <button onClick={handleCenterRoot}>Center Root</button>
      <button onClick={zoomIn}>Zoom In</button>
      <button onClick={zoomOut}>Zoom Out</button>
    </Panel>
  );
}
```

**Files:**
- `components/features/viewer/flow/FlowView.tsx`
- Create: `components/features/viewer/flow/FlowControls.tsx`

---

#### Task 6: Add useHandleConnections for connection tracking
**Priority:** 🟢 MEDIUM  
**Effort:** Low  
**Impact:** Medium

**Implementation:**
```typescript
import { useHandleConnections } from '@xyflow/react';

const sourceConnections = useHandleConnections({
  type: 'source',
  id: 'output',
});

const targetConnections = useHandleConnections({
  type: 'target',
});

// Display in node
<div className="connection-stats">
  <div>Inputs: {targetConnections.length}</div>
  <div>Outputs: {sourceConnections.length}</div>
</div>
```

**Files:**
- `components/features/viewer/flow/nodes/FlowObjectNode.tsx`
- `components/features/viewer/flow/nodes/FlowArrayNode.tsx`

---

#### Task 7: Implement useNodesData for connected node info
**Priority:** 🟢 MEDIUM  
**Effort:** Low  
**Impact:** Medium

**Implementation:**
```typescript
import { useHandleConnections, useNodesData } from '@xyflow/react';

const sourceConnections = useHandleConnections({ type: 'source' });
const connectedNodeIds = sourceConnections.map(conn => conn.target);
const connectedNodesData = useNodesData(connectedNodeIds);

// Display in toolbar or tooltip
{connectedNodesData.length > 0 && (
  <div className="connected-nodes">
    Connected to:
    {connectedNodesData.map(node => (
      <div key={node.id}>→ {node.data.label}</div>
    ))}
  </div>
)}
```

**Files:**
- `components/features/viewer/flow/nodes/FlowObjectNode.tsx`
- `components/features/viewer/flow/nodes/FlowArrayNode.tsx`

---

### Phase 3: Advanced Features (Week 3)

#### Task 8: Add NodeResizer to object nodes
**Priority:** 🟢 MEDIUM  
**Effort:** Medium  
**Impact:** Medium

**Implementation:**
```typescript
import { NodeResizer } from '@xyflow/react';

<NodeResizer
  minWidth={200}
  minHeight={100}
  maxWidth={600}
  maxHeight={800}
  color="#3b82f6"
  onResize={(event, params) => {
    console.log('Resizing:', params.width, params.height);
  }}
/>
```

**Files:**
- `components/features/viewer/flow/nodes/FlowObjectNode.tsx`

**Benefits:**
- User can expand nodes to see more properties
- Better space utilization
- Flexible layout

---

#### Task 9: Add Panel components for stats and legend
**Priority:** 🔵 LOW  
**Effort:** Low  
**Impact:** Low

**Implementation:**
```typescript
import { Panel } from '@xyflow/react';

<Panel position="top-right">
  <div className="stats-panel">
    <h3>Statistics</h3>
    <div>Total Nodes: {nodes.length}</div>
    <div>Max Depth: {maxDepth}</div>
    <div>Objects: {objectCount}</div>
    <div>Arrays: {arrayCount}</div>
  </div>
</Panel>

<Panel position="bottom-right">
  <div className="legend-panel">
    <h3>Legend</h3>
    <div>🔵 Root Node</div>
    <div>🟦 Object Node</div>
    <div>🟪 Array Node</div>
    <div>🟩 Primitive Node</div>
  </div>
</Panel>
```

**Files:**
- Create: `components/features/viewer/flow/FlowStatsPanel.tsx`
- Create: `components/features/viewer/flow/FlowLegendPanel.tsx`
- `components/features/viewer/flow/FlowView.tsx`

---

#### Task 10: Implement custom connection validation
**Priority:** 🔵 LOW  
**Effort:** Low  
**Impact:** Low

**Implementation:**
```typescript
const isValidConnection = useCallback((connection: Connection) => {
  // Prevent self-connections
  if (connection.source === connection.target) {
    return false;
  }

  // Prevent duplicate connections
  const isDuplicate = edges.some(
    edge =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
  );

  return !isDuplicate;
}, [edges]);

<ReactFlow
  isValidConnection={isValidConnection}
  // ...
/>
```

**Files:**
- `components/features/viewer/flow/FlowView.tsx`

---

#### Task 11: Add edge markers and animations
**Priority:** 🔵 LOW  
**Effort:** Low  
**Impact:** Low

**Implementation:**
```typescript
const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#3b82f6',
  },
  animated: true,
  style: { strokeWidth: 2 },
};

<ReactFlow
  defaultEdgeOptions={defaultEdgeOptions}
  // ...
/>
```

**Files:**
- `components/features/viewer/flow/config/flow-config.ts`
- `components/features/viewer/flow/edges/FlowDefaultEdge.tsx`
- `components/features/viewer/flow/edges/FlowChainEdge.tsx`

---

## Priority Summary

### 🔴 Critical (Must Do - Week 1)
1. Upgrade React Flow to @xyflow/react
2. Update React Flow imports across codebase
3. Test upgraded React Flow implementation

### 🟡 High (Should Do - Week 2)
4. Refactor to use useNodesState and useEdgesState
5. Add NodeToolbar to custom nodes
6. Implement useReactFlow controls

### 🟢 Medium (Nice to Have - Week 2-3)
7. Add useHandleConnections for connection tracking
8. Implement useNodesData for connected node info
9. Add NodeResizer to object nodes

### 🔵 Low (Optional - Week 3)
10. Add Panel components for stats and legend
11. Implement custom connection validation
12. Add edge markers and animations

## Success Criteria

- ✅ All existing features work after migration
- ✅ No console errors or warnings
- ✅ No visual regressions
- ✅ Performance is same or better
- ✅ At least 3 new features implemented (NodeToolbar, useReactFlow, useHandleConnections)
- ✅ Code is cleaner and more maintainable
- ✅ Documentation updated

## Rollback Plan

If migration fails:
1. Revert package.json changes
2. Run `npm install`
3. Revert all import changes
4. Keep detailed notes of issues encountered

## Resources

- [React Flow Migration Guide](https://reactflow.dev/learn/migration)
- [React Flow Documentation](https://reactflow.dev)
- [React Flow Examples](https://reactflow.dev/examples)
- [React Flow API Reference](https://reactflow.dev/api-reference)

## Next Steps

1. Review this plan with team
2. Create feature branch: `feature/react-flow-upgrade`
3. Start with Task 1: Upgrade package
4. Work through tasks in priority order
5. Test thoroughly after each phase
6. Merge when all critical tasks complete


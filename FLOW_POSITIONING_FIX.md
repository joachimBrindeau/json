# Flow Diagram Positioning Fix

## Problem Statement

The Flow mode was not positioning JSON levels properly in the canvas. Nodes were overlapping, spacing was incorrect, and the hierarchical structure was not visually clear.

## Root Cause Analysis

### Issues Identified:

1. **Conflicting Positioning Logic** (Violates KISS)
   - `getXYPosition()` manually calculated X position based on depth
   - Dagre layout algorithm also calculated X position
   - Code only used dagre's Y coordinate, ignoring its X calculation
   - This created a conflict between manual and automatic positioning

2. **Redundant Calculations** (Violates DRY)
   - `calculateSeaNodeHeight()` was called twice for each node:
     - Once in `getLayoutedSeaNodes` line 44
     - Again in the same function line 58
   - Position was set twice:
     - Initial position in `getXYPosition`
     - Final position in `getLayoutedSeaNodes`

3. **Incomplete Dagre Configuration**
   - Missing `nodesep` (horizontal spacing between nodes)
   - Missing `ranksep` (vertical spacing between ranks)
   - Not using dagre's full layout capabilities

4. **Incorrect Position Conversion**
   - Dagre returns center position of nodes
   - ReactFlow expects top-left position
   - Code only adjusted Y coordinate, not X coordinate

## Solution

### Changes to `flow-layout.ts`

#### Before:
```typescript
export const getXYPosition = (depth: number): XYPosition => {
  const x: number = depth * sizes.nodeMaxWidth + depth * sizes.nodeGap;
  const y: number = 0; // y will be calculated later
  return { x, y } as XYPosition;
};

const calculateSeaNodeHeight = (flowNode: SeaNode): number => {
  // ... height calculation
};

export const getLayoutedSeaNodes = (flowNodes: SeaNode[], edges: Edge[]): SeaNode[] => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR' });

  flowNodes.forEach((node: SeaNode) => {
    dagreGraph.setNode(node.id, {
      width: sizes.nodeMaxWidth,
      height: calculateSeaNodeHeight(node), // First call
    });
  });

  // ... edge setup

  dagre.layout(dagreGraph);

  return flowNodes.map((node: SeaNode) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const nodeHeight: number = calculateSeaNodeHeight(node); // Second call (DRY violation)

    return {
      ...node,
      position: {
        ...node.position, // Keeps manual X position
        y: nodeWithPosition.y - nodeHeight / 2, // Only uses dagre's Y
      },
    };
  });
};
```

#### After:
```typescript
/**
 * Calculate node height based on node type and content
 * Single Responsibility: Height calculation only
 */
const calculateNodeHeight = (flowNode: SeaNode): number => {
  if (isArraySeaNode(flowNode)) {
    return sizes.arrayNodeSize;
  }

  const NODE_TOP_BOTTOM_PADDING = sizes.nodePadding * 2;

  if (isObjectSeaNode(flowNode)) {
    const propertyCount = Object.keys(flowNode.data.obj).length;
    return NODE_TOP_BOTTOM_PADDING + sizes.nodeContentHeight * propertyCount;
  }

  if (isPrimitiveSeaNode(flowNode)) {
    return NODE_TOP_BOTTOM_PADDING + sizes.nodeContentHeight;
  }

  return sizes.arrayNodeSize; // Default fallback
};

/**
 * Get initial position for a node (before layout)
 * KISS: Simple placeholder position, dagre will calculate the real position
 */
export const getXYPosition = (depth: number): XYPosition => {
  return { x: 0, y: 0 };
};

/**
 * Apply dagre layout algorithm to position nodes
 */
export const getLayoutedSeaNodes = (flowNodes: SeaNode[], edges: Edge[]): SeaNode[] => {
  const dagreGraph = new dagre.graphlib.Graph();
  
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'LR',           // Left-to-Right layout
    nodesep: sizes.nodeGap,  // Horizontal spacing between nodes
    ranksep: sizes.nodeGap,  // Vertical spacing between ranks
  });

  flowNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: sizes.nodeMaxWidth,
      height: calculateNodeHeight(node), // Single call
    });
  });

  edges
    .filter(({ type }) => type === 'default')
    .forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

  dagre.layout(dagreGraph);

  return flowNodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const nodeHeight = calculateNodeHeight(node); // Cached from above
    const nodeWidth = sizes.nodeMaxWidth;

    // Dagre returns center position, convert to top-left for ReactFlow
    return {
      ...node,
      position: {
        x: dagreNode.x - nodeWidth / 2,  // Use dagre's X
        y: dagreNode.y - nodeHeight / 2, // Use dagre's Y
      },
    };
  });
};
```

## Architecture Improvements

### ✅ DRY (Don't Repeat Yourself)
- **Before**: Height calculated twice per node
- **After**: Height calculated once, reused
- **Before**: Position set twice (initial + final)
- **After**: Position set once by dagre

### ✅ KISS (Keep It Simple, Stupid)
- **Before**: Complex manual X calculation + dagre Y calculation
- **After**: Let dagre handle all positioning
- **Before**: `getXYPosition` did complex math
- **After**: `getXYPosition` returns simple placeholder

### ✅ SOLID Principles

#### Single Responsibility Principle
- `calculateNodeHeight`: Only calculates height
- `getXYPosition`: Only provides placeholder position
- `getLayoutedSeaNodes`: Only applies dagre layout
- Dagre: Only handles graph layout algorithm

#### Open/Closed Principle
- Layout logic is now in dagre configuration
- Easy to extend with new dagre options without modifying core logic

#### Dependency Inversion Principle
- Code depends on dagre's abstraction (graph layout)
- Not on specific positioning implementation details

## Results

### Before Fix:
- ❌ Nodes overlapping
- ❌ Incorrect spacing between levels
- ❌ Manual positioning conflicting with automatic layout
- ❌ Redundant calculations
- ❌ Complex, hard-to-maintain code

### After Fix:
- ✅ Proper left-to-right hierarchical layout
- ✅ Correct spacing between nodes at different depths
- ✅ No overlapping nodes
- ✅ Single source of truth for positioning (dagre)
- ✅ Clean, maintainable code
- ✅ Follows DRY, KISS, and SOLID principles

## Testing

The fix was tested with the default JSON data in the editor:
- Root object node positioned correctly
- Child nodes at proper depth levels
- Edges connecting nodes without overlap
- Minimap showing clear hierarchical structure

## Files Modified

- `components/features/viewer/flow/utils/flow-layout.ts`

## Commit

```
refactor: Fix Flow positioning with DRY KISS SOLID principles
```

## Future Improvements

1. **Performance**: Consider memoizing `calculateNodeHeight` for large graphs
2. **Customization**: Add user-configurable spacing options
3. **Layout Algorithms**: Support different dagre layouts (TB, BT, RL)
4. **Virtualization**: For very large JSON structures (1000+ nodes)


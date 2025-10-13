/**
 * Flow Diagram Components
 *
 * Visual representation of JSON data as interactive node diagrams using ReactFlow.
 * Adapted from json-sea project with shadcn/ui components.
 */

// Main components
export { FlowView } from './FlowView';
export { FlowDiagram } from './FlowDiagram';

// Node components
export { FlowObjectNode } from './nodes/FlowObjectNode';
export { FlowArrayNode } from './nodes/FlowArrayNode';
export { FlowPrimitiveNode } from './nodes/FlowPrimitiveNode';
export { FlowBooleanChip } from './nodes/FlowBooleanChip';
export { FlowNullChip } from './nodes/FlowNullChip';
export { FlowNodeShell } from './nodes/FlowNodeShell';
export { FlowObjectNodeProperty } from './nodes/FlowObjectNodeProperty';

// Edge components
export { FlowDefaultEdge } from './edges/FlowDefaultEdge';
export { FlowChainEdge } from './edges/FlowChainEdge';

// Handle components
export { FlowDefaultHandle } from './FlowDefaultHandle';
export { FlowChainHandle } from './FlowChainHandle';
export { FlowNodeHandles } from './FlowNodeHandles';
export { FlowCollapseButton } from './FlowCollapseButton';

// Hooks
export { useFlowCollapse } from './hooks/useFlowCollapse';

// Utilities
export { jsonParser, addPrefixChain } from './utils/flow-parser';
export { getXYPosition, getLayoutedSeaNodes } from './utils/flow-layout';
export { extractNodeDetails } from './utils/flow-node-details';
export * from './utils/flow-utils';
export * from './utils/flow-types';
export * from './utils/flow-constants';


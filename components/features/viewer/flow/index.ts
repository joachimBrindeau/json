/**
 * Flow Diagram Components
 * 
 * Visual representation of JSON data as interactive node diagrams using ReactFlow.
 * Adapted from json-sea project with shadcn/ui components.
 */

// Main components
export { FlowView, JsonFlowView } from './FlowView';
export { FlowDiagram, JsonSeaDiagram } from './FlowDiagram';

// Node components
export { FlowObjectNode, ObjectNode } from './nodes/FlowObjectNode';
export { FlowArrayNode, ArrayNode } from './nodes/FlowArrayNode';
export { FlowPrimitiveNode, PrimitiveNode } from './nodes/FlowPrimitiveNode';
export { FlowBooleanChip, BooleanChip } from './nodes/FlowBooleanChip';
export { FlowNullChip, NullChip } from './nodes/FlowNullChip';
export { FlowNodeShell, NodeShell } from './nodes/FlowNodeShell';
export { FlowObjectNodeProperty, ObjectNodeProperty } from './nodes/FlowObjectNodeProperty';

// Edge components
export { FlowDefaultEdge, DefaultEdge } from './edges/FlowDefaultEdge';
export { FlowChainEdge, ChainEdge } from './edges/FlowChainEdge';

// Handle components
export { FlowDefaultHandle, DefaultHandle } from './FlowDefaultHandle';
export { FlowChainHandle, ChainHandle } from './FlowChainHandle';
export { FlowHoveringDot, HoveringBlueDot } from './FlowHoveringDot';

// Utilities
export { jsonParser, addPrefixChain } from './utils/flow-parser';
export { getXYPosition, getLayoutedSeaNodes } from './utils/flow-layout';
export * from './utils/flow-utils';
export * from './utils/flow-types';
export * from './utils/flow-constants';


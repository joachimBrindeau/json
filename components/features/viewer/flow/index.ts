/**
 * Flow Diagram Components
 *
 * Visual representation of JSON data as interactive node diagrams using ReactFlow.
 * Adapted from json-sea project with shadcn/ui components.
 */

// Main components
export { FlowView } from './FlowView';

// Configuration
export {
  FLOW_NODE_TYPES,
  FLOW_EDGE_TYPES,
  FLOW_FIT_VIEW_OPTIONS,
  FLOW_ZOOM_CONFIG,
  FLOW_DEFAULT_VIEWPORT,
  FLOW_DEFAULT_EDGE_OPTIONS,
  getMinimapNodeColor,
} from './config/flow-config';

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
export { FlowHandle } from './FlowHandle';
export { FlowCollapseButton } from './FlowCollapseButton';

// Hooks
export { useFlowParser } from './hooks/useFlowParser';
export { useFlowNodes } from './hooks/useFlowNodes';
export { useNodeDetailsModal } from './hooks/useNodeDetailsModal';

// Utilities
export { jsonParser } from './utils/flow-parser';
export { getXYPosition, getLayoutedSeaNodes } from './utils/flow-layout';
export { extractNodeDetails } from './utils/flow-node-details';
export { createDefaultEdge, createChainEdge, addPrefixChain } from './utils/flow-edge-factory';
export * from './utils/flow-utils';
export * from './utils/flow-types';
export * from './utils/flow-type-guards';
export * from './utils/flow-constants';

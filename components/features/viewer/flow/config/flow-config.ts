/**
 * Flow view configuration - centralized constants and settings
 */

import { NodeTypes, EdgeTypes, FitViewOptions, DefaultEdgeOptions, Node } from 'reactflow';
import { FlowObjectNode } from '../nodes/FlowObjectNode';
import { FlowArrayNode } from '../nodes/FlowArrayNode';
import { FlowPrimitiveNode } from '../nodes/FlowPrimitiveNode';
import { FlowDefaultEdge } from '../edges/FlowDefaultEdge';
import { FlowChainEdge } from '../edges/FlowChainEdge';
import { NodeType } from '../utils/flow-types';

/**
 * Node type mappings for ReactFlow
 * Single source of truth for all node components
 */
export const FLOW_NODE_TYPES: NodeTypes = {
  [NodeType.Object]: FlowObjectNode,
  [NodeType.Array]: FlowArrayNode,
  [NodeType.Primitive]: FlowPrimitiveNode,
};

/**
 * Edge type mappings for ReactFlow
 * Single source of truth for all edge components
 */
export const FLOW_EDGE_TYPES: EdgeTypes = {
  default: FlowDefaultEdge,
  chain: FlowChainEdge,
};

/**
 * Default ReactFlow fit view options
 */
export const FLOW_FIT_VIEW_OPTIONS: FitViewOptions = {
  padding: 0.2,
  maxZoom: 1.5,
  minZoom: 0.1,
};

/**
 * Default ReactFlow zoom settings
 */
export const FLOW_ZOOM_CONFIG = {
  minZoom: 0.1,
  maxZoom: 2,
  defaultZoom: 0.8,
} as const;

/**
 * Default ReactFlow viewport
 */
export const FLOW_DEFAULT_VIEWPORT = {
  x: 0,
  y: 0,
  zoom: FLOW_ZOOM_CONFIG.defaultZoom,
} as const;

/**
 * Default edge options (undefined to use ReactFlow defaults)
 */
export const FLOW_DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions | undefined = undefined;

/**
 * MiniMap node color function
 * Returns color based on node type for the minimap
 */
export const getMinimapNodeColor = (node: Node): string => {
  switch (node.type) {
    case NodeType.Object:
      return '#3b82f6'; // blue-500
    case NodeType.Array:
      return '#8b5cf6'; // violet-500
    case NodeType.Primitive:
      return '#10b981'; // emerald-500
    default:
      return '#6b7280'; // gray-500
  }
};


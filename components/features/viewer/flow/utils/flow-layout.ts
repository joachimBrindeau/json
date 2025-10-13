import * as dagre from 'dagre';
import { Edge, XYPosition } from 'reactflow';
import { sizes } from './flow-constants';
import { SeaNode, NodeType } from './flow-types';
import { isArraySeaNode, isObjectSeaNode, isPrimitiveSeaNode } from './flow-utils';

/**
 * Calculate node height based on node type and content
 * Single Responsibility: Height calculation only
 */
const calculateNodeHeight = (flowNode: SeaNode): number => {
  // Root node has fixed height
  if (flowNode.type === NodeType.Root) {
    return 80; // Fixed height for root node
  }

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
 *
 * Uses dagre's automatic graph layout for optimal positioning.
 * Dagre handles both X and Y positioning based on the graph structure.
 *
 * @reference https://reactflow.dev/docs/examples/layout/dagre/
 */
export const getLayoutedSeaNodes = (flowNodes: SeaNode[], edges: Edge[]): SeaNode[] => {
  // Create dagre graph instance
  const dagreGraph = new dagre.graphlib.Graph();

  // Configure graph layout
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR',           // Left-to-Right layout
    nodesep: sizes.nodeGap,  // Horizontal spacing between nodes
    ranksep: sizes.nodeGap,  // Vertical spacing between ranks
  });

  // Add all nodes to dagre graph with their dimensions
  flowNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: sizes.nodeMaxWidth,
      height: calculateNodeHeight(node),
    });
  });

  // Add edges (only default edges, not chain edges)
  edges
    .filter(({ type }) => type === 'default')
    .forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

  // Run dagre layout algorithm
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  return flowNodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const nodeHeight = calculateNodeHeight(node);
    const nodeWidth = sizes.nodeMaxWidth;

    // Dagre returns center position, convert to top-left for ReactFlow
    return {
      ...node,
      position: {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
    };
  });
};

/**
 * Custom hook for Flow node toolbar functionality
 * 
 * Consolidates duplicate hook patterns from FlowObjectNode and FlowArrayNode
 * Follows DRY principle - single source of truth for toolbar logic
 */

import { useEdges, useHandleConnections, useNodesData } from '@xyflow/react';

interface UseFlowNodeToolbarParams {
  nodeId: string;
}

export const useFlowNodeToolbar = ({ nodeId }: UseFlowNodeToolbarParams) => {
  const edges = useEdges();
  
  // Calculate if node has children
  const hasChildren = edges.some((edge) => edge.source === nodeId);
  
  // Track connections
  const sourceConnections = useHandleConnections({ type: 'source', nodeId });
  const targetConnections = useHandleConnections({ type: 'target', nodeId });
  
  // Get connected nodes data
  const connectedNodeIds = sourceConnections.map(conn => conn.target);
  const connectedNodesData = useNodesData(connectedNodeIds);

  return {
    hasChildren,
    sourceConnections,
    targetConnections,
    connectedNodesData,
  };
};


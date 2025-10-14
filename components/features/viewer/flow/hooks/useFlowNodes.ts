/**
 * useFlowNodes - Hook for managing flow nodes with collapse functionality
 * 
 * Single Responsibility: Node state management and collapse integration
 */

import { useEffect, useState } from 'react';
import { Node, Edge, useNodesState, useEdgesState, NodeChange, EdgeChange } from '@xyflow/react';
import { useFlowCollapse } from './useFlowCollapse';

export type FlowNodesState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  handleToggleCollapse: (nodeId: string) => void;
};

/**
 * Manage flow nodes and edges with collapse functionality
 */
export const useFlowNodes = (
  parsedNodes: Node[],
  parsedEdges: Edge[],
  onToggleCollapse?: (nodeId: string) => void
): FlowNodesState => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [allEdges, setAllEdges] = useState<Edge[]>([]);

  const { handleToggleCollapse, getVisibleNodes, getVisibleEdges } = useFlowCollapse(allNodes, allEdges);

  // Update nodes and edges when parsed data changes
  useEffect(() => {
    if (parsedNodes.length === 0) return;

    const reactFlowNodes = parsedNodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        onToggleCollapse: onToggleCollapse || handleToggleCollapse,
      },
    }));

    const flowEdges = parsedEdges.map((edge) => ({
      ...edge,
      type: edge.type || 'default',
      animated: false,
      style: undefined,
    }));

    setAllNodes(reactFlowNodes);
    setAllEdges(flowEdges);
    // Don't set nodes/edges here - let the second effect handle visibility
  }, [parsedNodes, parsedEdges, handleToggleCollapse, onToggleCollapse]);

  // Update visible nodes when collapse state changes
  useEffect(() => {
    if (allNodes.length === 0) return;
    setNodes(getVisibleNodes());
    setEdges(getVisibleEdges());
  }, [allNodes, allEdges, getVisibleNodes, getVisibleEdges, setNodes, setEdges]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleToggleCollapse,
  };
};


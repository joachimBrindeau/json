/**
 * useFlowNodes - Simple hook for managing flow nodes with per-branch collapse
 * KISS: Everything in one place, no circular dependencies
 */

import { useMemo, useCallback, useState } from 'react';
import { Node, Edge, useNodesState, useEdgesState, NodeChange, EdgeChange } from '@xyflow/react';

export type FlowNodesState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  handleToggleCollapse: (parentId: string, childId: string) => void;
  collapsedBranches: Set<string>;
};

// Helper: Create branch ID from parent and child node IDs
function createBranchId(parentId: string, childId: string): string {
  return `${parentId}:${childId}`;
}

// Helper: Build children map from edges
function buildChildrenMap(edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  edges.forEach((edge) => {
    const children = map.get(edge.source) || [];
    children.push(edge.target);
    map.set(edge.source, children);
  });
  return map;
}

// Helper: Get all descendant IDs using BFS
function getDescendantIds(nodeId: string, childrenMap: Map<string, string[]>): string[] {
  const descendants: string[] = [];
  const queue = [...(childrenMap.get(nodeId) || [])];

  while (queue.length > 0) {
    const current = queue.shift()!;
    descendants.push(current);
    const children = childrenMap.get(current) || [];
    queue.push(...children);
  }

  return descendants;
}

export const useFlowNodes = (
  parsedNodes: Node[],
  parsedEdges: Edge[],
  onToggleCollapse?: (parentId: string, childId: string) => void,
  searchTerm: string = ''
): FlowNodesState => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());

  // Build children map
  const childrenMap = useMemo(() => buildChildrenMap(parsedEdges), [parsedEdges]);

  // Calculate hidden nodes - hide nodes whose parent-child branch is collapsed
  // Also hide all descendants of hidden nodes
  const hiddenNodes = useMemo(() => {
    const hidden = new Set<string>();

    // For each collapsed branch, hide the child node and all its descendants
    collapsedBranches.forEach((branchId) => {
      const [, childId] = branchId.split(':');

      // Hide the child node
      hidden.add(childId);

      // Hide all descendants of the child node
      const descendants = getDescendantIds(childId, childrenMap);
      descendants.forEach((id) => hidden.add(id));
    });

    return hidden;
  }, [collapsedBranches, childrenMap]);

  // Toggle collapse - per-branch behavior
  // Toggles the specific parent-child branch
  const handleToggleCollapse = useCallback((parentId: string, childId: string) => {
    setCollapsedBranches((prev) => {
      const newSet = new Set(prev);
      const branchId = createBranchId(parentId, childId);

      if (newSet.has(branchId)) {
        // Expanding: remove this branch from collapsed set
        newSet.delete(branchId);
      } else {
        // Collapsing: add this branch to collapsed set
        newSet.add(branchId);
      }

      return newSet;
    });
  }, []);

  // Update nodes and edges when anything changes
  useMemo(() => {
    if (parsedNodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const toggleHandler = onToggleCollapse || handleToggleCollapse;

    // Helper function to check if node matches search term
    const matchesSearch = (node: Node): boolean => {
      if (!searchTerm) return false;
      
      const term = searchTerm.toLowerCase();
      const nodeData = node.data;
      
      // Search in node ID
      if (node.id.toLowerCase().includes(term)) return true;

      // Search in stringified JSON
      if ((nodeData as any)?.stringifiedJson && (nodeData as any).stringifiedJson.toLowerCase().includes(term)) {
        return true;
      }

      // Search in object keys/values
      if ((nodeData as any)?.obj) {
        const objStr = JSON.stringify((nodeData as any).obj).toLowerCase();
        if (objStr.includes(term)) return true;
      }
      
      // Search in primitive values
      if (nodeData?.value !== undefined) {
        const valueStr = String(nodeData.value).toLowerCase();
        if (valueStr.includes(term)) return true;
      }
      
      return false;
    };

    const visibleNodes = parsedNodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        onToggleCollapse: toggleHandler,
        collapsedBranches,
        isHighlighted: matchesSearch(node),
        searchTerm,
      },
      hidden: hiddenNodes.has(node.id),
    }));

    const visibleEdges = parsedEdges.map((edge) => ({
      ...edge,
      type: edge.type || 'default',
      animated: false,
      style: undefined,
      hidden: hiddenNodes.has(edge.target) || hiddenNodes.has(edge.source),
    }));

    setNodes(visibleNodes);
    setEdges(visibleEdges);
  }, [parsedNodes, parsedEdges, collapsedBranches, hiddenNodes, handleToggleCollapse, onToggleCollapse, searchTerm, setNodes, setEdges]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    handleToggleCollapse,
    collapsedBranches,
  };
};


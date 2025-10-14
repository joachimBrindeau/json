import { useCallback, useState, useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';

/**
 * Build a map of node ID to its direct children for O(1) lookups
 * This is memoized to avoid rebuilding on every render
 */
const buildChildrenMap = (edges: Edge[]): Map<string, Set<string>> => {
  const childrenMap = new Map<string, Set<string>>();

  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, new Set());
    }
    childrenMap.get(edge.source)!.add(edge.target);
  });

  return childrenMap;
};

/**
 * Get all descendant node IDs using BFS with optimized lookups
 */
const getDescendantIds = (nodeId: string, childrenMap: Map<string, Set<string>>): Set<string> => {
  const descendants = new Set<string>();
  const toProcess = [nodeId];

  while (toProcess.length > 0) {
    const currentId = toProcess.pop()!;
    const children = childrenMap.get(currentId);

    if (children) {
      children.forEach((childId) => {
        if (!descendants.has(childId)) {
          descendants.add(childId);
          toProcess.push(childId);
        }
      });
    }
  }

  return descendants;
};

export const useFlowCollapse = (allNodes: Node[], allEdges: Edge[]) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Memoize the children map to avoid rebuilding on every render
  const childrenMap = useMemo(() => buildChildrenMap(allEdges), [allEdges]);

  // Memoize hidden nodes calculation
  const hiddenNodes = useMemo(() => {
    const hidden = new Set<string>();

    collapsedNodes.forEach((collapsedId) => {
      const descendants = getDescendantIds(collapsedId, childrenMap);
      descendants.forEach((id) => hidden.add(id));
    });

    return hidden;
  }, [collapsedNodes, childrenMap]);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const getVisibleNodes = useCallback(() => {
    if (allNodes.length === 0) return allNodes;

    return allNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isCollapsed: collapsedNodes.has(node.id),
        onToggleCollapse: handleToggleCollapse,
      },
      hidden: hiddenNodes.has(node.id),
    }));
  }, [allNodes, collapsedNodes, hiddenNodes, handleToggleCollapse]);

  const getVisibleEdges = useCallback(() => {
    if (allEdges.length === 0) return allEdges;

    return allEdges.map((edge) => ({
      ...edge,
      hidden: hiddenNodes.has(edge.target) || hiddenNodes.has(edge.source),
    }));
  }, [allEdges, hiddenNodes]);

  return {
    collapsedNodes,
    handleToggleCollapse,
    getVisibleNodes,
    getVisibleEdges,
  };
};

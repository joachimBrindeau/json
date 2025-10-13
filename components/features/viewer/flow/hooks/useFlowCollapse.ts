import { useCallback, useState } from 'react';
import { Node, Edge } from 'reactflow';

const getDescendantIds = (nodeId: string, edges: Edge[]): Set<string> => {
  const descendants = new Set<string>();
  const toProcess = [nodeId];

  while (toProcess.length > 0) {
    const currentId = toProcess.pop()!;

    edges.forEach((edge) => {
      if (edge.source === currentId && !descendants.has(edge.target)) {
        descendants.add(edge.target);
        toProcess.push(edge.target);
      }
    });
  }

  return descendants;
};

export const useFlowCollapse = (allNodes: Node[], allEdges: Edge[]) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

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

    const hiddenNodes = new Set<string>();

    collapsedNodes.forEach((collapsedId) => {
      const descendants = getDescendantIds(collapsedId, allEdges);
      descendants.forEach((id) => hiddenNodes.add(id));
    });

    return allNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isCollapsed: collapsedNodes.has(node.id),
        onToggleCollapse: handleToggleCollapse,
      },
      hidden: hiddenNodes.has(node.id),
    }));
  }, [allNodes, allEdges, collapsedNodes, handleToggleCollapse]);

  const getVisibleEdges = useCallback(() => {
    if (allEdges.length === 0) return allEdges;

    const hiddenNodes = new Set<string>();

    collapsedNodes.forEach((collapsedId) => {
      const descendants = getDescendantIds(collapsedId, allEdges);
      descendants.forEach((id) => hiddenNodes.add(id));
    });

    return allEdges.map((edge) => ({
      ...edge,
      hidden: hiddenNodes.has(edge.target) || hiddenNodes.has(edge.source),
    }));
  }, [allEdges, collapsedNodes]);

  return {
    collapsedNodes,
    handleToggleCollapse,
    getVisibleNodes,
    getVisibleEdges,
  };
};

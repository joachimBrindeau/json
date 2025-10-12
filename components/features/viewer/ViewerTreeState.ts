/**
 * Tree state management hook - handles node expansion/collapse
 */

import { useState, useMemo, useCallback } from 'react';
import type { JsonNode } from './types';

interface TreeState {
  nodes: JsonNode[];
  expandedNodes: Set<string>;
  toggleNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export const useViewerTreeState = (data: any): TreeState => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Convert data to flat list of nodes
  const nodes = useMemo(() => {
    return flattenToNodes(data, expandedNodes);
  }, [data, expandedNodes]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allNodeIds = new Set(nodes.map(n => n.id));
    setExpandedNodes(allNodeIds);
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return {
    nodes,
    expandedNodes,
    toggleNode,
    expandAll,
    collapseAll,
  };
};

// Helper function to flatten JSON to nodes
function flattenToNodes(
  data: any,
  expandedNodes: Set<string>,
  level = 0,
  path = '',
  key = 'root'
): JsonNode[] {
  const nodes: JsonNode[] = [];
  const nodeId = path || 'root';

  const getType = (value: any): JsonNode['type'] => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value as JsonNode['type'];
  };

  const type = getType(data);
  const childCount = Array.isArray(data)
    ? data.length
    : data && typeof data === 'object'
      ? Object.keys(data).length
      : 0;

  // Add current node
  nodes.push({
    id: nodeId,
    key,
    value: data,
    type,
    level,
    path,
    childCount,
    size: JSON.stringify(data).length,
    isExpanded: expandedNodes.has(nodeId),
  });

  // Add children if expanded
  if (expandedNodes.has(nodeId)) {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const childPath = path ? `${path}.${index}` : `${index}`;
        nodes.push(...flattenToNodes(item, expandedNodes, level + 1, childPath, `[${index}]`));
      });
    } else if (data && typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => {
        const childPath = path ? `${path}.${k}` : k;
        nodes.push(...flattenToNodes(v, expandedNodes, level + 1, childPath, k));
      });
    }
  }

  return nodes;
}


/**
 * Tree state management hook - handles node expansion/collapse
 */

import { useState, useMemo, useCallback } from 'react';
import type { JsonNode } from './types';
import { encodePointerSegment } from '@/lib/utils/json-pointer';


interface TreeState {
  nodes: JsonNode[];
  expandedNodes: Set<string>;
  toggleNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export const useViewerTreeState = (
  data: any,
  forceExpandAll: boolean = false,
  fullFlatten: boolean = false
): TreeState => {
  // Expand root by default so top-level array/object items are visible and searchable
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  // Convert data to flat list of nodes
  const nodes = useMemo(() => {
    const effectiveExpanded = expandedNodes;
    return flattenToNodes(data, effectiveExpanded, 0, '', 'root', fullFlatten, 'root');
  }, [data, expandedNodes, forceExpandAll, fullFlatten]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
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
    const allIds = new Set<string>();
    const collect = (value: any, pointer = 'root') => {
      allIds.add(pointer);
      if (Array.isArray(value)) {
        value.forEach((item, index) => collect(item, `${pointer}/${index}`));
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => collect(v, `${pointer}/${encodePointerSegment(k)}`));
      }
    };
    collect(data);
    setExpandedNodes(allIds);
  }, [data]);

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

// Helper function to flatten JSON to nodes (IDs use JSON Pointer-like scheme)
function flattenToNodes(
  data: any,
  expandedNodes: Set<string>,
  level = 0,
  displayPath = '',
  key = 'root',
  fullFlatten = false,
  pointerId = 'root'
): JsonNode[] {
  const nodes: JsonNode[] = [];
  const nodeId = pointerId;

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
    path: displayPath,
    childCount,
    // Avoid expensive deep serialization for large datasets
    size:
      typeof data === 'string'
        ? data.length
        : Array.isArray(data)
          ? data.length
          : data && typeof data === 'object'
            ? Object.keys(data as any).length
            : String(data).length,
    isExpanded: expandedNodes.has(nodeId),
  });

  const shouldRecurse =
    fullFlatten || expandedNodes.has(nodeId) || (Array.isArray(data) && level <= 1);

  // Add children if expanded, shallow-array mode, or full flatten requested
  if (shouldRecurse) {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const childDisplayPath = displayPath ? `${displayPath}.${index}` : `${index}`;
        const childPointerId = `${nodeId}/${index}`;
        nodes.push(
          ...flattenToNodes(
            item,
            expandedNodes,
            level + 1,
            childDisplayPath,
            `[${index}]`,
            fullFlatten,
            childPointerId
          )
        );
      });
    } else if (data && typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => {
        const childDisplayPath = displayPath ? `${displayPath}.${k}` : k;
        const childPointerId = `${nodeId}/${encodePointerSegment(String(k))}`;
        nodes.push(
          ...flattenToNodes(
            v,
            expandedNodes,
            level + 1,
            childDisplayPath,
            k,
            fullFlatten,
            childPointerId
          )
        );
      });
    }
  }

  return nodes;
}

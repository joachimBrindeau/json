/**
 * useFlowParser - Hook for parsing JSON into flow nodes and edges
 * 
 * Single Responsibility: JSON parsing and layout
 */

import { useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import { jsonParser } from '../utils/flow-parser';
import { getLayoutedSeaNodes } from '../utils/flow-layout';
import { logger } from '@/lib/logger';

export type ParsedFlowData = {
  nodes: Node[];
  edges: Edge[];
  error: Error | null;
};

/**
 * Parse JSON data into ReactFlow nodes and edges with layout
 */
export const useFlowParser = (json: unknown): ParsedFlowData => {
  return useMemo(() => {
    if (!json) {
      return { nodes: [], edges: [], error: null };
    }

    try {
      const { flowNodes, edges } = jsonParser(json);
      const layoutedNodes = getLayoutedSeaNodes(flowNodes, edges);

      return {
        nodes: layoutedNodes,
        edges,
        error: null,
      };
    } catch (error) {
      logger.error({ err: error }, 'Error parsing JSON in useFlowParser');
      return {
        nodes: [],
        edges: [],
        error: error instanceof Error ? error : new Error('Unknown parsing error'),
      };
    }
  }, [json]);
};


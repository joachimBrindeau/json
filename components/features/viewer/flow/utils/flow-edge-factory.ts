/**
 * Edge factory - centralized edge creation logic
 * 
 * Creates ReactFlow edges with consistent styling and configuration.
 * Follows the Factory pattern for edge creation.
 */

import { nanoid } from 'nanoid';
import { Edge } from '@xyflow/react';
import { EdgeType } from './flow-types';

/**
 * Parameters for creating a default edge
 */
export type DefaultEdgeParams = {
  source: string;
  target: string;
  sourceHandle?: string;
};

/**
 * Parameters for creating a chain edge
 */
export type ChainEdgeParams = {
  source: string;
  target: string;
};

/**
 * Creates a default edge connecting two nodes
 * 
 * @param params - Edge parameters (source, target, sourceHandle)
 * @returns ReactFlow Edge object with default styling
 * 
 * @bugfix Uses nanoid() for edge IDs to prevent edge persistence bugs
 * @see https://stackoverflow.com/questions/70114700/react-flow-renderer-edges-remain-in-ui-without-any-parents
 */
export const createDefaultEdge = ({ source, target, sourceHandle }: DefaultEdgeParams): Edge => {
  return {
    id: nanoid(),
    type: 'default',
    source,
    target,
    sourceHandle,
    animated: true,
    style: {
      strokeWidth: 2,
    },
  };
};

/**
 * Creates a chain edge for connecting array items sequentially
 * 
 * Chain edges connect array items vertically using top/bottom anchors.
 * 
 * @param params - Edge parameters (source, target)
 * @returns ReactFlow Edge object configured for chain connections
 */
export const createChainEdge = ({ source, target }: ChainEdgeParams): Edge => {
  return {
    id: nanoid(),
    type: EdgeType.Chain,
    source,
    target,
    sourceHandle: 'bottom', // Use bottom anchor for source
    targetHandle: 'top',    // Use top anchor for target
  };
};

/**
 * Helper to add 'chain-' prefix to edge IDs
 * Used for identifying chain edges in the flow
 */
export const addPrefixChain = (v: string): string => `chain-${v}`;


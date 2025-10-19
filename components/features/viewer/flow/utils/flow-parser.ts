/**
 * Flow Parser - Refactored for simplicity (KISS principle)
 * 
 * Converts JSON data into ReactFlow nodes and edges.
 * Simplified from the original 400+ line implementation.
 */

import { Edge } from '@xyflow/react';
import { ROOT_NODE_DEPTH, ROOT_PARENT_NODE_PATH_IDS } from './flow-constants';
import { isArray, isObject, getJsonDataType, validateJsonDataType } from './flow-utils';
import { JsonDataType, NodeType } from './flow-types';
import type { ArraySeaNode, ObjectSeaNode, PrimitiveSeaNode, SeaNode } from './flow-types';
import { getXYPosition } from './flow-layout';
import { createDefaultEdge, createChainEdge, type DefaultEdgeParams } from './flow-edge-factory';
import { logger } from '@/lib/logger';

/**
 * Maximum depth to prevent stack overflow with deeply nested structures
 */
const MAX_DEPTH = 100;

/**
 * Parser context - shared state during parsing
 */
type ParserContext = {
  nodeSequence: number;
  defaultEdges: Edge[];
  chainEdges: Edge[];
  visitedObjects: WeakSet<object>;
};

/**
 * Format node ID from sequence number
 */
const formatNodeId = (nodeSequence: number): string => `n${nodeSequence}`;

/**
 * Get next node ID and increment sequence
 */
const getNextNodeId = (context: ParserContext): string => {
  context.nodeSequence++;
  return formatNodeId(context.nodeSequence);
};

/**
 * Add a default edge to the context
 */
const addDefaultEdge = (context: ParserContext, params: DefaultEdgeParams): void => {
  context.defaultEdges.push(createDefaultEdge(params));
};

/**
 * Add a chain edge to the context
 */
const addChainEdge = (context: ParserContext, source: string, target: string): void => {
  context.chainEdges.push(createChainEdge({ source, target }));
};



/**
 * Create an object node
 */
const createObjectNode = (
  nodeId: string,
  depth: number,
  obj: object,
  parentNodePathIds: string[],
  arrayIndexForObject: number | null,
  isRootNode: boolean
): ObjectSeaNode => {
  return {
    id: nodeId,
    type: NodeType.Object,
    position: getXYPosition(depth),
    data: {
      depth,
      dataType: JsonDataType.Object,
      stringifiedJson: JSON.stringify(obj),
      parentNodePathIds,
      obj,
      arrayIndexForObject,
      isRootNode,
    },
  };
};

/**
 * Create an array node
 */
const createArrayNode = (
  nodeId: string,
  depth: number,
  arrayIndex: number,
  items: unknown[],
  parentNodePathIds: string[],
  isRootNode: boolean
): ArraySeaNode => {
  return {
    id: nodeId,
    type: NodeType.Array,
    position: getXYPosition(depth),
    data: {
      depth,
      dataType: JsonDataType.Array,
      stringifiedJson: JSON.stringify(arrayIndex),
      parentNodePathIds,
      arrayIndex,
      items,
      isRootNode,
    },
  };
};

/**
 * Create a primitive node
 */
const createPrimitiveNode = (
  nodeId: string,
  depth: number,
  arrayIndex: number,
  value: string | number | boolean | null,
  parentNodePathIds: string[]
): PrimitiveSeaNode => {
  return {
    id: nodeId,
    type: NodeType.Primitive,
    position: getXYPosition(depth),
    data: {
      depth,
      dataType: getJsonDataType(value) as
        | JsonDataType.String
        | JsonDataType.Number
        | JsonDataType.Boolean
        | JsonDataType.Null,
      stringifiedJson: JSON.stringify(value),
      parentNodePathIds,
      arrayIndex,
      value,
    },
  };
};

/**
 * Parse an object and its properties
 */
const parseObject = (
  context: ParserContext,
  obj: object,
  depth: number,
  parentNodePathIds: string[],
  arrayIndexForObject: number | null,
  isRootNode: boolean,
  sourceNodeId?: string,
  sourceHandle?: string
): SeaNode[] => {
  // Depth check to prevent stack overflow
  if (depth > MAX_DEPTH) {
    logger.warn({ depth, maxDepth: MAX_DEPTH }, 'Max depth exceeded, stopping parse');
    return [];
  }

  // Circular reference check
  if (context.visitedObjects.has(obj)) {
    logger.warn('Circular reference detected in object');
    return [];
  }

  const nodes: SeaNode[] = [];
  const currentNodeId = getNextNodeId(context);

  // Mark object as visited
  context.visitedObjects.add(obj);

  // Create object node
  nodes.push(createObjectNode(currentNodeId, depth, obj, parentNodePathIds, arrayIndexForObject, isRootNode));

  // Add edge from parent if not root
  if (sourceNodeId) {
    addDefaultEdge(context, { source: sourceNodeId, target: currentNodeId, sourceHandle });
  }

  const nextDepth = depth + 1;
  const nextParentNodePathIds = [...parentNodePathIds, currentNodeId];

  // Parse each property
  Object.entries(obj).forEach(([key, value]) => {
    if (isObject(value)) {
      const childNodes = parseObject(context, value, nextDepth, nextParentNodePathIds, null, false, currentNodeId, key);
      nodes.push(...childNodes);
    } else if (isArray(value)) {
      const childNodes = parseArray(context, value, nextDepth, nextParentNodePathIds, currentNodeId, key);
      nodes.push(...childNodes);
    }
  });

  return nodes;
};

/**
 * Parse an array and its items
 */
const parseArray = (
  context: ParserContext,
  array: unknown[],
  depth: number,
  parentNodePathIds: string[],
  sourceNodeId?: string,
  sourceHandle?: string
): SeaNode[] => {
  // Depth check to prevent stack overflow
  if (depth > MAX_DEPTH) {
    logger.warn({ depth, maxDepth: MAX_DEPTH }, 'Max depth exceeded, stopping parse');
    return [];
  }

  const nodes: SeaNode[] = [];

  // Create the array node first
  const arrayNodeId = getNextNodeId(context);
  nodes.push(createArrayNode(arrayNodeId, depth, 0, array, parentNodePathIds, false));

  // Add edge from parent to array node
  if (sourceNodeId) {
    addDefaultEdge(context, { source: sourceNodeId, target: arrayNodeId, sourceHandle });
  }

  const nextDepth = depth + 1;
  const nextParentNodePathIds = [...parentNodePathIds, arrayNodeId];
  let previousNodeId: string | undefined;

  // Parse each array item
  array.forEach((item, index) => {
    const itemType = validateJsonDataType(item);
    const nextNodeId = getNextNodeId(context);

    // Add chain edge if not first item
    if (index > 0 && previousNodeId && array.length > 1) {
      addChainEdge(context, previousNodeId, nextNodeId);
    }

    previousNodeId = nextNodeId;

    if (itemType.isObjectData) {
      // Array item is an object
      const childNodes = parseObject(context, item as object, nextDepth, nextParentNodePathIds, index, false, arrayNodeId, String(index));
      nodes.push(...childNodes);
    } else if (itemType.isArrayData) {
      // Array item is another array
      const items = item as unknown[];
      const childNodes = parseArray(context, items, nextDepth, nextParentNodePathIds, arrayNodeId, String(index));
      nodes.push(...childNodes);
    } else if (itemType.isPrimitiveData) {
      // Array item is a primitive value
      nodes.push(createPrimitiveNode(nextNodeId, nextDepth, index, item as string | number | boolean | null, nextParentNodePathIds));
      addDefaultEdge(context, { source: arrayNodeId, target: nextNodeId, sourceHandle: String(index) });
    }
  });

  return nodes;
};

/**
 * Main parser function - converts JSON to flow nodes and edges
 * Starts directly from the actual JSON data without an artificial root node
 */
export const jsonParser = (
  json: object | unknown[]
): {
  flowNodes: SeaNode[];
  edges: Edge[];
} => {
  const context: ParserContext = {
    nodeSequence: 0,
    defaultEdges: [],
    chainEdges: [],
    visitedObjects: new WeakSet(),
  };

  // Parse directly from the actual JSON data at depth 0
  const flowNodes = isObject(json)
    ? parseObject(context, json as object, ROOT_NODE_DEPTH, ROOT_PARENT_NODE_PATH_IDS, null, true)
    : parseArray(context, json as unknown[], ROOT_NODE_DEPTH, ROOT_PARENT_NODE_PATH_IDS, undefined, undefined);

  return {
    flowNodes,
    edges: [...context.defaultEdges, ...context.chainEdges],
  };
};


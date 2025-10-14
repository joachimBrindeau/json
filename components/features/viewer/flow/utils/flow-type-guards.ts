/**
 * Type guards for Flow node types
 *
 * Provides runtime type checking for node data types to ensure type safety.
 *
 * NOTE: Simple node type guards (isRootNode, isObjectNode, etc.) are kept for potential future use,
 * but currently the codebase checks node.data.isRootNode property directly.
 * The data type guards are useful for validating unknown data at runtime.
 */

import { Node } from '@xyflow/react';
import {
  NodeType,
  RootSeaNode,
  ObjectSeaNode,
  ArraySeaNode,
  PrimitiveSeaNode,
  RootNodeData,
  ObjectNodeData,
  ArrayNodeData,
  PrimitiveNodeData,
} from './flow-types';

/**
 * Type guard to check if a node is a RootSeaNode
 * Currently unused - kept for potential future use
 */
export function isRootNode(node: Node): node is RootSeaNode {
  return node.type === NodeType.Root;
}

/**
 * Type guard to check if a node is an ObjectSeaNode
 * Currently unused - kept for potential future use
 */
export function isObjectNode(node: Node): node is ObjectSeaNode {
  return node.type === NodeType.Object;
}

/**
 * Type guard to check if a node is an ArraySeaNode
 * Currently unused - kept for potential future use
 */
export function isArrayNode(node: Node): node is ArraySeaNode {
  return node.type === NodeType.Array;
}

/**
 * Type guard to check if a node is a PrimitiveSeaNode
 * Currently unused - kept for potential future use
 */
export function isPrimitiveNode(node: Node): node is PrimitiveSeaNode {
  return node.type === NodeType.Primitive;
}

/**
 * Type guard to check if node data is RootNodeData
 */
export function isRootNodeData(data: unknown): data is RootNodeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    'dataType' in d &&
    (d.dataType === 'object' || d.dataType === 'array') &&
    'label' in d &&
    typeof d.label === 'string' &&
    'childType' in d &&
    (d.childType === 'object' || d.childType === 'array') &&
    'childCount' in d &&
    typeof d.childCount === 'number'
  );
}

/**
 * Type guard to check if node data is ObjectNodeData
 */
export function isObjectNodeData(data: unknown): data is ObjectNodeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    'dataType' in d &&
    d.dataType === 'object' &&
    'obj' in d &&
    typeof d.obj === 'object' &&
    'isRootNode' in d &&
    typeof d.isRootNode === 'boolean'
  );
}

/**
 * Type guard to check if node data is ArrayNodeData
 */
export function isArrayNodeData(data: unknown): data is ArrayNodeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    'dataType' in d &&
    d.dataType === 'array' &&
    'items' in d &&
    Array.isArray(d.items) &&
    'isRootNode' in d &&
    typeof d.isRootNode === 'boolean'
  );
}

/**
 * Type guard to check if node data is PrimitiveNodeData
 */
export function isPrimitiveNodeData(data: unknown): data is PrimitiveNodeData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    'dataType' in d &&
    (d.dataType === 'string' ||
      d.dataType === 'number' ||
      d.dataType === 'boolean' ||
      d.dataType === 'null') &&
    'value' in d &&
    'arrayIndex' in d &&
    typeof d.arrayIndex === 'number'
  );
}




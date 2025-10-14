import { Node } from '@xyflow/react';

/**
 * Primitive data type is different between Javascript and JSON areas.
 * @see https://www.w3schools.com/js/js_json_datatypes.asp
 */
export enum NodeType {
  Root = 'root',
  Object = 'object',
  Array = 'array',
  /**
   * Primitive node exists to express Array node items only.
   * It can be `string`, `number`, `boolean` or `null`. (`undefined` can't exist in JSON)
   */
  Primitive = 'primitive',
}

/**
 * See the [JSON Data Types](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 */
export enum JsonDataType {
  // For `Object` node type
  Object = 'object',
  // For `Array` node type
  Array = 'array',
  // For `Primitive` node type
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Null = 'null',
}

export enum EdgeType {
  Chain = 'chain',
}

type SharedNodeData = {
  depth: number; // The depth starts from 0. (depth of root node is 0)
  stringifiedJson: string;
  parentNodePathIds: string[]; // e.g. [], ['n0'], ['n0', 'n3', 'n5'], ...
  isCollapsed?: boolean; // Track if node's children are collapsed
  onToggleCollapse?: (nodeId: string) => void; // Callback to toggle collapse state
};

export type RootNodeData = SharedNodeData & {
  dataType: JsonDataType.Object | JsonDataType.Array;
  label: string; // e.g., "JSON Root", "root", or filename
  childType: 'object' | 'array'; // Type of the actual root data
  childCount: number; // Number of top-level properties or items
};

export type ObjectNodeData = SharedNodeData & {
  dataType: JsonDataType.Object;
  /**
   * Will be set if parent of `ObjectNode` is an array, so nullable.
   */
  arrayIndexForObject: number | null;
  obj: object;
  isRootNode: boolean;
};

export type ArrayNodeData = SharedNodeData & {
  dataType: JsonDataType.Array;
  arrayIndex: number;
  items: unknown[];
  isRootNode: boolean;
};

export type PrimitiveNodeData = SharedNodeData & {
  dataType: JsonDataType.String | JsonDataType.Number | JsonDataType.Boolean | JsonDataType.Null;
  /**
   * `PrimitiveNode` is always an item of specific array.
   * It means that the parent is always an `ArrayNode`.
   */
  arrayIndex: number;
  value: string | number | boolean | null;
};

export type RootSeaNode = Node<RootNodeData, NodeType.Root>;
export type ObjectSeaNode = Node<ObjectNodeData, NodeType.Object>;
export type ArraySeaNode = Node<ArrayNodeData, NodeType.Array>;
export type PrimitiveSeaNode = Node<PrimitiveNodeData, NodeType.Primitive>;

export type SeaNode = RootSeaNode | ObjectSeaNode | ArraySeaNode | PrimitiveSeaNode;

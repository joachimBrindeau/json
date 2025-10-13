import { nanoid } from 'nanoid';
import { Edge } from 'reactflow';
import { ARRAY_ROOT_NODE_INDEX, ROOT_NODE_DEPTH, ROOT_PARENT_NODE_PATH_IDS } from './flow-constants';
import {
  isArray,
  isObject,
  getJsonDataType,
  validateJsonDataType,
} from './flow-utils';
import { EdgeType, JsonDataType, NodeType } from './flow-types';
import type { ArraySeaNode, ObjectSeaNode, PrimitiveSeaNode, SeaNode } from './flow-types';
import { getXYPosition } from './flow-layout';

const formatNodeId = (nodeSequence: number): string => `n${nodeSequence}`;

export const addPrefixChain = (v: string): string => `chain-${v}`;

type BeforeObjectSeaNode = {
  nodeId: string;
  depth: number;
  obj: object;
  parentNodePathIds: string[];
  arrayIndexForObject: number | null;
  isRootNode: boolean;
};

const convertObjectToNode = ({
  nodeId,
  depth,
  obj,
  parentNodePathIds,
  arrayIndexForObject,
  isRootNode,
}: BeforeObjectSeaNode): ObjectSeaNode => {
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

type BeforeArraySeaNode = {
  nodeId: string;
  depth: number;
  arrayIndex: number;
  items: unknown[];
  parentNodePathIds: string[];
  isRootNode: boolean;
};

const convertArrayToNode = ({
  nodeId,
  depth,
  arrayIndex,
  items,
  parentNodePathIds,
  isRootNode,
}: BeforeArraySeaNode): ArraySeaNode => {
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

type BeforePrimitiveSeaNode = {
  nodeId: string;
  depth: number;
  arrayIndex: number;
  value: string | number | boolean | null;
  parentNodePathIds: string[];
};

const convertPrimitiveToNode = ({
  nodeId,
  depth,
  arrayIndex,
  value,
  parentNodePathIds,
}: BeforePrimitiveSeaNode): PrimitiveSeaNode => {
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

type SourceTarget = Pick<Edge, 'source' | 'target'>;
type DefaultEdgeParams = SourceTarget & Pick<Edge, 'sourceHandle'>;

const createDefaultEdge = ({ source, target, sourceHandle }: DefaultEdgeParams): Edge => {
  return {
    /**
     * @bugfix If the same edge id remains in `JsonDiagram` after update, the following bug occurs.
     *         https://stackoverflow.com/questions/70114700/react-flow-renderer-edges-remain-in-ui-without-any-parents
     * @solution Use `nanoid()` for id.
     */
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

const createChainEdge = ({ source, target }: SourceTarget): Edge => {
  return {
    id: nanoid(),
    type: EdgeType.Chain,
    source,
    target,
    sourceHandle: 'bottom', // Use bottom anchor for source
    targetHandle: 'top',    // Use top anchor for target
  };
};

type TraverseParams = {
  traverseTarget: object | unknown[];
  depth: number;
  arrayIndexForObject: number | null;
  sourceSet: { source?: string; sourceHandle?: string };
  parentNodePathIds: string[];
};
type TraverseObjectParams = {
  _obj: object;
  _nextDepth: number;
  _parentNodePathIds: string[];
  _source: string;
  _sourceHandle: string;
};
type TraverseArrayParams = {
  _array: unknown[];
  _nextDepth: number;
  _parentNodePathIds: string[];
  _source: string;
  _sourceHandle?: string;
};

export const jsonParser = (
  json: object | unknown[]
): {
  flowNodes: SeaNode[];
  edges: Edge[];
} => {
  /**
   * `nodeSequence` will be transformed to `nodeId`.
   */
  let nodeSequence: number = 0;
  let defaultEdges: Edge[] = [];
  let chainEdges: Edge[] = [];

  const addDefaultEdge = ({ source, target, sourceHandle }: DefaultEdgeParams): void => {
    defaultEdges = defaultEdges.concat(
      createDefaultEdge({
        source,
        target,
        sourceHandle,
      })
    );
  };

  /**
   *  2023-01-30 Surprisingly, ChatGPT helps to refactor complex `traverse` code into smaller.
   * 
   * `traverse` function follows `preorder traversal`
   
   *  @implements
   * - if object
   *   - add node(object)
   *   - loop object
   *     - if object field -> traverse
   *     - if array field
   *       - loop array field
   *         - if object item -> traverse
   *         - if array item -> add node(array) & traverse(if not empty)
   *         - if primitive item -> add node(primitive)
   * - if array
   *   - loop array
   *     - if object item -> traverse
   *     - if array item -> add node(array) & traverse(if not empty)
   *     - if primitive item -> add node(primitive)
   *
   * @param sourceSet
   * - [source, sourceHandle]
   * - [undefined, undefined] -> No parent, {traverseTarget} is root node.
   * - [string, undefined] -> Parent is array node
   * - [string, string] -> Parent is object node (arrow is from object field)
   */
  const traverse = ({
    traverseTarget,
    depth,
    arrayIndexForObject,
    sourceSet,
    parentNodePathIds,
  }: TraverseParams): SeaNode[] => {
    let flowNodes: SeaNode[] = [];

    const traverseObject = ({
      _obj,
      _nextDepth,
      _parentNodePathIds,
      _source,
      _sourceHandle,
    }: TraverseObjectParams) => {
      nodeSequence++;
      const nextNodeId: string = formatNodeId(nodeSequence);
      const target: string = nextNodeId;

      flowNodes = flowNodes.concat(
        traverse({
          traverseTarget: _obj,
          depth: _nextDepth,
          arrayIndexForObject: null,
          sourceSet: {
            source: _source,
            sourceHandle: _sourceHandle,
          },
          parentNodePathIds: _parentNodePathIds,
        })
      );
      addDefaultEdge({
        source: _source,
        target,
        sourceHandle: _sourceHandle,
      });
    };

    const traverseArray = ({
      _array,
      _nextDepth,
      _parentNodePathIds,
      _source,
      _sourceHandle,
    }: TraverseArrayParams) => {
      let previousNodeId: string | undefined;

      _array.forEach((arrayItem: unknown, arrayIndex: number, selfArray: unknown[]) => {
        const arrayItemValidator = validateJsonDataType(arrayItem);

        nodeSequence++;
        const nextNodeId = formatNodeId(nodeSequence);
        const target: string = nextNodeId;

        /**
         * Connect array items sequentially with chain edges.
         * Each item connects to the next one using vertical anchors (top/bottom).
         */
        if (selfArray.length > 1 && arrayIndex > 0 && previousNodeId) {
          // Connect previous item to current item
          chainEdges = chainEdges.concat(
            createChainEdge({
              source: previousNodeId,
              target,
            })
          );
        }

        // Store current node ID for next iteration
        previousNodeId = target;

        if (arrayItemValidator.isObjectData) {
          // Array > Object
          flowNodes = flowNodes.concat(
            traverse({
              traverseTarget: arrayItem as object,
              depth: _nextDepth,
              arrayIndexForObject: arrayIndex,
              sourceSet: {
                source: _source,
                sourceHandle: _sourceHandle,
              },
              parentNodePathIds: _parentNodePathIds,
            })
          );
          addDefaultEdge({
            source: _source,
            target,
            sourceHandle: _sourceHandle,
          });
        } else if (arrayItemValidator.isArrayData) {
          // Array > Array
          const items: unknown[] = arrayItem as unknown[];

          flowNodes = flowNodes.concat(
            convertArrayToNode({
              nodeId: nextNodeId,
              depth: _nextDepth,
              arrayIndex,
              items,
              parentNodePathIds: _parentNodePathIds,
              isRootNode: false,
            })
          );
          addDefaultEdge({
            source: _source,
            target,
            sourceHandle: _sourceHandle,
          });

          const isEmptyArray: boolean = items.length === 0;

          if (!isEmptyArray) {
            flowNodes = flowNodes.concat(
              traverse({
                traverseTarget: items,
                depth: _nextDepth,
                arrayIndexForObject: null,
                sourceSet: {
                  source: _source,
                  sourceHandle: _sourceHandle,
                },
                parentNodePathIds: _parentNodePathIds,
              })
            );
          }
        } else if (arrayItemValidator.isPrimitiveData) {
          // Array > Primitive
          flowNodes = flowNodes.concat(
            convertPrimitiveToNode({
              nodeId: nextNodeId,
              depth: _nextDepth,
              arrayIndex,
              value: arrayItem as string | number | boolean | null,
              parentNodePathIds: _parentNodePathIds,
            })
          );
          addDefaultEdge({
            source: _source,
            target,
            sourceHandle: _sourceHandle,
          });
        }
      });
    };

    const currentNodeId: string = formatNodeId(nodeSequence);
    const source: string = currentNodeId;
    const nextDepth: number = depth + 1;
    const nextParentNodePathIds: string[] = parentNodePathIds.concat([currentNodeId]);
    const isRootNode: boolean = sourceSet.source === undefined;

    if (isObject(traverseTarget)) {
      flowNodes = flowNodes.concat(
        convertObjectToNode({
          nodeId: currentNodeId,
          depth,
          obj: traverseTarget,
          parentNodePathIds,
          arrayIndexForObject,
          isRootNode,
        })
      );

      Object.entries(traverseTarget).forEach(([propertyK, propertyV]) => {
        const sourceHandle: string = propertyK;

        if (isObject(propertyV)) {
          traverseObject({
            _obj: propertyV,
            _nextDepth: nextDepth,
            _parentNodePathIds: nextParentNodePathIds,
            _source: source,
            _sourceHandle: sourceHandle,
          });
        } else if (isArray(propertyV)) {
          traverseArray({
            _array: propertyV,
            _nextDepth: nextDepth,
            _parentNodePathIds: nextParentNodePathIds,
            _source: source,
            _sourceHandle: sourceHandle,
          });
        }
      });
    } else if (isArray(traverseTarget)) {
      /**
       * Unlike 'object' JSON code, 'array' JSON code needs to add an extra node if root node.
       */
      if (isRootNode) {
        flowNodes = flowNodes.concat(
          convertArrayToNode({
            nodeId: currentNodeId,
            depth,
            arrayIndex: ARRAY_ROOT_NODE_INDEX,
            items: traverseTarget,
            parentNodePathIds: ROOT_PARENT_NODE_PATH_IDS,
            isRootNode,
          })
        );
      }

      traverseArray({
        _array: traverseTarget,
        _nextDepth: nextDepth,
        _parentNodePathIds: nextParentNodePathIds,
        _source: source,
        _sourceHandle: undefined,
      });
    }

    return flowNodes;
  };

  return {
    flowNodes: traverse({
      traverseTarget: json,
      depth: ROOT_NODE_DEPTH,
      parentNodePathIds: ROOT_PARENT_NODE_PATH_IDS,
      arrayIndexForObject: null,
      sourceSet: {},
    }),
    edges: [...defaultEdges, ...chainEdges],
  };
};

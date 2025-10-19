import { memo, useCallback } from 'react';
import { NodeProps, Handle, Position, useEdges } from '@xyflow/react';
import { NodeType, ArrayNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { isEmptyArray, encloseSquareBrackets } from '@/components/features/viewer/flow/utils/flow-utils';
import { ROOT_NODE_NAME } from '@/components/features/viewer/flow/utils/flow-constants';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowHandle } from '@/components/features/viewer/flow/FlowHandle';
import { FlowArrayNodeItem } from '@/components/features/viewer/flow/nodes/FlowArrayNodeItem';
import { FlowNodeToolbar } from '@/components/features/viewer/flow/components/FlowNodeToolbar';
import { useFlowNodeToolbar } from '@/components/features/viewer/flow/hooks/useFlowNodeToolbar';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-edge-factory';

const ARRAY_HANDLE_STYLE = {
  background: '#3b82f6',
  width: 10,
  height: 10,
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
} as const;

const ArrayNodeComponent = ({ id, data }: NodeProps<ArrayNodeData>) => {
  const { arrayIndex, items, isRootNode, stringifiedJson } = data;

  // Use consolidated toolbar hook
  const toolbarData = useFlowNodeToolbar({ nodeId: id });

  // Need edges to get child node IDs for each array item
  const edges = useEdges();

  const renderItems = useCallback(() => {
    if (isEmptyArray(items)) {
      return (
        <div className="text-center text-gray-400 text-xs py-4 italic">
          Empty array
        </div>
      );
    }

    // Find all child nodes for this array
    const childEdges = edges.filter(edge => edge.source === id && !edge.sourceHandle?.startsWith('chain-'));

    return childEdges.map((edge, index) => {
      const childNodeId = edge.target;

      return (
        <FlowArrayNodeItem
          key={childNodeId}
          nodeId={id}
          itemIndex={index}
          childNodeId={childNodeId}
          totalItems={childEdges.length}
        />
      );
    });
  }, [items, edges, id]);

  return (
    <div className="relative">
      <FlowNodeToolbar
        nodeId={id}
        stringifiedJson={stringifiedJson}
        hasChildren={toolbarData.hasChildren}
        isCollapsed={false}
        onToggleCollapse={undefined}
        sourceConnections={toolbarData.sourceConnections}
        targetConnections={toolbarData.targetConnections}
        connectedNodesData={toolbarData.connectedNodesData}
        copyDescription="Array JSON copied to clipboard"
      />

      <FlowNodeShell nodeId={id} nodeType={NodeType.Array}>
        {/* Handles */}
        {!isRootNode && <FlowHandle id={id} type="target" direction="horizontal" />}
        <FlowHandle id={addPrefixChain(id)} type="target" direction="vertical" isChain />

        {/* Array-specific handles (top/bottom) */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{ ...ARRAY_HANDLE_STYLE, top: -4 }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{ ...ARRAY_HANDLE_STYLE, bottom: -4 }}
        />

        {!isEmptyArray(items) && <FlowHandle id={id} type="source" direction="horizontal" />}
        <FlowHandle id={addPrefixChain(id)} type="source" direction="vertical" isChain />

        {/* Array header */}
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 border-b-2 border-blue-200 dark:border-blue-800 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">ARRAY</span>
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">
                {isRootNode ? ROOT_NODE_NAME : encloseSquareBrackets(arrayIndex)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">{items.length}</span>
              <span>{items.length === 1 ? 'item' : 'items'}</span>
            </div>
          </div>
        </div>

        {/* Array items */}
        <div className="px-2 py-1">{renderItems()}</div>
      </FlowNodeShell>
    </div>
  );
};

export const FlowArrayNode = memo(ArrayNodeComponent);

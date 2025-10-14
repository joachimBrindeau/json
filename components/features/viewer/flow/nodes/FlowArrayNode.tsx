import { memo } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { NodeType, ArrayNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { isEmptyArray, encloseSquareBrackets } from '@/components/features/viewer/flow/utils/flow-utils';
import { ROOT_NODE_NAME } from '@/components/features/viewer/flow/utils/flow-constants';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowHandle } from '@/components/features/viewer/flow/FlowHandle';
import { FlowCollapseButton } from '@/components/features/viewer/flow/FlowCollapseButton';
import { FlowNodeToolbar } from '@/components/features/viewer/flow/components/FlowNodeToolbar';
import { useFlowNodeToolbar } from '@/components/features/viewer/flow/hooks/useFlowNodeToolbar';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-edge-factory';

const ARRAY_HANDLE_STYLE = {
  background: '#60a5fa',
  width: 8,
  height: 8,
  border: '2px solid #fff',
} as const;

const ArrayNodeComponent = ({ id, data }: NodeProps<ArrayNodeData>) => {
  const { arrayIndex, items, isRootNode, isCollapsed, onToggleCollapse, stringifiedJson } = data;

  // Use consolidated toolbar hook
  const toolbarData = useFlowNodeToolbar({ nodeId: id });

  return (
    <>
      <FlowNodeToolbar
        nodeId={id}
        stringifiedJson={stringifiedJson}
        hasChildren={toolbarData.hasChildren}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
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

        {toolbarData.hasChildren && onToggleCollapse && (
          <FlowCollapseButton
            nodeId={id}
            isCollapsed={!!isCollapsed}
            onToggle={onToggleCollapse}
            position="right"
          />
        )}

        <span className="text-center font-mono text-sm">
          {isRootNode ? ROOT_NODE_NAME : encloseSquareBrackets(arrayIndex)}
        </span>
      </FlowNodeShell>
    </>
  );
};

export const FlowArrayNode = memo(ArrayNodeComponent);

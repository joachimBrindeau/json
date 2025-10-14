import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { NodeType, ArrayNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { isEmptyArray, encloseSquareBrackets } from '@/components/features/viewer/flow/utils/flow-utils';
import { ROOT_NODE_NAME } from '@/components/features/viewer/flow/utils/flow-constants';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowNodeHandles } from '@/components/features/viewer/flow/FlowNodeHandles';
import { FlowCollapseButton } from '@/components/features/viewer/flow/FlowCollapseButton';
import { FlowNodeToolbar } from '@/components/features/viewer/flow/components/FlowNodeToolbar';
import { useFlowNodeToolbar } from '@/components/features/viewer/flow/hooks/useFlowNodeToolbar';

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
        <FlowNodeHandles
          nodeId={id}
          isRootNode={isRootNode}
          hasDefaultTarget={!isRootNode}
          hasDefaultSource={!isEmptyArray(items)}
        />

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

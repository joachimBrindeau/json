import { memo } from 'react';
import { NodeProps, useEdges } from 'reactflow';
import { NodeType, ArrayNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { isEmptyArray, encloseSquareBrackets } from '@/components/features/viewer/flow/utils/flow-utils';
import { ROOT_NODE_NAME } from '@/components/features/viewer/flow/utils/flow-constants';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowNodeHandles } from '@/components/features/viewer/flow/FlowNodeHandles';
import { FlowCollapseButton } from '@/components/features/viewer/flow/FlowCollapseButton';

const ArrayNodeComponent = ({ id, data }: NodeProps<ArrayNodeData>) => {
  const edges = useEdges();
  const { arrayIndex, items, isRootNode, isCollapsed, onToggleCollapse } = data;
  const hasChildren = edges.some((edge) => edge.source === id);

  return (
    <FlowNodeShell nodeId={id} nodeType={NodeType.Array}>
      <FlowNodeHandles
        nodeId={id}
        isRootNode={isRootNode}
        hasDefaultTarget={!isRootNode}
        hasDefaultSource={!isEmptyArray(items)}
      />

      {hasChildren && onToggleCollapse && (
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
  );
};

export const FlowArrayNode = memo(ArrayNodeComponent);

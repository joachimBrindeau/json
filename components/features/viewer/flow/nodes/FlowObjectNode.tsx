import { memo, useCallback } from 'react';
import { NodeProps, useEdges } from 'reactflow';
import { NodeType, ObjectNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowObjectNodeProperty } from '@/components/features/viewer/flow/nodes/FlowObjectNodeProperty';
import { FlowNodeHandles } from '@/components/features/viewer/flow/FlowNodeHandles';
import { FlowCollapseButton } from '@/components/features/viewer/flow/FlowCollapseButton';

const ObjectNodeComponent = ({ id, data }: NodeProps<ObjectNodeData>) => {
  const edges = useEdges();
  const { obj, isRootNode, isCollapsed, onToggleCollapse } = data;
  const hasChildren = edges.some((edge) => edge.source === id);

  const renderProperties = useCallback(() => {
    return Object.entries(obj).map(([propertyK, propertyV]) => {
      const hasChildNode = edges.some(
        ({ source, sourceHandle }) => source === id && sourceHandle === propertyK
      );

      return (
        <FlowObjectNodeProperty
          key={propertyK}
          nodeId={id}
          propertyK={propertyK}
          propertyV={propertyV}
          hasChildNode={hasChildNode}
        />
      );
    });
  }, [obj, edges, id]);

  return (
    <FlowNodeShell nodeId={id} nodeType={NodeType.Object}>
      <FlowNodeHandles nodeId={id} isRootNode={isRootNode} />

      {hasChildren && onToggleCollapse && (
        <FlowCollapseButton
          nodeId={id}
          isCollapsed={!!isCollapsed}
          onToggle={onToggleCollapse}
          position="right"
        />
      )}

      <div className="space-y-0">{renderProperties()}</div>
    </FlowNodeShell>
  );
};

export const FlowObjectNode = memo(ObjectNodeComponent);

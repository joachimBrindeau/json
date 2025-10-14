import { memo, useCallback } from 'react';
import { NodeProps, useEdges } from '@xyflow/react';
import { NodeType, ObjectNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowObjectNodeProperty } from '@/components/features/viewer/flow/nodes/FlowObjectNodeProperty';
import { FlowHandle } from '@/components/features/viewer/flow/FlowHandle';
import { FlowCollapseButton } from '@/components/features/viewer/flow/FlowCollapseButton';
import { FlowNodeToolbar } from '@/components/features/viewer/flow/components/FlowNodeToolbar';
import { useFlowNodeToolbar } from '@/components/features/viewer/flow/hooks/useFlowNodeToolbar';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-edge-factory';

const ObjectNodeComponent = ({ id, data }: NodeProps<ObjectNodeData>) => {
  const { obj, isRootNode, isCollapsed, onToggleCollapse, stringifiedJson } = data;

  // Use consolidated toolbar hook
  const toolbarData = useFlowNodeToolbar({ nodeId: id });

  // Need edges to check hasChildNode per property
  const edges = useEdges();

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
        copyDescription="Object JSON copied to clipboard"
      />

      <FlowNodeShell nodeId={id} nodeType={NodeType.Object}>
        {/* Handles */}
        {!isRootNode && <FlowHandle id={id} type="target" direction="horizontal" />}
        <FlowHandle id={addPrefixChain(id)} type="target" direction="vertical" isChain />
        <FlowHandle id={addPrefixChain(id)} type="source" direction="vertical" isChain />

        {toolbarData.hasChildren && onToggleCollapse && (
          <FlowCollapseButton
            nodeId={id}
            isCollapsed={!!isCollapsed}
            onToggle={onToggleCollapse}
            position="right"
          />
        )}

        <div className="space-y-0">{renderProperties()}</div>
      </FlowNodeShell>
    </>
  );
};

export const FlowObjectNode = memo(ObjectNodeComponent);

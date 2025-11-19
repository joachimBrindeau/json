import { memo, useCallback } from 'react';
import { NodeProps, useEdges } from '@xyflow/react';
import { NodeType } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowObjectNodeProperty } from '@/components/features/viewer/flow/nodes/FlowObjectNodeProperty';
import { FlowChainHandles } from '@/components/features/viewer/flow/nodes/FlowChainHandles';
import { FlowNodeToolbar } from '@/components/features/viewer/flow/components/FlowNodeToolbar';
import { useFlowNodeToolbar } from '@/components/features/viewer/flow/hooks/useFlowNodeToolbar';

const ObjectNodeComponent = ({ id, data }: NodeProps<any>) => {
  const { obj, isRootNode, collapsedBranches, onToggleCollapse, stringifiedJson, isHighlighted } =
    data;

  // Use consolidated toolbar hook
  const toolbarData = useFlowNodeToolbar({ nodeId: id });

  // Need edges to check hasChildNode per property and get child node IDs
  const edges = useEdges();

  const renderProperties = useCallback(() => {
    return Object.entries(obj).map(([propertyK, propertyV]) => {
      // Find the edge for this property to get the child node ID
      const edge = edges.find(
        ({ source, sourceHandle }) => source === id && sourceHandle === propertyK
      );
      const hasChildNode = !!edge;
      const childNodeId = edge?.target;

      return (
        <FlowObjectNodeProperty
          key={propertyK}
          nodeId={id}
          propertyK={propertyK}
          propertyV={propertyV as any}
          hasChildNode={hasChildNode}
          childNodeId={childNodeId}
          collapsedBranches={collapsedBranches}
          onToggleCollapse={onToggleCollapse}
        />
      );
    });
  }, [obj, edges, id, collapsedBranches, onToggleCollapse]);

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
        copyDescription="Object JSON copied to clipboard"
      />

      <FlowNodeShell nodeId={id} nodeType={NodeType.Object} isHighlight={isHighlighted}>
        {/* Handles */}
        <FlowChainHandles id={id} includeHorizontalTarget={!isRootNode} />

        <div className="space-y-0">{renderProperties()}</div>
      </FlowNodeShell>
    </div>
  );
};

export const FlowObjectNode = memo(ObjectNodeComponent);

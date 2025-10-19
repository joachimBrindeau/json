import { memo, useCallback } from 'react';
import { NodeProps, useEdges, Handle, Position } from '@xyflow/react';
import { NodeType, ObjectNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowObjectNodeProperty } from '@/components/features/viewer/flow/nodes/FlowObjectNodeProperty';
import { FlowHandle } from '@/components/features/viewer/flow/FlowHandle';
import { FlowCollapseButton } from '@/components/features/viewer/flow/FlowCollapseButton';
import { FlowNodeToolbar } from '@/components/features/viewer/flow/components/FlowNodeToolbar';
import { useFlowNodeToolbar } from '@/components/features/viewer/flow/hooks/useFlowNodeToolbar';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-edge-factory';

const CHAIN_HANDLE_STYLE = {
  background: '#94a3b8',
  width: 8,
  height: 8,
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(148, 163, 184, 0.3)',
} as const;

const ObjectNodeComponent = ({ id, data }: NodeProps<ObjectNodeData>) => {
  const { obj, isRootNode, collapsedBranches, onToggleCollapse, stringifiedJson } = data;

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
          propertyV={propertyV}
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

      <FlowNodeShell nodeId={id} nodeType={NodeType.Object}>
        {/* Handles */}
        {!isRootNode && <FlowHandle id={id} type="target" direction="horizontal" />}
        <FlowHandle id={addPrefixChain(id)} type="target" direction="vertical" isChain />
        <FlowHandle id={addPrefixChain(id)} type="source" direction="vertical" isChain />

        {/* Chain handles for array items */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{ ...CHAIN_HANDLE_STYLE, top: -4 }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{ ...CHAIN_HANDLE_STYLE, bottom: -4 }}
        />

        <div className="space-y-0">{renderProperties()}</div>
      </FlowNodeShell>
    </div>
  );
};

export const FlowObjectNode = memo(ObjectNodeComponent);

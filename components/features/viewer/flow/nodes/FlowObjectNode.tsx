import { memo, useCallback } from 'react';
import { NodeProps, useEdges, Handle, Position } from 'reactflow';
import { NodeType } from '@/components/features/viewer/flow/utils/flow-types';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-parser';
import { ObjectNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowChainHandle } from '@/components/features/viewer/flow/FlowChainHandle';
import { FlowDefaultHandle } from '@/components/features/viewer/flow/FlowDefaultHandle';
import { FlowHoveringDot } from '@/components/features/viewer/flow/FlowHoveringDot';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowObjectNodeProperty } from '@/components/features/viewer/flow/nodes/FlowObjectNodeProperty';

/**
 * ObjectNode `<Handle>` Details
 *
 * source: impossible to have.
 * target: always have except for RootNode.
 */
const ObjectNodeComponent = ({ id, data }: NodeProps<ObjectNodeData>) => {
  const edges = useEdges();

  const { obj, isRootNode, isCollapsed, onToggleCollapse } = data;
  const hasChildren = edges.some((edge) => edge.source === id);

  // Simplified highlighter - in a real implementation you'd connect to a store
  const isHighlightNode = (nodeId: string) => false;

  // Simplified hover state - in a real implementation you'd connect to a store
  const hoveredNodeDetails: Array<{ nodeId: string; propertyK?: string }> = [];

  const renderProperties = useCallback(() => {
    return Object.entries(obj).map(([propertyK, propertyV]) => {
      const hasChildNode: boolean = edges.some(
        ({ source, sourceHandle }) => source === id && sourceHandle === propertyK
      );

      return (
        <ObjectNodeProperty
          key={propertyK}
          nodeId={id}
          propertyK={propertyK}
          propertyV={propertyV}
          hasChildNode={hasChildNode}
        />
      );
    });
  }, [obj, edges, id]);

  /**
   * undefined `propertyK` means a `ArrayItemCard` is hovered, not `PropertyCard`.
   */
  const isHoveredFromNodeDetail: boolean = hoveredNodeDetails.some(
    ({ nodeId, propertyK }) => nodeId === id && propertyK === undefined
  );

  return (
    <FlowNodeShell nodeId={id} nodeType={NodeType.Object} isHighlight={isHighlightNode(id)}>
      <FlowDefaultHandle id={id} type="target" />
      {!isRootNode && <FlowChainHandle id={addPrefixChain(id)} type="target" />}
      
      {/* Add top handle for array connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: '#60a5fa',
          width: 8,
          height: 8,
          border: '2px solid #fff',
          top: -4,
        }}
      />

      {hasChildren && (
        <div
          className="absolute -right-6 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 w-5 h-5 flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 z-10"
          style={{ borderRadius: '3px' }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.(id);
          }}
        >
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
            {isCollapsed ? '+' : '-'}
          </span>
        </div>
      )}

      <div className="space-y-0">{renderProperties()}</div>

      {isHoveredFromNodeDetail && <FlowHoveringDot />}
      <FlowChainHandle id={addPrefixChain(id)} type="source" />
      
      {/* Add bottom handle for array connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#60a5fa',
          width: 8,
          height: 8,
          border: '2px solid #fff',
          bottom: -4,
        }}
      />
    </FlowNodeShell>
  );
};

export const FlowObjectNode = memo(ObjectNodeComponent);
export const ObjectNode = FlowObjectNode;

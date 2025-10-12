import { memo } from 'react';
import { NodeProps, useEdges, Handle, Position } from 'reactflow';
import { NodeType } from '@/components/features/viewer/flow/utils/flow-types';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-parser';
import { ArrayNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { isEmptyArray, encloseSquareBrackets } from '@/components/features/viewer/flow/utils/flow-utils';
import { ROOT_NODE_NAME } from '@/components/features/viewer/flow/utils/flow-constants';
import { FlowChainHandle } from '@/components/features/viewer/flow/FlowChainHandle';
import { FlowDefaultHandle } from '@/components/features/viewer/flow/FlowDefaultHandle';
import { FlowHoveringDot } from '@/components/features/viewer/flow/FlowHoveringDot';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';

/**
 * ArrayNode `<Handle>` Details
 *
 * source: can have if array includes at least one item.
 * target: always have except for RootNode.
 */
const ArrayNodeComponent = ({ id, data }: NodeProps<ArrayNodeData>) => {
  const edges = useEdges();
  const { arrayIndex, items, isRootNode, isCollapsed, onToggleCollapse } = data;
  const hasChildren = edges.some((edge) => edge.source === id);

  // Simplified highlighter - in a real implementation you'd connect to a store
  const isHighlightNode = (nodeId: string) => false;

  // Simplified hover state - in a real implementation you'd connect to a store
  const hoveredNodeDetails: Array<{ nodeId: string }> = [];

  const isHoveredFromNodeDetail: boolean = hoveredNodeDetails.some(({ nodeId }) => nodeId === id);

  return (
    <FlowNodeShell nodeId={id} nodeType={NodeType.Array} isHighlight={isHighlightNode(id)}>
      {!isRootNode && <FlowDefaultHandle id={id} type="target" />}
      <FlowChainHandle id={addPrefixChain(id)} type="target" />
      
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
          className="absolute -right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 w-5 h-5 flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 z-10"
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

      <span className="text-center font-mono text-sm">
        {isRootNode ? ROOT_NODE_NAME : encloseSquareBrackets(arrayIndex)}
      </span>

      {!isEmptyArray(items) && <FlowDefaultHandle id={id} type="source" />}

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

export const FlowArrayNode = memo(ArrayNodeComponent);

// Backwards compatibility
export const ArrayNode = FlowArrayNode;

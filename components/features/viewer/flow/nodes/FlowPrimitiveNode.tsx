import { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { JsonDataType, NodeType } from '@/components/features/viewer/flow/utils/flow-types';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-parser';
import { PrimitiveNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowBooleanChip } from '@/components/features/viewer/flow/nodes/FlowBooleanChip';
import { FlowNullChip } from '@/components/features/viewer/flow/nodes/FlowNullChip';
import { FlowChainHandle } from '@/components/features/viewer/flow/FlowChainHandle';
import { FlowDefaultHandle } from '@/components/features/viewer/flow/FlowDefaultHandle';
import { FlowHoveringDot } from '@/components/features/viewer/flow/FlowHoveringDot';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';

/**
 * PrimitiveNode `<Handle>` Details
 *
 * source: impossible to have.
 * target: always have.
 */
const _PrimitiveNode = ({ id, data }: NodeProps<PrimitiveNodeData>) => {
  // Simplified highlighter - in a real implementation you'd connect to a store
  const isHighlightNode = (nodeId: string) => false;

  // Simplified hover state - in a real implementation you'd connect to a store
  const hoveredNodeDetails: Array<{ nodeId: string }> = [];

  const isHoveredFromNodeDetail: boolean = hoveredNodeDetails.some(({ nodeId }) => nodeId === id);

  return (
    <FlowNodeShell nodeId={id} nodeType={NodeType.Primitive} isHighlight={isHighlightNode(id)}>
      <FlowDefaultHandle id={id} type="target" />
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

      <div className="text-center">
        {data.dataType === JsonDataType.String && (
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-mono">
            {data.stringifiedJson}
          </span>
        )}

        {data.dataType === JsonDataType.Number && (
          <span className="text-green-600 font-mono text-sm">{data.value}</span>
        )}

        {data.dataType === JsonDataType.Boolean && (
          <FlowBooleanChip value={data.value as boolean} size="sm" />
        )}

        {data.dataType === JsonDataType.Null && <FlowNullChip size="sm" />}
      </div>

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

export const FlowPrimitiveNode = memo(_PrimitiveNode);
export const PrimitiveNode = FlowPrimitiveNode;

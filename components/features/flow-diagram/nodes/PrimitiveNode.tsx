import { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { JsonDataType, NodeType } from '@/components/features/flow-diagram/utils/types';
import { addPrefixChain } from '@/components/features/flow-diagram/utils/json-parser';
import { PrimitiveNodeData } from '@/components/features/flow-diagram/utils/types';
import { BooleanChip } from '@/components/features/flow-diagram/nodes/BooleanChip';
import { NullChip } from '@/components/features/flow-diagram/nodes/NullChip';
import { ChainHandle } from '@/components/features/flow-diagram/ChainHandle';
import { DefaultHandle } from '@/components/features/flow-diagram/DefaultHandle';
import { HoveringBlueDot } from '@/components/features/flow-diagram/HoveringBlueDot';
import { NodeShell } from '@/components/features/flow-diagram/nodes/NodeShell';

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
    <NodeShell nodeId={id} nodeType={NodeType.Primitive} isHighlight={isHighlightNode(id)}>
      <DefaultHandle id={id} type="target" />
      <ChainHandle id={addPrefixChain(id)} type="target" />
      
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
          <BooleanChip value={data.value as boolean} size="sm" />
        )}

        {data.dataType === JsonDataType.Null && <NullChip size="sm" />}
      </div>

      {isHoveredFromNodeDetail && <HoveringBlueDot />}
      <ChainHandle id={addPrefixChain(id)} type="source" />
      
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
    </NodeShell>
  );
};

export const PrimitiveNode = memo(_PrimitiveNode);

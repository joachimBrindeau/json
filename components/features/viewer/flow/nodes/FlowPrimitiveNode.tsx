import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { JsonDataType, NodeType, PrimitiveNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowBooleanChip } from '@/components/features/viewer/flow/nodes/FlowBooleanChip';
import { FlowNullChip } from '@/components/features/viewer/flow/nodes/FlowNullChip';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowNodeHandles } from '@/components/features/viewer/flow/FlowNodeHandles';

const PrimitiveNodeComponent = ({ id, data }: NodeProps<PrimitiveNodeData>) => {
  return (
    <FlowNodeShell nodeId={id} nodeType={NodeType.Primitive}>
      <FlowNodeHandles nodeId={id} hasDefaultTarget hasDefaultSource={false} />

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
    </FlowNodeShell>
  );
};

export const FlowPrimitiveNode = memo(PrimitiveNodeComponent);

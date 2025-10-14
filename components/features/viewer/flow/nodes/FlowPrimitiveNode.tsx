import { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { JsonDataType, NodeType, PrimitiveNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowBooleanChip } from '@/components/features/viewer/flow/nodes/FlowBooleanChip';
import { FlowNullChip } from '@/components/features/viewer/flow/nodes/FlowNullChip';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowNodeHandles } from '@/components/features/viewer/flow/FlowNodeHandles';

/**
 * Lookup pattern for rendering different primitive types
 * Follows KISS principle - simpler than multiple conditionals
 */
const PRIMITIVE_RENDERERS: Record<JsonDataType, (data: PrimitiveNodeData) => JSX.Element> = {
  [JsonDataType.String]: (data) => (
    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-mono">
      {data.stringifiedJson}
    </span>
  ),
  [JsonDataType.Number]: (data) => (
    <span className="text-green-600 font-mono text-sm">{data.value}</span>
  ),
  [JsonDataType.Boolean]: (data) => (
    <FlowBooleanChip value={data.value as boolean} size="sm" />
  ),
  [JsonDataType.Null]: () => <FlowNullChip size="sm" />,
  // Fallback for object/array (should not happen in primitive nodes)
  [JsonDataType.Object]: () => <span className="text-sm">Object</span>,
  [JsonDataType.Array]: () => <span className="text-sm">Array</span>,
};

const PrimitiveNodeComponent = ({ id, data }: NodeProps<PrimitiveNodeData>) => {
  const renderer = PRIMITIVE_RENDERERS[data.dataType];

  return (
    <FlowNodeShell nodeId={id} nodeType={NodeType.Primitive}>
      <FlowNodeHandles nodeId={id} hasDefaultTarget hasDefaultSource={false} />
      <div className="text-center">{renderer(data)}</div>
    </FlowNodeShell>
  );
};

export const FlowPrimitiveNode = memo(PrimitiveNodeComponent);

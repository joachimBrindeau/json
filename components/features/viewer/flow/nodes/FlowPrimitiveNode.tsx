import { memo } from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { JsonDataType, NodeType, PrimitiveNodeData } from '@/components/features/viewer/flow/utils/flow-types';
import { FlowBooleanChip } from '@/components/features/viewer/flow/nodes/FlowBooleanChip';
import { FlowNullChip } from '@/components/features/viewer/flow/nodes/FlowNullChip';
import { FlowNodeShell } from '@/components/features/viewer/flow/nodes/FlowNodeShell';
import { FlowHandle } from '@/components/features/viewer/flow/FlowHandle';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-edge-factory';

const CHAIN_HANDLE_STYLE = {
  background: '#94a3b8',
  width: 8,
  height: 8,
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(148, 163, 184, 0.3)',
} as const;

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
      {/* Handles - primitive nodes only have target handles */}
      <FlowHandle id={id} type="target" direction="horizontal" />
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

      <div className="text-center">{renderer(data)}</div>
    </FlowNodeShell>
  );
};

export const FlowPrimitiveNode = memo(PrimitiveNodeComponent);

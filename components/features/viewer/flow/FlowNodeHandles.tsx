import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FlowDefaultHandle } from './FlowDefaultHandle';
import { FlowChainHandle } from './FlowChainHandle';
import { addPrefixChain } from './utils/flow-parser';

const ARRAY_HANDLE_STYLE = {
  background: '#60a5fa',
  width: 8,
  height: 8,
  border: '2px solid #fff',
} as const;

interface NodeHandlesProps {
  nodeId: string;
  isRootNode?: boolean;
  hasDefaultTarget?: boolean;
  hasDefaultSource?: boolean;
  hasArrayHandles?: boolean;
}

const NodeHandlesComponent = ({
  nodeId,
  isRootNode = false,
  hasDefaultTarget = true,
  hasDefaultSource = false,
  hasArrayHandles = true,
}: NodeHandlesProps) => {
  return (
    <>
      {hasDefaultTarget && !isRootNode && <FlowDefaultHandle id={nodeId} type="target" />}
      <FlowChainHandle id={addPrefixChain(nodeId)} type="target" />

      {hasArrayHandles && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="top"
            style={{ ...ARRAY_HANDLE_STYLE, top: -4 }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            style={{ ...ARRAY_HANDLE_STYLE, bottom: -4 }}
          />
        </>
      )}

      {hasDefaultSource && <FlowDefaultHandle id={nodeId} type="source" />}
      <FlowChainHandle id={addPrefixChain(nodeId)} type="source" />
    </>
  );
};

export const FlowNodeHandles = memo(NodeHandlesComponent);

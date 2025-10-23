'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FlowHandle } from '@/components/features/viewer/flow/FlowHandle';
import { addPrefixChain } from '@/components/features/viewer/flow/utils/flow-edge-factory';

export const CHAIN_HANDLE_STYLE = {
  background: '#94a3b8',
  width: 8,
  height: 8,
  border: '2px solid #fff',
  boxShadow: '0 2px 4px rgba(148, 163, 184, 0.3)',
} as const;

export function FlowChainHandles({
  id,
  includeHorizontalTarget,
}: {
  id: string;
  includeHorizontalTarget: boolean;
}) {
  return (
    <>
      {includeHorizontalTarget && <FlowHandle id={id} type="target" direction="horizontal" />}
      <FlowHandle id={addPrefixChain(id)} type="target" direction="vertical" isChain />
      <FlowHandle id={addPrefixChain(id)} type="source" direction="vertical" isChain />

      {/* Chain handles for array/items */}
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
    </>
  );
}

/**
 * FlowRootNode - Root entry point node for JSON visualization
 * 
 * Provides clear visual indication of the JSON structure's starting point
 */

'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Database, Braces, Brackets } from 'lucide-react';
import { RootNodeData } from '../utils/flow-types';
import { FlowNodeShell } from './FlowNodeShell';

interface FlowRootNodeProps {
  data: RootNodeData;
  id: string;
}

const FlowRootNodeComponent = ({ data, id }: FlowRootNodeProps) => {
  const { label, childType, childCount } = data;

  // Choose icon based on child type
  const Icon = childType === 'object' ? Braces : Brackets;
  const typeLabel = childType === 'object' ? 'Object' : 'Array';
  const countLabel = childType === 'object' 
    ? `${childCount} ${childCount === 1 ? 'property' : 'properties'}`
    : `${childCount} ${childCount === 1 ? 'item' : 'items'}`;

  return (
    <FlowNodeShell
      nodeId={id}
      depth={data.depth}
      title={
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-900">{label}</span>
        </div>
      }
      className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{typeLabel}</span>
            <span className="text-xs text-gray-600">{countLabel}</span>
          </div>
        </div>
      </div>

      {/* Source handle - connects to child nodes */}
      <Handle
        type="source"
        position={Position.Right}
        id="root-output"
        className="!bg-blue-500 !w-3 !h-3 !border-2 !border-white"
      />
    </FlowNodeShell>
  );
};

export const FlowRootNode = memo(FlowRootNodeComponent);


/**
 * FlowRootNode - Root entry point node for JSON visualization
 * 
 * Provides clear visual indication of the JSON structure's starting point
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';
import { Database, Braces, Brackets, Copy, Info } from 'lucide-react';
import { RootNodeData } from '../utils/flow-types';
import { FlowNodeShell } from './FlowNodeShell';
import { useToast } from '@/hooks/use-toast';

interface FlowRootNodeProps {
  data: RootNodeData;
  id: string;
}

const FlowRootNodeComponent = ({ data, id }: FlowRootNodeProps) => {
  const { label, childType, childCount, stringifiedJson } = data;
  const { toast } = useToast();

  // Choose icon based on child type
  const Icon = childType === 'object' ? Braces : Brackets;
  const typeLabel = childType === 'object' ? 'Object' : 'Array';
  const countLabel = childType === 'object'
    ? `${childCount} ${childCount === 1 ? 'property' : 'properties'}`
    : `${childCount} ${childCount === 1 ? 'item' : 'items'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(stringifiedJson);
    toast({
      title: 'Copied!',
      description: 'Root node info copied to clipboard',
    });
  };

  const handleInfo = () => {
    toast({
      title: 'Root Node',
      description: `${typeLabel} with ${countLabel}`,
    });
  };

  return (
    <>
      <NodeToolbar
        isVisible
        position={Position.Top}
        align="center"
        offset={10}
        className="flex gap-1 bg-white dark:bg-gray-950 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-800"
      >
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Copy info"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleInfo}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Show info"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </NodeToolbar>

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
    </>
  );
};

export const FlowRootNode = memo(FlowRootNodeComponent);


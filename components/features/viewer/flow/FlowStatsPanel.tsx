/**
 * FlowStatsPanel - Statistics panel for React Flow
 * 
 * Displays:
 * - Total nodes count
 * - Max depth
 * - Node type counts (Root, Object, Array, Primitive)
 */

'use client';

import { useMemo } from 'react';
import { useReactFlow, Panel } from '@xyflow/react';
import { BarChart3 } from 'lucide-react';
import { NodeType } from './utils/flow-types';

export function FlowStatsPanel() {
  const { getNodes } = useReactFlow();
  const nodes = getNodes();

  const stats = useMemo(() => {
    const rootCount = nodes.filter(n => n.type === NodeType.Root).length;
    const objectCount = nodes.filter(n => n.type === NodeType.Object).length;
    const arrayCount = nodes.filter(n => n.type === NodeType.Array).length;
    const primitiveCount = nodes.filter(n => n.type === NodeType.Primitive).length;

    // Calculate max depth
    const maxDepth = nodes.reduce((max, node) => {
      const depth = node.data?.depth || 0;
      return Math.max(max, depth);
    }, 0);

    return {
      total: nodes.length,
      maxDepth,
      rootCount,
      objectCount,
      arrayCount,
      primitiveCount,
    };
  }, [nodes]);

  return (
    <Panel 
      position="top-right" 
      className="bg-white dark:bg-gray-950 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 min-w-[180px]"
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-800">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold">Statistics</h3>
      </div>
      
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total Nodes:</span>
          <span className="font-semibold">{stats.total}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Max Depth:</span>
          <span className="font-semibold">{stats.maxDepth}</span>
        </div>

        <div className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-800">
          <div className="flex justify-between">
            <span className="text-blue-600">Root:</span>
            <span className="font-semibold">{stats.rootCount}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-blue-500">Objects:</span>
            <span className="font-semibold">{stats.objectCount}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-purple-500">Arrays:</span>
            <span className="font-semibold">{stats.arrayCount}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-green-500">Primitives:</span>
            <span className="font-semibold">{stats.primitiveCount}</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}


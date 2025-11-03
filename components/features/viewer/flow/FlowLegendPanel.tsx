/**
 * FlowLegendPanel - Legend panel for React Flow
 *
 * Displays node type colors and meanings
 */

'use client';

import { Panel } from '@xyflow/react';
import { Info, Database, Braces, Brackets, Type } from 'lucide-react';

export function FlowLegendPanel() {
  return (
    <Panel
      position="bottom-right"
      className="bg-white dark:bg-gray-950 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 min-w-[160px]"
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-800">
        <Info className="h-4 w-4 text-gray-600" />
        <h3 className="text-sm font-semibold">Legend</h3>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500" />
          <Database className="h-3 w-3 text-blue-600" />
          <span>Root</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800" />
          <Braces className="h-3 w-3 text-blue-500" />
          <span>Object</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800" />
          <Brackets className="h-3 w-3 text-purple-500" />
          <span>Array</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" />
          <Type className="h-3 w-3 text-green-500" />
          <span>Primitive</span>
        </div>
      </div>
    </Panel>
  );
}

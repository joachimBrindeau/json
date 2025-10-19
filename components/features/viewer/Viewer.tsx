/**
 * Main Viewer component - orchestrates between different view modes
 */

'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TreePine as TreeIcon, Code, Waves, Eye, Database } from 'lucide-react';
import { ViewerTree } from './ViewerTree';
import { ViewerRaw } from './ViewerRaw';
import { ViewerFlow } from './ViewerFlow';
import { ViewerList } from './ViewerList';
import { ViewerActions } from './ViewerActions';
import { useJsonParser } from './useJsonParser';
import { useAutoOptimize } from './useAutoOptimize';
import { useSearch } from '@/hooks/use-search';
import type { ViewMode } from './types';
import type { JsonValue } from '@/lib/types/json';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface ViewerProps {
  jsonString?: string;
  content?: string | JsonValue;
  initialMode?: ViewMode;
  enableActions?: boolean;
  height?: number;
  className?: string;
  initialViewMode?: ViewMode;
  viewMode?: ViewMode; // Controlled mode
  onViewModeChange?: (mode: ViewMode) => void; // Controlled mode callback
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  enableSearch?: boolean;
  enableViewModeSwitch?: boolean;
  maxNodes?: number;
  virtualizeThreshold?: number;
}

const VIEW_MODES = [
  {
    type: 'tree' as ViewMode,
    label: 'Tree View',
    icon: TreeIcon,
    description: 'Hierarchical tree structure',
  },
  {
    type: 'raw' as ViewMode,
    label: 'Raw JSON',
    icon: Code,
    description: 'Formatted JSON text',
  },
  {
    type: 'flow' as ViewMode,
    label: 'Flow View',
    icon: Waves,
    description: 'Visual flow diagram',
  },
  {
    type: 'list' as ViewMode,
    label: 'List View',
    icon: Database,
    description: 'Flat list with search',
  },
];

export const Viewer = ({
  jsonString,
  content,
  initialMode = 'tree',
  initialViewMode = 'tree',
  viewMode: controlledViewMode,
  onViewModeChange,
  searchTerm: controlledSearchTerm,
  onSearchChange: controlledOnSearchChange,
  enableActions = true,
  height,
  className = '',
  enableSearch = true,
  enableViewModeSwitch = true,
  maxNodes,
  virtualizeThreshold,
}: ViewerProps) => {
  // Use controlled mode if provided, otherwise use internal state
  const effectiveInitialMode = initialViewMode || initialMode;
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(effectiveInitialMode);

  const viewMode = controlledViewMode ?? internalViewMode;

  const setViewMode = (mode: ViewMode) => {
    if (controlledViewMode !== undefined) {
      onViewModeChange?.(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  // Centralized search state management
  const { searchTerm: internalSearch, setSearchTerm: setInternalSearch } = useSearch();
  const effectiveSearch = controlledSearchTerm ?? internalSearch;
  const effectiveSetSearch = controlledOnSearchChange ?? setInternalSearch;

  // Handle both jsonString and content props for backwards compatibility
  const jsonStr = useMemo(() => {
    if (jsonString) return jsonString;
    if (typeof content === 'string') return content;
    if (content) return JSON.stringify(content, null, 2);
    return '';
  }, [jsonString, content]);

  // Parse JSON
  const { data, error, stats } = useJsonParser(jsonStr);

  // Auto-detect optimization needs - pass maxNodes prop to allow override
  const { shouldVirtualize, performanceLevel } = useAutoOptimize(jsonStr, data, maxNodes);

  if (error) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 font-semibold mb-2">Invalid JSON</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center text-gray-500">
          No JSON data to display
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('viewer-container h-full flex flex-col', className)}>
      {/* Header */}
      {(enableViewModeSwitch || enableActions || stats) && (
        <div className="viewer-header flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          {/* View mode selector */}
          {enableViewModeSwitch && (
            <div className="flex rounded-lg border bg-white" data-testid="view-mode">
              {VIEW_MODES.map((mode, index) => {
                const Icon = mode.icon;
                const isFirst = index === 0;
                const isLast = index === VIEW_MODES.length - 1;
                return (
                  <Button
                    key={mode.type}
                    variant={viewMode === mode.type ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(mode.type)}
                    data-testid={`${mode.type}-view`}
                    className={`
                      ${isFirst ? 'rounded-r-none' : ''}
                      ${!isFirst && !isLast ? 'rounded-none border-x' : ''}
                      ${isLast ? 'rounded-l-none' : ''}
                      h-9
                    `}
                    title={mode.description}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {mode.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="flex gap-2">
              <Badge variant="outline">{stats.type}</Badge>
              <Badge variant="outline">
                {stats.keys} {stats.type === 'array' ? 'items' : 'keys'}
              </Badge>
              <Badge variant="outline">
                {(stats.size / 1024).toFixed(1)} KB
              </Badge>
              {shouldVirtualize && (
                <Badge variant="secondary">
                  <Eye className="h-3 w-3 mr-1" />
                  Virtualized
                </Badge>
              )}
            </div>
          )}

          {/* Performance indicator */}
          {performanceLevel !== 'excellent' && (
            <Badge
              variant={
                performanceLevel === 'critical'
                  ? 'destructive'
                  : performanceLevel === 'warning'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {performanceLevel === 'critical' && 'Large JSON'}
              {performanceLevel === 'warning' && 'Medium JSON'}
              {performanceLevel === 'good' && 'Optimized'}
            </Badge>
          )}
        </div>

        {/* Actions */}
        {enableActions && (
          <div className="flex items-center gap-2">
            <ViewerActions />
          </div>
        )}
      </div>
      )}

      {/* Content */}
      <div className={cn('viewer-content flex-1 overflow-hidden')}>
        {viewMode === 'tree' && (
          <ViewerTree
            data={data}
            virtualized={shouldVirtualize}
            height={height}
            enableSearch={enableSearch}
            searchTerm={effectiveSearch}
            onSearchChange={effectiveSetSearch}
            maxNodes={maxNodes}
          />
        )}

        {viewMode === 'raw' && (
          <ViewerRaw data={data} height={height} />
        )}

        {viewMode === 'flow' && (
          <ViewerFlow data={data} height={height} />
        )}

        {viewMode === 'list' && (
          <ViewerList
            data={data}
            height={height}
            searchTerm={effectiveSearch}
            onSearchChange={effectiveSetSearch}
            virtualizeThreshold={virtualizeThreshold}
          />
        )}
      </div>
    </div>
  );
};


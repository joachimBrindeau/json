'use client';

import { useMemo, memo, useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileJson, Eye, Code } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { JsonEmptyState, JsonErrorState } from '@/components/shared/EmptyStates';
// Import fixed - components are defined inline or use proper imports

// Dynamically import the ultra optimized viewer
const UltraJsonViewer = dynamic(
  () =>
    import('@/components/features/json-viewer/ultra-optimized-viewer/UltraJsonViewer').then((mod) => ({
      default: mod.UltraJsonViewer,
    })),
  {
    loading: () => <div className="flex items-center justify-center h-64">Loading viewer...</div>,
    ssr: false,
  }
);

interface SimpleJsonViewerProps {
  content: string;
}

type ViewMode = 'viewer' | 'raw';

function SimpleJsonViewerComponent({ content }: SimpleJsonViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('viewer');
  const [showSettings, setShowSettings] = useState(false);

  const { parsedData, stats, error, shouldUseOptimized } = useMemo(() => {
    if (!content.trim()) {
      return { parsedData: null, stats: null, error: null, shouldUseOptimized: false };
    }

    try {
      const parsed = JSON.parse(content);
      const size = content.length;
      const stats = {
        type: Array.isArray(parsed) ? 'Array' : typeof parsed,
        size,
        keys: Array.isArray(parsed)
          ? parsed.length
          : typeof parsed === 'object' && parsed !== null
            ? Object.keys(parsed).length
            : 0,
      };

      // Auto-select optimized viewer for large JSON (>1MB or >10k nodes)
      const shouldUseOptimized = size > 1024 * 1024 || stats.keys > 10000;

      return { parsedData: parsed, stats, error: null, shouldUseOptimized };
    } catch (err) {
      return {
        parsedData: null,
        stats: null,
        error: err instanceof Error ? err.message : 'Invalid JSON',
        shouldUseOptimized: false,
      };
    }
  }, [content]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const renderViewer = useCallback(() => {
    if (error) return <div>Error: {error}</div>;
    if (!parsedData) return <div>No data</div>;

    switch (viewMode) {
      case 'viewer':
        return (
          <ErrorBoundary fallback={<div>Error loading viewer</div>}>
            <UltraJsonViewer content={content} />
          </ErrorBoundary>
        );
      case 'raw':
      default:
        return (
          <Card className="h-full">
            <pre className="p-4 text-sm overflow-auto h-full whitespace-pre-wrap font-mono">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </Card>
        );
    }
  }, [error, parsedData, viewMode, content]);

  // Use shared empty states
  const renderEmptyState = () => <JsonEmptyState />;
  const renderErrorState = (error: string) => <JsonErrorState error={error} />;

  if (!content.trim()) {
    return renderEmptyState();
  }

  if (error) {
    return renderErrorState(error);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">JSON Viewer</h2>
            {shouldUseOptimized && <Badge variant="secondary">Large JSON Detected</Badge>}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Buttons */}
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === 'viewer' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('viewer')}
                className="rounded-r-none"
              >
                <Eye className="h-4 w-4 mr-1" />
                Viewer
              </Button>
              <Button
                variant={viewMode === 'raw' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('raw')}
                className="rounded-l-none"
              >
                <Code className="h-4 w-4 mr-1" />
                Raw
              </Button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="flex gap-2">
                <Badge variant="outline">{stats.type}</Badge>
                <Badge variant="outline">
                  {stats.keys} {stats.type === 'Array' ? 'items' : 'keys'}
                </Badge>
                <Badge variant="outline">{(stats.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderViewer()}</div>
    </div>
  );
}

export const SimpleJsonViewer = memo(SimpleJsonViewerComponent);
SimpleJsonViewer.displayName = 'SimpleJsonViewer';

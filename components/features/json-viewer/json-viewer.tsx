'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileJson, 
  Eye, 
  Code, 
  TreePine as TreeIcon, 
  Database, 
  Waves, 
  Copy, 
  Download,
  Search,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { UltraJsonViewer } from '@/components/features/json-viewer/ultra-optimized-viewer/UltraJsonViewer';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useToast } from '@/hooks/use-toast';
import { validateJson, formatJson } from '@/lib/json';
import { JsonEmptyState, JsonErrorState } from '@/components/shared/EmptyStates';
import dynamic from 'next/dynamic';

// Dynamically load heavy components for better performance
const JsonFlowView = dynamic(() => import('@/components/features/flow-diagram/JsonFlowView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface JsonViewerProps {
  content: string;
  className?: string;
  initialViewMode?: ViewMode;
  maxHeight?: string;
  enableSearch?: boolean;
  enableDownload?: boolean;
  enableCopy?: boolean;
}

type ViewMode = 'tree' | 'raw' | 'flow';

interface ViewModeConfig {
  type: ViewMode;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const VIEW_MODES: ViewModeConfig[] = [
  {
    type: 'tree',
    label: 'Tree View',
    icon: TreeIcon,
    description: 'Hierarchical tree structure',
  },
  {
    type: 'raw',
    label: 'Raw JSON',
    icon: Code,
    description: 'Formatted JSON text',
  },
  {
    type: 'flow',
    label: 'Sea View',
    icon: Waves,
    description: 'Visual flow diagram',
  },
];

function JsonViewerComponent({
  content,
  className = '',
  initialViewMode = 'tree',
  maxHeight = '600px',
  enableSearch = true,
  enableDownload = true,
  enableCopy = true,
}: JsonViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { parsedData, stats, error, isValidJson } = useMemo(() => {
    if (!content.trim()) {
      return { 
        parsedData: null, 
        stats: null, 
        error: null, 
        isValidJson: false 
      };
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

      return { 
        parsedData: parsed, 
        stats, 
        error: null, 
        isValidJson: true 
      };
    } catch (err) {
      return {
        parsedData: null,
        stats: null,
        error: err instanceof Error ? err.message : 'Invalid JSON',
        isValidJson: false,
      };
    }
  }, [content]);

  const handleCopyJSON = useCallback(async () => {
    if (!enableCopy || !content) return;
    
    try {
      const formattedJson = formatJson(content) || content;
      await navigator.clipboard.writeText(formattedJson);
      toast({
        title: 'Copied!',
        description: 'JSON copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
      });
    }
  }, [content, enableCopy, toast]);

  const handleDownloadJSON = useCallback(() => {
    if (!enableDownload || !content) return;

    try {
      const formattedJson = formatJson(content) || content;
      const blob = new Blob([formattedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `json-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Downloaded!',
        description: 'JSON file has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to download JSON file',
        variant: 'destructive',
      });
    }
  }, [content, enableDownload, toast]);

  // Use shared empty states
  const renderEmptyState = () => <JsonEmptyState />;
  const renderErrorState = () => <JsonErrorState error={error || 'Unknown error'} />;

  const renderTreeView = () => (
    <ErrorBoundary fallback={<div>Error loading tree viewer</div>}>
      <UltraJsonViewer 
        content={parsedData} 
        className="h-full"
        initialViewMode="tree"
      />
    </ErrorBoundary>
  );

  const renderRawView = () => (
    <Card className="h-full">
      <ScrollArea className="h-full">
        <pre className="p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed">
          {formatJson(content) || content}
        </pre>
      </ScrollArea>
    </Card>
  );

  const renderFlowView = () => {
    if (!parsedData) return renderEmptyState();
    
    return (
      <ErrorBoundary fallback={<div>Error loading flow view</div>}>
        <div className="h-full">
          <JsonFlowView json={parsedData} className="w-full h-full" />
        </div>
      </ErrorBoundary>
    );
  };

  const renderContent = () => {
    if (!content.trim()) return renderEmptyState();
    if (error) return renderErrorState();

    switch (viewMode) {
      case 'tree':
        return renderTreeView();
      case 'raw':
        return renderRawView();
      case 'flow':
        return renderFlowView();
      default:
        return renderTreeView();
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className={`json-viewer flex flex-col h-full ${className}`} data-testid="json-viewer">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">JSON Viewer</h2>
          </div>
          
          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{stats.type}</Badge>
              <Badge variant="outline">
                {stats.keys} {stats.type === 'Array' ? 'items' : 'keys'}
              </Badge>
              <Badge variant="outline">{formatSize(stats.size)}</Badge>
              <Badge variant={isValidJson ? 'default' : 'destructive'} className="text-xs">
                {isValidJson ? '✓ Valid' : '✗ Invalid'}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          {enableSearch && isValidJson && (
            <div className="flex items-center gap-2 mr-4">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search JSON..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-32 h-8"
              />
            </div>
          )}

          {/* Action buttons */}
          {enableCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJSON}
              disabled={!content}
              className="h-8 px-3"
              data-testid="copy-button"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          )}
          
          {enableDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJSON}
              disabled={!content}
              className="h-8 px-3"
              data-testid="download-button"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b bg-white">
        <Tabs 
          value={viewMode} 
          onValueChange={(value) => setViewMode(value as ViewMode)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full h-12 p-1">
            {VIEW_MODES.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <TabsTrigger
                  key={mode.type}
                  value={mode.type}
                  className="flex items-center gap-2 data-[state=active]:bg-white"
                  disabled={mode.type === 'flow' && !isValidJson}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-hidden" 
        style={{ maxHeight }}
        data-testid={`${viewMode}-view-content`}
      >
        {renderContent()}
      </div>

      {/* Footer with additional info */}
      {stats && isValidJson && (
        <div className="px-4 py-2 border-t bg-gray-50/50 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              Viewing {stats.type.toLowerCase()} with {stats.keys} {stats.type === 'Array' ? 'items' : 'properties'}
            </span>
            <span>
              Size: {formatSize(stats.size)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export const JsonViewer = memo(JsonViewerComponent);
JsonViewer.displayName = 'JsonViewer';
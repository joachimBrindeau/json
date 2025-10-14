'use client';

import React, { memo, useState, useCallback, useMemo, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import { UnifiedButton } from '@/components/ui/unified-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  TreePine as TreeIcon,
  Database,
  Waves,
  Copy,
  Download,
  Search,
  Settings,
  Filter,
  FileJson,
} from 'lucide-react';
import { useJsonProcessing, JsonNode } from './hooks/useJsonProcessing';
import { ErrorBoundary } from '../error-boundary';
import { useToast } from '@/hooks/use-toast';
import { VIEWER_CONFIG } from '@/lib/config/viewer-config';

export interface ViewerMode {
  type: 'tree' | 'flow' | 'list' | 'raw';
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

export interface JsonViewerBaseProps {
  content: string | object;
  className?: string;
  
  // View configuration
  availableViewModes?: ViewerMode['type'][];
  initialViewMode?: ViewerMode['type'];
  maxHeight?: string;
  
  // Feature toggles
  enableSearch?: boolean;
  enableViewModeSwitch?: boolean;
  enableDownload?: boolean;
  enableCopy?: boolean;
  enableStats?: boolean;
  enablePerformanceInfo?: boolean;
  
  // Performance options
  maxNodes?: number;
  virtualizeThreshold?: number;
  
  // Search
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  
  // Events
  onViewModeChange?: (mode: ViewerMode['type']) => void;
  onNodeDoubleClick?: (node: JsonNode) => void;
  
  // Custom renderers
  renderFlowView?: (data: any) => React.ReactNode;
  renderCustomView?: (data: any, viewMode: string) => React.ReactNode;
  
  // Styling
  compactMode?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

const DEFAULT_VIEWER_MODES: ViewerMode[] = [
  {
    type: 'tree',
    label: 'Tree View',
    icon: TreeIcon,
    description: 'Hierarchical tree structure',
  },
  {
    type: 'raw',
    label: 'Raw JSON',
    icon: Eye,
    description: 'Formatted JSON text',
  },
  {
    type: 'flow',
    label: 'Sea View',
    icon: Waves,
    description: 'Visual flow diagram',
  },
  {
    type: 'list',
    label: 'List View',
    icon: Database,
    description: 'Flat list with search',
  },
];

// Tree node component for reuse
const TreeNodeComponent = memo(({
  node,
  isExpanded,
  onToggle,
  searchTerm,
  style,
  getTypeColor,
  formatValue,
  onDoubleClick,
  compactMode = false,
}: {
  node: JsonNode;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  searchTerm: string;
  style?: React.CSSProperties;
  getTypeColor: (type: string) => string;
  formatValue: (value: any, type: string) => string;
  onDoubleClick?: (node: JsonNode) => void;
  compactMode?: boolean;
}) => {
  const hasChildren = node.childCount > 0;
  const isHighlighted =
    searchTerm &&
    (node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof node.value === 'string' &&
        node.value.toLowerCase().includes(searchTerm.toLowerCase())));

  const nodeHeight = compactMode ? 'py-0.5' : 'py-1';
  const nodeSpacing = compactMode ? 12 : 16;

  return (
    <div
      style={style}
      className={`json-node flex items-center gap-2 px-2 ${nodeHeight} hover:bg-gray-50 cursor-pointer ${
        isHighlighted ? 'bg-yellow-100 border-l-2 border-yellow-400' : ''
      }`}
      data-testid="json-node"
      data-type={node.type}
      onDoubleClick={() => onDoubleClick?.(node)}
      title="Double-click to view details"
    >
      {/* Indentation */}
      <div style={{ marginLeft: `${node.level * nodeSpacing}px` }} />

      {/* Expand/Collapse */}
      {hasChildren ? (
        <UnifiedButton
          variant="ghost"
          size="icon"
          icon={isExpanded ? ChevronDown : ChevronRight}
          className="p-1 w-6 h-6"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle(node.id);
          }}
        />
      ) : (
        <div className="w-6" />
      )}

      {/* Key */}
      <span className={`font-medium text-sm text-gray-700 min-w-0 truncate ${compactMode ? 'text-xs' : ''}`}>
        {node.key}:
      </span>

      {/* Type Badge */}
      <Badge variant="secondary" className={`text-xs px-2 py-0 h-5 ${getTypeColor(node.type)}`}>
        {node.type}
      </Badge>

      {/* Value */}
      <span className={`text-sm text-gray-600 flex-1 min-w-0 truncate ${compactMode ? 'text-xs' : ''}`}>
        {formatValue(node.value, node.type)}
      </span>

      {/* Size indicator */}
      {!compactMode && node.size > 1024 && (
        <Badge variant="outline" className="text-xs">
          {node.size > 1024 * 1024
            ? `${(node.size / (1024 * 1024)).toFixed(1)}MB`
            : `${(node.size / 1024).toFixed(1)}KB`}
        </Badge>
      )}
    </div>
  );
});

TreeNodeComponent.displayName = 'TreeNodeComponent';

export const JsonViewerBase = memo<JsonViewerBaseProps>(({
  content,
  className = '',
  
  // View config
  availableViewModes = ['tree', 'raw'],
  initialViewMode = 'tree',
  maxHeight = '600px',
  
  // Features
  enableSearch = true,
  enableViewModeSwitch = true,
  enableDownload = true,
  enableCopy = true,
  enableStats = true,
  enablePerformanceInfo = false,

  // Performance
  maxNodes = VIEWER_CONFIG.performance.warningNodeCount,
  virtualizeThreshold = VIEWER_CONFIG.performance.virtualizeThreshold,
  
  // Search
  searchTerm: externalSearchTerm = '',
  onSearchChange,
  
  // Events
  onViewModeChange,
  onNodeDoubleClick,
  
  // Custom renderers
  renderFlowView,
  renderCustomView,
  
  // Styling
  compactMode = false,
  showHeader = true,
  showFooter = true,
}) => {
  const [viewMode, setViewMode] = useState<ViewerMode['type']>(initialViewMode);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  
  const listRef = useRef<List>(null);
  const { toast } = useToast();

  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm || internalSearchTerm;
  const setSearchTerm = onSearchChange || setInternalSearchTerm;

  // Process JSON using our custom hook
  const {
    isValid,
    error,
    parsedData,
    flatNodes,
    stats,
    performance,
    createSearchFilter,
    copyToClipboard,
    downloadAsJson,
    formatValue,
    getTypeColor,
    formatSize,
  } = useJsonProcessing(content, {
    maxNodes,
    enablePerformanceMonitoring: enablePerformanceInfo,
    expandedNodes,
  });

  // Available view modes
  const viewerModes = useMemo(() => 
    DEFAULT_VIEWER_MODES.filter(mode => availableViewModes.includes(mode.type)),
    [availableViewModes]
  );

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return flatNodes;
    const filter = createSearchFilter(searchTerm);
    return flatNodes.filter(filter);
  }, [flatNodes, searchTerm, createSearchFilter]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewerMode['type']) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  }, [onViewModeChange]);

  // Handle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Handle copy with toast feedback
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard();
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
  }, [copyToClipboard, toast]);

  // Handle download with toast feedback
  const handleDownload = useCallback(() => {
    try {
      downloadAsJson();
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
  }, [downloadAsJson, toast]);

  // Get item size for virtual list
  const getItemSize = useCallback((index: number) => {
    const node = filteredNodes[index];
    if (!node) return compactMode ? 24 : 32;
    
    const baseHeight = compactMode ? 24 : 32;
    const hasLongValue = node.value && String(node.value).length > 100;
    return hasLongValue ? baseHeight + (compactMode ? 12 : 20) : baseHeight;
  }, [filteredNodes, compactMode]);

  // Render methods
  const renderEmptyState = () => (
    <Card className="h-full flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <FileJson className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No JSON to Display</h3>
        <p>Enter JSON to see it visualized here</p>
      </div>
    </Card>
  );

  const renderErrorState = () => (
    <Card className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium mb-2 text-destructive">JSON Parse Error</h3>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
      </div>
    </Card>
  );

  const renderTreeView = () => {
    if (filteredNodes.length > virtualizeThreshold) {
      // Virtualized tree
      return (
        <List
          ref={listRef}
          height={parseInt(maxHeight) || 500}
          width="100%"
          itemCount={filteredNodes.length}
          itemSize={getItemSize}
        >
          {({ index, style }) => {
            const node = filteredNodes[index];
            return (
              <TreeNodeComponent
                key={node.id}
                node={node}
                isExpanded={expandedNodes.has(node.id)}
                onToggle={toggleNode}
                searchTerm={searchTerm}
                style={style}
                getTypeColor={getTypeColor}
                formatValue={formatValue}
                onDoubleClick={onNodeDoubleClick}
                compactMode={compactMode}
              />
            );
          }}
        </List>
      );
    }

    // Regular tree
    return (
      <div className="space-y-0">
        {filteredNodes.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            isExpanded={expandedNodes.has(node.id)}
            onToggle={toggleNode}
            searchTerm={searchTerm}
            getTypeColor={getTypeColor}
            formatValue={formatValue}
            onDoubleClick={onNodeDoubleClick}
            compactMode={compactMode}
          />
        ))}
      </div>
    );
  };

  const renderRawView = () => (
    <Card className="h-full">
      <ScrollArea className="h-full">
        <pre className={`p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed ${compactMode ? 'text-xs p-2' : ''}`}>
          {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
        </pre>
      </ScrollArea>
    </Card>
  );

  const renderContent = () => {
    if (!content || (typeof content === 'string' && !content.trim())) {
      return renderEmptyState();
    }
    
    if (!isValid) {
      return renderErrorState();
    }

    // Handle custom view renderer
    if (renderCustomView) {
      const customContent = renderCustomView(parsedData, viewMode);
      if (customContent) return customContent;
    }

    switch (viewMode) {
      case 'tree':
        return renderTreeView();
      case 'raw':
        return renderRawView();
      case 'flow':
        return renderFlowView ? renderFlowView(parsedData) : renderEmptyState();
      default:
        return renderTreeView();
    }
  };

  // Don't render if no content
  if (!content && typeof content !== 'object') {
    return renderEmptyState();
  }

  return (
    <div className={`json-viewer-base flex flex-col h-full ${className}`} data-testid="json-viewer-base">
      {/* Header */}
      {showHeader && (
        <div className={`flex items-center justify-between gap-2 border-b bg-gray-50/50 ${compactMode ? 'p-2' : 'p-4'}`}>
          {/* Left side - Search */}
          {enableSearch && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search JSON..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-7 text-sm ${compactMode ? 'h-6 text-xs' : 'h-8'}`}
                data-testid="search-input"
              />
            </div>
          )}
          
          {/* Right side - Stats and Actions */}
          <div className="flex items-center gap-2">
            {/* Stats */}
            {enableStats && stats && isValid && (
              <div className="flex gap-1">
                <Badge variant="outline" className={compactMode ? 'text-xs px-1' : ''}>
                  {stats.type}
                </Badge>
                <Badge variant="outline" className={compactMode ? 'text-xs px-1' : ''}>
                  {stats.keys} {stats.type === 'array' ? 'items' : 'keys'}
                </Badge>
                <Badge variant="outline" className={compactMode ? 'text-xs px-1' : ''}>
                  {formatSize(stats.size)}
                </Badge>
              </div>
            )}

            {/* Action buttons */}
            {enableCopy && (
              <Button
                variant="outline"
                size={compactMode ? 'sm' : 'sm'}
                onClick={handleCopy}
                data-testid="copy-button"
                className={compactMode ? 'h-6 px-2' : 'h-7 px-2'}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            )}
            
            {enableDownload && (
              <Button
                variant="outline"
                size={compactMode ? 'sm' : 'sm'}
                onClick={handleDownload}
                data-testid="download-button"
                className={compactMode ? 'h-6 px-2' : 'h-7 px-2'}
              >
                <Download className="h-3 w-3 mr-1" />
                JSON
              </Button>
            )}
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      {enableViewModeSwitch && viewerModes.length > 1 && (
        <div className="border-b bg-white">
          <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-full">
            <TabsList className={`grid w-full h-${compactMode ? '10' : '12'} p-1`} style={{ gridTemplateColumns: `repeat(${viewerModes.length}, 1fr)` }}>
              {viewerModes.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <TabsTrigger
                    key={mode.type}
                    value={mode.type}
                    className="flex items-center gap-2 data-[state=active]:bg-white"
                    disabled={mode.type === 'flow' && !isValid}
                  >
                    <IconComponent className={`h-4 w-4 ${compactMode ? 'h-3 w-3' : ''}`} />
                    <span className={`hidden sm:inline ${compactMode ? 'text-xs' : ''}`}>
                      {mode.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Performance Warning */}
      {enablePerformanceInfo && performance.performanceLevel === 'critical' && (
        <div className="px-4 py-2 bg-yellow-50 border-b text-yellow-700 text-xs">
          <Eye className="h-3 w-3 inline mr-1" />
          Large JSON detected - using performance optimizations
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ maxHeight }} data-testid={`${viewMode}-view-content`}>
        <ErrorBoundary fallback={<div>Error loading {viewMode} view</div>}>
          {viewMode === 'tree' || viewMode === 'raw' ? (
            <ScrollArea className="h-full">
              <div className={compactMode ? 'p-2' : 'p-4'}>
                {renderContent()}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full">
              {renderContent()}
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* Footer */}
      {showFooter && stats && isValid && (
        <div className={`border-t bg-gray-50/50 text-xs text-gray-600 ${compactMode ? 'px-2 py-1' : 'px-4 py-2'}`}>
          <div className="flex items-center justify-between">
            <span>
              Viewing {stats.type.toLowerCase()} with {stats.keys} {stats.type === 'array' ? 'items' : 'properties'}
            </span>
            {enablePerformanceInfo && (
              <span>
                Parse: {stats.parseTime.toFixed(0)}ms | Size: {formatSize(stats.size)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Virtualization indicator */}
      {filteredNodes.length > virtualizeThreshold && (
        <div className={`border-t bg-green-50 text-green-700 text-xs ${compactMode ? 'px-2 py-1' : 'px-4 py-2'}`}>
          <Eye className="h-3 w-3 inline mr-1" />
          Virtualized rendering active - showing {Math.min(100, filteredNodes.length)} items at once
        </div>
      )}
    </div>
  );
});

JsonViewerBase.displayName = 'JsonViewerBase';
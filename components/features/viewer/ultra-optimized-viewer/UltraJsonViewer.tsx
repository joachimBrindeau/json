'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect, memo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { UnifiedButton } from '@/components/ui/unified-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonActionButtons } from '@/components/features/viewer/json-action-buttons';
import {
  ChevronRight,
  ChevronDown,
  Eye,
  TreePine as TreeIcon,
  Database,
  Waves,
  Search,
  Settings,
  Filter,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { NodeDetailsModal } from '@/components/features/modals/node-details-modal';
import { ExportModal } from '@/components/features/modals/export-modal';
import { formatJsonValue, getTypeColor, getValueType, estimateSize } from '@/components/shared/hooks/useJsonProcessing';
import { TreeNodeRenderer } from '@/components/shared/NodeRenderer';

// Lazy load Flow View for performance
const JsonFlowView = dynamic(() => import('@/components/features/flow-diagram/JsonFlowView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

interface JsonNode {
  id: string;
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  path: string;
  children?: JsonNode[];
  isExpanded?: boolean;
  size: number;
  childCount: number;
}

interface ViewerMode {
  type: 'tree' | 'flow' | 'list';
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface UltraJsonViewerProps {
  content: string | object;
  maxNodes?: number;
  virtualizeThreshold?: number;
  className?: string;
  initialViewMode?: ViewerMode['type'];
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  enableSearch?: boolean;
  enableViewModeSwitch?: boolean;
}

const VIEWER_MODES: ViewerMode[] = [
  {
    type: 'tree',
    label: 'Tree View',
    icon: TreeIcon,
    description: 'Hierarchical tree structure',
  },
  {
    type: 'flow',
    label: 'Flow View',
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

// Memoized node component for performance
const TreeNodeComponent = memo(
  ({
    node,
    isExpanded,
    onToggle,
    searchTerm,
    style,
    viewType = 'tree',
    getTypeColor,
    onDoubleClick,
  }: {
    node: JsonNode;
    isExpanded: boolean;
    onToggle: (nodeId: string) => void;
    searchTerm: string;
    style?: React.CSSProperties;
    viewType?: 'tree' | 'list';
    getTypeColor: (type: string) => string;
    onDoubleClick?: (node: JsonNode) => void;
  }) => {
    const hasChildren = node.childCount > 0;
    const isHighlighted =
      searchTerm &&
      (node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof node.value === 'string' &&
          node.value.toLowerCase().includes(searchTerm.toLowerCase())));

    const formatValue = useCallback((value: any, type: string) => {
      return formatJsonValue(value, type, 50);
    }, []);

    const isComplexField = node.type === 'object' || node.type === 'array';
    
    return (
      <div
        style={style}
        className={`json-node flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors duration-150 ${
          isHighlighted 
            ? 'bg-yellow-100 border-l-2 border-yellow-400' 
            : isComplexField 
              ? 'hover:bg-blue-50 border-l-2 border-transparent hover:border-blue-200'
              : 'hover:bg-gray-50'
        }`}
        data-testid="json-node"
        data-type={node.type}
        data-node-type={node.type}
        onDoubleClick={() => onDoubleClick?.(node)}
        title={isComplexField 
          ? `${node.type === 'array' ? 'Array' : 'Object'} with ${node.childCount} ${node.type === 'array' ? 'items' : 'properties'} - Double-click for details`
          : "Double-click to view details"
        }
      >
        {/* Indentation */}
        <div style={{ marginLeft: `${node.level * 16}px` }} />

        {/* Expand/Collapse - Only for complex fields (objects and arrays) */}
        {hasChildren && (node.type === 'object' || node.type === 'array') ? (
          <UnifiedButton
            variant="ghost"
            size="icon"
            icon={isExpanded ? ChevronDown : ChevronRight}
            className="w-6 h-6 mr-1 text-gray-600"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(node.id);
            }}
            title={`${isExpanded ? 'Collapse' : 'Expand'} ${node.type}`}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.key} (${node.childCount} ${node.type === 'array' ? 'items' : 'properties'})`}
          />
        ) : (
          <div className="w-6 mr-1" />
        )}

        {/* Key */}
        <span className="font-medium text-sm text-gray-700 min-w-0 truncate">{node.key}:</span>

        {/* Type Badge */}
        <Badge variant="secondary" className={`text-xs px-2 py-0 h-5 ${getTypeColor(node.type)}`}>
          {node.type}
        </Badge>

        {/* Value */}
        <span className={`text-sm flex-1 min-w-0 truncate ${
          node.type === 'object' || node.type === 'array' 
            ? 'text-gray-700 font-medium' 
            : 'text-gray-600'
        }`}>
          {formatValue(node.value, node.type)}
          {/* Show expand indicator for collapsed complex fields */}
          {hasChildren && !isExpanded && (node.type === 'object' || node.type === 'array') && (
            <span className="ml-2 text-xs text-gray-400">
              {node.type === 'array' ? '▶ Click to expand array' : '▶ Click to expand object'}
            </span>
          )}
        </span>

        {/* Size indicator */}
        {node.size > 1024 && (
          <Badge variant="outline" className="text-xs">
            {node.size > 1024 * 1024
              ? `${(node.size / (1024 * 1024)).toFixed(1)}MB`
              : `${(node.size / 1024).toFixed(1)}KB`}
          </Badge>
        )}
      </div>
    );
  }
);

TreeNodeComponent.displayName = 'TreeNodeComponent';

function UltraJsonViewerComponent({
  content,
  maxNodes = 10000,
  virtualizeThreshold = 1000,
  className = '',
  initialViewMode = 'tree',
  searchTerm: externalSearchTerm = '',
  onSearchChange,
  enableSearch = true,
  enableViewModeSwitch = true,
}: UltraJsonViewerProps) {
  const [viewMode, setViewMode] = useState<ViewerMode['type']>(initialViewMode);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm || internalSearchTerm;
  const setSearchTerm = onSearchChange || setInternalSearchTerm;

  // Debug logging
  const [treeExpandedNodes, setTreeExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedNodeForDetails, setSelectedNodeForDetails] = useState<JsonNode | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const listRef = useRef<List>(null);

  // Use tree expanded nodes
  const expandedNodes = treeExpandedNodes;

  // Update view mode when initialViewMode changes
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  // Use shared type color utility function

  // Parse and structure JSON data
  const { flatNodes, treeData, stats } = useMemo(() => {
    let parsed: any;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return { flatNodes: [], treeData: null, stats: { nodeCount: 0, maxDepth: 0, size: 0 } };
    }

    const nodes: JsonNode[] = [];
    let nodeCount = 0;
    let maxDepth = 0;
    let totalSize = 0;

    function createNode(value: any, key: string, level: number, path: string): JsonNode {
      const id = path || 'root';
      const type = getValueType(value);
      const size = estimateSize(value);

      totalSize += size;
      nodeCount++;
      maxDepth = Math.max(maxDepth, level);

      let children: JsonNode[] = [];
      let childCount = 0;

      if (type === 'object' && value !== null) {
        const entries = Object.entries(value);
        childCount = entries.length;

        if (expandedNodes.has(id) && entries.length <= 1000) {
          children = entries.map(([k, v]) => createNode(v, k, level + 1, `${path}.${k}`));
        }
      } else if (type === 'array') {
        childCount = value.length;

        if (expandedNodes.has(id) && value.length <= 1000) {
          children = value.map((item: any, index: number) =>
            createNode(item, `[${index}]`, level + 1, `${path}[${index}]`)
          );
        }
      }

      return {
        id,
        key: key === 'root' ? 'JSON Root' : key,
        value: type === 'object' || type === 'array' ? undefined : value,
        type,
        level,
        path,
        children,
        size,
        childCount,
      };
    }

    const rootNode = createNode(parsed, 'root', 0, 'root');

    // Flatten for list view
    function flattenTree(node: JsonNode, result: JsonNode[] = []): JsonNode[] {
      result.push(node);

      if (expandedNodes.has(node.id) && node.children) {
        for (const child of node.children) {
          flattenTree(child, result);
        }
      }

      return result;
    }

    const flattened = flattenTree(rootNode);

    return {
      flatNodes: flattened.slice(0, maxNodes),
      treeData: rootNode,
      stats: { nodeCount, maxDepth, size: totalSize },
    };
  }, [content, expandedNodes, maxNodes]);

  // Filter nodes based on search term
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return flatNodes;

    return flatNodes.filter((node) => {
      return (
        node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.value && String(node.value).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [flatNodes, searchTerm]);

  const toggleNode = useCallback((nodeId: string) => {
    setTreeExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeDoubleClick = useCallback((node: JsonNode) => {
    setSelectedNodeForDetails(node);
    setDetailsModalOpen(true);
  }, []);

  const getItemSize = useCallback(
    (index: number) => {
      const node = filteredNodes[index];
      if (!node) return 32;

      // Dynamic sizing based on content
      const baseHeight = 32;
      const hasLongValue = node.value && String(node.value).length > 100;
      return hasLongValue ? baseHeight + 20 : baseHeight;
    },
    [filteredNodes]
  );

  // Keep user's selected view mode - don't auto-switch unless really necessary
  useEffect(() => {
    // Respect initialViewMode - only override for critical performance issues
    if (initialViewMode && initialViewMode !== viewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);
  
  // Only auto-switch for extremely large datasets that would crash the browser
  useEffect(() => {
    if (stats.nodeCount > 10000 && viewMode === 'flow') {
      setViewMode('tree'); // Sea view can't handle very large datasets
    }
  }, [stats, viewMode]);

  const renderTreeView = () => {
    if (filteredNodes.length > virtualizeThreshold) {
      // Virtualized tree for large datasets
      return (
        <List
          ref={listRef}
          height={500}
          width="100%"
          itemCount={filteredNodes.length}
          itemSize={getItemSize}
          itemData={{
            nodes: filteredNodes,
            expandedNodes,
            onToggle: toggleNode,
            searchTerm,
            viewType: 'tree',
            onDoubleClick: handleNodeDoubleClick,
          }}
        >
          {({ index, style, data }) => {
            const node = data.nodes[index];
            return (
              <TreeNodeComponent
                key={node.id}
                node={node}
                isExpanded={data.expandedNodes.has(node.id)}
                onToggle={data.onToggle}
                searchTerm={data.searchTerm}
                style={style}
                viewType="tree"
                getTypeColor={getTypeColor}
                onDoubleClick={data.onDoubleClick}
              />
            );
          }}
        </List>
      );
    }

    // Regular tree for smaller datasets
    return (
      <div className="space-y-1">
        {filteredNodes.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            isExpanded={expandedNodes.has(node.id)}
            onToggle={toggleNode}
            searchTerm={searchTerm}
            viewType="tree"
            getTypeColor={getTypeColor}
            onDoubleClick={handleNodeDoubleClick}
          />
        ))}
      </div>
    );
  };

  const renderListView = () => {
    // Create completely flat list independent from tree expansion state
    const createFlatList = (data: any, prefix = 'root'): any[] => {
      const items: any[] = [];

      function flatten(value: any, path: string, key: string, level: number = 0) {
        const type = getValueType(value);
        const size = estimateSize(value);
        const displayPath = path.replace('root.', '') || 'root';

        items.push({
          id: path,
          key,
          value: type === 'object' || type === 'array' ? undefined : value,
          type,
          path,
          displayPath,
          level,
          size,
          childCount:
            type === 'object'
              ? Object.keys(value || {}).length
              : type === 'array'
                ? (value || []).length
                : 0,
        });

        if (type === 'object' && value !== null) {
          Object.entries(value).forEach(([k, v]) => {
            flatten(v, `${path}.${k}`, k, level + 1);
          });
        } else if (type === 'array') {
          value.forEach((item: any, index: number) => {
            flatten(item, `${path}[${index}]`, `[${index}]`, level + 1);
          });
        }
      }

      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        flatten(parsed, 'root', 'root', 0);
      } catch (error) {
        console.error('Failed to parse JSON for list view:', error);
      }

      return items;
    };

    const allItems = createFlatList(content);
    const flatItems = searchTerm
      ? allItems.filter(
          (item) =>
            item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.value && String(item.value).toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : allItems;

    if (flatItems.length > virtualizeThreshold) {
      return (
        <List
          ref={listRef}
          height={500}
          width="100%"
          itemCount={flatItems.length}
          itemSize={() => 40}
          itemData={{
            nodes: flatItems,
            searchTerm,
            viewType: 'list',
          }}
        >
          {({ index, style, data }) => {
            const item = data.nodes[index];
            return (
              <div
                key={item.id}
                style={style}
                className="flex items-center px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-gray-600 truncate mr-4">
                      {item.displayPath || 'root'}
                    </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {item.value !== undefined
                        ? String(item.value)
                        : `${item.type} (${item.childCount} items)`}
                    </span>
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(item.type)}`}>
                    {item.type}
                  </span>
                </div>
              </div>
            );
          }}
        </List>
      );
    }

    return (
      <div className="space-y-0">
        {flatItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-gray-600 truncate mr-4">
                  {item.displayPath || 'root'}
                </span>
                <span className="text-sm text-gray-900 font-medium">
                  {item.value !== undefined
                    ? String(item.value)
                    : `${item.type} (${item.childCount} items)`}
                </span>
              </div>
            </div>
            <div className="ml-2 flex-shrink-0">
              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(item.type)}`}>
                {item.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Handler functions for copy and download

  return (
    <div className={`json-viewer flex flex-col h-full ${className}`} data-testid="json-viewer">
      {/* Action buttons header */}
      <div className="flex items-center justify-between gap-2 p-2 border-b border-gray-200 bg-gray-50/50">
        {/* Search bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Search JSON keys and values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 pl-7 text-sm"
            data-testid="search-input"
          />
        </div>
        
        {/* Action buttons */}
        <JsonActionButtons />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'tree' && (
          <ScrollArea className="h-full" data-testid="tree-view-content">
            <div className="p-4">{renderTreeView()}</div>
          </ScrollArea>
        )}

        {viewMode === 'flow' && (
          <div className="h-full" data-testid="flow-view-content">
            {(() => {
              try {
                const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
                return <JsonFlowView json={parsedContent} className="w-full h-full" />;
              } catch (error) {
                console.error('Failed to parse JSON for flow view:', error);
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-red-600">
                      <p className="text-lg font-medium">Invalid JSON</p>
                      <p className="text-sm">Please check your JSON syntax</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="h-full" data-testid="list-view-content">
            <ScrollArea className="h-full">
              <div className="p-4">{renderListView()}</div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Performance indicator */}
      {filteredNodes.length > virtualizeThreshold && (
        <div className="px-4 py-2 border-t bg-green-50 text-green-700 text-xs">
          <Eye className="h-3 w-3 inline mr-1" />
          Virtualized rendering active - showing {Math.min(100, filteredNodes.length)} items at once
        </div>
      )}

      {/* Node Details Modal */}
      <NodeDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        node={selectedNodeForDetails}
      />

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        jsonData={(() => {
          try {
            return typeof content === 'string' ? JSON.parse(content) : content;
          } catch {
            return null;
          }
        })()}
        filteredData={searchTerm && filteredNodes.length > 0 ? (() => {
          // Convert filtered nodes back to a structured format
          const filteredData: any = {};
          filteredNodes.forEach(node => {
            if (node.value !== undefined) {
              // Create nested structure based on path
              const pathParts = node.path.split('.').slice(1); // Remove 'root'
              let current = filteredData;
              
              for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (!(part in current)) {
                  current[part] = {};
                }
                current = current[part];
              }
              
              if (pathParts.length > 0) {
                current[pathParts[pathParts.length - 1]] = node.value;
              }
            }
          });
          return Object.keys(filteredData).length > 0 ? filteredData : null;
        })() : null}
      />
    </div>
  );
}

// Helper functions now imported from shared utilities

export const UltraJsonViewer = memo(UltraJsonViewerComponent);
UltraJsonViewer.displayName = 'UltraJsonViewer';

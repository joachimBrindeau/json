'use client';

import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { largeJsonHandler } from '@/lib/json';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Info, Search, Filter } from 'lucide-react';

interface VirtualJsonViewerProps {
  data: any;
  height?: number;
  enableSearch?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

interface JsonNode {
  key: string;
  value: any;
  type: string;
  depth: number;
  isExpandable: boolean;
  isExpanded: boolean;
  path: string[];
}

// KISS: Simple virtual JSON viewer for very large data
export const VirtualJsonViewer = memo<VirtualJsonViewerProps>(({ 
  data, 
  height = 600,
  enableSearch = true,
  searchTerm: externalSearchTerm = '',
  onSearchChange
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Use external search term if provided
  const searchTerm = externalSearchTerm || internalSearchTerm;

  // Analyze JSON structure for optimizations
  const jsonAnalysis = useMemo(() => {
    return largeJsonHandler.analyzeJsonStructure(data);
  }, [data]);

  // Flatten JSON into renderable nodes with performance optimizations
  const nodes = useMemo(() => {
    const result: JsonNode[] = [];
    const shouldVirtualize = largeJsonHandler.shouldVirtualize(data);
    const shouldLazyLoad = largeJsonHandler.shouldLazyLoad(data);
    const isVeryLarge = largeJsonHandler.isVeryLarge(JSON.stringify(data));

    if (shouldLazyLoad || isVeryLarge) {
      setShowPerformanceWarning(true);
    }

    // Use different limits based on JSON size and complexity
    const maxDepth = isVeryLarge ? 15 : jsonAnalysis.depth > 10 ? 20 : 25;
    const maxItems = isVeryLarge ? 50 : shouldLazyLoad ? 100 : 200;

    function traverse(obj: any, depth = 0, path: string[] = [], key = 'root') {
      // Prevent infinite recursion and too deep nesting with dynamic limits
      if (depth > maxDepth || result.length > (isVeryLarge ? 25000 : 50000)) {
        result.push({
          key: path.join('.') || key,
          value: isVeryLarge ? '... (truncated - very large dataset)' : '... (truncated for performance)',
          type: 'truncated',
          depth,
          isExpandable: false,
          isExpanded: false,
          path,
        });
        return;
      }

      if (Array.isArray(obj)) {
        const pathStr = path.join('.');
        const isExpanded = expandedPaths.has(pathStr);

        result.push({
          key: pathStr || key,
          value: obj,
          type: 'array',
          depth,
          isExpandable: obj.length > 0,
          isExpanded,
          path,
        });

        if (isExpanded) {
          const itemsToShow = Math.min(maxItems, obj.length);
          for (let i = 0; i < itemsToShow; i++) {
            traverse(obj[i], depth + 1, [...path, i.toString()], i.toString());
          }

          if (obj.length > itemsToShow) {
            const remaining = obj.length - itemsToShow;
            result.push({
              key: `${pathStr}.truncated`,
              value: `... ${remaining.toLocaleString()} more items (${isVeryLarge ? 'large dataset' : 'click to load more'})`,
              type: 'load-more',
              depth: depth + 1,
              isExpandable: !isVeryLarge,
              isExpanded: false,
              path: [...path, 'more'],
            });
          }
        }
      } else if (obj && typeof obj === 'object') {
        const pathStr = path.join('.');
        const isExpanded = expandedPaths.has(pathStr);
        const keys = Object.keys(obj);

        result.push({
          key: pathStr || key,
          value: obj,
          type: 'object',
          depth,
          isExpandable: keys.length > 0,
          isExpanded,
          path,
        });

        if (isExpanded) {
          const propsToShow = Math.min(maxItems, keys.length);
          for (let i = 0; i < propsToShow; i++) {
            const k = keys[i];
            traverse(obj[k], depth + 1, [...path, k], k);
          }

          if (keys.length > propsToShow) {
            const remaining = keys.length - propsToShow;
            result.push({
              key: `${pathStr}.truncated`,
              value: `... ${remaining.toLocaleString()} more properties (${isVeryLarge ? 'large dataset' : 'click to load more'})`,
              type: 'load-more',
              depth: depth + 1,
              isExpandable: !isVeryLarge,
              isExpanded: false,
              path: [...path, 'more'],
            });
          }
        }
      } else {
        result.push({
          key: path.join('.') || key,
          value: obj,
          type: typeof obj,
          depth,
          isExpandable: false,
          isExpanded: false,
          path,
        });
      }
    }

    traverse(data);
    return result;
  }, [data, expandedPaths, jsonAnalysis]);

  // Filter nodes based on search term
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return nodes;
    
    setIsSearching(true);
    const searchLower = searchTerm.toLowerCase();
    const filtered = nodes.filter((node) => {
      // Search in key names
      if (node.key.toLowerCase().includes(searchLower)) return true;
      
      // Search in string values
      if (typeof node.value === 'string' && 
          node.value.toLowerCase().includes(searchLower)) return true;
          
      // Search in path
      if (node.path.some(segment => segment.toLowerCase().includes(searchLower))) return true;
      
      return false;
    });
    
    // Reset searching state after a delay
    setTimeout(() => setIsSearching(false), 100);
    return filtered;
  }, [nodes, searchTerm]);

  const toggleExpand = useCallback((path: string[]) => {
    const pathStr = path.join('.');
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathStr)) {
        next.delete(pathStr);
      } else {
        next.add(pathStr);
      }
      return next;
    });
  }, []);

  const renderNode = useCallback(
    ({ index, style, node, data }: { index: number; style: any; node?: JsonNode; data?: any }) => {
      const actualNode = node || data?.nodes[index];
      if (!actualNode) return null;

      const indent = actualNode.depth * 16;
      const isHighlighted = searchTerm && (
        actualNode.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof actualNode.value === 'string' && 
         actualNode.value.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return (
        <div 
          style={style} 
          className={`flex items-center text-sm font-mono border-b border-gray-100 ${
            isHighlighted ? 'bg-yellow-50 border-yellow-200' : ''
          }`}
        >
          <div style={{ paddingLeft: indent }} className="flex items-center flex-1 py-1">
            {actualNode.isExpandable && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 mr-1"
                onClick={() => toggleExpand(actualNode.path)}
              >
                {actualNode.isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}

            <span className={`mr-2 font-medium ${
              isHighlighted ? 'text-yellow-800' : 'text-blue-600'
            }`}>
              {actualNode.path[actualNode.path.length - 1] || 'root'}:
            </span>

            <span className={getValueColor(actualNode.type)}>
              {renderValue(actualNode)}
            </span>
          </div>
        </div>
      );
    },
    [nodes, toggleExpand]
  );

  const renderValue = (node: JsonNode): string => {
    switch (node.type) {
      case 'array':
        return `Array[${(node.value as any[]).length}]`;
      case 'object':
        return `Object{${Object.keys(node.value).length} keys}`;
      case 'string':
        return `"${String(node.value).slice(0, 100)}${String(node.value).length > 100 ? '...' : ''}"`;
      case 'number':
        return String(node.value);
      case 'boolean':
        return String(node.value);
      case 'null':
        return 'null';
      case 'undefined':
        return 'undefined';
      case 'load-more':
        return String(node.value);
      case 'truncated':
        return String(node.value);
      default:
        return String(node.value);
    }
  };

  const getValueColor = (type: string): string => {
    switch (type) {
      case 'string':
        return 'text-green-600';
      case 'number':
        return 'text-purple-600';
      case 'boolean':
        return 'text-orange-600';
      case 'null':
      case 'undefined':
        return 'text-gray-500';
      case 'array':
      case 'object':
        return 'text-gray-800';
      case 'load-more':
        return 'text-blue-500 cursor-pointer hover:underline';
      case 'truncated':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  // Performance stats
  const memoryUsage = largeJsonHandler.getMemoryUsage();
  const nodeCount = nodes.length;

  const performSearch = useCallback((term: string) => {
    if (onSearchChange) {
      onSearchChange(term);
    } else {
      setInternalSearchTerm(term);
    }
    if (term.trim()) {
      setIsSearching(true);
    }
  }, [onSearchChange]);

  // Sync external search term
  useEffect(() => {
    if (externalSearchTerm !== internalSearchTerm) {
      setInternalSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm, internalSearchTerm]);

  return (
    <div className="border rounded-lg bg-white">
      {/* Performance info and search */}
      <div className="flex flex-col gap-2 p-3 bg-gray-50 border-b">
        {/* Top row: Stats and warning */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline">{filteredNodes.length.toLocaleString()} nodes</Badge>
            {filteredNodes.length !== nodes.length && (
              <Badge variant="secondary">Filtered from {nodes.length.toLocaleString()}</Badge>
            )}
            <Badge variant={memoryUsage.percentage > 80 ? 'destructive' : 'secondary'}>
              Memory: {memoryUsage.used}MB / {memoryUsage.limit}MB
            </Badge>
            {jsonAnalysis.isHomogeneous && (
              <Badge variant="outline" className="text-xs">
                Homogeneous {jsonAnalysis.primaryType}
              </Badge>
            )}
          </div>

          {showPerformanceWarning && (
            <div className="flex items-center gap-2 text-amber-600">
              <Info className="h-4 w-4" />
              <span className="text-sm">Large data - performance optimizations active</span>
            </div>
          )}
        </div>
        
        {/* Bottom row: Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search keys and values..."
              value={searchTerm}
              onChange={(e) => performSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1 h-7 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {searchTerm && (
            <Badge variant={filteredNodes.length > 0 ? 'default' : 'destructive'} className="text-xs">
              {filteredNodes.length} matches
            </Badge>
          )}
        </div>
      </div>

      {/* Virtual list */}
      <div style={{ height }}>
        <List
          height={height}
          itemCount={filteredNodes.length}
          itemSize={28} // Height per row
          width="100%"
          itemData={{
            nodes: filteredNodes,
            expandedPaths,
            toggleExpand,
            searchTerm,
          }}
        >
          {({ index, style, data }) => {
            const node = data.nodes[index];
            return renderNode({ index, style, node, data });
          }}
        </List>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-t">
        <Button variant="outline" size="sm" onClick={() => setExpandedPaths(new Set())}>
          Collapse All
        </Button>

        <Button variant="outline" size="sm" onClick={() => largeJsonHandler.clearCache()}>
          Clear Memory
        </Button>
      </div>
    </div>
  );
});

VirtualJsonViewer.displayName = 'VirtualJsonViewer';

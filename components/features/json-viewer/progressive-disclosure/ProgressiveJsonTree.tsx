'use client';

import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Package,
  Database,
  Hash,
  Type,
  MoreHorizontal,
} from 'lucide-react';
import { UnifiedButton } from '@/components/ui/unified-button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TreeNode {
  id: string;
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  children?: TreeNode[];
  level: number;
  isExpanded: boolean;
  childCount: number;
  size: number; // Estimated size in bytes
  path: string[];
}

interface ProgressiveJsonTreeProps {
  data: any;
  maxInitialNodes?: number;
  maxNodeChildren?: number;
  className?: string;
}

const ICONS = {
  object: Package,
  array: Database,
  string: Type,
  number: Hash,
  boolean: Hash,
  null: Hash,
} as const;

const TYPE_COLORS = {
  object: 'bg-blue-100 text-blue-800',
  array: 'bg-green-100 text-green-800',
  string: 'bg-yellow-100 text-yellow-800',
  number: 'bg-purple-100 text-purple-800',
  boolean: 'bg-orange-100 text-orange-800',
  null: 'bg-gray-100 text-gray-800',
} as const;

function ProgressiveJsonTreeComponent({
  data,
  maxInitialNodes = 100,
  maxNodeChildren = 50,
  className = '',
}: ProgressiveJsonTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [visibleNodes, setVisibleNodes] = useState<TreeNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalNodes, setTotalNodes] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build tree structure with lazy loading
  const buildTree = useMemo(() => {
    const buildNode = (value: any, key: string, level: number, path: string[]): TreeNode => {
      const nodeId = path.join('.');
      const type = getValueType(value);
      const size = estimateSize(value);

      let children: TreeNode[] | undefined;
      let childCount = 0;

      if (type === 'object' && value !== null) {
        const keys = Object.keys(value);
        childCount = keys.length;

        // Only create children if expanded and under limits
        if (expandedNodes.has(nodeId) && childCount <= maxNodeChildren) {
          children = keys
            .slice(0, maxNodeChildren)
            .map((k, index) => buildNode(value[k], k, level + 1, [...path, k]));
        }
      } else if (type === 'array') {
        childCount = value.length;

        // Only create children if expanded and under limits
        if (expandedNodes.has(nodeId) && childCount <= maxNodeChildren) {
          children = value
            .slice(0, maxNodeChildren)
            .map((item: any, index: number) =>
              buildNode(item, `[${index}]`, level + 1, [...path, index.toString()])
            );
        }
      }

      return {
        id: nodeId,
        key,
        value: type === 'object' || type === 'array' ? undefined : value,
        type,
        children,
        level,
        isExpanded: expandedNodes.has(nodeId),
        childCount,
        size,
        path,
      };
    };

    const rootNode = buildNode(data, 'root', 0, ['root']);

    // Flatten tree for virtualized rendering
    const flattenTree = (node: TreeNode, result: TreeNode[] = []): TreeNode[] => {
      result.push(node);

      if (node.isExpanded && node.children) {
        for (const child of node.children) {
          flattenTree(child, result);
        }
      }

      return result;
    };

    const flattened = flattenTree(rootNode);
    setTotalNodes(flattened.length);

    return flattened;
  }, [data, expandedNodes, maxNodeChildren]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return buildTree;

    return buildTree.filter(
      (node) =>
        node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.value && node.value.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [buildTree, searchTerm]);

  // Limit visible nodes for performance
  const displayNodes = useMemo(() => {
    return filteredNodes.slice(0, maxInitialNodes);
  }, [filteredNodes, maxInitialNodes]);

  const toggleExpanded = useCallback(
    (nodeId: string) => {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          // Only collapse this specific node, preserve children's expanded state
          next.delete(nodeId);
        } else {
          // Expand this specific node
          next.add(nodeId);
        }
        return next;
      });
    },
    []
  );

  const loadMoreNodes = useCallback(() => {
    const current = displayNodes.length;
    const additional = Math.min(100, filteredNodes.length - current);

    if (additional > 0) {
      // Trigger re-render with more nodes
      setVisibleNodes(filteredNodes.slice(0, current + additional));
    }
  }, [displayNodes.length, filteredNodes]);

  // Virtualized row component
  const TreeRow = memo(({ node }: { node: TreeNode }) => {
    const Icon = ICONS[node.type];
    const hasChildren = node.childCount > 0;
    const isExpanded = node.isExpanded;

    return (
      <div
        className={`flex items-center gap-2 px-2 py-1 hover:bg-muted/50 cursor-pointer group`}
        style={{ paddingLeft: `${node.level * 16 + 8}px` }}
        onClick={() => hasChildren && toggleExpanded(node.id)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <UnifiedButton
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            icon={isExpanded ? ChevronDown : ChevronRight}
            onClick={() => toggleExpanded(node.id)}
          />
        ) : (
          <div className="h-4 w-4" />
        )}

        {/* Icon */}
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* Key */}
        <span className="font-medium text-sm flex-shrink-0 min-w-0">
          {node.key === 'root' ? 'JSON Root' : node.key}
        </span>

        {/* Type Badge */}
        <Badge variant="secondary" className={`text-xs px-1 py-0 h-5 ${TYPE_COLORS[node.type]}`}>
          {node.type}
        </Badge>

        {/* Child Count */}
        {hasChildren && (
          <Badge variant="outline" className="text-xs px-1 py-0 h-5">
            {node.childCount} {node.type === 'array' ? 'items' : 'keys'}
          </Badge>
        )}

        {/* Value Preview */}
        {node.value !== undefined && (
          <span className="text-sm text-muted-foreground truncate flex-1 min-w-0">
            {formatValue(node.value)}
          </span>
        )}

        {/* Size */}
        <span className="text-xs text-muted-foreground flex-shrink-0">{formatSize(node.size)}</span>

        {/* Truncation indicator */}
        {hasChildren && node.childCount > maxNodeChildren && (
          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    );
  });

  TreeRow.displayName = 'TreeRow';

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">JSON Structure</h3>
          <Badge variant="outline">{totalNodes} nodes</Badge>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search keys or values..."
          className="w-full px-3 py-2 text-sm border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tree Content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-2">
          {displayNodes.map((node) => (
            <TreeRow key={node.id} node={node} />
          ))}

          {/* Load More Button */}
          {filteredNodes.length > displayNodes.length && (
            <div className="p-4 text-center">
              <UnifiedButton 
                variant="outline" 
                text={`Load More (${filteredNodes.length - displayNodes.length} remaining)`}
                onClick={loadMoreNodes} 
                className="text-sm"
              />
            </div>
          )}

          {filteredNodes.length === 0 && searchTerm && (
            <div className="p-8 text-center text-muted-foreground">
              No results found for &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

// Helper functions
function getValueType(value: any): TreeNode['type'] {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value as TreeNode['type'];
}

function formatValue(value: any): string {
  if (typeof value === 'string') {
    const truncated = value.length > 100 ? value.slice(0, 100) + '...' : value;
    return `"${truncated}"`;
  }
  return String(value);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function estimateSize(value: any): number {
  if (value === null) return 4;
  if (typeof value === 'boolean') return 4;
  if (typeof value === 'number') return 8;
  if (typeof value === 'string') return value.length * 2;
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + estimateSize(item), 24);
  }
  if (typeof value === 'object') {
    return Object.entries(value).reduce(
      (sum, [key, val]) => sum + key.length * 2 + estimateSize(val),
      24
    );
  }
  return 0;
}

export const ProgressiveJsonTree = memo(ProgressiveJsonTreeComponent);

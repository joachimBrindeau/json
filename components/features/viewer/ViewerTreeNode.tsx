/**
 * Tree node component - renders individual JSON nodes
 */

'use client';

import { memo, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { JsonNode } from './types';

interface ViewerTreeNodeProps {
  node: JsonNode;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  searchTerm?: string;
  style?: React.CSSProperties;
  onDoubleClick?: (node: JsonNode) => void;
}

export const ViewerTreeNode = memo(({
  node,
  isExpanded,
  onToggle,
  searchTerm = '',
  style,
  onDoubleClick,
}: ViewerTreeNodeProps) => {
  const hasChildren = node.childCount > 0;
  const isComplexField = node.type === 'object' || node.type === 'array';
  
  // Check if node matches search
  const isHighlighted =
    searchTerm &&
    (node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof node.value === 'string' &&
        node.value.toLowerCase().includes(searchTerm.toLowerCase())));

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      onToggle(node.id);
    }
  }, [hasChildren, node.id, onToggle]);

  const handleDoubleClick = useCallback(() => {
    if (onDoubleClick) {
      onDoubleClick(node);
    }
  }, [node, onDoubleClick]);

  // Format value for display
  const formatValue = (value: any, type: string): string => {
    if (type === 'null') return 'null';
    if (type === 'string') return `"${value}"`;
    if (type === 'array') return `Array[${node.childCount}]`;
    if (type === 'object') return `Object{${node.childCount}}`;
    return String(value);
  };

  // Get color for type
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-600';
      case 'number': return 'text-blue-600';
      case 'boolean': return 'text-purple-600';
      case 'null': return 'text-gray-400';
      case 'array': return 'text-orange-600';
      case 'object': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const tooltipContent = isComplexField
    ? `${node.type === 'array' ? 'Array' : 'Object'} with ${node.childCount} ${
        node.type === 'array' ? 'items' : 'properties'
      } - Double-click for details`
    : 'Double-click to view details';

  return (
    <div
      style={style}
      className={`json-node flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors duration-150 ${
        isHighlighted
          ? 'bg-red-50 border-l-4 border-red-500'
          : isComplexField
            ? 'hover:bg-blue-50 border-l-2 border-transparent hover:border-blue-200'
            : 'hover:bg-gray-50'
      }`}
      data-testid="json-node"
      data-type={node.type}
      onDoubleClick={handleDoubleClick}
      title={tooltipContent}
    >
      {/* Indentation */}
      <div style={{ marginLeft: `${node.level * 16}px` }} />

      {/* Expand/Collapse button */}
      {hasChildren && isComplexField ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="h-5 w-5 p-0 hover:bg-gray-200"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      ) : (
        <div className="w-5" />
      )}

      {/* Key */}
      <span className="font-medium text-gray-700 min-w-0 flex-shrink-0">
        {node.key}:
      </span>

      {/* Value */}
      <span className={`${getTypeColor(node.type)} font-mono text-sm truncate`}>
        {formatValue(node.value, node.type)}
      </span>

      {/* Type badge for complex types */}
      {isComplexField && (
        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
          {node.type}
        </span>
      )}
    </div>
  );
});

ViewerTreeNode.displayName = 'ViewerTreeNode';


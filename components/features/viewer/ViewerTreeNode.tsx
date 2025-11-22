/**
 * Tree node component - renders individual JSON nodes
 */

'use client';

import { memo, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { HIGHLIGHT_ANIMATIONS, TRANSITIONS } from '@/components/animations';
import type { JsonNode } from './types';

// Deep object scanner: recursively searches through nested objects to find matches
function objectContainsTermDeep(
  obj: any,
  term: string,
  currentDepth: number = 0,
  maxDepth: number = 10,
  maxProps: number = 100
): boolean {
  if (currentDepth > maxDepth) return false;
  if (!obj || typeof obj !== 'object') return false;

  try {
    let checked = 0;
    for (const [k, v] of Object.entries(obj)) {
      if (checked++ > maxProps) break;

      // Check key
      if (typeof k === 'string' && k.toLowerCase().includes(term)) return true;

      // Check primitive values
      if (typeof v === 'string' && v.toLowerCase().includes(term)) return true;
      if (typeof v === 'number' || typeof v === 'boolean') {
        if (String(v).toLowerCase().includes(term)) return true;
      }

      // Recursively check nested objects and arrays
      if (v && typeof v === 'object') {
        if (Array.isArray(v)) {
          // For arrays, check each element (limited)
          for (let i = 0; i < Math.min(v.length, 20); i++) {
            const item = v[i];
            if (typeof item === 'string' && item.toLowerCase().includes(term)) return true;
            if (typeof item === 'number' || typeof item === 'boolean') {
              if (String(item).toLowerCase().includes(term)) return true;
            }
            if (item && typeof item === 'object') {
              if (objectContainsTermDeep(item, term, currentDepth + 1, maxDepth, Math.floor(maxProps / 2))) {
                return true;
              }
            }
          }
        } else {
          // For objects, recursively search
          if (objectContainsTermDeep(v, term, currentDepth + 1, maxDepth, Math.floor(maxProps / 2))) {
            return true;
          }
        }
      }
    }
  } catch {
    // ignore structured clone errors or circular references
  }
  return false;
}

interface ViewerTreeNodeProps {
  node: JsonNode;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  searchTerm?: string;
  isMatch?: boolean; // Whether this node ID is in the search matches set
  style?: React.CSSProperties;
  onDoubleClick?: (node: JsonNode) => void;
}

export const ViewerTreeNode = memo(
  ({ node, isExpanded, onToggle, searchTerm = '', isMatch = false, style, onDoubleClick }: ViewerTreeNodeProps) => {
    const hasChildren = node.childCount > 0;
    const isComplexField = node.type === 'object' || node.type === 'array';

    // Check if node matches search (with deep object scanning for nested values)
    // First check if this node ID is in the matches set from the search hook
    // This is more reliable for deeply nested matches found in raw data
    const isHighlighted = (() => {
      if (!searchTerm || !searchTerm.trim()) return false;
      
      // If the search hook marked this node as a match, use that
      if (isMatch) return true;
      
      // Otherwise, fall back to checking the node's key/value directly
      // This is important for cases where the matches set might not have the correct node ID
      // or for nodes that are rendered before the search completes
      const term = searchTerm.toLowerCase().trim();
      
      // Check key
      if (node.key && node.key.toLowerCase().includes(term)) return true;
      
      const v: any = node.value as any;
      
      // Check primitive values - this is critical for deeply nested string values
      if (typeof v === 'string') {
        if (v.toLowerCase().includes(term)) return true;
      }
      if (typeof v === 'number' || typeof v === 'boolean') {
        if (String(v).toLowerCase().includes(term)) return true;
      }
      
      // For objects and arrays, use deep search to find nested matches
      if (v && typeof v === 'object') {
        if (objectContainsTermDeep(v, term, 0, 10)) return true;
      }
      
      return false;
    })();

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
        case 'string':
          return 'text-green-600';
        case 'number':
          return 'text-blue-600';
        case 'boolean':
          return 'text-purple-600';
        case 'null':
          return 'text-gray-400';
        case 'array':
          return 'text-orange-600';
        case 'object':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    const tooltipContent = isComplexField
      ? `${node.type === 'array' ? 'Array' : 'Object'} with ${node.childCount} ${
          node.type === 'array' ? 'items' : 'properties'
        } - Double-click for details`
      : 'Double-click to view details';

    return (
      <motion.div
        style={style}
        className={`json-node flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors duration-150 ${
          isHighlighted
            ? 'bg-red-50 border-l-4 border-red-500 highlighted search-result'
            : isComplexField
              ? 'hover:bg-blue-50 border-l-2 border-transparent hover:border-blue-200'
              : 'hover:bg-gray-50'
        }`}
        data-testid={isHighlighted ? 'search-result' : 'json-node'}
        data-type={node.type}
        onDoubleClick={handleDoubleClick}
        title={tooltipContent}
        initial={false}
        animate={isHighlighted ? HIGHLIGHT_ANIMATIONS.flash : {}}
        transition={TRANSITIONS.smooth}
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
            <motion.div
              initial={false}
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={TRANSITIONS.smoothFast}
            >
              <ChevronRight className="h-3 w-3" />
            </motion.div>
          </Button>
        ) : (
          <div className="w-5" />
        )}

        {/* Key */}
        <span className="font-medium text-gray-700 min-w-0 flex-shrink-0">{node.key}:</span>

        {/* Value */}
        <span className={`${getTypeColor(node.type)} font-mono text-sm truncate`}>
          {formatValue(node.value, node.type)}
        </span>

        {/* Type badge for complex types */}
        {isComplexField && (
          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{node.type}</span>
        )}
      </motion.div>
    );
  }
);

ViewerTreeNode.displayName = 'ViewerTreeNode';

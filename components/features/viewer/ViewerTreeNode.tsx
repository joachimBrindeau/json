/**
 * Tree node component - renders individual JSON nodes
 */

'use client';

import { memo, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { HIGHLIGHT_ANIMATIONS, TRANSITIONS } from '@/components/animations';
import type { JsonNode } from './types';

// Shallow object scanner: checks first-level string/numeric/boolean values and up to one nested level for strings
function objectContainsTermShallow(obj: any, term: string, maxProps: number = 50): boolean {
  try {
    let checked = 0;
    for (const [k, v] of Object.entries(obj)) {
      if (checked++ > maxProps) break;
      if (typeof k === 'string' && k.toLowerCase().includes(term)) return true;
      if (typeof v === 'string' && v.toLowerCase().includes(term)) return true;
      if (typeof v === 'number' || typeof v === 'boolean') {
        if (String(v).toLowerCase().includes(term)) return true;
      }
      if (v && typeof v === 'object') {
        // one level deeper (limited)
        let innerChecked = 0;
        for (const [ik, iv] of Object.entries(v)) {
          if (innerChecked++ > Math.floor(maxProps / 5)) break;
          if (typeof ik === 'string' && ik.toLowerCase().includes(term)) return true;
          if (typeof iv === 'string' && iv.toLowerCase().includes(term)) return true;
          if (typeof iv === 'number' || typeof iv === 'boolean') {
            if (String(iv).toLowerCase().includes(term)) return true;
          }
        }
      }
    }
  } catch {}
  return false;
}

interface ViewerTreeNodeProps {
  node: JsonNode;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  searchTerm?: string;
  style?: React.CSSProperties;
  onDoubleClick?: (node: JsonNode) => void;
}

export const ViewerTreeNode = memo(
  ({ node, isExpanded, onToggle, searchTerm = '', style, onDoubleClick }: ViewerTreeNodeProps) => {
    const hasChildren = node.childCount > 0;
    const isComplexField = node.type === 'object' || node.type === 'array';

    // Check if node matches search
    const isHighlighted = (() => {
      if (!searchTerm) return false;
      const term = searchTerm.toLowerCase();
      if (node.key.toLowerCase().includes(term)) return true;
      const v: any = node.value as any;
      if (typeof v === 'string') return v.toLowerCase().includes(term);
      if (v && typeof v === 'object') return objectContainsTermShallow(v, term);
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
            ? 'bg-red-50 border-l-4 border-red-500 highlighted'
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

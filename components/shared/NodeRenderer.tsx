'use client';

import React, { memo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { JsonNode, formatJsonValue, getTypeColor } from './hooks/useJsonProcessing';

export interface NodeRendererProps {
  node: JsonNode;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  searchTerm?: string;
  style?: React.CSSProperties;
  onDoubleClick?: (node: JsonNode) => void;

  // Styling options
  compactMode?: boolean;
  showTypeIcon?: boolean;
  showSizeInfo?: boolean;
  indentSize?: number;
  maxValueLength?: number;

  // Custom renderers
  renderKey?: (key: string, node: JsonNode) => React.ReactNode;
  renderValue?: (value: any, type: string, node: JsonNode) => React.ReactNode;
  renderTypeIndicator?: (type: string, node: JsonNode) => React.ReactNode;
}

export const NodeRenderer = memo<NodeRendererProps>(
  ({
    node,
    isExpanded,
    onToggle,
    searchTerm = '',
    style,
    onDoubleClick,

    // Styling
    compactMode = false,
    showTypeIcon = true,
    showSizeInfo = true,
    indentSize = 16,
    maxValueLength = 50,

    // Custom renderers
    renderKey,
    renderValue,
    renderTypeIndicator,
  }) => {
    const hasChildren = node.childCount > 0;
    const isHighlighted =
      searchTerm &&
      (node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof node.value === 'string' &&
          node.value.toLowerCase().includes(searchTerm.toLowerCase())) ||
        node.path.toLowerCase().includes(searchTerm.toLowerCase()));

    const nodeHeight = compactMode ? 'py-0.5' : 'py-1';
    const fontSize = compactMode ? 'text-xs' : 'text-sm';

    const handleToggle = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(node.id);
      },
      [onToggle, node.id]
    );

    const handleDoubleClick = useCallback(() => {
      onDoubleClick?.(node);
    }, [onDoubleClick, node]);

    const renderKeyContent = () => {
      if (renderKey) {
        return renderKey(node.key, node);
      }

      return (
        <span className={`font-medium text-gray-700 min-w-0 truncate ${fontSize}`}>
          {node.key}:
        </span>
      );
    };

    const renderValueContent = () => {
      if (renderValue) {
        return renderValue(node.value, node.type, node);
      }

      return (
        <span className={`text-gray-600 flex-1 min-w-0 truncate ${fontSize}`}>
          {formatJsonValue(node.value, node.type, maxValueLength)}
        </span>
      );
    };

    const renderTypeIndicatorContent = () => {
      if (renderTypeIndicator) {
        return renderTypeIndicator(node.type, node);
      }

      if (!showTypeIcon) return null;

      return (
        <Badge variant="secondary" className={`text-xs px-2 py-0 h-5 ${getTypeColor(node.type)}`}>
          {node.type}
        </Badge>
      );
    };

    const renderSizeIndicator = () => {
      if (!showSizeInfo || compactMode || node.size <= 1024) return null;

      return (
        <Badge variant="outline" className="text-xs">
          {node.size > 1024 * 1024
            ? `${(node.size / (1024 * 1024)).toFixed(1)}MB`
            : `${(node.size / 1024).toFixed(1)}KB`}
        </Badge>
      );
    };

    return (
      <div
        style={style}
        className={`
        json-node flex items-center gap-2 px-2 ${nodeHeight} 
        hover:bg-gray-50 cursor-pointer transition-colors
        ${isHighlighted ? 'bg-yellow-100 border-l-2 border-yellow-400' : ''}
      `.trim()}
        data-testid="json-node"
        data-type={node.type}
        data-path={node.path}
        data-level={node.level}
        onDoubleClick={handleDoubleClick}
        title={`${node.path} (${node.type}) - Double-click for details`}
      >
        {/* Indentation */}
        <div style={{ marginLeft: `${node.level * indentSize}px` }} />

        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            className="p-1 hover:bg-gray-200 rounded cursor-pointer transition-colors"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Key */}
        {renderKeyContent()}

        {/* Type Indicator */}
        {renderTypeIndicatorContent()}

        {/* Value */}
        {renderValueContent()}

        {/* Size Indicator */}
        {renderSizeIndicator()}
      </div>
    );
  }
);

NodeRenderer.displayName = 'NodeRenderer';

// Specialized node renderers for different use cases
export type CompactNodeRendererProps = Omit<NodeRendererProps, 'compactMode'>;

export const CompactNodeRenderer = memo<CompactNodeRendererProps>((props) => (
  <NodeRenderer {...props} compactMode={true} showSizeInfo={false} indentSize={12} />
));

CompactNodeRenderer.displayName = 'CompactNodeRenderer';

export interface ListNodeRendererProps extends NodeRendererProps {
  showPath?: boolean;
}

export const ListNodeRenderer = memo<ListNodeRendererProps>(
  ({ showPath = false, renderKey, node, ...props }) => (
    <NodeRenderer
      {...props}
      node={node}
      renderKey={
        renderKey ||
        (showPath
          ? (_key, node) => (
              <span className="font-mono text-xs text-gray-500 min-w-0 truncate mr-2">
                {node.path.replace('root.', '') || 'root'}
              </span>
            )
          : undefined)
      }
    />
  )
);

ListNodeRenderer.displayName = 'ListNodeRenderer';

// Tree-specific node renderer with enhanced features
export interface TreeNodeRendererProps extends NodeRendererProps {
  showChildCount?: boolean;
  enableKeyboardNav?: boolean;
}

export const TreeNodeRenderer = memo<TreeNodeRendererProps>(
  ({ showChildCount = true, enableKeyboardNav = false, renderKey, node, ...props }) => {
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!enableKeyboardNav) return;

        switch (e.key) {
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (node.childCount > 0) {
              props.onToggle(node.id);
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            if (node.childCount > 0 && !props.isExpanded) {
              props.onToggle(node.id);
            }
            break;
          case 'ArrowLeft':
            e.preventDefault();
            if (props.isExpanded) {
              props.onToggle(node.id);
            }
            break;
        }
      },
      [enableKeyboardNav, node.childCount, props.isExpanded, props.onToggle, node.id]
    );

    return (
      <div
        onKeyDown={handleKeyDown}
        tabIndex={enableKeyboardNav ? 0 : -1}
        role={enableKeyboardNav ? 'treeitem' : undefined}
        aria-expanded={enableKeyboardNav && node.childCount > 0 ? props.isExpanded : undefined}
      >
        <NodeRenderer
          {...props}
          node={node}
          renderKey={
            renderKey ||
            (showChildCount && node.childCount > 0
              ? (key, node) => (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-700 min-w-0 truncate text-sm">
                      {key}:
                    </span>
                    <Badge variant="outline" className="text-xs h-4">
                      {node.childCount}
                    </Badge>
                  </div>
                )
              : undefined)
          }
        />
      </div>
    );
  }
);

TreeNodeRenderer.displayName = 'TreeNodeRenderer';

// Utility hook for common node rendering logic
export const useNodeRenderer = (options: {
  searchTerm?: string;
  compactMode?: boolean;
  highlightMatches?: boolean;
}) => {
  const { searchTerm = '', compactMode = false, highlightMatches = true } = options;

  const isNodeHighlighted = useCallback(
    (node: JsonNode) => {
      if (!highlightMatches || !searchTerm) return false;

      return (
        node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof node.value === 'string' &&
          node.value.toLowerCase().includes(searchTerm.toLowerCase())) ||
        node.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    [searchTerm, highlightMatches]
  );

  const getNodeClassName = useCallback(
    (node: JsonNode) => {
      const baseClasses = [
        'json-node',
        'flex',
        'items-center',
        'gap-2',
        'px-2',
        compactMode ? 'py-0.5' : 'py-1',
        'hover:bg-gray-50',
        'cursor-pointer',
        'transition-colors',
      ];

      if (isNodeHighlighted(node)) {
        baseClasses.push('bg-red-50', 'border-l-4', 'border-red-500');
      }

      return baseClasses.join(' ');
    },
    [compactMode, isNodeHighlighted]
  );

  return {
    isNodeHighlighted,
    getNodeClassName,
  };
};

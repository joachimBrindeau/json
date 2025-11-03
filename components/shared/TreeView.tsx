'use client';

import React, { useMemo, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreePine as TreeIcon } from 'lucide-react';

import { useTreeExpansion } from '@/hooks/use-tree-expansion';

interface TreeViewProps {
  content: string;
  maxItems?: number;
  maxProperties?: number;
}

// Optimized tree view for large datasets
export const TreeView = memo(({ content, maxItems = 100, maxProperties = 50 }: TreeViewProps) => {
  const { expanded: expandedKeys, toggle: toggleExpand } = useTreeExpansion({ initialExpanded: new Set() });

  const treeData = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }, [content]);


  const renderTreeNode = useCallback(
    (value: any, key: string, path = ''): React.ReactElement => {
      const currentPath = path ? `${path}.${key}` : key;
      const isExpanded = expandedKeys.has(currentPath);

      if (Array.isArray(value)) {
        return (
          <div key={currentPath} className="ml-4">
            <div
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-2"
              onClick={() => toggleExpand(currentPath)}
            >
              <span className="text-blue-600 font-mono">{isExpanded ? '▼' : '▶'}</span>
              <span className="font-semibold text-blue-800">{key}</span>
              <Badge variant="outline" className="text-xs">
                Array[{value.length}]
              </Badge>
            </div>
            {isExpanded && (
              <div className="ml-4">
                {value
                  .slice(0, maxItems)
                  .map((item, index) => renderTreeNode(item, index.toString(), currentPath))}
                {value.length > maxItems && (
                  <div className="text-sm text-muted-foreground ml-6 py-1">
                    ... and {value.length - maxItems} more items
                  </div>
                )}
              </div>
            )}
          </div>
        );
      } else if (value !== null && typeof value === 'object') {
        const keys = Object.keys(value);
        return (
          <div key={currentPath} className="ml-4">
            <div
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-2"
              onClick={() => toggleExpand(currentPath)}
            >
              <span className="text-green-600 font-mono">{isExpanded ? '▼' : '▶'}</span>
              <span className="font-semibold text-green-800">{key}</span>
              <Badge variant="outline" className="text-xs">
                Object[{keys.length}]
              </Badge>
            </div>
            {isExpanded && (
              <div className="ml-4">
                {keys
                  .slice(0, maxProperties)
                  .map((objKey) => renderTreeNode(value[objKey], objKey, currentPath))}
                {keys.length > maxProperties && (
                  <div className="text-sm text-muted-foreground ml-6 py-1">
                    ... and {keys.length - maxProperties} more properties
                  </div>
                )}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div key={currentPath} className="ml-4 flex items-center gap-2 py-1">
            <span className="w-4"></span>
            <span className="font-medium text-gray-700">{key}:</span>
            <span className="text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-sm font-mono">
              {String(value)}
            </span>
          </div>
        );
      }
    },
    [expandedKeys, toggleExpand, maxItems, maxProperties]
  );

  if (!treeData) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <TreeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Invalid JSON for tree view</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 max-h-96 overflow-auto">
      <div className="font-mono text-sm">
        {typeof treeData === 'object' && treeData !== null ? (
          Array.isArray(treeData) ? (
            renderTreeNode(treeData, 'root')
          ) : (
            Object.keys(treeData).map((key) => renderTreeNode(treeData[key], key))
          )
        ) : (
          <div className="text-yellow-700 bg-yellow-50 px-2 py-1 rounded">{String(treeData)}</div>
        )}
      </div>
    </Card>
  );
});

TreeView.displayName = 'TreeView';

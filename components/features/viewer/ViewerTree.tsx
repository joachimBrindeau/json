/**
 * Tree view mode - hierarchical JSON display
 */

'use client';

import { useState, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { ViewerTreeNode } from './ViewerTreeNode';
import { useViewerTreeState } from './ViewerTreeState';
import { useViewerTreeSearch } from './ViewerTreeSearch';
import { NodeDetailsModal } from '@/components/features/modals/node-details-modal';
import type { JsonNode } from './types';

interface ViewerTreeProps {
  data: any;
  virtualized?: boolean;
  height?: number;
  enableSearch?: boolean;
}

export const ViewerTree = ({
  data,
  virtualized = false,
  height = 600,
  enableSearch = true,
}: ViewerTreeProps) => {
  const { nodes, expandedNodes, toggleNode, expandAll, collapseAll } = useViewerTreeState(data);
  const { searchTerm, setSearchTerm, filteredNodes, matchCount } = useViewerTreeSearch(nodes);
  
  const [selectedNode, setSelectedNode] = useState<JsonNode | null>(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);

  const handleNodeDoubleClick = useCallback((node: JsonNode) => {
    setSelectedNode(node);
    setShowNodeDetails(true);
  }, []);

  const handleCloseNodeDetails = useCallback(() => {
    setShowNodeDetails(false);
    setSelectedNode(null);
  }, []);

  // Virtualized rendering for large datasets
  if (virtualized) {
    return (
      <div className="viewer-tree">
        {/* Search bar */}
        {enableSearch && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search keys and values..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchTerm && (
                <Badge variant="secondary">
                  {matchCount} matches
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                title="Expand all nodes"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                title="Collapse all nodes"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Virtualized list */}
        <List
          height={height - (enableSearch ? 80 : 0)}
          itemCount={filteredNodes.length}
          itemSize={() => 32}
          width="100%"
        >
          {({ index, style }) => (
            <ViewerTreeNode
              node={filteredNodes[index]}
              isExpanded={expandedNodes.has(filteredNodes[index].id)}
              onToggle={toggleNode}
              searchTerm={searchTerm}
              style={style}
              onDoubleClick={handleNodeDoubleClick}
            />
          )}
        </List>

        {/* Node details modal */}
        {selectedNode && (
          <NodeDetailsModal
            isOpen={showNodeDetails}
            onClose={handleCloseNodeDetails}
            node={selectedNode}
          />
        )}
      </div>
    );
  }

  // Simple rendering for small datasets
  return (
    <div className="viewer-tree">
      {/* Search bar */}
      {enableSearch && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search keys and values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Badge variant="secondary">
                {matchCount} matches
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              title="Expand all nodes"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              title="Collapse all nodes"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tree nodes */}
      <div className="tree-nodes overflow-auto" style={{ height: height - (enableSearch ? 80 : 0) }}>
        {filteredNodes.map((node) => (
          <ViewerTreeNode
            key={node.id}
            node={node}
            isExpanded={expandedNodes.has(node.id)}
            onToggle={toggleNode}
            searchTerm={searchTerm}
            onDoubleClick={handleNodeDoubleClick}
          />
        ))}
      </div>

      {/* Node details modal */}
      {selectedNode && (
        <NodeDetailsModal
          isOpen={showNodeDetails}
          onClose={handleCloseNodeDetails}
          node={selectedNode}
        />
      )}
    </div>
  );
};


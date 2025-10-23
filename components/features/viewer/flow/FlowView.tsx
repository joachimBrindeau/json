/**
 * FlowView - Main flow diagram component
 *
 * Follows Single Responsibility Principle:
 * - Orchestrates flow rendering
 * - Delegates parsing to useFlowParser
 * - Delegates node management to useFlowNodes
 * - Delegates modal management to useNodeDetailsModal
 */

'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  Node,
  ConnectionMode,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeDetailsModal } from '@/components/features/viewer/node-details/NodeDetailsModal';
import { cn } from '@/lib/utils';
import {
  FLOW_NODE_TYPES,
  FLOW_EDGE_TYPES,
  FLOW_FIT_VIEW_OPTIONS,
  FLOW_ZOOM_CONFIG,
  FLOW_DEFAULT_VIEWPORT,
  FLOW_DEFAULT_EDGE_OPTIONS,
  getMinimapNodeColor,
} from './config/flow-config';
import { useFlowParser } from './hooks/useFlowParser';
import { useFlowNodes } from './hooks/useFlowNodes';
import { useNodeDetailsModal } from './hooks/useNodeDetailsModal';
interface JsonFlowViewProps {
  json: unknown;
  className?: string;
  onNodeClick?: (node: Node) => void;
  searchTerm?: string;
}

/**
 * Inner component - orchestrates flow rendering with hooks
 */
function JsonFlowViewInner({ json, className, onNodeClick, searchTerm = '' }: JsonFlowViewProps) {
  // Parse JSON into nodes and edges
  const { nodes: parsedNodes, edges: parsedEdges } = useFlowParser(json);

  // Manage node state with collapse functionality
  const { nodes, edges, onNodesChange, onEdgesChange } = useFlowNodes(
    parsedNodes,
    parsedEdges,
    undefined,
    searchTerm
  );

  // Manage node details modal
  const { selectedNode, isOpen, openModal, closeModal } = useNodeDetailsModal();

  // Handle node click events
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  // Handle node double-click to show details
  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      openModal(node);
    },
    [openModal]
  );

  // Validate connections
  const isValidConnection = useCallback(
    (connection: Connection) => {
      // Prevent self-connections
      if (connection.source === connection.target) {
        return false;
      }

      // Prevent duplicate connections
      const isDuplicate = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === connection.sourceHandle &&
          edge.targetHandle === connection.targetHandle
      );

      return !isDuplicate;
    },
    [edges]
  );

  return (
    <>
      <div className={cn('w-full h-full', className)}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={FLOW_NODE_TYPES}
          edgeTypes={FLOW_EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          connectionMode={ConnectionMode.Loose}
          isValidConnection={isValidConnection as any}
          fitView
          fitViewOptions={FLOW_FIT_VIEW_OPTIONS}
          minZoom={FLOW_ZOOM_CONFIG.minZoom}
          maxZoom={FLOW_ZOOM_CONFIG.maxZoom}
          defaultViewport={FLOW_DEFAULT_VIEWPORT}
          defaultEdgeOptions={FLOW_DEFAULT_EDGE_OPTIONS}
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <MiniMap
            nodeColor={getMinimapNodeColor}
            className="!bg-white dark:!bg-gray-950 !shadow-lg !border !border-gray-200 dark:!border-gray-800"
            maskColor="rgb(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      <NodeDetailsModal open={isOpen} onOpenChange={closeModal} node={selectedNode as any} />
    </>
  );
}

export function FlowView(props: JsonFlowViewProps) {
  return (
    <ReactFlowProvider>
      <JsonFlowViewInner {...props} />
    </ReactFlowProvider>
  );
}

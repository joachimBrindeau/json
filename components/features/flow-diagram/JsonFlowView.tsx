'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { jsonParser } from '@/components/features/flow-diagram/utils/json-parser';
import { getLayoutedSeaNodes } from '@/components/features/flow-diagram/utils/position-helper';
import { ObjectNode } from '@/components/features/flow-diagram/nodes/ObjectNode';
import { ArrayNode } from '@/components/features/flow-diagram/nodes/ArrayNode';
import { PrimitiveNode } from '@/components/features/flow-diagram/nodes/PrimitiveNode';
import { DefaultEdge } from '@/components/features/flow-diagram/edges/DefaultEdge';
import { ChainEdge } from '@/components/features/flow-diagram/edges/ChainEdge';
import { NodeDetailsModal } from '@/components/features/modals/node-details-modal';
import { cn } from '@/lib/utils';

const nodeTypes = {
  object: ObjectNode,
  array: ArrayNode,
  primitive: PrimitiveNode,
};

const edgeTypes = {
  default: DefaultEdge,
  chain: ChainEdge,
};

interface JsonFlowViewProps {
  json: unknown;
  className?: string;
  onNodeClick?: (node: Node) => void;
}

function JsonFlowViewInner({ json, className, onNodeClick }: JsonFlowViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    key: string;
    value: unknown;
    type: string;
    level: number;
    path: string;
    size: number;
    childCount: number;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [allEdges, setAllEdges] = useState<Edge[]>([]);

  // Define toggle handler first
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    if (!json) return;

    try {
      // Parse JSON into nodes and edges
      const { flowNodes, edges: parsedEdges } = jsonParser(json);

      // Apply dagre layout
      const layoutedNodes = getLayoutedSeaNodes(flowNodes, parsedEdges);

      // Convert to ReactFlow format with toggle callback
      const reactFlowNodes = layoutedNodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node.data,
          onToggleCollapse: handleToggleCollapse,
        },
      }));

      const flowEdges = parsedEdges.map((edge) => ({
        ...edge,
        type: edge.type || 'default', // Use our custom edge types
        animated: false, // No animation needed, handled by custom edges
        style: undefined, // Let custom edges handle styling
      }));

      // Store all nodes and edges
      setAllNodes(reactFlowNodes);
      setAllEdges(flowEdges);

      // Initially show all nodes
      setNodes(reactFlowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }, [json, setNodes, setEdges, handleToggleCollapse]);

  // Helper function to get all descendant node IDs
  const getDescendantIds = useCallback((nodeId: string, edges: Edge[]): Set<string> => {
    const descendants = new Set<string>();
    const toProcess = [nodeId];

    while (toProcess.length > 0) {
      const currentId = toProcess.pop()!;

      edges.forEach((edge) => {
        if (edge.source === currentId && !descendants.has(edge.target)) {
          descendants.add(edge.target);
          toProcess.push(edge.target);
        }
      });
    }

    return descendants;
  }, []);

  // Update visible nodes when collapsed state changes
  useEffect(() => {
    if (allNodes.length === 0) return;

    // Calculate which nodes should be hidden
    const hiddenNodes = new Set<string>();

    collapsedNodes.forEach((collapsedId) => {
      const descendants = getDescendantIds(collapsedId, allEdges);
      descendants.forEach((id) => hiddenNodes.add(id));
    });

    // Filter nodes and edges
    const visibleNodes = allNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isCollapsed: collapsedNodes.has(node.id),
        onToggleCollapse: handleToggleCollapse,
      },
      hidden: hiddenNodes.has(node.id),
    }));

    const visibleEdges = allEdges.map((edge) => ({
      ...edge,
      hidden: hiddenNodes.has(edge.target) || hiddenNodes.has(edge.source),
    }));

    setNodes(visibleNodes);
    setEdges(visibleEdges);
  }, [
    collapsedNodes,
    allNodes,
    allEdges,
    getDescendantIds,
    setNodes,
    setEdges,
    handleToggleCollapse,
  ]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Single click - just call the callback if provided
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Double click - show details modal
    // Convert node data to the format expected by NodeDetailsModal
    let value;
    let childCount = 0;
    let key = node.id;

    if (node.type === 'object') {
      value = node.data.obj || {};
      childCount = Object.keys(value).length;
      key = node.data.isRootNode ? 'JSON Root' : node.id;
    } else if (node.type === 'array') {
      value = node.data.items || [];
      childCount = value.length;
      key = node.data.isRootNode ? 'JSON Root' : `[${node.data.arrayIndex}]`;
    } else {
      // Primitive node
      value = node.data.value;
      key = node.data.propertyK || node.id;
    }

    const nodeDetails = {
      id: node.id,
      key: key,
      value: value,
      type:
        node.type === 'primitive'
          ? value === null
            ? 'null'
            : Array.isArray(value)
              ? 'array'
              : typeof value
          : node.type,
      level: node.data.level || 0,
      path: node.data.parentNodePathIds?.join('.') || 'root',
      size: JSON.stringify(value).length,
      childCount: childCount,
    };
    setSelectedNode(nodeDetails);
    setShowDetails(true);
  }, []);

  const miniMapNodeColor = useCallback((node: Node) => {
    switch (node.type) {
      case 'object':
        return '#10b981';
      case 'array':
        return '#3b82f6';
      case 'primitive':
        return '#f59e0b';
      default:
        return '#94a3b8';
    }
  }, []);

  return (
    <>
      <div className={cn('w-full h-full', className)}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.2,
            maxZoom: 1.5,
            minZoom: 0.1,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          defaultEdgeOptions={undefined}
        >
          <Background variant="dots" gap={12} size={1} />
          <Controls
            showZoom
            showFitView
            showInteractive
            className="!bg-white dark:!bg-gray-950 !shadow-lg !border !border-gray-200 dark:!border-gray-800"
          />
          <MiniMap
            nodeColor={miniMapNodeColor}
            className="!bg-white dark:!bg-gray-950 !shadow-lg !border !border-gray-200 dark:!border-gray-800"
            maskColor="rgb(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      <NodeDetailsModal open={showDetails} onOpenChange={setShowDetails} node={selectedNode} />
    </>
  );
}

export default function JsonFlowView(props: JsonFlowViewProps) {
  return (
    <ReactFlowProvider>
      <JsonFlowViewInner {...props} />
    </ReactFlowProvider>
  );
}

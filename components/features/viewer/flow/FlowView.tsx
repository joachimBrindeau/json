'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { jsonParser } from '@/components/features/viewer/flow/utils/flow-parser';
import { getLayoutedSeaNodes } from '@/components/features/viewer/flow/utils/flow-layout';
import { extractNodeDetails, NodeDetails } from '@/components/features/viewer/flow/utils/flow-node-details';
import { useFlowCollapse } from '@/components/features/viewer/flow/hooks/useFlowCollapse';
import { FlowObjectNode } from '@/components/features/viewer/flow/nodes/FlowObjectNode';
import { FlowArrayNode } from '@/components/features/viewer/flow/nodes/FlowArrayNode';
import { FlowPrimitiveNode } from '@/components/features/viewer/flow/nodes/FlowPrimitiveNode';
import { FlowDefaultEdge } from '@/components/features/viewer/flow/edges/FlowDefaultEdge';
import { FlowChainEdge } from '@/components/features/viewer/flow/edges/FlowChainEdge';
import { NodeDetailsModal } from '@/components/features/modals/node-details-modal';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const nodeTypes = {
  object: FlowObjectNode,
  array: FlowArrayNode,
  primitive: FlowPrimitiveNode,
};

const edgeTypes = {
  default: FlowDefaultEdge,
  chain: FlowChainEdge,
};

const MINIMAP_NODE_COLORS = {
  object: '#10b981',
  array: '#3b82f6',
  primitive: '#f59e0b',
  default: '#94a3b8',
} as const;

interface JsonFlowViewProps {
  json: unknown;
  className?: string;
  onNodeClick?: (node: Node) => void;
}

function JsonFlowViewInner({ json, className, onNodeClick }: JsonFlowViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<NodeDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [allEdges, setAllEdges] = useState<Edge[]>([]);

  const { handleToggleCollapse, getVisibleNodes, getVisibleEdges } = useFlowCollapse(allNodes, allEdges);

  // Memoize expensive parsing and layout operations to prevent re-computation on every render
  const { parsedNodes, parsedEdges } = useMemo(() => {
    if (!json) return { parsedNodes: [], parsedEdges: [] };

    try {
      const { flowNodes, edges: parsedEdges } = jsonParser(json);
      const layoutedNodes = getLayoutedSeaNodes(flowNodes, parsedEdges);

      return {
        parsedNodes: layoutedNodes,
        parsedEdges: parsedEdges
      };
    } catch (error) {
      logger.error({ err: error }, 'Error parsing JSON in FlowView');
      return { parsedNodes: [], parsedEdges: [] };
    }
  }, [json]);

  // Update nodes and edges when parsed data or collapse handler changes
  useEffect(() => {
    if (parsedNodes.length === 0) return;

    const reactFlowNodes = parsedNodes.map((node) => ({
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
      type: edge.type || 'default',
      animated: false,
      style: undefined,
    }));

    setAllNodes(reactFlowNodes);
    setAllEdges(flowEdges);
    setNodes(reactFlowNodes);
    setEdges(flowEdges);
  }, [parsedNodes, parsedEdges, handleToggleCollapse, setNodes, setEdges]);

  useEffect(() => {
    if (allNodes.length === 0) return;
    setNodes(getVisibleNodes());
    setEdges(getVisibleEdges());
  }, [allNodes, allEdges, getVisibleNodes, getVisibleEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    const nodeDetails = extractNodeDetails(node);
    setSelectedNode(nodeDetails);
    setShowDetails(true);
  }, []);

  const miniMapNodeColor = useCallback(
    (node: Node) => MINIMAP_NODE_COLORS[node.type as keyof typeof MINIMAP_NODE_COLORS] || MINIMAP_NODE_COLORS.default,
    []
  );

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

export function FlowView(props: JsonFlowViewProps) {
  return (
    <ReactFlowProvider>
      <JsonFlowViewInner {...props} />
    </ReactFlowProvider>
  );
}

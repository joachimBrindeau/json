import * as React from 'react';
import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ObjectNode } from '@/components/features/flow-diagram/nodes/ObjectNode';
import { ArrayNode } from '@/components/features/flow-diagram/nodes/ArrayNode';
import { PrimitiveNode } from '@/components/features/flow-diagram/nodes/PrimitiveNode';
import { jsonParser } from '@/components/features/flow-diagram/utils/json-parser';
import { getLayoutedSeaNodes } from '@/components/features/flow-diagram/utils/position-helper';
import { NodeType } from '@/components/features/flow-diagram/utils/types';

const nodeTypes = {
  [NodeType.Object]: ObjectNode,
  [NodeType.Array]: ArrayNode,
  [NodeType.Primitive]: PrimitiveNode,
};

interface JsonSeaDiagramProps {
  data: object | any[];
  className?: string;
}

export const JsonSeaDiagram: React.FC<JsonSeaDiagramProps> = ({
  data,
  className = 'w-full h-[600px]',
}) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    try {
      const { flowNodes, edges } = jsonParser(data);
      const layoutedNodes = getLayoutedSeaNodes(flowNodes, edges);

      return {
        nodes: layoutedNodes,
        edges,
      };
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return { nodes: [], edges: [] };
    }
  }, [data]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes as Node[]);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className={className}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

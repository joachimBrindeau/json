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

import { FlowObjectNode } from '@/components/features/viewer/flow/nodes/FlowObjectNode';
import { FlowArrayNode } from '@/components/features/viewer/flow/nodes/FlowArrayNode';
import { FlowPrimitiveNode } from '@/components/features/viewer/flow/nodes/FlowPrimitiveNode';
import { jsonParser } from '@/components/features/viewer/flow/utils/flow-parser';
import { getLayoutedSeaNodes } from '@/components/features/viewer/flow/utils/flow-layout';
import { NodeType } from '@/components/features/viewer/flow/utils/flow-types';
import { logger } from '@/lib/logger';

const nodeTypes = {
  [NodeType.Object]: FlowObjectNode,
  [NodeType.Array]: FlowArrayNode,
  [NodeType.Primitive]: FlowPrimitiveNode,
};

interface FlowDiagramProps {
  data: object | any[];
  className?: string;
}

export const FlowDiagram: React.FC<FlowDiagramProps> = ({
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
      logger.error({ err: error }, 'Error parsing JSON for flow diagram');
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

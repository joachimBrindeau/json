'use client';

import { memo } from 'react';
import { EdgeProps, getStraightPath } from 'reactflow';

const ChainEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}: EdgeProps) => {
  // Use getStraightPath for chain connections (array items)
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const strokeWidth = 3;

  return (
    <path
      id={id}
      style={{
        ...style,
        stroke: '#60a5fa', // blue-400
        strokeWidth,
        transform: `translateX(-${strokeWidth / 2}px)`,
      }}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
      strokeDasharray="5 8"
    />
  );
};

export const FlowChainEdge = memo(ChainEdgeComponent);

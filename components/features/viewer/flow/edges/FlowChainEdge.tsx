'use client';

import { memo } from 'react';
import { EdgeProps, getStraightPath } from '@xyflow/react';

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
    <>
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
      {/* Animated overlay for chain edges */}
      <path
        style={{
          stroke: '#93c5fd', // blue-300
          strokeWidth: strokeWidth - 1,
          transform: `translateX(-${strokeWidth / 2}px)`,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        strokeDasharray="5 8"
        strokeDashoffset="0"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="13"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
    </>
  );
};

export const FlowChainEdge = memo(ChainEdgeComponent);

import { memo } from 'react';

const _HoveringBlueDot = () => {
  return <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />;
};

export const FlowHoveringDot = memo(_HoveringBlueDot);
export const HoveringBlueDot = FlowHoveringDot;

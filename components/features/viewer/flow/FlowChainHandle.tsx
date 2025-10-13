import { memo, useMemo } from 'react';
import { Handle, HandleProps, HandleType, Position } from 'reactflow';
import { sizes } from '@/components/features/viewer/flow/utils/flow-constants';

const hiddenHandleStyle = {
  backgroundColor: 'transparent',
  border: 'none',
};

type Props = Pick<HandleProps, 'id' | 'type'>;

const ChainHandleComponent = ({ id, type }: Props) => {
  const handleTypeToPositionMap: Record<HandleType, Position> = useMemo(
    () => ({
      source: Position.Bottom,
      target: Position.Top,
    }),
    []
  );

  return (
    <Handle
      style={{ ...hiddenHandleStyle, left: sizes.arrayNodeSize / 2 }}
      id={id}
      type={type}
      position={handleTypeToPositionMap[type]}
    />
  );
};

export const FlowChainHandle = memo(ChainHandleComponent);

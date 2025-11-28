import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

type Props = {
  size?: 'default' | 'sm' | 'lg';
  className?: string;
};

const _NullChip = ({ size: _size = 'default', className }: Props) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  return (
    <Badge className={className} variant="secondary">
      {JSON.stringify(null)}
    </Badge>
  );
};

export const FlowNullChip = memo(_NullChip);
export const NullChip = FlowNullChip;

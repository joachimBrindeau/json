'use client';

import { memo } from 'react';
import type { ArrayRendererProps } from '../types';
import { CommonEntryRenderer } from './CommonEntryRenderer';

export const ArrayRenderer = memo(({ value }: ArrayRendererProps) => {
  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <CommonEntryRenderer key={index} label={`[${index}]`} value={item} />
      ))}
    </div>
  );
});
ArrayRenderer.displayName = 'ArrayRenderer';

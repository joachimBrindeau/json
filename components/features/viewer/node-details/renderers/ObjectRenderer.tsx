'use client';

import { memo } from 'react';
import type { ObjectRendererProps } from '../types';
import { CommonEntryRenderer } from './CommonEntryRenderer';

export const ObjectRenderer = memo(({ value }: ObjectRendererProps) => {
  return (
    <div className="space-y-3">
      {Object.entries(value).map(([key, val]) => (
        <CommonEntryRenderer key={key} label={key} value={val} />
      ))}
    </div>
  );
});

ObjectRenderer.displayName = 'ObjectRenderer';

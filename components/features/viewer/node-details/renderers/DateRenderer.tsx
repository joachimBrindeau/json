'use client';

import { memo } from 'react';
import { Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { DateDetection } from '../types';

interface DateRendererProps {
  value: string;
  detection: DateDetection;
}

export const DateRenderer = memo(({ detection }: DateRendererProps) => {
  const { timestamp } = detection.metadata;
  const date = new Date(timestamp);

  return (
    <div className="space-y-2">
      {/* Main Date Display */}
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-blue-500" />
        <div className="flex-1">
          <div className="text-sm font-semibold">{format(date, 'PPP')}</div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Compact Formats */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ISO</span>
          <code className="font-mono">{date.toISOString()}</code>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Unix</span>
          <code className="font-mono">{Math.floor(timestamp / 1000)}</code>
        </div>
      </div>
    </div>
  );
});

DateRenderer.displayName = 'DateRenderer';

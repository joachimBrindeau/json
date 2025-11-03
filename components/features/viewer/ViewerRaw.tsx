/**
 * Raw JSON mode - formatted JSON text display
 */

'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewerRawProps {
  data: any;
  height?: number;
}

export const ViewerRaw = ({ data, height = 600 }: ViewerRawProps) => {
  const formatted = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return 'Error formatting JSON';
    }
  }, [data]);

  return (
    <ScrollArea style={{ height }} className="w-full">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
        <code>{formatted}</code>
      </pre>
    </ScrollArea>
  );
};

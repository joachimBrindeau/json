'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import type { BooleanRendererProps } from '../types';

export const BooleanRenderer = memo(({ value }: BooleanRendererProps) => {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              value
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}
          >
            {value ? <Check className="h-10 w-10" /> : <X className="h-10 w-10" />}
          </div>
          
          <code className="text-2xl font-mono font-bold">
            {value ? 'true' : 'false'}
          </code>
          
          <div className="text-sm text-muted-foreground">
            Boolean value
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BooleanRenderer.displayName = 'BooleanRenderer';


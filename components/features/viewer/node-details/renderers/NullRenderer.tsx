'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Minus } from 'lucide-react';

export const NullRenderer = memo(() => {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
            <Minus className="h-10 w-10" />
          </div>
          
          <code className="text-2xl font-mono font-bold text-gray-500">
            null
          </code>
          
          <div className="text-sm text-muted-foreground">
            Null value
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

NullRenderer.displayName = 'NullRenderer';


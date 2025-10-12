'use client';

import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';
import { analyzeJson, getRecommendedViewer, type JsonStats } from '@/lib/json';

interface PerformanceMonitorProps {
  content: string;
}

// Performance monitoring component
export const PerformanceMonitor = memo(({ content }: PerformanceMonitorProps) => {
  const stats = useMemo(() => analyzeJson(content), [content]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Performance Analysis
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.sizeKB.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">KB</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.nodeCount}</div>
          <div className="text-sm text-muted-foreground">Nodes</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.maxDepth}</div>
          <div className="text-sm text-muted-foreground">Max Depth</div>
        </div>

        <div className="col-span-2 md:col-span-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Complexity</span>
            <Badge
              variant={
                stats.complexity === 'High'
                  ? 'destructive'
                  : stats.complexity === 'Medium'
                    ? 'secondary'
                    : 'default'
              }
            >
              {stats.complexity}
            </Badge>
          </div>
          <Progress
            value={stats.complexity === 'High' ? 100 : stats.complexity === 'Medium' ? 60 : 30}
            className="h-2"
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          • Size:{' '}
          {stats.sizeMB > 1 ? `${stats.sizeMB.toFixed(2)} MB` : `${stats.sizeKB.toFixed(1)} KB`}
        </p>
        <p>• Recommended viewer: {getRecommendedViewer(stats)}</p>
      </div>
    </Card>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

'use client';

import { memo, useState, useMemo, useEffect } from 'react';
import { VirtualJsonViewer } from './virtual-json-viewer';
import { SimpleJsonViewer } from './simple-json-viewer';
import { largeJsonHandler } from '@/lib/json';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Zap, Info } from 'lucide-react';

interface SmartJsonViewerProps {
  jsonString: string;
  height?: number;
}

// Smart viewer that chooses optimal rendering strategy based on data size and complexity
export const SmartJsonViewer = memo<SmartJsonViewerProps>(({ jsonString, height = 600 }) => {
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseStats, setParseStats] = useState<any>(null);
  const [renderMode, setRenderMode] = useState<'auto' | 'simple' | 'virtual'>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse JSON with performance monitoring
  useEffect(() => {
    const parseJson = async () => {
      if (!jsonString?.trim()) {
        setParsedData(null);
        setParseStats(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await largeJsonHandler.parseStream(jsonString);
        setParsedData(result.data);
        setParseStats(result.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse JSON');
        setParsedData(null);
        setParseStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    parseJson();
  }, [jsonString]);

  // Determine optimal rendering strategy with enhanced logic
  const optimalRenderMode = useMemo(() => {
    if (!parsedData || !parseStats) return 'simple';

    const sizeMB = parseStats.size / (1024 * 1024);
    const isLarge = largeJsonHandler.isLarge(jsonString);
    const isVeryLarge = largeJsonHandler.isVeryLarge(jsonString);
    const shouldVirtualize = largeJsonHandler.shouldVirtualize(parsedData);
    const nodeCount = largeJsonHandler.analyzeJsonStructure(parsedData);

    // Enhanced decision logic
    if (sizeMB > 100 || isVeryLarge) {
      return 'virtual'; // Use virtual scrolling for extremely large data
    } else if (sizeMB > 20 || shouldVirtualize || nodeCount.estimatedSize > 500000) {
      return 'virtual'; // Use virtual scrolling for large data
    } else if (sizeMB > 5 || isLarge) {
      return 'simple'; // Use enhanced simple viewer for medium data
    } else {
      return 'simple'; // Use simple viewer for small data
    }
  }, [parsedData, parseStats, jsonString]);

  // Choose render mode
  const activeRenderMode = renderMode === 'auto' ? optimalRenderMode : renderMode;

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Enhanced performance recommendations
  const getPerformanceLevel = (): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (!parseStats) return 'excellent';

    const sizeMB = parseStats.size / (1024 * 1024);
    const parseTime = parseStats.parseTime;
    
    // Consider both size and parse time for better assessment
    const sizeScore = sizeMB > 500 ? 4 : sizeMB > 100 ? 3 : sizeMB > 20 ? 2 : sizeMB > 5 ? 1 : 0;
    const timeScore = parseTime > 5000 ? 4 : parseTime > 2000 ? 3 : parseTime > 1000 ? 2 : parseTime > 500 ? 1 : 0;
    const maxScore = Math.max(sizeScore, timeScore);

    switch (maxScore) {
      case 4: return 'critical';
      case 3: return 'warning';
      case 2: return 'good';
      case 1: return 'good';
      default: return 'excellent';
    }
  };

  const performanceLevel = getPerformanceLevel();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 animate-spin" />
          <span>Parsing JSON...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <strong>Parse Error:</strong> {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!parsedData) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <span>No JSON data to display</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Performance Dashboard */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <Badge
            variant={
              performanceLevel === 'critical'
                ? 'destructive'
                : performanceLevel === 'warning'
                  ? 'destructive'
                  : performanceLevel === 'good'
                    ? 'secondary'
                    : 'default'
            }
          >
            {formatSize(parseStats?.size || 0)}
          </Badge>

          <Badge variant="outline">Parse: {parseStats?.parseTime?.toFixed(0) || 0}ms</Badge>

          <Badge variant="outline">Mode: {activeRenderMode}</Badge>

          {parseStats?.isChunked && (
            <Badge variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              Chunked
            </Badge>
          )}
        </div>

        {/* Render Mode Controls */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-white">
            <Button
              variant={renderMode === 'auto' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRenderMode('auto')}
              className="rounded-r-none h-8"
              title="Automatically choose the best rendering mode"
            >
              <Zap className="h-3 w-3 mr-1" />
              Auto
            </Button>

            <Button
              variant={renderMode === 'simple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRenderMode('simple')}
              className="rounded-none h-8 border-x"
              title="Simple renderer with full features"
            >
              Simple
            </Button>

            <Button
              variant={renderMode === 'virtual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRenderMode('virtual')}
              className="rounded-l-none h-8"
              title="Virtual scrolling for large datasets"
            >
              Virtual
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Warning */}
      {performanceLevel === 'critical' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Large JSON detected:</strong> Using optimized rendering for best performance.
            Some features may be limited to maintain responsiveness.
          </AlertDescription>
        </Alert>
      )}

      {performanceLevel === 'warning' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Moderately large JSON:</strong> Performance optimizations are active. Switch to
            Virtual mode for better performance if needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Render JSON with optimal strategy */}
      <div className="json-content-container">
        {activeRenderMode === 'virtual' ? (
          <div className="virtual-viewer-wrapper">
            <VirtualJsonViewer 
              data={parsedData} 
              height={height}
              enableSearch={true}
              searchTerm={''}
            />
          </div>
        ) : (
          <div className="simple-viewer-wrapper">
            <SimpleJsonViewer 
              content={typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData, null, 2)} 
            />
          </div>
        )}
      </div>
    </div>
  );
});

SmartJsonViewer.displayName = 'SmartJsonViewer';

'use client';

import { memo, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, Database, Type, Hash, ToggleLeft, X, FileJson } from 'lucide-react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import type { NodeDetails } from './types';
import { detectTypes } from './detectors/type-detector';
import { StringRenderer } from './renderers/StringRenderer';
import { NumberRenderer } from './renderers/NumberRenderer';
import { BooleanRenderer } from './renderers/BooleanRenderer';
import { NullRenderer } from './renderers/NullRenderer';
import { ArrayRenderer } from './renderers/ArrayRenderer';
import { ObjectRenderer } from './renderers/ObjectRenderer';
import { UrlRenderer } from './renderers/UrlRenderer';
import { ColorRenderer } from './renderers/ColorRenderer';
import { DateRenderer } from './renderers/DateRenderer';
import { GeoRenderer } from './renderers/GeoRenderer';
import { MediaRenderer } from './renderers/MediaRenderer';
import { formatJsonPath } from './utils/formatters';

interface NodeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: NodeDetails | null;
}

const TYPE_ICONS = {
  object: Package,
  array: Database,
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  null: X,
};

const TYPE_COLORS = {
  object:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  array:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  string:
    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  number:
    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  boolean:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  null: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const NodeDetailsModalComponent = ({ open, onOpenChange, node }: NodeDetailsModalProps) => {
  // Detect special types for string values
  const detections = useMemo(() => {
    if (!node) return [];
    if (node.type === 'string' && typeof node.value === 'string') {
      return detectTypes(node.value);
    }
    if (node.type === 'object' || node.type === 'array') {
      return detectTypes(node.value);
    }
    return [];
  }, [node]);

  if (!node) return null;

  const TypeIcon = TYPE_ICONS[node.type];
  const typeColorClass = TYPE_COLORS[node.type];

  // Determine which renderer to use
  const renderContent = () => {
    // Check for special detected types first
    if (detections.length > 0) {
      const primaryDetection = detections[0];

      if (primaryDetection.type === 'url' && typeof node.value === 'string') {
        return <UrlRenderer value={node.value} detection={primaryDetection as any} />;
      }

      if (primaryDetection.type === 'color' && typeof node.value === 'string') {
        return <ColorRenderer value={node.value} detection={primaryDetection as any} />;
      }

      if (primaryDetection.type === 'date' && typeof node.value === 'string') {
        return <DateRenderer value={node.value} detection={primaryDetection as any} />;
      }

      if (primaryDetection.type === 'coordinates') {
        return <GeoRenderer value={node.value as any} detection={primaryDetection as any} />;
      }

      if (
        ['image', 'video', 'audio'].includes(primaryDetection.type) &&
        typeof node.value === 'string'
      ) {
        return <MediaRenderer value={node.value} detection={primaryDetection as any} />;
      }
    }

    // Fall back to basic type renderers
    switch (node.type) {
      case 'string':
        return (
          <StringRenderer value={node.value as string} detections={detections} nodeDetails={node} />
        );
      case 'number':
        return (
          <NumberRenderer value={node.value as number} detections={detections} nodeDetails={node} />
        );
      case 'boolean':
        return (
          <BooleanRenderer
            value={node.value as boolean}
            detections={detections}
            nodeDetails={node}
          />
        );
      case 'null':
        return <NullRenderer />;
      case 'array':
        return (
          <ArrayRenderer
            value={node.value as unknown[]}
            detections={detections}
            nodeDetails={node}
          />
        );
      case 'object':
        return (
          <ObjectRenderer
            value={node.value as Record<string, unknown>}
            detections={detections}
            nodeDetails={node}
          />
        );
      default:
        return <div className="text-sm text-muted-foreground">Unknown type</div>;
    }
  };

  const jsonPath = formatJsonPath(node.path);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5" />
            <DialogTitle className="text-lg font-semibold">{node.key || 'Root'}</DialogTitle>
            <Badge variant="outline" className={typeColorClass}>
              {node.type}
            </Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {jsonPath}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0 px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="flex-1 mt-4 overflow-hidden">
            <div className="h-full overflow-y-auto pr-2">
              <ErrorBoundary
                level="widget"
                fallback={
                  <div className="text-sm text-muted-foreground p-4 text-center">
                    Failed to render content
                  </div>
                }
              >
                {renderContent()}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="flex-1 mt-4 overflow-hidden">
            <div className="h-full overflow-y-auto pr-2">
              <div className="flex items-start gap-2">
                <FileJson className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <pre className="flex-1 text-xs font-mono bg-muted p-4 rounded overflow-x-auto">
                  {JSON.stringify(node.value, null, 2)}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export const NodeDetailsModal = memo(NodeDetailsModalComponent);
NodeDetailsModal.displayName = 'NodeDetailsModal';

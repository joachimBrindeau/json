'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import type { ArrayRendererProps } from '../types';
import { detectTypes } from '../detectors/type-detector';
import { UrlRenderer } from './UrlRenderer';
import { ColorRenderer } from './ColorRenderer';
import { DateRenderer } from './DateRenderer';
import { GeoRenderer } from './GeoRenderer';
import { MediaRenderer } from './MediaRenderer';
import { NestedObjectButton } from './NestedObjectButton';

export const ArrayRenderer = memo(({ value }: ArrayRendererProps) => {
  return (
    <div className="space-y-3">
      {value.map((item, index) => {
        const detections = typeof item === 'string' ? detectTypes(item) :
                          (typeof item === 'object' && item !== null && 'lat' in item && 'lng' in item) ? detectTypes(item) : [];

        // Check for special renderers - prioritize media over URL
        const imageDetection = detections.find(d => d.type === 'image');
        const videoDetection = detections.find(d => d.type === 'video');
        const audioDetection = detections.find(d => d.type === 'audio');
        const urlDetection = detections.find(d => d.type === 'url');
        const colorDetection = detections.find(d => d.type === 'color');
        const dateDetection = detections.find(d => d.type === 'date');
        const coordDetection = detections.find(d => d.type === 'coordinates');
        const emailDetection = detections.find(d => d.type === 'email');

        const primaryDetection = imageDetection || videoDetection || audioDetection || colorDetection || dateDetection || coordDetection || urlDetection || emailDetection || detections[0];
        const hasSpecialRenderer = primaryDetection && ['url', 'color', 'date', 'coordinates', 'image', 'video', 'audio'].includes(primaryDetection.type);

        // Get the basic type
        const itemType = Array.isArray(item) ? 'array' : item === null ? 'null' : typeof item;

        return (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-semibold text-foreground">[{index}]</code>
                {primaryDetection ? (
                  <Badge variant="secondary" className="text-xs capitalize">{primaryDetection.type}</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs capitalize">{itemType}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {hasSpecialRenderer ? (
                <>
                  {primaryDetection.type === 'url' && <UrlRenderer value={item as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'color' && <ColorRenderer value={item as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'date' && <DateRenderer value={item as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'coordinates' && <GeoRenderer value={item as Record<string, unknown>} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'image' && <MediaRenderer value={item as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'video' && <MediaRenderer value={item as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'audio' && <MediaRenderer value={item as string} detection={primaryDetection as any} />}
                </>
              ) : (
                <>
                  {primaryDetection?.type === 'email' && typeof item === 'string' ? (
                    <a
                      href={`mailto:${item}`}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {item}
                    </a>
                  ) : typeof item === 'string' ? (
                    <code className="text-sm font-mono break-all text-muted-foreground">{item}</code>
                  ) : typeof item === 'number' || typeof item === 'boolean' ? (
                    <code className="text-sm font-mono text-muted-foreground">{String(item)}</code>
                  ) : item === null ? (
                    <code className="text-sm font-mono text-muted-foreground">null</code>
                  ) : typeof item === 'object' ? (
                    <NestedObjectButton
                      value={item as Record<string, unknown> | unknown[]}
                      label={`[${index}]`}
                      type={Array.isArray(item) ? 'array' : 'object'}
                    />
                  ) : (
                    <code className="text-sm font-mono text-muted-foreground">{JSON.stringify(item, null, 2)}</code>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
ArrayRenderer.displayName = 'ArrayRenderer';


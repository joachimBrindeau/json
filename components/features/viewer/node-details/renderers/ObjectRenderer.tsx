'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import type { ObjectRendererProps } from '../types';
import { detectTypes } from '../detectors/type-detector';
import { UrlRenderer } from './UrlRenderer';
import { ColorRenderer } from './ColorRenderer';
import { DateRenderer } from './DateRenderer';
import { GeoRenderer } from './GeoRenderer';
import { MediaRenderer } from './MediaRenderer';
import { NestedObjectButton } from './NestedObjectButton';

export const ObjectRenderer = memo(({ value }: ObjectRendererProps) => {
  return (
    <div className="space-y-3">
      {Object.entries(value).map(([key, val]) => {
        const detections = typeof val === 'string' ? detectTypes(val) :
                          (typeof val === 'object' && val !== null && 'lat' in val && 'lng' in val) ? detectTypes(val) : [];

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
        const valueType = Array.isArray(val) ? 'array' : val === null ? 'null' : typeof val;

        return (
          <Card key={key}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-semibold text-foreground">{key}</code>
                {primaryDetection ? (
                  <Badge variant="secondary" className="text-xs capitalize">{primaryDetection.type}</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs capitalize">{valueType}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {hasSpecialRenderer ? (
                <>
                  {primaryDetection.type === 'url' && <UrlRenderer value={val as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'color' && <ColorRenderer value={val as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'date' && <DateRenderer value={val as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'coordinates' && <GeoRenderer value={val as Record<string, unknown>} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'image' && <MediaRenderer value={val as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'video' && <MediaRenderer value={val as string} detection={primaryDetection as any} />}
                  {primaryDetection.type === 'audio' && <MediaRenderer value={val as string} detection={primaryDetection as any} />}
                </>
              ) : (
                <>
                  {primaryDetection?.type === 'email' && typeof val === 'string' ? (
                    <a
                      href={`mailto:${val}`}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {val}
                    </a>
                  ) : typeof val === 'string' ? (
                    <code className="text-sm font-mono break-all text-muted-foreground">{val}</code>
                  ) : typeof val === 'number' || typeof val === 'boolean' ? (
                    <code className="text-sm font-mono text-muted-foreground">{String(val)}</code>
                  ) : val === null ? (
                    <code className="text-sm font-mono text-muted-foreground">null</code>
                  ) : typeof val === 'object' ? (
                    <NestedObjectButton
                      value={val as Record<string, unknown> | unknown[]}
                      label={key}
                      type={Array.isArray(val) ? 'array' : 'object'}
                    />
                  ) : (
                    <code className="text-sm font-mono text-muted-foreground">{JSON.stringify(val, null, 2)}</code>
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

ObjectRenderer.displayName = 'ObjectRenderer';


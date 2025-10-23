'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import { detectTypes } from '../detectors/type-detector';
import { UrlRenderer } from './UrlRenderer';
import { ColorRenderer } from './ColorRenderer';
import { DateRenderer } from './DateRenderer';
import { GeoRenderer } from './GeoRenderer';
import { MediaRenderer } from './MediaRenderer';
import { NestedObjectButton } from './NestedObjectButton';

export interface CommonEntryRendererProps {
  label: string;
  value: unknown;
}

export const CommonEntryRenderer = memo(({ label, value }: CommonEntryRendererProps) => {
  const detections =
    typeof value === 'string'
      ? detectTypes(value)
      : typeof value === 'object' &&
          value !== null &&
          'lat' in (value as any) &&
          'lng' in (value as any)
        ? detectTypes(value)
        : [];

  const imageDetection = detections.find((d) => d.type === 'image');
  const videoDetection = detections.find((d) => d.type === 'video');
  const audioDetection = detections.find((d) => d.type === 'audio');
  const urlDetection = detections.find((d) => d.type === 'url');
  const colorDetection = detections.find((d) => d.type === 'color');
  const dateDetection = detections.find((d) => d.type === 'date');
  const coordDetection = detections.find((d) => d.type === 'coordinates');
  const emailDetection = detections.find((d) => d.type === 'email');

  const primaryDetection =
    imageDetection ||
    videoDetection ||
    audioDetection ||
    colorDetection ||
    dateDetection ||
    coordDetection ||
    urlDetection ||
    emailDetection ||
    detections[0];

  const hasSpecialRenderer =
    !!primaryDetection &&
    ['url', 'color', 'date', 'coordinates', 'image', 'video', 'audio'].includes(
      primaryDetection.type
    );

  const basicType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-semibold text-foreground">{label}</code>
          {primaryDetection ? (
            <Badge variant="secondary" className="text-xs capitalize">
              {primaryDetection.type}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs capitalize">
              {basicType}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasSpecialRenderer ? (
          <>
            {primaryDetection?.type === 'url' && (
              <UrlRenderer value={value as string} detection={primaryDetection as any} />
            )}
            {primaryDetection?.type === 'color' && (
              <ColorRenderer value={value as string} detection={primaryDetection as any} />
            )}
            {primaryDetection?.type === 'date' && (
              <DateRenderer value={value as string} detection={primaryDetection as any} />
            )}
            {primaryDetection?.type === 'coordinates' && (
              <GeoRenderer
                value={value as Record<string, unknown>}
                detection={primaryDetection as any}
              />
            )}
            {primaryDetection?.type === 'image' && (
              <MediaRenderer value={value as string} detection={primaryDetection as any} />
            )}
            {primaryDetection?.type === 'video' && (
              <MediaRenderer value={value as string} detection={primaryDetection as any} />
            )}
            {primaryDetection?.type === 'audio' && (
              <MediaRenderer value={value as string} detection={primaryDetection as any} />
            )}
          </>
        ) : (
          <>
            {emailDetection?.type === 'email' && typeof value === 'string' ? (
              <a
                href={`mailto:${value}`}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Mail className="h-3 w-3 flex-shrink-0" />
                {value}
              </a>
            ) : typeof value === 'string' ? (
              <code className="text-sm font-mono break-all text-muted-foreground">{value}</code>
            ) : typeof value === 'number' || typeof value === 'boolean' ? (
              <code className="text-sm font-mono text-muted-foreground">{String(value)}</code>
            ) : value === null ? (
              <code className="text-sm font-mono text-muted-foreground">null</code>
            ) : typeof value === 'object' ? (
              <NestedObjectButton
                value={value as Record<string, unknown> | unknown[]}
                label={label}
                type={Array.isArray(value) ? 'array' : 'object'}
              />
            ) : (
              <code className="text-sm font-mono text-muted-foreground">
                {JSON.stringify(value, null, 2)}
              </code>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

CommonEntryRenderer.displayName = 'CommonEntryRenderer';

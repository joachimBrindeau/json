'use client';

import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { CoordinatesDetection } from '../types';
import { formatCoordinates, formatDMS } from '../utils/formatters';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface GeoRendererProps {
  value: string | Record<string, unknown>;
  detection: CoordinatesDetection;
}

export const GeoRenderer = memo(({ value, detection }: GeoRendererProps) => {
  const [isClient, setIsClient] = useState(false);
  const { lat, lng, format } = detection.metadata;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;

  return (
    <div className="space-y-4">
      {/* Coordinates Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-lg font-bold">
                {formatCoordinates(lat, lng)}
              </div>
              <div className="text-sm text-muted-foreground">
                Geographic Coordinates
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      {isClient && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Map View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <MapContainer
                center={[lat, lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{formatCoordinates(lat, lng)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coordinate Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Coordinate Formats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-xs text-muted-foreground">Decimal Degrees</span>
              <code className="text-xs font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</code>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-xs text-muted-foreground">Latitude (DMS)</span>
              <code className="text-xs font-mono">{formatDMS(lat, true)}</code>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-xs text-muted-foreground">Longitude (DMS)</span>
              <code className="text-xs font-mono">{formatDMS(lng, false)}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Open in Map Service</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
            className="justify-start"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Google Maps
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(openStreetMapUrl, '_blank', 'noopener,noreferrer')}
            className="justify-start"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in OpenStreetMap
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});

GeoRenderer.displayName = 'GeoRenderer';


'use client';

import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  ExternalLink,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
} from 'lucide-react';
import type { MediaDetection } from '../types';

interface MediaRendererProps {
  value: string;
  detection: MediaDetection;
}

export const MediaRenderer = memo(({ value, detection }: MediaRendererProps) => {
  const { type, metadata } = detection;
  const { url, base64, extension } = metadata;

  const mediaUrl = url || base64 || value;
  const isBase64 = value.startsWith('data:');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = `media.${extension || type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(mediaUrl, '_blank', 'noopener,noreferrer');
  };

  if (type === 'image') {
    return (
      <ImageRenderer
        url={mediaUrl}
        isBase64={isBase64}
        onDownload={handleDownload}
        onOpen={handleOpenInNewTab}
      />
    );
  }

  if (type === 'video') {
    return <VideoRenderer url={mediaUrl} isBase64={isBase64} onDownload={handleDownload} />;
  }

  if (type === 'audio') {
    return <AudioRenderer url={mediaUrl} isBase64={isBase64} onDownload={handleDownload} />;
  }

  return null;
});

MediaRenderer.displayName = 'MediaRenderer';

// Image Renderer
const ImageRenderer = memo(
  ({
    url,
    isBase64,
    onDownload,
    onOpen,
  }: {
    url: string;
    isBase64: boolean;
    onDownload: () => void;
    onOpen: () => void;
  }) => {
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const [error, setError] = useState(false);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!error ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <img
                    src={url}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                    onLoad={handleImageLoad}
                    onError={() => setError(true)}
                  />
                </div>

                {dimensions && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {dimensions.width} × {dimensions.height}
                    </Badge>
                    <Badge variant="outline">{isBase64 ? 'Base64' : 'URL'}</Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Failed to load image</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={onDownload} className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
            {!isBase64 && (
              <Button variant="outline" size="sm" onClick={onOpen} className="justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

ImageRenderer.displayName = 'ImageRenderer';

// Video Renderer
const VideoRenderer = memo(
  ({ url, isBase64, onDownload }: { url: string; isBase64: boolean; onDownload: () => void }) => {
    const [error, setError] = useState(false);

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <VideoIcon className="h-4 w-4" />
              Video Player
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!error ? (
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <video
                  src={url}
                  controls
                  className="w-full h-auto max-h-96"
                  onError={() => setError(true)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Failed to load video</div>
            )}

            <div className="mt-3">
              <Badge variant="outline">{isBase64 ? 'Base64' : 'URL'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="justify-start w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Video
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
);

VideoRenderer.displayName = 'VideoRenderer';

// Audio Renderer
const AudioRenderer = memo(
  ({ url, isBase64, onDownload }: { url: string; isBase64: boolean; onDownload: () => void }) => {
    const [error, setError] = useState(false);

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Music className="h-4 w-4" />
              Audio Player
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!error ? (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                  <audio src={url} controls className="w-full" onError={() => setError(true)}>
                    Your browser does not support the audio tag.
                  </audio>
                </div>

                <Badge variant="outline">{isBase64 ? 'Base64' : 'URL'}</Badge>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Failed to load audio</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="justify-start w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Audio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
);

AudioRenderer.displayName = 'AudioRenderer';

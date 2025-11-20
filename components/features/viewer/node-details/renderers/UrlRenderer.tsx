'use client';

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check, Globe, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UrlDetection } from '../types';

interface UrlRendererProps {
  value: string;
  detection: UrlDetection;
}

export const UrlRenderer = memo(({ value, detection }: UrlRendererProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { domain, path, isSecure } = detection.metadata;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: 'URL copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUrl = () => {
    window.open(value, '_blank', 'noopener,noreferrer');
  };

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  return (
    <div className="space-y-2">
      {/* URL Preview */}
      <div className="flex items-center gap-3">
        <img
          src={faviconUrl}
          alt={`Website favicon for ${domain}`}
          className="w-6 h-6 rounded flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="%23ddd"/></svg>';
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-semibold truncate">{domain}</span>
            {isSecure && <Lock className="h-3 w-3 text-green-500" />}
          </div>
          {path && path !== '/' && (
            <div className="text-xs text-muted-foreground truncate">{path}</div>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleOpenUrl}>
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Full URL */}
      <div className="text-xs">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {value}
        </a>
      </div>
    </div>
  );
});

UrlRenderer.displayName = 'UrlRenderer';

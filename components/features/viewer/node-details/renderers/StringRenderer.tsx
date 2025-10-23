'use client';

import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StringRendererProps } from '../types';
import { formatCharCount, formatWordCount, formatLineCount } from '../utils/formatters';
import { hashSHA256 } from '../utils/converters';

export const StringRenderer = memo(({ value, detections }: StringRendererProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateHash = async () => {
    setIsHashing(true);
    try {
      const hashValue = await hashSHA256(value);
      setHash(hashValue);
    } catch (error) {
      toast({ title: 'Failed to generate hash', variant: 'destructive' });
    } finally {
      setIsHashing(false);
    }
  };

  const charCount = value.length;
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = value.split('\n').length;

  return (
    <div className="space-y-4">
      {/* Main value display */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <code className="flex-1 text-sm bg-muted p-3 rounded break-all font-mono max-h-64 overflow-y-auto">
              &quot;{value}&quot;
            </code>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="flex-shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Characters</div>
              <Badge variant="outline">{charCount.toLocaleString()}</Badge>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Words</div>
              <Badge variant="outline">{wordCount.toLocaleString()}</Badge>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Lines</div>
              <Badge variant="outline">{lineCount.toLocaleString()}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hash generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Hash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hash ? (
            <Button variant="outline" size="sm" onClick={handleGenerateHash} disabled={isHashing}>
              {isHashing ? 'Generating...' : 'Generate SHA-256 Hash'}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted p-2 rounded break-all font-mono">
                {hash}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(hash);
                  toast({ title: 'Hash copied to clipboard' });
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detected types */}
      {detections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detected Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {detections.map((detection, index) => (
                <Badge key={index} variant="secondary">
                  {detection.type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

StringRenderer.displayName = 'StringRenderer';

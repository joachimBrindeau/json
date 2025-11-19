'use client';

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ColorDetection } from '../types';
import { hexToRgb, rgbToHsl, rgbToHex, formatRgb, formatHsl } from '../utils/formatters';

interface ColorRendererProps {
  value: string;
  detection: ColorDetection;
}

export const ColorRenderer = memo(({ value, detection }: ColorRendererProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const { hex: detectedHex, rgb: detectedRgb, hsl: detectedHsl, alpha } = detection.metadata;

  // Convert to all formats
  let hex = detectedHex;
  let rgb = detectedRgb;
  let hsl = detectedHsl;

  if (!hex && rgb) {
    hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  }
  if (!rgb && hex) {
    rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
  }
  if (!hsl && rgb) {
    hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-2">
      {/* Color Swatch */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
          style={{ backgroundColor: hex || value }}
        />
        <div className="flex-1 min-w-0">
          <code className="text-sm font-mono block truncate">{value}</code>
        </div>
        <Button variant="ghost" size="sm" onClick={() => handleCopy(value)}>
          {copied === value ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>

      {/* Compact Formats */}
      <div className="space-y-1 text-xs">
        {hex && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">HEX</span>
            <code className="font-mono">{hex}</code>
          </div>
        )}
        {rgb && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">RGB</span>
            <code className="font-mono">{formatRgb(rgb.r, rgb.g, rgb.b, alpha)}</code>
          </div>
        )}
        {hsl && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">HSL</span>
            <code className="font-mono">{formatHsl(hsl.h, hsl.s, hsl.l, alpha)}</code>
          </div>
        )}
      </div>
    </div>
  );
});

ColorRenderer.displayName = 'ColorRenderer';


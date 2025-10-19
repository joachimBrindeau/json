'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash } from 'lucide-react';
import type { NumberRendererProps } from '../types';
import { formatBinary, formatHex, formatOctal, formatScientific, formatCompactNumber } from '../utils/formatters';

export const NumberRenderer = memo(({ value }: NumberRendererProps) => {
  const isInteger = Number.isInteger(value);
  const isNegative = value < 0;
  const absValue = Math.abs(value);

  return (
    <div className="space-y-4">
      {/* Main value display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <code className="text-3xl font-mono font-bold text-purple-600 dark:text-purple-400">
              {value.toLocaleString()}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Number representations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Representations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Decimal</div>
              <code className="text-sm font-mono block">{value}</code>
            </div>
            
            {isInteger && (
              <>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Hexadecimal</div>
                  <code className="text-sm font-mono block">{formatHex(absValue)}</code>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Binary</div>
                  <code className="text-sm font-mono block">{formatBinary(absValue)}</code>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Octal</div>
                  <code className="text-sm font-mono block">{formatOctal(absValue)}</code>
                </div>
              </>
            )}
            
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Scientific</div>
              <code className="text-sm font-mono block">{formatScientific(value)}</code>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Compact</div>
              <code className="text-sm font-mono block">{formatCompactNumber(value)}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{isInteger ? 'Integer' : 'Float'}</Badge>
            {isNegative && <Badge variant="outline">Negative</Badge>}
            {value === 0 && <Badge variant="outline">Zero</Badge>}
            {value > 0 && <Badge variant="outline">Positive</Badge>}
            {isInteger && value > 1 && isPrime(value) && (
              <Badge variant="secondary">Prime</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

NumberRenderer.displayName = 'NumberRenderer';

// Helper function to check if a number is prime
function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  
  return true;
}


import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

/**
 * Server-side render tests to validate markup/attributes without requiring jsdom
 */
describe('Button accessibility (icon-only)', () => {
  it('sets aria-label from tooltip/title when iconOnly', () => {
    const html = renderToString(
      <Button variant="outline" size="icon" icon={Copy} iconOnly tooltip="Copy JSON" />
    );
    expect(html).toContain('aria-label="Copy JSON"');
  });

  it('falls back to children text as tooltip → aria-label', () => {
    const html = renderToString(
      <Button variant="outline" size="icon" icon={Copy} iconOnly>
        Copy
      </Button>
    );
    expect(html).toContain('aria-label="Copy"');
  });
});

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Ensure React is available globally for components compiled with classic JSX runtime
// (avoids "React is not defined" when components don't import React explicitly)
(globalThis as any).React = React;

describe('SearchBar accessibility', async () => {
  it('applies aria-label to the input derived from placeholder', async () => {
    const { SearchBar } = await import('@/components/shared/search-bar');
    const html = renderToString(
      <SearchBar placeholder="Search JSON" value="" onChange={() => {}} />
    );
    expect(html).toContain('aria-label="Search JSON"');
  });
});

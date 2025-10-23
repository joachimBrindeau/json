import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Ensure React is available globally for components compiled with classic JSX runtime
(globalThis as any).React = React;

// Mock Radix Dialog wrappers to render children without portals in SSR
vi.mock('@/components/ui/dialog', () => {
  return {
    Dialog: ({ children }: any) => <div data-mock="dialog">{children}</div>,
    DialogContent: ({ children, className }: any) => (
      <div data-mock="dialog-content" className={className}>
        {children}
      </div>
    ),
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogTrigger: ({ children }: any) => <>{children}</>,
    DialogPortal: ({ children }: any) => <>{children}</>,
    DialogOverlay: ({ children }: any) => <>{children}</>,
    DialogClose: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  };
});

// Minimal props for rendering without side effects on server
const baseProps = {
  open: true,
  onOpenChange: () => {},
  shareId: 'abc123',
  currentTitle: 'Sample',
  currentVisibility: 'private' as const,
};

describe('ShareModal accessibility', () => {
  it('renders Switch with aria-label for visibility toggle', async () => {
    const { ShareModal } = await import('@/components/features/modals/share-modal');
    const html = renderToString(<ShareModal {...baseProps} />);
    expect(html).toContain('aria-label="Toggle public/private visibility"');
  });

  it('renders copy button with accessible name', async () => {
    const { ShareModal } = await import('@/components/features/modals/share-modal');
    const html = renderToString(<ShareModal {...baseProps} />);
    // Button maps title/tooltip to aria-label for icon buttons
    expect(html).toContain('aria-label="Copy share link"');
  });
});

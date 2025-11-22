'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { HeaderNav } from './HeaderNav';
import { Sidebar } from './sidebar';
import { ReviewsSnippet } from '@/components/shared/seo/ReviewsSnippet';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { usePathname } from 'next/navigation';
import { PageTransition } from '@/components/animations';
import { useBackendStore } from '@/lib/store/backend';
import { toastPatterns } from '@/lib/utils/toast-helpers';

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutComponent({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Global hidden upload handler to support mobile projects where sidebar sheet is closed
  const uploadJson = useBackendStore((s) => s.uploadJson);
  const handleGlobalUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const document = await uploadJson(file, undefined, 'private');
        toastPatterns.success.uploaded(document.title);
      } catch (error) {
        toastPatterns.error.upload(error);
      } finally {
        // Reset input so the same file can be selected again in tests
        e.target.value = '';
      }
    },
    [uploadJson]
  );

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar - always visible on large screens */}
      <div className="hidden lg:block">
        <ErrorBoundary fallback={<div className="w-64 border-r bg-muted/30">Sidebar Error</div>}>
          <Sidebar />
        </ErrorBoundary>
      </div>

      {/* Mobile Sidebar - always available on mobile */}
      <div className="lg:hidden">
        <ErrorBoundary fallback={<div>Sidebar Error</div>}>
          <Sidebar isMobile={true} isOpen={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        </ErrorBoundary>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ErrorBoundary fallback={<div className="h-16 border-b bg-muted/30">Navigation Error</div>}>
          <HeaderNav onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        </ErrorBoundary>

        {/* Test helper: global hidden file input to ensure uploads work even when mobile sheet is closed */}
        <input
          id="global-file-upload"
          data-testid="file-input-global"
          type="file"
          accept=".json,.txt"
          className="hidden"
          onChange={handleGlobalUpload}
        />

        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <div className="flex-1 min-h-0">
            <ErrorBoundary>
              <PageTransition>{children}</PageTransition>
            </ErrorBoundary>
          </div>
          {/* Reviews Snippet - Visible on all pages for Google compliance, appears below main content */}
          <ReviewsSnippet />
        </main>
      </div>
    </div>
  );
}

// Export memoized component
export const MainLayout = memo(MainLayoutComponent);

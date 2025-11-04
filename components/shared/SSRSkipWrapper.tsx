'use client';

import { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';

interface SSRSkipWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that skips SSR rendering
 * Useful for pages that rely on client-side only features (like session)
 */
export function SSRSkipWrapper({ children, fallback }: SSRSkipWrapperProps) {
  // Skip rendering during SSR
  if (typeof window === 'undefined') {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          {fallback || 'Loading...'}
        </div>
      </MainLayout>
    );
  }

  return <>{children}</>;
}


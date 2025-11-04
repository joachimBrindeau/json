'use client';

import { FileJson } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

interface DocumentViewerLoadingProps {
  message?: string;
}

/**
 * Shared loading state for document viewer pages
 */
export function DocumentViewerLoading({
  message = 'Loading JSON document...',
}: DocumentViewerLoadingProps) {
  return (
    <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileJson className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </MainLayout>
  );
}

interface DocumentViewerErrorProps {
  title?: string;
  message?: string;
}

/**
 * Shared error state for document viewer pages
 */
export function DocumentViewerError({
  title = 'JSON Not Found',
  message = 'This JSON document is invalid or has been removed.',
}: DocumentViewerErrorProps) {
  return (
    <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileJson className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </MainLayout>
  );
}


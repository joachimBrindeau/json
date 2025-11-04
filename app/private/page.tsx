'use client';

import { DocumentListPage } from '@/components/features/documents/DocumentListPage';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useRequireAuth } from '@/hooks/use-require-auth';
import {
  createPrivateLibraryConfig,
  type PrivateDocument,
} from '@/lib/config/library-config';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function MyLibraryPage() {
  const { isAuthenticated, isLoading } = useRequireAuth({
    redirectTo: '/',
    loginModalSource: 'save',
  });

  // Show loading while checking auth
  if (isLoading) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DocumentListPage<PrivateDocument> config={createPrivateLibraryConfig()} />
  );
}

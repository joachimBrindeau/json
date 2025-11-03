'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Database } from 'lucide-react';
import { DocumentListPage } from '@/components/features/documents/DocumentListPage';
import { BaseDocument } from '@/components/features/documents';
import { useLoginModal } from '@/hooks/use-login-modal';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PrivateDocument extends BaseDocument {
  createdAt: string;
  updatedAt: string;
  visibility: 'private' | 'public';
}

export default function MyLibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openModal } = useLoginModal();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      openModal('save');
      router.push('/');
      return;
    }
  }, [session, status, router, openModal]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  return (
    <DocumentListPage<PrivateDocument>
      config={{
        endpoint: '/api/private',
        icon: <Database className="h-8 w-8 text-primary" />,
        title: 'My Library',
        description: 'Manage your saved JSON documents and templates',
        showTotalCount: true,
        showCategoryFilter: true,
        showVisibilityFilter: true,
        showSortBy: true,
        filterPlaceholder: 'Search your JSON library...',
        showDeleteButton: true,
        dateField: 'updatedAt',
        emptyTitle: 'No saved JSONs found',
        emptyDescription: 'Start building your JSON library by saving documents from the editor',
        emptyActionText: 'Create Your First JSON',
        emptyActionHref: '/edit',
        testId: 'private-library',
      }}
    />
  );
}

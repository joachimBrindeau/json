'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DocumentListPage } from '@/components/features/documents/DocumentListPage';
import { useLoginModal } from '@/hooks/use-login-modal';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  createPrivateLibraryConfig,
  type PrivateDocument,
} from '@/lib/config/library-config';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    <DocumentListPage<PrivateDocument> config={createPrivateLibraryConfig()} />
  );
}

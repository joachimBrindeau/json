'use client';

import { useSession } from 'next-auth/react';
import { DocumentListPage } from '@/components/features/documents/DocumentListPage';
import { MainLayout } from '@/components/layout/main-layout';
import {
  createPublicLibraryConfig,
  type PublicDocument,
} from '@/lib/config/library-config';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PublicLibraryPage() {
  const { data: session } = useSession();

  // Skip rendering during SSR
  if (typeof window === 'undefined') {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">Loading...</div>
      </MainLayout>
    );
  }

  return (
    <DocumentListPage<PublicDocument> config={createPublicLibraryConfig(session)} />
  );
}

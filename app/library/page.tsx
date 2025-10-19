'use client';

import { useSession } from 'next-auth/react';
import { Globe } from 'lucide-react';
import { DocumentListPage } from '@/components/features/documents/DocumentListPage';
import { BaseDocument } from '@/components/features/documents';
import { MainLayout } from '@/components/layout/main-layout';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PublicDocument extends BaseDocument {
  publishedAt: string;
  userId?: string;
}

export default function PublicLibraryPage() {
  const { data: session } = useSession();

  // Skip rendering during SSR
  if (typeof window === 'undefined') {
    return <MainLayout><div className="h-full flex items-center justify-center">Loading...</div></MainLayout>;
  }

  return (
    <DocumentListPage<PublicDocument>
      config={{
        endpoint: '/api/library',
        icon: <Globe className="h-8 w-8 text-primary" />,
        title: 'Public JSON Library',
        description: 'Explore and use community-shared JSON examples and templates',
        showTotalCount: true,
        showAdvancedSearch: true,
        showAuthor: true,
        showBulkSelect: true,
        dateField: 'publishedAt',
        emptyTitle: 'No JSON examples found',
        emptyDescription: 'Try adjusting your search criteria or browse all available JSONs',
        enableBulkDelete: !!session,
        enableBulkExport: true,
        canDelete: (doc) => !!session && (doc.userId === session?.user?.id || doc.author?.id === session?.user?.id),
        showDeleteButton: !!session,
        testId: 'library',
      }}
    />
  );
}

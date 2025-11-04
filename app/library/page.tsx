'use client';

import { useSession } from 'next-auth/react';
import { DocumentListPage } from '@/components/features/documents/DocumentListPage';
import { SSRSkipWrapper } from '@/components/shared/SSRSkipWrapper';
import {
  createPublicLibraryConfig,
  type PublicDocument,
} from '@/lib/config/library-config';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PublicLibraryPage() {
  const { data: session } = useSession();

  return (
    <SSRSkipWrapper>
      <DocumentListPage<PublicDocument> config={createPublicLibraryConfig(session)} />
    </SSRSkipWrapper>
  );
}

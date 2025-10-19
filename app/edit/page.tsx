'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { JsonEditor } from '@/components/features/editor/json-editor';

export default function EditPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <JsonEditor />
      </div>
    </MainLayout>
  );
}

'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { JsonEditor } from '@/components/features/editor/JsonEditor';

export default function EditPage() {
  return (
    <MainLayout>
      <div className="h-full">
        <JsonEditor />
      </div>
    </MainLayout>
  );
}

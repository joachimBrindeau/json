'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { JsonEditor } from '@/components/features/editor/json-editor';

export default function EditPage() {
  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          <div className="h-full rounded-none overflow-hidden">
            <JsonEditor />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

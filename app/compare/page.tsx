'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewerCompare } from '@/components/features/viewer';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { RelatedTools } from '@/components/shared/seo/RelatedTools';
import { useBackendStore } from '@/lib/store/backend';

export default function ComparePage() {
  const currentJson = useBackendStore((s) => s.currentJson);
  const lastActiveTab = useBackendStore((s) => s.lastActiveTab);
  const setLastActiveTab = useBackendStore((s) => s.setLastActiveTab);
  const [activeTab, setActiveTab] = useState(
    lastActiveTab === 'editor' ||
      lastActiveTab === 'flow' ||
      lastActiveTab === 'tree' ||
      lastActiveTab === 'list'
      ? 'input'
      : lastActiveTab || 'input'
  );

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Tab bar matching the editor layout */}
        <div className="border-b bg-background flex-shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={(tab) => {
              setActiveTab(tab);
              setLastActiveTab(tab);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-none" data-testid="view-mode">
              <TabsTrigger value="input" data-testid="input-view">
                Input
              </TabsTrigger>
              <TabsTrigger value="results" data-testid="results-view">
                Results
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary>
            <ViewerCompare
              initialJson1={currentJson}
              activeView={activeTab}
              onViewChange={(tab) => {
                setActiveTab(tab);
                setLastActiveTab(tab);
              }}
            />
          </ErrorBoundary>
        </div>
        {/* Related Tools - Appears below main content area for SEO */}
        <div className="flex-shrink-0">
          <RelatedTools currentTool="compare" />
        </div>
      </div>
    </MainLayout>
  );
}

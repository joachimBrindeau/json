'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { TabsNav } from '@/components/layout/tabs-nav';
import { Viewer } from '@/components/features/viewer';
import { useBackendStore } from '@/lib/store/backend';
import { useSearch } from '@/hooks/use-search';
import { useViewerSettings } from '@/hooks/use-viewer-settings';
import { useState } from 'react';

export default function ViewerPage() {
  const [activeTab, setActiveTab] = useState<'tree' | 'list' | 'flow'>('flow');
  const { searchTerm, setSearchTerm } = useSearch();
  const { currentJson } = useBackendStore();
  const viewerSettings = useViewerSettings();

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <TabsNav
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'tree' | 'list' | 'flow')}
          showEditor={false}
        />
        
        <div className="flex-1 overflow-hidden">
          <Viewer
            content={currentJson}
            maxNodes={viewerSettings.performance.maxNodes}
            virtualizeThreshold={viewerSettings.performance.virtualizeThreshold}
            viewMode={activeTab}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            enableViewModeSwitch={false}
            enableFormatActions={false}
          />
        </div>
      </div>
    </MainLayout>
  );
}
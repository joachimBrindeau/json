'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { TabsNav } from '@/components/layout/tabs-nav';
import { JsonEditor } from '@/components/features/editor/json-editor';
import { Viewer } from '@/components/features/viewer';
import { useBackendStore } from '@/lib/store/backend';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default function CodePage() {
  const { currentJson, lastActiveTab, setLastActiveTab } = useBackendStore();
  const [activeTab, setActiveTab] = useState(lastActiveTab || 'tree');
  const [hasUserModifiedJson, setHasUserModifiedJson] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLastActiveTab(tab);
  };

  useEffect(() => {
    const defaultJson = '{"test": "value", "number": 42}';
    if (currentJson && currentJson.trim() !== defaultJson.trim()) {
      setHasUserModifiedJson(true);
    }
  }, [currentJson]);

  if (activeTab === 'editor') {
    return (
      <MainLayout>
        <div className="h-full flex flex-col">
          <ErrorBoundary fallback={<div className="h-12 border-b bg-muted/30">Tabs Error</div>}>
            <TabsNav value={activeTab} onValueChange={handleTabChange} />
          </ErrorBoundary>
          <div className="flex-1 overflow-hidden">
            <div className="h-full rounded-none overflow-hidden">
              <JsonEditor />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!currentJson) {
    return (
      <MainLayout>
        <div className="h-full flex flex-col">
          <ErrorBoundary fallback={<div className="h-12 border-b bg-muted/30">Tabs Error</div>}>
            <TabsNav value={activeTab} onValueChange={handleTabChange} />
          </ErrorBoundary>
          <div className="flex-1 overflow-hidden">
            <div className="h-full p-6 rounded-none overflow-hidden">
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-medium">No JSON loaded</p>
                  <p className="text-sm">Upload a JSON file or paste content in the editor</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        <ErrorBoundary fallback={<div className="h-12 border-b bg-muted/30">Tabs Error</div>}>
          <TabsNav value={activeTab} onValueChange={handleTabChange} />
        </ErrorBoundary>
        <div className="flex-1 overflow-hidden">
          <div className="h-full rounded-none overflow-hidden">
            <Viewer
              key={activeTab}
              content={currentJson}
              maxNodes={50000}
              virtualizeThreshold={1000}
              viewMode={activeTab as 'tree' | 'flow' | 'list'}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              enableViewModeSwitch={false}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

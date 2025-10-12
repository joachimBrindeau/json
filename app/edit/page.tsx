'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { TabsNav } from '@/components/layout/tabs-nav';
import { JsonEditor } from '@/components/features/editor/json-editor';
import { UltraJsonViewer } from '@/components/features/json-viewer/ultra-optimized-viewer/UltraJsonViewer';
import { useBackendStore } from '@/lib/store/backend';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default function CodePage() {
  const { currentJson, lastActiveTab, setLastActiveTab } = useBackendStore();
  const [activeTab, setActiveTab] = useState(lastActiveTab || 'editor');
  const [hasUserModifiedJson, setHasUserModifiedJson] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Track when user actually modifies JSON (not just default content)
  useEffect(() => {
    const defaultJson = '{"test": "value", "number": 42}';
    if (currentJson && currentJson.trim() !== defaultJson.trim()) {
      setHasUserModifiedJson(true);
    }
  }, [currentJson]);

  // Validate JSON without auto-switching tabs - let user control view mode
  useEffect(() => {
    if (activeTab === 'editor' && hasUserModifiedJson && currentJson && currentJson.trim()) {
      try {
        JSON.parse(currentJson);
        // JSON is valid - user can manually switch tabs if desired
      } catch {
        // Invalid JSON, stay on editor
      }
    }
  }, [currentJson, activeTab, hasUserModifiedJson]);

  const renderContent = () => {
    if (activeTab === 'editor') {
      return (
        <div className="h-full rounded-none overflow-hidden">
          <JsonEditor />
        </div>
      );
    }

    if (activeTab === 'flow' || activeTab === 'tree' || activeTab === 'list') {
      return currentJson ? (
        <div className="h-full rounded-none overflow-hidden">
          <UltraJsonViewer
            content={currentJson}
            maxNodes={50000}
            virtualizeThreshold={1000}
            initialViewMode={activeTab === 'flow' ? 'flow' : activeTab}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      ) : (
        <div className="h-full p-6 rounded-none overflow-hidden">
          <Card className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">No JSON loaded</p>
              <p className="text-sm">Upload a JSON file or paste content in the editor</p>
            </div>
          </Card>
        </div>
      );
    }
  };

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Tabs for editor page only */}
        <ErrorBoundary fallback={<div className="h-12 border-b bg-muted/30">Tabs Error</div>}>
          <TabsNav value={activeTab} onValueChange={(tab) => {
            setActiveTab(tab);
            setLastActiveTab(tab);
          }} />
        </ErrorBoundary>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>
    </MainLayout>
  );
}

'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewerCompare } from '@/components/features/viewer';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useBackendStore } from '@/lib/store/backend';
import { UnifiedButton } from '@/components/ui/unified-button';
import { Input } from '@/components/ui/input';
import { Search, GitCompare, RotateCcw } from 'lucide-react';
import { ViewerActions } from '@/components/features/viewer';

export default function ComparePage() {
  const { currentJson, lastActiveTab, setLastActiveTab } = useBackendStore();
  const [activeTab, setActiveTab] = useState(lastActiveTab === 'editor' || lastActiveTab === 'flow' || lastActiveTab === 'tree' || lastActiveTab === 'list' ? 'input' : lastActiveTab || 'input');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Action buttons header - consistent with editor */}
        <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/50">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Search JSON comparisons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 pl-7 text-sm"
            />
          </div>
          
          {/* Action buttons for compare functionality */}
          <div className="flex items-center gap-1">
            <UnifiedButton
              variant="blue"
              size="xs"
              icon={GitCompare}
              text="Compare"
              onClick={() => {
                setActiveTab('input');
                setLastActiveTab('input');
              }}
              title="Compare JSONs"
            />
            <ViewerActions />
          </div>
        </div>

        {/* Tab bar matching the editor layout */}
        <div className="border-b bg-background">
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
      </div>
    </MainLayout>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { TabsNav } from '@/components/layout/tabs-nav';
import { UltraJsonViewer } from '@/components/features/json-viewer/ultra-optimized-viewer/UltraJsonViewer';
import { FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBackendStore } from '@/lib/store/backend';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export default function LibraryViewerPage() {
  const params = useParams();
  const { toast } = useToast();
  const { currentJson, shareId, loadJson } = useBackendStore();
  const [loading, setLoading] = useState(true);
  const [jsonContent, setJsonContent] = useState('');
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('flow');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadJsonContent = async () => {
      const id = params.id as string;

      if (!id) {
        setLoading(false);
        return;
      }

      // If we already have the content for this ID, use it
      if (shareId === id && currentJson) {
        setJsonContent(currentJson);
        setCreatedAt(new Date());
        setLoading(false);
        return;
      }

      // Otherwise, load from backend
      try {
        const success = await loadJson(id);
        if (success) {
          // Will be updated via the store
          setCreatedAt(new Date());
        } else {
          toast({
            title: 'Error',
            description: 'JSON document not found',
            variant: 'destructive',
          });
        }
      } catch (_error) {
        toast({
          title: 'Error',
          description: 'Failed to load JSON document',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadJsonContent();
  }, [params.id, shareId, currentJson, loadJson, toast]);

  // Update local content when global state changes
  useEffect(() => {
    if (currentJson && shareId === params.id) {
      setJsonContent(currentJson);
    }
  }, [currentJson, shareId, params.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <FileJson className="h-12 w-12 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading JSON document...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!jsonContent) {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <FileJson className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-2">JSON Not Found</h2>
            <p className="text-muted-foreground">This JSON document is invalid or has been removed.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Browser-like Hero Header */}
        <div className="p-6 border-b bg-gradient-to-b from-background to-muted/30">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">JSON Document</h1>
            <p className="text-muted-foreground">
              ID: {params.id} • Created {createdAt?.toLocaleDateString() || 'Recently'}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <ErrorBoundary fallback={<div className="h-12 border-b bg-muted/30">Tabs Error</div>}>
          <TabsNav value={activeTab} onValueChange={setActiveTab} showEditor={false} />
        </ErrorBoundary>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <UltraJsonViewer 
            content={jsonContent} 
            maxNodes={50000} 
            virtualizeThreshold={1000}
            initialViewMode={activeTab as 'tree' | 'list' | 'flow'}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </div>
    </MainLayout>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { TabsNav } from '@/components/layout/TabsNav';
import { Viewer } from '@/components/features/viewer';
import { useToast } from '@/hooks/use-toast';
import { useBackendStore } from '@/lib/store/backend';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import {
  DocumentViewerLoading,
  DocumentViewerError,
} from '@/components/shared/DocumentViewerStates';

export default function LibraryViewerPage() {
  const params = useParams();
  const idParam = (params as Record<string, string | string[]> | null)?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam || '';
  const { toast } = useToast();
  const currentJson = useBackendStore((s) => s.currentJson);
  const shareId = useBackendStore((s) => s.shareId);
  const loadJson = useBackendStore((s) => s.loadJson);
  const [loading, setLoading] = useState(true);
  const [jsonContent, setJsonContent] = useState('');
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('flow');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadJsonContent = async () => {
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
  }, [id, shareId, currentJson, loadJson, toast]);

  // Update local content when global state changes
  useEffect(() => {
    if (currentJson && shareId === id) {
      setJsonContent(currentJson);
    }
  }, [currentJson, shareId, id]);

  if (loading) {
    return <DocumentViewerLoading />;
  }

  if (!jsonContent) {
    return <DocumentViewerError />;
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Browser-like Hero Header */}
        <div className="p-6 border-b bg-gradient-to-b from-background to-muted/30">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">JSON Document</h1>
            <p className="text-muted-foreground">
              ID: {id} • Created {createdAt?.toLocaleDateString() || 'Recently'}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <ErrorBoundary fallback={<div className="h-12 border-b bg-muted/30">Tabs Error</div>}>
          <TabsNav value={activeTab} onValueChange={setActiveTab} showEditor={false} />
        </ErrorBoundary>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <Viewer
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

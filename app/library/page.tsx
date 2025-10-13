'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/main-layout';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AdvancedSearch, SearchFilters } from '@/components/ui/advanced-search';
import { BulkOperations, BulkableItem } from '@/components/ui/bulk-operations';
import {
  Search,
  Eye,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatSize, formatCount, formatDateForFilename } from '@/lib/utils/formatters';
import { DocumentCard, DocumentSkeleton, getCategoryIcon, type BaseDocument } from '@/components/features/documents';

interface PublicDocument extends BaseDocument {
  publishedAt: string;
  userId?: string;
}

export default function PublicLibraryPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Search filters state
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    tags: [],
    sortBy: 'recent',
    dateRange: '',
    complexity: '',
    minSize: '',
    maxSize: ''
  });
  
  // Refs for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(filters.query, 500);

  const fetchDocuments = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        
        const params = new URLSearchParams({
          page: reset ? '1' : page.toString(),
          limit: '12',
          sort: filters.sortBy,
        });

        if (debouncedSearch) params.set('search', debouncedSearch);
        if (filters.category) params.set('category', filters.category);
        if (filters.dateRange) params.set('dateRange', filters.dateRange);
        if (filters.complexity) params.set('complexity', filters.complexity);
        if (filters.minSize) params.set('minSize', filters.minSize);
        if (filters.maxSize) params.set('maxSize', filters.maxSize);

        const data = await apiClient.get<{
          documents: PublicDocument[];
          pagination?: { hasNext: boolean; total: number }
        }>(`/api/library?${params}`);

        if (reset) {
          setDocuments(data.documents || []);
          setPage(1);
        } else {
          setDocuments((prev) => [...prev, ...(data.documents || [])]);
        }

        setHasMore(data.pagination?.hasNext || false);
        setTotalCount(data.pagination?.total || 0);
      } catch (error) {
        logger.error({
          err: error,
          page,
          sortBy: filters.sortBy,
          category: filters.category
        }, 'Failed to fetch library documents');
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, filters.category, filters.sortBy, filters.dateRange, filters.complexity, filters.minSize, filters.maxSize, page]
  );

  // Load initial data
  useEffect(() => {
    fetchDocuments(true);
  }, [debouncedSearch, filters.category, filters.sortBy, filters.dateRange, filters.complexity, filters.minSize, filters.maxSize]);

  // Infinite scroll setup
  useEffect(() => {
    if (loading || isLoadingMore) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoadingMore) {
        setPage((prev) => prev + 1);
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, isLoadingMore]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchDocuments(false);
    }
  }, [page]);



  const handleDeleteJson = useCallback(async (doc: PublicDocument) => {
    if (!session) {
      alert('You must be logged in to delete JSONs');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/json/${doc.id}`);

      // Remove from local state
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setTotalCount((prev) => prev - 1);
      // Remove from selection if it was selected
      setSelectedIds(prev => prev.filter(id => id !== doc.id));
    } catch (error) {
      logger.error({ err: error, docId: doc.id, docTitle: doc.title }, 'Failed to delete JSON from library');
      alert(error instanceof Error ? error.message : 'Failed to delete JSON');
    }
  }, [session]);

  // Bulk operations
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (!session) {
      throw new Error('You must be logged in to delete JSONs');
    }

    // Delete each document individually
    const errors: string[] = [];
    for (const id of ids) {
      try {
        const doc = documents.find(d => d.id === id);
        if (!doc) continue;

        await apiClient.delete(`/api/json/${id}`);
      } catch (error) {
        const doc = documents.find(d => d.id === id);
        logger.error({ err: error, docId: id, docTitle: doc?.title }, 'Failed to bulk delete JSON');
        errors.push(`${doc?.title || id}: ${error instanceof Error ? error.message : 'Failed to delete'}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Some items could not be deleted:\n${errors.join('\n')}`);
    }

    // Remove deleted documents from state
    setDocuments(prev => prev.filter(doc => !ids.includes(doc.id)));
    setTotalCount(prev => prev - ids.length);
  }, [session, documents]);

  const handleBulkExport = useCallback(async (ids: string[]) => {
    const selectedDocs = documents.filter(doc => ids.includes(doc.id));
    const dataStr = JSON.stringify(selectedDocs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exported-jsons-${formatDateForFilename()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [documents]);

  return (
    <MainLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Hero Section */}
        <div className="border-b bg-gradient-to-b from-muted/50 to-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                <Globe className="h-8 w-8 text-primary" />
                Public JSON Library
              </h1>
              <p className="text-muted-foreground">
                Explore and use community-shared JSON examples and templates
              </p>
              {totalCount > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> public JSONs available
                </p>
              )}
              

            </div>

            {/* Advanced Search */}
            <AdvancedSearch
              filters={filters}
              onFiltersChange={setFilters}
              className="max-w-4xl mx-auto"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">


            {/* Bulk Operations */}
            {documents.length > 0 && (
              <BulkOperations
                items={documents as BulkableItem[]}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onBulkDelete={session ? handleBulkDelete : undefined}
                onBulkExport={handleBulkExport}
                className="mb-4"
              />
            )}
            {loading && documents.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <DocumentSkeleton key={i} />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16" data-testid="empty-search-results">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No JSON examples found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try adjusting your search criteria or browse all available JSONs
                </p>
                {(filters.query || filters.category || filters.dateRange || filters.complexity || filters.minSize || filters.maxSize) && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setFilters({
                        query: '',
                        category: '',
                        tags: [],
                        sortBy: filters.sortBy,
                        dateRange: '',
                        complexity: '',
                        minSize: '',
                        maxSize: ''
                      });
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <DocumentCard
                          document={doc}
                          onDelete={session && (doc.userId === session.user?.id || doc.author?.id === session.user?.id) ? handleDeleteJson : undefined}
                          showBulkSelect={true}
                          isSelected={selectedIds.includes(doc.id)}
                          onSelect={(id, checked) => {
                            if (checked) {
                              setSelectedIds(prev => [...prev, doc.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(prevId => prevId !== doc.id));
                            }
                          }}
                          showAuthor={true}
                          showDeleteButton={session && (doc.userId === session.user?.id || doc.author?.id === session.user?.id) ? true : false}
                          dateField="publishedAt"
                          testId="library-card"
                        />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>

                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="py-8 text-center">
                  {isLoadingMore && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      Loading more...
                    </div>
                  )}
                  {!hasMore && documents.length > 0 && (
                    <p className="text-muted-foreground">
                      You&apos;ve reached the end • {documents.length} JSONs loaded
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
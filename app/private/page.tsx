'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Eye,
  Calendar,
  Clock,
  Filter,
  SortAsc,
  Database,
  Lock,
  Globe,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoginModal } from '@/hooks/use-login-modal';
import { DocumentCard, DocumentSkeleton, getCategoryIcon, type BaseDocument } from '@/components/features/documents';

interface PrivateDocument extends BaseDocument {
  createdAt: string;
  updatedAt: string;
  visibility: 'private' | 'public';
}

export default function MyLibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openModal } = useLoginModal();
  const [documents, setDocuments] = useState<PrivateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  
  // Refs for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      openModal('saved');
      router.push('/');
      return;
    }
  }, [session, status, router, openModal]);

  const fetchDocuments = useCallback(
    async (reset = false) => {
      if (!session) return;
      
      try {
        if (reset) {
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        
        const params = new URLSearchParams({
          page: reset ? '1' : page.toString(),
          limit: '12',
          sort: sortBy,
        });

        if (debouncedSearch) params.set('search', debouncedSearch);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedVisibility) params.set('visibility', selectedVisibility);

        const data = await apiClient.get<{
          documents: PrivateDocument[];
          pagination?: { hasNext: boolean; total: number }
        }>(`/api/private?${params}`);

        if (reset) {
          setDocuments(data.documents || []);
          setPage(1);
        } else {
          setDocuments((prev) => [...prev, ...(data.documents || [])]);
        }

        setHasMore(data.pagination?.hasNext || false);
        setTotalCount(data.pagination?.total || 0);
      } catch (error) {
        logger.error({ err: error, page, sortBy, category: selectedCategory }, 'Failed to fetch private documents');
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [session, debouncedSearch, selectedCategory, selectedVisibility, sortBy, page]
  );

  // Load initial data
  useEffect(() => {
    if (session) {
      fetchDocuments(true);
    }
  }, [session, debouncedSearch, selectedCategory, selectedVisibility, sortBy]);

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
    if (page > 1 && session) {
      fetchDocuments(false);
    }
  }, [page, session]);

  const handleDeleteJson = useCallback(async (doc: PrivateDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/json/${doc.id}`);

      // Remove from local state
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setTotalCount((prev) => prev - 1);
    } catch (error) {
      logger.error({ err: error, docId: doc.id, docTitle: doc.title }, 'Failed to delete JSON');
      alert(error instanceof Error ? error.message : 'Failed to delete JSON');
    }
  }, []);

  // Don't render if not authenticated
  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col bg-background">
        {/* Hero Section */}
        <div className="border-b bg-gradient-to-b from-muted/50 to-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                <Database className="h-8 w-8 text-primary" />
                My Library
              </h1>
              <p className="text-muted-foreground">
                Manage your saved JSON documents and templates
              </p>
              {totalCount > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> saved JSONs
                </p>
              )}
              

            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your JSON library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                  data-testid="private-library-search"
                />
              </div>

              <Select
                value={selectedCategory || 'all'}
                onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)}
                data-testid="category-filter"
              >
                <SelectTrigger className="w-full sm:w-[180px] h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="API Response">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon('API Response')}
                      API Response
                    </div>
                  </SelectItem>
                  <SelectItem value="Configuration">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon('Configuration')}
                      Configuration
                    </div>
                  </SelectItem>
                  <SelectItem value="Database Schema">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon('Database Schema')}
                      Database Schema
                    </div>
                  </SelectItem>
                  <SelectItem value="Test Data">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon('Test Data')}
                      Test Data
                    </div>
                  </SelectItem>
                  <SelectItem value="Template">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon('Template')}
                      Template
                    </div>
                  </SelectItem>
                  <SelectItem value="Example">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon('Example')}
                      Example
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={selectedVisibility || 'all'}
                onValueChange={(value) => setSelectedVisibility(value === 'all' ? '' : value)}
                data-testid="visibility-filter"
              >
                <SelectTrigger className="w-full sm:w-[140px] h-10">
                  <Eye className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy} data-testid="search-sort">
                <SelectTrigger className="w-full sm:w-[140px] h-10">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent
                    </div>
                  </SelectItem>
                  <SelectItem value="updated">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Updated
                    </div>
                  </SelectItem>
                  <SelectItem value="views">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Most Viewed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">

            {loading && documents.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <DocumentSkeleton key={i} />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16" data-testid="empty-private-library">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No saved JSONs found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  {(searchQuery || selectedCategory || selectedVisibility) 
                    ? 'Try adjusting your search criteria or browse all your JSONs'
                    : 'Start building your JSON library by saving documents from the editor'
                  }
                </p>
                {(searchQuery || selectedCategory || selectedVisibility) && (
                  <Button
                    variant="outline"
                    className="mb-4"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('');
                      setSelectedVisibility('');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
                <Link href="/edit">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First JSON
                  </Button>
                </Link>
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
                          onDelete={handleDeleteJson}
                          showDeleteButton={true}
                          dateField="updatedAt"
                          testId="private-library-card"
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
                      You've reached the end • {documents.length} JSONs loaded
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
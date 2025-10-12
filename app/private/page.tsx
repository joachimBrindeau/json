'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';

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
  User, 
  Calendar, 
  FileJson, 
  TrendingUp,
  Clock,
  Hash,
  Filter,
  SortAsc,
  Code2,
  Sparkles,
  ChevronRight,
  BookOpen,
  Zap,
  Database,
  Lock,
  Globe,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLoginModal } from '@/hooks/use-login-modal';

interface PrivateDocument {
  id: string;
  shareId: string;
  title: string;
  description?: string;
  richContent?: string;
  slug?: string;
  tags: string[];
  category?: string;
  viewCount: number;
  nodeCount: number;
  complexity: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  visibility: 'private' | 'public';
  author?: {
    name: string;
    image?: string;
  };
  preview?: string;
  content?: unknown;
}

// Category icons mapping
const getCategoryIcon = (category: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    'API Response': <Globe className="h-4 w-4" />,
    'Configuration': <Zap className="h-4 w-4" />,
    'Database Schema': <Database className="h-4 w-4" />,
    'Test Data': <Code2 className="h-4 w-4" />,
    'Template': <FileJson className="h-4 w-4" />,
    'Example': <BookOpen className="h-4 w-4" />,
  };
  return icons[category] || <FileJson className="h-4 w-4" />;
};

// Complexity colors
const complexityColors: Record<string, string> = {
  simple: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  complex: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  'very complex': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

// Loading skeleton component
function DocumentSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-32 w-full mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </Card>
  );
}

// JSON Preview Component
function JsonPreview({ content }: { content: unknown }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewText = typeof content === 'string' 
    ? content 
    : content ? JSON.stringify(content, null, 2) : '';
  
  const lines = previewText.split('\n');
  const preview = isExpanded ? lines : lines.slice(0, 5);
  
  return (
    <div className="relative group">
      <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 overflow-hidden border border-border/50">
        <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
          <code>{preview.join('\n')}</code>
        </pre>
        {lines.length > 5 && (
          <>
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/50 dark:from-muted/20 to-transparent pointer-events-none" />
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute bottom-2 right-2 text-xs px-2 py-1 bg-background/80 backdrop-blur rounded border border-border hover:bg-background transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </>
        )}
      </div>
    </div>
  );
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

        const response = await fetch(`/api/private?${params}`);
        const data = await response.json();

        if (reset) {
          setDocuments(data.documents || []);
          setPage(1);
        } else {
          setDocuments((prev) => [...prev, ...(data.documents || [])]);
        }

        setHasMore(data.pagination?.hasNext || false);
        setTotalCount(data.pagination?.total || 0);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
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

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return d.toLocaleDateString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatViewCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}M`;
  };



  const handleDeleteJson = useCallback(async (doc: PrivateDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/json/${doc.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete JSON');
      }

      // Remove from local state
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setTotalCount((prev) => prev - 1);
    } catch (error) {
      console.error('Failed to delete JSON:', error);
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
                        <Card 
                          className="h-full flex flex-col hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
                          data-testid="private-library-card"
                        >
                          <div className="p-6 flex-1 flex flex-col">
                            {/* Header */}
                            <div className="mb-4">
                              <div className="flex items-start justify-between mb-2">
                                <Link
                                  href={`/library/${doc.slug || doc.shareId || doc.id}`}
                                  className="flex-1 group/link"
                                  data-testid="card-title"
                                >
                                  <h3 className="font-semibold text-lg group-hover/link:text-primary transition-colors flex items-center gap-2">
                                    {doc.title}
                                    <ChevronRight className="h-4 w-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteJson(doc);
                                    }}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete JSON"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Badge 
                                    variant={doc.visibility === 'public' ? 'default' : 'secondary'} 
                                    className="ml-2 flex items-center gap-1"
                                  >
                                    {doc.visibility === 'public' ? 
                                      <Globe className="h-3 w-3" /> : 
                                      <Lock className="h-3 w-3" />
                                    }
                                    {doc.visibility}
                                  </Badge>
                                  {doc.category && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      {getCategoryIcon(doc.category)}
                                      {doc.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2" data-testid="card-description">
                                  {doc.description}
                                </p>
                              )}
                              {doc.richContent && (
                                <div className="mt-2 text-xs text-muted-foreground border-l-2 border-blue-200 pl-3">
                                  <div 
                                    className="prose prose-xs max-w-none line-clamp-3"
                                    dangerouslySetInnerHTML={{ __html: doc.richContent }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Preview */}
                            {(doc.preview || doc.content) && (
                              <div className="mb-4 flex-1">
                                <JsonPreview content={doc.preview || doc.content || ''} />
                              </div>
                            )}

                            {/* Tags */}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4" data-testid="card-tags">
                                {doc.tags.slice(0, 3).map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    variant="outline" 
                                    className="text-xs hover:bg-muted cursor-pointer transition-colors"
                                  >
                                    <Hash className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {doc.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{doc.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1" data-testid="json-date">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(doc.updatedAt)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{formatViewCount(doc.viewCount)}</span>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", complexityColors[doc.complexity.toLowerCase()] || '')}
                                >
                                  {doc.complexity}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
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
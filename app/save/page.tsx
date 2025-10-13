'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Database,
  Plus,
  FileJson,
  Search,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Calendar,
  Download,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Globe,
  Lock,
  Edit,
} from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { useAppStore } from '@/lib/store';
import { MainLayout } from '@/components/layout/main-layout';
import { useSession } from 'next-auth/react';
import { useBackendStore } from '@/lib/store/backend';
import { PublishModal } from '@/components/features/modals/publish-modal';
import { formatDate, formatSize } from '@/lib/utils/formatters';

interface LibraryDocument {
  id: string;
  shareId: string;
  title: string;
  description?: string;
  richContent?: string;
  size: number;
  nodeCount: number;
  maxDepth: number;
  complexity: string;
  visibility: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type SortField = 'title' | 'createdAt' | 'size' | 'id';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  minSize?: number;
  maxSize?: number;
  startDate?: Date;
  endDate?: Date;
}

const ITEMS_PER_PAGE = 10;

// Memoized table row component for performance
const DocumentRow = memo(function DocumentRow({
  document,
  onDelete,
  onLoad,
  onPublished,
}: {
  document: LibraryDocument;
  onDelete: (id: string) => void;
  onLoad: (id: string) => void;
  onPublished?: () => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const confirmDelete = useCallback(() => {
    onDelete(document.id);
  }, [document.id, onDelete]);

  const handleLoad = useCallback(() => {
    onLoad(document.shareId);
  }, [document.shareId, onLoad]);

  const shareUrl = useMemo(() => {
    return typeof window !== 'undefined' ? `${window.location.origin}/library/${document.shareId}` : '';
  }, [document.shareId]);

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      logger.error({ err: error, shareUrl }, 'Failed to copy URL');
    }
  }, [shareUrl]);

  return (
    <TableRow data-testid="json-item">
      <TableCell className="font-medium">
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
          onClick={handleLoad}
        >
          {document.visibility === 'public' ? (
            <Globe className="h-4 w-4 text-green-500" title="Published to public library" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" title="Private" />
          )}
          <span className="truncate max-w-48" data-testid="json-title">
            {document.title}
          </span>
          {document.visibility === 'public' && (
            <Badge variant="secondary" className="text-xs">
              Public
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid="json-date">
          <Calendar className="h-3 w-3" />
          {formatDate(document.createdAt)}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" data-testid="json-size">{formatSize(document.size)}</Badge>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-2 py-1 rounded">{document.shareId.substring(0, 12)}...</code>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleLoad} data-testid="view-json">
              <Download className="h-4 w-4 mr-2" />
              Load in Editor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(shareUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Viewer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyUrl}>
              <FileJson className="h-4 w-4 mr-2" />
              Copy Share URL
            </DropdownMenuItem>
            {document.visibility === 'public' && (
              <>
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Public Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await apiClient.delete(`/api/json/${document.shareId}/publish`);
                      onPublished?.();
                    } catch (error) {
                      logger.error({ err: error, shareId: document.shareId }, 'Failed to unpublish document');
                    }
                  }}
                  className="text-orange-600"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Make Private
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive" data-testid="delete-json">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete JSON"
        description={`Are you sure you want to delete "${document.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      <PublishModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        shareId={document.shareId}
        currentTitle={document.title}
        onPublished={() => {
          setShowEditModal(false);
          onPublished?.();
        }}
      />
    </TableRow>
  );
});

// Table header with sorting
const SortableTableHead = memo(function SortableTableHead({
  field,
  label,
  sortField,
  sortOrder,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}) {
  const isSorted = sortField === field;

  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isSorted ? (
          sortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );
});

function LibraryPageComponent() {
  const { data: session } = useSession();
  const { setLibraryUpdateCallback } = useBackendStore();
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<FilterState>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { loadFromShareId } = useAppStore();

  // Load documents from API
  const loadDocuments = useCallback(async () => {
    if (!session) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sort: sortField === 'createdAt' && sortOrder === 'desc' ? 'recent' :
              sortField === 'createdAt' && sortOrder === 'asc' ? 'recent' :
              sortField === 'title' ? 'title' :
              sortField === 'size' ? 'size' : 'recent',
      });

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      interface SavedResponse {
        documents?: LibraryDocument[];
        pagination?: {
          totalPages: number;
          total: number;
        };
      }

      const data = await apiClient.get<SavedResponse>(`/api/saved?${params}`);
      setDocuments(data.documents || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      logger.error({ err, currentPage, sortField, sortOrder }, 'Failed to load documents');
      setError('Failed to load your library');
    } finally {
      setLoading(false);
    }
  }, [session, currentPage, sortField, sortOrder, searchQuery]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Register for library updates
  useEffect(() => {
    setLibraryUpdateCallback(loadDocuments);
    return () => {
      setLibraryUpdateCallback(() => {});
    };
  }, [loadDocuments, setLibraryUpdateCallback]);

  // Delete document handler
  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/api/json/${id}`);
      // Refresh the library
      loadDocuments();
    } catch (err) {
      logger.error({ err, documentId: id }, 'Failed to delete document');
      setError('Failed to delete document');
    }
  }, [loadDocuments]);

  // Load document into editor
  const handleLoad = useCallback(
    async (shareId: string) => {
      try {
        const success = await loadFromShareId(shareId);
        if (success) {
          window.location.href = '/';
        }
      } catch (err) {
        logger.error({ err, shareId }, 'Failed to load document');
        setError('Failed to load document');
      }
    },
    [loadFromShareId]
  );

  // Client-side filtering (API handles search and pagination)
  const processedDocuments = useMemo(() => {
    let result = [...documents];

    // Apply client-side size filters if needed
    if (filters.minSize !== undefined) {
      result = result.filter((doc) => doc.size >= filters.minSize!);
    }
    if (filters.maxSize !== undefined) {
      result = result.filter((doc) => doc.size <= filters.maxSize!);
    }

    // Apply date filters
    if (filters.startDate) {
      result = result.filter((doc) => new Date(doc.createdAt) >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter((doc) => new Date(doc.createdAt) <= filters.endDate!);
    }

    return result;
  }, [documents, filters]);

  // Pagination
  const computedTotalPages = Math.ceil(processedDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return processedDocuments.slice(start, end);
  }, [processedDocuments, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortField, sortOrder]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    },
    [sortField]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.minSize !== undefined) count++;
    if (filters.maxSize !== undefined) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading your shared JSONs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <div className="text-2xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium mb-2 text-destructive">Error Loading Library</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDocuments} className="gap-2">
              <Database className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (documents.length === 0 && !loading && !error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8" data-testid="empty-state">
          <div className="text-center">
            <FileJson className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Shared JSONs Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create and share your first JSON to see it appear in your library.
            </p>
            <Link href="/">
              <Button className="gap-2" data-testid="create-new">
                <Plus className="h-4 w-4" />
                Create New JSON
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="library-container">
      {/* Header with search and filters */}
      <div className="p-6 pb-4 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title or ID..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
              data-testid="library-search"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split('-') as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              <SelectItem value="size-desc">Largest First</SelectItem>
              <SelectItem value="size-asc">Smallest First</SelectItem>
              <SelectItem value="id-asc">ID (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Advanced Filters
              </h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs"
                >
                  Clear All
                  <X className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Min Size (KB)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minSize ? filters.minSize / 1024 : ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      minSize: e.target.value ? parseFloat(e.target.value) * 1024 : undefined,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Max Size (KB)</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.maxSize ? filters.maxSize / 1024 : ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      maxSize: e.target.value ? parseFloat(e.target.value) * 1024 : undefined,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">From Date</label>
                <Input
                  type="date"
                  value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value ? new Date(e.target.value) : undefined,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">To Date</label>
                <Input
                  type="date"
                  value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value ? new Date(e.target.value) : undefined,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedDocuments.length} of {processedDocuments.length} results
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6">
        {processedDocuments.length === 0 ? (
          <div className="flex items-center justify-center h-full" data-testid="empty-search-results">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found</p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-4">
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <Table data-testid="json-items-list">
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    field="title"
                    label="Title"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    field="createdAt"
                    label="Created"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    field="size"
                    label="Size"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    field="id"
                    label="Share ID"
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    onDelete={handleDelete}
                    onLoad={handleLoad}
                    onPublished={loadDocuments}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {computedTotalPages > 1 && (
        <div className="p-6 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {computedTotalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                  }
                  if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 4 + i;
                  }
                }

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(computedTotalPages, prev + 1))}
                disabled={currentPage === computedTotalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with error boundary and memo
const MemoizedLibraryPage = memo(LibraryPageComponent);
MemoizedLibraryPage.displayName = 'LibraryPage';

export default function LibraryPage() {
  return (
    <MainLayout>
      <ErrorBoundary>
        <MemoizedLibraryPage />
      </ErrorBoundary>
    </MainLayout>
  );
}

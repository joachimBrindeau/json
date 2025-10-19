'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentCard, DocumentSkeleton, BaseDocument } from '@/components/features/documents';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { BulkOperations, BulkableItem } from '@/components/ui/bulk-operations';
import { useState } from 'react';
import Link from 'next/link';

export interface DocumentListViewProps<T extends BaseDocument> {
  documents: T[];
  loading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMoreRef: (node: HTMLElement | null) => void;
  onDelete?: (doc: T) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkExport?: (ids: string[]) => Promise<void>;
  showAuthor?: boolean;
  showBulkSelect?: boolean;
  showDeleteButton?: boolean;
  dateField?: 'createdAt' | 'updatedAt' | 'publishedAt';
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionText?: string;
  emptyActionHref?: string;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  testId?: string;
  canDelete?: (doc: T) => boolean;
}

/**
 * Unified document list view component
 * Displays documents in a card grid with infinite scroll
 */
export function DocumentListView<T extends BaseDocument>({
  documents,
  loading,
  isLoadingMore,
  hasMore,
  loadMoreRef,
  onDelete,
  onBulkDelete,
  onBulkExport,
  showAuthor = false,
  showBulkSelect = false,
  showDeleteButton = false,
  dateField = 'createdAt',
  emptyTitle = 'No documents found',
  emptyDescription = 'Try adjusting your search criteria',
  emptyActionText,
  emptyActionHref,
  hasFilters = false,
  onClearFilters,
  testId = 'document-list',
  canDelete,
}: DocumentListViewProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Safety check for SSR
  const safeDocuments = documents || [];

  // Loading skeleton
  if (loading && safeDocuments.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <DocumentSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (safeDocuments.length === 0) {
    return (
      <div className="text-center py-16" data-testid={`${testId}-empty`}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{emptyTitle}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{emptyDescription}</p>
        {hasFilters && onClearFilters && (
          <Button variant="outline" className="mt-4" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        {emptyActionText && emptyActionHref && (
          <Link href={emptyActionHref}>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              {emptyActionText}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Bulk Operations */}
      {showBulkSelect && safeDocuments.length > 0 && (
        <BulkOperations
          items={safeDocuments as BulkableItem[]}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onBulkDelete={onBulkDelete}
          onBulkExport={onBulkExport}
          className="mb-4"
        />
      )}

      {/* Document Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <DocumentCard
                document={doc}
                onDelete={onDelete && (!canDelete || canDelete(doc)) ? () => onDelete(doc) : undefined}
                showBulkSelect={showBulkSelect}
                isSelected={selectedIds.includes(doc.id)}
                onSelect={(id, checked) => {
                  if (checked) {
                    setSelectedIds((prev) => [...prev, doc.id]);
                  } else {
                    setSelectedIds((prev) => prev.filter((prevId) => prevId !== doc.id));
                  }
                }}
                showAuthor={showAuthor}
                showDeleteButton={showDeleteButton && (!canDelete || canDelete(doc))}
                dateField={dateField}
                testId={testId}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-8 text-center">
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <LoadingSpinner size="sm" />
            Loading more...
          </div>
        )}
        {!hasMore && safeDocuments.length > 0 && (
          <p className="text-muted-foreground">
            You&apos;ve reached the end • {safeDocuments.length} documents loaded
          </p>
        )}
      </div>
    </>
  );
}

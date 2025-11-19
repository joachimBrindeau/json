'use client';

import { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDocumentList } from '@/hooks/use-document-list';
import { DocumentFilters } from '@/components/features/documents/DocumentFilters';
import { DocumentListView } from '@/components/features/documents/DocumentListView';
import { BaseDocument } from '@/components/features/documents';
import { formatDateForFilename } from '@/lib/utils/formatters';

export interface DocumentListPageConfig<T extends BaseDocument> {
  // Data fetching
  endpoint: string;
  enabled?: boolean;

  // Page header
  icon?: ReactNode;
  title: string;
  description: string;
  showTotalCount?: boolean;

  // Filters configuration
  showAdvancedSearch?: boolean;
  showCategoryFilter?: boolean;
  showVisibilityFilter?: boolean;
  showSortBy?: boolean;
  filterPlaceholder?: string;

  // List view configuration
  showAuthor?: boolean;
  showBulkSelect?: boolean;
  showDeleteButton?: boolean;
  dateField?: 'createdAt' | 'updatedAt' | 'publishedAt';
  canDelete?: (doc: T) => boolean;

  // Empty state
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionText?: string;
  emptyActionHref?: string;

  // Bulk operations
  enableBulkDelete?: boolean;
  enableBulkExport?: boolean;

  // Test ID
  testId?: string;
}

interface DocumentListPageProps<T extends BaseDocument> {
  config: DocumentListPageConfig<T>;
}

/**
 * Unified document list page component
 * Combines all common document listing patterns into a single reusable component
 */
export function DocumentListPage<T extends BaseDocument>({ config }: DocumentListPageProps<T>) {
  const {
    endpoint,
    enabled = true,
    icon,
    title,
    description,
    showTotalCount = true,
    showAdvancedSearch = false,
    showCategoryFilter = false,
    showVisibilityFilter = false,
    showSortBy = true,
    filterPlaceholder = 'Search...',
    showAuthor = false,
    showBulkSelect = false,
    showDeleteButton = false,
    dateField = 'createdAt',
    canDelete,
    emptyTitle,
    emptyDescription,
    emptyActionText,
    emptyActionHref,
    enableBulkDelete = false,
    enableBulkExport = false,
    testId = 'document-list-page',
  } = config;

  // Use unified document list hook
  const {
    documents,
    loading,
    isLoadingMore,
    hasMore,
    loadMoreRef,
    filters,
    setFilters,
    totalCount,
    deleteDocument,
  } = useDocumentList<T>({
    endpoint,
    enabled, // Enable on both server and client for consistent hydration
  });

  // Safety check for SSR
  const safeDocuments = documents || [];

  // Bulk delete handler
  const handleBulkDelete = enableBulkDelete
    ? async (ids: string[]) => {
        const errors: string[] = [];
        for (const id of ids) {
          try {
            await deleteDocument(id);
          } catch (error) {
            const doc = safeDocuments.find((d) => d.id === id);
            errors.push(
              `${doc?.title || id}: ${error instanceof Error ? error.message : 'Failed to delete'}`
            );
          }
        }

        if (errors.length > 0) {
          throw new Error(`Some items could not be deleted:\n${errors.join('\n')}`);
        }
      }
    : undefined;

  // Bulk export handler
  const handleBulkExport = enableBulkExport
    ? async (ids: string[]) => {
        const selectedDocs = safeDocuments.filter((doc) => ids.includes(doc.id));
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
      }
    : undefined;

  // Clear filters handler
  const handleClearFilters = () => {
    setFilters({
      query: '',
      tags: [],
      sortBy: filters.sortBy,
    });
  };

  // Delete handler wrapper
  const handleDelete = showDeleteButton
    ? (doc: T) => {
        deleteDocument(doc.id);
      }
    : undefined;

  const hasActiveFilters = !!(
    filters.query ||
    filters.category ||
    filters.visibility ||
    filters.dateRange ||
    filters.complexity ||
    filters.minSize ||
    filters.maxSize
  );

  return (
    <MainLayout>
      <div className="h-full flex flex-col bg-background" data-testid={testId}>
        {/* Hero Section */}
        <div className="border-b bg-gradient-to-b from-muted/50 to-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                {icon}
                {title}
              </h1>
              <p className="text-muted-foreground">{description}</p>
              {showTotalCount && totalCount > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-semibold text-foreground">
                    {totalCount.toLocaleString()}
                  </span>{' '}
                  {totalCount === 1 ? 'document' : 'documents'} available
                </p>
              )}
            </div>

            {/* Filters */}
            <DocumentFilters
              filters={filters}
              onFiltersChange={setFilters}
              showAdvancedSearch={showAdvancedSearch}
              showCategoryFilter={showCategoryFilter}
              showVisibilityFilter={showVisibilityFilter}
              showSortBy={showSortBy}
              placeholder={filterPlaceholder}
              testId={`${testId}-filters`}
              className="max-w-4xl mx-auto"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <DocumentListView
              documents={safeDocuments}
              loading={loading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              loadMoreRef={loadMoreRef}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onBulkExport={handleBulkExport}
              showAuthor={showAuthor}
              showBulkSelect={showBulkSelect}
              showDeleteButton={showDeleteButton}
              dateField={dateField}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              emptyActionText={emptyActionText}
              emptyActionHref={emptyActionHref}
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              testId={`${testId}-view`}
              canDelete={canDelete}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

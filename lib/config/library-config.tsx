import React from 'react';
import { Globe, Database } from 'lucide-react';
import { DocumentListPageConfig } from '@/components/features/documents/DocumentListPage';
import { BaseDocument } from '@/components/features/documents';

/**
 * Library type definitions
 */
export interface PublicDocument extends BaseDocument {
  publishedAt: string;
  userId?: string;
}

export interface PrivateDocument extends BaseDocument {
  createdAt: string;
  updatedAt: string;
  visibility: 'private' | 'public';
}

/**
 * Library configuration presets
 */
export interface LibraryConfigPreset {
  icon?: React.ReactNode;
  title: string;
  description: string;
  endpoint: string;
  showAdvancedSearch: boolean;
  showCategoryFilter: boolean;
  showVisibilityFilter: boolean;
  showAuthor: boolean;
  showBulkSelect: boolean;
  dateField: 'createdAt' | 'updatedAt' | 'publishedAt';
  emptyTitle: string;
  emptyDescription: string;
  emptyActionText?: string;
  emptyActionHref?: string;
  testId: string;
}

/**
 * Public library configuration
 */
export const PUBLIC_LIBRARY_CONFIG: Omit<
  DocumentListPageConfig<PublicDocument>,
  'canDelete' | 'enableBulkDelete' | 'enableBulkExport' | 'showDeleteButton'
> = {
  endpoint: '/api/library',
  icon: <Globe className="h-8 w-8 text-primary" />,
  title: 'Public JSON Library',
  description: 'Explore and use community-shared JSON examples and templates',
  showTotalCount: true,
  showAdvancedSearch: true,
  showCategoryFilter: false,
  showVisibilityFilter: false,
  showSortBy: true,
  showAuthor: true,
  showBulkSelect: true,
  dateField: 'publishedAt',
  emptyTitle: 'No JSON examples found',
  emptyDescription: 'Try adjusting your search criteria or browse all available JSONs',
  filterPlaceholder: 'Search library...',
  testId: 'library',
};

/**
 * Private library configuration
 */
export const PRIVATE_LIBRARY_CONFIG: Omit<
  DocumentListPageConfig<PrivateDocument>,
  'canDelete' | 'enableBulkDelete' | 'enableBulkExport' | 'showDeleteButton'
> = {
  endpoint: '/api/private',
  icon: <Database className="h-8 w-8 text-primary" />,
  title: 'My Library',
  description: 'Manage your saved JSON documents and templates',
  showTotalCount: true,
  showAdvancedSearch: false,
  showCategoryFilter: true,
  showVisibilityFilter: true,
  showSortBy: true,
  showAuthor: false,
  showBulkSelect: false,
  dateField: 'updatedAt',
  emptyTitle: 'No saved JSONs found',
  emptyDescription: 'Start building your JSON library by saving documents from the editor',
  emptyActionText: 'Create Your First JSON',
  emptyActionHref: '/edit',
  filterPlaceholder: 'Search your JSON library...',
  testId: 'private-library',
};

/**
 * Creates a public library config with session-based permissions
 */
export function createPublicLibraryConfig(
  session: { user: { id: string } } | null
): DocumentListPageConfig<PublicDocument> {
  return {
    ...PUBLIC_LIBRARY_CONFIG,
    enableBulkDelete: !!session,
    enableBulkExport: true,
    showDeleteButton: !!session,
    canDelete: (doc) =>
      !!session &&
      (doc.userId === session?.user?.id || doc.author?.id === session?.user?.id),
  };
}

/**
 * Creates a private library config (always authenticated)
 */
export function createPrivateLibraryConfig(): DocumentListPageConfig<PrivateDocument> {
  return {
    ...PRIVATE_LIBRARY_CONFIG,
    showDeleteButton: true,
    enableBulkDelete: false,
    enableBulkExport: false,
  };
}


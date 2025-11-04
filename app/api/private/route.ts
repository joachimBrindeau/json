import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/utils';
import { getUserDocuments } from '@/lib/db/queries/documents';
import { success } from '@/lib/api/responses';
import { ValidationError } from '@/lib/utils/app-errors';
import {
  parseDocumentListQuery,
  formatDocumentList,
} from '@/lib/api/handlers/document-list';
import { handleCreateDocument } from '@/lib/api/handlers/document-create-handler';

const SORT_OPTIONS = ['recent', 'updated', 'views'] as const;

/**
 * GET user's private documents with filtering
 */
export const GET = withAuth(async (request: NextRequest, session) => {
  // Parse and validate query parameters
  const query = parseDocumentListQuery(request, {
    sortOptions: SORT_OPTIONS,
    defaultSort: 'recent',
    sortFieldMapping: {
      recent: 'created',
      updated: 'updated',
      views: 'views',
    },
    requireAuth: true,
  });

  // Get user documents
  const result = await getUserDocuments(session.user.id, {
    page: query.pagination.page,
    limit: query.pagination.limit,
    search: query.search,
    category: query.filters.category,
    sortBy: query.sort.dbField,
    sortOrder: query.sort.order,
    includeContent: false, // Don't include full content for list view
    includeAnalytics: true,
  });

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to fetch documents');
  }

  return success({
    documents: formatDocumentList(result.data?.documents || [], false), // false = private library
    pagination: result.data?.pagination,
  });
});

/**
 * POST create private document
 */
export const POST = withAuth(async (request: NextRequest, session) => {
  return handleCreateDocument(request, session, {
    visibility: 'private', // Default to private, but allow override from request
  });
});

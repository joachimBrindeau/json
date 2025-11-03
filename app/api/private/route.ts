import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/utils';
import { validateAndBuildCreateInput } from '@/lib/api/handlers/document-create';
import { getUserDocuments, createJsonDocument } from '@/lib/db/queries/documents';
import { success, created } from '@/lib/api/responses';
import { withErrorHandler } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/utils/app-errors';
import {
  parseDocumentListQuery,
  formatDocumentList,
} from '@/lib/api/handlers/document-list';

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
  const data = await request.json();

  const input = validateAndBuildCreateInput(data);

  // Create the document
  const result = await createJsonDocument({
    userId: session.user.id,
    ...input,
    visibility: data.visibility || 'private',
  });

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to create document');
  }

  return created(result.data, { message: 'Document created successfully' });
});

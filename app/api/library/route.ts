import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/utils';
import { validateAndBuildCreateInput } from '@/lib/api/handlers/document-create';
import { getPublicDocuments, createJsonDocument } from '@/lib/db/queries/documents';
import { success, created } from '@/lib/api/responses';
import { withErrorHandler } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/utils/app-errors';
import {
  parseDocumentListQuery,
  formatDocumentList,
} from '@/lib/api/handlers/document-list';

/**
 * GET public documents from library with filtering
 * Now using withErrorHandler for automatic error handling
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Parse and validate query parameters
  const query = parseDocumentListQuery(request, {
    sortOptions: ['recent', 'popular', 'views', 'size', 'title'],
    defaultSort: 'recent',
  });

  // Get public documents
  const result = await getPublicDocuments({
    page: query.pagination.page,
    limit: query.pagination.limit,
    search: query.search,
    category: query.filters.category,
    sortBy: query.sort.value,
    sortOrder: query.sort.order,
  });

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to fetch documents');
  }

  return success({
    documents: formatDocumentList(result.data?.documents || [], true),
    pagination: result.data?.pagination,
  });
});

/**
 * POST create public document in library
 */
export const POST = withAuth(async (request: NextRequest, session) => {
  const data = await request.json();

  const input = validateAndBuildCreateInput(data);

  // Create the document with public visibility
  const result = await createJsonDocument({
    userId: session.user.id,
    ...input,
    visibility: 'public', // Force public visibility for public library
  });

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to create document');
  }

  return created(result.data, { message: 'Document created successfully' });
});

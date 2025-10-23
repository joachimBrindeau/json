import { NextRequest } from 'next/server';
import {
  validatePaginationParams,
  validateSortParam,
  validateSearchParam,
  formatDocumentListResponse,
  withAuth,
} from '@/lib/api/utils';
import { validateAndBuildCreateInput } from '@/lib/api/handlers/document-create';
import { getPublicDocuments, createJsonDocument } from '@/lib/db/queries/documents';
import { success, created } from '@/lib/api/responses';
import { withErrorHandler } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/utils/app-errors';
import {
  DOCUMENT_CATEGORIES,
  isValidCategory,
  getCategoryValidationError,
} from '@/lib/constants/categories';

/**
 * GET public documents from library with filtering
 * Now using withErrorHandler for automatic error handling
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Validate parameters
  const pagination = validatePaginationParams(searchParams);
  const sortResult = validateSortParam(searchParams.get('sort') || 'recent', [
    'recent',
    'popular',
    'views',
    'size',
    'title',
  ]);

  // Check if sort validation failed
  if (typeof sortResult === 'object' && 'error' in sortResult) {
    throw new ValidationError(sortResult.error);
  }

  const sort = sortResult as string;
  const search = validateSearchParam(searchParams.get('search'));
  const category = searchParams.get('category');
  const dateRange = searchParams.get('dateRange');
  const complexity = searchParams.get('complexity');
  const minSize = searchParams.get('minSize');
  const maxSize = searchParams.get('maxSize');

  // Validate category
  if (category && !isValidCategory(category)) {
    throw new ValidationError(getCategoryValidationError(), [
      { field: 'category', message: 'Invalid category value' },
    ]);
  }

  // Get public documents
  const result = await getPublicDocuments({
    page: pagination.page,
    limit: pagination.limit,
    search: search || undefined,
    category: category || undefined,
    sortBy: sort,
    sortOrder: 'desc',
  });

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to fetch documents');
  }

  return success({
    documents: formatDocumentListResponse(result.data?.documents || [], true),
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

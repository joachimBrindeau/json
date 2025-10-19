import { NextRequest } from 'next/server';
import { validatePaginationParams, validateSortParam, validateSearchParam, formatDocumentListResponse, withAuth } from '@/lib/api/utils';
import { getUserDocuments, createJsonDocument } from '@/lib/db/queries/documents';
import { success, created } from '@/lib/api/responses';
import { withErrorHandler } from '@/lib/api/middleware';
import { ValidationError } from '@/lib/utils/app-errors';
import { DOCUMENT_CATEGORIES, isValidCategory, getCategoryValidationError } from '@/lib/constants/categories';

const SORT_OPTIONS = ['recent', 'updated', 'views'] as const;

/**
 * GET user's private documents with filtering
 */
export const GET = withAuth(async (request: NextRequest, session) => {

  const { searchParams } = new URL(request.url);

  // Validate parameters
  const pagination = validatePaginationParams(searchParams);
  const sort = validateSortParam(
    searchParams.get('sort') || 'recent',
    SORT_OPTIONS
  );
  const search = validateSearchParam(searchParams.get('search'));
  const category = searchParams.get('category');
  const visibility = searchParams.get('visibility');

  // Validate category
  if (category && !isValidCategory(category)) {
    throw new ValidationError(getCategoryValidationError(), [
      { field: 'category', message: 'Invalid category value' },
    ]);
  }

  // Validate visibility
  if (visibility && !['private', 'public'].includes(visibility)) {
    throw new ValidationError('Invalid visibility. Must be either "private" or "public"', [
      { field: 'visibility', message: 'Must be "private" or "public"' },
    ]);
  }

  // Map sort parameter to database field
  const sortBy = sort === 'recent' ? 'created' :
                sort === 'updated' ? 'updated' :
                sort === 'views' ? 'views' : 'created';

  // Get user documents
  const result = await getUserDocuments(session.user.id, {
    page: pagination.page,
    limit: pagination.limit,
    search: search || undefined,
    category: category || undefined,
    visibility: visibility as 'private' | 'public' || undefined,
    sortBy,
    sortOrder: 'desc',
    includeContent: false, // Don't include full content for list view
    includeAnalytics: true
  });

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to fetch documents');
  }

  return success({
    documents: formatDocumentListResponse(result.data?.documents || [], false), // false = private library
    pagination: result.data?.pagination,
  });
});

/**
 * POST create private document
 */
export const POST = withAuth(async (request: NextRequest, session) => {

  const data = await request.json();

  // Validate required fields
  if (!data.title?.trim()) {
    throw new ValidationError('Title is required', [
      { field: 'title', message: 'Title is required' },
    ]);
  }

  // Validate category if provided
  if (data.category && !isValidCategory(data.category)) {
    throw new ValidationError(getCategoryValidationError(), [
      { field: 'category', message: 'Invalid category value' },
    ]);
  }

  // Create the document
  const result = await createJsonDocument({
    userId: session.user.id,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    content: data.content || '{}', // Default empty JSON if no content provided
    category: data.category || undefined,
    tags: data.tags || [],
    richContent: data.richContent || '',
    visibility: data.visibility || 'private',
  });

  if (!result.success) {
    throw new ValidationError(result.error || 'Failed to create document');
  }

  return created(result.data, { message: 'Document created successfully' });
});
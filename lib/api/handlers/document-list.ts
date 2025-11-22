import { NextRequest } from 'next/server';
import {
  validatePaginationParams,
  validateSortParam,
  validateSearchParam,
  formatDocumentListResponse,
} from '@/lib/api/utils';
import { ValidationError } from '@/lib/utils/app-errors';
import {
  isValidCategory,
  getCategoryValidationError,
} from '@/lib/constants/categories';

export interface DocumentListQueryOptions {
  // Pagination
  page: number;
  limit: number;

  // Sorting
  sort?: string;
  sortOptions?: readonly string[];
  defaultSort?: string;
  sortFieldMapping?: Record<string, string>;

  // Search
  search?: string;

  // Filters
  category?: string;
  visibility?: string;
  dateRange?: string;
  complexity?: string;
  minSize?: string;
  maxSize?: string;

  // Response formatting
  isPublic?: boolean;
}

export interface DocumentListQueryResult {
  pagination: {
    page: number;
    limit: number;
  };
  sort: {
    value: string;
    dbField: string;
    order: 'asc' | 'desc';
  };
  search?: string;
  filters: {
    category?: string;
    visibility?: string;
    dateRange?: string;
    complexity?: string;
    minSize?: string;
    maxSize?: string;
  };
}

/**
 * Validates and extracts query parameters for document list endpoints
 * Supports both public and private library endpoints
 */
export function parseDocumentListQuery(
  request: NextRequest,
  options: {
    sortOptions?: readonly string[];
    defaultSort?: string;
    sortFieldMapping?: Record<string, string>;
    requireAuth?: boolean;
  } = {}
): DocumentListQueryResult {
  const { searchParams } = new URL(request.url);
  const {
    sortOptions = ['recent', 'popular', 'views', 'size', 'title'],
    defaultSort = 'recent',
    sortFieldMapping = {},
  } = options;

  // Validate pagination
  const pagination = validatePaginationParams(searchParams);

  // Validate sort
  const sortResult = validateSortParam(
    searchParams.get('sort') || defaultSort,
    sortOptions
  );

  if (typeof sortResult === 'object' && 'error' in sortResult) {
    throw new ValidationError(sortResult.error);
  }

  const sort = sortResult as string;

  // Map sort to database field
  const dbField =
    sortFieldMapping[sort] ||
    (sort === 'recent'
      ? 'created'
      : sort === 'updated'
        ? 'updated'
        : sort === 'views'
          ? 'views'
          : sort === 'popular'
            ? 'views'
            : sort === 'size'
              ? 'size'
              : 'created');

  // Validate search
  const search = validateSearchParam(searchParams.get('search'));

  // Validate category
  const category = searchParams.get('category');
  if (category && !isValidCategory(category)) {
    throw new ValidationError(getCategoryValidationError(), [
      { field: 'category', message: 'Invalid category value' },
    ]);
  }

  // Validate visibility (for private library)
  const visibility = searchParams.get('visibility');
  if (visibility && !['private', 'public'].includes(visibility)) {
    throw new ValidationError(
      'Invalid visibility. Must be either "private" or "public"',
      [{ field: 'visibility', message: 'Must be "private" or "public"' }]
    );
  }

  // Extract other filters
  const dateRange = searchParams.get('dateRange');
  const complexity = searchParams.get('complexity');
  const minSize = searchParams.get('minSize');
  const maxSize = searchParams.get('maxSize');

  return {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
    },
    sort: {
      value: sort,
      dbField,
      order: 'desc',
    },
    search: search || undefined,
    filters: {
      ...(category && { category }),
      ...(visibility && { visibility }),
      ...(dateRange && { dateRange }),
      ...(complexity && { complexity }),
      ...(minSize && { minSize }),
      ...(maxSize && { maxSize }),
    },
  };
}

/**
 * Formats document list response consistently
 */
export function formatDocumentList(
  documents: any[],
  isPublic: boolean = false
) {
  return formatDocumentListResponse(documents, isPublic);
}


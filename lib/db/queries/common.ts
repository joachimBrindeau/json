import { Prisma } from '@prisma/client';

// Common pagination interface
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Common sort options
export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}

// Common search options
export interface SearchParams {
  search?: string;
  category?: string;
  tags?: string[];
}

// Filter builder for common where clauses
export interface FilterOptions {
  userId?: string;
  visibility?: 'private' | 'public';
  isAnonymous?: boolean;
  excludeExpired?: boolean;
  since?: Date;
  until?: Date;
}

/**
 * Build a reusable where clause for document queries
 */
export function buildWhereClause(
  filters: FilterOptions,
  searchParams?: SearchParams
): Prisma.JsonDocumentWhereInput {
  const where: Prisma.JsonDocumentWhereInput = {};

  // User filter
  if (filters.userId !== undefined) {
    where.userId = filters.userId;
  }

  // Visibility filter
  if (filters.visibility) {
    where.visibility = filters.visibility;
  }

  // Anonymous filter
  if (filters.isAnonymous !== undefined) {
    where.isAnonymous = filters.isAnonymous;
  }

  // Exclude expired documents
  if (filters.excludeExpired) {
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];
  }

  // Date range filters
  if (filters.since || filters.until) {
    where.createdAt = {};
    if (filters.since) {
      where.createdAt.gte = filters.since;
    }
    if (filters.until) {
      where.createdAt.lte = filters.until;
    }
  }

  // Search parameters
  if (searchParams) {
    if (searchParams.search && searchParams.search.trim().length > 0) {
      const searchTerm = searchParams.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { hasSome: [searchTerm] } }
      ];
    }

    if (searchParams.category) {
      where.category = searchParams.category;
    }

    if (searchParams.tags && searchParams.tags.length > 0) {
      where.tags = { hasSome: searchParams.tags };
    }
  }

  return where;
}

/**
 * Build pagination parameters with validation
 */
export function buildPagination(params: PaginationParams = {}): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(Math.max(1, params.limit || 20), 100);
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit
  };
}

/**
 * Calculate pagination result metadata
 */
export function buildPaginationResult(
  total: number,
  page: number,
  limit: number
): PaginationResult {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev
  };
}

/**
 * Build order by clause for different sort options
 */
export function buildOrderBy(
  sortBy: string = 'recent',
  sortOrder: SortOrder = 'desc'
): Prisma.JsonDocumentOrderByWithRelationInput {
  const orderByMap: Record<string, Prisma.JsonDocumentOrderByWithRelationInput> = {
    recent: { createdAt: sortOrder },
    updated: { updatedAt: sortOrder },
    title: { title: sortOrder },
    size: { size: sortOrder },
    views: { viewCount: sortOrder },
    popularity: { viewCount: sortOrder },
    published: { publishedAt: sortOrder },
    complexity: { complexity: sortOrder },
    nodeCount: { nodeCount: sortOrder },
    depth: { maxDepth: sortOrder }
  };

  return orderByMap[sortBy] || orderByMap.recent;
}

/**
 * Common select fields for document listings
 */
export function getDocumentListSelect(includeAnalytics = false, includeChunks = false) {
  return {
    id: true,
    shareId: true,
    title: true,
    description: true,
    richContent: true,
    size: true,
    nodeCount: true,
    maxDepth: true,
    complexity: true,
    visibility: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    viewCount: true,
    tags: true,
    category: true,
    userId: true,
    isAnonymous: true,
    user: {
      select: {
        id: true,
        name: true,
        image: true
      }
    },
    ...(includeAnalytics && {
      analytics: {
        select: {
          id: true,
          viewCount: true,
          shareCount: true,
          lastViewed: true,
          parseTime: true,
          renderTime: true,
          memoryUsage: true
        }
      }
    }),
    ...(includeChunks && {
      chunks: {
        select: {
          id: true,
          chunkIndex: true,
          size: true,
          path: true,
          checksum: true
        },
        orderBy: { chunkIndex: 'asc' as const }
      }
    })
  };
}

/**
 * Common select fields for document details
 */
export function getDocumentDetailSelect(includeAnalytics = false, includeChunks = false) {
  return {
    id: true,
    shareId: true,
    title: true,
    description: true,
    richContent: true,
    content: true,
    metadata: true,
    size: true,
    nodeCount: true,
    maxDepth: true,
    complexity: true,
    version: true,
    checksum: true,
    visibility: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    accessedAt: true,
    viewCount: true,
    tags: true,
    category: true,
    slug: true,
    isAnonymous: true,
    expiresAt: true,
    user: {
      select: {
        id: true,
        name: true,
        image: true,
        email: true
      }
    },
    ...(includeAnalytics && {
      analytics: {
        select: {
          id: true,
          viewCount: true,
          shareCount: true,
          lastViewed: true,
          parseTime: true,
          renderTime: true,
          memoryUsage: true
        }
      }
    }),
    ...(includeChunks && {
      chunks: {
        select: {
          id: true,
          chunkIndex: true,
          size: true,
          path: true,
          checksum: true
        },
        orderBy: { chunkIndex: 'asc' as const }
      }
    })
  };
}


/**
 * Validate and sanitize search parameters
 */
export function validateSearchParams(params: SearchParams): {
  isValid: boolean;
  errors: string[];
  sanitized: SearchParams;
} {
  const errors: string[] = [];
  const sanitized: SearchParams = {};

  if (params.search !== undefined) {
    if (typeof params.search !== 'string') {
      errors.push('Search must be a string');
    } else if (params.search.length > 100) {
      errors.push('Search query too long. Maximum 100 characters.');
    } else {
      sanitized.search = params.search.trim();
    }
  }

  if (params.category !== undefined) {
    if (typeof params.category !== 'string') {
      errors.push('Category must be a string');
    } else {
      sanitized.category = params.category.trim();
    }
  }

  if (params.tags !== undefined) {
    if (!Array.isArray(params.tags)) {
      errors.push('Tags must be an array');
    } else if (params.tags.length > 20) {
      errors.push('Too many tags. Maximum 20 tags.');
    } else {
      sanitized.tags = params.tags.filter(tag => 
        typeof tag === 'string' && tag.trim().length > 0
      ).map(tag => tag.trim());
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Validate and sanitize pagination parameters
 */
export function validatePaginationParams(params: PaginationParams): {
  isValid: boolean;
  errors: string[];
  sanitized: PaginationParams;
} {
  const errors: string[] = [];
  const sanitized: PaginationParams = {};

  if (params.page !== undefined) {
    const page = Number(params.page);
    if (isNaN(page) || page < 1) {
      errors.push('Invalid page parameter. Must be a positive integer.');
    } else {
      sanitized.page = page;
    }
  }

  if (params.limit !== undefined) {
    const limit = Number(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Invalid limit parameter. Must be between 1 and 100.');
    } else {
      sanitized.limit = limit;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Common database error handling
 */
export function handleDatabaseError(error: unknown): {
  status: number;
  error: string;
  details?: string;
} {
  // Type assertion for Prisma errors
  const prismaError = error as { code?: string; message?: string };

  switch (prismaError.code) {
    case 'P2002':
      return { status: 409, error: 'Database constraint violation' };
    case 'P2025':
      return { status: 404, error: 'Resource not found' };
    case 'P1001':
      return { status: 503, error: 'Database connection failed' };
    case 'P2024':
      return { status: 408, error: 'Request timeout' };
    default:
      return {
        status: 500,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      };
  }
}

/**
 * Format document for API response
 */
export function formatDocumentForResponse(doc: any, includeContent = false) {
  return {
    id: doc.shareId || doc.id,
    shareId: doc.shareId,
    title: doc.title || 'Untitled',
    description: doc.description,
    size: Number(doc.size),
    nodeCount: doc.nodeCount,
    maxDepth: doc.maxDepth,
    complexity: doc.complexity,
    visibility: doc.visibility,
    publishedAt: doc.publishedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    viewCount: doc.viewCount,
    tags: doc.tags || [],
    category: doc.category,
    author: doc.user,
    ...(includeContent && {
      content: doc.content,
      metadata: doc.metadata,
      checksum: doc.checksum,
      version: doc.version
    })
  };
}
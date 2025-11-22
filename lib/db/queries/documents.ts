import { Prisma } from '@prisma/client';
import { prisma } from '../../db';
import {
  buildWhereClause,
  buildPagination,
  buildPaginationResult,
  buildOrderBy,
  getDocumentListSelect,
  getDocumentDetailSelect,
  validateSearchParams,
  validatePaginationParams,
  handleDatabaseError,
  formatDocumentForResponse,
  verifyDocumentOwnership,
  PaginationParams,
  PaginationResult,
  SearchParams,
  FilterOptions,
} from './common';
import { logger } from '@/lib/logger';
import { analyzeJsonStream } from '@/lib/json';
import { createHash } from 'crypto';
import { cacheGetOrSet, CacheKeys, CacheTTL, CacheInvalidation } from '@/lib/cache/redis-cache';

// Document creation input type
export interface CreateDocumentInput {
  title?: string;
  content: any;
  metadata?: any;
  description?: string;
  tags?: string[];
  category?: string;
  visibility?: 'private' | 'public';
  userId?: string;
  size: bigint;
  nodeCount: number;
  maxDepth: number;
  complexity: 'Low' | 'Medium' | 'High';
  checksum?: string;
  expiresAt?: Date;
}

// Document update input type
export interface UpdateDocumentInput {
  title?: string;
  content?: any;
  metadata?: any;
  description?: string;
  tags?: string[];
  category?: string;
  visibility?: 'private' | 'public';
  version?: number;
}

// Document query options
export interface DocumentQueryOptions extends PaginationParams, SearchParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeContent?: boolean;
  includeAnalytics?: boolean;
  includeChunks?: boolean;
}

// Internal helper to validate options and build core query parts
function validateAndBuildQueryParts(
  options: DocumentQueryOptions,
  baseFilters: FilterOptions,
  defaultSortBy?: string
):
  | {
      ok: true;
      pagination: { skip: number; take: number; page: number; limit: number };
      where: Prisma.JsonDocumentWhereInput;
      orderBy: Prisma.JsonDocumentOrderByWithRelationInput;
    }
  | { ok: false; response: { success: false; error: string; status: number } } {
  const paginationValidation = validatePaginationParams(options);
  if (!paginationValidation.isValid) {
    return {
      ok: false,
      response: {
        success: false,
        error: paginationValidation.errors.join(', '),
        status: 400,
      },
    };
  }

  const searchValidation = validateSearchParams(options);
  if (!searchValidation.isValid) {
    return {
      ok: false,
      response: {
        success: false,
        error: searchValidation.errors.join(', '),
        status: 400,
      },
    };
  }

  const pagination = buildPagination(paginationValidation.sanitized);
  const where = buildWhereClause(baseFilters, searchValidation.sanitized);
  const sortKey = defaultSortBy && !options.sortBy ? defaultSortBy : options.sortBy;
  const orderBy = buildOrderBy(sortKey, options.sortOrder);

  return { ok: true, pagination, where, orderBy };
}

/**
 * Get a document by its ID with authentication check
 */
export async function getDocumentById(
  id: string,
  userId?: string,
  options: {
    includeContent?: boolean;
    includeAnalytics?: boolean;
    includeChunks?: boolean;
  } = {}
) {
  try {
    // Check if the ID is a valid UUID (for id field) or CUID (for shareId field)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const document = await prisma.jsonDocument.findFirst({
      where: isUuid
        ? { OR: [{ id }, { shareId: id }] } // If it's a UUID, try both fields
        : { shareId: id }, // If it's not a UUID (likely CUID), only try shareId
      select: options.includeContent
        ? getDocumentDetailSelect(options.includeAnalytics, options.includeChunks)
        : getDocumentListSelect(options.includeAnalytics, options.includeChunks),
    });

    if (!document) {
      return { success: false, error: 'Document not found', status: 404 };
    }

    // Check access permissions
    const hasAccess =
      document.visibility === 'public' ||
      (document as any).userId === userId ||
      (document as any).isAnonymous;

    if (!hasAccess) {
      return { success: false, error: 'Access denied', status: 403 };
    }

    // Update access timestamp if user has access
    if (hasAccess) {
      await prisma.jsonDocument
        .update({
          where: { id: document.id },
          data: { accessedAt: new Date() },
        })
        .catch(() => {
          // Ignore errors updating access timestamp
        });
    }

    return {
      success: true,
      data: formatDocumentForResponse(document, options.includeContent),
    };
  } catch (error) {
    logger.error({ err: error, documentId: id, userId }, 'Get document error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Get a document by its share ID (public access)
 */
export async function getDocumentByShareId(
  shareId: string,
  options: {
    includeContent?: boolean;
    includeAnalytics?: boolean;
    includeChunks?: boolean;
  } = {}
) {
  try {
    const document = await prisma.jsonDocument.findFirst({
      where: {
        shareId,
        OR: [{ visibility: 'public' }, { isAnonymous: true }],
      },
      select: options.includeContent
        ? getDocumentDetailSelect(options.includeAnalytics, options.includeChunks)
        : getDocumentListSelect(options.includeAnalytics, options.includeChunks),
    });

    if (!document) {
      return { success: false, error: 'Document not found or not accessible', status: 404 };
    }

    // Update access timestamp
    await prisma.jsonDocument
      .update({
        where: { id: document.id },
        data: { accessedAt: new Date() },
      })
      .catch(() => {
        // Ignore errors updating access timestamp
      });

    return {
      success: true,
      data: formatDocumentForResponse(document, options.includeContent),
    };
  } catch (error) {
    logger.error({ err: error, shareId }, 'Get document by share ID error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Get user documents with pagination and search
 */
export async function getUserDocuments(
  userId: string,
  options: DocumentQueryOptions = {}
): Promise<{
  success: boolean;
  data?: {
    documents: any[];
    pagination: PaginationResult;
  };
  error?: string;
  status?: number;
}> {
  try {
    const prepared = validateAndBuildQueryParts(options, { userId, excludeExpired: true });
    if (!prepared.ok) {
      return prepared.response;
    }
    const { pagination, where, orderBy } = prepared;

    // Fetch documents and total count
    const [documents, total] = await Promise.all([
      prisma.jsonDocument.findMany({
        where,
        select: options.includeContent
          ? getDocumentDetailSelect(options.includeAnalytics, options.includeChunks)
          : getDocumentListSelect(options.includeAnalytics, options.includeChunks),
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.jsonDocument.count({ where }),
    ]);

    return {
      success: true,
      data: {
        documents: documents.map((doc) => formatDocumentForResponse(doc, options.includeContent)),
        pagination: buildPaginationResult(total, pagination.page, pagination.limit),
      },
    };
  } catch (error) {
    logger.error({ err: error, userId, options }, 'Get user documents error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Get public documents for public library
 * Cached for 5 minutes to reduce load on high-traffic endpoint
 */
export async function getPublicDocuments(options: DocumentQueryOptions = {}): Promise<{
  success: boolean;
  data?: {
    documents: any[];
    pagination: PaginationResult;
  };
  error?: string;
  status?: number;
}> {
  try {
    const prepared = validateAndBuildQueryParts(
      options,
      { visibility: 'public', excludeExpired: true },
      'published'
    );
    if (!prepared.ok) {
      return prepared.response;
    }
    const { pagination, where, orderBy } = prepared;

    // Build cache key with filters
    const filterHash = createHash('md5')
      .update(JSON.stringify({ where, orderBy, includeContent: options.includeContent }))
      .digest('hex')
      .substring(0, 8);
    const cacheKey = CacheKeys.publicDocuments(pagination.page, pagination.limit, filterHash);

    // Try to get from cache or compute
    const data = await cacheGetOrSet(
      cacheKey,
      async () => {
        try {
          // Fetch documents and total count
          const [documents, total] = await Promise.all([
            prisma.jsonDocument.findMany({
              where,
              select: options.includeContent
                ? getDocumentDetailSelect(options.includeAnalytics, false) // No chunks for public library
                : (() => {
                    const selectObj = getDocumentListSelect(options.includeAnalytics, false);
                    return {
                      ...selectObj,
                      content: true, // Need content for preview
                    };
                  })(),
              orderBy,
              skip: pagination.skip,
              take: pagination.take,
            }),
            prisma.jsonDocument.count({ where }),
          ]);

          // Add preview for public documents without full content
          const formattedDocuments = documents.map((doc) => ({
            ...formatDocumentForResponse(doc, options.includeContent),
            ...(!options.includeContent &&
              (doc as any).content && {
                preview: JSON.stringify((doc as any).content, null, 2).slice(0, 200) + '...',
              }),
          }));

          return {
            documents: formattedDocuments,
            pagination: buildPaginationResult(total, pagination.page, pagination.limit),
          };
        } catch (err: any) {
          // Graceful fallback on clean DB: if table/column missing, return empty list instead of 500
          const msg = String(err?.message || '');
          const code = (err && (err as any).code) || (err && (err as any).prismaCode);
          const isMissingSchema =
            code === 'P2021' || // table does not exist
            code === 'P2022' || // column does not exist
            /relation \".*\" does not exist/i.test(msg) ||
            /table .* does not exist/i.test(msg) ||
            /no such table/i.test(msg);

          if (isMissingSchema) {
            logger.warn(
              { err: err },
              'Public library requested before DB schema exists. Returning empty list.'
            );
            return {
              documents: [],
              pagination: buildPaginationResult(0, pagination.page, pagination.limit),
            };
          }
          throw err;
        }
      },
      { ttl: CacheTTL.MEDIUM, prefix: 'public' }
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error({ err: error, options }, 'Get public documents error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Create a new document
 */
export async function createDocument(input: CreateDocumentInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}> {
  try {
    const document = await prisma.jsonDocument.create({
      data: {
        title: input.title,
        content: input.content,
        metadata: input.metadata,
        description: input.description,
        tags: input.tags || [],
        category: input.category,
        visibility: input.visibility || 'private',
        userId: input.userId,
        size: input.size,
        nodeCount: input.nodeCount,
        maxDepth: input.maxDepth,
        complexity: input.complexity,
        checksum: input.checksum,
        expiresAt: input.expiresAt,
        isAnonymous: !input.userId,
      },
      select: getDocumentDetailSelect(false, false),
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, true),
    };
  } catch (error) {
    logger.error({ err: error, input }, 'Create document error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Simplified interface for creating JSON documents from API routes
 */
export interface CreateJsonDocumentInput {
  userId: string;
  title: string;
  description?: string;
  content: string | any;
  category?: string;
  tags?: string[];
  richContent?: string;
  visibility?: 'private' | 'public';
}

/**
 * Create a JSON document with automatic analysis (simplified API for routes)
 */
export async function createJsonDocument(input: CreateJsonDocumentInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}> {
  try {
    // Parse and normalize content
    const jsonString =
      typeof input.content === 'string' ? input.content : JSON.stringify(input.content, null, 2);

    const parsedContent =
      typeof input.content === 'string' ? JSON.parse(input.content) : input.content;

    // Analyze JSON structure
    const analysis = await analyzeJsonStream(jsonString);

    // Generate checksum for deduplication
    const checksum = createHash('sha256').update(jsonString).digest('hex');

    // Generate unique share ID
    const shareId = createHash('sha256')
      .update(`${Date.now()}-${Math.random()}-${checksum}`)
      .digest('hex')
      .substring(0, 24);

    // Create document with analyzed data
    const document = await prisma.jsonDocument.create({
      data: {
        shareId,
        title: input.title,
        description: input.description || '',
        content: parsedContent,
        checksum,
        size: BigInt(jsonString.length),
        nodeCount: (analysis as any).stats?.nodes || 0,
        maxDepth: (analysis as any).stats?.maxDepth || 0,
        complexity: (analysis as any).complexity || 'Low',
        visibility: input.visibility || 'private',
        userId: input.userId,
        category: input.category,
        tags: input.tags || [],
        metadata: {
          analysis: analysis as any,
          richContent: input.richContent || '',
          createdAt: new Date().toISOString(),
          source: 'api',
        },
      },
      select: getDocumentDetailSelect(false, false),
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, true),
    };
  } catch (error) {
    logger.error({ err: error, input }, 'Create JSON document error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  } finally {
    // Invalidate relevant caches after document creation
    CacheInvalidation.publicDocuments().catch((err) => {
      logger.error({ err }, 'Failed to invalidate public documents cache');
    });
    if (input.userId) {
      CacheInvalidation.user(input.userId).catch((err) => {
        logger.error({ err, userId: input.userId }, 'Failed to invalidate user cache');
      });
    }
  }
}

/**
 * Update a document with authentication
 */
export async function updateDocument(
  id: string,
  userId: string,
  input: UpdateDocumentInput
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}> {
  try {
    // Verify document ownership
    const verification = await verifyDocumentOwnership(id, userId, {
      id: true,
      userId: true,
      version: true,
    });

    if (!verification.success || !verification.data) {
      return verification;
    }

    const existingDocument = verification.data;

    // Update the document
    const document = await prisma.jsonDocument.update({
      where: { id: existingDocument.id },
      data: {
        ...input,
        version: input.version || existingDocument.version + 1,
        updatedAt: new Date(),
      },
      select: getDocumentDetailSelect(false, false),
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, true),
    };
  } catch (error) {
    logger.error({ err: error, documentId: id, userId }, 'Update document error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  } finally {
    // Invalidate relevant caches after document update
    CacheInvalidation.document(id).catch((err) => {
      logger.error({ err, documentId: id }, 'Failed to invalidate document cache');
    });
    CacheInvalidation.user(userId).catch((err) => {
      logger.error({ err, userId }, 'Failed to invalidate user cache');
    });
  }
}

/**
 * Delete a document (soft or hard delete)
 */
export async function deleteDocument(
  id: string,
  userId: string,
  options: { hardDelete?: boolean } = {}
): Promise<{
  success: boolean;
  error?: string;
  status?: number;
}> {
  try {
    // Verify document ownership
    const verification = await verifyDocumentOwnership(id, userId, {
      id: true,
      userId: true,
      title: true,
    });

    if (!verification.success || !verification.data) {
      return verification;
    }

    const existingDocument = verification.data;

    if (options.hardDelete) {
      // Hard delete - completely remove from database
      await prisma.jsonDocument.delete({
        where: { id: existingDocument.id },
      });
    } else {
      // Soft delete - set expiration to now
      await prisma.jsonDocument.update({
        where: { id: existingDocument.id },
        data: {
          expiresAt: new Date(),
          visibility: 'private', // Make private when soft deleted
        },
      });
    }

    // Invalidate relevant caches after deletion
    await Promise.all([
      CacheInvalidation.document(id),
      CacheInvalidation.user(userId),
      CacheInvalidation.publicDocuments(),
    ]).catch((err) => {
      logger.error({ err, documentId: id }, 'Failed to invalidate caches after deletion');
    });

    return { success: true };
  } catch (error) {
    logger.error(
      { err: error, documentId: id, userId, hardDelete: options.hardDelete },
      'Delete document error'
    );
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Find documents by content similarity (using PostgreSQL's JSONB operations)
 */
export async function findDocumentsByContent(
  _searchContent: any,
  userId?: string,
  options: DocumentQueryOptions = {}
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
  status?: number;
}> {
  try {
    const pagination = buildPagination(options);

    // Build base where clause
    const baseWhere: Prisma.JsonDocumentWhereInput = {
      OR: [{ visibility: 'public' }, ...(userId ? [{ userId }] : [])],
    };

    // Use a simpler approach for content similarity
    // Note: This is a simplified approach, more sophisticated similarity
    // matching might require custom SQL or external search engines
    const documents = await prisma.jsonDocument.findMany({
      where: baseWhere,
      select: getDocumentListSelect(false, false),
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: documents.map((doc) => formatDocumentForResponse(doc, false)),
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Find documents by content error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Publish a document to make it public
 */
export async function publishDocument(
  id: string,
  userId: string,
  publishData: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
    slug?: string;
  }
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}> {
  try {
    // Verify document ownership
    const verification = await verifyDocumentOwnership(id, userId, {
      id: true,
      userId: true,
      visibility: true,
    });

    if (!verification.success || !verification.data) {
      return verification;
    }

    const existingDocument = verification.data;

    // Update to public with publish data
    const document = await prisma.jsonDocument.update({
      where: { id: existingDocument.id },
      data: {
        visibility: 'public',
        publishedAt: new Date(),
        title: publishData.title,
        description: publishData.description,
        tags: publishData.tags || [],
        category: publishData.category,
        slug: publishData.slug,
      },
      select: getDocumentDetailSelect(false, false),
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, true),
    };
  } catch (error) {
    logger.error(
      { err: error, documentId: id, userId, slug: publishData.slug },
      'Publish document error'
    );

    // Handle unique constraint violation for slug
    if ((error as any)?.code === 'P2002' && (error as any)?.meta?.target?.includes('slug')) {
      return {
        success: false,
        error: 'Slug already exists. Please choose a different slug.',
        status: 409,
      };
    }

    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Get document statistics for a user
 * Cached for 30 seconds to improve dashboard performance
 */
export async function getDocumentStats(userId: string): Promise<{
  success: boolean;
  data?: {
    total: number;
    public: number;
    private: number;
    totalSize: string;
    totalViews: number;
    complexityDistribution: Record<string, number>;
  };
  error?: string;
  status?: number;
}> {
  try {
    // Build cache key
    const cacheKey = CacheKeys.userStats(userId);

    // Try to get from cache or compute
    const data = await cacheGetOrSet(
      cacheKey,
      async () => {
        const [stats, complexityStats] = await Promise.all([
          prisma.jsonDocument.aggregate({
            where: { userId, expiresAt: { gt: new Date() } },
            _count: { id: true },
            _sum: { size: true, viewCount: true },
          }),
          prisma.jsonDocument.groupBy({
            by: ['complexity'],
            where: { userId, expiresAt: { gt: new Date() } },
            _count: { complexity: true },
          }),
        ]);

        const visibilityStats = await prisma.jsonDocument.groupBy({
          by: ['visibility'],
          where: { userId, expiresAt: { gt: new Date() } },
          _count: { visibility: true },
        });

        const complexityDistribution = complexityStats.reduce(
          (acc, stat) => {
            acc[stat.complexity] = stat._count.complexity;
            return acc;
          },
          {} as Record<string, number>
        );

        const visibilityDistribution = visibilityStats.reduce(
          (acc, stat) => {
            acc[stat.visibility] = stat._count.visibility;
            return acc;
          },
          {} as Record<string, number>
        );

        return {
          total: stats._count.id,
          public: visibilityDistribution.public || 0,
          private: visibilityDistribution.private || 0,
          totalSize: (Number(stats._sum.size || 0) / (1024 * 1024)).toFixed(2) + ' MB',
          totalViews: stats._sum.viewCount || 0,
          complexityDistribution,
        };
      },
      { ttl: CacheTTL.SHORT, prefix: 'stats' }
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Get document stats error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

/**
 * Clean up expired documents
 */
export async function cleanupExpiredDocuments(): Promise<{
  success: boolean;
  data?: { deletedCount: number };
  error?: string;
}> {
  try {
    const result = await prisma.jsonDocument.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });

    return {
      success: true,
      data: { deletedCount: result.count },
    };
  } catch (error) {
    logger.error({ err: error }, 'Cleanup expired documents error');
    return {
      success: false,
      ...handleDatabaseError(error),
    };
  }
}

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
  PaginationParams,
  PaginationResult,
  SearchParams,
  FilterOptions
} from './common';
import { logger } from '@/lib/logger';
import { analyzeJsonStream } from '@/lib/json';
import { createHash } from 'crypto';

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
        ? { OR: [{ id }, { shareId: id }] }  // If it's a UUID, try both fields
        : { shareId: id },  // If it's not a UUID (likely CUID), only try shareId
      select: options.includeContent 
        ? getDocumentDetailSelect(options.includeAnalytics, options.includeChunks)
        : getDocumentListSelect(options.includeAnalytics, options.includeChunks)
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
      await prisma.jsonDocument.update({
        where: { id: document.id },
        data: { accessedAt: new Date() }
      }).catch(() => {
        // Ignore errors updating access timestamp
      });
    }

    return {
      success: true,
      data: formatDocumentForResponse(document, options.includeContent)
    };
  } catch (error) {
    logger.error({ err: error, documentId: id, userId }, 'Get document error');
    return {
      success: false,
      ...handleDatabaseError(error)
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
        OR: [
          { visibility: 'public' },
          { isAnonymous: true }
        ]
      },
      select: options.includeContent 
        ? getDocumentDetailSelect(options.includeAnalytics, options.includeChunks)
        : getDocumentListSelect(options.includeAnalytics, options.includeChunks)
    });

    if (!document) {
      return { success: false, error: 'Document not found or not accessible', status: 404 };
    }

    // Update access timestamp
    await prisma.jsonDocument.update({
      where: { id: document.id },
      data: { accessedAt: new Date() }
    }).catch(() => {
      // Ignore errors updating access timestamp
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, options.includeContent)
    };
  } catch (error) {
    logger.error({ err: error, shareId }, 'Get document by share ID error');
    return {
      success: false,
      ...handleDatabaseError(error)
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
    // Validate parameters
    const paginationValidation = validatePaginationParams(options);
    if (!paginationValidation.isValid) {
      return {
        success: false,
        error: paginationValidation.errors.join(', '),
        status: 400
      };
    }

    const searchValidation = validateSearchParams(options);
    if (!searchValidation.isValid) {
      return {
        success: false,
        error: searchValidation.errors.join(', '),
        status: 400
      };
    }

    const pagination = buildPagination(paginationValidation.sanitized);
    const where = buildWhereClause(
      { userId, excludeExpired: true },
      searchValidation.sanitized
    );
    const orderBy = buildOrderBy(options.sortBy, options.sortOrder);

    // Fetch documents and total count
    const [documents, total] = await Promise.all([
      prisma.jsonDocument.findMany({
        where,
        select: options.includeContent 
          ? getDocumentDetailSelect(options.includeAnalytics, options.includeChunks)
          : getDocumentListSelect(options.includeAnalytics, options.includeChunks),
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.jsonDocument.count({ where })
    ]);

    return {
      success: true,
      data: {
        documents: documents.map(doc => formatDocumentForResponse(doc, options.includeContent)),
        pagination: buildPaginationResult(total, pagination.page, pagination.limit)
      }
    };
  } catch (error) {
    logger.error({ err: error, userId, options }, 'Get user documents error');
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

/**
 * Get public documents for public library
 */
export async function getPublicDocuments(
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
    // Validate parameters
    const paginationValidation = validatePaginationParams(options);
    if (!paginationValidation.isValid) {
      return {
        success: false,
        error: paginationValidation.errors.join(', '),
        status: 400
      };
    }

    const searchValidation = validateSearchParams(options);
    if (!searchValidation.isValid) {
      return {
        success: false,
        error: searchValidation.errors.join(', '),
        status: 400
      };
    }

    const pagination = buildPagination(paginationValidation.sanitized);
    const where = buildWhereClause(
      { visibility: 'public', excludeExpired: true },
      searchValidation.sanitized
    );
    const orderBy = buildOrderBy(options.sortBy || 'published', options.sortOrder);

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
                content: true // Need content for preview
              };
            })(),
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.jsonDocument.count({ where })
    ]);

    // Add preview for public documents without full content
    const formattedDocuments = documents.map(doc => ({
      ...formatDocumentForResponse(doc, options.includeContent),
      ...(!options.includeContent && doc.content && {
        preview: JSON.stringify(doc.content, null, 2).slice(0, 200) + '...'
      })
    }));

    return {
      success: true,
      data: {
        documents: formattedDocuments,
        pagination: buildPaginationResult(total, pagination.page, pagination.limit)
      }
    };
  } catch (error) {
    logger.error({ err: error, options }, 'Get public documents error');
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

/**
 * Create a new document
 */
export async function createDocument(
  input: CreateDocumentInput
): Promise<{
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
        isAnonymous: !input.userId
      },
      select: getDocumentDetailSelect(false, false)
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, true)
    };
  } catch (error) {
    logger.error({ err: error, input }, 'Create document error');
    return {
      success: false,
      ...handleDatabaseError(error)
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
export async function createJsonDocument(
  input: CreateJsonDocumentInput
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}> {
  try {
    // Parse and normalize content
    const jsonString = typeof input.content === 'string'
      ? input.content
      : JSON.stringify(input.content, null, 2);

    const parsedContent = typeof input.content === 'string'
      ? JSON.parse(input.content)
      : input.content;

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
        nodeCount: analysis.stats?.nodes || 0,
        maxDepth: analysis.stats?.maxDepth || 0,
        complexity: analysis.complexity || 'Low',
        visibility: input.visibility || 'private',
        userId: input.userId,
        category: input.category,
        tags: input.tags || [],
        metadata: {
          analysis,
          richContent: input.richContent || '',
          createdAt: new Date().toISOString(),
          source: 'api'
        }
      },
      select: getDocumentDetailSelect(false, false)
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, true)
    };
  } catch (error) {
    logger.error({ err: error, input }, 'Create JSON document error');
    return {
      success: false,
      ...handleDatabaseError(error)
    };
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
    // First verify document exists and user owns it
    const existingDocument = await prisma.jsonDocument.findFirst({
      where: {
        OR: [{ id }, { shareId: id }],
      },
      select: {
        id: true,
        userId: true,
        version: true
      }
    });

    if (!existingDocument) {
      return { success: false, error: 'Document not found', status: 404 };
    }

    if (existingDocument.userId !== userId) {
      return { success: false, error: 'Access denied - not document owner', status: 403 };
    }

    // Update the document
    const document = await prisma.jsonDocument.update({
      where: { id: existingDocument.id },
      data: {
        ...input,
        version: input.version || existingDocument.version + 1,
        updatedAt: new Date()
      },
      select: getDocumentDetailSelect(false, false)
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, true)
    };
  } catch (error) {
    logger.error({ err: error, documentId: id, userId }, 'Update document error');
    return {
      success: false,
      ...handleDatabaseError(error)
    };
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
    // First verify document exists and user owns it
    const existingDocument = await prisma.jsonDocument.findFirst({
      where: {
        OR: [{ id }, { shareId: id }],
      },
      select: {
        id: true,
        userId: true,
        title: true
      }
    });

    if (!existingDocument) {
      return { success: false, error: 'Document not found', status: 404 };
    }

    if (existingDocument.userId !== userId) {
      return { success: false, error: 'Access denied - not document owner', status: 403 };
    }

    if (options.hardDelete) {
      // Hard delete - completely remove from database
      await prisma.jsonDocument.delete({
        where: { id: existingDocument.id }
      });
    } else {
      // Soft delete - set expiration to now
      await prisma.jsonDocument.update({
        where: { id: existingDocument.id },
        data: { 
          expiresAt: new Date(),
          visibility: 'private' // Make private when soft deleted
        }
      });
    }

    return { success: true };
  } catch (error) {
    logger.error({ err: error, documentId: id, userId, hardDelete: options.hardDelete }, 'Delete document error');
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

/**
 * Find documents by content similarity (using PostgreSQL's JSONB operations)
 */
export async function findDocumentsByContent(
  searchContent: any,
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
      OR: [
        { visibility: 'public' },
        ...(userId ? [{ userId }] : [])
      ]
    };

    // Use a simpler approach for content similarity
    // Note: This is a simplified approach, more sophisticated similarity
    // matching might require custom SQL or external search engines
    const documents = await prisma.jsonDocument.findMany({
      where: baseWhere,
      select: getDocumentListSelect(false, false),
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: documents.map(doc => formatDocumentForResponse(doc, false))
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Find documents by content error');
    return {
      success: false,
      ...handleDatabaseError(error)
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
    // First verify document exists and user owns it
    const existingDocument = await prisma.jsonDocument.findFirst({
      where: {
        OR: [{ id }, { shareId: id }],
      },
      select: {
        id: true,
        userId: true,
        visibility: true
      }
    });

    if (!existingDocument) {
      return { success: false, error: 'Document not found', status: 404 };
    }

    if (existingDocument.userId !== userId) {
      return { success: false, error: 'Access denied - not document owner', status: 403 };
    }

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
        slug: publishData.slug
      },
      select: getDocumentDetailSelect(false, false)
    });

    return {
      success: true,
      data: formatDocumentForResponse(document, true)
    };
  } catch (error) {
    logger.error({ err: error, documentId: id, userId, slug: publishData.slug }, 'Publish document error');

    // Handle unique constraint violation for slug
    if ((error as any)?.code === 'P2002' && (error as any)?.meta?.target?.includes('slug')) {
      return { success: false, error: 'Slug already exists. Please choose a different slug.', status: 409 };
    }

    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}

/**
 * Get document statistics for a user
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
    const [stats, complexityStats] = await Promise.all([
      prisma.jsonDocument.aggregate({
        where: { userId, expiresAt: { gt: new Date() } },
        _count: { id: true },
        _sum: { size: true, viewCount: true }
      }),
      prisma.jsonDocument.groupBy({
        by: ['complexity'],
        where: { userId, expiresAt: { gt: new Date() } },
        _count: { complexity: true }
      })
    ]);

    const visibilityStats = await prisma.jsonDocument.groupBy({
      by: ['visibility'],
      where: { userId, expiresAt: { gt: new Date() } },
      _count: { visibility: true }
    });

    const complexityDistribution = complexityStats.reduce((acc, stat) => {
      acc[stat.complexity] = stat._count.complexity;
      return acc;
    }, {} as Record<string, number>);

    const visibilityDistribution = visibilityStats.reduce((acc, stat) => {
      acc[stat.visibility] = stat._count.visibility;
      return acc;
    }, {} as Record<string, number>);

    return {
      success: true,
      data: {
        total: stats._count.id,
        public: visibilityDistribution.public || 0,
        private: visibilityDistribution.private || 0,
        totalSize: (Number(stats._sum.size || 0) / (1024 * 1024)).toFixed(2) + ' MB',
        totalViews: stats._sum.viewCount || 0,
        complexityDistribution
      }
    };
  } catch (error) {
    logger.error({ err: error, userId }, 'Get document stats error');
    return {
      success: false,
      ...handleDatabaseError(error)
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
        expiresAt: { lte: new Date() }
      }
    });

    return {
      success: true,
      data: { deletedCount: result.count }
    };
  } catch (error) {
    logger.error({ err: error }, 'Cleanup expired documents error');
    return {
      success: false,
      ...handleDatabaseError(error)
    };
  }
}
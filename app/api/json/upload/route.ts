import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { analyzeJsonStream, chunkJsonData, createPerformanceMonitor, JsonCache } from '@/lib/json';
import { success } from '@/lib/api/responses';
import { withOptionalAuth } from '@/lib/api/utils';
import {
  ValidationError,
  FileTooLargeError,
  InvalidJsonError,
  RateLimitError,
} from '@/lib/utils/app-errors';
import { config } from '@/lib/config';
import { publishLimiter } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large file processing

/**
 * POST upload and process JSON file
 * Supports both authenticated and anonymous uploads
 */
export const POST = withOptionalAuth(async (request, session) => {
  // Rate limit uploads: prefer user-based key, fallback to IP
  const rateKey =
    (session?.user?.id as string | undefined) ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'anonymous';
  if (!publishLimiter.isAllowed(rateKey)) {
    const reset = publishLimiter.getResetTime(rateKey);
    throw new RateLimitError(
      reset ? Math.ceil((reset.getTime() - Date.now()) / 1000) : undefined,
      'Upload rate limit reached. Please try again later.',
      {
        resetTime: reset?.toISOString(),
        remaining: publishLimiter.getRemainingAttempts(rateKey),
      }
    );
  }

  const monitor = createPerformanceMonitor();
  const userId = session?.user?.id || null;

  // Debug/log: who is performing the upload
  try {
    logger.info(
      { route: '/api/json/upload', hasSession: !!session, userId },
      'Upload request received'
    );
  } catch {}

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string | null;

  if (!file) {
    throw new ValidationError('No file provided', [{ field: 'file', message: 'File is required' }]);
  }

  // Check file size (max 2GB for very large JSONs)
  const maxSize = config.performance.maxJsonSizeBytes;
  if (file.size > maxSize) {
    throw new FileTooLargeError(maxSize, file.size);
  }

  // Read file content
  const content = await file.text();

  // Validate JSON
  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(content);
  } catch (parseError) {
    throw new InvalidJsonError(
      parseError instanceof Error ? parseError.message : 'Invalid JSON format'
    );
  }

  // Analyze JSON structure
  const analysis = await analyzeJsonStream(parsedContent as string | object, {
    maxChunkSize: config.performance.jsonStreamingChunkSize,
    trackPaths: true,
    findLargeArrays: true,
  });

  // Create chunks for large JSONs
  const chunks = analysis.size > 1024 * 1024 ? chunkJsonData(parsedContent as any) : [];

  // Save to database with transaction - Prisma errors automatically handled by middleware
  const result = await prisma.$transaction(async (tx) => {
    // Create main document
    const document = await tx.jsonDocument.create({
      data: {
        title: title || file.name,
        content: parsedContent as any,
        size: BigInt(analysis.size),
        nodeCount: analysis.nodeCount,
        maxDepth: analysis.maxDepth,
        complexity: analysis.complexity,
        checksum: analysis.checksum,
        userId: userId,
        isAnonymous: !userId,
        visibility: userId ? 'private' : 'private', // Default to private for all
        metadata: {
          originalFilename: file.name,
          uploadedAt: new Date().toISOString(),
          largeArrays: analysis.largeArrays,
          deepObjects: analysis.deepObjects,
          paths: analysis.paths.slice(0, 1000), // Limit paths for performance
        },
      },
    });

    // Save chunks if needed
    if (chunks.length > 0) {
      await tx.jsonChunk.createMany({
        data: chunks.map((chunk) => ({
          documentId: document.id,
          chunkIndex: chunk.index,
          content: chunk.content as any,
          size: chunk.size,
          path: chunk.path,
          checksum: chunk.checksum,
        })),
      });
    }

    // Create analytics entry
    const performance = monitor.end();
    await tx.jsonAnalytics.create({
      data: {
        documentId: document.id,
        parseTime: Math.round(performance.duration),
        memoryUsage: performance.memoryUsage ? BigInt(performance.memoryUsage) : null,
        userAgent: request.headers.get('user-agent') || undefined,
        ipHash:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
            ? createHash('sha256')
                .update(
                  request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || ''
                )
                .digest('hex')
            : undefined,
      },
    });

    return document;
  });

  // Post-save log
  try {
    logger.info(
      {
        route: '/api/json/upload',
        documentId: result.id,
        shareId: result.shareId,
        savedUserId: (result as any).userId,
        isAnonymous: !(result as any).userId,
      },
      'Upload saved'
    );
  } catch {}

  // Cache the analysis for quick access
  await JsonCache.setAnalysis(result.id, analysis);

  return success({
    document: {
      id: result.id,
      shareId: result.shareId,
      title: result.title,
      size: Number(result.size),
      nodeCount: result.nodeCount,
      maxDepth: result.maxDepth,
      complexity: result.complexity,
      chunks: chunks.length,
      createdAt: result.createdAt,
    },
    analysis: {
      size: analysis.size,
      nodeCount: analysis.nodeCount,
      maxDepth: analysis.maxDepth,
      complexity: analysis.complexity,
      largeArrays: analysis.largeArrays.length,
      deepObjects: analysis.deepObjects.length,
      processingTime: monitor.end().duration,
    },
  });
});

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

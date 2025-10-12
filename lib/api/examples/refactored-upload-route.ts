/**
 * Example refactored version of /app/api/json/upload/route.ts
 * This demonstrates how to use the new shared API utilities
 * to eliminate duplication and improve consistency
 */

import { NextRequest } from 'next/server';
import { withAuth, validateRequest, handleApiError, withCors } from '@/lib/api/utils';
import { fileUploadSchema, jsonAnalysisOptionsSchema } from '@/lib/api/validators';
import { success, badRequest, unprocessableEntity } from '@/lib/api/responses';
import { prisma } from '@/lib/db';
import {
  analyzeJsonStream,
  chunkJsonData,
  createPerformanceMonitor,
  JsonCache,
} from '@/lib/json';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Main handler with authentication
const uploadHandler = withAuth(async (req: NextRequest, session) => {
  const monitor = createPerformanceMonitor();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string | null;

    // Validate file upload using schema
    if (!file) {
      return badRequest('No file provided');
    }

    // Check file size using environment variable
    const maxSize = parseInt(process.env.MAX_JSON_SIZE_MB || '2048') * 1024 * 1024;
    if (file.size > maxSize) {
      return unprocessableEntity(
        `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
      );
    }

    // Read and validate JSON content
    const content = await file.text();
    let parsedContent: unknown;
    
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return badRequest('Invalid JSON format');
    }

    // Analyze JSON structure with configurable options
    const analysisOptions = {
      maxChunkSize: parseInt(process.env.JSON_STREAMING_CHUNK_SIZE || '1048576'),
      trackPaths: true,
      findLargeArrays: true,
    };

    const analysis = await analyzeJsonStream(parsedContent as string | object, analysisOptions);

    // Create chunks for large JSONs
    const chunks = analysis.size > 1024 * 1024 ? chunkJsonData(parsedContent) : [];

    // Save to database with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create main document
      const document = await tx.jsonDocument.create({
        data: {
          title: title || file.name,
          content: parsedContent,
          size: BigInt(analysis.size),
          nodeCount: analysis.nodeCount,
          maxDepth: analysis.maxDepth,
          complexity: analysis.complexity,
          checksum: analysis.checksum,
          userId: session.user.id, // Use authenticated user ID
          metadata: {
            originalFilename: file.name,
            uploadedAt: new Date().toISOString(),
            largeArrays: analysis.largeArrays,
            deepObjects: analysis.deepObjects,
            paths: analysis.paths.slice(0, 1000),
          },
        },
      });

      // Save chunks if needed
      if (chunks.length > 0) {
        await tx.jsonChunk.createMany({
          data: chunks.map((chunk) => ({
            documentId: document.id,
            chunkIndex: chunk.index,
            content: chunk.content,
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
          userAgent: req.headers.get('user-agent') || undefined,
          ipHash: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
            ? createHash('sha256').update(req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '').digest('hex')
            : undefined,
        },
      });

      return document;
    });

    // Cache the analysis for quick access
    await JsonCache.setAnalysis(result.id, analysis);

    // Return standardized success response
    return success(
      {
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
      },
      {
        message: 'JSON uploaded and processed successfully',
        status: 201,
      }
    );
  } catch (error) {
    // Use centralized error handling
    return handleApiError(error, 'POST /api/json/upload');
  }
});

// Apply CORS middleware and export
export const POST = withCors(uploadHandler, {
  methods: ['POST', 'OPTIONS'],
  headers: ['Content-Type'],
});

// Handle OPTIONS for CORS using the utility
export const OPTIONS = withCors(async () => new Response(null), {
  methods: ['POST', 'OPTIONS'],
  headers: ['Content-Type'],
});

/**
 * Key improvements over the original:
 * 
 * 1. Uses withAuth() for authentication instead of manual session checking
 * 2. Uses standardized success() and error responses
 * 3. Uses handleApiError() for consistent error handling and logging
 * 4. Uses withCors() for CORS handling instead of manual headers
 * 5. More descriptive error messages using response utilities
 * 6. Better separation of concerns
 * 7. Consistent response structure
 * 8. Automatic security headers and request IDs
 * 9. Better TypeScript types throughout
 * 10. Reusable patterns that work across all endpoints
 */
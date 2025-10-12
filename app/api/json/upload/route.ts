import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  analyzeJsonStream,
  chunkJsonData,
  createPerformanceMonitor,
  JsonCache,
} from '@/lib/json';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large file processing

export async function POST(request: NextRequest) {
  const monitor = createPerformanceMonitor();

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (max 2GB for very large JSONs)
    const maxSize = parseInt(process.env.MAX_JSON_SIZE_MB || '2048') * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` },
        { status: 413 }
      );
    }

    // Read file content
    const content = await file.text();

    // Validate JSON
    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    // Analyze JSON structure
    const analysis = await analyzeJsonStream(parsedContent as string | object, {
      maxChunkSize: parseInt(process.env.JSON_STREAMING_CHUNK_SIZE || '1048576'),
      trackPaths: true,
      findLargeArrays: true,
    });

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
          userAgent: request.headers.get('user-agent') || undefined,
          ipHash: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
            ? createHash('sha256').update(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').digest('hex')
            : undefined,
        },
      });

      return document;
    });

    // Cache the analysis for quick access
    await JsonCache.setAnalysis(result.id, analysis);

    return NextResponse.json({
      success: true,
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
  } catch (error) {
    console.error('JSON upload error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process JSON file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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

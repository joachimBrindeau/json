import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createJsonStream, JsonCache, createPerformanceMonitor } from '@/lib/json';
import { createHash } from 'crypto';
import { logger } from '@/lib/logger';
import { notFound, internalServerError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const GET = withAuth(async (request, session, { params }: { params: Promise<{ id: string }> }) => {
  const monitor = createPerformanceMonitor();
  const { id } = await params;

  try {
    // Try cache first
    const cachedData = await JsonCache.get(id);
    if (cachedData) {
      const stream = createJsonStream(cachedData);
      return new Response(stream as unknown as ReadableStream, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
          'X-Cache': 'HIT',
        },
      });
    }

    // Helper function to determine if the ID is a UUID format
    const isUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // Get document from database with proper authorization
    // Use different query conditions based on ID format to avoid UUID validation errors
    const whereCondition = isUUID(id) 
      ? {
          OR: [{ id }, { shareId: id }],
          // CRITICAL SECURITY: Only allow access to public documents OR private documents owned by the user
          AND: [
            {
              OR: [
                { visibility: 'public' },
                {
                  AND: [{ visibility: 'private' }, { userId: session?.user?.id || null }],
                },
              ],
            },
          ],
        }
      : {
          shareId: id,
          // CRITICAL SECURITY: Only allow access to public documents OR private documents owned by the user
          AND: [
            {
              OR: [
                { visibility: 'public' },
                {
                  AND: [{ visibility: 'private' }, { userId: session?.user?.id || null }],
                },
              ],
            },
          ],
        };

    const document = await prisma.jsonDocument.findFirst({
      where: whereCondition,
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
        analytics: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!document) {
      return notFound('JSON document not found');
    }

    // Update access timestamp
    await prisma.jsonDocument.update({
      where: { id: document.id },
      data: { accessedAt: new Date() },
    });

    // Update analytics
    const performance = monitor.end();
    // Find existing analytics or create new one
    const existingAnalytics = await prisma.jsonAnalytics.findFirst({
      where: {
        documentId: document.id,
      },
    });

    if (existingAnalytics) {
      await prisma.jsonAnalytics.update({
        where: {
          id: existingAnalytics.id,
        },
        data: {
          viewCount: { increment: 1 },
          lastViewed: new Date(),
          renderTime: Math.round(performance.duration),
        },
      });
    } else {
      await prisma.jsonAnalytics.create({
        data: {
          documentId: document.id,
          parseTime: 0,
          renderTime: Math.round(performance.duration),
          viewCount: 1,
          userAgent: request.headers.get('user-agent') || undefined,
          ipHash: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
            ? createHash('sha256').update(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').digest('hex')
            : undefined,
        },
      });
    }

    let jsonData: unknown;

    // If document has chunks, reconstruct from chunks
    if (document.chunks.length > 0) {
      jsonData = {};

      // Reconstruct from chunks
      for (const chunk of document.chunks) {
        const path = chunk.path;
        const content = chunk.content;

        // Simple reconstruction logic - could be enhanced
        if (path === '$') {
          jsonData = content;
        } else {
          // More complex path reconstruction would go here
          // For now, just use the main content
          jsonData = document.content;
          break;
        }
      }
    } else {
      jsonData = document.content;
    }

    // Cache for future requests
    await JsonCache.set(document.id, jsonData);

    // Create streaming response
    const stream = createJsonStream(jsonData);

    // Prepare response headers - only include metadata for public documents
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'X-Cache': 'MISS',
    };

    // SECURITY: Only expose metadata for public documents to prevent information disclosure
    if (document.visibility === 'public') {
      headers['X-Title'] = document.title || 'Shared JSON';
      headers['X-Published-At'] = document.publishedAt?.toISOString() || '';
      headers['X-Author'] = document.user?.name || '';
      headers['X-Size'] = document.size.toString();
      headers['X-Complexity'] = document.complexity;
      headers['X-Share-ID'] = document.shareId;
    }

    return new Response(stream as unknown as ReadableStream, { headers });
  } catch (error) {
    logger.error({ err: error, documentId: id, userId: session?.user?.id }, 'JSON streaming error');

    return internalServerError('Failed to stream JSON data', {
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get document metadata without content
export async function HEAD(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {

    // Helper function to determine if the ID is a UUID format
    const isUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // Use different query conditions based on ID format to avoid UUID validation errors
    const whereCondition = isUUID(id) 
      ? { OR: [{ id }, { shareId: id }] }
      : { shareId: id };

    const document = await prisma.jsonDocument.findFirst({
      where: whereCondition,
      select: {
        id: true,
        shareId: true,
        title: true,
        size: true,
        nodeCount: true,
        maxDepth: true,
        complexity: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { chunks: true },
        },
      },
    });

    if (!document) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Document-ID': document.id,
        'X-Share-ID': document.shareId,
        'X-Title': document.title || '',
        'X-Size': document.size.toString(),
        'X-Node-Count': document.nodeCount.toString(),
        'X-Max-Depth': document.maxDepth.toString(),
        'X-Complexity': document.complexity,
        'X-Chunks': document._count.chunks.toString(),
        'X-Created-At': document.createdAt.toISOString(),
        'X-Updated-At': document.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error({ err: error, documentId: id }, 'JSON metadata error');
    return new NextResponse(null, { status: 500 });
  }
}

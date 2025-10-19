import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeJsonStream, createPerformanceMonitor } from '@/lib/json';
import { logger } from '@/lib/logger';
import { success, badRequest, internalServerError } from '@/lib/api/responses';

export const runtime = 'nodejs';

// CORS headers to include in all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  const monitor = createPerformanceMonitor();

  try {
    const { jsonData, sourceUrl, extensionId } = await request.json();

    if (!jsonData) {
      return badRequest('No JSON data provided', { headers: corsHeaders });
    }

    // Parse JSON if it's a string
    let parsedContent: unknown;
    try {
      parsedContent = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    } catch {
      return badRequest('Invalid JSON format', { headers: corsHeaders });
    }

    // Analyze JSON structure
    const analysis = await analyzeJsonStream(parsedContent as string | object, {
      maxChunkSize: 1048576,
      trackPaths: false,
      findLargeArrays: false,
    });

    // Create a temporary share without authentication
    const document = await prisma.jsonDocument.create({
      data: {
        title: `Extension Import - ${new Date().toLocaleString()}`,
        content: parsedContent as object,
        size: BigInt(analysis.size),
        nodeCount: analysis.nodeCount,
        maxDepth: analysis.maxDepth,
        complexity: analysis.complexity,
        checksum: analysis.checksum,
        metadata: {
          source: 'extension',
          extensionId,
          sourceUrl,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    const performance = monitor.end();

    logger.info(
      {
        shareId: document.shareId,
        size: Number(document.size),
        nodeCount: document.nodeCount,
        processingTime: performance.duration,
        extensionId,
        sourceUrl
      },
      'Extension JSON submission successful'
    );

    return success({
      shareId: document.shareId,
      viewerUrl: `/library/${document.shareId}`,
      stats: {
        size: Number(document.size),
        nodeCount: document.nodeCount,
        maxDepth: document.maxDepth,
        processingTime: performance.duration,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    logger.error(
      {
        err: error,
        extensionId: request.headers.get('x-extension-id'),
        sourceUrl: request.headers.get('x-source-url')
      },
      'Extension JSON submission error'
    );

    return internalServerError('Failed to process JSON data', {
      details: error instanceof Error ? error.message : 'Unknown error',
      headers: corsHeaders,
    });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

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
    // Support both old (source) and new (sourceType) field names for backward compatibility
    const { jsonData, sourceUrl, extensionId, source, sourceType } = await request.json();

    if (!jsonData) {
      return badRequest('No JSON data provided', { headers: corsHeaders });
    }

    // Parse JSON if it's a string (backward compatibility with old extension version)
    let parsedContent: unknown;
    try {
      parsedContent = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    } catch {
      return badRequest('Invalid JSON format', { headers: corsHeaders });
    }

    // Use sourceType if available, fallback to source for backward compatibility
    const finalSourceType = sourceType || source || 'n8n-node';

    // Analyze JSON structure
    const analysis = await analyzeJsonStream(parsedContent as string | object, {
      maxChunkSize: 1048576,
      trackPaths: false,
      findLargeArrays: false,
    });

    // Create a temporary share without authentication
    // Set visibility to public and isAnonymous to true for easy access
    const titlePrefix = finalSourceType === 'n8n-workflow' ? 'n8n Workflow' : 'n8n Node Output';
    const document = await prisma.jsonDocument.create({
      data: {
        title: `${titlePrefix} - ${new Date().toLocaleString()}`,
        content: parsedContent as object,
        size: BigInt(analysis.size),
        nodeCount: analysis.nodeCount,
        maxDepth: analysis.maxDepth,
        complexity: analysis.complexity,
        checksum: analysis.checksum,
        visibility: 'public',
        isAnonymous: true,
        metadata: {
          sourceType: finalSourceType,
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
    // Extract request data for error logging (may not be available if parsing failed)
    let requestData: { extensionId?: string; sourceUrl?: string } = {};
    try {
      const body = await request.clone().json();
      requestData = {
        extensionId: body.extensionId,
        sourceUrl: body.sourceUrl,
      };
    } catch {
      // Ignore parsing errors in error handler
    }

    logger.error(
      {
        err: error,
        ...requestData,
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

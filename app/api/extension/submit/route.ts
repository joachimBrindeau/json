import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeJsonStream, createPerformanceMonitor } from '@/lib/json';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const monitor = createPerformanceMonitor();

  try {
    const { jsonData, sourceUrl, extensionId } = await request.json();

    if (!jsonData) {
      return NextResponse.json({ error: 'No JSON data provided' }, { status: 400 });
    }

    // Parse JSON if it's a string
    let parsedContent: unknown;
    try {
      parsedContent = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      shareId: document.shareId,
      viewerUrl: `/library/${document.shareId}`,
      stats: {
        size: Number(document.size),
        nodeCount: document.nodeCount,
        maxDepth: document.maxDepth,
        processingTime: performance.duration,
      },
    });
  } catch (error) {
    console.error('Extension JSON submission error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process JSON data',
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

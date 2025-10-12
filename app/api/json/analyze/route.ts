import { NextRequest, NextResponse } from 'next/server';
import { analyzeJsonStream } from '@/lib/json';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, options = {} } = body;

    if (!content) {
      return NextResponse.json({ error: 'No JSON content provided' }, { status: 400 });
    }

    // Validate JSON
    let parsedContent: unknown;
    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    // Perform analysis
    const analysis = await analyzeJsonStream(parsedContent as string | object, {
      maxChunkSize: options.maxChunkSize || 1048576,
      trackPaths: options.trackPaths !== false,
      findLargeArrays: options.findLargeArrays !== false,
    });

    // Determine recommendations
    const recommendations = [];

    if (analysis.complexity === 'High') {
      recommendations.push('Consider using the Tree View for better performance');
      recommendations.push('Large JSON detected - streaming recommended');
    }

    if (analysis.largeArrays.length > 0) {
      recommendations.push(
        `Found ${analysis.largeArrays.length} large arrays that may impact rendering`
      );
    }

    if (analysis.deepObjects.length > 0) {
      recommendations.push(`Found ${analysis.deepObjects.length} deeply nested objects`);
    }

    if (analysis.maxDepth > 15) {
      recommendations.push('Very deep nesting detected - consider flattening structure');
    }

    // Performance suggestions
    const suggestions = {
      viewer:
        analysis.complexity === 'High'
          ? 'tree'
          : analysis.complexity === 'Medium'
            ? 'progressive'
            : 'flow',
      streaming: analysis.size > 1024 * 1024,
      chunking: analysis.nodeCount > 10000,
      caching: analysis.size > 100 * 1024,
    };

    return NextResponse.json({
      success: true,
      analysis,
      recommendations,
      suggestions,
      performance: {
        estimatedRenderTime: Math.ceil(analysis.nodeCount / 1000) * 10, // rough estimate
        memoryEstimate: analysis.size * 2, // rough estimate
        recommendedViewer: suggestions.viewer,
      },
    });
  } catch (error) {
    console.error('JSON analysis error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze JSON',
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

/**
 * POST /api/extension/submit
 *
 * Submits JSON data from browser extensions (N8N, Chrome extensions, etc.)
 * Creates a temporary public share for viewing the JSON.
 *
 * @example Request
 * ```json
 * {
 *   "jsonData": { "key": "value" },
 *   "sourceType": "n8n-node",
 *   "extensionId": "extension-123",
 *   "sourceUrl": "https://example.com"
 * }
 * ```
 *
 * @throws {RateLimitError} 429 - If rate limit exceeded
 * @throws {ValidationError} 400 - If request validation fails
 * @throws {FileTooLargeError} 413 - If JSON exceeds size limit
 * @throws {DatabaseError} 500 - If database operation fails
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { analyzeJsonStream, createPerformanceMonitor, auditJson } from '@/lib/json';
import { logger } from '@/lib/logger';
import { success } from '@/lib/api/responses';
import { withErrorHandler, withValidationHandler } from '@/lib/api/middleware/error-handler';
import { publishLimiter } from '@/lib/middleware/rate-limit';
import {
  RateLimitError,
  InvalidJsonError,
  FileTooLargeError,
} from '@/lib/utils/app-errors';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

// Constants
const SOURCE_TYPE_TITLES: Record<string, string> = {
  'n8n-workflow': 'n8n Workflow',
  'n8n-node': 'n8n Node Output',
  'chrome-extension': 'Chrome Extension Output',
};

const DEFAULT_TITLE_PREFIX = 'n8n Node Output';

// Allowed CORS origins (can be moved to config)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  ...(process.env.ALLOWED_EXTENSION_ORIGINS?.split(',').filter(Boolean) || []),
].filter(Boolean);

// CORS headers helper
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigin =
    ALLOWED_ORIGINS.find((allowed) => origin && allowed === origin) ||
    (process.env.NODE_ENV === 'development' ? '*' : ALLOWED_ORIGINS[0] || '*');

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

// Validation schema
const extensionSubmitSchema = z.object({
  jsonData: z.union([
    // Handle string JSON
    z.string().transform((str, ctx) => {
      // Check size before parsing
      const maxSize = config.performance.maxJsonSizeBytes;
      if (str.length > maxSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `JSON size exceeds ${config.performance.maxJsonSizeMB}MB limit`,
        });
        return z.NEVER;
      }

      try {
        return JSON.parse(str);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : 'Invalid JSON string',
        });
        return z.NEVER;
      }
    }),
    // Handle object JSON
    z.record(z.string(), z.unknown()),
    // Handle array JSON
    z.array(z.unknown()),
  ]),
  sourceUrl: z.string().url('Invalid source URL').optional(),
  extensionId: z.string().optional(),
  // Support both old and new field names for backward compatibility
  source: z.enum(['n8n-node', 'n8n-workflow', 'chrome-extension']).optional(),
  sourceType: z.enum(['n8n-node', 'n8n-workflow', 'chrome-extension']).optional(),
});

type ExtensionSubmitInput = z.infer<typeof extensionSubmitSchema>;

// Type guards
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJsonArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Utility functions
function getSourceType(
  sourceType?: string,
  source?: string
): 'n8n-workflow' | 'n8n-node' {
  const type = sourceType || source;
  if (type === 'n8n-workflow') return 'n8n-workflow';
  return 'n8n-node'; // default
}

function getSourceTitlePrefix(sourceType: 'n8n-workflow' | 'n8n-node'): string {
  return SOURCE_TYPE_TITLES[sourceType] || DEFAULT_TITLE_PREFIX;
}

// Main handler
async function handleExtensionSubmit(
  request: NextRequest,
  body: ExtensionSubmitInput
) {
  const monitor = createPerformanceMonitor();
  const corsHeaders = getCorsHeaders(request);

  // Apply rate limiting
  const rateKey =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  if (!publishLimiter.isAllowed(rateKey)) {
    const reset = publishLimiter.getResetTime(rateKey);
    throw new RateLimitError(
      reset ? Math.ceil((reset.getTime() - Date.now()) / 1000) : undefined,
      'Extension submission rate limit reached. Please try again later.',
      {
        resetTime: reset?.toISOString(),
        remaining: publishLimiter.getRemainingAttempts(rateKey),
      }
    );
  }

  // Validate JSON content structure
  const { jsonData, sourceUrl, extensionId, source, sourceType } = body;

  // Check size for object/array JSON
  if (!(typeof jsonData === 'string')) {
    const jsonSize = JSON.stringify(jsonData).length;
    if (jsonSize > config.performance.maxJsonSizeBytes) {
      throw new FileTooLargeError(config.performance.maxJsonSizeBytes, jsonSize);
    }
  }

  if (!isJsonObject(jsonData) && !isJsonArray(jsonData)) {
    throw new InvalidJsonError('JSON data must be an object or array');
  }

  // Determine source type (support backward compatibility)
  const finalSourceType = getSourceType(sourceType, source);
  const titlePrefix = getSourceTitlePrefix(finalSourceType);

  // Analyze JSON structure
  const analysis = await analyzeJsonStream(jsonData, {
    maxChunkSize: config.performance.jsonStreamingChunkSize,
    trackPaths: false,
    findLargeArrays: false,
  });

  // Audit JSON for issues and recommendations (non-blocking)
  let audit: Awaited<ReturnType<typeof auditJson>> | null = null;
  try {
    audit = await auditJson(jsonData);
  } catch (auditError) {
    // Audit failures shouldn't block the request
    logger.warn({ err: auditError }, 'JSON audit failed, continuing without audit results');
  }

  // Create a temporary share without authentication
  // Set visibility to public and isAnonymous to true for easy access
  // jsonData is validated as object or array above, safe to cast
  const document = await prisma.jsonDocument.create({
    data: {
      title: `${titlePrefix} - ${new Date().toLocaleString()}`,
      content: (isJsonObject(jsonData) ? jsonData : { data: jsonData }) as object,
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
      sourceUrl,
    },
    'Extension JSON submission successful'
  );

  // Return audit results (use fallback if audit failed)
  const auditResult = audit || {
    isValid: true,
    issues: [
      {
        type: 'warning' as const,
        message: 'Audit was unavailable for this submission',
      },
    ],
    stats: {
      size: analysis.size,
      nodeCount: analysis.nodeCount,
      maxDepth: analysis.maxDepth,
      complexity: analysis.complexity,
    },
    recommendations: [],
  };

  return success(
    {
      shareId: document.shareId,
      viewerUrl: `/library/${document.shareId}`,
      stats: {
        size: Number(document.size),
        nodeCount: document.nodeCount,
        maxDepth: document.maxDepth,
        processingTime: performance.duration,
      },
      audit: {
        isValid: auditResult.isValid,
        issues: auditResult.issues,
        recommendations: auditResult.recommendations,
        stats: auditResult.stats,
      },
    },
    { headers: corsHeaders }
  );
}

// Export handlers with middleware
export const POST = withErrorHandler(
  withValidationHandler(
    async (request: NextRequest) => {
      const body = extensionSubmitSchema.parse(await request.json());
      const response = await handleExtensionSubmit(request, body);
      return response;
    },
    {
      // Custom error transformation can be added here if needed
    }
  ),
  {
    logErrors: true,
    includeRequestId: true,
  }
);

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

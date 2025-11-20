import { NextRequest } from 'next/server';
import { z } from 'zod';
import { success, badRequest, tooManyRequests, internalServerError } from '@/lib/api/responses';
import { logger } from '@/lib/logger';
import { tagSuggestLimiter } from '@/lib/middleware/rate-limit';

export const runtime = 'nodejs';

// In-memory buffer for recent vitals (lightweight, ephemeral)
// Keep last 1000 entries or 10 minutes of data, whichever smaller
const VITALS_BUFFER: Array<{
  ts: number;
  name: string;
  value: number;
  id: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
  url?: string;
  route?: string;
  navigationType?: string;
}> = [];

const MAX_BUFFER = 1000;
const MAX_AGE_MS = 10 * 60 * 1000;

const WebVitalSchema = z.object({
  name: z.enum(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']),
  value: z.number(),
  id: z.string(),
  delta: z.number().optional(),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  url: z.string().url().optional(),
  route: z.string().optional(),
  navigationType: z.string().optional(),
  timestamp: z.number().optional(),
});

type WebVital = z.infer<typeof WebVitalSchema>;

function addToBuffer(entry: Omit<WebVital, 'timestamp'> & { ts: number }) {
  const cutoff = Date.now() - MAX_AGE_MS;
  // Trim old
  for (let i = VITALS_BUFFER.length - 1; i >= 0; i--) {
    if (VITALS_BUFFER[i].ts < cutoff) {
      VITALS_BUFFER.splice(i, 1);
    }
  }
  // Enforce max length
  if (VITALS_BUFFER.length >= MAX_BUFFER) {
    VITALS_BUFFER.splice(0, VITALS_BUFFER.length - MAX_BUFFER + 1);
  }
  VITALS_BUFFER.push(entry);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit per IP (reuse tagSuggestLimiter: 60 req/min)
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    if (!tagSuggestLimiter.isAllowed(ip)) {
      const reset = tagSuggestLimiter.getResetTime(ip);
      return tooManyRequests('Too many analytics events', {
        retryAfter: reset ? Math.ceil((reset.getTime() - Date.now()) / 1000) : undefined,
        metadata: { remaining: tagSuggestLimiter.getRemainingAttempts(ip) },
      });
    }

    const body = await request.json();

    const parsed = WebVitalSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Invalid web vitals payload', { details: parsed.error.message });
    }

    const vital = parsed.data;

    // Only store/emit a subset (CLS, LCP, TTFB) for now
    if (!['CLS', 'LCP', 'TTFB'].includes(vital.name)) {
      return success({ received: true, sampled: true }, { status: 202 });
    }

    // Simple client-side sampling hint support
    // If header x-sample-rate provided (0-1), sample accordingly
    const sampleHeader = request.headers.get('x-sample-rate');
    const sampleRate = sampleHeader ? Math.max(0, Math.min(1, Number(sampleHeader))) : 1;
    if (sampleRate < 1 && Math.random() > sampleRate) {
      return success({ received: true, sampled: true }, { status: 202 });
    }

    // Log structured event
    logger.info(
      {
        type: 'web-vital',
        name: vital.name,
        value: Math.round(vital.value),
        id: vital.id,
        rating: vital.rating,
        url: vital.url,
        route: vital.route,
        navigationType: vital.navigationType,
      },
      'Web vital received'
    );

    // Store in memory for short-term inspection
    addToBuffer({
      ts: vital.timestamp ?? Date.now(),
      name: vital.name,
      value: vital.value,
      id: vital.id,
      rating: vital.rating,
      url: vital.url,
      route: vital.route,
      navigationType: vital.navigationType,
    });

    return success({ received: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return internalServerError('Failed to record web vitals');
  }
}

// Optional lightweight health check to see current buffer size (no payload returned)
export async function GET() {
  return success({ count: VITALS_BUFFER.length }, { headers: { 'Cache-Control': 'no-store' } });
}

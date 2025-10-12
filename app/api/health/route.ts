import { NextResponse } from 'next/server';
import { checkDBHealth } from '@/lib/db';

export async function GET() {
  try {
    const health = await checkDBHealth();

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: health.postgres ? 'healthy' : 'unhealthy',
          redis: health.redis ? 'healthy' : 'unhealthy',
        },
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      {
        status: health.postgres && health.redis ? 200 : 503,
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        services: {
          database: 'unhealthy',
          redis: 'unhealthy',
        },
      },
      {
        status: 503,
      }
    );
  }
}

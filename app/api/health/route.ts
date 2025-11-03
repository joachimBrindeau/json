import { checkDBHealth } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, error as errorResponse } from '@/lib/api/responses';
import { config } from '@/lib/config';

export async function GET() {
  try {
    const health = await checkDBHealth();

    const isHealthy = health.postgres && health.redis;
    return success(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: health.postgres ? 'healthy' : 'unhealthy',
          redis: health.redis ? 'healthy' : 'unhealthy',
        },
        version: '1.0.0',
        environment: config.nodeEnv,
      },
      {
        status: isHealthy ? 200 : 503,
      }
    );
  } catch (error) {
    logger.error(
      {
        err: error,
        environment: config.nodeEnv,
      },
      'Health check failed'
    );

    return errorResponse(error instanceof Error ? error.message : 'Health check failed', {
      status: 503,
      metadata: {
        timestamp: new Date().toISOString(),
        services: {
          database: 'unhealthy',
          redis: 'unhealthy',
        },
      },
    });
  }
}

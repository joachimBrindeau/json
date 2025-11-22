import { checkDBHealth } from '@/lib/db';
import { logger } from '@/lib/logger';
import { success, error as errorResponse } from '@/lib/api/responses';
import { config } from '@/lib/config';
import { APP_VERSION } from '@/lib/utils/version';

export async function GET() {
  try {
    const health = await checkDBHealth();

    const isHealthy = health.postgres && health.redis;
    
    const healthData = {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: health.postgres ? 'healthy' : 'unhealthy',
        redis: health.redis ? 'healthy' : 'unhealthy',
      },
      version: APP_VERSION,
      environment: config.nodeEnv,
      healthy: isHealthy,
    };

    // Return 200 if healthy, 503 if unhealthy
    // This allows reverse proxies and orchestrators to properly detect failures
    if (isHealthy) {
      return success(healthData, { status: 200 });
    } else {
      // Return 503 (Service Unavailable) when unhealthy
      // This allows reverse proxies and orchestrators to detect failures
      return success(healthData, { status: 503 });
    }
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

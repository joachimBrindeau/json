/**
 * Centralized logging utility using Pino
 * High-performance, structured logging with Next.js support
 */

import pino from 'pino';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Create Pino logger instance with browser and server support
 */
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isBrowser = typeof window !== 'undefined';

  // Browser configuration - use no-op functions to avoid console logging
  if (isBrowser) {
    return pino({
      level: isDevelopment ? 'debug' : 'info',
      browser: {
        asObject: true,
        serialize: true,
        write: {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
        },
      },
    });
  }

  // Server configuration - use simple console logging to avoid worker thread issues
  return pino({
    level: isDevelopment ? 'debug' : 'info',
    formatters: {
      level: (label: string) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
};

/**
 * Main logger instance
 */
export const logger = createLogger();

// Expose logger to window for inline scripts
if (typeof window !== 'undefined') {
  (window as Window & { __logger?: pino.Logger }).__logger = logger;
}

/**
 * Create a child logger with context
 * Useful for adding consistent context to all logs in a module
 *
 * @example
 * const log = logger.child({ module: 'AuthService' });
 * log.info('User logged in');
 * // Output: { module: 'AuthService', msg: 'User logged in' }
 */
export type { Logger } from 'pino';

/**
 * Helper to ensure error objects are logged properly
 */
export function logError(logger: pino.Logger, message: string, error: unknown, metadata?: object) {
  if (error instanceof Error) {
    logger.error({ err: error, ...metadata }, message);
  } else {
    logger.error({ error: String(error), ...metadata }, message);
  }
}

// Export for backward compatibility during migration
export { logger as default };

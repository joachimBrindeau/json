/**
 * Centralized API client using ky
 * Modern, lightweight fetch wrapper with retry logic and error handling
 */

import ky, { HTTPError, type Options } from 'ky';
import { logger } from '@/lib/logger';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request options extending ky options
 */
export interface RequestOptions extends Options {
  skipErrorHandling?: boolean;
}

/**
 * Create configured ky instance
 */
const api = ky.create({
  timeout: 30000, // 30 seconds
  retry: {
    limit: 3,
    methods: ['get', 'post', 'put', 'patch', 'delete'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 10000,
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // Add auth headers if needed
        if (typeof window !== 'undefined') {
          // Client-side: get token from storage if needed
          // const token = localStorage.getItem('auth-token');
          // if (token) {
          //   request.headers.set('Authorization', `Bearer ${token}`);
          // }
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // Log responses in development
        if (process.env.NODE_ENV === 'development') {
          logger.debug({
            method: request.method,
            url: request.url,
            status: response.status,
          }, 'API Response');
        }
      },
    ],
    beforeRetry: [
      ({ request, error, retryCount }) => {
        logger.warn({
          method: request.method,
          url: request.url,
          error: error.message,
          retryCount,
        }, 'Retrying request');
      },
    ],
  },
});

/**
 * API client with typed methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    try {
      return await api.get(url, options).json<T>();
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    try {
      // Handle FormData separately (don't set json option)
      if (data instanceof FormData) {
        return await api.post(url, { body: data, ...options }).json<T>();
      }
      return await api.post(url, { json: data, ...options }).json<T>();
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    try {
      return await api.put(url, { json: data, ...options }).json<T>();
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    try {
      return await api.delete(url, options).json<T>();
    } catch (error) {
      throw handleError(error);
    }
  },

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    try {
      return await api.patch(url, { json: data, ...options }).json<T>();
    } catch (error) {
      throw handleError(error);
    }
  },
};

/**
 * Handle ky errors and convert to ApiError
 */
function handleError(error: unknown): never {
  if (error instanceof HTTPError) {
    const status = error.response.status;
    let message = error.message;
    let code: string | undefined;
    let details: unknown;

    // Try to parse error response
    error.response.json().then((body: any) => {
      message = body.error || body.message || message;
      code = body.code;
      details = body.details;
    }).catch(() => {
      // Ignore parse errors
    });

    throw new ApiError(message, status, code, details);
  }

  // Handle non-HTTP errors
  if (error instanceof Error) {
    throw new ApiError(error.message, 500);
  }

  throw new ApiError('An unknown error occurred', 500);
}

/**
 * Export ky instance for advanced usage
 */
export { api };

/**
 * Export HTTPError for error handling
 */
export { HTTPError };

/**
 * Create custom API client with different base URL
 */
export function createApiClient(options: Options) {
  return ky.create(options);
}

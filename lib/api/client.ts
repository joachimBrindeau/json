/**
 * Centralized API client using ky
 * Modern, lightweight fetch wrapper with retry logic and error handling
 */

import ky, { HTTPError, type Options } from 'ky';
import { logger } from '@/lib/logger';
import { showErrorToast } from '@/lib/utils/toast-helpers';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    // Maintain legacy statusCode for backward compatibility
    Object.defineProperty(this, 'statusCode', {
      get() {
        return this.status;
      },
      enumerable: true,
    });
  }
}

/**
 * Request options extending ky options
 */
export interface RequestOptions extends Options {
  skipErrorHandling?: boolean;
  skipErrorToast?: boolean;
  errorContext?: string;
}

/**
 * Create configured ky instance
 */
const api = ky.create({
  timeout: 30000, // 30 seconds
  // Ensure cookies (NextAuth session) are sent with requests
  credentials: 'include',
  retry: {
    limit: 3,
    methods: ['get', 'post', 'put', 'patch', 'delete'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    backoffLimit: 10000,
  },
  hooks: {
    beforeRequest: [
      () => {
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
      async (_request, _options, response) => {
        // Log responses in development
        if (process.env.NODE_ENV === 'development') {
          logger.debug(
            {
              method: _request.method,
              url: _request.url,
              status: response.status,
            },
            'API Response'
          );
        }
      },
    ],
    beforeRetry: [
      ({ request, error, retryCount }) => {
        logger.warn(
          {
            method: request.method,
            url: request.url,
            error: error.message,
            retryCount,
          },
          'Retrying request'
        );
      },
    ],
  },
});

/**
 * API client with typed methods and centralized error handling
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    try {
      return await api.get(url, options).json<T>();
    } catch (error) {
      throw handleError(error, `GET ${url}`, options);
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
      throw handleError(error, `POST ${url}`, options);
    }
  },

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    try {
      return await api.put(url, { json: data, ...options }).json<T>();
    } catch (error) {
      throw handleError(error, `PUT ${url}`, options);
    }
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    try {
      return await api.delete(url, options).json<T>();
    } catch (error) {
      throw handleError(error, `DELETE ${url}`, options);
    }
  },

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    try {
      return await api.patch(url, { json: data, ...options }).json<T>();
    } catch (error) {
      throw handleError(error, `PATCH ${url}`, options);
    }
  },
};

/**
 * Handle ky errors and convert to ApiError with centralized logging and toast notifications
 */
async function handleError(
  error: unknown,
  context?: string,
  options?: RequestOptions
): Promise<never> {
  let apiError: ApiError;

  if (error instanceof HTTPError) {
    const status = error.response.status;
    let message = error.message;
    let code: string | undefined;
    let details: unknown;

    // Try to parse error response
    try {
      const body = (await error.response.json()) as {
        error?: string;
        message?: string;
        code?: string;
        details?: unknown;
      };
      message = body.error || body.message || message;
      code = body.code;
      details = body.details;
    } catch {
      // Ignore parse errors
    }

    apiError = new ApiError(message, status, code, details);
  } else if (error instanceof Error) {
    apiError = new ApiError(error.message, 500);
  } else {
    apiError = new ApiError('An unknown error occurred', 500);
  }

  // Centralized logging with context
  const logContext = options?.errorContext || context || 'API call';
  logger.error(
    {
      err: apiError,
      context: logContext,
      status: apiError.status,
      code: apiError.code,
    },
    'API call failed'
  );

  // Show toast for user-facing errors (4xx except auth errors)
  // Skip if explicitly disabled or if it's an auth/forbidden error
  const shouldShowToast =
    !options?.skipErrorToast &&
    apiError.status >= 400 &&
    apiError.status < 500 &&
    ![401, 403].includes(apiError.status);

  if (shouldShowToast) {
    showErrorToast(apiError, logContext);
  }

  throw apiError;
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

import { useState, useCallback } from 'react';
import { showSuccessToast } from '@/lib/utils/toast-helpers';
import type { ApiError } from '@/lib/api/client';

interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: ApiError, variables: TVariables) => void | Promise<void>;
  successMessage?: string;
  showSuccessToast?: boolean;
}

interface UseApiMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: ApiError | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Enhanced API mutation hook with automatic error handling and success toasts
 *
 * Features:
 * - Centralized error handling (logging and toasts handled by apiClient)
 * - Success toast notifications
 * - Loading state management
 * - Error state management
 * - Callback support for success/error cases
 *
 * @example
 * // Basic usage - error handling is automatic via apiClient
 * const { mutate, isLoading } = useApiMutation(
 *   async (data) => apiClient.post('/api/json', data),
 *   { successMessage: 'JSON saved successfully!' }
 * );
 *
 * @example
 * // Advanced usage with callbacks
 * const { mutate, isLoading, error, data } = useApiMutation(
 *   async (id) => apiClient.delete(`/api/json/${id}`),
 *   {
 *     successMessage: 'Document deleted',
 *     onSuccess: () => router.push('/library'),
 *     onError: (error) => console.error('Failed to delete', error)
 *   }
 * );
 *
 * @example
 * // Skip automatic success toast for custom handling
 * const { mutate, isLoading } = useApiMutation(
 *   async (data) => apiClient.post('/api/json', data),
 *   {
 *     showSuccessToast: false,
 *     onSuccess: (data) => {
 *       // Custom success handling
 *       showCustomToast(data);
 *     }
 *   }
 * );
 */
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationReturn<TData, TVariables> {
  const {
    onSuccess,
    onError,
    successMessage,
    showSuccessToast: shouldShowSuccessToast = true
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setError(null);
      setIsLoading(true);

      try {
        // Execute mutation - apiClient handles logging and error toasts automatically
        const result = await mutationFn(variables);
        setData(result);

        // Show success toast if enabled and message provided
        if (shouldShowSuccessToast && successMessage) {
          showSuccessToast(successMessage);
        }

        // Call success callback if provided
        if (onSuccess) {
          await onSuccess(result, variables);
        }

        setIsLoading(false);
        return result;
      } catch (err) {
        // Error already logged and toasted by apiClient
        const apiError = err as ApiError;
        setError(apiError);
        setIsLoading(false);

        // Call error callback if provided
        if (onError) {
          await onError(apiError, variables);
        }

        // Re-throw to allow component-level error handling if needed
        throw apiError;
      }
    },
    [mutationFn, successMessage, onSuccess, onError, shouldShowSuccessToast]
  );

  return {
    mutate,
    isLoading,
    error,
    data,
    reset,
  };
}

/**
 * Convenience hooks for common mutation patterns
 * Note: These use dynamic imports to avoid circular dependencies
 */

export function useApiPost<TData, TVariables = unknown>(
  url: string,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { apiClient } = require('@/lib/api/client');
  return useApiMutation<TData, TVariables>(
    (data) => apiClient.post(url, data),
    options
  );
}

export function useApiPut<TData, TVariables = unknown>(
  url: string | ((vars: TVariables) => string),
  options?: UseApiMutationOptions<TData, TVariables>
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { apiClient } = require('@/lib/api/client');
  return useApiMutation<TData, TVariables>(
    (data) => {
      const endpoint = typeof url === 'function' ? url(data) : url;
      return apiClient.put(endpoint, data);
    },
    options
  );
}

export function useApiDelete<TData, TVariables = string>(
  url: string | ((vars: TVariables) => string),
  options?: UseApiMutationOptions<TData, TVariables>
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { apiClient } = require('@/lib/api/client');
  return useApiMutation<TData, TVariables>(
    (vars) => {
      const endpoint = typeof url === 'function' ? url(vars) : url;
      return apiClient.delete(endpoint);
    },
    options
  );
}

export function useApiPatch<TData, TVariables = unknown>(
  url: string | ((vars: TVariables) => string),
  options?: UseApiMutationOptions<TData, TVariables>
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { apiClient } = require('@/lib/api/client');
  return useApiMutation<TData, TVariables>(
    (data) => {
      const endpoint = typeof url === 'function' ? url(data) : url;
      return apiClient.patch(endpoint, data);
    },
    options
  );
}

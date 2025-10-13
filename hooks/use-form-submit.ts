import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { parseErrorMessage } from '@/lib/utils/toast-helpers';

interface UseFormSubmitOptions<T> {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: Error) => void;
  resetOnSuccess?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseFormSubmitReturn<T> {
  submit: (data: T) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
  reset: () => void;
}

/**
 * Enhanced form submission hook with integrated toast notifications and standardized error handling
 *
 * @example
 * // Basic usage with automatic success toast
 * const { submit, isSubmitting } = useFormSubmit(
 *   async (data) => await api.post('/endpoint', data),
 *   { successMessage: 'Saved successfully!' }
 * );
 *
 * @example
 * // Advanced usage with custom callbacks
 * const { submit, isSubmitting, error } = useFormSubmit(
 *   async (data) => await api.post('/endpoint', data),
 *   {
 *     successMessage: 'Document published!',
 *     errorMessage: 'Failed to publish document',
 *     onSuccess: () => router.push('/library'),
 *     resetOnSuccess: true
 *   }
 * );
 */
export function useFormSubmit<T>(
  submitFn: (data: T) => Promise<void>,
  options: UseFormSubmitOptions<T> = {}
): UseFormSubmitReturn<T> {
  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    resetOnSuccess = false,
    showSuccessToast = true,
    showErrorToast = true
  } = options;

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
  }, []);

  const submit = useCallback(
    async (data: T) => {
      setError(null);
      setIsSubmitting(true);

      try {
        await submitFn(data);

        // Show success toast if enabled
        if (showSuccessToast && successMessage) {
          toast({
            title: successMessage,
            description: 'Your changes have been saved',
          });
        }

        // Call success callback if provided
        if (onSuccess) {
          await onSuccess(data);
        }

        // Reset state if requested
        if (resetOnSuccess) {
          reset();
        } else {
          setIsSubmitting(false);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        const errorMsg = parseErrorMessage(error);

        setError(errorMsg);
        setIsSubmitting(false);

        // Log error for debugging
        logger.error({ err: error }, 'Form submission failed');

        // Show error toast if enabled
        if (showErrorToast) {
          toast({
            title: errorMessage || 'Failed to submit',
            description: errorMsg,
            variant: 'destructive',
          });
        }

        // Call error callback if provided
        if (onError) {
          onError(error);
        }

        // Re-throw to allow component-level error handling if needed
        throw error;
      }
    },
    [submitFn, successMessage, errorMessage, onSuccess, onError, resetOnSuccess, showSuccessToast, showErrorToast, toast, reset]
  );

  return {
    submit,
    isSubmitting,
    error,
    clearError,
    reset,
  };
}

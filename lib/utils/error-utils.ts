'use client';

import { logger } from '@/lib/logger';

// Common error handling patterns
export interface ErrorResult {
  success: false;
  error: string;
}

export interface SuccessResult<T = any> {
  success: true;
  data: T;
}

export type Result<T = any> = SuccessResult<T> | ErrorResult;

// Create consistent error handling wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  errorMessage = 'Operation failed'
) => {
  return async (...args: T): Promise<Result<R>> => {
    try {
      const result = await fn(...args);
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : errorMessage;
      logger.error({ err: error }, errorMessage);
      return { success: false, error: errorMsg };
    }
  };
};

// Common async operation with loading state
export const createAsyncHandler = <T>(
  operation: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
) => {
  return async () => {
    setLoading(true);
    try {
      const result = await operation();
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Operation failed';
      onError?.(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };
};

// Common validation patterns
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateJson = (value: string): string | null => {
  if (!value.trim()) return 'JSON is required';
  try {
    JSON.parse(value);
    return null;
  } catch (error) {
    return 'Invalid JSON format';
  }
};

// Common toast message patterns
export const createToastHandlers = (toast: any) => ({
  success: (title: string, description?: string) =>
    toast({ title, description, variant: 'default' }),

  error: (title: string, description?: string) =>
    toast({ title, description, variant: 'destructive' }),

  info: (title: string, description?: string) => toast({ title, description }),

  // Common patterns
  copySuccess: () => toast({ title: 'Copied', description: 'Content copied to clipboard' }),
  copyError: () =>
    toast({ title: 'Error', description: 'Failed to copy to clipboard', variant: 'destructive' }),
  saveSuccess: () => toast({ title: 'Saved', description: 'Changes saved successfully' }),
  saveError: () =>
    toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive' }),
  deleteSuccess: () => toast({ title: 'Deleted', description: 'Item deleted successfully' }),
  deleteError: () =>
    toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' }),
});

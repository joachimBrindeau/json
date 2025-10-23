/**
 * Toast Helper Utilities
 *
 * Reusable toast notification helpers for common patterns across the application.
 * Provides consistent error handling, message parsing, and notification UX.
 */

import { toast as toastFn } from '@/hooks/use-toast';
import type { ToastActionElement } from '@/components/ui/toast';

/**
 * Parse error objects into user-friendly messages
 * Handles Error instances, strings, and unknown types
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'An unexpected error occurred';
}

// Shared options for toast helpers
export type ToastOptions = { description?: string; action?: ToastActionElement; duration?: number };

/**
 * Internal helper to emit a standard toast
 */
function emitToast(title: string, options?: ToastOptions, variant?: 'destructive' | 'default') {
  return toastFn({
    title,
    description: options?.description,
    action: options?.action,
    duration: options?.duration,
    ...(variant ? { variant } : {}),
  });
}

/**
 * Show a success toast notification
 *
 * @example
 * showSuccessToast('Document saved successfully!');
 *
 * @example
 * showSuccessToast('Published!', {
 *   description: 'Your JSON is now discoverable',
 *   action: <Button>View</Button>
 * });
 */
export function showSuccessToast(message: string, options?: ToastOptions) {
  return emitToast(message, options);
}

/**
 * Show an error toast notification with intelligent error parsing
 *
 * @example
 * showErrorToast(error, 'Failed to save document');
 *
 * @example
 * showErrorToast(new Error('Network error'), 'Failed to load data', {
 *   action: <Button onClick={retry}>Retry</Button>
 * });
 */
export function showErrorToast(
  error: unknown,
  fallbackMessage: string = 'An error occurred',
  options?: {
    action?: ToastActionElement;
    duration?: number;
  }
) {
  const errorMessage = parseErrorMessage(error);

  return toastFn({
    title: fallbackMessage,
    description: errorMessage,
    variant: 'destructive',
    action: options?.action,
    duration: options?.duration,
  });
}

/**
 * Show a warning toast notification
 *
 * @example
 * showWarningToast('This action cannot be undone');
 *
 * @example
 * showWarningToast('Unsaved changes', {
 *   description: 'You have unsaved changes that will be lost',
 *   action: <Button>Save</Button>
 * });
 */
export function showWarningToast(message: string, options?: ToastOptions) {
  return emitToast(message, options);
}

/**
 * Show an info toast notification
 *
 * @example
 * showInfoToast('Processing your request...');
 *
 * @example
 * showInfoToast('New feature available', {
 *   description: 'Check out our new JSON comparison tool',
 *   action: <Button>Learn More</Button>
 * });
 */
export function showInfoToast(message: string, options?: ToastOptions) {
  return emitToast(message, options);
}

/**
 * Show a loading toast notification
 * Returns toast instance for manual dismissal
 *
 * @example
 * const loadingToast = showLoadingToast('Uploading file...');
 * // Later...
 * loadingToast.dismiss();
 * showSuccessToast('Upload complete!');
 */
export function showLoadingToast(
  message: string,
  options?: {
    description?: string;
  }
) {
  return toastFn({
    title: message,
    description: options?.description,
    duration: Infinity, // Don't auto-dismiss loading toasts
  });
}

/**
 * Show a toast notification for successful copy to clipboard
 *
 * @example
 * await navigator.clipboard.writeText(text);
 * showCopySuccessToast();
 *
 * @example
 * showCopySuccessToast('Share link');
 */
export function showCopySuccessToast(itemName: string = 'Content') {
  return toastFn({
    title: 'Copied!',
    description: `${itemName} copied to clipboard`,
    duration: 2000,
  });
}

/**
 * Show a toast notification for API errors with optional retry action
 *
 * @example
 * showApiErrorToast('Failed to fetch users', error);
 *
 * @example
 * // With retry action
 * showApiErrorToast('Failed to fetch users', error, {
 *   action: <Button onClick={retry}>Retry</Button>
 * });
 */
export function showApiErrorToast(
  operation: string,
  error: unknown,
  options?: {
    action?: ToastActionElement;
    duration?: number;
  }
) {
  const errorMessage = parseErrorMessage(error);

  return toastFn({
    title: operation,
    description: errorMessage,
    variant: 'destructive',
    action: options?.action,
    duration: options?.duration || 5000,
  });
}

/**
 * Show a validation error toast for form fields
 *
 * @example
 * showValidationErrorToast('Email is required');
 *
 * @example
 * showValidationErrorToast('Invalid input', 'Please enter a valid email address');
 */
export function showValidationErrorToast(title: string = 'Validation error', description?: string) {
  return toastFn({
    title,
    description: description || 'Please check your input and try again',
    variant: 'destructive',
    duration: 4000,
  });
}

/**
 * Standard Toast Patterns
 *
 * Pre-configured toast notifications for common operations across the application.
 * Provides consistent messaging and behavior for standard actions.
 */
export const toastPatterns = {
  success: {
    saved: (itemName: string = 'Changes') =>
      showSuccessToast('Saved', { description: `${itemName} saved successfully` }),
    deleted: (itemName: string = 'Item') =>
      showSuccessToast('Deleted', { description: `${itemName} deleted successfully` }),
    published: (itemName: string = 'Content') =>
      showSuccessToast('Published successfully!', {
        description: `Your ${itemName} is now discoverable in the public library`,
      }),
    copied: (itemName: string = 'Content') => showCopySuccessToast(itemName),
    updated: (itemName: string = 'Settings') =>
      showSuccessToast('Updated', { description: `${itemName} updated successfully` }),
    uploaded: (itemName: string = 'File') =>
      showSuccessToast('Success', { description: `${itemName} uploaded successfully` }),
    formatted: (itemName: string = 'JSON') =>
      showSuccessToast(`${itemName} formatted successfully`, {
        description: `Your ${itemName} has been properly formatted.`,
      }),
  },
  error: {
    save: (error: unknown, itemName: string = 'changes') =>
      showErrorToast(error, `Failed to save ${itemName}`),
    delete: (error: unknown, itemName: string = 'item') =>
      showErrorToast(error, `Failed to delete ${itemName}`),
    publish: (error: unknown) => showErrorToast(error, 'Failed to publish'),
    load: (error: unknown, itemName: string = 'data') =>
      showErrorToast(error, `Failed to load ${itemName}`),
    upload: (error: unknown) => showErrorToast(error, 'Upload failed'),
    format: () => showErrorToast('Cannot format invalid JSON', 'Format failed'),
    export: (error: unknown) => showErrorToast(error, 'Export failed'),
    copy: () => showErrorToast('Failed to copy to clipboard', 'Copy failed'),
  },
  validation: {
    required: (fieldName: string = 'field') => showValidationErrorToast(`${fieldName} is required`),
    invalid: (fieldName: string = 'Input', details?: string) =>
      showValidationErrorToast(`Invalid ${fieldName}`, details),
    noData: (action: string = 'perform this action') =>
      showValidationErrorToast('No data', `Please enter some data to ${action}`),
    noJson: (action: string) =>
      showValidationErrorToast('No JSON', `Please enter some JSON to ${action}`),
  },
  info: {
    loading: (message: string = 'Loading...') => showLoadingToast(message),
    processing: (action: string = 'your request') => showLoadingToast(`Processing ${action}...`),
  },
} as const;

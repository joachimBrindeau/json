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
export function showSuccessToast(
  message: string,
  options?: {
    description?: string;
    action?: ToastActionElement;
    duration?: number;
  }
) {
  return toastFn({
    title: message,
    description: options?.description,
    action: options?.action,
    duration: options?.duration,
  });
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
export function showWarningToast(
  message: string,
  options?: {
    description?: string;
    action?: ToastActionElement;
    duration?: number;
  }
) {
  return toastFn({
    title: message,
    description: options?.description,
    action: options?.action,
    duration: options?.duration,
  });
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
export function showInfoToast(
  message: string,
  options?: {
    description?: string;
    action?: ToastActionElement;
    duration?: number;
  }
) {
  return toastFn({
    title: message,
    description: options?.description,
    action: options?.action,
    duration: options?.duration,
  });
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
export function showValidationErrorToast(
  title: string = 'Validation error',
  description?: string
) {
  return toastFn({
    title,
    description: description || 'Please check your input and try again',
    variant: 'destructive',
    duration: 4000,
  });
}

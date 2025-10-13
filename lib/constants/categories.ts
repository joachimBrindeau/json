/**
 * Centralized document category constants
 * Used across API routes, forms, and validation
 */

export const DOCUMENT_CATEGORIES = [
  'API Response',
  'Configuration',
  'Database Schema',
  'Test Data',
  'Template',
  'Example',
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

/**
 * Check if a string is a valid document category
 */
export function isValidCategory(category: unknown): category is DocumentCategory {
  return typeof category === 'string' &&
    DOCUMENT_CATEGORIES.includes(category as DocumentCategory);
}

/**
 * Get category validation error message
 */
export function getCategoryValidationError(): string {
  return `Invalid category. Must be one of: ${DOCUMENT_CATEGORIES.join(', ')}`;
}

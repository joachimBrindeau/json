/**
 * Email utility functions
 */

/**
 * Normalizes email by converting to lowercase and trimming whitespace
 * Use this consistently across the app for email validation and storage
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validates basic email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

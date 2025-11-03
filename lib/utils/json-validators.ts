/**
 * JSON Validation Utilities
 * Shared validation functions for JSON data
 */

/**
 * Validates if a string contains valid JSON
 * @param json - String to validate
 * @returns true if valid JSON, false otherwise
 */
export function validateJson(json: string): boolean {
  if (!json.trim()) return false;
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses JSON safely, returning null on error
 * @param json - String to parse
 * @returns Parsed object or null
 */
export function safeParseJson<T = any>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Validates and returns error message if invalid
 * @param json - String to validate
 * @returns null if valid, error message if invalid
 */
export function getJsonError(json: string): string | null {
  if (!json.trim()) return 'Empty JSON';

  try {
    JSON.parse(json);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid JSON';
  }
}

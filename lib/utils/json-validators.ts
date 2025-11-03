/**
 * JSON Validation Utilities
 * Shared validation functions for JSON/YAML data
 */

// Use require to avoid needing @types/js-yaml
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yamlLib: any = require('js-yaml');

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
 * Parses YAML safely, returning null on error
 */
export function safeParseYaml<T = any>(text: string): T | null {
  try {
    const res = yamlLib.load(text);
    return (res as T) ?? null;
  } catch {
    return null;
  }
}

/**
 * Try JSON first; if it fails, try YAML. Returns object or null.
 */
export function safeParseData<T = any>(text: string): T | null {
  if (!text?.trim()) return null;
  const asJson = safeParseJson<T>(text);
  if (asJson !== null) return asJson;
  return safeParseYaml<T>(text);
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

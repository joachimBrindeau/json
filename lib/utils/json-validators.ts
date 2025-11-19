/**
 * JSON Validation Utilities
 * Shared validation functions for JSON/YAML data
 */

// Lazy load js-yaml to avoid issues in client-side code
// This module should only be used on the server-side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yamlLib: { load: (text: string) => unknown } | null | undefined = null;

function getYamlLib() {
  // Always return null on client-side to prevent bundle issues
  // Check for actual browser environment, not just window existence (window can exist in tests)
  if (typeof window !== 'undefined' && typeof process === 'undefined') {
    return null;
  }
  
  if (yamlLib === null) {
    try {
       
      // Required for server-side YAML parsing in Node.js environment
      yamlLib = require('js-yaml');
    } catch {
      // js-yaml not available, will fall back gracefully
      yamlLib = undefined;
    }
  }
  return yamlLib;
}

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
export function safeParseJson<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Parses YAML safely, returning null on error
 */
export function safeParseYaml<T = unknown>(text: string): T | null {
  try {
    const lib = getYamlLib();
    if (!lib || !lib.load) {
      // js-yaml not available, return null
      return null;
    }
    const res = lib.load(text);
    return (res as T) ?? null;
  } catch {
    return null;
  }
}

/**
 * Try JSON first; if it fails, try YAML (server-side only). Returns object or null.
 * On client-side, only attempts JSON parsing to avoid bundling js-yaml.
 */
export function safeParseData<T = unknown>(text: string): T | null {
  if (!text?.trim()) return null;
  const asJson = safeParseJson<T>(text);
  if (asJson !== null) return asJson;
  // Only try YAML on server-side to avoid bundling js-yaml in client code
  // Check for actual browser environment, not just window existence (window can exist in tests)
  if (typeof window === 'undefined' || typeof process !== 'undefined') {
    return safeParseYaml<T>(text);
  }
  return null;
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

/**
 * JSON Type Definitions
 *
 * Provides proper TypeScript types for JSON data structures,
 * replacing the use of `any` throughout the codebase.
 */

/**
 * JSON primitive values
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * JSON object type with string keys
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * JSON array type
 */
export type JsonArray = Array<JsonValue>;

/**
 * Any valid JSON value
 * Use this type instead of `any` when working with JSON data
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Type guard to check if a value is a valid JSON value
 */
export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (type === 'object') {
    return Object.values(value as Record<string, unknown>).every(isJsonValue);
  }

  return false;
}

/**
 * Type guard to check if a value is a JSON object
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a JSON array
 */
export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a JSON primitive
 */
export function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

/**
 * Safely parse JSON with proper type checking
 */
export function parseJson(text: string): JsonValue {
  try {
    const parsed = JSON.parse(text);
    if (!isJsonValue(parsed)) {
      throw new Error('Invalid JSON structure');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safely stringify JSON value
 */
export function stringifyJson(value: JsonValue, pretty = false): string {
  return JSON.stringify(value, null, pretty ? 2 : 0);
}

/**
 * Conversion utilities for node details
 * Pure functions for data transformation
 */

// ============================================================================
// Case Conversion
// ============================================================================

export function toUpperCase(str: string): string {
  return str.toUpperCase();
}

export function toLowerCase(str: string): string {
  return str.toLowerCase();
}

export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join('_');
}

export function toKebabCase(str: string): string {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join('-');
}

export function toPascalCase(str: string): string {
  return str
    .replace(/\W+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// ============================================================================
// Encoding/Decoding
// ============================================================================

export function encodeBase64(str: string): string {
  if (typeof window !== 'undefined') {
    return btoa(str);
  }
  return Buffer.from(str).toString('base64');
}

export function decodeBase64(str: string): string {
  try {
    if (typeof window !== 'undefined') {
      return atob(str);
    }
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch {
    throw new Error('Invalid base64 string');
  }
}

export function encodeURL(str: string): string {
  return encodeURIComponent(str);
}

export function decodeURL(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    throw new Error('Invalid URL-encoded string');
  }
}

export function encodeHTMLEntities(str: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return str.replace(/[&<>"']/g, (char) => entities[char] || char);
}

export function decodeHTMLEntities(str: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };

  return str.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

// ============================================================================
// Hashing
// ============================================================================

export async function hashMD5(str: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await window.crypto.subtle.digest('MD5', data).catch(() => null);

    if (hashBuffer) {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  }

  // Fallback: simple hash (not cryptographically secure)
  return simpleHash(str);
}

export async function hashSHA256(str: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: simple hash (not cryptographically secure)
  return simpleHash(str);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ============================================================================
// Format Conversion
// ============================================================================

export function jsonToYAML(obj: unknown): string {
  // Simple YAML converter (for basic objects)
  // For production, use js-yaml library
  const convert = (value: unknown, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);

    if (value === null) return 'null';
    if (typeof value === 'undefined') return 'undefined';
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') {
      // Quote strings with special characters
      if (/[:\n\r\t]/.test(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return '\n' + value.map((item) => `${spaces}- ${convert(item, indent + 1)}`).join('\n');
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return '{}';
      return (
        '\n' +
        entries
          .map(([key, val]) => {
            const convertedVal = convert(val, indent + 1);
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
              return `${spaces}${key}:${convertedVal}`;
            }
            return `${spaces}${key}: ${convertedVal}`;
          })
          .join('\n')
      );
    }

    return String(value);
  };

  return convert(obj).trim();
}

export function jsonToXML(obj: unknown, rootName: string = 'root'): string {
  const convert = (value: unknown, key: string): string => {
    if (value === null) return `<${key} />`;
    if (typeof value === 'undefined') return '';
    if (typeof value === 'boolean' || typeof value === 'number') {
      return `<${key}>${value}</${key}>`;
    }
    if (typeof value === 'string') {
      const escaped = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      return `<${key}>${escaped}</${key}>`;
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => convert(item, `item`)).join('\n');
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      const children = entries.map(([k, v]) => convert(v, k)).join('\n');
      return `<${key}>\n${children}\n</${key}>`;
    }

    return '';
  };

  return `<?xml version="1.0" encoding="UTF-8"?>\n${convert(obj, rootName)}`;
}

export function jsonToCSV(data: unknown): string {
  if (!Array.isArray(data)) {
    throw new Error('CSV conversion requires an array');
  }

  if (data.length === 0) return '';

  // Get all unique keys
  const keys = Array.from(
    new Set(
      data.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : []))
    )
  );

  // Create header
  const header = keys.join(',');

  // Create rows
  const rows = data.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return String(item);
    }

    return keys
      .map((key) => {
        const value = (item as Record<string, unknown>)[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma or quote
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
        return String(value);
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * JSON parsing hook with error handling and stats
 */

import { useMemo } from 'react';
import type { ParseResult } from './types';

export const useJsonParser = (jsonString: string): ParseResult => {
  return useMemo(() => {
    if (!jsonString?.trim()) {
      return {
        data: null,
        error: null,
        stats: null,
      };
    }

    try {
      // Ensure JSON is available (safety check for production builds)
      if (typeof JSON === 'undefined' || typeof JSON.parse !== 'function') {
        throw new Error('JSON parser is not available');
      }
      const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const data = JSON.parse(jsonString);
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const parseTime = end - start;
      const size = jsonString.length;

      const stats = {
        size,
        type: Array.isArray(data) ? 'array' : typeof data,
        keys: Array.isArray(data)
          ? data.length
          : typeof data === 'object' && data !== null
            ? Object.keys(data).length
            : 0,
        parseTime,
      };

      return {
        data,
        error: null,
        stats,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Invalid JSON',
        stats: null,
      };
    }
  }, [jsonString]);
};

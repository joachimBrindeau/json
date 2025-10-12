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
      const data = JSON.parse(jsonString);
      const size = jsonString.length;
      
      const stats = {
        size,
        type: Array.isArray(data) ? 'array' : typeof data,
        keys: Array.isArray(data)
          ? data.length
          : typeof data === 'object' && data !== null
            ? Object.keys(data).length
            : 0,
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


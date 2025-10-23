/**
 * Shared types for viewer components
 */

import type { JsonValue } from '@/lib/types/json';

export type ViewMode = 'tree' | 'raw' | 'flow' | 'list';

export interface JsonNode {
  id: string;
  key: string;
  value: JsonValue;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  path: string;
  children?: JsonNode[];
  isExpanded?: boolean;
  size: number;
  childCount: number;
}

export interface JsonStats {
  size: number;
  type: string;
  keys: number;
  depth?: number;
  parseTime?: number;
}

export interface ParseResult {
  data: JsonValue | null;
  error: string | null;
  stats: JsonStats | null;
}

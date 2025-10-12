/**
 * Shared types for viewer components
 */

export type ViewMode = 'tree' | 'raw' | 'flow';

export interface JsonNode {
  id: string;
  key: string;
  value: any;
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
}

export interface ParseResult {
  data: any | null;
  error: string | null;
  stats: JsonStats | null;
}


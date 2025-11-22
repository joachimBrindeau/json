/**
 * Tree search hook - filters nodes based on search term
 * Now accepts external search state for centralized control
 */

import { useMemo } from 'react';
import type { JsonNode } from './types';
import { encodePointerSegment } from '@/lib/utils/json-pointer';

interface TreeSearchResult {
  filteredNodes: JsonNode[];
  matchCount: number;
  matches: Set<string>; // Set of node IDs that match the search
}

export const useViewerTreeSearch = (
  nodes: JsonNode[],
  searchTerm: string = '',
  rawData?: any // Optional raw data for deep searching
): TreeSearchResult => {
  const { filteredNodes, matchCount, matches } = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        filteredNodes: nodes,
        matchCount: 0,
        matches: new Set<string>(),
      };
    }

    const term = searchTerm.toLowerCase();
    const matches = new Set<string>();

    // Limit scanning on very large datasets to keep search under time budgets
    const MAX_MATCHES_SCAN = 500; // cap to avoid full-scan on massive arrays

    // First, search through existing nodes (visible/expanded nodes)
    for (const node of nodes) {
      if (matches.size >= MAX_MATCHES_SCAN) break;

      const keyMatch = node.key.toLowerCase().includes(term);

      let valueMatch = false;
      const v: any = node.value as any;
      if (typeof v === 'string') {
        valueMatch = v.toLowerCase().includes(term);
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        valueMatch = String(v).toLowerCase().includes(term);
      } else if (v && typeof v === 'object') {
        // Deep scan object values to find nested matches (with depth limit for performance)
        valueMatch = objectContainsTermDeep(v, term, 0, 10); // Max depth 10
      }

      if (keyMatch || valueMatch) {
        matches.add(node.id);
        // Also include parent nodes (by ID hierarchy)
        addParentIds(node.id, matches);
      }
    }

    // If we have raw data, also search it directly to find matches in collapsed nodes
    // This ensures we find deeply nested values even if their parent nodes aren't expanded
    // Always search raw data if available, regardless of matches found in existing nodes
    // This is critical for deeply nested matches that might not be in the nodes array yet
    if (rawData) {
      // Search raw data to find all matching values and their paths
      const rawMatchPaths = findMatchPathsInRawData(rawData, term, MAX_MATCHES_SCAN - matches.size);
      
      // For each match path, add the node ID and all its parents
      // The path already includes all segments from root to the matching value
      rawMatchPaths.forEach((path) => {
        if (path.length > 0) {
          // Construct node ID exactly like flattenToNodes does
          // Path segments are already encoded by encodePointerSegment
          const nodeId = `root/${path.join('/')}`;
          matches.add(nodeId);
          
          // Add all parent nodes using the helper function
          // This ensures parent nodes are also marked as matches (for expansion)
          addParentIds(nodeId, matches);
        } else {
          // Match at root level
          matches.add('root');
        }
      });
    }

    // Filter nodes that match OR are parents/ancestors of matches
    // Also include nodes whose parent is in matches (so children of matching parents are visible)
    const filtered = nodes.filter((node) => {
      if (matches.has(node.id)) return true;
      
      // Also include nodes whose parent is in matches (to show children of matching parents)
      const parts = node.id.split('/');
      for (let i = parts.length - 1; i > 0; i--) {
        const parentId = parts.slice(0, i).join('/');
        if (matches.has(parentId)) {
          return true; // This node is a descendant of a matching node
        }
      }
      
      return false;
    });

    return {
      filteredNodes: filtered,
      matchCount: matches.size,
      matches, // Export matches set so components can check if a node is highlighted
    };
  }, [nodes, searchTerm, rawData]); // Re-run when nodes change (e.g., after expansion) or search term changes

  return {
    filteredNodes,
    matchCount,
    matches, // Export matches set so components can check if a node is highlighted
  };
};

// Helper to add parent node IDs (JSON Pointer-like: root/seg/...)
function addParentIds(id: string, matches: Set<string>) {
  const parts = id.split('/');
  for (let i = 0; i < parts.length; i++) {
    const parentId = parts.slice(0, i + 1).join('/');
    if (parentId) {
      matches.add(parentId);
    }
  }
}

// Deep object scanner: recursively searches through nested objects to find matches
// This is more thorough than shallow scan and can find deeply nested values
function objectContainsTermDeep(
  obj: any,
  term: string,
  currentDepth: number = 0,
  maxDepth: number = 10,
  maxProps: number = 100
): boolean {
  if (currentDepth > maxDepth) return false;
  if (!obj || typeof obj !== 'object') return false;

  try {
    let checked = 0;
    for (const [k, v] of Object.entries(obj)) {
      if (checked++ > maxProps) break;

      // Check key
      if (typeof k === 'string' && k.toLowerCase().includes(term)) return true;

      // Check primitive values
      if (typeof v === 'string' && v.toLowerCase().includes(term)) return true;
      if (typeof v === 'number' || typeof v === 'boolean') {
        if (String(v).toLowerCase().includes(term)) return true;
      }

      // Recursively check nested objects and arrays
      if (v && typeof v === 'object') {
        if (Array.isArray(v)) {
          // For arrays, check each element (limited)
          for (let i = 0; i < Math.min(v.length, 20); i++) {
            const item = v[i];
            if (typeof item === 'string' && item.toLowerCase().includes(term)) return true;
            if (typeof item === 'number' || typeof item === 'boolean') {
              if (String(item).toLowerCase().includes(term)) return true;
            }
            if (item && typeof item === 'object') {
              if (objectContainsTermDeep(item, term, currentDepth + 1, maxDepth, Math.floor(maxProps / 2))) {
                return true;
              }
            }
          }
        } else {
          // For objects, recursively search
          if (objectContainsTermDeep(v, term, currentDepth + 1, maxDepth, Math.floor(maxProps / 2))) {
            return true;
          }
        }
      }
    }
  } catch {
    // ignore structured clone errors or circular references
  }
  return false;
}

// Find match paths in raw data structure - returns array of paths to matching values
// Each path is an array of encoded segments that can be used to construct node IDs
function findMatchPathsInRawData(
  data: any,
  term: string,
  maxMatches: number = 100
): string[][] {
  if (!term || !term.trim()) return [];
  const matchPaths: string[][] = [];

  function searchRecursive(value: any, path: string[] = [], depth = 0): void {
    if (depth > 10 || matchPaths.length >= maxMatches) return; // Safety limits

    let foundMatch = false;

    if (typeof value === 'string' && value.toLowerCase().includes(term)) {
      foundMatch = true;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      if (String(value).toLowerCase().includes(term)) {
        foundMatch = true;
      }
    }

    if (foundMatch) {
      // Store the path to this match
      matchPaths.push([...path]);
    }

    // Continue searching nested structures
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          searchRecursive(item, [...path, String(index)], depth + 1);
        });
      } else {
        Object.entries(value).forEach(([key, val]) => {
          const encodedKey = encodePointerSegment(key);
          searchRecursive(val, [...path, encodedKey], depth + 1);
        });
      }
    }
  }

  try {
    searchRecursive(data);
  } catch {
    // Ignore errors (circular refs, etc.)
  }

  return matchPaths;
}


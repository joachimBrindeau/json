/**
 * Tree search hook - filters nodes based on search term
 * Now accepts external search state for centralized control
 */

import { useMemo } from 'react';
import type { JsonNode } from './types';

interface TreeSearchResult {
  filteredNodes: JsonNode[];
  matchCount: number;
}

export const useViewerTreeSearch = (nodes: JsonNode[], searchTerm: string = ''): TreeSearchResult => {

  const { filteredNodes, matchCount } = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        filteredNodes: nodes,
        matchCount: 0,
      };
    }

    const term = searchTerm.toLowerCase();
    const matches = new Set<string>();

    // Limit scanning on very large datasets to keep search under time budgets
    const MAX_MATCHES_SCAN = 500; // cap to avoid full-scan on massive arrays

    // Find matching nodes (supports shallow object scanning for performance)
    for (const node of nodes) {
      if (matches.size >= MAX_MATCHES_SCAN) break;

      const keyMatch = node.key.toLowerCase().includes(term);

      let valueMatch = false;
      const v: any = node.value as any;
      if (typeof v === 'string') {
        valueMatch = v.toLowerCase().includes(term);
      } else if (v && typeof v === 'object') {
        // Shallow scan object values to avoid deep traversal costs on large data
        valueMatch = objectContainsTermShallow(v, term);
      }

      if (keyMatch || valueMatch) {
        matches.add(node.id);
        // Also include parent nodes
        addParentNodes(node.path, matches);
      }
    }

    const filtered = nodes.filter(node => matches.has(node.id));

    return {
      filteredNodes: filtered,
      matchCount: matches.size,
    };
  }, [nodes, searchTerm]);

  return {
    filteredNodes,
    matchCount,
  };
};

// Helper to add parent nodes to matches
function addParentNodes(path: string, matches: Set<string>) {
  const parts = path.split('.');
  for (let i = 0; i < parts.length; i++) {
    const parentPath = parts.slice(0, i + 1).join('.');
    if (parentPath) {
      matches.add(parentPath);
    }
  }
}

// Shallow object scanner: checks first-level string/numeric/boolean values and up to one nested level for strings
function objectContainsTermShallow(obj: any, term: string, maxProps: number = 50): boolean {
  try {
    let checked = 0;
    for (const [k, v] of Object.entries(obj)) {
      if (checked++ > maxProps) break;
      if (typeof k === 'string' && k.toLowerCase().includes(term)) return true;
      if (typeof v === 'string' && v.toLowerCase().includes(term)) return true;
      if (typeof v === 'number' || typeof v === 'boolean') {
        if (String(v).toLowerCase().includes(term)) return true;
      }
      if (v && typeof v === 'object') {
        // one level deeper (limited)
        let innerChecked = 0;
        for (const [ik, iv] of Object.entries(v)) {
          if (innerChecked++ > Math.floor(maxProps / 5)) break;
          if (typeof ik === 'string' && ik.toLowerCase().includes(term)) return true;
          if (typeof iv === 'string' && iv.toLowerCase().includes(term)) return true;
          if (typeof iv === 'number' || typeof iv === 'boolean') {
            if (String(iv).toLowerCase().includes(term)) return true;
          }
        }
      }
    }
  } catch {
    // ignore structured clone errors
  }
  return false;
}

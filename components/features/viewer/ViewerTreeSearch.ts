/**
 * Tree search hook - filters nodes based on search term
 */

import { useState, useMemo } from 'react';
import type { JsonNode } from './types';

interface TreeSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredNodes: JsonNode[];
  matchCount: number;
}

export const useViewerTreeSearch = (nodes: JsonNode[]): TreeSearchResult => {
  const [searchTerm, setSearchTerm] = useState('');

  const { filteredNodes, matchCount } = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        filteredNodes: nodes,
        matchCount: 0,
      };
    }

    const term = searchTerm.toLowerCase();
    const matches = new Set<string>();
    
    // Find matching nodes
    nodes.forEach(node => {
      const keyMatch = node.key.toLowerCase().includes(term);
      const valueMatch = 
        typeof node.value === 'string' && 
        node.value.toLowerCase().includes(term);
      
      if (keyMatch || valueMatch) {
        matches.add(node.id);
        // Also include parent nodes
        addParentNodes(node.path, matches);
      }
    });

    const filtered = nodes.filter(node => matches.has(node.id));

    return {
      filteredNodes: filtered,
      matchCount: matches.size,
    };
  }, [nodes, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
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


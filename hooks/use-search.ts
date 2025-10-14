/**
 * Unified Search State Hook
 * Replaces scattered search term state across components
 */

import { useState, useCallback } from 'react';

/**
 * Result object returned by useSearch hook
 */
export interface UseSearchResult {
  /** Current search term value */
  searchTerm: string;
  /** Function to update the search term */
  setSearchTerm: (term: string) => void;
  /** Function to clear the search term */
  clearSearch: () => void;
  /** Boolean indicating if there is an active search */
  hasSearch: boolean;
}

/**
 * Unified search state management hook
 *
 * Provides consistent search state management across all components,
 * replacing scattered useState('searchTerm') patterns.
 *
 * @param initialValue - Initial search term value (default: '')
 * @returns Search state and control functions
 *
 * @example
 * ```tsx
 * const { searchTerm, setSearchTerm, clearSearch, hasSearch } = useSearch();
 *
 * return (
 *   <div>
 *     <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 *     {hasSearch && <button onClick={clearSearch}>Clear</button>}
 *   </div>
 * );
 * ```
 */
export function useSearch(initialValue: string = ''): UseSearchResult {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const hasSearch = searchTerm.trim().length > 0;

  return {
    searchTerm,
    setSearchTerm,
    clearSearch,
    hasSearch,
  };
}

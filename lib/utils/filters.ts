/**
 * Array filtering and sorting utility functions
 * Provides pure, reusable functions for common array operations
 */

/**
 * Filter array by search term matching multiple fields
 * @param items - Array of items to filter
 * @param searchTerm - Search term to match
 * @param fields - Array of field names to search in
 * @returns Filtered array
 * @example
 * filterBySearch(users, 'john', ['name', 'email'])
 * // Returns users where name or email contains 'john'
 */
export function filterBySearch<T extends Record<string, unknown>>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm) return items;

  const lowerSearch = searchTerm.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value == null) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    })
  );
}

/**
 * Sort array by field with direction
 * @param items - Array to sort
 * @param field - Field to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array (new array)
 * @example
 * sortBy(users, 'name', 'asc')
 * sortBy(products, 'price', 'desc')
 */
export function sortBy<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Compare values
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (aVal instanceof Date && bVal instanceof Date) {
      comparison = aVal.getTime() - bVal.getTime();
    } else {
      comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    }

    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Sort array by date field
 * @param items - Array to sort
 * @param dateField - Date field name
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array (new array)
 * @example
 * sortByDate(documents, 'createdAt', 'desc')
 * sortByDate(events, 'startDate', 'asc')
 */
export function sortByDate<T extends Record<string, unknown>>(
  items: T[],
  dateField: keyof T,
  direction: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField] as any);
    const dateB = new Date(b[dateField] as any);

    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    const comparison = dateA.getTime() - dateB.getTime();
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Multi-field sort with priorities
 * @param items - Array to sort
 * @param sortFields - Array of sort configurations
 * @returns Sorted array (new array)
 * @example
 * sortByMultiple(users, [
 *   { field: 'status', direction: 'asc' },
 *   { field: 'name', direction: 'asc' }
 * ])
 */
export function sortByMultiple<T extends Record<string, unknown>>(
  items: T[],
  sortFields: Array<{ field: keyof T; direction: 'asc' | 'desc' }>
): T[] {
  return [...items].sort((a, b) => {
    for (const { field, direction } of sortFields) {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) continue;

      // Handle null/undefined
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Compare
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = aVal < bVal ? -1 : 1;
      }

      return direction === 'asc' ? comparison : -comparison;
    }
    return 0;
  });
}

/**
 * Group array items by field value
 * @param items - Array to group
 * @param field - Field to group by
 * @returns Object with grouped items
 * @example
 * groupBy(users, 'status')
 * // { active: [...], inactive: [...] }
 */
export function groupBy<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const key = String(item[field]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Paginate array
 * @param items - Array to paginate
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Paginated slice and metadata
 * @example
 * paginate(items, 2, 10)
 * // { items: [...], page: 2, pageSize: 10, total: 100, totalPages: 10 }
 */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Filter array by date range
 * @param items - Array to filter
 * @param dateField - Date field name
 * @param startDate - Start of range (inclusive)
 * @param endDate - End of range (inclusive)
 * @returns Filtered array
 * @example
 * filterByDateRange(events, 'createdAt', new Date('2025-01-01'), new Date('2025-12-31'))
 */
export function filterByDateRange<T extends Record<string, unknown>>(
  items: T[],
  dateField: keyof T,
  startDate?: Date,
  endDate?: Date
): T[] {
  return items.filter((item) => {
    const itemDate = new Date(item[dateField] as any);
    if (isNaN(itemDate.getTime())) return false;

    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    return true;
  });
}

/**
 * Filter array by numeric range
 * @param items - Array to filter
 * @param field - Numeric field name
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Filtered array
 * @example
 * filterByRange(products, 'price', 10, 100)
 */
export function filterByRange<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  min?: number,
  max?: number
): T[] {
  return items.filter((item) => {
    const value = Number(item[field]);
    if (isNaN(value)) return false;

    if (min != null && value < min) return false;
    if (max != null && value > max) return false;

    return true;
  });
}

/**
 * Remove duplicates from array by field
 * @param items - Array to deduplicate
 * @param field - Field to check for uniqueness
 * @returns Array with duplicates removed
 * @example
 * uniqueBy(users, 'email')
 */
export function uniqueBy<T extends Record<string, unknown>>(items: T[], field: keyof T): T[] {
  const seen = new Set();
  return items.filter((item) => {
    const value = item[field];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

/**
 * Get array intersection by field
 * @param arr1 - First array
 * @param arr2 - Second array
 * @param field - Field to compare
 * @returns Items present in both arrays
 * @example
 * intersectBy(users1, users2, 'id')
 */
export function intersectBy<T extends Record<string, unknown>>(
  arr1: T[],
  arr2: T[],
  field: keyof T
): T[] {
  const set2 = new Set(arr2.map((item) => item[field]));
  return arr1.filter((item) => set2.has(item[field]));
}

/**
 * Get array difference by field
 * @param arr1 - First array
 * @param arr2 - Second array
 * @param field - Field to compare
 * @returns Items in arr1 but not in arr2
 * @example
 * differenceBy(allUsers, activeUsers, 'id')
 * // Returns inactive users
 */
export function differenceBy<T extends Record<string, unknown>>(
  arr1: T[],
  arr2: T[],
  field: keyof T
): T[] {
  const set2 = new Set(arr2.map((item) => item[field]));
  return arr1.filter((item) => !set2.has(item[field]));
}

/**
 * Chunk array into smaller arrays
 * @param items - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 * @example
 * chunk([1,2,3,4,5], 2)
 * // [[1,2], [3,4], [5]]
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Count occurrences of field values
 * @param items - Array to count
 * @param field - Field to count occurrences of
 * @returns Object with counts
 * @example
 * countBy(users, 'status')
 * // { active: 10, inactive: 5 }
 */
export function countBy<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): Record<string, number> {
  return items.reduce((counts, item) => {
    const key = String(item[field]);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

/**
 * Filter items by tags (all tags must match)
 * @param items - Array with tags field
 * @param requiredTags - Tags that must be present
 * @param tagsField - Name of tags field (default: 'tags')
 * @returns Filtered array
 * @example
 * filterByTags(documents, ['typescript', 'react'], 'tags')
 */
export function filterByTags<T extends Record<string, unknown>>(
  items: T[],
  requiredTags: string[],
  tagsField: keyof T = 'tags' as keyof T
): T[] {
  if (requiredTags.length === 0) return items;

  return items.filter((item) => {
    const itemTags = item[tagsField];
    if (!Array.isArray(itemTags)) return false;

    return requiredTags.every((tag) =>
      itemTags.some((itemTag) => String(itemTag).toLowerCase() === tag.toLowerCase())
    );
  });
}

/**
 * Sort by relevance score (best match first)
 * @param items - Array to sort
 * @param searchTerm - Search term
 * @param fields - Fields to search for relevance
 * @returns Sorted array by relevance
 * @example
 * sortByRelevance(documents, 'react', ['title', 'description'])
 */
export function sortByRelevance<T extends Record<string, unknown>>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm) return items;

  const lowerSearch = searchTerm.toLowerCase();

  return [...items].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    for (const field of fields) {
      const aVal = String(a[field] || '').toLowerCase();
      const bVal = String(b[field] || '').toLowerCase();

      // Exact match = 100 points
      if (aVal === lowerSearch) scoreA += 100;
      if (bVal === lowerSearch) scoreB += 100;

      // Starts with = 50 points
      if (aVal.startsWith(lowerSearch)) scoreA += 50;
      if (bVal.startsWith(lowerSearch)) scoreB += 50;

      // Contains = 10 points
      if (aVal.includes(lowerSearch)) scoreA += 10;
      if (bVal.includes(lowerSearch)) scoreB += 10;
    }

    return scoreB - scoreA; // Higher score first
  });
}

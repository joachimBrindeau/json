/**
 * JSON comparison and diff utilities
 */

import type { JsonValue } from '@/lib/api/types';

export interface DiffOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: JsonValue;
  oldValue?: JsonValue;
  from?: string;
}

export interface DiffResult {
  operations: DiffOperation[];
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
  hasChanges: boolean;
}

/**
 * Deep comparison of two values
 */
export function deepEqual(a: JsonValue, b: JsonValue): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Get the type of a value for comparison
 */
function getValueType(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Escape JSON pointer path components
 */
function escapePathComponent(component: string): string {
  return component.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Create a JSON pointer path
 */
function createPath(segments: (string | number)[]): string {
  if (segments.length === 0) return '';
  return '/' + segments.map(segment => escapePathComponent(String(segment))).join('/');
}

/**
 * Compare two JSON objects and generate diff operations
 */
export function compareJson(oldJson: JsonValue, newJson: JsonValue): DiffResult {
  const operations: DiffOperation[] = [];
  const summary = {
    added: 0,
    removed: 0,
    changed: 0,
    unchanged: 0,
  };

  function compare(oldVal: JsonValue, newVal: JsonValue, path: (string | number)[] = []): void {
    const currentPath = createPath(path);

    // Direct equality check
    if (deepEqual(oldVal, newVal)) {
      summary.unchanged++;
      return;
    }

    // Type changed or value replaced
    const oldType = getValueType(oldVal);
    const newType = getValueType(newVal);

    if (oldType !== newType) {
      operations.push({
        op: 'replace',
        path: currentPath,
        value: newVal,
        oldValue: oldVal,
      });
      summary.changed++;
      return;
    }

    // Handle arrays
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      const maxLength = Math.max(oldVal.length, newVal.length);
      
      for (let i = 0; i < maxLength; i++) {
        if (i >= oldVal.length) {
          // Item added
          operations.push({
            op: 'add',
            path: createPath([...path, i]),
            value: newVal[i],
          });
          summary.added++;
        } else if (i >= newVal.length) {
          // Item removed
          operations.push({
            op: 'remove',
            path: createPath([...path, i]),
            oldValue: oldVal[i],
          });
          summary.removed++;
        } else {
          // Compare items
          compare(oldVal[i], newVal[i], [...path, i]);
        }
      }
      return;
    }

    // Handle objects
    if (typeof oldVal === 'object' && typeof newVal === 'object' && oldVal && newVal) {
      const oldKeys = new Set(Object.keys(oldVal));
      const newKeys = new Set(Object.keys(newVal));
      const allKeys = new Set([...oldKeys, ...newKeys]);

      for (const key of allKeys) {
        if (!oldKeys.has(key)) {
          // Property added
          operations.push({
            op: 'add',
            path: createPath([...path, key]),
            value: newVal[key],
          });
          summary.added++;
        } else if (!newKeys.has(key)) {
          // Property removed
          operations.push({
            op: 'remove',
            path: createPath([...path, key]),
            oldValue: oldVal[key],
          });
          summary.removed++;
        } else {
          // Compare property values
          compare(oldVal[key], newVal[key], [...path, key]);
        }
      }
      return;
    }

    // Primitive values that are different
    operations.push({
      op: 'replace',
      path: currentPath,
      value: newVal,
      oldValue: oldVal,
    });
    summary.changed++;
  }

  compare(oldJson, newJson);

  return {
    operations,
    summary,
    hasChanges: operations.length > 0,
  };
}

/**
 * Apply diff operations to a JSON object
 */
export function applyDiff(json: JsonValue, operations: DiffOperation[]): JsonValue {
  const result = JSON.parse(JSON.stringify(json)); // Deep clone

  for (const op of operations) {
    const pathSegments = op.path === '' ? [] : op.path.slice(1).split('/').map(segment => 
      segment.replace(/~1/g, '/').replace(/~0/g, '~')
    );

    switch (op.op) {
      case 'add':
      case 'replace':
        setValueAtPath(result, pathSegments, op.value);
        break;
      
      case 'remove':
        removeValueAtPath(result, pathSegments);
        break;
    }
  }

  return result;
}

/**
 * Set a value at a specific path in an object
 */
function setValueAtPath(obj: JsonValue, path: string[], value: JsonValue): void {
  if (path.length === 0) {
    return; // Can't replace root
  }

  let current = obj;
  
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    
    if (!(segment in current)) {
      // Determine if next segment is array index or object key
      const nextSegment = path[i + 1];
      const isArrayIndex = /^\d+$/.test(nextSegment);
      current[segment] = isArrayIndex ? [] : {};
    }
    
    current = current[segment];
  }
  
  const lastSegment = path[path.length - 1];
  current[lastSegment] = value;
}

/**
 * Remove a value at a specific path in an object
 */
function removeValueAtPath(obj: JsonValue, path: string[]): void {
  if (path.length === 0) {
    return; // Can't remove root
  }

  let current = obj;
  
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!(segment in current)) {
      return; // Path doesn't exist
    }
    current = current[segment];
  }
  
  const lastSegment = path[path.length - 1];
  
  if (Array.isArray(current)) {
    const index = parseInt(lastSegment, 10);
    if (!isNaN(index) && index >= 0 && index < current.length) {
      current.splice(index, 1);
    }
  } else if (typeof current === 'object' && current !== null) {
    delete current[lastSegment];
  }
}

/**
 * Generate a human-readable summary of changes
 */
export function generateDiffSummary(diff: DiffResult): string {
  if (!diff.hasChanges) {
    return 'No differences found - the JSON objects are identical.';
  }

  const parts: string[] = [];
  
  if (diff.summary.added > 0) {
    parts.push(`${diff.summary.added} addition${diff.summary.added === 1 ? '' : 's'}`);
  }
  
  if (diff.summary.removed > 0) {
    parts.push(`${diff.summary.removed} deletion${diff.summary.removed === 1 ? '' : 's'}`);
  }
  
  if (diff.summary.changed > 0) {
    parts.push(`${diff.summary.changed} modification${diff.summary.changed === 1 ? '' : 's'}`);
  }

  const totalChanges = diff.summary.added + diff.summary.removed + diff.summary.changed;
  const totalItems = totalChanges + diff.summary.unchanged;
  
  const summary = parts.join(', ');
  return `Found ${summary} out of ${totalItems} total item${totalItems === 1 ? '' : 's'}.`;
}

/**
 * Format a diff operation for display
 */
export function formatDiffOperation(op: DiffOperation): string {
  const path = op.path || '(root)';
  
  switch (op.op) {
    case 'add':
      return `Added: ${path} = ${JSON.stringify(op.value)}`;
    
    case 'remove':
      return `Removed: ${path} (was ${JSON.stringify(op.oldValue)})`;
    
    case 'replace':
      return `Changed: ${path} from ${JSON.stringify(op.oldValue)} to ${JSON.stringify(op.value)}`;
    
    default:
      return `${op.op}: ${path}`;
  }
}
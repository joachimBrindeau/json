import { describe, it, expect } from 'vitest';

import { collectAllPointerIds } from '@/hooks/use-tree-expansion';
import { encodePointerSegment, decodePointerSegment } from '@/lib/utils/json-pointer';

// Helper to stabilize set comparison
function setToArray(s: Set<string>): string[] {
  return Array.from(s).sort();
}

describe('useTreeExpansion helpers', () => {
  it('collectAllPointerIds produces JSON Pointer-like ids with ~0/~1 escaping', () => {
    const data = {
      'a.b': {
        'c/d': [1, { '~e': 2 }],
      },
    } as const;

    const result = collectAllPointerIds(data);
    const actual = setToArray(result);

    const expected = setToArray(
      new Set<string>([
        'root',
        'root/a.b',          // dot is not special for JSON Pointer
        'root/a.b/c~1d',     // '/' encoded as ~1
        'root/a.b/c~1d/0',
        'root/a.b/c~1d/1',
        'root/a.b/c~1d/1/~0e', // '~' encoded as ~0
      ])
    );

    expect(actual).toEqual(expected);
  });

  it('encodePointerSegment and decodePointerSegment roundtrip', () => {
    const original = '~weird/key~with/slashes~and/tilde~';
    const encoded = encodePointerSegment(original);
    const decoded = decodePointerSegment(encoded);

    expect(encoded).toContain('~0');
    expect(encoded).toContain('~1');
    expect(decoded).toBe(original);
  });
});


/*
 * JSON Pointer (RFC 6901) helpers with a stable root id of 'root'.
 * Escaping: ~ -> ~0, / -> ~1
 */

export const ROOT_ID = 'root';

export function encodePointerSegment(seg: string): string {
  return String(seg).replace(/~/g, '~0').replace(/\//g, '~1');
}

export function decodePointerSegment(seg: string): string {
  return String(seg).replace(/~1/g, '/').replace(/~0/g, '~');
}

export function joinPointer(parentId: string, key: string): string {
  const base = parentId || ROOT_ID;
  return `${base}/${encodePointerSegment(key)}`;
}

export function joinPointerIndex(parentId: string, index: number): string {
  const base = parentId || ROOT_ID;
  return `${base}/${index}`;
}

export function splitPointer(id: string): string[] {
  return id.split('/');
}

export function parentChain(id: string): string[] {
  const parts = splitPointer(id);
  const chain: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    chain.push(parts.slice(0, i + 1).join('/'));
  }
  return chain;
}


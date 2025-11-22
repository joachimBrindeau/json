/**
 * Unit tests for JSON audit utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditJson } from '../audit';

// Mock analyzeJsonStream
vi.mock('../json-processor', () => ({
  analyzeJsonStream: vi.fn(),
}));

import { analyzeJsonStream } from '../json-processor';

describe('auditJson', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return invalid result for invalid JSON string', async () => {
    const result = await auditJson('{ invalid json }');
    
    expect(result.isValid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe('error');
    expect(result.stats.nodeCount).toBe(0);
  });

  it('should detect empty object', async () => {
    vi.mocked(analyzeJsonStream).mockResolvedValue({
      size: 2,
      nodeCount: 1,
      maxDepth: 0,
      complexity: 'Low',
      checksum: 'test',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    });

    const result = await auditJson({});
    
    expect(result.isValid).toBe(true);
    expect(result.issues.some(i => i.message === 'Empty object')).toBe(true);
  });

  it('should detect empty array', async () => {
    vi.mocked(analyzeJsonStream).mockResolvedValue({
      size: 2,
      nodeCount: 1,
      maxDepth: 0,
      complexity: 'Low',
      checksum: 'test',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    });

    const result = await auditJson([]);
    
    expect(result.isValid).toBe(true);
    expect(result.issues.some(i => i.message === 'Empty array')).toBe(true);
  });

  it('should detect deep nesting', async () => {
    vi.mocked(analyzeJsonStream).mockResolvedValue({
      size: 1000,
      nodeCount: 100,
      maxDepth: 20,
      complexity: 'High',
      checksum: 'test',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    });

    const result = await auditJson({ nested: { deeply: { nested: { object: true } } } });
    
    expect(result.isValid).toBe(true);
    expect(result.issues.some(i => i.message.includes('deep nesting'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('flattening'))).toBe(true);
  });

  it('should detect large arrays', async () => {
    vi.mocked(analyzeJsonStream).mockResolvedValue({
      size: 10000,
      nodeCount: 1000,
      maxDepth: 2,
      complexity: 'Medium',
      checksum: 'test',
      paths: [],
      largeArrays: [{ path: '$.items', size: 5000 }],
      deepObjects: [],
    });

    const result = await auditJson({ items: new Array(5000).fill(0) });
    
    expect(result.isValid).toBe(true);
    expect(result.issues.some(i => i.message.includes('Large array'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('pagination'))).toBe(true);
  });

  it('should detect high complexity', async () => {
    vi.mocked(analyzeJsonStream).mockResolvedValue({
      size: 100000,
      nodeCount: 15000,
      maxDepth: 5,
      complexity: 'High',
      checksum: 'test',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    });

    const result = await auditJson({ data: 'large' });
    
    expect(result.isValid).toBe(true);
    expect(result.recommendations.some(r => r.includes('tree view'))).toBe(true);
    expect(result.recommendations.some(r => r.includes('chunking'))).toBe(true);
  });

  it('should handle null root value', async () => {
    vi.mocked(analyzeJsonStream).mockResolvedValue({
      size: 4,
      nodeCount: 1,
      maxDepth: 0,
      complexity: 'Low',
      checksum: 'test',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    });

    // Pass null as object (JSON.parse('null') returns null)
    const result = await auditJson(JSON.parse('null'));
    
    expect(result.isValid).toBe(true);
    expect(result.issues.some(i => i.message.includes('null'))).toBe(true);
  });

  it('should handle primitive root values', async () => {
    vi.mocked(analyzeJsonStream).mockResolvedValue({
      size: 5,
      nodeCount: 1,
      maxDepth: 0,
      complexity: 'Low',
      checksum: 'test',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    });

    // Pass valid JSON string (quoted) or pass the primitive value directly
    const result = await auditJson('"hello"');
    
    expect(result.isValid).toBe(true);
    expect(result.issues.some(i => i.message.includes('string'))).toBe(true);
  });

  it('should return valid result for normal JSON object', async () => {
    vi.mocked(analyzeJsonStream).mockResolvedValue({
      size: 100,
      nodeCount: 10,
      maxDepth: 2,
      complexity: 'Low',
      checksum: 'test',
      paths: [],
      largeArrays: [],
      deepObjects: [],
    });

    const result = await auditJson({ name: 'test', value: 123 });
    
    expect(result.isValid).toBe(true);
    expect(result.issues.length).toBe(0);
    expect(result.stats.complexity).toBe('Low');
  });
});


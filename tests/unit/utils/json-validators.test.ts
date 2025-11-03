import { describe, it, expect } from 'vitest';
import { safeParseJson, safeParseYaml, safeParseData, validateJson } from '@/lib/utils/json-validators';

describe('json-validators', () => {
  it('safeParseJson returns object for valid JSON and null for invalid', () => {
    expect(safeParseJson('{"a":1}')).toEqual({ a: 1 });
    expect(safeParseJson('not json')).toBeNull();
  });

  it('safeParseYaml parses simple YAML', () => {
    const yaml = 'project: demo\nitems:\n  - id: 1\n  - id: 2';
    expect(safeParseYaml(yaml)).toEqual({ project: 'demo', items: [{ id: 1 }, { id: 2 }] });
  });

  it('safeParseData prefers JSON but falls back to YAML', () => {
    const yaml = 'name: test\nvalue: 42';
    const json = '{"name":"j","value":1}';
    expect(safeParseData(json)).toEqual({ name: 'j', value: 1 });
    expect(safeParseData(yaml)).toEqual({ name: 'test', value: 42 });
  });

  it('validateJson detects valid JSON only', () => {
    expect(validateJson('{"a":1}')).toBe(true);
    expect(validateJson('name: test')).toBe(false);
    expect(validateJson('')).toBe(false);
  });
});


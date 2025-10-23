import { describe, it, expect } from 'vitest';
import { validateAndBuildCreateInput } from '@/lib/api/handlers/document-create';
import { ValidationError } from '@/lib/utils/app-errors';

describe('validateAndBuildCreateInput', () => {
  it('returns normalized payload for valid input', () => {
    const out = validateAndBuildCreateInput({
      title: '  My Title  ',
      description: '  My Desc  ',
      content: { a: 1 },
      category: undefined,
      tags: ['a', 'b'],
      richContent: 'x',
    });
    expect(out).toEqual({
      title: 'My Title',
      description: 'My Desc',
      content: { a: 1 },
      category: undefined,
      tags: ['a', 'b'],
      richContent: 'x',
    });
  });

  it('defaults description, content, category, tags, richContent when missing', () => {
    const out = validateAndBuildCreateInput({ title: 'T' });
    expect(out).toEqual({
      title: 'T',
      description: '',
      content: '{}',
      category: undefined,
      tags: [],
      richContent: '',
    });
  });

  it('throws ValidationError when title missing/blank', () => {
    expect(() => validateAndBuildCreateInput({})).toThrow(ValidationError);
    expect(() => validateAndBuildCreateInput({ title: '   ' })).toThrow(ValidationError);
  });

  it('throws ValidationError when category invalid', () => {
    expect(() =>
      validateAndBuildCreateInput({ title: 'T', category: 'not-a-valid-category' as any })
    ).toThrow(ValidationError);
  });
});

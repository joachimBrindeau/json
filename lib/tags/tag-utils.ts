/**
 * Tag normalization and validation utilities
 * Prevents spam, duplicates, and ensures tag quality
 * Uses external libraries to reduce custom code
 */

import fuzzysort from 'fuzzysort';

// Simple profanity filter without external dependency (currently unused, kept for future use)
// class SimpleProfanityFilter {
//   private badWords = new Set([
//     'spam',
//     'abuse',
//     'hate',
//     'violence',
//     'drug',
//     'porn',
//     'xxx',
//     'scam',
//     'illegal',
//     'hack',
//     'crack',
//     'pirate',
//     'torrent',
//   ]);

//   isProfane(text: string): boolean {
//     const lower = text.toLowerCase();
//     for (const word of this.badWords) {
//       if (lower.includes(word)) return true;
//     }
//     return false;
//   }
// }

// Common programming language mappings
const LANGUAGE_MAPPINGS: Record<string, string> = {
  javascript: 'javascript',
  js: 'javascript',
  node: 'nodejs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  typescript: 'typescript',
  ts: 'typescript',
  python: 'python',
  py: 'python',
  cpp: 'cpp',
  'c++': 'cpp',
  cplusplus: 'cpp',
  csharp: 'csharp',
  'c#': 'csharp',
  dotnet: 'dotnet',
  '.net': 'dotnet',
  golang: 'go',
  go: 'go',
  rust: 'rust',
  rs: 'rust',
  ruby: 'ruby',
  rb: 'ruby',
  java: 'java',
  kotlin: 'kotlin',
  kt: 'kotlin',
  swift: 'swift',
  'objective-c': 'objc',
  objc: 'objc',
  php: 'php',
  perl: 'perl',
  sql: 'sql',
  mysql: 'mysql',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  redis: 'redis',
  docker: 'docker',
  kubernetes: 'kubernetes',
  k8s: 'kubernetes',
  aws: 'aws',
  azure: 'azure',
  gcp: 'gcp',
  react: 'react',
  reactjs: 'react',
  'react.js': 'react',
  vue: 'vue',
  vuejs: 'vue',
  'vue.js': 'vue',
  angular: 'angular',
  svelte: 'svelte',
  nextjs: 'nextjs',
  'next.js': 'nextjs',
  gatsby: 'gatsby',
  express: 'express',
  expressjs: 'express',
  fastapi: 'fastapi',
  django: 'django',
  flask: 'flask',
  rails: 'rails',
  laravel: 'laravel',
  spring: 'spring',
  springboot: 'springboot',
};

// Additional blocked words beyond what bad-words provides
const ADDITIONAL_BLOCKED_WORDS = new Set([
  'test',
  'testing',
  'asdf',
  'qwerty',
  'temp',
  'tmp',
  'delete',
  'spam',
  'junk',
  'garbage',
  'trash',
  'dummy',
  'sample',
  'example',
  'demo',
]);

// Reserved system tags
const RESERVED_TAGS = new Set([
  'admin',
  'system',
  'official',
  'verified',
  'featured',
  'trending',
  'popular',
  'new',
  'hot',
  'top',
  'best',
]);

export interface TagValidationResult {
  isValid: boolean;
  normalized?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Normalizes a tag string according to our rules
 */
export function normalizeTag(tag: string): string {
  if (!tag) return '';

  // Convert to lowercase and trim
  let normalized = tag.toLowerCase().trim();

  // Replace multiple spaces/underscores with single hyphen
  normalized = normalized.replace(/[\s_]+/g, '-');

  // Remove special characters except hyphens and dots
  // Keep dots for version numbers (e.g., "vue.3")
  normalized = normalized.replace(/[^a-z0-9\-\.]/g, '');

  // Remove leading/trailing hyphens and dots
  normalized = normalized.replace(/^[\-\.]+|[\-\.]+$/g, '');

  // Replace multiple consecutive hyphens with single hyphen
  normalized = normalized.replace(/\-+/g, '-');

  // Apply language mappings
  if (LANGUAGE_MAPPINGS[normalized]) {
    normalized = LANGUAGE_MAPPINGS[normalized];
  }

  return normalized;
}

/**
 * Checks if a tag contains spam patterns
 */
export function isSpamTag(tag: string): boolean {
  const normalized = normalizeTag(tag);

  // Check if it's a blocked word
  if (ADDITIONAL_BLOCKED_WORDS.has(normalized)) {
    return true;
  }

  // Check for repetitive characters (e.g., "aaaaaa", "abcabc")
  if (/(.)\1{4,}/.test(normalized)) {
    return true;
  }

  // Check for keyboard mashing patterns
  const keyboardPatterns = [
    /^[qwerty]+$/i,
    /^[asdf]+$/i,
    /^[zxcv]+$/i,
    /^[hjkl]+$/i,
    /^[123456789]+$/,
    /^[abcd]+$/i,
  ];

  if (keyboardPatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  // Check if it's just numbers (unless it's a version like "v1" or "2023")
  if (/^\d+$/.test(normalized) && normalized.length > 4) {
    return true;
  }

  // Check for gibberish (consonant/vowel ratio)
  const vowels = normalized.match(/[aeiou]/g)?.length || 0;
  const consonants = normalized.match(/[bcdfghjklmnpqrstvwxyz]/g)?.length || 0;
  const totalLetters = vowels + consonants;

  if (totalLetters > 5) {
    const vowelRatio = vowels / totalLetters;
    // Tags with very few or very many vowels are likely gibberish
    if (vowelRatio < 0.15 || vowelRatio > 0.75) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a single tag
 */
export function validateTag(tag: string, existingTags: string[] = []): TagValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!tag || tag.trim().length === 0) {
    errors.push('Tag cannot be empty');
    return { isValid: false, errors, warnings };
  }

  const normalized = normalizeTag(tag);

  // Length validation (after normalization)
  if (normalized.length < 2) {
    errors.push('Tag must be at least 2 characters long');
  } else if (normalized.length > 30) {
    errors.push('Tag must be no more than 30 characters long');
  }

  // Check for reserved tags
  if (RESERVED_TAGS.has(normalized)) {
    errors.push(`"${normalized}" is a reserved system tag`);
  }

  // Check for spam
  if (isSpamTag(normalized)) {
    errors.push('This tag appears to be spam or invalid');
  }

  // Check for duplicates in existing tags (normalized comparison)
  const normalizedExisting = existingTags.map((t) => normalizeTag(t));
  if (normalizedExisting.includes(normalized)) {
    errors.push(`Tag "${normalized}" already exists`);
  }

  // Warnings for similar tags
  const similarTags = findSimilarTags(normalized, normalizedExisting);
  if (similarTags.length > 0) {
    warnings.push(`Similar tags exist: ${similarTags.join(', ')}`);
  }

  // Check tag pattern
  if (!/^[a-z0-9][a-z0-9\-\.]*[a-z0-9]$/.test(normalized) && normalized.length > 1) {
    errors.push('Tag must start and end with a letter or number');
  }

  return {
    isValid: errors.length === 0,
    normalized,
    errors,
    warnings,
  };
}

/**
 * Validates multiple tags at once
 */
export function validateTags(tags: string[]): {
  validTags: string[];
  invalidTags: { tag: string; errors: string[] }[];
  warnings: string[];
} {
  const validTags: string[] = [];
  const invalidTags: { tag: string; errors: string[] }[] = [];
  const warnings: string[] = [];
  const normalizedSet = new Set<string>();

  for (const tag of tags) {
    const result = validateTag(tag, Array.from(normalizedSet));

    if (result.isValid && result.normalized) {
      if (!normalizedSet.has(result.normalized)) {
        validTags.push(result.normalized);
        normalizedSet.add(result.normalized);
      }
    } else {
      invalidTags.push({ tag, errors: result.errors });
    }

    if (result.warnings.length > 0) {
      warnings.push(...result.warnings);
    }
  }

  return { validTags, invalidTags, warnings };
}

/**
 * Finds tags similar to the given tag using fuzzy search
 */
export function findSimilarTags(tag: string, existingTags: string[]): string[] {
  const normalized = normalizeTag(tag);

  // Use fuzzysort for better fuzzy matching
  const results = fuzzysort.go(normalized, existingTags, {
    threshold: -10000, // Include more results
    limit: 10, // Limit to top 10
    all: false, // Don't include perfect matches
  });

  // Filter and map results
  const similar = results
    .filter((result) => {
      const score = result.score;
      // Higher scores are better in fuzzysort (0 is perfect match, negative is less similar)
      return score > -2000 && result.target !== normalized;
    })
    .map((result) => result.target);

  return similar.slice(0, 3); // Return top 3 similar tags
}

/**
 * Suggests tags based on partial input using fuzzy search
 */
export function suggestTags(
  input: string,
  availableTags: string[],
  maxSuggestions: number = 10
): string[] {
  if (!input || input.length < 2) return [];

  const normalized = normalizeTag(input);

  // Use fuzzysort for intelligent fuzzy matching
  const results = fuzzysort.go(normalized, availableTags, {
    limit: maxSuggestions * 2, // Get more results to filter
    threshold: -10000, // Include partial matches
  });

  // Map and deduplicate results
  const suggestions = new Set<string>();

  for (const result of results) {
    const tagNorm = normalizeTag(result.target);

    // Add normalized version
    suggestions.add(tagNorm);

    // Stop when we have enough
    if (suggestions.size >= maxSuggestions) break;
  }

  return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Get common tags for a category
 */
export function getCommonTagsForCategory(category: string): string[] {
  const categoryTags: Record<string, string[]> = {
    'API Response': ['api', 'rest', 'graphql', 'json', 'response', 'endpoint', 'http', 'webhook'],
    Configuration: ['config', 'settings', 'env', 'yaml', 'toml', 'ini', 'docker', 'kubernetes'],
    'Database Schema': [
      'database',
      'schema',
      'sql',
      'nosql',
      'mongodb',
      'postgresql',
      'mysql',
      'migration',
    ],
    'Test Data': ['test', 'mock', 'fixture', 'seed', 'sample', 'qa', 'unit-test', 'e2e'],
    Template: ['template', 'boilerplate', 'starter', 'scaffold', 'generator', 'blueprint'],
    Example: ['example', 'tutorial', 'demo', 'guide', 'documentation', 'learning'],
  };

  return categoryTags[category] || [];
}

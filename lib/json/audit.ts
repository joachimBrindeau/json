/**
 * Simple JSON audit utility
 * Validates JSON structure and provides feedback
 */

import { analyzeJsonStream } from './json-processor';
import type { JsonValue } from '@/lib/api/types';

export interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  path?: string;
}

export interface AuditResult {
  isValid: boolean;
  issues: AuditIssue[];
  stats: {
    size: number;
    nodeCount: number;
    maxDepth: number;
    complexity: 'Low' | 'Medium' | 'High';
  };
  recommendations: string[];
}

/**
 * Audit JSON data - simple validation and analysis
 */
export async function auditJson(
  jsonData: string | object | null
): Promise<AuditResult> {
  const issues: AuditIssue[] = [];
  const recommendations: string[] = [];

  // Parse JSON
  let parsed: JsonValue;
  try {
    if (jsonData === null) {
      parsed = null;
    } else if (typeof jsonData === 'string') {
      parsed = JSON.parse(jsonData);
    } else {
      parsed = jsonData as JsonValue;
    }
  } catch (error) {
    return {
      isValid: false,
      issues: [
        {
          type: 'error',
          message: error instanceof Error ? error.message : 'Invalid JSON format',
        },
      ],
      stats: {
        size: 0,
        nodeCount: 0,
        maxDepth: 0,
        complexity: 'Low',
      },
      recommendations: ['Fix JSON syntax errors'],
    };
  }

  // Analyze structure (parsed is guaranteed to be valid at this point)
  const analysis = await analyzeJsonStream(parsed as string | object, {
    trackPaths: false,
    findLargeArrays: true,
  });

  // Check for empty structures
  if (parsed === null) {
    issues.push({
      type: 'info',
      message: 'Root value is null',
    });
  } else if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      issues.push({
        type: 'info',
        message: 'Empty array',
      });
    }
  } else if (typeof parsed === 'object') {
    if (Object.keys(parsed).length === 0) {
      issues.push({
        type: 'info',
        message: 'Empty object',
      });
    }
  } else {
    // Primitive values (string, number, boolean) are valid JSON but might not be expected
    issues.push({
      type: 'info',
      message: `Root value is a ${typeof parsed}, not an object or array`,
    });
  }

  // Check for performance issues
  if (analysis.maxDepth > 15) {
    issues.push({
      type: 'warning',
      message: `Very deep nesting (${analysis.maxDepth} levels) may impact performance`,
    });
    recommendations.push('Consider flattening deeply nested structures');
  }

  if (analysis.largeArrays.length > 0) {
    analysis.largeArrays.forEach((arr) => {
      issues.push({
        type: 'info',
        message: `Large array found at ${arr.path} (${arr.size} items)`,
        path: arr.path,
      });
    });
    recommendations.push('Consider pagination or streaming for large arrays');
  }

  if (analysis.complexity === 'High') {
    recommendations.push('Use tree view for better performance');
    recommendations.push('Consider chunking or streaming for large datasets');
  }

  return {
    isValid: true,
    issues,
    stats: {
      size: analysis.size,
      nodeCount: analysis.nodeCount,
      maxDepth: analysis.maxDepth,
      complexity: analysis.complexity,
    },
    recommendations,
  };
}


import {
  Globe,
  Zap,
  Database,
  Code2,
  FileJson,
  BookOpen
} from 'lucide-react';

/**
 * Complexity colors for document badges
 */
export const complexityColors: Record<string, string> = {
  simple: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  complex: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  'very complex': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

/**
 * Get icon for document category
 */
export function getCategoryIcon(category: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    'API Response': <Globe className="h-4 w-4" />,
    'Configuration': <Zap className="h-4 w-4" />,
    'Database Schema': <Database className="h-4 w-4" />,
    'Test Data': <Code2 className="h-4 w-4" />,
    'Template': <FileJson className="h-4 w-4" />,
    'Example': <BookOpen className="h-4 w-4" />,
  };
  return icons[category] || <FileJson className="h-4 w-4" />;
}

/**
 * Common document type interface
 */
export interface BaseDocument {
  id: string;
  shareId: string;
  title: string;
  description?: string;
  richContent?: string;
  slug?: string;
  tags: string[];
  category?: string;
  viewCount: number;
  nodeCount: number;
  complexity: string;
  size: number;
  visibility?: 'private' | 'public';
  author?: {
    id?: string;
    name: string;
    image?: string;
  };
  preview?: string;
  content?: unknown;
}

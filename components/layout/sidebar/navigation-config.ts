import {
  FileJson,
  Code2,
  Database,
  Globe,
  GitCompare,
  ArrowRightLeft,
  Minimize2,
  LucideIcon
} from 'lucide-react';

export interface NavigationConfig {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  requiresAuth?: boolean;
}

export const NAVIGATION_ITEMS: NavigationConfig[] = [
  {
    id: 'viewer',
    name: 'View',
    href: '/view',
    icon: Code2,
    description: 'View JSON files',
  },
  {
    id: 'editor',
    name: 'Edit',
    href: '/edit',
    icon: FileJson,
    description: 'Create and edit JSON',
  },
  {
    id: 'format',
    name: 'Format',
    href: '/format',
    icon: FileJson,
    description: 'Format and beautify JSON',
  },
  {
    id: 'minify',
    name: 'Minify',
    href: '/minify',
    icon: Minimize2,
    description: 'Minify and compress JSON',
  },
  {
    id: 'convert',
    name: 'Convert',
    href: '/convert',
    icon: ArrowRightLeft,
    description: 'Convert between formats',
  },
  {
    id: 'compare',
    name: 'Compare',
    href: '/compare',
    icon: GitCompare,
    description: 'Compare JSON objects',
  },
  {
    id: 'library',
    name: 'Library',
    href: '/library',
    icon: Globe,
    description: 'Browse public JSONs',
  },
  {
    id: 'saved',
    name: 'My Library',
    href: '/private',
    icon: Database,
    description: 'Your saved JSON files',
    requiresAuth: true,
  },
];


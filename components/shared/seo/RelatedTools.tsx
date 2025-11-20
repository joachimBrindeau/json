'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileJson,
  Minimize2,
  Code2,
  ArrowRightLeft,
  Copy,
  Zap,
} from 'lucide-react';

/**
 * Tool definition for related tools
 */
interface RelatedTool {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

/**
 * Map of tools to their related tools
 */
const RELATED_TOOLS_MAP: Record<string, RelatedTool[]> = {
  format: [
    {
      id: 'minify',
      name: 'JSON Minifier',
      description: 'Compress JSON for production',
      href: '/minify',
      icon: <Minimize2 className="h-4 w-4" />,
    },
    {
      id: 'compare',
      name: 'JSON Compare',
      description: 'Compare formatted JSON files',
      href: '/compare',
      icon: <Copy className="h-4 w-4" />,
    },
    {
      id: 'convert',
      name: 'JSON Converter',
      description: 'Convert to other formats',
      href: '/convert',
      icon: <ArrowRightLeft className="h-4 w-4" />,
    },
    {
      id: 'edit',
      name: 'JSON Editor',
      description: 'Edit and validate JSON',
      href: '/edit',
      icon: <Code2 className="h-4 w-4" />,
    },
  ],
  minify: [
    {
      id: 'format',
      name: 'JSON Formatter',
      description: 'Beautify and format JSON',
      href: '/format',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: 'compare',
      name: 'JSON Compare',
      description: 'Compare minified files',
      href: '/compare',
      icon: <Copy className="h-4 w-4" />,
    },
    {
      id: 'convert',
      name: 'JSON Converter',
      description: 'Convert to other formats',
      href: '/convert',
      icon: <ArrowRightLeft className="h-4 w-4" />,
    },
    {
      id: 'edit',
      name: 'JSON Editor',
      description: 'Edit and validate JSON',
      href: '/edit',
      icon: <Code2 className="h-4 w-4" />,
    },
  ],
  compare: [
    {
      id: 'format',
      name: 'JSON Formatter',
      description: 'Format before comparing',
      href: '/format',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: 'minify',
      name: 'JSON Minifier',
      description: 'Minify before comparing',
      href: '/minify',
      icon: <Minimize2 className="h-4 w-4" />,
    },
    {
      id: 'edit',
      name: 'JSON Editor',
      description: 'Edit JSON files',
      href: '/edit',
      icon: <Code2 className="h-4 w-4" />,
    },
    {
      id: 'convert',
      name: 'JSON Converter',
      description: 'Convert formats',
      href: '/convert',
      icon: <ArrowRightLeft className="h-4 w-4" />,
    },
  ],
  convert: [
    {
      id: 'format',
      name: 'JSON Formatter',
      description: 'Format converted JSON',
      href: '/format',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: 'minify',
      name: 'JSON Minifier',
      description: 'Minify converted JSON',
      href: '/minify',
      icon: <Minimize2 className="h-4 w-4" />,
    },
    {
      id: 'compare',
      name: 'JSON Compare',
      description: 'Compare conversions',
      href: '/compare',
      icon: <Copy className="h-4 w-4" />,
    },
    {
      id: 'edit',
      name: 'JSON Editor',
      description: 'Edit converted JSON',
      href: '/edit',
      icon: <Code2 className="h-4 w-4" />,
    },
  ],
  edit: [
    {
      id: 'format',
      name: 'JSON Formatter',
      description: 'Format edited JSON',
      href: '/format',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: 'minify',
      name: 'JSON Minifier',
      description: 'Minify edited JSON',
      href: '/minify',
      icon: <Minimize2 className="h-4 w-4" />,
    },
    {
      id: 'compare',
      name: 'JSON Compare',
      description: 'Compare edited files',
      href: '/compare',
      icon: <Copy className="h-4 w-4" />,
    },
    {
      id: 'convert',
      name: 'JSON Converter',
      description: 'Convert edited JSON',
      href: '/convert',
      icon: <ArrowRightLeft className="h-4 w-4" />,
    },
  ],
};

interface RelatedToolsProps {
  /**
   * Current tool identifier (format, minify, compare, convert, edit)
   */
  currentTool: string;
  /**
   * Optional title for the section
   */
  title?: string;
  /**
   * Optional description for the section
   */
  description?: string;
}

/**
 * RelatedTools Component
 * Displays contextual links to related JSON tools for SEO and user navigation
 */
export function RelatedTools({
  currentTool,
  title = 'Related JSON Tools',
  description = 'Discover more powerful JSON tools to enhance your workflow',
}: RelatedToolsProps) {
  const relatedTools = RELATED_TOOLS_MAP[currentTool.toLowerCase()] || [];

  // Don't render if no related tools found
  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30 border-t" aria-labelledby="related-tools-heading">
      <div className="container mx-auto px-4 sm:px-6">
        <header className="text-center mb-8">
          <h2 id="related-tools-heading" className="text-2xl sm:text-3xl font-bold mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
          )}
        </header>

        <nav aria-label="Related JSON tools">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {relatedTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg transition-all duration-200"
                aria-label={`${tool.name}: ${tool.description}`}
              >
                <Card className="h-full border hover:border-primary/50 hover:shadow-md transition-all duration-200 group-hover:bg-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors duration-200">
                        {tool.icon}
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors duration-200">
                        {tool.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </section>
  );
}

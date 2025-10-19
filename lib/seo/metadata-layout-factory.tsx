import { Metadata } from 'next';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';
import { PAGE_SEO } from '@/lib/seo';

/**
 * Factory for creating metadata generation function
 * Eliminates duplicate layout patterns across the app
 */
export function createMetadataGenerator(pageKey: keyof typeof PAGE_SEO) {
  return async function generateMetadata(): Promise<Metadata> {
    return await generateDatabaseSEOMetadata(pageKey);
  };
}

/**
 * Factory for creating simple passthrough layouts
 * Use for pages that don't need custom layout logic
 */
export function createSimpleLayout(displayName: string) {
  const LayoutComponent = ({ children }: { children: React.ReactNode }) => {
    return children;
  };

  LayoutComponent.displayName = `${displayName}Layout`;

  return LayoutComponent;
}

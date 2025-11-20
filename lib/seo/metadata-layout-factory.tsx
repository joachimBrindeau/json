import { Metadata } from 'next';
import Script from 'next/script';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';
import {
  PAGE_SEO,
  DEFAULT_SEO_CONFIG,
  generateWebPageStructuredData,
  generateBreadcrumbStructuredData,
  renderJsonLd,
  getCanonicalUrl,
} from '@/lib/seo';

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
 * Factory for creating layouts with structured data
 * Adds WebPage schema and breadcrumbs automatically
 */
export function createLayoutWithStructuredData(
  pageKey: keyof typeof PAGE_SEO,
  displayName: string,
  breadcrumbItems?: Array<{ name: string; url: string }>
) {
  const LayoutComponent = ({ children }: { children: React.ReactNode }) => {
    const pageConfig = PAGE_SEO[pageKey];
    const pageUrl = getCanonicalUrl(pageKey === 'home' ? '' : pageKey);
    const pageTitle = pageConfig.title || DEFAULT_SEO_CONFIG.defaultTitle;
    const pageDescription = pageConfig.description || DEFAULT_SEO_CONFIG.defaultDescription;

    // Generate breadcrumbs if not provided
    const breadcrumbs = breadcrumbItems || [
      { name: 'Home', url: DEFAULT_SEO_CONFIG.siteUrl },
      { name: pageTitle.replace(` | ${DEFAULT_SEO_CONFIG.siteName}`, ''), url: pageUrl },
    ];

    // Generate WebPage structured data with breadcrumbs
    const webPageSchema = generateWebPageStructuredData({
      name: pageTitle,
      url: pageUrl,
      description: pageDescription,
      breadcrumbs,
    });

    return (
      <>
        <Script
          id={`${pageKey}-webpage-structured-data`}
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(webPageSchema),
          }}
        />
        {breadcrumbs.length > 0 && (
          <Script
            id={`${pageKey}-breadcrumb-structured-data`}
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: renderJsonLd(generateBreadcrumbStructuredData(breadcrumbs)),
            }}
          />
        )}
        {children}
      </>
    );
  };

  LayoutComponent.displayName = `${displayName}Layout`;

  return LayoutComponent;
}

/**
 * Factory for creating simple passthrough layouts
 * Use for pages that don't need custom layout logic
 * Now includes structured data by default
 */
export function createSimpleLayout(displayName: string, pageKey?: keyof typeof PAGE_SEO) {
  if (pageKey) {
    return createLayoutWithStructuredData(pageKey, displayName);
  }

  const LayoutComponent = ({ children }: { children: React.ReactNode }) => {
    return children;
  };

  LayoutComponent.displayName = `${displayName}Layout`;

  return LayoutComponent;
}

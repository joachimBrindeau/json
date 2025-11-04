import { Metadata } from 'next';
import Script from 'next/script';
import { generateSEOMetadata, generateArticleStructuredData, renderJsonLd } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';
import { getDocumentByShareId } from '@/lib/db/queries/documents';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Generate metadata for embed document pages
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await getDocumentByShareId(id, {
      includeContent: false,
      includeAnalytics: false,
    });

    if (!result.success || !result.data) {
      // Fallback to generic embed page metadata
      return generateSEOMetadata({
        title: 'Embedded JSON Viewer - JSON Viewer',
        description: 'Embeddable JSON viewer component',
        canonicalUrl: getCanonicalUrl(`embed/${id}`),
        ogImage: '/og-embed.png.svg',
        noIndex: true, // Embed pages should not be indexed
      });
    }

    const document = result.data;
    const title = document.title ? `${document.title} - Embedded JSON` : 'Embedded JSON Viewer';

    return generateSEOMetadata({
      title,
      description: document.description || 'Embeddable JSON viewer component',
      keywords: document.tags || [],
      ogImage: '/og-embed.png.svg',
      ogType: 'article',
      canonicalUrl: getCanonicalUrl(`embed/${id}`),
      publishedAt: document.publishedAt
        ? new Date(document.publishedAt).toISOString()
        : undefined,
      noIndex: true, // Embed pages should not be indexed
    });
  } catch (error) {
    // Fallback on error
    return generateSEOMetadata({
      title: 'Embedded JSON Viewer - JSON Viewer',
      description: 'Embeddable JSON viewer component',
      canonicalUrl: getCanonicalUrl(`embed/${id}`),
      ogImage: '/og-embed.png.svg',
      noIndex: true,
    });
  }
}

/**
 * Generate structured data for embed document pages
 */
async function getStructuredData(id: string) {
  try {
    const result = await getDocumentByShareId(id, {
      includeContent: false,
      includeAnalytics: false,
    });

    if (!result.success || !result.data) {
      return null;
    }

    const document = result.data;
    const url = getCanonicalUrl(`embed/${id}`);

    return generateArticleStructuredData({
      title: document.title || 'Embedded JSON Document',
      description: document.description || 'An embedded JSON document viewer',
      url,
      publishedAt: document.publishedAt
        ? new Date(document.publishedAt).toISOString()
        : undefined,
    });
  } catch {
    return null;
  }
}

export default async function EmbedDocumentLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const structuredData = await getStructuredData(id);

  return (
    <>
      {structuredData && (
        <Script
          id="embed-document-structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(structuredData),
          }}
        />
      )}
      {children}
    </>
  );
}


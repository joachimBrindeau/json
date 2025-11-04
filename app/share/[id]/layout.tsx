import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';
import { getDocumentByShareId } from '@/lib/db/queries/documents';
import Script from 'next/script';
import { generateArticleStructuredData, renderJsonLd } from '@/lib/seo';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Generate metadata for shared document pages
 * Note: This page redirects to /library/[id], but we still need metadata for SEO
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await getDocumentByShareId(id, {
      includeContent: false,
      includeAnalytics: false,
    });

    if (!result.success || !result.data) {
      // Fallback metadata
      return generateSEOMetadata({
        title: 'Shared JSON Document - JSON Viewer',
        description: 'View and explore this shared JSON document',
        canonicalUrl: getCanonicalUrl(`share/${id}`),
        ogImage: '/og-viewer.png.svg',
      });
    }

    const document = result.data;
    const title = document.title || 'Shared JSON Document';

    return generateSEOMetadata({
      title: `${title} - Shared JSON`,
      description: document.description || `View and explore this shared JSON document: ${title}`,
      keywords: document.tags || [],
      ogImage: '/og-viewer.png.svg',
      ogType: 'article',
      canonicalUrl: getCanonicalUrl(`share/${id}`),
      publishedAt: document.publishedAt
        ? new Date(document.publishedAt).toISOString()
        : undefined,
    });
  } catch {
    // Fallback on error
    return generateSEOMetadata({
      title: 'Shared JSON Document - JSON Viewer',
      description: 'View and explore this shared JSON document',
      canonicalUrl: getCanonicalUrl(`share/${id}`),
      ogImage: '/og-viewer.png.svg',
    });
  }
}

/**
 * Generate structured data for shared document pages
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
    const url = getCanonicalUrl(`share/${id}`);

    return generateArticleStructuredData({
      title: document.title || 'JSON Document',
      description: document.description || 'A shared JSON document',
      url,
      publishedAt: document.publishedAt
        ? new Date(document.publishedAt).toISOString()
        : undefined,
      author: document.userId ? undefined : 'Anonymous',
    });
  } catch {
    return null;
  }
}

export default async function ShareLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const structuredData = await getStructuredData(id);

  return (
    <>
      {structuredData && (
        <Script
          id="share-document-structured-data"
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


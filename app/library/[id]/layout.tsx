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
 * Generate metadata for library document pages
 */
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await getDocumentByShareId(id, {
      includeContent: false,
      includeAnalytics: false,
    });

    if (!result.success || !result.data) {
      // Fallback to generic library page metadata
      return generateSEOMetadata({
        title: 'JSON Document - JSON Viewer',
        description: 'View and explore this JSON document',
        canonicalUrl: getCanonicalUrl(`library/${id}`),
        ogImage: '/og-library.png.svg',
      });
    }

    const document = result.data;
    const title = document.title || 'JSON Document';
    const description =
      document.description ||
      `View and explore this JSON document. ${document.tags?.length ? `Tags: ${document.tags.join(', ')}` : ''}`;

    return generateSEOMetadata({
      title,
      description,
      keywords: document.tags || [],
      ogImage: '/og-library.png.svg',
      ogType: 'article',
      canonicalUrl: getCanonicalUrl(`library/${id}`),
      publishedAt: document.publishedAt
        ? new Date(document.publishedAt).toISOString()
        : undefined,
      author: document.userId || document.isAnonymous ? undefined : 'Anonymous',
    });
  } catch {
    // Fallback on error
    return generateSEOMetadata({
      title: 'JSON Document - JSON Viewer',
      description: 'View and explore this JSON document',
      canonicalUrl: getCanonicalUrl(`library/${id}`),
      ogImage: '/og-library.png.svg',
    });
  }
}

/**
 * Generate structured data for library document pages
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
    const url = getCanonicalUrl(`library/${id}`);

    return generateArticleStructuredData({
      title: document.title || 'JSON Document',
      description: document.description || 'A JSON document from the JSON Viewer library',
      url,
      publishedAt: document.publishedAt
        ? new Date(document.publishedAt).toISOString()
        : undefined,
      author: document.userId || document.isAnonymous ? undefined : 'Anonymous',
    });
  } catch {
    return null;
  }
}

export default async function LibraryDocumentLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const structuredData = await getStructuredData(id);

  return (
    <>
      {structuredData && (
        <Script
          id="library-document-structured-data"
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


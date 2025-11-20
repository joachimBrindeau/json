import { Metadata } from 'next';
import Script from 'next/script';
import { generateSEOMetadata, generateWebPageStructuredData, generateBreadcrumbStructuredData, renderJsonLd, DEFAULT_SEO_CONFIG, getCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'JSON Viewer - Interactive JSON Explorer',
  description:
    'View and explore JSON documents with interactive tree navigation, syntax highlighting, and powerful search. Navigate complex JSON structures with ease.',
  keywords: [
    'json viewer',
    'json explorer',
    'json document viewer',
    'interactive json',
    'json tree view',
    'json visualization',
  ],
  ogImage: '/og-viewer.png.svg',
  canonicalUrl: getCanonicalUrl('/view'),
});

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageUrl = getCanonicalUrl('/view');
  const breadcrumbs = [
    { name: 'Home', url: DEFAULT_SEO_CONFIG.siteUrl },
    { name: 'JSON Viewer', url: pageUrl },
  ];
  
  const webPageSchema = generateWebPageStructuredData({
    name: 'JSON Viewer - Interactive JSON Explorer',
    url: pageUrl,
    description: 'View and explore JSON documents with interactive tree navigation',
    breadcrumbs,
  });

  return (
    <>
      <Script
        id="view-webpage-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(webPageSchema),
        }}
      />
      <Script
        id="view-breadcrumb-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(generateBreadcrumbStructuredData(breadcrumbs)),
        }}
      />
      {children}
    </>
  );
}


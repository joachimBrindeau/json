import Script from 'next/script';
import { MainLayout } from '@/components/layout/MainLayout';
import { createMetadataGenerator } from '@/lib/seo/metadata-layout-factory';
import {
  PAGE_SEO,
  DEFAULT_SEO_CONFIG,
  generateWebPageStructuredData,
  generateBreadcrumbStructuredData,
  renderJsonLd,
  getCanonicalUrl,
} from '@/lib/seo';

export const generateMetadata = createMetadataGenerator('blog');

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const pageConfig = PAGE_SEO.blog;
  const pageUrl = getCanonicalUrl('blog');
  const pageTitle = pageConfig.title || DEFAULT_SEO_CONFIG.defaultTitle;
  const pageDescription = pageConfig.description || DEFAULT_SEO_CONFIG.defaultDescription;
  
  const breadcrumbs = [
    { name: 'Home', url: DEFAULT_SEO_CONFIG.siteUrl },
    { name: 'Blog', url: pageUrl },
  ];
  
  const webPageSchema = generateWebPageStructuredData({
    name: pageTitle,
    url: pageUrl,
    description: pageDescription,
    breadcrumbs,
  });

  return (
    <MainLayout>
      <Script
        id="blog-webpage-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(webPageSchema),
        }}
      />
      <Script
        id="blog-breadcrumb-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(generateBreadcrumbStructuredData(breadcrumbs)),
        }}
      />
      {children}
    </MainLayout>
  );
}

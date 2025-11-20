import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthSessionProvider } from '@/components/shared/providers/SessionProvider';
import { NavigationProvider } from '@/components/shared/providers/NavigationProvider';
import { GlobalLoginModal } from '@/components/features/modals';
import { WebVitals } from '@/components/shared/seo/WebVitals';
import { VersionChecker } from '@/components/shared/VersionChecker';
import { ServiceWorkerManager } from '@/components/shared/ServiceWorkerManager';
import { Analytics } from '@/components/shared/seo/analytics';
import {
  generateWebApplicationStructuredData,
  generateWebSiteStructuredData,
  generateOrganizationStructuredData,
  renderJsonLd,
  getApplicationReviews,
} from '@/lib/seo';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';
import { logger } from '@/lib/logger';
import { OAuthErrorHandler } from '@/components/shared/OAuthErrorHandler';
import './globals.css';
import 'leaflet/dist/leaflet.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});


// Force dynamic rendering to avoid static prerender issues during build
// This keeps pages server-rendered and prevents chunk loading errors in CI/E2E
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return await generateDatabaseSEOMetadata('home');
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Include review data in WebApplication structured data
  const reviewData = getApplicationReviews();
  const webAppJsonLd = generateWebApplicationStructuredData(undefined, reviewData);
  const webSiteJsonLd = generateWebSiteStructuredData();
  const organizationJsonLd = generateOrganizationStructuredData();

  // Debug: Log the JSON-LD only in development
  if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    logger.debug(
      { webAppJsonLd, webSiteJsonLd, organizationJsonLd, appUrl: process.env.NEXT_PUBLIC_APP_URL },
      'Root layout JSON-LD structured data'
    );
  }

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* Resource Hints for Performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Icons and Manifest */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

<<<<<<< Current (Your changes)
        {/* DNS Prefetch for external resources - improves performance */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* Preconnect for critical external resources */}
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
=======
        {/* Resource hints for better performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        )}
>>>>>>> Incoming (Background Agent changes)

        {/* Preload Monaco Editor for faster loading */}
        <script src="/scripts/monaco-preload.js" defer />

        {/* WebApplication Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(webAppJsonLd),
          }}
        />
        
        {/* WebSite Structured Data with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(webSiteJsonLd),
          }}
        />
        
        {/* Organization Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(organizationJsonLd),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSessionProvider>
          <NavigationProvider>
            <OAuthErrorHandler />
            <WebVitals />
            <Analytics />
            <VersionChecker />
            <ServiceWorkerManager />
            {children}
            <Toaster />
            <GlobalLoginModal />
          </NavigationProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

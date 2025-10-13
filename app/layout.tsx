import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthSessionProvider } from '@/components/shared/providers/session-provider';
import { NavigationProvider } from '@/components/shared/providers/navigation-provider';
import { GlobalLoginModal } from '@/components/features/modals';
import { WebVitals } from '@/components/shared/seo/web-vitals';
import { VersionChecker } from '@/components/shared/version-checker';
import { ServiceWorkerManager } from '@/components/shared/service-worker-manager';
import { generateWebApplicationStructuredData, renderJsonLd } from '@/lib/seo';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';
import { logger } from '@/lib/logger';
import './globals.css';

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

export async function generateMetadata(): Promise<Metadata> {
  return await generateDatabaseSEOMetadata('home');
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = generateWebApplicationStructuredData();

  // Debug: Log the JSON-LD only in development
  if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    logger.debug({ jsonLd, appUrl: process.env.NEXT_PUBLIC_APP_URL }, 'Root layout JSON-LD structured data');
  }

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preload Monaco Editor for faster loading */}
        <script src="/monaco-preload.js" defer />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(jsonLd),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthSessionProvider>
          <NavigationProvider>
            <WebVitals />
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

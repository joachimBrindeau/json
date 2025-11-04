import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/seo/url-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'User Profile - Manage Your JSON Viewer Account',
  description:
    'Manage your JSON Viewer account settings, view your saved documents, and configure your preferences. Access your profile and account information.',
  keywords: [
    'json viewer profile',
    'user account',
    'json account settings',
    'profile management',
    'user settings',
  ],
  ogImage: '/og-image.png.svg',
  canonicalUrl: getCanonicalUrl('/profile'),
  noIndex: true, // User-specific content, should not be indexed
});

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


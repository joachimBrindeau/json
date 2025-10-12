import { Metadata } from 'next';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';

export async function generateMetadata(): Promise<Metadata> {
  return await generateDatabaseSEOMetadata('compare');
}

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
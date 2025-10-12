import { Metadata } from 'next';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';

export async function generateMetadata(): Promise<Metadata> {
  return await generateDatabaseSEOMetadata('format');
}

export default function FormatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
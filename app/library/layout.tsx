import { Metadata } from 'next';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';

export async function generateMetadata(): Promise<Metadata> {
  return await generateDatabaseSEOMetadata('library');
}

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
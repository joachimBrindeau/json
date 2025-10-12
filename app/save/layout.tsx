import { Metadata } from 'next';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';

export async function generateMetadata(): Promise<Metadata> {
  return await generateDatabaseSEOMetadata('saved');
}

export default function SavedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
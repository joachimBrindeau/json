import { Metadata } from 'next';
import { generateDatabaseSEOMetadata } from '@/lib/seo/database';

export async function generateMetadata(): Promise<Metadata> {
  return await generateDatabaseSEOMetadata('edit');
}

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
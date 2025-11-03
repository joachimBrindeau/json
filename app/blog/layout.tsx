import { MainLayout } from '@/components/layout/MainLayout';
import { createMetadataGenerator } from '@/lib/seo/metadata-layout-factory';

export const generateMetadata = createMetadataGenerator('blog');

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}

import { createMetadataGenerator, createSimpleLayout } from '@/lib/seo/metadata-layout-factory';

export const generateMetadata = createMetadataGenerator('minify');

export default createSimpleLayout('Minify', 'minify');

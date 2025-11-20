import { createMetadataGenerator, createSimpleLayout } from '@/lib/seo/metadata-layout-factory';

export const generateMetadata = createMetadataGenerator('compare');

export default createSimpleLayout('Compare', 'compare');

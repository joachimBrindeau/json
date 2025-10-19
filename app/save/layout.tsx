import { createMetadataGenerator, createSimpleLayout } from '@/lib/seo/metadata-layout-factory';

export const generateMetadata = createMetadataGenerator('saved');

export default createSimpleLayout('Saved');
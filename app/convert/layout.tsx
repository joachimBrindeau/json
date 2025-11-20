import { createMetadataGenerator, createSimpleLayout } from '@/lib/seo/metadata-layout-factory';

export const generateMetadata = createMetadataGenerator('convert');

export default createSimpleLayout('Convert', 'convert');

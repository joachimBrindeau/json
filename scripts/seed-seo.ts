#!/usr/bin/env tsx

/**
 * SEO Settings Seeder
 * Run with: npx tsx scripts/seed-seo.ts
 */

import { seedSEOSettings } from '../lib/seo/database';

async function main() {
  try {
    console.log('🌱 Seeding SEO settings...');
    await seedSEOSettings();
    console.log('✅ SEO settings seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed SEO settings:', error);
    process.exit(1);
  }
}

main();
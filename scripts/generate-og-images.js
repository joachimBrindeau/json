#!/usr/bin/env node

/**
 * Generate PNG OG images from SVG files
 * Requires: sharp (npm install sharp)
 * 
 * Usage: node scripts/generate-og-images.js
 */

const fs = require('fs');
const path = require('path');

const ogImages = [
  'og-image.png',
  'og-library.png',
  'og-editor.png',
  'og-formatter.png',
  'og-compare.png',
  'og-minify.png',
  'og-convert.png',
  'og-viewer.png',
  'og-embed.png',
  'og-saved.png',
  'og-blog.png',
];

async function convertSvgToPng() {
  try {
    // Try to import sharp
    const sharp = require('sharp');
    
    console.log('Converting SVG OG images to PNG...');
    
    for (const imageName of ogImages) {
      const svgPath = path.join(process.cwd(), 'public', `${imageName}.svg`);
      const pngPath = path.join(process.cwd(), 'public', imageName);
      
      if (!fs.existsSync(svgPath)) {
        console.warn(`⚠️  SVG not found: ${svgPath}`);
        continue;
      }
      
      try {
        await sharp(svgPath)
          .png()
          .resize(1200, 630, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toFile(pngPath);
        
        console.log(`✅ Generated: ${imageName}`);
      } catch (error) {
        console.error(`❌ Error converting ${imageName}:`, error.message);
      }
    }
    
    console.log('\n✨ OG image generation complete!');
    console.log('\nNote: SVG files can also be used directly as OG images.');
    console.log('Most social platforms support SVG format.');
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('📦 Sharp not found. Installing...');
      console.log('Run: npm install sharp');
      console.log('\nAlternatively, you can use the SVG files directly.');
      console.log('Most social platforms support SVG format for OG images.');
      return;
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  convertSvgToPng().catch(console.error);
}

module.exports = { convertSvgToPng };


# OG Image Files Required

**Status:** Design assets needed

## Overview

The following OG (Open Graph) image files are referenced in the SEO configuration but need to be created:

## Required Images

All OG images should be:
- **Dimensions:** 1200x630 pixels
- **Format:** PNG or JPG
- **Location:** `/public/` directory
- **Optimization:** Compressed for web (recommended: <200KB each)

## Image List

1. **`/public/og-image.png`** (1200x630)
   - Default/homepage OG image
   - Should represent the main JSON Viewer application
   - Include branding and key features

2. **`/public/og-library.png`** (1200x630)
   - Public JSON library page
   - Theme: Community, sharing, examples

3. **`/public/og-editor.png`** (1200x630)
   - JSON editor page
   - Theme: Code editing, syntax highlighting

4. **`/public/og-formatter.png`** (1200x630)
   - JSON formatter page
   - Theme: Formatting, beautification, validation

5. **`/public/og-compare.png`** (1200x630)
   - JSON compare/diff page
   - Theme: Comparison, differences, side-by-side

6. **`/public/og-minify.png`** (1200x630)
   - JSON minifier page
   - Theme: Compression, optimization

7. **`/public/og-convert.png`** (1200x630)
   - JSON converter page
   - Theme: Conversion, transformation, multiple formats

8. **`/public/og-viewer.png`** (1200x630)
   - JSON viewer/document viewer page
   - Theme: Visualization, tree view, exploration

9. **`/public/og-embed.png`** (1200x630)
   - Embedded JSON viewer page
   - Theme: Embedding, integration, widgets

10. **`/public/og-saved.png`** (1200x630)
    - Saved documents page
    - Theme: Storage, management, organization

11. **`/public/og-blog.png`** (1200x630)
    - Blog/guides page
    - Theme: Education, tutorials, learning

## Design Guidelines

- Use consistent branding across all images
- Include relevant icons or illustrations for each page type
- Ensure text is readable at small sizes (social media previews)
- Use high contrast for accessibility
- Match the application's color scheme

## Current Status

All OG image paths are configured in:
- `lib/seo/constants.ts` - `PAGE_SEO` configuration
- Individual page metadata files

## Temporary Solution

Until images are created, the application will:
- Use `/og-image.png` as fallback for all pages
- Display correctly but with generic image
- Not affect functionality, only social sharing appearance

## Next Steps

1. Design OG images following the guidelines above
2. Create image files in required dimensions
3. Optimize images for web
4. Place files in `/public/` directory
5. Test OG image display using:
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Notes

- OG images are important for social media sharing
- They appear when links are shared on Facebook, Twitter, LinkedIn, etc.
- Missing images will result in generic or broken previews
- This is a design/asset creation task, not a code task


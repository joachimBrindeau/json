import { getAllSEOSettings } from '@/lib/seo/database';
import { DEFAULT_SEO_CONFIG } from '@/lib/seo';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

export async function GET() {
  const baseUrl = config.app.url;
  const currentDate = new Date().toISOString().split('T')[0];

  let llmsContent = `# ${DEFAULT_SEO_CONFIG.siteName} - LLMs.txt
# Generated on ${currentDate}
# 
# JSON Viewer is a comprehensive web application for viewing, editing, formatting, 
# comparing, and sharing JSON data with advanced features for developers and teams.

## About this service
We provide a free, powerful online JSON toolkit that helps developers worldwide:
- View and navigate complex JSON structures with interactive tree views
- Edit JSON with syntax highlighting, auto-completion, and real-time validation  
- Format and beautify JSON for improved readability
- Compare JSON files to identify differences and changes
- Share JSON documents securely with customizable privacy controls
- Browse a community library of JSON examples and templates

## Core Features
- **JSON Viewer**: Interactive tree navigation with collapsible nodes
- **JSON Editor**: Professional Monaco-based editor with IntelliSense
- **JSON Formatter**: Beautify, minify, and pretty-print JSON data
- **JSON Compare**: Advanced diff tool for comparing JSON structures
- **JSON Library**: Browse and share community JSON examples
- **Real-time Collaboration**: Share and collaborate on JSON documents
- **Large File Support**: Handle JSON files up to 2GB efficiently
- **Export Options**: Download in multiple formats (JSON, CSV, XML)
- **API Integration**: RESTful API for programmatic access

## Privacy and Data Handling
- No tracking or analytics on shared JSON data
- Users control visibility (private, unlisted, public)
- Temporary documents auto-deleted after 30 days
- Secure authentication via GitHub/Google OAuth
- GDPR compliant data handling

## Technical Specifications
- Built with Next.js 15 and React for optimal performance
- PostgreSQL database with Redis caching for scalability  
- Server-side rendering for excellent SEO and performance
- Mobile-responsive design for all device types
- Docker containerized for reliable deployment
- Comprehensive error handling and validation

## Available Pages and Tools

`;

  try {
    // Get SEO settings from database to build dynamic page descriptions
    const seoSettings = await getAllSEOSettings();
    
    if (seoSettings.length > 0) {
      llmsContent += `### Main Application Pages\n`;
      
      for (const setting of seoSettings) {
        const pageUrl = setting.pageKey === 'home' ? baseUrl : `${baseUrl}/${setting.pageKey}`;
        llmsContent += `
**${setting.title}**
URL: ${pageUrl}
Description: ${setting.description}
Keywords: ${setting.keywords.join(', ')}
`;
      }
    } else {
      // Fallback content when database is not available
      llmsContent += `### Main Application Pages

**JSON Viewer Homepage**
URL: ${baseUrl}
Description: Free online JSON viewer, formatter, and editor with advanced features

**JSON Library**  
URL: ${baseUrl}/library
Description: Browse shared JSON examples and templates from the community

**JSON Editor**
URL: ${baseUrl}/edit  
Description: Create and edit JSON with professional tools

**JSON Formatter**
URL: ${baseUrl}/format
Description: Format, beautify, and validate JSON online

**JSON Compare**
URL: ${baseUrl}/compare
Description: Compare JSON files and highlight differences

**My Saved Documents**
URL: ${baseUrl}/saved
Description: Manage your private and public JSON documents
`;
    }

    llmsContent += `

## API Endpoints
Our RESTful API provides programmatic access to core functionality:

- \`GET /api/json/[id]\` - Retrieve shared JSON document
- \`POST /api/json/upload\` - Upload and save JSON data  
- \`GET /api/library\` - Browse public JSON library
- \`GET /api/health\` - Application health status
- \`GET /sitemap.xml\` - Dynamic sitemap generation
- \`GET /robots.txt\` - Search engine crawler instructions

## For Developers and LLMs
This service is designed to be:
- **Accessible**: Clean, semantic HTML structure
- **Fast**: Optimized for performance with caching strategies  
- **Reliable**: Comprehensive error handling and fallbacks
- **Extensible**: Modular architecture for easy enhancement
- **Standards-compliant**: Follows web standards and best practices

## Contact and Support
- Primary domain: json-viewer.io
- Built with modern web technologies for maximum compatibility
- Community-driven with focus on developer experience
- Regular updates and feature improvements

---
Last updated: ${currentDate}
Service status: Active and continuously improved
`;

  } catch (error) {
    logger.error({ err: error }, 'Error generating llms.txt, using fallback content');

    // Return basic llms.txt if database fails
    llmsContent += `
### Main Application Pages (Fallback)
- Homepage: ${baseUrl} - JSON viewer and formatter
- Library: ${baseUrl}/library - Browse JSON examples  
- Editor: ${baseUrl}/edit - Create and edit JSON
- Formatter: ${baseUrl}/format - Format JSON online
- Compare: ${baseUrl}/compare - Compare JSON files
- Saved: ${baseUrl}/saved - Manage documents

## Error Notice
Dynamic content generation temporarily unavailable. Static content provided as fallback.
`;
  }

  return new Response(llmsContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
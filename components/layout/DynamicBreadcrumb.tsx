'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { generateBreadcrumbStructuredData, renderJsonLd } from '@/lib/seo';
import { DEFAULT_SEO_CONFIG } from '@/lib/seo';

interface BreadcrumbSegment {
  label: string;
  href?: string;
  isLast?: boolean;
}

// Route labels mapping
const routeLabels: Record<string, string> = {
  '': 'Home',
  compare: 'Compare',
  library: 'Library',
  'public-library': 'Public Library',
  profile: 'Profile',
  'tag-analytics': 'Tag Analytics',
  s: 'Shared',
  embed: 'Embed',
  viewer: 'Viewer',
  share: 'Share',
  'test-integration': 'Test Integration',
  'test-flow': 'Test Sea',
  'seo-landing': 'SEO Landing',
};

// Special route handlers for dynamic segments
const dynamicRouteHandlers: Record<
  string,
  (segment: string, index: number) => string
> = {
  s: (segment, index) => {
    // For shared links, show "Shared JSON" or document title if available
    return index === 1 ? 'Shared JSON' : segment;
  },
  embed: (segment, index) => {
    return index === 1 ? 'Embedded View' : segment;
  },
  viewer: (segment, index) => {
    return index === 1 ? 'JSON Document' : segment;
  },
};

interface DynamicBreadcrumbProps {
  currentTitle?: string;
  onTitleEdit?: () => void;
  isEditingTitle?: boolean;
  editTitleComponent?: React.ReactNode;
}

export function DynamicBreadcrumb({
  currentTitle,
  onTitleEdit,
  isEditingTitle,
  editTitleComponent,
}: DynamicBreadcrumbProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = (pathname || '').split('/').filter(Boolean);
    const items: BreadcrumbSegment[] = [];

    // Always add home icon (no label text)
    items.push({
      label: '',
      href: '/',
      isLast: segments.length === 0 && !currentTitle,
    });

    // Build breadcrumb items from path segments
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      let path = '/' + segments.slice(0, index + 1).join('/');

      // Special handling for shared routes - link to public library instead
      if (segment === 's' && index === 0) {
        path = '/public-library';
      }

      // Get label for this segment
      let label = routeLabels[segment] || segment;

      // Check if previous segment has a dynamic handler
      if (index > 0) {
        const previousSegment = segments[index - 1];
        if (dynamicRouteHandlers[previousSegment]) {
          label = dynamicRouteHandlers[previousSegment](segment, index) || segment;
        }
      }

      // Handle UUID-like segments (shared IDs)
      if (segment.length > 20 && /^[a-z0-9]+$/.test(segment)) {
        label = 'ID: ' + segment.slice(0, 8) + '...';
      }

      // Capitalize and format label
      label = label
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      items.push({
        label,
        href: isLast ? undefined : path,
        isLast,
      });
    });

    // If we have a current title and we're on the root page with a document
    if (currentTitle && (pathname ?? '') === '/') {
      items.push({
        label: currentTitle,
        isLast: true,
      });
    }

    return items;
  }, [pathname, currentTitle]);

  // Generate structured data for breadcrumbs
  const breadcrumbStructuredData = useMemo(() => {
    const breadcrumbItems = breadcrumbs
      .filter((item) => item.href || item.isLast)
      .map((item) => ({
        name: item.label || 'Home',
        url: item.href ? `${DEFAULT_SEO_CONFIG.siteUrl}${item.href}` : DEFAULT_SEO_CONFIG.siteUrl,
      }));
    
    if (breadcrumbItems.length === 0) return null;
    
    return generateBreadcrumbStructuredData(breadcrumbItems);
  }, [breadcrumbs]);

  // For mobile, show only first and last items when there are more than 2
  const shouldCollapse = breadcrumbs.length > 2;
  const visibleBreadcrumbs = shouldCollapse
    ? [breadcrumbs[0], { label: '...', isLast: false }, breadcrumbs[breadcrumbs.length - 1]]
    : breadcrumbs;

  return (
    <>
      {/* Breadcrumb Structured Data for SEO */}
      {breadcrumbStructuredData && (
        <Script
          id="breadcrumb-structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: renderJsonLd(breadcrumbStructuredData),
          }}
        />
      )}
      <Breadcrumb className="flex-1 min-w-0" itemScope itemType="https://schema.org/BreadcrumbList">
      {/* Mobile view - collapsed */}
      <BreadcrumbList className="flex-wrap sm:flex-nowrap sm:hidden">
        {visibleBreadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {index === 0 ? (
                // Home icon
                item.isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1" data-testid="logo-mobile">
                    <Home className="h-4 w-4" />
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href || '/'}
                      className="flex items-center gap-1"
                      data-testid="logo-mobile"
                    >
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                )
              ) : item.label === '...' ? (
                <span className="text-muted-foreground">...</span>
              ) : item.isLast ? (
                <BreadcrumbPage className="truncate max-w-[120px]">{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href!} className="truncate max-w-[120px]">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>

      {/* Desktop view - full breadcrumbs */}
      <BreadcrumbList className="hidden sm:flex sm:flex-wrap">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {index === 0 ? (
                // Home icon for first item
                item.isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1.5" data-testid="logo-desktop">
                    <Home className="h-4 w-4" />
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href!}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      data-testid="logo-desktop"
                    >
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                )
              ) : item.isLast ? (
                // Last item - check if it's editable
                isEditingTitle && editTitleComponent ? (
                  editTitleComponent
                ) : onTitleEdit &&
                  currentTitle &&
                  (pathname ?? '') === '/' &&
                  index === breadcrumbs.length - 1 ? (
                  <div
                    className="flex items-center gap-1 group cursor-pointer hover:text-foreground transition-colors"
                    onClick={onTitleEdit}
                  >
                    <BreadcrumbPage className="flex items-center gap-1">
                      {item.label}
                      {/* Edit icon removed - unused */}
                    </BreadcrumbPage>
                  </div>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )
              ) : (
                // Not last item - make it a link
                <BreadcrumbLink asChild>
                  <Link href={item.href!} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}

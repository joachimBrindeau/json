'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Viewer } from '@/components/features/viewer';
import { JsonEditor } from '@/components/features/editor/json-editor';
import { TabsNav } from '@/components/layout/tabs-nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/shared/error-boundary';

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

export default function EmbedPage({ params }: EmbedPageProps) {
  const [shareId, setShareId] = useState<string>('');
  const [jsonData, setJsonData] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hostname, setHostname] = useState<string>('embed');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [dateISO, setDateISO] = useState<string>('');
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Parse URL parameters
  const theme = searchParams.get('theme') || 'auto';
  const height = parseInt(searchParams.get('height') || '400');
  const showCopy = searchParams.get('copy') !== 'false';
  const showDownload = searchParams.get('download') === 'true';
  const borderRadius = parseInt(searchParams.get('radius') || '8');
  const viewMode = searchParams.get('view') || 'smart'; // smart, editor, flow, tree, list, tabs
  const showTabs = searchParams.get('tabs') === 'true' || viewMode === 'tabs';

  // Tab state for full tabbed viewer
  const [activeTab, setActiveTab] = useState(() => {
    if (viewMode === 'editor') return 'editor';
    if (viewMode === 'flow') return 'flow';
    if (viewMode === 'tree') return 'tree';
    if (viewMode === 'list') return 'list';
    return 'editor'; // default for tabs mode
  });

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setShareId(resolvedParams.id);
    };
    getParams();
    
    // Set client-specific values after hydration
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname.replace('www.', ''));
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      setDateISO(now.toISOString().split('T')[0]);
    }
  }, [params]);

  // Load JSON data
  useEffect(() => {
    if (!shareId) return;

    const loadJsonData = async () => {
      try {
        const response = await fetch(`/api/json/stream/${shareId}`);
        if (!response.ok) {
          throw new Error('Failed to load JSON');
        }

        // Get title from headers
        const title = response.headers.get('X-Title') || 'JSON Data';
        setTitle(title);

        // Read the streaming response
        const reader = response.body?.getReader();
        let chunks = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks += new TextDecoder().decode(value);
          }
        }

        // Parse the streamed data
        const lines = chunks.trim().split('\n');
        const data = lines.map((line) => JSON.parse(line));
        const reconstructed = data.length === 1 ? data[0].data : data;

        setJsonData(JSON.stringify(reconstructed, null, 2));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load JSON');
        setLoading(false);
      }
    };

    loadJsonData();
  }, [shareId]);

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      const body = document.body;
      const html = document.documentElement;

      if (theme === 'dark') {
        html.classList.add('dark');
        body.style.backgroundColor = '#1f2937';
        body.style.color = '#f3f4f6';
      } else if (theme === 'light') {
        html.classList.remove('dark');
        body.style.backgroundColor = '#ffffff';
        body.style.color = '#1f2937';
      } else {
        // Auto theme - detect parent or use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          html.classList.add('dark');
          body.style.backgroundColor = '#1f2937';
          body.style.color = '#f3f4f6';
        } else {
          html.classList.remove('dark');
          body.style.backgroundColor = '#ffffff';
          body.style.color = '#1f2937';
        }
      }
    };

    applyTheme();
  }, [theme]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonData);
      toast({
        title: 'Copied!',
        description: 'JSON copied to clipboard',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openFullView = () => {
    window.open(`${window.location.origin}/library/${shareId}`, '_blank');
  };

  // Render content based on view mode
  const renderContent = () => {
    if (viewMode === 'editor') {
      return (
        <div className="h-full">
          <JsonEditor />
        </div>
      );
    }

    if (viewMode === 'flow') {
      return (
        <div className="h-full">
          <Viewer
            content={jsonData}
            maxNodes={50000}
            virtualizeThreshold={1000}
            initialViewMode="flow"
          />
        </div>
      );
    }

    if (viewMode === 'tree') {
      return (
        <div className="h-full">
          <Viewer
            content={jsonData}
            maxNodes={50000}
            virtualizeThreshold={1000}
            initialViewMode="tree"
          />
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="h-full">
          <Viewer
            content={jsonData}
            maxNodes={50000}
            virtualizeThreshold={1000}
            initialViewMode="list"
          />
        </div>
      );
    }

    if (viewMode === 'tabs') {
      // Full tabbed experience
      if (activeTab === 'editor') {
        return (
          <div className="h-full">
            <JsonEditor />
          </div>
        );
      }

      if (activeTab === 'flow' || activeTab === 'tree' || activeTab === 'list') {
        return (
          <div className="h-full">
            <Viewer
              content={jsonData}
              maxNodes={50000}
              virtualizeThreshold={1000}
              initialViewMode={activeTab === 'flow' ? 'flow' : activeTab}
            />
          </div>
        );
      }
    }

    // Default: smart viewer
    return (
      <div className="h-full overflow-hidden">
        <Viewer
          jsonString={jsonData}
          height={height - (showTabs ? 120 : 60)} // Account for header and tabs
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center p-8"
        style={{ height: `${height}px`, borderRadius: `${borderRadius}px` }}
      >
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
          <span>Loading JSON...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center p-8 border border-red-200 bg-red-50 text-red-700"
        style={{ height: `${height}px`, borderRadius: `${borderRadius}px` }}
      >
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="font-medium">Failed to load JSON</div>
          <div className="text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 overflow-hidden"
      style={{
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="font-medium text-sm truncate">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {viewMode === 'editor'
              ? 'EDITOR'
              : viewMode === 'flow'
                ? 'FLOW'
                : viewMode === 'tree'
                  ? 'TREE'
                  : viewMode === 'list'
                    ? 'LIST'
                    : viewMode === 'tabs'
                      ? 'FULL'
                      : 'JSON'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {showCopy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyJson}
              className="h-7 px-2"
              title="Copy JSON"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}

          {showDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-7 px-2"
              title="Download JSON"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={openFullView}
            className="h-7 px-2"
            title="Open in full viewer"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation (only for tabs mode) */}
      {showTabs && (
        <ErrorBoundary fallback={<div className="h-12 border-b bg-muted/30">Tabs Error</div>}>
          <TabsNav value={activeTab} onValueChange={setActiveTab} />
        </ErrorBoundary>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary
          fallback={
            <div className="h-full flex items-center justify-center text-red-500">Viewer Error</div>
          }
        >
          {renderContent()}
        </ErrorBoundary>
      </div>

      {/* Footer with contextual info and natural backlink */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-t from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
        <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {(() => {
              const size = new Blob([jsonData]).size;
              const formatted =
                size < 1024
                  ? `${size} B`
                  : size < 1048576
                    ? `${(size / 1024).toFixed(1)} KB`
                    : `${(size / 1048576).toFixed(1)} MB`;
              const keys = JSON.stringify(jsonData).match(/"\w+":/g)?.length || 0;
              return `${keys} fields • ${formatted}`;
            })()}
          </span>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <span>
            {hostname}{' '}
            {currentDate && `• ${currentDate}`}
          </span>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://jsonviewer.app'}?ref=${encodeURIComponent(hostname)}${dateISO ? `&date=${dateISO}` : ''}`}
          target="_blank"
          rel="dofollow"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-md hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-all hover:-translate-y-[1px] hover:shadow-sm"
          title="Professional JSON Tools - Format, Validate, and Share"
        >
          <svg
            className="w-3 h-3 opacity-60"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          JSON Tools
        </a>
      </div>
    </div>
  );
}

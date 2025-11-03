'use client';

import { useState, useCallback, useMemo } from 'react';
import { BaseModal } from '@/components/shared/base-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { showErrorToast } from '@/lib/utils/toast-helpers';
import {
  Copy,
  Eye,
  Smartphone,
  Share,
  Sparkles,
  Code2,
  X,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useClipboard } from '@/hooks/use-clipboard';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string;
  jsonPreview?: string;
}

type EmbedType = 'widget' | 'block' | 'card';
type ViewMode = 'smart' | 'editor' | 'flow' | 'tree' | 'list' | 'tabs';
type Theme = 'light' | 'dark' | 'auto';

export function EmbedModal({ isOpen, onClose, shareId, jsonPreview }: EmbedModalProps) {
  const [embedType, setEmbedType] = useState<EmbedType>('widget');
  const [viewMode, setViewMode] = useState<ViewMode>('smart');
  const [theme, setTheme] = useState<Theme>('auto');
  const [height, setHeight] = useState('500');
  const [showCopy, setShowCopy] = useState(true);
  const [showDownload, setShowDownload] = useState(false);
  const [customWidth, setCustomWidth] = useState('100%');
  const [borderRadius, setBorderRadius] = useState('12');
  const [previewError, setPreviewError] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://json-viewer.io';

  // Use clipboard hook for copy functionality
  const { copy, copied } = useClipboard({
    successMessage: 'Copied!',
    successDescription: 'Embed code copied to clipboard',
  });

  // Generate embed code based on selections
  const embedCode = useMemo(() => {
    const params = new URLSearchParams();
    if (theme !== 'auto') params.set('theme', theme);
    if (height !== '400') params.set('height', height);
    if (!showCopy) params.set('copy', 'false');
    if (showDownload) params.set('download', 'true');
    if (borderRadius !== '8') params.set('radius', borderRadius);
    if (viewMode !== 'smart') params.set('view', viewMode);
    if (viewMode === 'tabs') params.set('tabs', 'true');

    const queryString = params.toString() ? '?' + params.toString() : '';

    switch (embedType) {
      case 'widget':
        return `<iframe 
  src="${baseUrl}/embed/${shareId}${queryString}" 
  width="${customWidth}" 
  height="${height}px" 
  frameborder="0" 
  style="border: 1px solid #e5e7eb; border-radius: ${borderRadius}px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);" 
  loading="lazy"
  allowfullscreen>
</iframe>`;

      case 'block':
        return `<div data-json-viewer="${shareId}" 
     data-theme="${theme}" 
     data-height="${height}"
     ${viewMode !== 'smart' ? `data-view="${viewMode}"` : ''}
     ${viewMode === 'tabs' ? 'data-tabs="true"' : ''}
     ${!showCopy ? 'data-copy="false"' : ''}
     ${showDownload ? 'data-download="true"' : ''}>
  <!-- Fallback content -->
  <pre style="background: #f6f8fa; padding: 16px; border-radius: ${borderRadius}px; overflow: auto;">
${jsonPreview ? jsonPreview.slice(0, 200) + '...' : 'Loading JSON...'}
  </pre>
</div>
<script async src="${baseUrl}/embed.js"></script>`;

      case 'card':
        return `<div class="json-preview-card" 
     style="border: 1px solid #e1e5e9; border-radius: ${borderRadius}px; padding: 16px; background: white;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z"/>
    </svg>
    <h4 style="margin: 0; color: #1f2937;">JSON Data</h4>
    <span style="color: #6b7280; font-size: 12px;">${new Date().toLocaleDateString()}</span>
  </div>
  <pre style="background: #f9fafb; padding: 12px; border-radius: 4px; overflow: auto; margin: 0; font-size: 13px; color: #374151; max-height: 120px;">
${jsonPreview ? jsonPreview.slice(0, 300) + (jsonPreview.length > 300 ? '\n...' : '') : 'Loading...'}
  </pre>
  <div style="margin-top: 12px;">
    <a href="${baseUrl}/library/${shareId}" 
       target="_blank" 
       style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500;"
       onmouseover="this.style.textDecoration='underline'"
       onmouseout="this.style.textDecoration='none'">
      → View Full JSON
    </a>
  </div>
</div>`;

      default:
        return '';
    }
  }, [
    embedType,
    viewMode,
    theme,
    height,
    showCopy,
    showDownload,
    customWidth,
    borderRadius,
    baseUrl,
    shareId,
    jsonPreview,
  ]);

  const copyToClipboard = useCallback(() => {
    copy(embedCode);
  }, [copy, embedCode]);

  const openPreview = useCallback(() => {
    try {
      setPreviewError(false);
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Embed Preview</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 20px; 
                background: #f8fafc; 
              }
              .container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                padding: 20px; 
                border-radius: 12px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              h1 { color: #1f2937; margin-bottom: 20px; }
              .embed-container { margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎯 Embed Preview</h1>
              <p>This is how your JSON embed will look:</div>
              <div class="embed-container">
                ${embedCode}
              </div>
              <p><small>Close this window to return to the embed generator.</small></p>
            </div>
          </body>
        </html>
      `);
        previewWindow.document.close();
      } else {
        setPreviewError(true);
        showErrorToast(
          'Could not open preview window. Please check your popup blocker settings.',
          'Preview Failed'
        );
      }
    } catch (error) {
      setPreviewError(true);
      showErrorToast('Failed to generate preview. Please try again.', 'Preview Error');
    }
  }, [embedCode]);

  const embedTypes = [
    {
      id: 'widget' as const,
      name: 'Interactive Widget',
      description: 'Full-featured JSON viewer with expand/collapse',
      icon: <Smartphone className="h-4 w-4" />,
      recommended: true,
      useCases: ['Websites', 'Web Apps', 'Dashboards'],
    },
    {
      id: 'block' as const,
      name: 'Code Block',
      description: 'Syntax-highlighted JSON for documentation',
      icon: <Code2 className="h-4 w-4" />,
      recommended: false,
      useCases: ['Documentation', 'Blogs', 'Technical Posts'],
    },
    {
      id: 'card' as const,
      name: 'Preview Card',
      description: 'Compact preview with link to full view',
      icon: <Share className="h-4 w-4" />,
      recommended: false,
      useCases: ['Social Media', 'Forums', 'Quick Previews'],
    },
  ];

  return (
    <BaseModal
      open={isOpen}
      onOpenChange={onClose}
      title="Embed Your JSON"
      icon={<Sparkles className="h-5 w-5 text-blue-500" />}
      className="max-w-5xl w-[95vw]"
      maxHeight="90vh"
      showFooter={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Embed Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Choose Embed Type</Label>
            <div className="space-y-3">
              {embedTypes.map((type) => (
                <div
                  key={type.id}
                  className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${
                    embedType === type.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setEmbedType(type.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 p-2 rounded-lg ${
                        embedType === type.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
                      }`}
                    >
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">{type.name}</h4>
                        {type.recommended && (
                          <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {type.useCases.map((useCase) => (
                          <Badge key={useCase} variant="outline" className="text-xs">
                            {useCase}
                          </Badge>
                        ))}
                      </div>

                      {/* View Mode Selection - Only for Interactive Widget */}
                      {type.id === 'widget' && embedType === 'widget' && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                          <Label className="text-sm font-medium mb-2 block">View Mode</Label>
                          <Select
                            value={viewMode}
                            onValueChange={(value: ViewMode) => setViewMode(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="smart">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-3 w-3" />
                                  <span>Smart View (Auto-optimized)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="tree">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span>Tree View (Hierarchical)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="editor">
                                <div className="flex items-center gap-2">
                                  <Code2 className="h-3 w-3" />
                                  <span>Code Editor (Syntax Highlighted)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="flow">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                  </svg>
                                  <span>Flow View (Visual Graph)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="list">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 6h16M4 12h16M4 18h16"
                                    />
                                  </svg>
                                  <span>List View (Flat Structure)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="tabs">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                                    />
                                  </svg>
                                  <span>Tabbed View (All Modes)</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-2">
                            {viewMode === 'smart' &&
                              'Automatically chooses the best view based on your JSON structure'}
                            {viewMode === 'tree' &&
                              'Expandable tree structure, perfect for nested objects'}
                            {viewMode === 'editor' &&
                              'Syntax-highlighted code view with line numbers'}
                            {viewMode === 'flow' &&
                              'Interactive node graph showing data relationships'}
                            {viewMode === 'list' && 'Searchable flat list of all key-value pairs'}
                            {viewMode === 'tabs' &&
                              'Full interface with tabs to switch between all views'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        embedType === type.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {embedType === type.id && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Customize Appearance</Label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Theme</Label>
                <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (matches site)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Height</Label>
                <Select value={height} onValueChange={setHeight}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Compact (300px)</SelectItem>
                    <SelectItem value="400">Small (400px)</SelectItem>
                    <SelectItem value="500">Medium (500px)</SelectItem>
                    <SelectItem value="600">Large (600px)</SelectItem>
                    <SelectItem value="800">Extra Large (800px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {embedType === 'widget' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Width</Label>
                  <Input
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="100%, 800px, etc."
                  />
                </div>
                <div>
                  <Label className="text-sm">Border Radius</Label>
                  <Select value={borderRadius} onValueChange={setBorderRadius}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="4">Small (4px)</SelectItem>
                      <SelectItem value="8">Medium (8px)</SelectItem>
                      <SelectItem value="12">Large (12px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showCopy"
                  checked={showCopy}
                  onCheckedChange={(checked) => setShowCopy(checked === true)}
                />
                <Label htmlFor="showCopy" className="text-sm">
                  Show copy button
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showDownload"
                  checked={showDownload}
                  onCheckedChange={(checked) => setShowDownload(checked === true)}
                />
                <Label htmlFor="showDownload" className="text-sm">
                  Show download link
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Code & Preview */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Generated Embed Code</Label>
              <Badge variant="outline" className="text-xs">
                Step 3
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openPreview}
                className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
                disabled={previewError}
              >
                {previewError ? (
                  <X className="h-4 w-4 text-red-500" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {previewError ? 'Preview Failed' : 'Live Preview'}
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button
                onClick={copyToClipboard}
                className={cn(
                  'flex items-center gap-2 transition-all duration-200 hover:scale-105',
                  copied && 'bg-green-600 hover:bg-green-700'
                )}
                disabled={copied}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto max-h-96 font-mono">
              <code>{embedCode}</code>
            </pre>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Pro Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Fully responsive design that adapts to any screen size</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Automatic theme detection matches your website&apos;s appearance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Lightning-fast loading with intelligent caching</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>SEO-friendly with contextual metadata in the footer</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

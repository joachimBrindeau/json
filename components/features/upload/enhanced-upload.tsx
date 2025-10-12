'use client';

import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBackendStore } from '@/lib/store/backend';
import { Upload, FileJson, AlertCircle, CheckCircle2, Zap, Database, Activity, X, Loader2, FileX, Globe, Link } from 'lucide-react';

export function EnhancedUpload({ className = '' }: { className?: string }) {
  const { toast } = useToast();
  const { uploadJson, analyzeJson, isUploading, uploadProgress, currentDocument } =
    useBackendStore();
  const [title, setTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [analysis, setAnalysis] = useState<{
    analysis: {
      size: number;
      nodeCount: number;
      maxDepth: number;
      complexity: string;
    };
    recommendations: string[];
    suggestions: {
      viewer: string;
      streaming: boolean;
      chunking: boolean;
      caching: boolean;
    };
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith('.json') && !file.type.includes('json')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a JSON file',
          variant: 'destructive',
        });
        return;
      }

      // Check file size (1GB limit)
      const maxSize = 1024 * 1024 * 1024; // 1GB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 1GB',
          variant: 'destructive',
        });
        return;
      }

      try {
        // First analyze the JSON structure
        const content = await file.text();
        toast({
          title: 'Analyzing JSON...',
          description: 'Processing file structure and optimizations',
        });

        const analysisResult = await analyzeJson(content);
        setAnalysis(analysisResult as {
          analysis: {
            size: number;
            nodeCount: number;
            maxDepth: number;
            complexity: string;
          };
          recommendations: string[];
          suggestions: {
            viewer: string;
            streaming: boolean;
            chunking: boolean;
            caching: boolean;
          };
        });

        // Upload with the analysis
        await uploadJson(file, title || file.name);

        toast({
          title: 'Upload successful',
          description: `JSON file uploaded and optimized for ${(analysisResult as any)?.suggestions?.viewer || 'standard'} viewing`,
        });

        setTitle('');
      } catch (error) {
        console.error('Upload failed:', error);
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    },
    [uploadJson, analyzeJson, title, toast]
  );

  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) {
      toast({
        title: 'URL required',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL',
        variant: 'destructive',
      });
      return;
    }

    setIsImportingUrl(true);

    try {
      toast({
        title: 'Importing from URL...',
        description: 'Fetching and analyzing JSON data',
      });

      // Fetch JSON from URL
      const response = await fetch(urlInput, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json') && !contentType.includes('text')) {
        toast({
          title: 'Invalid content type',
          description: 'The URL does not return JSON data',
          variant: 'destructive',
        });
        return;
      }

      const content = await response.text();
      
      // Validate JSON
      try {
        JSON.parse(content);
      } catch {
        toast({
          title: 'Invalid JSON',
          description: 'The fetched content is not valid JSON',
          variant: 'destructive',
        });
        return;
      }

      // Analyze the JSON
      const analysisResult = await analyzeJson(content);
      setAnalysis(analysisResult as typeof analysis);

      // Create a file-like object from the content
      const blob = new Blob([content], { type: 'application/json' });
      const file = new File([blob], `import-${Date.now()}.json`, { type: 'application/json' });

      // Upload the JSON
      await uploadJson(file, title || `Imported from ${new URL(urlInput).hostname}`);

      toast({
        title: 'Import successful',
        description: `JSON imported from URL and optimized for ${(analysisResult as any)?.suggestions?.viewer || 'standard'} viewing`,
      });

      setUrlInput('');
      setTitle('');
    } catch (error) {
      console.error('URL import failed:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import from URL',
        variant: 'destructive',
      });
    } finally {
      setIsImportingUrl(false);
    }
  }, [urlInput, title, analyzeJson, uploadJson, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt'],
      'text/json': ['.json'],
    },
    maxFiles: 1,
    disabled: isUploading,
    multiple: false,
  });
  
  const clearError = useCallback(() => {
    setUploadError(null);
    setValidationState('idle');
  }, []);
  
  const handleManualUpload = useCallback(() => {
    clearError();
    fileInputRef.current?.click();
  }, [clearError]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} ref={fileInputRef} />

          {isUploading ? (
            <div className="space-y-4">
              <Activity className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
              <div>
                <p className="text-lg font-medium text-gray-700">Uploading...</p>
                <p className="text-sm text-gray-500">Processing and optimizing your JSON</p>
              </div>
              <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
              <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive ? 'Drop your JSON file here' : 'Upload JSON File'}
                </p>
                <p className="text-sm text-gray-500">
                  Drag & drop or click to select • Up to 1GB • .json files
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button type="button" variant="outline">
                  <FileJson className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* URL Import Section */}
        {!isUploading && !isImportingUrl && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Import from URL</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="url">JSON URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://api.example.com/data.json"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    data-testid="url-input"
                  />
                  <Button
                    onClick={handleUrlImport}
                    disabled={!urlInput.trim() || isImportingUrl}
                    data-testid="import-url"
                  >
                    {isImportingUrl ? (
                      <Activity className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Import JSON data directly from a URL (must return valid JSON)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* URL Import Progress */}
        {isImportingUrl && (
          <div className="space-y-4 border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500 animate-spin" />
              <h3 className="text-lg font-medium">Importing from URL...</h3>
            </div>
            <p className="text-sm text-gray-600">Fetching and analyzing JSON data from: {urlInput}</p>
          </div>
        )}

        {/* Title Input */}
        {!isUploading && !isImportingUrl && (
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Enter a title for your JSON..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-medium">Analysis Results</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Size</p>
                <p className="font-medium">{formatSize(analysis.analysis.size)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Nodes</p>
                <p className="font-medium">{analysis.analysis.nodeCount.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Max Depth</p>
                <p className="font-medium">{analysis.analysis.maxDepth}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Complexity</p>
                <Badge className={getComplexityColor(analysis.analysis.complexity)}>
                  {analysis.analysis.complexity}
                </Badge>
              </div>
            </div>

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recommendations</h4>
                <div className="space-y-1">
                  {analysis.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Suggestions */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Optimizations</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.suggestions.streaming && (
                  <Badge variant="outline">
                    <Database className="h-3 w-3 mr-1" />
                    Streaming Enabled
                  </Badge>
                )}
                {analysis.suggestions.chunking && (
                  <Badge variant="outline">
                    <Activity className="h-3 w-3 mr-1" />
                    Chunking Active
                  </Badge>
                )}
                {analysis.suggestions.caching && (
                  <Badge variant="outline">
                    <Zap className="h-3 w-3 mr-1" />
                    Cached
                  </Badge>
                )}
                <Badge variant="outline">Optimal Viewer: {analysis.suggestions.viewer}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Current Document Info */}
        {currentDocument && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-medium">Current Document</h3>
            </div>

            <div className="space-y-2">
              <p>
                <strong>Title:</strong> {currentDocument.title}
              </p>
              <p>
                <strong>Size:</strong> {formatSize(currentDocument.size)}
              </p>
              <p>
                <strong>Share ID:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {currentDocument.shareId}
                </code>
              </p>
              <div className="flex gap-2">
                <Badge className={getComplexityColor(currentDocument.complexity)}>
                  {currentDocument.complexity}
                </Badge>
                <Badge variant="outline">{currentDocument.nodeCount.toLocaleString()} nodes</Badge>
                <Badge variant="outline">Depth: {currentDocument.maxDepth}</Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

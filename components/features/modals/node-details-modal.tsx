'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Palette,
  Mail,
  Image as ImageIcon,
  Video,
  Music,
  Hash,
  Type,
  ToggleLeft,
  Database,
  Package,
  X,
  Code2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NodeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: JsonNode | null;
}

interface JsonNode {
  id: string;
  key: string;
  value: any;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  path: string;
  children?: JsonNode[];
  size: number;
  childCount: number;
}

interface DataTypeDetection {
  isUrl: boolean;
  isEmail: boolean;
  isColor: boolean;
  isDate: boolean;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isBase64: boolean;
}

const TYPE_COLORS = {
  object: 'bg-blue-50 text-blue-700 border-blue-200',
  array: 'bg-green-50 text-green-700 border-green-200',
  string: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  number: 'bg-purple-50 text-purple-700 border-purple-200',
  boolean: 'bg-orange-50 text-orange-700 border-orange-200',
  null: 'bg-gray-50 text-gray-700 border-gray-200',
};

const TYPE_ICONS = {
  object: Package,
  array: Database,
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  null: X,
};

function detectDataType(value: string): DataTypeDetection {
  const urlRegex =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  const base64Regex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/;
  const imageUrlRegex = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
  const videoUrlRegex = /\.(mp4|avi|mov|wmv|flv|webm|mkv)(\?.*)?$/i;
  const audioUrlRegex = /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i;

  return {
    isUrl: urlRegex.test(value),
    isEmail: emailRegex.test(value),
    isColor: colorRegex.test(value),
    isDate: dateRegex.test(value),
    isImage: base64Regex.test(value) ? value.includes('data:image') : imageUrlRegex.test(value),
    isVideo: base64Regex.test(value) ? value.includes('data:video') : videoUrlRegex.test(value),
    isAudio: base64Regex.test(value) ? value.includes('data:audio') : audioUrlRegex.test(value),
    isBase64: base64Regex.test(value),
  };
}

/**
 * Convert a path string to JSON Path expression format
 * @param path - The original path (e.g., "root.users.0.name" or "root['special-key'].value")
 * @returns JSON Path expression (e.g., "$.users[0].name" or "$['special-key'].value")
 */
function convertToJsonPath(path: string): string {
  if (!path || path === 'root') {
    return '$';
  }
  
  // Handle edge case of trailing dot
  if (path === 'root.') {
    return '$.';
  }

  // Remove 'root' prefix and replace with '$'
  let jsonPath = path.replace(/^root\.?/, '$');
  
  // If the path doesn't start with '$', add it
  if (!jsonPath.startsWith('$')) {
    jsonPath = '$.' + jsonPath;
  }
  
  // Convert array indices from dot notation to bracket notation
  // e.g., $.users.0.name -> $.users[0].name
  jsonPath = jsonPath.replace(/\.(\d+)(?=\.|$)/g, '[$1]');
  
  // Handle properties that already have bracket notation
  // Ensure they're properly formatted
  jsonPath = jsonPath.replace(/\['([^']+)'\]/g, "['$1']");
  jsonPath = jsonPath.replace(/\["([^"]+)"\]/g, '["$1"]');
  
  // Handle special characters in property names
  // Properties with special characters should use bracket notation
  const parts = jsonPath.split(/(\[[^\]]+\]|\$)/);
  const processedParts = parts.map((part, index) => {
    // Skip $ and already bracketed parts
    if (part === '$' || part.startsWith('[') || part === '') {
      return part;
    }
    
    // Process dot-separated properties
    const properties = part.split('.');
    const processedProps = properties.map(prop => {
      if (prop === '') return '';
      
      // Check if property needs bracket notation
      // Properties need brackets if they contain special characters or start with a number
      const needsBrackets = /[^a-zA-Z0-9_]/.test(prop) || /^\d/.test(prop);
      
      if (needsBrackets && !prop.startsWith('[')) {
        return `['${prop}']`;
      }
      
      // For normal properties, ensure they have a dot prefix if needed
      if (index > 0 && parts[index - 1] !== '$' && !parts[index - 1].endsWith(']')) {
        return '.' + prop;
      }
      
      return prop.startsWith('.') ? prop : '.' + prop;
    });
    
    return processedProps.join('');
  });
  
  // Clean up the result
  jsonPath = processedParts.join('');
  
  // Remove any double dots
  jsonPath = jsonPath.replace(/\.{2,}/g, '.');
  
  // Ensure proper formatting
  jsonPath = jsonPath.replace(/\$\./, '$.');
  
  // Handle edge case where path starts with $. but should be $[
  jsonPath = jsonPath.replace(/\$\.\[/, '$[');
  
  return jsonPath;
}

const CopyButton = memo(({ text, className = '', label }: { text: string; className?: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: label ? `${label} copied to clipboard` : 'Content copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Unable to copy to clipboard',
        variant: 'destructive',
      });
    }
  }, [text, toast]);

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className={`h-6 w-6 p-0 ${className}`}>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
});

CopyButton.displayName = 'CopyButton';

const StringRenderer = memo(({ value }: { value: string }) => {
  const detection = detectDataType(value);
  const { toast } = useToast();

  const handleOpenUrl = useCallback(() => {
    window.open(value, '_blank', 'noopener,noreferrer');
  }, [value]);

  const handleEmailClick = useCallback(() => {
    window.location.href = `mailto:${value}`;
  }, [value]);

  return (
    <div className="space-y-3">
      {/* Main value display */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <code className="flex-1 text-sm bg-muted p-2 rounded break-all font-mono">
              &quot;{value}&quot;
            </code>
            <CopyButton text={value} />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced displays based on data type */}
      <div className="space-y-2">
        {detection.isColor && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="text-sm font-medium">Color Preview</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-8 rounded border-2 border-border"
                  style={{ backgroundColor: value }}
                />
                <Badge variant="secondary">{value.toUpperCase()}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {detection.isDate && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Date/Time</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {new Date(value).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(value).toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {detection.isEmail && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email Address</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="outline" size="sm" onClick={handleEmailClick} className="gap-2">
                <Mail className="h-3 w-3" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        )}

        {detection.isUrl && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm font-medium">URL</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="outline" size="sm" onClick={handleOpenUrl} className="gap-2">
                <ExternalLink className="h-3 w-3" />
                Open Link
              </Button>
            </CardContent>
          </Card>
        )}

        {detection.isImage && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Image Preview</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg border overflow-hidden bg-muted/20">
                <img
                  src={value}
                  alt="Preview"
                  className="max-w-full max-h-64 object-contain mx-auto"
                  onError={() => {
                    toast({
                      title: 'Failed to load image',
                      description: 'The image could not be displayed',
                      variant: 'destructive',
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {detection.isVideo && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">Video Preview</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg border overflow-hidden bg-muted/20">
                <video
                  src={value}
                  controls
                  preload="metadata"
                  className="max-w-full max-h-64 mx-auto"
                  onError={() => {
                    toast({
                      title: 'Failed to load video',
                      description: 'The video could not be displayed',
                      variant: 'destructive',
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {detection.isAudio && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span className="text-sm font-medium">Audio Preview</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <audio
                src={value}
                controls
                preload="metadata"
                className="w-full"
                onError={() => {
                  toast({
                    title: 'Failed to load audio',
                    description: 'The audio could not be played',
                    variant: 'destructive',
                  });
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

StringRenderer.displayName = 'StringRenderer';

const NumberRenderer = memo(({ value }: { value: number }) => (
  <Card>
    <CardContent className="p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <code className="text-lg font-mono font-bold text-purple-600">
              {value.toLocaleString()}
            </code>
            <CopyButton text={value.toString()} />
          </div>
          <div className="text-xs text-muted-foreground space-x-4">
            <span>Decimal: {value}</span>
            <span>Binary: {value.toString(2)}</span>
            <span>Hex: 0x{value.toString(16).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

NumberRenderer.displayName = 'NumberRenderer';

const BooleanRenderer = memo(({ value }: { value: boolean }) => (
  <Card>
    <CardContent className="p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Badge variant={value ? 'default' : 'secondary'} className="px-3 py-1">
            <ToggleLeft className="h-4 w-4 mr-1" />
            {value.toString()}
          </Badge>
        </div>
        <CopyButton text={value.toString()} />
      </div>
    </CardContent>
  </Card>
));

BooleanRenderer.displayName = 'BooleanRenderer';

const ObjectRenderer = memo(({ value, childCount }: { value: object; childCount: number }) => {
  const jsonString = JSON.stringify(value, null, 2);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Object Properties</span>
            </div>
            <Badge variant="outline">{childCount} properties</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="max-h-64">
            <div className="flex justify-between items-start gap-2">
              <pre className="text-xs font-mono bg-muted p-3 rounded flex-1 overflow-x-auto">
                {jsonString}
              </pre>
              <CopyButton text={jsonString} className="flex-shrink-0" />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
});

ObjectRenderer.displayName = 'ObjectRenderer';

const ArrayRenderer = memo(({ value, childCount }: { value: any[]; childCount: number }) => {
  const jsonString = JSON.stringify(value, null, 2);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Array Items</span>
            </div>
            <Badge variant="outline">{childCount} items</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="max-h-64">
            <div className="flex justify-between items-start gap-2">
              <pre className="text-xs font-mono bg-muted p-3 rounded flex-1 overflow-x-auto">
                {jsonString}
              </pre>
              <CopyButton text={jsonString} className="flex-shrink-0" />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
});

ArrayRenderer.displayName = 'ArrayRenderer';

const NullRenderer = memo(() => (
  <Card>
    <CardContent className="p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="px-3 py-1 text-gray-500">
          <X className="h-3 w-3 mr-1" />
          null
        </Badge>
        <CopyButton text="null" />
      </div>
    </CardContent>
  </Card>
));

NullRenderer.displayName = 'NullRenderer';

function NodeDetailsModalComponent({ open, onOpenChange, node }: NodeDetailsModalProps) {
  if (!node) return null;

  const TypeIcon = TYPE_ICONS[node.type];
  const typeColorClass = TYPE_COLORS[node.type];

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const renderValue = () => {
    switch (node.type) {
      case 'string':
        return <StringRenderer value={node.value} />;
      case 'number':
        return <NumberRenderer value={node.value} />;
      case 'boolean':
        return <BooleanRenderer value={node.value} />;
      case 'object':
        return <ObjectRenderer value={node.value} childCount={node.childCount} />;
      case 'array':
        return <ArrayRenderer value={node.value} childCount={node.childCount} />;
      case 'null':
        return <NullRenderer />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5" />
              <span>Node Details</span>
            </div>
            <Badge className={`${typeColorClass} border`}>{node.type}</Badge>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="font-medium text-foreground">Key:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {node.key === 'JSON Root' ? 'root' : node.key}
                </code>
                <CopyButton text={node.key} label="Key" />
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-foreground">Path:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 truncate">
                  {node.path.replace('root.', '') || 'root'}
                </code>
                <CopyButton text={node.path} label="Path" />
              </div>
              <div className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        <Code2 className="h-3 w-3" />
                        JSON Path:
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        JSON Path expression for use in tools like jq, JSONPath libraries, or API queries
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <code className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex-1 truncate font-mono">
                  {convertToJsonPath(node.path)}
                </code>
                <CopyButton text={convertToJsonPath(node.path)} label="JSON Path" />
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-medium">Size</span>
                <Badge variant="outline">{formatSize(node.size)}</Badge>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Level</span>
                <Badge variant="outline">{node.level}</Badge>
              </div>
            </div>

            <Separator />

            {/* Value content */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Content</h4>
              {renderValue()}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export const NodeDetailsModal = memo(NodeDetailsModalComponent);
NodeDetailsModal.displayName = 'NodeDetailsModal';

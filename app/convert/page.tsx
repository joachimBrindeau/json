'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { UnifiedButton } from '@/components/ui/unified-button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useBackendStore } from '@/lib/store/backend';
import {
  ArrowRightLeft,
  FileJson,
  FileCode,
  FileSpreadsheet,
  FileText,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormatSelector } from '@/components/ui/format-selector';
import { ViewerActions } from '@/components/features/viewer';
import { EditorActions } from '@/components/features/editor/EditorActions';
import { MonacoEditor } from '@/components/features/editor/MonacoEditorWithLoading';
import { useMonacoEditor } from '@/hooks/use-monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { logger } from '@/lib/logger';
import { validateJson } from '@/lib/utils/json-validators';
import { toastPatterns, showSuccessToast, showErrorToast } from '@/lib/utils/toast-helpers';

type ConversionFormat = 'json' | 'yaml' | 'xml' | 'csv' | 'toml' | 'properties' | 'typescript' | 'javascript';
type InputFormat = 'autodetect' | ConversionFormat;

interface ConversionOption {
  id: ConversionFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
  fileExtension: string;
  mimeType: string;
}

const conversionOptions: ConversionOption[] = [
  {
    id: 'json',
    label: 'JSON',
    icon: <FileJson className="h-4 w-4" />,
    description: 'JSON format',
    fileExtension: 'json',
    mimeType: 'application/json'
  },
  {
    id: 'yaml',
    label: 'YAML',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Convert to YAML format',
    fileExtension: 'yml',
    mimeType: 'text/yaml'
  },
  {
    id: 'xml',
    label: 'XML',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Convert to XML format',
    fileExtension: 'xml',
    mimeType: 'application/xml'
  },
  {
    id: 'csv',
    label: 'CSV',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Convert to CSV format (flattened)',
    fileExtension: 'csv',
    mimeType: 'text/csv'
  },
  {
    id: 'toml',
    label: 'TOML',
    icon: <FileText className="h-4 w-4" />,
    description: 'Convert to TOML format',
    fileExtension: 'toml',
    mimeType: 'text/plain'
  },
  {
    id: 'properties',
    label: 'Properties',
    icon: <FileText className="h-4 w-4" />,
    description: 'Convert to Java Properties format',
    fileExtension: 'properties',
    mimeType: 'text/plain'
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Generate TypeScript interface',
    fileExtension: 'ts',
    mimeType: 'text/plain'
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Convert to JavaScript object',
    fileExtension: 'js',
    mimeType: 'text/javascript'
  }
];

interface InputFormatOption {
  id: InputFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const inputFormatOptions: InputFormatOption[] = [
  {
    id: 'autodetect',
    label: 'Autodetect',
    icon: <Search className="h-4 w-4" />,
    description: 'Automatically detect input format'
  },
  ...conversionOptions.map(option => ({
    id: option.id,
    label: option.label,
    icon: option.icon,
    description: option.description
  }))
];

export default function ConvertPage() {
  const { currentJson, setCurrentJson } = useBackendStore();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ConversionFormat>('yaml');
  const [inputFormat, setInputFormat] = useState<InputFormat>('autodetect');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Use Monaco editor hook for both editors
  const inputEditor = useMonacoEditor(input.length);
  const outputEditor = useMonacoEditor(output.length, { readOnly: true });

  // Initialize input from currentJson when page loads
  useEffect(() => {
    if (currentJson && currentJson.trim()) {
      setInput(currentJson);
    }
  }, [currentJson]);

  // Auto-detect input format
  const detectInputFormat = (content: string): ConversionFormat => {
    if (!content.trim()) return 'json';
    
    try {
      // Try JSON first
      JSON.parse(content);
      return 'json';
    } catch {
      // Check for YAML patterns
      if (content.includes('---') || /^\s*\w+:\s*\S/m.test(content)) {
        return 'yaml';
      }
      
      // Check for XML patterns
      if (content.trim().startsWith('<?xml') || /<\w+[^>]*>/.test(content)) {
        return 'xml';
      }
      
      // Check for CSV patterns
      if (content.split('\n').some(line => line.includes(',') && line.split(',').length > 1)) {
        return 'csv';
      }
      
      // Check for TOML patterns
      if (/^\s*\[\w+\]/m.test(content) || /^\s*\w+\s*=\s*.+/m.test(content)) {
        return 'toml';
      }
      
      // Check for properties patterns
      if (/^\s*\w+[\w.]*\s*=\s*.*/m.test(content)) {
        return 'properties';
      }
      
      // Check for TypeScript/JavaScript patterns
      if (content.includes('interface ') || content.includes('type ') || content.includes('export ')) {
        return content.includes('interface ') ? 'typescript' : 'javascript';
      }
      
      // Default to JSON
      return 'json';
    }
  };

  const hasValidInput = inputFormat === 'autodetect' ? 
    detectInputFormat(input) !== 'json' || validateJson(input) :
    inputFormat === 'json' ? validateJson(input) : !!input.trim();

  // Parse input based on format
  const parseInput = (content: string, format: InputFormat): any => {
    if (!content.trim()) return null;
    
    const actualFormat = format === 'autodetect' ? detectInputFormat(content) : format;
    
    try {
      switch (actualFormat) {
        case 'json':
          return JSON.parse(content);
        case 'yaml':
          // Simple YAML parser for basic structures
          return parseSimpleYaml(content);
        case 'xml':
          return parseSimpleXml(content);
        case 'csv':
          return parseCsv(content);
        case 'toml':
          return parseSimpleToml(content);
        case 'properties':
          return parseProperties(content);
        case 'typescript':
        case 'javascript':
          // For TS/JS, try to extract JSON-like structures
          return parseJsObject(content);
        default:
          return JSON.parse(content);
      }
    } catch (error) {
      logger.error({ err: error, format: actualFormat }, 'Parse error');
      return null;
    }
  };

  // Simple parsers for different formats
  const parseSimpleYaml = (content: string): any => {
    // Basic YAML parsing - this is simplified
    const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    const result: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        const cleanKey = key.trim().replace(/^-\s*/, '');
        
        if (value) {
          // Try to parse as JSON value
          try {
            result[cleanKey] = JSON.parse(value);
          } catch {
            result[cleanKey] = value.replace(/^["']|["']$/g, '');
          }
        } else {
          result[cleanKey] = null;
        }
      }
    }
    
    return result;
  };

  const parseSimpleXml = (content: string): any => {
    // Very basic XML to JSON conversion
    const result: any = {};
    const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      const [, tagName, tagContent] = match;
      try {
        result[tagName] = JSON.parse(tagContent);
      } catch {
        result[tagName] = tagContent.trim();
      }
    }

    return Object.keys(result).length > 0 ? result : { content: content.replace(/<[^>]*>/g, '') };
  };

  const parseCsv = (content: string): any => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
    
    return data;
  };

  const parseSimpleToml = (content: string): any => {
    const result: any = {};
    const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    
    for (const line of lines) {
      if (line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        const cleanKey = key.trim();
        
        try {
          result[cleanKey] = JSON.parse(value);
        } catch {
          result[cleanKey] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
    
    return result;
  };

  const parseProperties = (content: string): any => {
    const result: any = {};
    const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    
    for (const line of lines) {
      if (line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        const cleanKey = key.trim();
        
        // Handle nested properties
        const keyParts = cleanKey.split('.');
        let current = result;
        
        for (let i = 0; i < keyParts.length - 1; i++) {
          if (!current[keyParts[i]]) {
            current[keyParts[i]] = {};
          }
          current = current[keyParts[i]];
        }
        
        current[keyParts[keyParts.length - 1]] = value;
      }
    }
    
    return result;
  };

  const parseJsObject = (content: string): any => {
    // Try to extract JSON-like structures from JS/TS code
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Remove trailing semicolons and fix common JS-to-JSON issues
        let jsonStr = jsonMatch[0]
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/(\w+):/g, '"$1":')
          .replace(/'/g, '"');
        return JSON.parse(jsonStr);
      } catch {
        return { code: content };
      }
    }
    return { code: content };
  };

  const convertToYaml = (obj: any): string => {
    const yamlify = (value: any, indent = 0): string => {
      const spaces = '  '.repeat(indent);
      
      if (value === null) return 'null';
      if (typeof value === 'boolean') return value.toString();
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'string') {
        // Quote strings that contain special characters or start with numbers
        if (/^[0-9]|[:#\[\]{}|>-]/.test(value) || value.includes('\n')) {
          return `"${value.replace(/"/g, '\\"')}"`;
        }
        return value;
      }
      
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return value.map(item => `${spaces}- ${yamlify(item, indent + 1).replace(/^\s+/, '')}`).join('\n');
      }
      
      if (typeof value === 'object') {
        if (Object.keys(value).length === 0) return '{}';
        return Object.entries(value)
          .map(([key, val]) => {
            const yamlValue = yamlify(val, indent + 1);
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
              return `${spaces}${key}:\n${yamlValue}`;
            } else if (Array.isArray(val) && val.length > 0) {
              return `${spaces}${key}:\n${yamlValue}`;
            } else {
              return `${spaces}${key}: ${yamlValue}`;
            }
          })
          .join('\n');
      }
      
      return String(value);
    };
    
    return yamlify(obj);
  };

  const convertToXml = (obj: any, rootName = 'root'): string => {
    const xmlify = (value: any, key: string): string => {
      if (value === null) return `<${key}/>`;
      if (typeof value === 'boolean' || typeof value === 'number') {
        return `<${key}>${value}</${key}>`;
      }
      if (typeof value === 'string') {
        const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<${key}>${escaped}</${key}>`;
      }
      if (Array.isArray(value)) {
        return value.map(item => xmlify(item, key)).join('\n');
      }
      if (typeof value === 'object') {
        const content = Object.entries(value)
          .map(([k, v]) => xmlify(v, k))
          .join('\n');
        return `<${key}>\n${content}\n</${key}>`;
      }
      return `<${key}>${value}</${key}>`;
    };
    
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlify(obj, rootName)}`;
  };

  const convertToCsv = (obj: any): string => {
    const flatten = (data: any, prefix = ''): Record<string, any> => {
      const result: Record<string, any> = {};
      
      for (const key in data) {
        const value = data[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value === null || value === undefined) {
          result[newKey] = '';
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              Object.assign(result, flatten(item, `${newKey}[${index}]`));
            } else {
              result[`${newKey}[${index}]`] = item;
            }
          });
        } else if (typeof value === 'object') {
          Object.assign(result, flatten(value, newKey));
        } else {
          result[newKey] = value;
        }
      }
      
      return result;
    };
    
    if (Array.isArray(obj)) {
      const allKeys = new Set<string>();
      const flattened = obj.map(item => {
        const flat = flatten(item);
        Object.keys(flat).forEach(key => allKeys.add(key));
        return flat;
      });
      
      const headers = Array.from(allKeys).sort();
      const csvRows = [headers.join(',')];
      
      flattened.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      });
      
      return csvRows.join('\n');
    } else {
      const flattened = flatten(obj);
      const headers = Object.keys(flattened);
      const values = headers.map(header => `"${String(flattened[header]).replace(/"/g, '""')}"`);
      return `${headers.join(',')}\n${values.join(',')}`;
    }
  };

  const convertToToml = (obj: any): string => {
    const tomlify = (value: any, key?: string): string => {
      if (typeof value === 'string') {
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      if (value === null) {
        return '""';
      }
      if (Array.isArray(value)) {
        const items = value.map(item => tomlify(item)).join(', ');
        return `[${items}]`;
      }
      if (typeof value === 'object') {
        const entries = Object.entries(value);
        const simpleEntries = entries.filter(([, v]) => typeof v !== 'object' || v === null);
        const complexEntries = entries.filter(([, v]) => typeof v === 'object' && v !== null);
        
        let result = '';
        
        // Simple key-value pairs
        simpleEntries.forEach(([k, v]) => {
          result += `${k} = ${tomlify(v)}\n`;
        });
        
        // Complex objects as tables
        complexEntries.forEach(([k, v]) => {
          if (result && !result.endsWith('\n\n')) result += '\n';
          const tableName = key ? `${key}.${k}` : k;
          result += `[${tableName}]\n`;
          result += tomlify(v, tableName);
        });
        
        return result;
      }
      return String(value);
    };
    
    return tomlify(obj);
  };

  const convertToProperties = (obj: any, prefix = ''): string => {
    const lines: string[] = [];
    
    const propertify = (value: any, key: string) => {
      if (value === null || value === undefined) {
        lines.push(`${key}=`);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([k, v]) => {
          propertify(v, key ? `${key}.${k}` : k);
        });
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          propertify(item, `${key}[${index}]`);
        });
      } else {
        const escapedValue = String(value).replace(/\\/g, '\\\\').replace(/=/g, '\\=').replace(/:/g, '\\:');
        lines.push(`${key}=${escapedValue}`);
      }
    };
    
    Object.entries(obj).forEach(([key, value]) => {
      propertify(value, prefix ? `${prefix}.${key}` : key);
    });
    
    return lines.join('\n');
  };

  const convertToTypeScript = (obj: any, interfaceName = 'JsonData'): string => {
    const getType = (value: any): string => {
      if (value === null) return 'null';
      if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        const itemType = getType(value[0]);
        return `${itemType}[]`;
      }
      if (typeof value === 'object') {
        const properties = Object.entries(value)
          .map(([key, val]) => `  ${key}: ${getType(val)};`)
          .join('\n');
        return `{\n${properties}\n}`;
      }
      return typeof value;
    };
    
    const interfaceType = getType(obj);
    return `interface ${interfaceName} ${interfaceType}`;
  };

  const convertToJavaScript = (obj: any): string => {
    return `const data = ${JSON.stringify(obj, null, 2)};

export default data;`;
  };

  const convertToJson = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const performConversion = useCallback((format?: ConversionFormat) => {
    const targetFormat = format || selectedFormat;

    if (!input.trim()) {
      toastPatterns.validation.noData('convert');
      return;
    }

    if (!hasValidInput) {
      const detectedFormat = inputFormat === 'autodetect' ? detectInputFormat(input) : inputFormat;
      toastPatterns.validation.invalid(detectedFormat.toUpperCase(), 'to convert');
      return;
    }

    try {
      const parsed = parseInput(input, inputFormat);
      if (!parsed) {
        throw new Error('Failed to parse input');
      }
      
      let converted = '';
      
      switch (targetFormat) {
        case 'json':
          converted = convertToJson(parsed);
          break;
        case 'yaml':
          converted = convertToYaml(parsed);
          break;
        case 'xml':
          converted = convertToXml(parsed);
          break;
        case 'csv':
          converted = convertToCsv(parsed);
          break;
        case 'toml':
          converted = convertToToml(parsed);
          break;
        case 'properties':
          converted = convertToProperties(parsed);
          break;
        case 'typescript':
          converted = convertToTypeScript(parsed);
          break;
        case 'javascript':
          converted = convertToJavaScript(parsed);
          break;
        default:
          throw new Error('Unsupported format');
      }
      
      setOutput(converted);
      if (format) {
        // Only show toast for manual conversion, not automatic
        const detectedFormat = inputFormat === 'autodetect' ? detectInputFormat(input) : inputFormat;
        showSuccessToast('Converted!', {
          description: `${detectedFormat.toUpperCase()} successfully converted to ${targetFormat.toUpperCase()}`,
        });
      }
    } catch (e) {
      if (format) {
        // Only show error toast for manual conversion
        showErrorToast(e, 'Conversion failed');
      }
    }
  }, [input, selectedFormat, hasValidInput, inputFormat, detectInputFormat]);

  // Auto-convert when format changes and valid input exists
  useEffect(() => {
    if (input.trim() && hasValidInput) {
      try {
        const parsed = parseInput(input, inputFormat);
        if (!parsed) {
          setOutput('');
          return;
        }
        
        let converted = '';
        
        switch (selectedFormat) {
          case 'json':
            converted = convertToJson(parsed);
            break;
          case 'yaml':
            converted = convertToYaml(parsed);
            break;
          case 'xml':
            converted = convertToXml(parsed);
            break;
          case 'csv':
            converted = convertToCsv(parsed);
            break;
          case 'toml':
            converted = convertToToml(parsed);
            break;
          case 'properties':
            converted = convertToProperties(parsed);
            break;
          case 'typescript':
            converted = convertToTypeScript(parsed);
            break;
          case 'javascript':
            converted = convertToJavaScript(parsed);
            break;
          default:
            converted = '';
        }
        
        setOutput(converted);
      } catch {
        setOutput('');
      }
    } else {
      setOutput('');
    }
  }, [selectedFormat, inputFormat, input, hasValidInput]);

  const handleSample = useCallback(() => {
    const sample = JSON.stringify({
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      address: {
        street: "123 Main St",
        city: "New York",
        country: "USA"
      },
      hobbies: ["reading", "coding", "gaming"],
      metadata: {
        created: "2024-01-01T00:00:00Z",
        updated: "2024-01-15T12:30:00Z"
      },
      settings: {
        theme: "dark",
        notifications: {
          email: true,
          push: false
        }
      }
    }, null, 2);
    setInput(sample);
    setOutput('');
  }, []);

  const handleReset = useCallback(() => {
    setInput('');
    setOutput('');
    toast({
      title: 'Reset',
      description: 'Cleared input and output',
    });
  }, [toast]);


  const getOutputLanguage = () => {
    switch (selectedFormat) {
      case 'json': return 'json';
      case 'yaml': return 'yaml';
      case 'xml': return 'xml';
      case 'typescript': return 'typescript';
      case 'javascript': return 'javascript';
      case 'csv': return 'csv';
      default: return 'plaintext';
    }
  };

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Action buttons header - consistent with editor */}
        <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/50">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Search JSON content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 pl-7 text-sm"
            />
          </div>
          
          {/* Action buttons for convert functionality */}
          <div className="flex items-center gap-1">
            <UnifiedButton
              variant="outline"
              size="sm"
              onClick={() => performConversion()}
              disabled={!input || !hasValidInput}
              className="h-7 px-2 text-xs"
              title="Convert JSON"
            >
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              Convert
            </UnifiedButton>
            <EditorActions
              output={output}
              hasContent={!!(input || output)}
              onSample={handleSample}
              onReset={handleReset}
              filename="converted"
              fileExtension={conversionOptions.find(opt => opt.id === selectedFormat)?.fileExtension || 'txt'}
              mimeType={conversionOptions.find(opt => opt.id === selectedFormat)?.mimeType || 'text/plain'}
              outputLabel="converted data"
            />
            <ViewerActions />
          </div>
        </div>


        {/* Editors container */}
        <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4 overflow-hidden">
          {/* Input editor */}
          <div className="flex-1 min-h-[200px] lg:min-h-[300px] flex flex-col bg-card rounded-lg border">
            <div className="px-2 py-1 bg-muted border-b text-xs font-medium text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Input</span>
                <FormatSelector
                  value={inputFormat}
                  onValueChange={(value) => setInputFormat(value as InputFormat)}
                  options={inputFormatOptions}
                />
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language={inputFormat === 'autodetect' ? detectInputFormat(input) : inputFormat}
                value={input}
                onChange={(value) => {
                  const newValue = value || '';
                  setInput(newValue);
                  setCurrentJson(newValue);
                }}
                theme={inputEditor.theme}
                onMount={inputEditor.handleEditorDidMount}
                beforeMount={(monaco) => defineMonacoThemes(monaco)}
                options={inputEditor.editorOptions}
              />
            </div>
          </div>

          {/* Output editor */}
          <div className="flex-1 min-h-[200px] lg:min-h-[300px] flex flex-col bg-card rounded-lg border">
            <div className="px-2 py-1 bg-muted border-b text-xs font-medium text-muted-foreground flex items-center gap-2">
              <span>Output</span>
              <FormatSelector
                value={selectedFormat}
                onValueChange={(value) => setSelectedFormat(value as ConversionFormat)}
                options={conversionOptions}
              />
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language={getOutputLanguage()}
                value={output}
                theme={outputEditor.theme}
                onMount={outputEditor.handleEditorDidMount}
                beforeMount={(monaco) => defineMonacoThemes(monaco)}
                options={outputEditor.editorOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
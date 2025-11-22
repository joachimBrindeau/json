'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useBackendStore } from '@/lib/store/backend';
import {
  FileJson,
  FileCode,
  FileSpreadsheet,
  FileText,
  Search,
  ArrowRightLeft,
} from 'lucide-react';
import { FormatSelector } from '@/components/ui/FormatSelector';
import { ViewerActions } from '@/components/features/viewer';
import { EditorPane } from '@/components/features/editor/EditorPane';
import { RelatedTools } from '@/components/shared/seo/RelatedTools';
import { useMonacoEditor } from '@/hooks/use-monaco-editor';
import { defineMonacoThemes } from '@/lib/editor/themes';
import { logger } from '@/lib/logger';
import { validateJson } from '@/lib/utils/json-validators';
import { toastPatterns, showSuccessToast, showErrorToast } from '@/lib/utils/toast-helpers';
import type { EditorAction } from '@/types/editor-actions';
import {
  createResetAction,
  createUndoAction,
  createRedoAction,
} from '@/lib/editor/action-factories';

type ConversionFormat =
  | 'json'
  | 'yaml'
  | 'xml'
  | 'csv'
  | 'toml'
  | 'properties'
  | 'typescript'
  | 'javascript';
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
    mimeType: 'application/json',
  },
  {
    id: 'yaml',
    label: 'YAML',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Convert to YAML format',
    fileExtension: 'yml',
    mimeType: 'text/yaml',
  },
  {
    id: 'xml',
    label: 'XML',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Convert to XML format',
    fileExtension: 'xml',
    mimeType: 'application/xml',
  },
  {
    id: 'csv',
    label: 'CSV',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Convert to CSV format (flattened)',
    fileExtension: 'csv',
    mimeType: 'text/csv',
  },
  {
    id: 'toml',
    label: 'TOML',
    icon: <FileText className="h-4 w-4" />,
    description: 'Convert to TOML format',
    fileExtension: 'toml',
    mimeType: 'text/plain',
  },
  {
    id: 'properties',
    label: 'Properties',
    icon: <FileText className="h-4 w-4" />,
    description: 'Convert to Java Properties format',
    fileExtension: 'properties',
    mimeType: 'text/plain',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Generate TypeScript interface',
    fileExtension: 'ts',
    mimeType: 'text/plain',
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    icon: <FileCode className="h-4 w-4" />,
    description: 'Convert to JavaScript object',
    fileExtension: 'js',
    mimeType: 'text/javascript',
  },
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
    description: 'Automatically detect input format',
  },
  ...conversionOptions.map((option) => ({
    id: option.id,
    label: option.label,
    icon: option.icon,
    description: option.description,
  })),
];

export default function ConvertPage() {
  const { currentJson, setCurrentJson } = useBackendStore();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ConversionFormat>('yaml');
  const [inputFormat, setInputFormat] = useState<InputFormat>('autodetect');
  const [searchTerm, setSearchTerm] = useState('');
  // const { toast } = useToast(); // Reserved for future use

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
      if (content.split('\n').some((line) => line.includes(',') && line.split(',').length > 1)) {
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
      if (
        content.includes('interface ') ||
        content.includes('type ') ||
        content.includes('export ')
      ) {
        return content.includes('interface ') ? 'typescript' : 'javascript';
      }

      // Default to JSON
      return 'json';
    }
  };

  const hasValidInput =
    inputFormat === 'autodetect'
      ? detectInputFormat(input) !== 'json' || validateJson(input)
      : inputFormat === 'json'
        ? validateJson(input)
        : !!input.trim();

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
    const lines = content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));
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

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
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
    const lines = content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));

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
    const lines = content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'));

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
        const jsonStr = jsonMatch[0]
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
        return value
          .map((item) => `${spaces}- ${yamlify(item, indent + 1).replace(/^\s+/, '')}`)
          .join('\n');
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
        return value.map((item) => xmlify(item, key)).join('\n');
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
      const flattened = obj.map((item) => {
        const flat = flatten(item);
        Object.keys(flat).forEach((key) => allKeys.add(key));
        return flat;
      });

      const headers = Array.from(allKeys).sort();
      const csvRows = [headers.join(',')];

      flattened.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      });

      return csvRows.join('\n');
    } else {
      const flattened = flatten(obj);
      const headers = Object.keys(flattened);
      const values = headers.map((header) => `"${String(flattened[header]).replace(/"/g, '""')}"`);
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
        const items = value.map((item) => tomlify(item)).join(', ');
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
        const escapedValue = String(value)
          .replace(/\\/g, '\\\\')
          .replace(/=/g, '\\=')
          .replace(/:/g, '\\:');
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

  // DRY: centralized conversion dispatcher used by manual and auto conversion flows
  const convertUsingFormat = (parsed: any, fmt: ConversionFormat): string => {
    switch (fmt) {
      case 'json':
        return convertToJson(parsed);
      case 'yaml':
        return convertToYaml(parsed);
      case 'xml':
        return convertToXml(parsed);
      case 'csv':
        return convertToCsv(parsed);
      case 'toml':
        return convertToToml(parsed);
      case 'properties':
        return convertToProperties(parsed);
      case 'typescript':
        return convertToTypeScript(parsed);
      case 'javascript':
        return convertToJavaScript(parsed);
      default:
        throw new Error('Unsupported format');
    }
  };

  const performConversion = useCallback(
    (format?: ConversionFormat) => {
      const targetFormat = format || selectedFormat;

      if (!input.trim()) {
        toastPatterns.validation.noData('convert');
        return;
      }

      if (!hasValidInput) {
        const detectedFormat =
          inputFormat === 'autodetect' ? detectInputFormat(input) : inputFormat;
        toastPatterns.validation.invalid(detectedFormat.toUpperCase(), 'to convert');
        return;
      }

      try {
        const parsed = parseInput(input, inputFormat);
        if (!parsed) {
          throw new Error('Failed to parse input');
        }
        const converted = convertUsingFormat(parsed, targetFormat);
        setOutput(converted);
        if (format) {
          // Only show toast for manual conversion, not automatic
          const detectedFormat =
            inputFormat === 'autodetect' ? detectInputFormat(input) : inputFormat;
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
    },
    [input, selectedFormat, hasValidInput, inputFormat, detectInputFormat]
  );

  // Auto-convert when format changes and valid input exists
  useEffect(() => {
    if (input.trim() && hasValidInput) {
      try {
        const parsed = parseInput(input, inputFormat);
        if (!parsed) {
          setOutput('');
          return;
        }
        const converted = convertUsingFormat(parsed, selectedFormat);
        setOutput(converted);
      } catch {
        setOutput('');
      }
    } else {
      setOutput('');
    }
  }, [selectedFormat, inputFormat, input, hasValidInput]);


  const getOutputLanguage = () => {
    switch (selectedFormat) {
      case 'json':
        return 'json';
      case 'yaml':
        return 'yaml';
      case 'xml':
        return 'xml';
      case 'typescript':
        return 'typescript';
      case 'javascript':
        return 'javascript';
      case 'csv':
        return 'csv';
      default:
        return 'plaintext';
    }
  };

  const getFormatLabel = (format: ConversionFormat | InputFormat) => {
    if (format === 'autodetect') return 'JSON';
    return conversionOptions.find((opt) => opt.id === format)?.label || format.toUpperCase();
  };

  // Custom magic action for Convert
  const convertMagicAction = useMemo(
    () => [
      {
        id: 'convert',
        label: 'Convert',
        icon: ArrowRightLeft,
        onClick: () => performConversion(),
        disabled: !input || !hasValidInput,
      },
    ],
    [input, hasValidInput]
  );

  // Define input pane actions - Undo, Redo, Clear (Copy/Download/Share/Format/Minify/Convert provided by ViewerActions)
  const inputActions: EditorAction[] = useMemo(
    () => [
      createUndoAction({
        editor: inputEditor.editorRef,
        position: 'right',
      }),
      createRedoAction({
        editor: inputEditor.editorRef,
        position: 'right',
      }),
      createResetAction({
        onReset: () => setInput(''),
        hasData: !!input,
        id: 'reset-input',
        position: 'right',
        showText: false,
        tooltip: 'Clear input',
      }),
    ],
    [input, inputEditor.editorRef]
  );

  // Define output pane actions - only Reset (Copy/Download/Share provided by ViewerActions)
  const outputActions: EditorAction[] = useMemo(
    () => [
      createResetAction({
        onReset: () => setOutput(''),
        hasData: !!output,
        id: 'reset-output',
        position: 'right',
        showText: false,
        tooltip: 'Clear output',
      }),
    ],
    [output]
  );

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          <EditorPane
            title="Input"
            value={input}
            language={inputFormat === 'autodetect' ? detectInputFormat(input) : inputFormat}
            onChange={(value) => {
              const newValue = value || '';
              setInput(newValue);
              setCurrentJson(newValue);
            }}
            actions={inputActions}
            customActions={
              <ViewerActions
                value={input}
                onChange={setInput}
                customMagicActions={convertMagicAction}
              />
            }
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            headerContent={
              <FormatSelector
                value={inputFormat}
                onValueChange={(value) => setInputFormat(value as InputFormat)}
                options={inputFormatOptions}
              />
            }
            validationBadge={
              hasValidInput ? (
                <Button
                  variant="green"
                  size="sm"
                  onClick={() => performConversion()}
                  className="h-6 text-xs"
                >
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  Convert {getFormatLabel(inputFormat)} to {getFormatLabel(selectedFormat)}
                </Button>
              ) : null
            }
            theme={inputEditor.theme}
            onMount={inputEditor.handleEditorDidMount}
            beforeMount={(monaco) => {
              if (monaco && monaco.editor && typeof monaco.editor.defineTheme === 'function') {
                try {
                  defineMonacoThemes(monaco);
                } catch (error) {
                  // Theme definition will be retried in onMount if it fails here
                }
              }
            }}
            options={inputEditor.editorOptions}
            className="border-r"
          />

          <EditorPane
            title="Output"
            value={output}
            language={getOutputLanguage()}
            readOnly
            actions={outputActions}
            customActions={<ViewerActions value={output} onChange={setOutput} />}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            headerContent={
              <FormatSelector
                value={selectedFormat}
                onValueChange={(value) => setSelectedFormat(value as ConversionFormat)}
                options={conversionOptions}
              />
            }
            theme={outputEditor.theme}
            onMount={outputEditor.handleEditorDidMount}
            beforeMount={(monaco) => {
              if (monaco && monaco.editor && typeof monaco.editor.defineTheme === 'function') {
                try {
                  defineMonacoThemes(monaco);
                } catch (error) {
                  // Theme definition will be retried in onMount if it fails here
                }
              }
            }}
            options={outputEditor.editorOptions}
          />
        </div>
        {/* Related Tools - Appears below main content area for SEO */}
        <div className="flex-shrink-0">
          <RelatedTools currentTool="convert" />
        </div>
      </div>
    </MainLayout>
  );
}

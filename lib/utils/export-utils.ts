/**
 * Export utilities for converting JSON to different formats
 */

import { logger } from '@/lib/logger';
import type { JsonValue } from '@/lib/api/types';

export interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'yaml' | 'txt';
  indent?: number;
  includeMetadata?: boolean;
  minify?: boolean;
  encoding?: 'utf8' | 'utf16';
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

/**
 * Convert JSON to CSV format (works best with arrays of objects)
 */
export function jsonToCsv(data: JsonValue): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0] as any);
    const csvRows = [headers.join(',')];

    // Add data rows
    data.forEach(item => {
      const values = headers.map(header => {
        const value = (item as any)[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string' && value.includes(',')) return `"${value.replace(/"/g, '""')}"`;
        return String(value);
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  } else if (typeof data === 'object' && data !== null) {
    // Convert object to key-value CSV
    const entries = Object.entries(data);
    const csvRows = ['Key,Value'];
    
    entries.forEach(([key, value]) => {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const escapedValue = valueStr.includes(',') ? `"${valueStr.replace(/"/g, '""')}"` : valueStr;
      csvRows.push(`${key},${escapedValue}`);
    });
    
    return csvRows.join('\n');
  }
  
  return 'Value\n' + String(data);
}

/**
 * Convert JSON to XML format
 */
export function jsonToXml(data: JsonValue, rootElement = 'root'): string {
  function objectToXml(obj: JsonValue, parentKey?: string): string {
    if (obj === null || obj === undefined) {
      return parentKey ? `<${parentKey}></${parentKey}>` : '<null></null>';
    }
    
    if (typeof obj !== 'object') {
      return parentKey ? `<${parentKey}>${escapeXml(String(obj))}</${parentKey}>` : String(obj);
    }
    
    if (Array.isArray(obj)) {
      const items = obj.map((item, index) => objectToXml(item, `item_${index}`));
      return parentKey ? `<${parentKey}>${items.join('')}</${parentKey}>` : items.join('');
    }
    
    const entries = Object.entries(obj);
    const xmlElements = entries.map(([key, value]) => objectToXml(value, key));
    
    if (parentKey) {
      return `<${parentKey}>${xmlElements.join('')}</${parentKey}>`;
    }
    
    return xmlElements.join('');
  }
  
  function escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  const xmlContent = objectToXml(data, rootElement);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
}

/**
 * Convert JSON to YAML format
 */
export function jsonToYaml(data: JsonValue, indent = 2): string {
  function toYaml(obj: JsonValue, depth = 0): string {
    const indentStr = ' '.repeat(depth * indent);
    
    if (obj === null || obj === undefined) {
      return 'null';
    }
    
    if (typeof obj === 'boolean' || typeof obj === 'number') {
      return String(obj);
    }
    
    if (typeof obj === 'string') {
      // Check if string needs quotes
      if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.includes('[') || obj.includes(']')) {
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => `${indentStr}- ${toYaml(item, depth + 1).replace(/^\s+/, '')}`).join('\n');
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      
      return entries.map(([key, value]) => {
        const yamlValue = toYaml(value, depth + 1);
        if (typeof value === 'object' && value !== null && (Array.isArray(value) || Object.keys(value).length > 0)) {
          return `${indentStr}${key}:\n${yamlValue}`;
        } else {
          return `${indentStr}${key}: ${yamlValue}`;
        }
      }).join('\n');
    }
    
    return String(obj);
  }
  
  return toYaml(data);
}

/**
 * Export JSON data in the specified format
 */
export function exportData(data: JsonValue, options: ExportOptions): ExportResult {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let content: string;
  let filename: string;
  let mimeType: string;
  
  // Add metadata if requested
  const exportData = options.includeMetadata ? {
    ...(data as any),
    __export_metadata: {
      timestamp: new Date().toISOString(),
      source: 'json-viewer',
      format: options.format,
      options: options
    }
  } : data;
  
  switch (options.format) {
    case 'csv':
      content = jsonToCsv(exportData);
      filename = `export-${timestamp}.csv`;
      mimeType = 'text/csv';
      break;
      
    case 'xml':
      content = jsonToXml(exportData);
      filename = `export-${timestamp}.xml`;
      mimeType = 'application/xml';
      break;
      
    case 'yaml':
      content = jsonToYaml(exportData, options.indent || 2);
      filename = `export-${timestamp}.yml`;
      mimeType = 'application/x-yaml';
      break;
      
    case 'txt':
      content = typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, options.indent || 2);
      filename = `export-${timestamp}.txt`;
      mimeType = 'text/plain';
      break;
      
    case 'json':
    default:
      if (options.minify) {
        content = JSON.stringify(exportData);
      } else {
        content = JSON.stringify(exportData, null, options.indent || 2);
      }
      filename = `export-${timestamp}.json`;
      mimeType = 'application/json';
      break;
  }
  
  return { content, filename, mimeType };
}

/**
 * Download exported content as a file
 */
export function downloadExportedData(result: ExportResult): void {
  try {
    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error({ err: error, filename: result.filename, mimeType: result.mimeType }, 'Failed to download exported data');
    throw error;
  }
}
'use client';

import React, { useState } from 'react';
import { BaseModal } from '@/components/shared/base-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileCode,
  FileText,
  Settings,
  Info
} from 'lucide-react';
import { exportData, downloadExportedData, ExportOptions } from '@/lib/utils/export-utils';
import { toastPatterns, showSuccessToast, showErrorToast } from '@/lib/utils/toast-helpers';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/shared/error-boundary';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jsonData: any;
  filteredData?: any; // For filtered exports
}

const EXPORT_FORMATS = [
  {
    value: 'json',
    label: 'JSON',
    icon: FileJson,
    description: 'JavaScript Object Notation - Standard JSON format',
    suitable: 'All data types'
  },
  {
    value: 'csv',
    label: 'CSV',
    icon: FileSpreadsheet,
    description: 'Comma-Separated Values - Best for tabular data',
    suitable: 'Arrays of objects, key-value pairs'
  },
  {
    value: 'xml',
    label: 'XML',
    icon: FileCode,
    description: 'eXtensible Markup Language - Structured document format',
    suitable: 'Hierarchical data'
  },
  {
    value: 'yaml',
    label: 'YAML',
    icon: FileText,
    description: 'YAML Ain\'t Markup Language - Human-readable data serialization',
    suitable: 'Configuration files, structured data'
  }
] as const;

export function ExportModal({ open, onOpenChange, jsonData, filteredData }: ExportModalProps) {
  const [format, setFormat] = useState<ExportOptions['format']>('json');
  const [indent, setIndent] = useState(2);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [minify, setMinify] = useState(false);
  const [useFilteredData, setUseFilteredData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const dataToExport = useFilteredData && filteredData ? filteredData : jsonData;
  const selectedFormat = EXPORT_FORMATS.find(f => f.value === format)!;

  const handleExport = async () => {
    if (!dataToExport) {
      toastPatterns.validation.noData('export');
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format,
        indent: minify ? 0 : indent,
        includeMetadata,
        minify,
      };

      const result = exportData(dataToExport, options);
      downloadExportedData(result);

      showSuccessToast('Export successful', { description: `Data exported as ${result.filename}` });

      onOpenChange(false);
    } catch (error) {
      logger.error({ err: error, format, minify, includeMetadata }, 'Export operation failed');
      toastPatterns.error.export(error);
    } finally {
      setIsExporting(false);
    }
  };

  const getDataPreview = () => {
    if (!dataToExport) return 'No data available';
    
    if (Array.isArray(dataToExport)) {
      return `Array with ${dataToExport.length} items`;
    } else if (typeof dataToExport === 'object') {
      const keys = Object.keys(dataToExport);
      return `Object with ${keys.length} keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`;
    } else {
      return `${typeof dataToExport}: ${String(dataToExport).slice(0, 50)}${String(dataToExport).length > 50 ? '...' : ''}`;
    }
  };

  const getFormatSuitability = () => {
    if (!dataToExport) return 'neutral';
    
    if (format === 'csv') {
      if (Array.isArray(dataToExport) && dataToExport.every(item => typeof item === 'object')) {
        return 'good';
      } else if (typeof dataToExport === 'object' && !Array.isArray(dataToExport)) {
        return 'okay';
      } else {
        return 'poor';
      }
    } else if (format === 'xml' || format === 'yaml') {
      if (typeof dataToExport === 'object') {
        return 'good';
      } else {
        return 'okay';
      }
    }
    
    return 'good'; // JSON is always suitable
  };

  const suitability = getFormatSuitability();

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title="Export JSON Data"
      icon={<Download className="h-5 w-5" />}
      className="sm:max-w-[600px]"
      primaryAction={{
        label: isExporting ? 'Exporting...' : 'Export & Download',
        onClick: handleExport,
        loading: isExporting,
        disabled: isExporting || !dataToExport,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: () => onOpenChange(false),
      }}
    >
      <ErrorBoundary
        level="component"
        fallback={
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Failed to load export options</p>
          </div>
        }
        enableRetry
        maxRetries={2}
      >
        <div className="space-y-6">
          {/* Data Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Data to Export</Label>
              {filteredData && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-filtered"
                    checked={useFilteredData}
                    onCheckedChange={(checked) => setUseFilteredData(checked === true)}
                    data-testid="use-filtered-data"
                  />
                  <Label htmlFor="use-filtered" className="text-sm">
                    Export filtered data only
                  </Label>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">{getDataPreview()}</p>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((formatOption) => {
                const IconComponent = formatOption.icon;
                const isSelected = format === formatOption.value;
                
                return (
                  <div
                    key={formatOption.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setFormat(formatOption.value)}
                    data-testid={`format-${formatOption.value}`}
                  >
                    <div className="flex items-start gap-2">
                      <IconComponent className="h-4 w-4 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{formatOption.label}</span>
                          {isSelected && <Badge variant="default" className="text-xs">Selected</Badge>}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{formatOption.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Format Suitability Alert */}
            {suitability !== 'good' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {suitability === 'poor' ? (
                    <>This format may not work well with your data type. Consider JSON format instead.</>
                  ) : (
                    <>This format will work but may not preserve all data structure. {selectedFormat.suitable}.</>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <Label className="text-sm font-medium">Export Options</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Indentation */}
              {format !== 'csv' && (
                <div className="space-y-2">
                  <Label htmlFor="indent" className="text-sm">Indentation</Label>
                  <Select value={String(indent)} onValueChange={(value) => setIndent(Number(value))}>
                    <SelectTrigger data-testid="indentation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None (Compact)</SelectItem>
                      <SelectItem value="2">2 spaces</SelectItem>
                      <SelectItem value="4">4 spaces</SelectItem>
                      <SelectItem value="8">8 spaces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Minify Option for JSON */}
              {format === 'json' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="minify"
                    checked={minify}
                    onCheckedChange={(checked) => setMinify(checked === true)}
                    data-testid="minify"
                  />
                  <Label htmlFor="minify" className="text-sm">Minify output</Label>
                </div>
              )}
            </div>

            {/* Metadata Option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
                data-testid="include-metadata"
              />
              <Label htmlFor="metadata" className="text-sm">
                Include export metadata (timestamp, source, etc.)
              </Label>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </BaseModal>
  );
}
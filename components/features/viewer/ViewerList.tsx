/**
 * ViewerList - Flat list view with search capabilities
 * Displays JSON data as a searchable flat list of key-value pairs
 */

'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface ViewerListProps {
  data: any;
  height?: number;
}

interface FlatItem {
  path: string;
  key: string;
  value: any;
  type: string;
}

function flattenObject(obj: any, prefix = ''): FlatItem[] {
  const items: FlatItem[] = [];

  function traverse(current: any, path: string) {
    if (current === null) {
      items.push({
        path,
        key: path.split('.').pop() || '',
        value: null,
        type: 'null',
      });
      return;
    }

    if (typeof current !== 'object') {
      items.push({
        path,
        key: path.split('.').pop() || '',
        value: current,
        type: typeof current,
      });
      return;
    }

    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        const newPath = path ? `${path}[${index}]` : `[${index}]`;
        traverse(item, newPath);
      });
    } else {
      Object.entries(current).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        traverse(value, newPath);
      });
    }
  }

  traverse(obj, prefix);
  return items;
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'string':
      return 'text-green-600';
    case 'number':
      return 'text-blue-600';
    case 'boolean':
      return 'text-purple-600';
    case 'null':
      return 'text-gray-400';
    default:
      return 'text-gray-600';
  }
}

function formatValue(value: any, type: string): string {
  if (type === 'string') return `"${value}"`;
  if (type === 'null') return 'null';
  if (type === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export const ViewerList = ({ data, height = 600 }: ViewerListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const flatItems = useMemo(() => {
    if (!data) return [];
    return flattenObject(data);
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return flatItems;
    const term = searchTerm.toLowerCase();
    return flatItems.filter(
      (item) =>
        item.path.toLowerCase().includes(term) ||
        String(item.value).toLowerCase().includes(term)
    );
  }, [flatItems, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search keys or values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredItems.length} of {flatItems.length} items
        </div>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-auto"
        style={{ height: `${height - 100}px` }}
      >
        <div className="divide-y">
          {filteredItems.map((item, index) => (
            <div
              key={`${item.path}-${index}`}
              className="p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-gray-600 truncate">
                    {item.path}
                  </div>
                  <div className={`font-mono text-sm mt-1 ${getTypeColor(item.type)}`}>
                    {formatValue(item.value, item.type)}
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {item.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No matching items found' : 'No data to display'}
          </div>
        )}
      </div>
    </div>
  );
};


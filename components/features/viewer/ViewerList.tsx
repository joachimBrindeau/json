/**
 * ViewerList - Flat list view with search capabilities
 * Displays JSON data as a searchable flat list of key-value pairs
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { VARIANTS, HIGHLIGHT_ANIMATIONS, TRANSITIONS } from '@/components/animations';
import { FixedSizeList as VList } from 'react-window';

interface ViewerListProps {
  data: any;
  height?: number;
  virtualizeThreshold?: number;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
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

export const ViewerList = ({
  data,
  height = 600,
  virtualizeThreshold,
  searchTerm = '',
  onSearchChange,
}: ViewerListProps) => {
  const flatItems = useMemo(() => {
    if (!data) return [];
    return flattenObject(data);
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return flatItems;
    const term = searchTerm.toLowerCase();
    return flatItems.filter(
      (item) =>
        item.path.toLowerCase().includes(term) || String(item.value).toLowerCase().includes(term)
    );
  }, [flatItems, searchTerm]);

  const shouldVirtualize =
    typeof virtualizeThreshold === 'number' &&
    filteredItems.length > (virtualizeThreshold ?? Number.MAX_SAFE_INTEGER);

  const isItemHighlighted = (item: FlatItem) => {
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    return (
      item.path.toLowerCase().includes(term) || String(item.value).toLowerCase().includes(term)
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* List */}
      <div className="flex-1 overflow-auto">
        {shouldVirtualize ? (
          <VList
            height={height}
            width={'100%'}
            itemCount={filteredItems.length}
            itemSize={56}
            itemKey={(index) => `${filteredItems[index].path}-${index}`}
          >
            {({ index, style }) => {
              const item = filteredItems[index];
              return (
                <div style={style} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-gray-600 truncate">{item.path}</div>
                      <div className={`font-mono text-sm mt-1 ${getTypeColor(item.type)}`}>
                        {formatValue(item.value, item.type)}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {item.type}
                    </Badge>
                  </div>
                </div>
              );
            }}
          </VList>
        ) : (
          <motion.div
            className="divide-y"
            variants={VARIANTS.staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={`${item.path}-${index}`}
                className="p-3 hover:bg-gray-50 transition-colors"
                variants={VARIANTS.slideUp}
                animate={isItemHighlighted(item) ? HIGHLIGHT_ANIMATIONS.flash : {}}
                transition={TRANSITIONS.smooth}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-gray-600 truncate">{item.path}</div>
                    <div className={`font-mono text-sm mt-1 ${getTypeColor(item.type)}`}>
                      {formatValue(item.value, item.type)}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {item.type}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No matching items found' : 'No data to display'}
          </div>
        )}
      </div>
    </div>
  );
};

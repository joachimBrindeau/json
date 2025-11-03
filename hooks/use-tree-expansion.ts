import { useCallback, useState } from 'react';
import { encodePointerSegment } from '@/lib/utils/json-pointer';

export interface UseTreeExpansionOptions {
  initialExpanded?: Set<string>;
}

export interface TreeExpansionApi {
  expanded: Set<string>;
  toggle: (id: string) => void;
  expandAll: (data: unknown) => void;
  collapseAll: () => void;
}

// Pure helper (exported for unit tests)
export function collectAllPointerIds(data: unknown): Set<string> {
  const all = new Set<string>();
  const visit = (value: any, pointer = 'root') => {
    all.add(pointer);
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) visit(value[i], `${pointer}/${i}`);
    } else if (value && typeof value === 'object') {
      for (const k of Object.keys(value)) visit((value as any)[k], `${pointer}/${encodePointerSegment(k)}`);
    }
  };
  visit(data);
  return all;
}

export function useTreeExpansion(options: UseTreeExpansionOptions = {}): TreeExpansionApi {
  const { initialExpanded = new Set<string>(['root']) } = options;
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback((data: unknown) => {
    setExpanded(collectAllPointerIds(data));
  }, []);

  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  return { expanded, toggle, expandAll, collapseAll };
}

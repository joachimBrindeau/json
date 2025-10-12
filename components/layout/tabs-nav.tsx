'use client';

import { memo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabsNavProps {
  value?: string;
  onValueChange?: (value: string) => void;
  showEditor?: boolean;
  highlightFlow?: boolean;
}

function TabsNavComponent({ value, onValueChange, showEditor = true, highlightFlow = false }: TabsNavProps) {
  const tabs = showEditor 
    ? ['editor', 'flow', 'tree', 'list'] 
    : ['flow', 'tree', 'list'];
  
  const gridCols = showEditor ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="border-b bg-background">
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList className={`grid w-full ${gridCols} rounded-none`} data-testid="view-mode">
          {showEditor && (
            <TabsTrigger value="editor" data-testid="editor-view">
              Editor
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="flow" 
            data-testid="flow-view"
            className={highlightFlow ? 'ring-2 ring-blue-400/50 ring-offset-1 bg-blue-50/50 dark:bg-blue-950/30' : ''}
          >
            Flow
          </TabsTrigger>
          <TabsTrigger value="tree" data-testid="tree-view">
            Tree
          </TabsTrigger>
          <TabsTrigger value="list" data-testid="list-view">
            List
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export const TabsNav = memo(TabsNavComponent);

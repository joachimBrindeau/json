'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabsNavProps {
  value?: string;
  onValueChange?: (value: string) => void;
  showEditor?: boolean;
}

export function TabsNav({ value, onValueChange, showEditor = true }: TabsNavProps) {
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
          <TabsTrigger value="flow" data-testid="flow-view">
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

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Package, Database } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ObjectRenderer } from './ObjectRenderer';
import { ArrayRenderer } from './ArrayRenderer';

interface NestedObjectButtonProps {
  value: Record<string, unknown> | unknown[];
  label: string;
  type: 'object' | 'array';
}

export const NestedObjectButton = ({ value, label, type }: NestedObjectButtonProps) => {
  const [open, setOpen] = useState(false);
  
  const isArray = Array.isArray(value);
  const Icon = isArray ? Database : Package;
  const count = isArray ? value.length : Object.keys(value as Record<string, unknown>).length;
  const countLabel = isArray ? 'items' : 'properties';

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-between hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono">{type}</span>
          <span className="text-xs text-muted-foreground">
            ({count} {countLabel})
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
          <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <code className="text-sm font-mono font-semibold">{label}</code>
              </div>
            </div>

            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full pr-4">
                {isArray ? (
                  <ArrayRenderer value={value as unknown[]} />
                ) : (
                  <ObjectRenderer value={value as Record<string, unknown>} />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-full">
                <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};


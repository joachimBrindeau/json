'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckSquare,
  Square,
  Trash2,
  Download,
  Archive,
  MoreVertical,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export interface BulkableItem {
  id: string;
  title: string;
  [key: string]: any;
}

interface BulkOperationsProps {
  items: BulkableItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkExport?: (ids: string[]) => Promise<void>;
  onBulkArchive?: (ids: string[]) => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function BulkOperations({
  items,
  selectedIds,
  onSelectionChange,
  onBulkDelete,
  onBulkExport,
  onBulkArchive,
  className,
  disabled = false
}: BulkOperationsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const selectedCount = selectedIds.length;
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;

    setIsLoading(action);
    try {
      switch (action) {
        case 'delete':
          if (onBulkDelete) await onBulkDelete(selectedIds);
          break;
        case 'export':
          if (onBulkExport) await onBulkExport(selectedIds);
          break;
        case 'archive':
          if (onBulkArchive) await onBulkArchive(selectedIds);
          break;
      }
      onSelectionChange([]); // Clear selection after action
    } catch (error) {
      logger.error({ err: error, action, selectedCount: selectedIds.length }, `Bulk ${action} operation failed`);
    } finally {
      setIsLoading(null);
    }
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    handleBulkAction('delete');
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className={cn('flex items-center justify-between p-2 border-b', className)}>
        {/* Selection controls */}
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onCheckedChange={toggleAll}
            disabled={disabled}
            className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
          />
          
          <span className="text-sm text-muted-foreground">
            {selectedCount > 0 ? (
              <>
                <Badge variant="secondary" className="mr-2">
                  {selectedCount} selected
                </Badge>
                of {items.length} items
              </>
            ) : (
              `${items.length} items`
            )}
          </span>

          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="h-6 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Bulk actions */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            {onBulkExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
                disabled={isLoading !== null}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export ({selectedCount})
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading !== null}
                  className="flex items-center gap-2"
                >
                  <MoreVertical className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onBulkArchive && (
                  <DropdownMenuItem
                    onClick={() => handleBulkAction('archive')}
                    disabled={isLoading !== null}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive {selectedCount} items
                  </DropdownMenuItem>
                )}
                
                {onBulkDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isLoading !== null}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete {selectedCount} items
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected items will be permanently deleted.
              {selectedCount <= 3 && (
                <div className="mt-2 text-sm">
                  <strong>Items to delete:</strong>
                  <ul className="mt-1 list-disc list-inside">
                    {selectedIds.map(id => {
                      const item = items.find(item => item.id === id);
                      return item ? (
                        <li key={id} className="truncate">{item.title}</li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedCount} items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Individual item checkbox component for use in list items
export function BulkCheckbox({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  className
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
        checked && "opacity-100",
        className
      )}
    />
  );
}
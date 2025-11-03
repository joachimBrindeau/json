'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

interface QuickActionsProps {
  onNewDraft: () => void;
  onUploadClick: () => void;
}

function QuickActionsComponent({ onNewDraft, onUploadClick }: QuickActionsProps) {
  return (
    <div className="space-y-2 py-2">
      <div className="pb-2">
        <h2 className="mb-2 px-2 text-sm font-semibold tracking-tight text-muted-foreground">
          Quick Actions
        </h2>
      </div>

      <div className="w-full">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
          onClick={onNewDraft}
        >
          <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
          New draft
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm group"
        onClick={onUploadClick}
      >
        <Upload className="h-4 w-4 transition-transform group-hover:scale-110" />
        New upload
      </Button>
    </div>
  );
}

export const QuickActions = memo(QuickActionsComponent);

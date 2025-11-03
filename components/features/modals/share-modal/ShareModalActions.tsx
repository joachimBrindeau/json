'use client';

import { Globe, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareModalActionsProps {
  shareId: string;
  isPublic: boolean;
  isUpdating: boolean;
  isSaving: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ShareModalActions({
  shareId,
  isPublic,
  isUpdating,
  isSaving,
  isLoading,
  onCancel,
  onSave,
}: ShareModalActionsProps) {
  const getButtonContent = () => {
    if (isUpdating || isSaving) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {isSaving ? 'Saving...' : 'Updating...'}
        </>
      );
    }

    if (!shareId) {
      return (
        <>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Save & Generate Link
        </>
      );
    }

    if (isPublic) {
      return (
        <>
          <Globe className="h-4 w-4 mr-2" />
          Publish & Share
        </>
      );
    }

    return (
      <>
        <Lock className="h-4 w-4 mr-2" />
        Make Private & Share
      </>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isUpdating}
        className="order-2 sm:order-1"
        data-testid="share-cancel-button"
      >
        Cancel
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={isUpdating || isSaving || isLoading}
        className="order-1 sm:order-2"
        data-testid="share-save-button"
      >
        {getButtonContent()}
      </Button>
    </div>
  );
}


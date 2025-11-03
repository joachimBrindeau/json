'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';

interface ShareModalStatusProps {
  didSave: boolean;
  hasShareId: boolean;
  isSaving: boolean;
  isLoadingMetadata: boolean;
  isPublished: boolean;
  shareId: string;
}

export function ShareModalStatus({
  didSave,
  hasShareId,
  isSaving,
  isLoadingMetadata,
  isPublished,
  shareId,
}: ShareModalStatusProps) {
  if (isLoadingMetadata) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading existing metadata...</span>
      </div>
    );
  }

  if (isPublished && shareId) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
        <CheckCircle2 className="h-4 w-4" />
        <span>This document is already published - you can update its metadata below</span>
      </div>
    );
  }

  if (didSave || (hasShareId && !isSaving)) {
    return (
      <div className="flex items-center gap-2 p-2 mb-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle2 className="h-4 w-4" />
        <span>Your JSON is saved and ready to share!</span>
      </div>
    );
  }

  return null;
}


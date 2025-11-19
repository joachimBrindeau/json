'use client';

import { Copy, Check, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';

interface ShareLinkInputProps {
  shareUrl: string;
  isSaving: boolean;
  didSave: boolean;
  hasShareId: boolean;
}

export function ShareLinkInput({ shareUrl, isSaving, didSave, hasShareId }: ShareLinkInputProps) {
  const { copy, copied } = useClipboard({
    successMessage: 'Copied!',
    successDescription: 'Share link copied to clipboard',
  });

  // For new documents, don't show link input - show explanation instead
  if (!hasShareId) {
    return (
      <div className="space-y-2">
        <Label htmlFor="link">Share link</Label>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-1">
            Link will be generated after saving
          </p>
          <p className="text-xs text-blue-700">
            Save your document first to generate a shareable link. You can then share it privately or publish it to the public library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="link">Share link</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="link"
          value={shareUrl}
          readOnly
          className="font-mono text-sm"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => copy(shareUrl)}
          disabled={isSaving}
          title="Copy share link"
          className="min-h-[44px] min-w-[44px]"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      {didSave && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Link is ready to share!</span>
        </div>
      )}
    </div>
  );
}


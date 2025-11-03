'use client';

import { Copy, Check, Loader2, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="space-y-2">
      <Label htmlFor="link">Share link</Label>
      <div className="flex items-center space-x-2">
        <Input
          id="link"
          value={isSaving ? 'Creating your share link...' : shareUrl}
          readOnly
          className="font-mono text-sm"
          disabled={isSaving}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => copy(shareUrl)}
          disabled={isSaving || !hasShareId}
          title="Copy share link"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving your JSON and generating share link...</span>
        </div>
      )}
      {(didSave || hasShareId) && !isSaving && (
        <div className="flex items-center gap-2 text-sm text-green-600" data-testid="share-success">
          <CheckCircle2 className="h-4 w-4" />
          <span>Your JSON is saved and ready to share!</span>
        </div>
      )}
    </div>
  );
}


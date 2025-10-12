'use client';

import { useCallback, useMemo, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import {
  TwitterShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  EmailShareButton,
  TelegramShareButton,
  TwitterIcon,
  FacebookIcon,
  LinkedinIcon,
  WhatsappIcon,
  EmailIcon,
  TelegramIcon,
} from 'react-share';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareId: string;
}

function ShareModalComponent({ open, onOpenChange, shareId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    return typeof window !== 'undefined' ? `${window.location.origin}/library/${shareId}` : '';
  }, [shareId]);

  const shareTitle = 'Check out this JSON visualization';
  const shareDescription =
    'Interactive JSON Sea visualization - explore JSON data in a beautiful graph format';

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [shareUrl]);

  if (!shareId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your JSON</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your JSON visualization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share URL */}
          <div className="space-y-2">
            <Label htmlFor="link">Share link</Label>
            <div className="flex items-center space-x-2">
              <Input id="link" value={shareUrl} readOnly className="font-mono text-sm" />
              <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <Label>Share on social media</Label>
            <div className="flex flex-wrap gap-2">
              <TwitterShareButton
                url={shareUrl}
                title={shareTitle}
                className="hover:opacity-80 transition-opacity"
              >
                <TwitterIcon size={40} round />
              </TwitterShareButton>

              <FacebookShareButton url={shareUrl} className="hover:opacity-80 transition-opacity">
                <FacebookIcon size={40} round />
              </FacebookShareButton>

              <LinkedinShareButton
                url={shareUrl}
                title={shareTitle}
                summary={shareDescription}
                className="hover:opacity-80 transition-opacity"
              >
                <LinkedinIcon size={40} round />
              </LinkedinShareButton>

              <WhatsappShareButton
                url={shareUrl}
                title={shareTitle}
                className="hover:opacity-80 transition-opacity"
              >
                <WhatsappIcon size={40} round />
              </WhatsappShareButton>

              <TelegramShareButton
                url={shareUrl}
                title={shareTitle}
                className="hover:opacity-80 transition-opacity"
              >
                <TelegramIcon size={40} round />
              </TelegramShareButton>

              <EmailShareButton
                url={shareUrl}
                subject={shareTitle}
                body={`${shareDescription}\n\nView it here: ${shareUrl}`}
                className="hover:opacity-80 transition-opacity"
              >
                <EmailIcon size={40} round />
              </EmailShareButton>
            </div>
          </div>

          {/* QR Code (optional) */}
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Share ID: <code className="font-mono bg-muted px-1 rounded">{shareId}</code>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export memoized component
export const ShareModal = memo(ShareModalComponent);

'use client';

import { Label } from '@/components/ui/label';
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

interface SocialShareButtonsProps {
  url: string;
  title?: string;
  description?: string;
  showLabel?: boolean;
}

/**
 * Reusable social share buttons component
 * Provides consistent social sharing UI across the application
 */
export function SocialShareButtons({
  url,
  title = 'Check out this JSON visualization',
  description = 'Interactive JSON visualization - explore JSON data in a beautiful format',
  showLabel = true,
}: SocialShareButtonsProps) {
  return (
    <div className="space-y-2">
      {showLabel && <Label>Share on social media</Label>}
      <div className="flex flex-wrap gap-2">
        <TwitterShareButton
          url={url}
          title={title}
          className="hover:opacity-80 transition-opacity"
        >
          <TwitterIcon size={32} round />
        </TwitterShareButton>

        <FacebookShareButton url={url} className="hover:opacity-80 transition-opacity">
          <FacebookIcon size={32} round />
        </FacebookShareButton>

        <LinkedinShareButton
          url={url}
          title={title}
          summary={description}
          className="hover:opacity-80 transition-opacity"
        >
          <LinkedinIcon size={32} round />
        </LinkedinShareButton>

        <WhatsappShareButton
          url={url}
          title={title}
          className="hover:opacity-80 transition-opacity"
        >
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>

        <TelegramShareButton
          url={url}
          title={title}
          className="hover:opacity-80 transition-opacity"
        >
          <TelegramIcon size={32} round />
        </TelegramShareButton>

        <EmailShareButton
          url={url}
          subject={title}
          body={`${description}\n\nView it here: ${url}`}
          className="hover:opacity-80 transition-opacity"
        >
          <EmailIcon size={32} round />
        </EmailShareButton>
      </div>
    </div>
  );
}

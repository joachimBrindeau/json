'use client';

import { useState } from 'react';
import { Globe, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VisibilityInfoProps {
  isPublic: boolean;
}

export function VisibilityInfo({ isPublic }: VisibilityInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border ${isPublic ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
    >
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-between p-3 h-auto hover:bg-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isPublic ? (
            <>
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Public Link</span>
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Private Link</span>
            </>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          <p className={`text-sm ${isPublic ? 'text-blue-700' : 'text-gray-700'}`}>
            {isPublic
              ? 'Your JSON will be listed in the public library where anyone can discover it. You can add a description, category, and tags to help others find it.'
              : 'Your JSON will not appear in the public library. Only people with the direct link can access it. Perfect for sharing sensitive data or work-in-progress documents.'}
          </p>
        </div>
      )}
    </div>
  );
}


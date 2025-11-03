'use client';

import { Globe, Lock } from 'lucide-react';

interface VisibilityInfoProps {
  isPublic: boolean;
}

export function VisibilityInfo({ isPublic }: VisibilityInfoProps) {
  return (
    <div
      className={`p-3 rounded-lg border ${isPublic ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
    >
      <div className="flex items-start gap-2">
        {isPublic ? (
          <>
            <Globe className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Public Link</p>
              <p className="text-blue-700">
                Your JSON will be listed in the public library where anyone can discover it. You
                can add a description, category, and tags to help others find it.
              </p>
            </div>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-900">
              <p className="font-medium mb-1">Private Link</p>
              <p className="text-gray-700">
                Your JSON will not appear in the public library. Only people with the direct link
                can access it. Perfect for sharing sensitive data or work-in-progress documents.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


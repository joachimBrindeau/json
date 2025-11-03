'use client';

interface LibraryLoadingProps {
  message?: string;
}

/**
 * Shared loading component for library pages
 * Can be used for both public and private library loading states
 */
export function LibraryLoading({ message = 'Loading…' }: LibraryLoadingProps) {
  return (
    <div className="h-full w-full flex items-center justify-center p-6" aria-busy>
      <div className="flex items-center gap-3 text-muted-foreground">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden>
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}


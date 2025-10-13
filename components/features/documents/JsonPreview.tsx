import { useState } from 'react';

interface JsonPreviewProps {
  content: unknown;
}

/**
 * JSON Preview component with expand/collapse functionality
 */
export function JsonPreview({ content }: JsonPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewText = typeof content === 'string'
    ? content
    : content ? JSON.stringify(content, null, 2) : '';

  const lines = previewText.split('\n');
  const preview = isExpanded ? lines : lines.slice(0, 5);

  return (
    <div className="relative group">
      <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-4 overflow-hidden border border-border/50">
        <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
          <code>{preview.join('\n')}</code>
        </pre>
        {lines.length > 5 && (
          <>
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/50 dark:from-muted/20 to-transparent pointer-events-none" />
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute bottom-2 right-2 text-xs px-2 py-1 bg-background/80 backdrop-blur rounded border border-border hover:bg-background transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

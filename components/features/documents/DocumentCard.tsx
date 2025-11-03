import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BulkCheckbox } from '@/components/ui/BulkOperations';
import { Eye, User, Calendar, Hash, ChevronRight, Trash2, Globe, Lock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatCount } from '@/lib/utils/formatters';
import { getCategoryIcon, complexityColors, type BaseDocument } from './DocumentConstants';
import { JsonPreview } from './JsonPreview';

interface DocumentCardProps {
  document: BaseDocument & {
    publishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  onDelete?: (doc: BaseDocument) => void;
  showBulkSelect?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  showAuthor?: boolean;
  showDeleteButton?: boolean;
  dateField?: 'publishedAt' | 'createdAt' | 'updatedAt';
  testId?: string;
}

/**
 * Shared document card component for displaying JSON documents
 * Used in library and private pages
 */
export function DocumentCard({
  document,
  onDelete,
  showBulkSelect = false,
  isSelected = false,
  onSelect,
  showAuthor = false,
  showDeleteButton = false,
  dateField = 'publishedAt',
  testId = 'document-card',
}: DocumentCardProps): React.ReactElement {
  const dateValue = document[dateField] as string | undefined;

  const cardContent = (
    <>
      {showBulkSelect && onSelect && (
        <BulkCheckbox
          id={document.id}
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(document.id, checked as boolean)}
        />
      )}
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <Link
              href={`/library/${document.slug || document.shareId || document.id}`}
              className="flex-1 group/link"
              data-testid="card-title"
            >
              <h3 className="font-semibold text-lg group-hover/link:text-primary transition-colors flex items-center gap-2">
                {document.title}
                <ChevronRight className="h-4 w-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </h3>
            </Link>
            <div className="flex items-center gap-2">
              {showDeleteButton && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(document);
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete JSON"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {document.visibility && (
                <Badge
                  variant={document.visibility === 'public' ? 'default' : 'secondary'}
                  className="ml-2 flex items-center gap-1"
                >
                  {document.visibility === 'public' ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {document.visibility}
                </Badge>
              )}
              {document.category && (
                <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                  {getCategoryIcon(document.category)}
                  {document.category}
                </Badge>
              )}
            </div>
          </div>
          {document.description && (
            <p
              className="text-sm text-muted-foreground line-clamp-2"
              data-testid="card-description"
            >
              {document.description}
            </p>
          )}
          {document.richContent && (
            <div className="mt-2 text-xs text-muted-foreground border-l-2 border-blue-200 pl-3">
              <div
                className="prose prose-xs max-w-none line-clamp-3"
                dangerouslySetInnerHTML={{ __html: document.richContent as string }}
              />
            </div>
          )}
        </div>

        {/* Preview */}
        {(document.preview || document.content) && (
          <div className="mb-4 flex-1">
            <JsonPreview content={(document.preview || document.content || '') as string} />
          </div>
        )}

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4" data-testid="card-tags">
            {document.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs hover:bg-muted cursor-pointer transition-colors"
              >
                <Hash className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-3">
            {showAuthor && document.author && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{document.author.name}</span>
              </div>
            )}
            {dateValue && (
              <div className="flex items-center gap-1" data-testid="json-date">
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeTime(dateValue)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{formatCount(document.viewCount)}</span>
            </div>
            <Badge
              variant="outline"
              className={cn('text-xs', complexityColors[document.complexity.toLowerCase()] || '')}
            >
              {document.complexity}
            </Badge>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Card
      className="h-full flex flex-col hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group relative"
      data-testid={testId}
    >
      {cardContent}
    </Card>
  );
}

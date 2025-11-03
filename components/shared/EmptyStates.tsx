'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileJson,
  Eye,
  AlertTriangle,
  Database,
  TreePine,
  Waves,
  Upload,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  className?: string;
  compact?: boolean;
  withCard?: boolean;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
  compact = false,
  withCard = true,
}: EmptyStateProps) => {
  const content = (
    <div className={`text-center text-muted-foreground ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className={`font-medium mb-2 ${compact ? 'text-base' : 'text-lg'}`}>{title}</h3>
      {typeof description === 'string' ? (
        <p className={compact ? 'text-sm' : ''}>{description}</p>
      ) : (
        description
      )}
      {action && (
        <div className="mt-4">
          <Button
            variant={action.variant || 'outline'}
            onClick={action.onClick}
            size={compact ? 'sm' : 'default'}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );

  if (withCard) {
    return (
      <Card
        className={`h-full flex items-center justify-center ${className}`}
        data-testid="empty-state"
      >
        {content}
      </Card>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
      data-testid="empty-state"
    >
      {content}
    </div>
  );
};

// JSON-specific empty states
export const JsonEmptyState = ({ compact = false }: { compact?: boolean }) => (
  <EmptyState
    icon={<FileJson className={`mx-auto opacity-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />}
    title="No JSON to Display"
    description="Enter JSON in the Editor tab to see it visualized here"
    compact={compact}
  />
);

export const ViewerEmptyState = ({ compact = false }: { compact?: boolean }) => (
  <EmptyState
    icon={<Eye className={`mx-auto opacity-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />}
    title="No Data to View"
    description="Load JSON data to start exploring with the viewer"
    compact={compact}
  />
);

// View-specific empty states
export const TreeEmptyState = ({ compact = false }: { compact?: boolean }) => (
  <EmptyState
    icon={<TreePine className={`mx-auto opacity-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />}
    title="No Tree Structure"
    description="Load valid JSON to see the hierarchical tree view"
    compact={compact}
  />
);

export const SeaEmptyState = ({ compact = false }: { compact?: boolean }) => (
  <EmptyState
    icon={<Waves className={`mx-auto opacity-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />}
    title="No Sea View Available"
    description="Load valid JSON to see the visual flow diagram"
    compact={compact}
  />
);

export const ListEmptyState = ({ compact = false }: { compact?: boolean }) => (
  <EmptyState
    icon={<Database className={`mx-auto opacity-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />}
    title="No List Data"
    description="Load JSON data to see it in list format"
    compact={compact}
  />
);

// Search and filter empty states
export const SearchEmptyState = ({
  searchTerm,
  onClearSearch,
  compact = false,
}: {
  searchTerm: string;
  onClearSearch?: () => void;
  compact?: boolean;
}) => (
  <EmptyState
    icon={<Search className={`mx-auto opacity-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />}
    title="No Search Results"
    description={
      <div>
        <p className={compact ? 'text-sm' : ''}>
          No items found matching <strong>&quot;{searchTerm}&quot;</strong>
        </p>
        <p className={`text-muted-foreground mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          Try adjusting your search terms
        </p>
      </div>
    }
    action={
      onClearSearch
        ? {
            label: 'Clear Search',
            onClick: onClearSearch,
            variant: 'outline',
          }
        : undefined
    }
    compact={compact}
  />
);

export const FilterEmptyState = ({
  onClearFilters,
  compact = false,
}: {
  onClearFilters?: () => void;
  compact?: boolean;
}) => (
  <EmptyState
    icon={<Filter className={`mx-auto opacity-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />}
    title="No Filtered Results"
    description="No items match the current filter criteria"
    action={
      onClearFilters
        ? {
            label: 'Clear Filters',
            onClick: onClearFilters,
            variant: 'outline',
          }
        : undefined
    }
    compact={compact}
  />
);

// Upload/import empty states
export const UploadEmptyState = ({
  onUpload,
  compact = false,
}: {
  onUpload?: () => void;
  compact?: boolean;
}) => (
  <EmptyState
    icon={<Upload className={`mx-auto opacity-50 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`} />}
    title="Upload JSON File"
    description="Drag and drop a JSON file here or click to browse"
    action={
      onUpload
        ? {
            label: 'Choose File',
            onClick: onUpload,
            variant: 'default',
          }
        : undefined
    }
    compact={compact}
  />
);

// Error states
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export const JsonErrorState = ({
  error,
  onRetry,
  compact = false,
  className = '',
}: ErrorStateProps) => (
  <Card className={`h-full flex items-center justify-center ${className}`}>
    <div className={`text-center ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      <AlertTriangle
        className={`mx-auto mb-4 text-destructive ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}
      />
      <h3 className={`font-medium mb-2 text-destructive ${compact ? 'text-base' : 'text-lg'}`}>
        JSON Parse Error
      </h3>
      <p className={`text-muted-foreground mb-4 ${compact ? 'text-sm max-w-xs' : 'max-w-md'}`}>
        {error}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} size={compact ? 'sm' : 'default'}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  </Card>
);

export const LoadingErrorState = ({ error, onRetry, compact = false }: ErrorStateProps) => (
  <EmptyState
    icon={
      <AlertTriangle
        className={`mx-auto text-destructive ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}
      />
    }
    title="Failed to Load"
    description={error}
    action={
      onRetry
        ? {
            label: 'Retry',
            onClick: onRetry,
            variant: 'outline',
          }
        : undefined
    }
    compact={compact}
  />
);

// Loading states
export const LoadingState = ({
  message = 'Loading...',
  compact = false,
}: {
  message?: string;
  compact?: boolean;
}) => (
  <Card className="h-full flex items-center justify-center">
    <div className={`text-center ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      <LoadingSpinner size={compact ? 'md' : 'lg'} label={message} />
    </div>
  </Card>
);

// Performance warning state
export const PerformanceWarningState = ({
  onContinue,
  onOptimize,
  compact = false,
}: {
  onContinue?: () => void;
  onOptimize?: () => void;
  compact?: boolean;
}) => (
  <Card className="h-full flex items-center justify-center">
    <div className={`text-center ${compact ? 'max-w-sm' : 'max-w-md'}`}>
      <AlertTriangle
        className={`mx-auto mb-4 text-yellow-500 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}
      />
      <h3 className={`font-medium mb-2 text-yellow-600 ${compact ? 'text-base' : 'text-lg'}`}>
        Large JSON Detected
      </h3>
      <p className={`text-muted-foreground mb-4 ${compact ? 'text-sm' : ''}`}>
        This JSON file is very large and may cause performance issues
      </p>
      <div className="flex gap-2 justify-center">
        {onOptimize && (
          <Button variant="default" onClick={onOptimize} size={compact ? 'sm' : 'default'}>
            Use Optimized View
          </Button>
        )}
        {onContinue && (
          <Button variant="outline" onClick={onContinue} size={compact ? 'sm' : 'default'}>
            Continue Anyway
          </Button>
        )}
      </div>
    </div>
  </Card>
);

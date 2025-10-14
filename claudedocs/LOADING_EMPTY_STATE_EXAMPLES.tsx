/**
 * LoadingState and EmptyState Usage Examples
 *
 * This file demonstrates various real-world usage patterns for the
 * standardized LoadingState and EmptyState components.
 */

import { LoadingState } from '@/components/shared/loading-state';
import { EmptyState } from '@/components/shared/empty-state';
import { AlertTriangle, Search, Database, FileX, AlertCircle } from 'lucide-react';

// ============================================================================
// LOADING STATE EXAMPLES
// ============================================================================

/**
 * Example 1: Basic Loading State
 * Use this for simple data fetching scenarios
 */
function Example1_BasicLoading({ loading, data }: { loading: boolean; data: any }) {
  if (loading) {
    return <LoadingState />;
  }

  return <div>{/* Render data */}</div>;
}

/**
 * Example 2: Loading with Custom Message
 * Provide context about what is being loaded
 */
function Example2_LoadingWithMessage({ loading }: { loading: boolean }) {
  if (loading) {
    return <LoadingState message="Loading users..." />;
  }

  return <div>{/* User list */}</div>;
}

/**
 * Example 3: Different Size Variants
 * Match the loading state size to your container
 */
function Example3_SizeVariants() {
  return (
    <div className="space-y-8">
      {/* Small - for widgets or small cards */}
      <div className="border p-4">
        <LoadingState message="Loading..." size="sm" />
      </div>

      {/* Medium - default, for most use cases */}
      <div className="border p-8">
        <LoadingState message="Loading..." size="md" />
      </div>

      {/* Large - for full page loads */}
      <div className="border p-12">
        <LoadingState message="Loading..." size="lg" />
      </div>
    </div>
  );
}

/**
 * Example 4: Loading with Custom Container Height
 * Use className to control the container size
 */
function Example4_CustomHeight({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <LoadingState
        message="Processing your request..."
        size="lg"
        className="min-h-[400px]"
      />
    );
  }

  return <div>{/* Content */}</div>;
}

// ============================================================================
// EMPTY STATE EXAMPLES
// ============================================================================

/**
 * Example 5: Basic Error State
 * Simple error message without action
 */
function Example5_BasicError({ error }: { error: Error | null }) {
  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="Something went wrong"
        description={error.message}
      />
    );
  }

  return <div>{/* Content */}</div>;
}

/**
 * Example 6: Error with Retry Action
 * Allow users to retry the failed operation
 */
function Example6_ErrorWithRetry({
  error,
  onRetry
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="Failed to Load Data"
        description="Unable to load the requested information. Please try again."
        action={{
          label: 'Retry',
          onClick: onRetry,
          variant: 'outline'
        }}
      />
    );
  }

  return <div>{/* Content */}</div>;
}

/**
 * Example 7: No Search Results
 * Provide helpful feedback when searches return empty
 */
function Example7_NoSearchResults({
  searchTerm,
  onClearSearch
}: {
  searchTerm: string;
  onClearSearch: () => void;
}) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12" />}
      title="No results found"
      description={`No results matching "${searchTerm}". Try adjusting your search terms.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'outline'
      }}
    />
  );
}

/**
 * Example 8: Empty Data State
 * Show when a list or collection is empty
 */
function Example8_EmptyData({ onAddNew }: { onAddNew: () => void }) {
  return (
    <EmptyState
      icon={<Database className="h-12 w-12" />}
      title="No data yet"
      description="Get started by adding your first item"
      action={{
        label: 'Add Item',
        onClick: onAddNew,
        variant: 'default'
      }}
    />
  );
}

/**
 * Example 9: No Files Found
 * Specific empty state for file operations
 */
function Example9_NoFiles({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={<FileX className="h-12 w-12" />}
      title="No files found"
      description="Upload a file to get started"
      action={{
        label: 'Upload File',
        onClick: onUpload,
        variant: 'default'
      }}
    />
  );
}

/**
 * Example 10: Permission Denied
 * Error state for authorization issues
 */
function Example10_PermissionDenied({ onGoBack }: { onGoBack: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-12 w-12 text-destructive" />}
      title="Access Denied"
      description="You don't have permission to view this content"
      action={{
        label: 'Go Back',
        onClick: onGoBack,
        variant: 'outline'
      }}
    />
  );
}

// ============================================================================
// COMBINED PATTERNS
// ============================================================================

/**
 * Example 11: Complete Loading/Error/Empty/Data Pattern
 * Comprehensive example showing all states
 */
function Example11_CompletePattern({
  loading,
  error,
  data,
  onRetry
}: {
  loading: boolean;
  error: Error | null;
  data: any[] | null;
  onRetry: () => void;
}) {
  // Loading state
  if (loading) {
    return <LoadingState message="Loading data..." size="md" />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="Failed to Load"
        description={error.message}
        action={{
          label: 'Retry',
          onClick: onRetry,
          variant: 'outline'
        }}
      />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Database className="h-12 w-12" />}
        title="No data available"
        description="There's nothing here yet"
      />
    );
  }

  // Success - render data
  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>{/* Render item */}</div>
      ))}
    </div>
  );
}

/**
 * Example 12: Admin Panel Pattern
 * Pattern used in admin components with stats refetch
 */
function Example12_AdminPanelPattern({
  loading,
  stats,
  refetch
}: {
  loading: boolean;
  stats: any | null;
  refetch: () => void;
}) {
  if (loading) {
    return <LoadingState message="Loading system statistics..." size="md" />;
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="Failed to Load Statistics"
        description="Unable to load system statistics. Please try again."
        action={{
          label: 'Retry',
          onClick: refetch,
          variant: 'outline'
        }}
      />
    );
  }

  return (
    <div>
      {/* Render statistics */}
    </div>
  );
}

/**
 * Example 13: Modal Loading Pattern
 * Use smaller size for modals
 */
function Example13_ModalPattern({
  loading,
  error,
  onClose,
  onRetry
}: {
  loading: boolean;
  error: Error | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="p-8">
        <LoadingState message="Loading details..." size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10" />}
          title="Error"
          description={error.message}
          action={{
            label: 'Retry',
            onClick: onRetry,
            variant: 'outline'
          }}
        />
      </div>
    );
  }

  return <div>{/* Modal content */}</div>;
}

// ============================================================================
// BEST PRACTICES
// ============================================================================

/**
 * BEST PRACTICES:
 *
 * 1. Always provide meaningful loading messages
 *    ✅ <LoadingState message="Loading users..." />
 *    ❌ <LoadingState message="Loading..." />
 *
 * 2. Use appropriate icons for empty states
 *    - AlertTriangle: Errors, warnings
 *    - Search: No search results
 *    - Database: Empty data
 *    - FileX: No files
 *    - AlertCircle: Permission issues
 *
 * 3. Provide retry actions for errors
 *    ✅ Always include retry button for failed data loads
 *    ❌ Don't show errors without recovery options
 *
 * 4. Match size to container
 *    - sm: Widgets, small cards, modals
 *    - md: Standard containers (default)
 *    - lg: Full page loads
 *
 * 5. Use consistent error messaging
 *    - Be specific about what failed
 *    - Provide helpful suggestions
 *    - Keep messages concise
 *
 * 6. Consider the user journey
 *    - Loading → Error (with retry) → Empty → Success
 *    - Each state should help users understand what to do next
 */

export {
  Example1_BasicLoading,
  Example2_LoadingWithMessage,
  Example3_SizeVariants,
  Example4_CustomHeight,
  Example5_BasicError,
  Example6_ErrorWithRetry,
  Example7_NoSearchResults,
  Example8_EmptyData,
  Example9_NoFiles,
  Example10_PermissionDenied,
  Example11_CompletePattern,
  Example12_AdminPanelPattern,
  Example13_ModalPattern,
};

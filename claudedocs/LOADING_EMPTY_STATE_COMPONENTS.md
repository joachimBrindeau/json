# Loading and Empty State Components

This document describes the standardized LoadingState and EmptyState components for consistent UI patterns across the application.

## Components

### LoadingState

A reusable loading indicator component with customizable size and message.

**Location**: `components/shared/loading-state.tsx`

**Props**:
```typescript
interface LoadingStateProps {
  message?: string;      // Default: "Loading..."
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
  className?: string;    // Additional CSS classes
}
```

**Size Specifications**:
- `sm`: 4x4 spinner, small text, 4px padding
- `md`: 8x8 spinner, base text, 8px padding
- `lg`: 12x12 spinner, large text, 12px padding

**Usage Examples**:
```tsx
// Basic usage
<LoadingState />

// With custom message
<LoadingState message="Loading users..." />

// With custom size
<LoadingState message="Loading data..." size="lg" />

// With additional classes
<LoadingState message="Processing..." size="sm" className="min-h-[200px]" />
```

---

### EmptyState

A reusable empty state component for displaying "no data" or error states.

**Location**: `components/shared/empty-state.tsx`

**Props**:
```typescript
interface EmptyStateProps {
  title: string;                    // Required heading text
  description?: string;              // Optional description text
  icon?: React.ReactNode;            // Optional icon component
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  className?: string;                // Additional CSS classes
}
```

**Usage Examples**:

**Basic Empty State**:
```tsx
import { Search } from 'lucide-react';

<EmptyState
  icon={<Search className="h-12 w-12" />}
  title="No results found"
  description="Try adjusting your search criteria"
/>
```

**With Action Button**:
```tsx
import { AlertTriangle } from 'lucide-react';

<EmptyState
  icon={<AlertTriangle className="h-12 w-12" />}
  title="Failed to Load Data"
  description="Unable to load the requested information"
  action={{
    label: 'Retry',
    onClick: handleRetry,
    variant: 'outline'
  }}
/>
```

**Error State**:
```tsx
import { AlertTriangle } from 'lucide-react';

<EmptyState
  icon={<AlertTriangle className="h-12 w-12 text-destructive" />}
  title="Failed to Load Statistics"
  description="Unable to load system statistics. Please try again."
  action={{
    label: 'Retry',
    onClick: refetch,
    variant: 'outline'
  }}
/>
```

---

## Migration Examples

### Before (Custom Loading Spinner):
```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
}
```

### After (LoadingState):
```tsx
if (loading) {
  return <LoadingState message="Loading users..." size="md" />
}
```

---

### Before (Custom Empty State):
```tsx
if (!data) {
  return (
    <div className="text-center p-8 text-gray-500">
      Failed to load data
    </div>
  )
}
```

### After (EmptyState):
```tsx
import { AlertTriangle } from 'lucide-react';

if (!data) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-12 w-12" />}
      title="Failed to Load Data"
      description="Unable to load the requested information. Please try again."
      action={{
        label: 'Retry',
        onClick: refetch,
        variant: 'outline'
      }}
    />
  )
}
```

---

## Files Updated

The following files have been updated to use the new standardized components:

1. **components/features/admin/user-list.tsx**
   - Replaced custom loading spinner with LoadingState

2. **components/features/admin/system-stats.tsx**
   - Replaced custom loading spinner with LoadingState
   - Replaced custom error state with EmptyState

3. **components/features/admin/tag-analytics.tsx**
   - Replaced custom loading spinner with LoadingState
   - Replaced custom error state with EmptyState

---

## Benefits

1. **Consistency**: Uniform loading and empty states across the application
2. **Maintainability**: Single source of truth for these patterns
3. **Accessibility**: Built-in ARIA attributes and semantic HTML
4. **Flexibility**: Easy to customize with props and className
5. **Developer Experience**: Simple API, clear documentation

---

## Best Practices

1. **Always provide meaningful messages**: Use descriptive loading messages
   ```tsx
   // Good
   <LoadingState message="Loading users..." />

   // Bad
   <LoadingState message="Loading..." />
   ```

2. **Use appropriate icons**: Choose icons that match the context
   ```tsx
   // Error states
   <EmptyState icon={<AlertTriangle />} ... />

   // Search results
   <EmptyState icon={<Search />} ... />
   ```

3. **Provide retry actions for errors**: Always give users a way to recover
   ```tsx
   <EmptyState
     title="Failed to Load"
     action={{
       label: 'Retry',
       onClick: refetch
     }}
   />
   ```

4. **Use consistent sizing**: Match size to the container
   ```tsx
   // Small widgets
   <LoadingState size="sm" />

   // Full page loads
   <LoadingState size="lg" />
   ```

---

## Related Components

- **components/shared/empty-states.tsx**: Domain-specific empty states (JsonEmptyState, ViewerEmptyState, etc.)
- **components/ui/loading-states.tsx**: Specialized loading states (JsonLoading, ProcessingLoading, etc.)
- **components/ui/skeleton.tsx**: Skeleton loading placeholders for content

These components complement LoadingState and EmptyState for specific use cases.

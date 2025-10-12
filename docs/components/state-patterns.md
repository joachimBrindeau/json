# Empty & Loading State Patterns

**Last Updated:** 2025-10-12

---

## Overview

This guide explains when to use each empty state and loading state component.

---

## Empty States

**Location:** `components/shared/empty-states.tsx`

Empty states are shown when there's no data to display. They provide context and guidance to users.

### Base Component: `EmptyState`

The foundation for all empty states. Use this to create custom empty states.

```typescript
import { EmptyState } from '@/components/shared';

<EmptyState
  icon={<FileJson className="h-16 w-16 opacity-50" />}
  title="No Data"
  description="There's nothing to show here yet"
  action={{
    label: "Get Started",
    onClick: handleAction,
    variant: "default"
  }}
  compact={false}
/>
```

**Props:**
- `icon` - Optional icon to display
- `title` - Main heading
- `description` - Explanation text (string or React node)
- `action` - Optional button with label, onClick, and variant
- `compact` - Smaller size for tight spaces
- `className` - Additional CSS classes

---

### Pre-built Empty States

#### 1. **JsonEmptyState**
**Use when:** No JSON data is available in the viewer

```typescript
import { JsonEmptyState } from '@/components/shared';

<JsonEmptyState compact={false} />
```

**Shows:** "No JSON to Display" with FileJson icon

---

#### 2. **ViewerEmptyState**
**Use when:** Viewer has no data to display

```typescript
import { ViewerEmptyState } from '@/components/shared';

<ViewerEmptyState compact={false} />
```

**Shows:** "No Data to View" with Eye icon

---

#### 3. **TreeEmptyState**
**Use when:** Tree view has no structure to show

```typescript
import { TreeEmptyState } from '@/components/shared';

<TreeEmptyState compact={false} />
```

**Shows:** "No Tree Structure" with TreePine icon

---

#### 4. **SeaEmptyState**
**Use when:** Sea/flow view is not available

```typescript
import { SeaEmptyState } from '@/components/shared';

<SeaEmptyState compact={false} />
```

**Shows:** "No Sea View Available" with Waves icon

---

#### 5. **ListEmptyState**
**Use when:** List view has no items

```typescript
import { ListEmptyState } from '@/components/shared';

<ListEmptyState compact={false} />
```

**Shows:** "No Items in List" with Database icon

---

#### 6. **SearchEmptyState**
**Use when:** Search returns no results

```typescript
import { SearchEmptyState } from '@/components/shared';

<SearchEmptyState compact={false} />
```

**Shows:** "No Results Found" with Search icon

---

#### 7. **FilterEmptyState**
**Use when:** Filters produce no results

```typescript
import { FilterEmptyState } from '@/components/shared';

<FilterEmptyState 
  onClearFilters={() => clearFilters()} 
  compact={false} 
/>
```

**Shows:** "No Matches" with Filter icon and "Clear Filters" button

---

#### 8. **UploadEmptyState**
**Use when:** No file has been uploaded

```typescript
import { UploadEmptyState } from '@/components/shared';

<UploadEmptyState 
  onUpload={() => openFileDialog()} 
  compact={false} 
/>
```

**Shows:** "Upload a File" with Upload icon and "Choose File" button

---

### Error States

#### 9. **JsonErrorState**
**Use when:** JSON parsing or processing fails

```typescript
import { JsonErrorState } from '@/components/shared';

<JsonErrorState 
  error="Invalid JSON syntax at line 42"
  onRetry={() => retry()}
  compact={false}
/>
```

**Shows:** Error message with AlertTriangle icon and "Try Again" button

---

#### 10. **LoadingErrorState**
**Use when:** Data loading fails

```typescript
import { LoadingErrorState } from '@/components/shared';

<LoadingErrorState 
  error="Failed to load data"
  onRetry={() => reload()}
  compact={false}
/>
```

**Shows:** Error message with AlertTriangle icon and "Retry" button

---

### Loading States

#### 11. **LoadingState**
**Use when:** Content is loading

```typescript
import { LoadingState } from '@/components/shared';

<LoadingState 
  message="Loading JSON..."
  compact={false}
/>
```

**Shows:** Loading spinner with custom message

---

#### 12. **PerformanceWarningState**
**Use when:** Large data might cause performance issues

```typescript
import { PerformanceWarningState } from '@/components/shared';

<PerformanceWarningState 
  size={1000000}
  onProceed={() => loadAnyway()}
  onCancel={() => cancel()}
  compact={false}
/>
```

**Shows:** Warning about large data with "Proceed" and "Cancel" buttons

---

## Loading States

**Location:** `components/ui/loading-states.tsx`

Loading states are shown during async operations.

### 1. **LoadingSpinner**
**Use when:** Need a simple spinner

```typescript
import { LoadingSpinner } from '@/components/ui/loading-states';

<LoadingSpinner size="md" className="text-blue-500" />
```

**Sizes:** `sm` (16px), `md` (24px), `lg` (32px)

---

### 2. **JsonLoading**
**Use when:** Loading JSON data

```typescript
import { JsonLoading } from '@/components/ui/loading-states';

<JsonLoading 
  message="Parsing JSON..." 
  progress={75}
/>
```

**Features:**
- Animated FileJson icon
- Optional progress bar (0-100)
- Custom message

---

### 3. **JsonViewerSkeleton**
**Use when:** Loading JSON viewer

```typescript
import { JsonViewerSkeleton } from '@/components/ui/loading-states';

<JsonViewerSkeleton />
```

**Shows:** Skeleton UI mimicking JSON structure

---

### 4. **TreeViewSkeleton**
**Use when:** Loading tree view

```typescript
import { TreeViewSkeleton } from '@/components/ui/loading-states';

<TreeViewSkeleton />
```

**Shows:** Skeleton UI mimicking tree structure

---

### 5. **EditorSkeleton**
**Use when:** Loading code editor

```typescript
import { EditorSkeleton } from '@/components/ui/loading-states';

<EditorSkeleton />
```

**Shows:** Skeleton UI mimicking code editor

---

### 6. **PerformanceLoading**
**Use when:** Processing large data

```typescript
import { PerformanceLoading } from '@/components/ui/loading-states';

<PerformanceLoading 
  message="Processing large JSON..."
  stage="Parsing"
  progress={50}
/>
```

**Features:**
- Stage indicator
- Progress bar
- Performance metrics

---

## Decision Tree

```
Need to show state?
│
├─ Is data loading?
│  ├─ Simple spinner needed?
│  │  └─ Use LoadingSpinner
│  ├─ Loading JSON?
│  │  └─ Use JsonLoading
│  ├─ Loading viewer?
│  │  └─ Use JsonViewerSkeleton
│  └─ Loading tree?
│     └─ Use TreeViewSkeleton
│
├─ Is there an error?
│  ├─ JSON error?
│  │  └─ Use JsonErrorState
│  └─ Loading error?
│     └─ Use LoadingErrorState
│
└─ Is there no data?
   ├─ No JSON?
   │  └─ Use JsonEmptyState
   ├─ No search results?
   │  └─ Use SearchEmptyState
   ├─ No filter results?
   │  └─ Use FilterEmptyState
   ├─ No upload?
   │  └─ Use UploadEmptyState
   └─ Custom case?
      └─ Use EmptyState
```

---

## Best Practices

### 1. **Choose the Right State**
- Use specific states (JsonEmptyState, SearchEmptyState) over generic EmptyState
- Match the state to the context
- Provide actionable guidance

### 2. **Provide Actions**
- Include a button when user can take action
- Use clear, action-oriented labels ("Upload File", "Clear Filters")
- Handle edge cases (disabled states, loading states)

### 3. **Use Compact Mode**
- Use `compact={true}` in tight spaces (sidebars, cards)
- Use `compact={false}` (default) in main content areas
- Maintain consistency within the same view

### 4. **Error Handling**
- Always provide a retry action for errors
- Show specific error messages when possible
- Log errors for debugging

### 5. **Loading States**
- Use skeletons for predictable layouts
- Use spinners for unpredictable durations
- Show progress when available
- Provide cancel option for long operations

---

## Common Patterns

### Pattern 1: Conditional Rendering
```typescript
{loading && <JsonLoading message="Loading..." />}
{error && <JsonErrorState error={error} onRetry={retry} />}
{!loading && !error && !data && <JsonEmptyState />}
{!loading && !error && data && <JsonViewer data={data} />}
```

### Pattern 2: Search Results
```typescript
{isSearching && <LoadingSpinner />}
{!isSearching && results.length === 0 && query && <SearchEmptyState />}
{!isSearching && results.length === 0 && !query && <JsonEmptyState />}
{!isSearching && results.length > 0 && <ResultsList results={results} />}
```

### Pattern 3: Filtered List
```typescript
{filteredItems.length === 0 && hasActiveFilters && (
  <FilterEmptyState onClearFilters={clearFilters} />
)}
{filteredItems.length === 0 && !hasActiveFilters && (
  <ListEmptyState />
)}
{filteredItems.length > 0 && (
  <ItemsList items={filteredItems} />
)}
```

---

## Summary

| Component | Use Case | Has Action | Location |
|-----------|----------|------------|----------|
| **EmptyState** | Custom empty state | Optional | shared/ |
| **JsonEmptyState** | No JSON data | No | shared/ |
| **SearchEmptyState** | No search results | No | shared/ |
| **FilterEmptyState** | No filter results | Yes (Clear) | shared/ |
| **UploadEmptyState** | No file uploaded | Yes (Upload) | shared/ |
| **JsonErrorState** | JSON error | Yes (Retry) | shared/ |
| **LoadingSpinner** | Simple loading | No | ui/ |
| **JsonLoading** | JSON loading | No | ui/ |
| **JsonViewerSkeleton** | Viewer loading | No | ui/ |



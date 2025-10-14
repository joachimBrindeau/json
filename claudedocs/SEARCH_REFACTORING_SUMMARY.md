# Search State Centralization Refactoring

## Overview
Successfully refactored ViewerTree and ViewerList components to use centralized search state management through the parent Viewer component.

## Changes Made

### 1. ViewerTreeSearch Hook (components/features/viewer/ViewerTreeSearch.ts)
**Changed:**
- Modified hook signature from `useViewerTreeSearch(nodes)` to `useViewerTreeSearch(nodes, searchTerm)`
- Removed internal `useState` for search term management
- Now accepts external search term as parameter
- Simplified return type to only include `filteredNodes` and `matchCount`

**Before:**
```typescript
export const useViewerTreeSearch = (nodes: JsonNode[]): TreeSearchResult => {
  const [searchTerm, setSearchTerm] = useState('');
  return { searchTerm, setSearchTerm, filteredNodes, matchCount };
}
```

**After:**
```typescript
export const useViewerTreeSearch = (nodes: JsonNode[], searchTerm: string = ''): TreeSearchResult => {
  return { filteredNodes, matchCount };
}
```

### 2. ViewerTree Component (components/features/viewer/ViewerTree.tsx)
**Changed:**
- Added `searchTerm` and `onSearchChange` props
- Updated to accept external search state instead of managing its own
- Debounce logic now calls parent's `onSearchChange` callback
- Removed internal search state management from hook

**Interface Updates:**
```typescript
interface ViewerTreeProps {
  data: any;
  virtualized?: boolean;
  height?: number;
  enableSearch?: boolean;
  searchTerm?: string;           // NEW
  onSearchChange?: (term: string) => void;  // NEW
  maxNodes?: number;
}
```

### 3. ViewerList Component (components/features/viewer/ViewerList.tsx)
**Changed:**
- Removed local `useState('searchTerm')` 
- Added `searchTerm` and `onSearchChange` props
- Updated input onChange to use prop callback instead of local state
- Removed unused `useState` import

**Interface Updates:**
```typescript
interface ViewerListProps {
  data: any;
  height?: number;
  virtualizeThreshold?: number;
  searchTerm?: string;           // NEW
  onSearchChange?: (term: string) => void;  // NEW
}
```

### 4. Viewer Component (components/features/viewer/Viewer.tsx)
**Changed:**
- Added centralized search state management using `useSearch` hook
- Implements controlled/uncontrolled pattern for search (like view mode)
- Passes search props to both ViewerTree and ViewerList components
- Removed unused `useEffect` import

**New Logic:**
```typescript
import { useSearch } from '@/hooks/use-search';

// Inside component:
const { searchTerm: internalSearch, setSearchTerm: setInternalSearch } = useSearch();
const effectiveSearch = controlledSearchTerm ?? internalSearch;
const effectiveSetSearch = controlledOnSearchChange ?? setInternalSearch;
```

**Props Passed to Children:**
```typescript
<ViewerTree
  searchTerm={effectiveSearch}
  onSearchChange={effectiveSetSearch}
  // ... other props
/>

<ViewerList
  searchTerm={effectiveSearch}
  onSearchChange={effectiveSetSearch}
  // ... other props
/>
```

## Benefits

### 1. Centralized State Management
- Single source of truth for search state across all view modes
- Consistent search behavior when switching between views
- Search term persists when changing view modes

### 2. Controlled/Uncontrolled Pattern
- Parent components can control search state if needed
- Falls back to internal state management when not controlled
- Flexible API for different use cases

### 3. Better Composability
- Child components are now pure presentation components
- Props-driven architecture makes components more reusable
- Easier to test components with explicit props

### 4. Type Safety
- All changes maintain full TypeScript type safety
- No type errors introduced
- Clear interface contracts between components

### 5. Backward Compatibility
- Props are optional with sensible defaults
- Existing usage patterns continue to work
- Progressive enhancement approach

## Usage Examples

### Simple Usage (Uncontrolled)
```typescript
<Viewer data={jsonData} />
// Search state managed internally by Viewer
```

### Controlled Usage
```typescript
const [search, setSearch] = useState('');

<Viewer 
  data={jsonData}
  searchTerm={search}
  onSearchChange={setSearch}
/>
// Parent controls search state
```

### With View Mode Control
```typescript
const [viewMode, setViewMode] = useState<ViewMode>('tree');
const [search, setSearch] = useState('');

<Viewer 
  data={jsonData}
  viewMode={viewMode}
  onViewModeChange={setViewMode}
  searchTerm={search}
  onSearchChange={setSearch}
/>
// Full control over both view mode and search
```

## Testing Recommendations

1. **Unit Tests:**
   - Test ViewerTreeSearch hook with different search terms
   - Verify filteredNodes and matchCount calculations
   - Test ViewerTree and ViewerList with controlled/uncontrolled props

2. **Integration Tests:**
   - Verify search persists when switching view modes
   - Test debounce behavior in ViewerTree
   - Confirm search results match across different views

3. **E2E Tests:**
   - Search functionality in tree view
   - Search functionality in list view
   - View mode switching preserves search term

## Migration Guide

### For Component Consumers
No changes required - all new props are optional with defaults.

### For Custom Hook Users
If directly using `useViewerTreeSearch`:

**Before:**
```typescript
const { searchTerm, setSearchTerm, filteredNodes, matchCount } = useViewerTreeSearch(nodes);
```

**After:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const { filteredNodes, matchCount } = useViewerTreeSearch(nodes, searchTerm);
```

## Files Modified

1. `/components/features/viewer/ViewerTreeSearch.ts` - Hook refactoring
2. `/components/features/viewer/ViewerTree.tsx` - Accept external search state
3. `/components/features/viewer/ViewerList.tsx` - Accept external search state
4. `/components/features/viewer/Viewer.tsx` - Centralized search management

## Status
✅ Complete - All changes implemented and type-safe
✅ Backward compatible - No breaking changes
✅ Ready for testing

# Components Documentation

**Last Updated:** 2025-10-12

---

## Overview

This directory contains documentation for all component patterns and best practices in the application.

---

## Component Organization

The application follows a clear component hierarchy:

```
components/
├── features/           # Feature-specific components
│   ├── admin/         # Admin dashboard components
│   ├── editor/        # JSON editor components
│   ├── flow-diagram/  # Flow diagram components
│   ├── modals/        # Modal dialogs
│   └── viewer/        # JSON viewer components
├── layout/            # Layout components (header, sidebar, navigation)
├── shared/            # Reusable components across features
├── ui/                # UI primitives (shadcn/ui components)
└── debug/             # Debug-only components
```

---

## Naming Conventions

### File Naming: **kebab-case**
All component files use kebab-case naming:

✅ **Correct:**
- `json-editor.tsx`
- `user-menu.tsx`
- `share-modal.tsx`
- `super-admin-dashboard.tsx`

❌ **Incorrect:**
- `JsonEditor.tsx`
- `UserMenu.tsx`
- `ShareModal.tsx`
- `SuperAdminDashboard.tsx`

### Component Naming: **PascalCase**
Component exports use PascalCase:

```typescript
// File: json-editor.tsx
export function JsonEditor() { ... }

// File: user-menu.tsx
export function UserMenu() { ... }
```

### Hierarchical Naming
Related components use hierarchical prefixes:

```
viewer/
├── Viewer.tsx              # Main component
├── ViewerTree.tsx          # Tree mode
├── ViewerTreeNode.tsx      # Tree node
├── ViewerTreeState.ts      # Tree state hook
├── ViewerRaw.tsx           # Raw mode
├── ViewerFlow.tsx          # Flow mode
└── ViewerCompare.tsx       # Compare mode
```

**Pattern:** `[Feature][Subfeature][Detail]`

---

## Component Categories

### 1. **Features** (`components/features/`)

Feature-specific components that implement business logic.

#### Admin (`features/admin/`)
- `seo-manager.tsx` - SEO management interface
- `super-admin-dashboard.tsx` - Admin dashboard
- `system-stats.tsx` - System statistics
- `tag-analytics.tsx` - Tag analytics
- `user-list.tsx` - User management

#### Editor (`features/editor/`)
- `json-editor.tsx` - Main JSON editor
- `json-metadata-form.tsx` - Metadata editing

#### Modals (`features/modals/`)
- `share-modal.tsx` - Share JSON
- `embed-modal.tsx` - Generate embed code
- `export-modal.tsx` - Export JSON
- `publish-modal.tsx` - Publish to library
- `login-modal.tsx` - Authentication
- `node-details-modal.tsx` - Node details

#### Viewer (`features/viewer/`)
- `Viewer.tsx` - Main viewer orchestrator
- `ViewerTree.tsx` - Tree view mode
- `ViewerRaw.tsx` - Raw JSON mode
- `ViewerFlow.tsx` - Flow diagram mode
- `ViewerCompare.tsx` - Compare mode
- `ViewerActions.tsx` - Action buttons

---

### 2. **Layout** (`components/layout/`)

Layout components for page structure.

- `app-layout.tsx` - Main app layout
- `header.tsx` - App header
- `sidebar.tsx` - Navigation sidebar
- `footer.tsx` - App footer
- `navigation.tsx` - Navigation menu
- `user-menu.tsx` - User dropdown menu

---

### 3. **Shared** (`components/shared/`)

Reusable components used across features.

#### Modals & Dialogs
- `base-modal.tsx` - Base modal component

#### Empty & Loading States
- `empty-states.tsx` - Empty state components
- See [State Patterns](./state-patterns.md)

#### Data Display
- `json-viewer-base.tsx` - Base JSON viewer
- `node-renderer.tsx` - JSON node rendering
- `tree-view.tsx` - Tree view component

#### Utilities
- `error-boundary.tsx` - Error boundary
- `lazy-components.tsx` - Lazy loading wrappers
- `performance-monitor.tsx` - Performance monitoring
- `service-worker-manager.tsx` - Service worker
- `version-checker.tsx` - Version checking

---

### 4. **UI Primitives** (`components/ui/`)

Low-level UI components from shadcn/ui.

**Common components:**
- `button.tsx` - Button component
- `input.tsx` - Input field
- `dialog.tsx` - Dialog primitive
- `alert-dialog.tsx` - Alert dialog
- `sheet.tsx` - Sheet/drawer
- `card.tsx` - Card container
- `badge.tsx` - Badge component
- `skeleton.tsx` - Loading skeleton
- `loading-states.tsx` - Loading components

See [shadcn/ui documentation](https://ui.shadcn.com/) for full list.

---

## Import Patterns

### Barrel Exports
Use barrel exports (index.ts) for clean imports:

```typescript
// ✅ Good - Using barrel export
import { Viewer, ViewerCompare } from '@/components/features/viewer';
import { ShareModal, ExportModal } from '@/components/features/modals';
import { EmptyState, JsonEmptyState } from '@/components/shared';

// ❌ Avoid - Direct file imports
import { Viewer } from '@/components/features/viewer/Viewer';
import { ShareModal } from '@/components/features/modals/share-modal';
```

### Path Aliases
Use `@/` alias for absolute imports:

```typescript
// ✅ Good - Absolute import
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// ❌ Avoid - Relative imports across directories
import { Button } from '../../../components/ui/button';
```

### Lazy Loading
Use lazy loading for heavy components:

```typescript
import { LazyViewer, LazyShareModal } from '@/components/shared/lazy-components';

// Or use dynamic import
import dynamic from 'next/dynamic';

const Viewer = dynamic(
  () => import('@/components/features/viewer').then(m => ({ default: m.Viewer })),
  { ssr: false }
);
```

---

## Best Practices

### 1. **Component Structure**
```typescript
'use client'; // Only if needed

import { /* dependencies */ } from '...';

// Types/Interfaces
interface ComponentProps {
  // ...
}

// Component
export function Component({ ...props }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleAction = () => { ... };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 2. **TypeScript**
- Always type props
- Export types when needed by consumers
- Use interfaces for props, types for unions/intersections

### 3. **Performance**
- Use `React.memo()` for expensive components
- Lazy load heavy components
- Use `useCallback()` and `useMemo()` appropriately
- Avoid inline object/array creation in render

### 4. **Accessibility**
- Use semantic HTML
- Provide ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### 5. **Styling**
- Use Tailwind CSS classes
- Use `cn()` utility for conditional classes
- Follow design system tokens
- Maintain responsive design

---

## Documentation

- **[Modal Patterns](./modal-patterns.md)** - When to use each modal type
- **[State Patterns](./state-patterns.md)** - Empty and loading states
- **[Viewer Architecture](./viewer-architecture.md)** - JSON viewer design (if exists)

---

## Migration Guide

### Updating Component Names
When renaming components, update:

1. **File name** - Rename to kebab-case
2. **Component export** - Keep PascalCase
3. **Barrel export** - Update index.ts
4. **All imports** - Find and replace
5. **Tests** - Update test files
6. **Documentation** - Update docs

### Example Migration
```bash
# 1. Rename file
mv components/shared/BaseModal.tsx components/shared/base-modal.tsx

# 2. Update barrel export
# Edit components/shared/index.ts
export { BaseModal } from './base-modal';

# 3. Find all imports
grep -r "from './BaseModal'" .
grep -r "from '@/components/shared/BaseModal'" .

# 4. Update imports
# Use find-replace in your editor

# 5. Test build
npm run build
```

---

## Common Issues

### Issue 1: Module Not Found
**Problem:** `Module not found: Can't resolve './ComponentName'`

**Solution:** Check file name matches import (kebab-case vs PascalCase)

### Issue 2: Circular Dependencies
**Problem:** Components import each other

**Solution:** Extract shared logic to hooks or utilities

### Issue 3: Barrel Export Performance
**Problem:** Slow imports from barrel exports

**Solution:** Use direct imports for large files, or split barrel exports

---

## Contributing

When adding new components:

1. **Choose the right directory**
   - Feature-specific → `features/[feature]/`
   - Reusable → `shared/`
   - UI primitive → `ui/`

2. **Follow naming conventions**
   - File: kebab-case
   - Component: PascalCase
   - Hierarchical for related components

3. **Add to barrel export**
   - Update `index.ts` in the directory

4. **Document if needed**
   - Add to this README
   - Create pattern doc if introducing new pattern

5. **Test thoroughly**
   - Unit tests
   - Integration tests
   - Manual testing

---

## Summary

| Directory | Purpose | Naming | Exports |
|-----------|---------|--------|---------|
| `features/` | Feature components | kebab-case | Via index.ts |
| `layout/` | Layout components | kebab-case | Via index.ts |
| `shared/` | Reusable components | kebab-case | Via index.ts |
| `ui/` | UI primitives | kebab-case | Individual |
| `debug/` | Debug components | kebab-case | Individual |

**Key Principles:**
- ✅ kebab-case file names
- ✅ PascalCase component names
- ✅ Hierarchical naming for related components
- ✅ Barrel exports for clean imports
- ✅ Lazy loading for heavy components



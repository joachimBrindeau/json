# Components Architecture

## Overview

The components directory follows a feature-based organization pattern, grouping related components together for better maintainability and discoverability.

## Directory Structure

```
components/
├── features/           # Feature-specific components
│   ├── admin/         # Admin dashboard components
│   ├── editor/        # JSON/text editor components
│   ├── flow-diagram/  # Flow diagram visualization
│   ├── json-viewer/   # JSON viewer variants
│   ├── modals/        # Modal dialogs
│   └── upload/        # Upload functionality
│
├── layout/            # Layout components
│   ├── app-layout.tsx
│   ├── header-nav.tsx
│   ├── main-layout.tsx
│   ├── mobile-layout-wrapper.tsx
│   ├── sidebar.tsx
│   ├── dynamic-breadcrumb.tsx
│   ├── user-menu.tsx
│   └── tabs-nav.tsx
│
├── shared/            # Shared/reusable components
│   ├── hooks/        # Custom React hooks
│   ├── providers/    # React context providers
│   ├── seo/          # SEO-related components
│   ├── BaseModal.tsx
│   ├── EmptyStates.tsx
│   ├── JsonViewerBase.tsx
│   ├── NodeRenderer.tsx
│   ├── PerformanceMonitor.tsx
│   ├── TreeView.tsx
│   ├── error-boundary.tsx
│   ├── lazy-components.tsx
│   ├── service-worker-manager.tsx
│   └── version-checker.tsx
│
├── ui/                # UI primitives (shadcn/ui)
│   └── [50+ UI components]
│
└── debug/             # Debug-only components
    └── debug-avatar.tsx
```

## Feature Directories

### `features/admin/`
Admin dashboard components for superadmin functionality:
- `SuperAdminDashboard.tsx` - Main dashboard
- `UserList.tsx` - User management
- `SystemStats.tsx` - System statistics
- `TagAnalytics.tsx` - Tag analytics
- `SEOManager.tsx` - SEO management

### `features/editor/`
JSON and text editing components:
- `json-editor.tsx` - Monaco-based JSON editor
- `json-metadata-form.tsx` - Metadata form
- `rich-text-editor.tsx` - Rich text editor

### `features/flow-diagram/`
Flow diagram visualization (merged from json-flow + json-flow-view):
- `nodes/` - Node components (ArrayNode, ObjectNode, PrimitiveNode, etc.)
- `edges/` - Edge components (ChainEdge, DefaultEdge)
- `utils/` - Utilities (json-parser, position-helper, types, constants)
- `JsonSeaDiagram.tsx` - Main diagram component
- `JsonFlowView.tsx` - Flow view wrapper

### `features/json-viewer/`
JSON viewer variants and related components:
- `json-viewer.tsx` - Standard JSON viewer
- `simple-json-viewer.tsx` - Simplified viewer
- `smart-json-viewer.tsx` - Smart viewer with auto-selection
- `virtual-json-viewer.tsx` - Virtualized viewer for large JSON
- `json-compare.tsx` - JSON comparison
- `json-action-buttons.tsx` - Action buttons
- `viewer-settings.tsx` - Viewer settings
- `detail-panel/` - Detail panel components
- `progressive-disclosure/` - Progressive disclosure tree
- `ultra-optimized-viewer/` - Ultra-optimized viewer

### `features/modals/`
Modal dialog components:
- `embed-modal.tsx` - Embed modal
- `export-modal.tsx` - Export modal
- `login-modal.tsx` - Login modal
- `publish-modal.tsx` - Publish modal
- `share-modal.tsx` - Share modal
- `unified-share-modal.tsx` - Unified share modal
- `node-details-modal.tsx` - Node details modal
- `global-login-modal.tsx` - Global login modal

### `features/upload/`
Upload functionality:
- `enhanced-upload.tsx` - Enhanced upload component

## Layout Components

Layout components handle the application structure:
- `app-layout.tsx` - Main app layout wrapper
- `header-nav.tsx` - Header navigation
- `main-layout.tsx` - Main content layout
- `mobile-layout-wrapper.tsx` - Mobile-specific layout
- `sidebar.tsx` - Sidebar navigation
- `dynamic-breadcrumb.tsx` - Dynamic breadcrumb navigation
- `user-menu.tsx` - User menu dropdown
- `tabs-nav.tsx` - Tab navigation

## Shared Components

Reusable components used across features:
- `hooks/` - Custom React hooks
- `providers/` - React context providers (navigation, session)
- `seo/` - SEO components (analytics, web-vitals, performance)
- `BaseModal.tsx` - Base modal component
- `EmptyStates.tsx` - Empty state components
- `JsonViewerBase.tsx` - Base JSON viewer
- `NodeRenderer.tsx` - Node rendering utilities
- `PerformanceMonitor.tsx` - Performance monitoring
- `TreeView.tsx` - Tree view component
- `error-boundary.tsx` - Error boundary wrapper
- `lazy-components.tsx` - Lazy loading utilities
- `service-worker-manager.tsx` - Service worker management
- `version-checker.tsx` - Version checking

## UI Components

Primitive UI components from shadcn/ui library. These are low-level building blocks used throughout the application.

## Import Conventions

All imports use absolute paths with the `@/` alias:

```typescript
// ✅ Good
import { JsonViewer } from '@/components/features/json-viewer/json-viewer';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/shared/providers/session-provider';

// ❌ Bad
import { JsonViewer } from '../../../features/json-viewer/json-viewer';
import { Button } from './ui/button';
```

## Adding New Components

### Feature Components
If the component is specific to a feature, add it to the appropriate `features/` subdirectory:
```
components/features/[feature-name]/[component-name].tsx
```

### Shared Components
If the component is reusable across features, add it to `shared/`:
```
components/shared/[component-name].tsx
```

### Layout Components
If the component is part of the application layout, add it to `layout/`:
```
components/layout/[component-name].tsx
```

### UI Primitives
If the component is a low-level UI primitive, add it to `ui/`:
```
components/ui/[component-name].tsx
```

## Naming Conventions

- Use kebab-case for file names: `json-viewer.tsx`, `user-menu.tsx`
- Use PascalCase for component names: `JsonViewer`, `UserMenu`
- Use descriptive names that indicate the component's purpose
- Avoid generic names like `Component.tsx` or `Utils.tsx`

## Barrel Exports

Each feature directory includes an `index.ts` barrel export for cleaner imports:

```typescript
// components/features/modals/index.ts
export { EmbedModal } from './embed-modal';
export { ExportModal } from './export-modal';
// ...
```

This allows importing multiple components from a single path:
```typescript
import { EmbedModal, ExportModal } from '@/components/features/modals';
```


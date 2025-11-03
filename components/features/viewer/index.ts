/**
 * Viewer Components
 * Clean, flat structure with hierarchical naming
 *
 * Main Components:
 * - Viewer: Primary JSON viewer with tree/raw/flow/list modes (auto-optimizing)
 * - ViewerCompare: Side-by-side JSON comparison
 *
 * Individual Modes (advanced usage):
 * - ViewerTree: Tree view mode
 * - ViewerRaw: Raw JSON mode
 * - ViewerFlow: Flow diagram mode
 * - ViewerList: Flat list view with search
 *
 * Utilities:
 * - ViewerActions: Share/embed/export buttons
 *
 * Types:
 * - ViewMode: 'tree' | 'raw' | 'flow' | 'list'
 * - JsonNode: Tree node structure
 */

// Main components
export { Viewer } from './Viewer';
export { ViewerCompare } from './ViewerCompare';

// Individual modes (for advanced usage)
export { ViewerTree } from './ViewerTree';
export { ViewerRaw } from './ViewerRaw';
export { ViewerFlow } from './ViewerFlow';
export { ViewerList } from './ViewerList';

// Utilities
export { ViewerActions } from './ViewerActions';

// Types
export type { ViewMode, JsonNode, JsonStats, ParseResult } from './types';

// Backwards compatibility exports (deprecated - use new names)
export { Viewer as UltraJsonViewer } from './Viewer';
export { ViewerCompare as JsonCompare } from './ViewerCompare';
export { ViewerActions as JsonActionButtons } from './ViewerActions';

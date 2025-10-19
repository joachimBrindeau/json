import type { LucideIcon } from 'lucide-react';

/**
 * Position of action button in the action bar
 */
export type ActionPosition = 'left' | 'right';

/**
 * Button variant types
 */
export type ActionVariant = 
  | 'default' 
  | 'destructive' 
  | 'outline' 
  | 'secondary' 
  | 'ghost' 
  | 'link' 
  | 'green' 
  | 'red' 
  | 'blue';

/**
 * Configuration for a single editor action button
 */
export interface EditorAction {
  /** Unique identifier for the action */
  id: string;

  /** Display label for the button */
  label: string;

  /** Lucide icon component */
  icon: LucideIcon;

  /** Click handler */
  onClick: () => void;

  /** Whether the button is disabled */
  disabled?: boolean;

  /** Button variant/style */
  variant?: ActionVariant;

  /** Position in action bar (left for primary actions, right for utilities) */
  position?: ActionPosition;

  /** Whether to show text label (if false, icon-only on all screen sizes) */
  showText?: boolean;

  /** Tooltip text (defaults to label if not provided) */
  tooltip?: string;

  /** Whether the action is in loading state */
  loading?: boolean;

  /** Text to show when loading */
  loadingText?: string;

  /** Custom className for the button */
  className?: string;

  /** Whether to show a confirmation popover before executing the action */
  requireConfirm?: boolean;

  /** Title for the confirmation popover */
  confirmTitle?: string;

  /** Description for the confirmation popover */
  confirmDescription?: string;

  /** Variant for the confirmation popover */
  confirmVariant?: 'default' | 'destructive' | 'warning' | 'info';
}

/**
 * Props for EditorPane component
 */
export interface EditorPaneProps {
  /** Title displayed in the editor header */
  title: string;
  
  /** Current editor content */
  value: string;
  
  /** Change handler for editor content */
  onChange?: (value: string) => void;
  
  /** Monaco editor language mode */
  language?: string;
  
  /** Whether the editor is read-only */
  readOnly?: boolean;
  
  /** Array of action buttons to display */
  actions?: EditorAction[];

  /** Custom action components to render after action buttons */
  customActions?: React.ReactNode;

  /** Whether to show the search bar */
  showSearch?: boolean;
  
  /** Current search term */
  searchValue?: string;
  
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  
  /** Optional validation badge to display in header */
  validationBadge?: React.ReactNode;
  
  /** Optional content to display in header (e.g., format selectors) */
  headerContent?: React.ReactNode;
  
  /** Optional className for the container */
  className?: string;
  
  /** Monaco editor theme */
  theme?: string;
  
  /** Monaco editor mount handler */
  onMount?: (editor: any, monaco: any) => void;
  
  /** Monaco editor beforeMount handler */
  beforeMount?: (monaco: any) => void;
  
  /** Monaco editor options */
  options?: any;
}


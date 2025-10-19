'use client';

import { useMemo } from 'react';
import { SearchBar } from '@/components/shared/search-bar';
import { MonacoEditor } from '@/components/features/editor/MonacoEditorWithLoading';
import { ActionButton } from '@/components/features/editor/ActionButton';
import type { EditorPaneProps } from '@/types/editor-actions';

/**
 * Flexible editor pane component with configurable actions
 * 
 * Features:
 * - Monaco editor integration
 * - Configurable action buttons (left and right positions)
 * - Optional search bar
 * - Optional validation badge
 * - Optional header content (e.g., format selectors)
 * - Automatic responsive layout
 * 
 * @example
 * ```tsx
 * <EditorPane
 *   title="Input JSON"
 *   value={input}
 *   onChange={setInput}
 *   actions={[
 *     { id: 'format', label: 'Format', icon: Zap, onClick: handleFormat, position: 'left' },
 *     { id: 'copy', label: 'Copy', icon: Copy, onClick: handleCopy, position: 'right', showText: false },
 *   ]}
 *   searchValue={searchTerm}
 *   onSearchChange={setSearchTerm}
 *   validationBadge={<Badge>Valid</Badge>}
 * />
 * ```
 */
export function EditorPane({
  title,
  value,
  onChange,
  language = 'json',
  readOnly = false,
  actions = [],
  customActions,
  showSearch = true,
  searchValue = '',
  onSearchChange,
  validationBadge,
  headerContent,
  className = '',
  theme,
  onMount,
  beforeMount,
  options,
}: EditorPaneProps) {
  // Separate actions by position
  const leftActions = useMemo(
    () => actions.filter(a => a.position === 'left'),
    [actions]
  );
  
  const rightActions = useMemo(
    () => actions.filter(a => a.position === 'right' || !a.position),
    [actions]
  );

  return (
    <div className={`flex-1 flex flex-col bg-card ${className}`}>
      {/* Action bar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-shrink-0">
        {/* Left actions (primary) */}
        {leftActions.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {leftActions.map(action => (
              <ActionButton key={action.id} action={action} />
            ))}
          </div>
        )}

        {/* Search bar */}
        {showSearch && onSearchChange && (
          <div className={`flex-1 min-w-0 ${leftActions.length > 0 ? 'ml-2' : ''}`}>
            <SearchBar
              value={searchValue}
              onChange={onSearchChange}
              placeholder={`Search ${title.toLowerCase()}...`}
            />
          </div>
        )}

        {/* Right actions (utilities) - all grouped together */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {rightActions.map(action => (
            <ActionButton key={action.id} action={action} />
          ))}
          {customActions}
        </div>
      </div>

      {/* Editor header */}
      <div className="h-10 px-2 bg-muted border-b text-xs font-medium text-muted-foreground flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {headerContent}
        </div>
        {validationBadge}
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={language}
          value={value}
          onChange={onChange ? (value) => onChange(value || '') : undefined}
          theme={theme}
          onMount={onMount}
          beforeMount={beforeMount}
          options={{
            readOnly,
            ...options,
          }}
        />
      </div>
    </div>
  );
}


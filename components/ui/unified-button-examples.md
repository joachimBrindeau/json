# UnifiedButton Examples

The UnifiedButton component provides a consistent interface for all buttons in the application.

## Basic Usage

```tsx
import { UnifiedButton } from '@/components/ui/unified-button';
import { Save, Copy, Download } from 'lucide-react';

// Icon + Text button
<UnifiedButton
  variant="green"
  size="xs"
  icon={Save}
  text="Save"
  onClick={handleSave}
/>

// Icon only button
<UnifiedButton
  variant="outline"
  size="icon"
  icon={Copy}
  title="Copy to clipboard"
  onClick={handleCopy}
/>

// Text only button
<UnifiedButton
  variant="default"
  text="Submit"
  onClick={handleSubmit}
/>

// Loading state
<UnifiedButton
  variant="blue"
  icon={Download}
  text="Export"
  isLoading={isExporting}
  loadingText="Exporting..."
  onClick={handleExport}
/>
```

## Variants

- `default` - Primary blue button
- `outline` - Outlined button
- `secondary` - Secondary gray button  
- `ghost` - Transparent button
- `destructive` - Red destructive action
- `green` - Green success/save actions
- `red` - Red warning/delete actions  
- `blue` - Blue accent actions

## Sizes

- `xs` - Extra small (h-7, for toolbars)
- `sm` - Small (h-9)
- `default` - Default (h-10)
- `lg` - Large (h-11)
- `icon` - Square icon button

## Props

- `icon?: LucideIcon` - Icon to display
- `text?: string` - Button text
- `isLoading?: boolean` - Show loading state
- `loadingText?: string` - Text to show when loading
- `iconPosition?: 'left' | 'right'` - Icon position
- `variant` - Visual style variant
- `size` - Button size
- All standard button HTML attributes
'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store';
import type { JsonSeaConfig } from '@/lib/types';

export function ViewerSettings() {
  const { viewerConfig, updateViewerConfig } = useAppStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Layout Direction</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={viewerConfig.layout || 'TB'}
          onValueChange={(value) =>
            updateViewerConfig({ layout: value as JsonSeaConfig['layout'] })
          }
        >
          <DropdownMenuRadioItem value="TB">Top to Bottom</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BT">Bottom to Top</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LR">Left to Right</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="RL">Right to Left</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={viewerConfig.theme || 'default'}
          onValueChange={(value) => updateViewerConfig({ theme: value as JsonSeaConfig['theme'] })}
        >
          <DropdownMenuRadioItem value="default">Default</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ocean">Ocean</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="forest">Forest</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="sunset">Sunset</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Edge Style</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={viewerConfig.edgeType || 'smoothstep'}
          onValueChange={(value) =>
            updateViewerConfig({ edgeType: value as JsonSeaConfig['edgeType'] })
          }
        >
          <DropdownMenuRadioItem value="smoothstep">Smooth Step</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="straight">Straight</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="step">Step</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="bezier">Bezier</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Display Options</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={viewerConfig.compact ?? false}
          onCheckedChange={(checked) => updateViewerConfig({ compact: checked })}
        >
          Compact Mode
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={viewerConfig.animated ?? false}
          onCheckedChange={(checked) => updateViewerConfig({ animated: checked })}
        >
          Animated Edges
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={viewerConfig.showMiniMap ?? true}
          onCheckedChange={(checked) => updateViewerConfig({ showMiniMap: checked })}
        >
          Show MiniMap
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={viewerConfig.showControls ?? true}
          onCheckedChange={(checked) => updateViewerConfig({ showControls: checked })}
        >
          Show Controls
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={viewerConfig.showBackground ?? true}
          onCheckedChange={(checked) => updateViewerConfig({ showBackground: checked })}
        >
          Show Background
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Background Pattern</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={viewerConfig.backgroundVariant || 'dots'}
          onValueChange={(value) =>
            updateViewerConfig({ backgroundVariant: value as JsonSeaConfig['backgroundVariant'] })
          }
        >
          <DropdownMenuRadioItem value="dots">Dots</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="lines">Lines</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="cross">Cross</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

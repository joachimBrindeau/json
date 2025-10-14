/**
 * FlowControls - Custom control panel for React Flow
 * 
 * Provides navigation and interaction controls:
 * - Fit View: Fit all nodes in viewport
 * - Center Root: Center on root node
 * - Zoom In/Out: Zoom controls
 */

'use client';

import { useReactFlow, Panel } from '@xyflow/react';
import { Maximize, Home, ZoomIn, ZoomOut } from 'lucide-react';
import { NodeType } from './utils/flow-types';

export function FlowControls() {
  const { fitView, zoomIn, zoomOut, setCenter, getNodes } = useReactFlow();

  const handleFitView = () => {
    fitView({ 
      padding: 0.2, 
      duration: 800,
      maxZoom: 1.5,
    });
  };

  const handleCenterRoot = () => {
    const rootNode = getNodes().find(n => n.type === NodeType.Root);
    if (rootNode) {
      const x = rootNode.position.x + ((rootNode.width || 0) / 2);
      const y = rootNode.position.y + ((rootNode.height || 0) / 2);
      setCenter(x, y, { zoom: 1.2, duration: 800 });
    }
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  return (
    <Panel 
      position="top-left" 
      className="flex flex-col gap-1 bg-white dark:bg-gray-950 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800"
    >
      <button
        onClick={handleFitView}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-2"
        title="Fit View"
      >
        <Maximize className="h-4 w-4" />
        <span className="text-sm">Fit View</span>
      </button>
      
      <button
        onClick={handleCenterRoot}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-2"
        title="Center on Root"
      >
        <Home className="h-4 w-4" />
        <span className="text-sm">Center Root</span>
      </button>

      <div className="flex gap-1 pt-1 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>
    </Panel>
  );
}


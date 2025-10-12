export interface JsonSeaConfig {
  layout: 'TB' | 'BT' | 'LR' | 'RL';
  theme: 'default' | 'dark' | 'ocean' | 'forest' | 'sunset';
  edgeType: 'smoothstep' | 'straight' | 'step' | 'bezier';
  backgroundVariant: 'dots' | 'lines' | 'cross';
  compact?: boolean;
  animated?: boolean;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
}

export interface WorkerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  progress?: number;
  stats?: JsonStats | Record<string, unknown>;
  valid?: boolean;
}

export interface JsonWorkerMessage {
  type: 'parse' | 'analyze' | 'generate' | 'validate' | 'stringify';
  payload: string | Record<string, unknown>;
  id?: string;
}

export interface JsonStats {
  size: number;
  sizeKB: number;
  sizeMB: number;
  nodeCount: number;
  maxDepth: number;
  complexity: 'Low' | 'Medium' | 'High';
}

/**
 * Type definitions for Node Details Modal
 * Centralized type safety for all node details components
 */

// ============================================================================
// Core Node Types
// ============================================================================

export interface NodeDetails {
  id: string;
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  path: string;
  size: number;
  childCount: number;
  parentNodePathIds?: string[];
}

// ============================================================================
// Detection Types
// ============================================================================

export type DetectedType =
  | 'url'
  | 'email'
  | 'color'
  | 'date'
  | 'coordinates'
  | 'phone'
  | 'ip'
  | 'uuid'
  | 'filepath'
  | 'base64'
  | 'json'
  | 'regex'
  | 'semver'
  | 'currency'
  | 'filesize'
  | 'duration'
  | 'image'
  | 'video'
  | 'audio'
  | 'markdown'
  | 'html';

export interface DetectionResult {
  type: DetectedType;
  confidence: number; // 0-1
  metadata: Record<string, unknown>;
}

export interface UrlDetection {
  type: 'url';
  confidence: number;
  metadata: {
    protocol: string;
    domain: string;
    path: string;
    queryParams: Record<string, string>;
    hash: string;
    isSecure: boolean;
  };
}

export interface EmailDetection {
  type: 'email';
  confidence: number;
  metadata: {
    username: string;
    domain: string;
    isValid: boolean;
  };
}

export interface ColorDetection {
  type: 'color';
  confidence: number;
  metadata: {
    format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
    alpha?: number;
  };
}

export interface DateDetection {
  type: 'date';
  confidence: number;
  metadata: {
    format: 'iso8601' | 'unix' | 'custom';
    timestamp: number;
    isValid: boolean;
    timezone?: string;
  };
}

export interface CoordinatesDetection {
  type: 'coordinates';
  confidence: number;
  metadata: {
    lat: number;
    lng: number;
    format: 'decimal' | 'dms' | 'object';
  };
}

export interface MediaDetection {
  type: 'image' | 'video' | 'audio';
  confidence: number;
  metadata: {
    url?: string;
    base64?: string;
    mimeType?: string;
    extension?: string;
  };
}

// ============================================================================
// Renderer Props
// ============================================================================

export interface BaseRendererProps {
  value: unknown;
  detections: DetectionResult[];
  nodeDetails: NodeDetails;
}

export interface StringRendererProps extends BaseRendererProps {
  value: string;
}

export interface NumberRendererProps extends BaseRendererProps {
  value: number;
}

export interface BooleanRendererProps extends BaseRendererProps {
  value: boolean;
}

export interface ArrayRendererProps extends BaseRendererProps {
  value: unknown[];
}

export interface ObjectRendererProps extends BaseRendererProps {
  value: Record<string, unknown>;
}

// ============================================================================
// Tool Types
// ============================================================================

export interface CopyOption {
  label: string;
  value: string;
  description?: string;
}

export interface TransformOption {
  id: string;
  label: string;
  description: string;
  category: 'case' | 'encoding' | 'hashing' | 'format';
  transform: (value: string) => string | Promise<string>;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  suggestions?: string[];
  details?: Record<string, unknown>;
}

export interface Validator {
  id: string;
  label: string;
  description: string;
  validate: (value: string) => ValidationResult | Promise<ValidationResult>;
}

// ============================================================================
// Context Types
// ============================================================================

export interface NodeContext {
  parent?: NodeDetails;
  siblings: NodeDetails[];
  children: NodeDetails[];
  jsonPath: string;
  breadcrumbs: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  nodeId: string;
}

// ============================================================================
// Format Conversion Types
// ============================================================================

export type SupportedFormat = 'json' | 'yaml' | 'xml' | 'csv';

export interface FormatConverter {
  from: SupportedFormat;
  to: SupportedFormat;
  convert: (value: unknown) => string | Promise<string>;
}

// ============================================================================
// Analytics Types (for arrays/objects)
// ============================================================================

export interface ArrayAnalytics {
  itemCount: number;
  typeDistribution: Record<string, number>;
  hasNumericValues: boolean;
  hasDuplicates: boolean;
  numericStats?: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
}

export interface ObjectAnalytics {
  propertyCount: number;
  depth: number;
  hasNestedObjects: boolean;
  hasNestedArrays: boolean;
  schema: Record<string, string>;
}

// ============================================================================
// UI State Types
// ============================================================================

export type TabId = 'overview' | 'content' | 'tools' | 'relationships';

export interface ModalState {
  activeTab: TabId;
  isLoading: boolean;
  error?: string;
}


import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JsonSeaConfig } from '@/lib/types';
import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { logger } from '@/lib/logger';
import { apiClient, api } from '@/lib/api/client';
import type { JsonValue } from '@/lib/types/json';
import { config } from '@/lib/config';

interface JsonDocument {
  id: string;
  shareId: string;
  title?: string;
  content: JsonValue;
  size: number;
  nodeCount: number;
  maxDepth: number;
  complexity: string;
  createdAt: Date;
  userId?: string;
  isAnonymous?: boolean;
  expiresAt?: Date;
  visibility?: 'private' | 'public';
  publishedAt?: Date;
}

interface BackendAppState {
  // Auth state
  session: Session | null;
  isAuthenticated: boolean;

  // Current document
  currentDocument: JsonDocument | null;
  currentJson: string;
  shareId: string;
  isDirty: boolean;

  // Anonymous tracking
  anonymousSessionId: string;
  anonymousJsonIds: string[];
  showLibraryHint: boolean;

  // UI state
  isUploading: boolean;
  uploadProgress: number;
  lastActiveTab: string; // Track active tab across pages
  sidebarScrollPosition: number; // Persist sidebar scroll position

  // Viewer configuration
  viewerConfig: JsonSeaConfig;

  // Actions
  updateSession: () => Promise<void>;
  uploadJson: (file: File, title?: string) => Promise<JsonDocument>;
  loadJson: (id: string) => Promise<boolean>;
  analyzeJson: (content: string) => Promise<JsonValue>;
  shareJson: () => Promise<string>;
  saveJson: (title?: string) => Promise<void>;
  deleteDocument: (shareId: string) => Promise<void>;
  saveToLibrary: () => Promise<void>;
  updateTitle: (title: string) => Promise<void>;
  onLibraryUpdate?: () => void;
  setLibraryUpdateCallback: (callback: () => void) => void;
  setCurrentJson: (json: string) => void;
  setShareId: (id: string) => void;
  setViewerConfig: (config: JsonSeaConfig) => void;
  updateViewerConfig: (updates: Partial<JsonSeaConfig>) => void;
  trackAnonymousJson: (jsonId: string) => void;
  migrateAnonymousData: () => Promise<void>;
  clearState: () => void;
  setLastActiveTab: (tab: string) => void;
  setSidebarScrollPosition: (position: number) => void;
}

export const useBackendStore = create<BackendAppState>()(
  persist(
    (set, get) => ({
      // Auth state
      session: null,
      isAuthenticated: false,

      // Current document
      currentDocument: null,
      currentJson: `{
  "project": {
    "name": "JSON Viewer Pro",
    "version": "2.4.1",
    "description": "Professional JSON viewer and editor with advanced features for developers",
    "license": "MIT",
    "repository": {
      "type": "git",
      "url": "https://github.com/jsonviewer/pro",
      "branches": ["main", "develop", "feature/analytics", "hotfix/security-patch"]
    }
  },
  "users": [
    {
      "id": "usr_2k4j3h5k",
      "profile": {
        "name": "Sarah Chen",
        "email": "sarah.chen@techcorp.com",
        "role": "Senior Full Stack Developer",
        "department": "Engineering",
        "location": "San Francisco, CA",
        "timezone": "PST",
        "avatar": "https://api.avatar.com/sarah_chen.jpg"
      },
      "preferences": {
        "theme": "dark",
        "fontSize": 14,
        "autoSave": true,
        "notifications": {
          "email": true,
          "push": false,
          "slack": true
        },
        "editor": {
          "tabSize": 2,
          "wordWrap": true,
          "minimap": true,
          "syntax": "auto"
        }
      },
      "usage": {
        "totalJsonsViewed": 1247,
        "avgSessionTime": "12m 34s",
        "favoriteFeatures": ["tree-view", "compare", "format"],
        "lastActiveDate": "2024-08-30T10:23:45Z",
        "subscription": {
          "plan": "Pro",
          "status": "active",
          "expiresAt": "2025-08-30T00:00:00Z",
          "features": ["unlimited-storage", "team-sharing", "api-access"]
        }
      }
    },
    {
      "id": "usr_8m9n2x1w", 
      "profile": {
        "name": "Marcus Rodriguez",
        "email": "m.rodriguez@startup.io",
        "role": "DevOps Engineer",
        "department": "Infrastructure",
        "location": "Austin, TX",
        "timezone": "CST",
        "avatar": "https://api.avatar.com/marcus_r.jpg"
      },
      "preferences": {
        "theme": "light",
        "fontSize": 12,
        "autoSave": false,
        "notifications": {
          "email": false,
          "push": true,
          "slack": false
        }
      },
      "usage": {
        "totalJsonsViewed": 892,
        "avgSessionTime": "8m 12s",
        "favoriteFeatures": ["validation", "minify", "api-testing"],
        "lastActiveDate": "2024-08-29T16:45:22Z",
        "subscription": {
          "plan": "Free",
          "status": "active",
          "expiresAt": null,
          "features": ["basic-editor", "public-sharing"]
        }
      }
    }
  ],
  "analytics": {
    "overview": {
      "totalUsers": 45234,
      "activeUsersLast30Days": 12456,
      "totalJsonsProcessed": 892341,
      "avgProcessingTime": "0.24s"
    },
    "features": {
      "mostUsed": [
        {"name": "format", "usage": 234567, "percentage": 78.2},
        {"name": "validate", "usage": 198432, "percentage": 66.1},
        {"name": "tree-view", "usage": 156789, "percentage": 52.3},
        {"name": "compare", "usage": 89123, "percentage": 29.7},
        {"name": "share", "usage": 67234, "percentage": 22.4}
      ],
      "growthTrends": {
        "daily": [1234, 1456, 1678, 1890, 2012, 1987, 2145],
        "weekly": [8765, 9234, 10123, 11456, 12789],
        "monthly": [34567, 38923, 42189, 45234]
      }
    },
    "performance": {
      "responseTime": {
        "p50": "156ms",
        "p90": "234ms", 
        "p99": "456ms"
      },
      "throughput": {
        "requestsPerSecond": 127.4,
        "peakRequestsPerSecond": 892.1,
        "errorRate": 0.023
      },
      "infrastructure": {
        "servers": {
          "us-east-1": {"cpu": 67, "memory": 82, "status": "healthy"},
          "us-west-2": {"cpu": 45, "memory": 71, "status": "healthy"},
          "eu-west-1": {"cpu": 78, "memory": 85, "status": "warning"}
        },
        "database": {
          "connections": 234,
          "queryTime": "12ms",
          "cacheHitRate": 0.94
        }
      }
    }
  },
  "api": {
    "endpoints": {
      "POST /api/json/analyze": {
        "description": "Analyze JSON structure and complexity",
        "parameters": {
          "content": {"type": "string", "required": true},
          "includeStats": {"type": "boolean", "default": true}
        },
        "responses": {
          "200": {"description": "Analysis complete"},
          "400": {"description": "Invalid JSON"},
          "429": {"description": "Rate limit exceeded"}
        },
        "rateLimit": "100 requests/minute"
      },
      "GET /api/json/{id}": {
        "description": "Retrieve JSON document",
        "parameters": {
          "id": {"type": "string", "required": true},
          "format": {"type": "string", "enum": ["raw", "formatted"]}
        }
      }
    },
    "authentication": {
      "methods": ["bearer-token", "api-key", "oauth2"],
      "scopes": ["read", "write", "admin"],
      "rateLimits": {
        "free": "100/hour",
        "pro": "1000/hour",
        "enterprise": "unlimited"
      }
    }
  },
  "configuration": {
    "features": {
      "maxFileSize": "10MB",
      "supportedFormats": ["json", "jsonl", "json5"],
      "editorThemes": ["vs-dark", "vs-light", "high-contrast"],
      "exportFormats": ["json", "csv", "xml", "yaml"]
    },
    "security": {
      "encryptionEnabled": true,
      "dataRetention": "90 days",
      "complianceStandards": ["SOC2", "GDPR", "HIPAA"],
      "auditLogging": true
    },
    "integrations": {
      "github": {
        "enabled": true,
        "webhookUrl": "https://api.jsonviewer.app/webhooks/github",
        "events": ["push", "pull_request"]
      },
      "slack": {
        "enabled": true,
        "botToken": "xoxb-****-****-****",
        "defaultChannel": "#dev-tools"
      },
      "postman": {
        "enabled": true,
        "apiKey": "PMAK-****-****-****",
        "collections": ["API Testing", "Data Validation"]
      }
    }
  },
  "metadata": {
    "createdAt": "2024-08-30T09:15:42.123Z",
    "updatedAt": "2024-08-30T14:23:18.456Z",
    "version": "1.2.4",
    "checksum": "sha256:a1b2c3d4e5f6",
    "tags": ["production", "api", "analytics", "user-data"],
    "complexity": "high",
    "nodeCount": 127,
    "maxDepth": 8
  }
}`,
      shareId: '',
      isDirty: false,

      // Anonymous tracking
      anonymousSessionId: '',
      anonymousJsonIds: [],
      showLibraryHint: false,

      // UI state
      isUploading: false,
      uploadProgress: 0,
      lastActiveTab: 'tree', // Default to tree view
      sidebarScrollPosition: 0,

      viewerConfig: {
        layout: 'TB',
        theme: 'default',
        edgeType: 'smoothstep',
        animated: false,
        showMiniMap: true,
        showControls: true,
        showBackground: true,
        backgroundVariant: 'dots',
        compact: false,
      },

      updateSession: async () => {
        try {
          const session = await getSession();
          set({
            session,
            isAuthenticated: !!session,
          });
        } catch (error) {
          logger.error({ err: error }, 'Failed to update session');
          set({ session: null, isAuthenticated: false });
        }
      },

      trackAnonymousJson: (jsonId: string) => {
        const { anonymousJsonIds, isAuthenticated, anonymousSessionId } = get();
        if (!isAuthenticated && !anonymousJsonIds.includes(jsonId)) {
          const updatedIds = [...anonymousJsonIds, jsonId];
          const updates: Partial<BackendAppState> = {
            anonymousJsonIds: updatedIds,
            showLibraryHint: updatedIds.length >= 2, // Show hint after 2nd JSON
          };
          // Generate session ID lazily if not exists
          if (!anonymousSessionId && typeof window !== 'undefined') {
            updates.anonymousSessionId = crypto.randomUUID();
          }
          set(updates);
        }
      },

      migrateAnonymousData: async () => {
        const { anonymousJsonIds, isAuthenticated } = get();
        if (!isAuthenticated || anonymousJsonIds.length === 0) return;

        try {
          await apiClient.post('/api/auth/migrate-anonymous', { anonymousJsonIds });
          set({ anonymousJsonIds: [], showLibraryHint: false });
        } catch (error) {
          logger.error({ err: error }, 'Failed to migrate anonymous data');
        }
      },

      saveToLibrary: async () => {
        const { isAuthenticated, session } = get();
        if (!isAuthenticated || !session) {
          throw new Error('Authentication required to save to library');
        }
        // This will be the same as saveJson but with explicit library intent
        return get().saveJson();
      },

      uploadJson: async (file: File, title?: string) => {
        set({ isUploading: true, uploadProgress: 0 });

        try {
          const formData = new FormData();
          formData.append('file', file);
          if (title) formData.append('title', title);

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            set((state) => ({
              uploadProgress: Math.min(state.uploadProgress + 10, 90),
            }));
          }, 100);

          interface UploadResponse {
            document: {
              id: string;
              shareId: string;
              title: string;
              size: number;
              nodeCount: number;
              maxDepth: number;
              complexity: string;
              createdAt: string;
            };
          }

          const result = await apiClient.post<UploadResponse>('/api/json/upload', formData);

          clearInterval(progressInterval);
          set({ uploadProgress: 100 });
          const document: JsonDocument = {
            id: result.document.id,
            shareId: result.document.shareId,
            title: result.document.title,
            content: JSON.parse(await file.text()) as JsonValue,
            size: result.document.size,
            nodeCount: result.document.nodeCount,
            maxDepth: result.document.maxDepth,
            complexity: result.document.complexity,
            createdAt: new Date(result.document.createdAt),
          };

          set({
            currentDocument: document,
            currentJson: JSON.stringify(document.content, null, 2),
            shareId: document.shareId,
            isDirty: false,
            isUploading: false,
            uploadProgress: 0,
          });

          // Notify library to refresh
          const { onLibraryUpdate } = get();
          if (onLibraryUpdate) {
            onLibraryUpdate();
          }

          return document;
        } catch (error) {
          logger.error({ err: error, fileName: file.name }, 'Upload failed');
          set({ isUploading: false, uploadProgress: 0 });
          throw error;
        }
      },

      loadJson: async (id: string) => {
        try {
          // First, try to get metadata
          const metaResponse = await api.head(`api/json/stream/${id}`);

          if (!metaResponse.ok) {
            return false;
          }

          // Get the streaming data
          const response = await api.get(`api/json/stream/${id}`);

          if (!response.ok) {
            return false;
          }

          // For now, read the entire response
          // In a real implementation, you'd want to stream this
          const reader = response.body?.getReader();
          let chunks = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks += new TextDecoder().decode(value);
            }
          }

          // Parse the streamed data
          const lines = chunks.trim().split('\n');
          const data = lines.map((line) => JSON.parse(line));

          // Reconstruct the JSON from chunks
          const reconstructed = data.length === 1 ? data[0].data : data;

          const document: JsonDocument = {
            id: metaResponse.headers.get('X-Document-ID') || id,
            shareId: metaResponse.headers.get('X-Share-ID') || id,
            title: metaResponse.headers.get('X-Title') || 'Untitled',
            content: reconstructed,
            size: parseInt(metaResponse.headers.get('X-Size') || '0'),
            nodeCount: parseInt(metaResponse.headers.get('X-Node-Count') || '0'),
            maxDepth: parseInt(metaResponse.headers.get('X-Max-Depth') || '0'),
            complexity: metaResponse.headers.get('X-Complexity') || 'Low',
            createdAt: new Date(metaResponse.headers.get('X-Created-At') || Date.now()),
          };

          set({
            currentDocument: document,
            currentJson: JSON.stringify(document.content, null, 2),
            shareId: document.shareId,
            isDirty: false,
          });

          return true;
        } catch (error) {
          logger.error({ err: error, id }, 'Failed to load JSON');
          return false;
        }
      },

      analyzeJson: async (content: string) => {
        try {
          return await apiClient.post('/api/json/analyze', { content });
        } catch (error) {
          logger.error({ err: error }, 'Analysis failed');
          throw error;
        }
      },

      shareJson: async () => {
        const { currentDocument, currentJson, saveJson } = get();

        // If there's already a saved document, return its shareId
        if (currentDocument) {
          return currentDocument.shareId;
        }

        // If there's JSON content but no document, check if this content already exists
        if (currentJson && currentJson.trim()) {
          try {
            // First, try to find an existing document with the same content
            const contentHash = await crypto.subtle.digest(
              'SHA-256',
              new TextEncoder().encode(currentJson)
            );
            const hashArray = Array.from(new Uint8Array(contentHash));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

            interface FindByContentResponse {
              document?: JsonDocument;
            }

            // Check if we already have a document with this content hash
            const existingDocument = await apiClient.post<FindByContentResponse>('/api/json/find-by-content', {
              contentHash: hashHex,
              content: currentJson,
            });

            if (existingDocument.document) {
              // Update our state to reference the existing document
              set({
                currentDocument: existingDocument.document,
                shareId: existingDocument.document.shareId,
                isDirty: false,
              });
              return existingDocument.document.shareId;
            }

            // If no existing document found, save it as new
            await saveJson();
            const { currentDocument: newDocument } = get();
            if (newDocument) {
              return newDocument.shareId;
            }
          } catch (error) {
            logger.error({ err: error }, 'Failed to save JSON before sharing');
            throw new Error('Failed to save JSON before sharing');
          }
        }

        throw new Error('No JSON content to share');
      },

      updateTitle: async (title: string) => {
        const { currentDocument } = get();
        if (!currentDocument) {
          throw new Error('No document to update');
        }

        interface UpdateTitleResponse {
          document: {
            title: string;
          };
        }

        try {
          const result = await apiClient.put<UpdateTitleResponse>(
            `/api/json/${currentDocument.id}/title`,
            { title }
          );

          // Update the local document
          set((state) => ({
            currentDocument: state.currentDocument
              ? {
                  ...state.currentDocument,
                  title: result.document.title,
                }
              : null,
          }));
        } catch (error) {
          logger.error({ err: error, documentId: currentDocument.id }, 'Failed to update title');

          // Fallback: update locally if API fails
          set((state) => ({
            currentDocument: state.currentDocument
              ? {
                  ...state.currentDocument,
                  title: title,
                }
              : null,
          }));

          // Don't throw the error, just log it
        }
      },

      saveJson: async (title?: string) => {
        const { currentDocument, currentJson, onLibraryUpdate } = get();

        if (currentDocument) {
          // Update existing document
          interface UpdateContentResponse {
            document: Partial<JsonDocument>;
          }

          try {
            const result = await apiClient.put<UpdateContentResponse>(
              `/api/json/${currentDocument.id}/content`,
              { content: currentJson }
            );

            // Update the local document with new stats and mark as not dirty
            set((state) => ({
              currentDocument: state.currentDocument
                ? {
                    ...state.currentDocument,
                    ...result.document,
                  }
                : null,
              isDirty: false,
            }));

            // Notify library to refresh
            if (onLibraryUpdate) {
              onLibraryUpdate();
            }
          } catch (error) {
            logger.error({ err: error, documentId: currentDocument.id }, 'Failed to save JSON');
            throw error;
          }
        } else {
          // Create new document - convert JSON string to file and upload
          const blob = new Blob([currentJson], { type: 'application/json' });
          const file = new File([blob], 'untitled.json', { type: 'application/json' });

          const uploadJson = get().uploadJson;
          await uploadJson(file, title || 'Untitled JSON');
          
          // Notify library to refresh
          const { onLibraryUpdate: libraryUpdateCallback } = get();
          if (libraryUpdateCallback) {
            libraryUpdateCallback();
          }
        }
      },

      deleteDocument: async (shareId: string) => {
        const { currentDocument, onLibraryUpdate } = get();

        try {
          await apiClient.delete(`/api/json/${shareId}`);

          // If we deleted the current document, clear it
          if (currentDocument?.shareId === shareId) {
            set({
              currentDocument: null,
              shareId: '',
              isDirty: false,
            });
          }

          // Notify library to refresh
          if (onLibraryUpdate) {
            onLibraryUpdate();
          }
        } catch (error) {
          logger.error({ err: error, shareId }, 'Failed to delete document');
          throw error;
        }
      },

      setCurrentJson: (json: string) => {
        set({ currentJson: json, isDirty: true });

        // Track complex JSONs for anonymous users (avoid heavy parsing on large payloads)
        try {
          const size = new Blob([json]).size;
          // Heuristic: only attempt parse for small payloads (< 1MB)
          let nodeCount = 0;
          if (size < 1_000_000) {
            try {
              const parsed = JSON.parse(json);
              nodeCount = JSON.stringify(parsed).length;
            } catch {
              // ignore
            }
          }

          // Track if JSON is complex enough (>1KB or >100 nodes) by size alone for large inputs
          if (size > 1024 || nodeCount > 100) {
            const jsonId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            get().trackAnonymousJson(jsonId);
          }
        } catch {
          // ignore
        }
      },

      setShareId: (id: string) => {
        set({ shareId: id });
      },

      setViewerConfig: (config: JsonSeaConfig) => {
        set({ viewerConfig: config });
      },

      updateViewerConfig: (updates: Partial<JsonSeaConfig>) => {
        set((state) => ({
          viewerConfig: { ...state.viewerConfig, ...updates },
        }));
      },

      setLibraryUpdateCallback: (callback: () => void) => {
        // Only update if the callback is actually different to prevent unnecessary re-renders
        const currentCallback = get().onLibraryUpdate;
        if (currentCallback !== callback) {
          set({ onLibraryUpdate: callback });
        }
      },

      clearState: () => {
        set({
          currentDocument: null,
          currentJson: '',
          shareId: '',
          isDirty: false,
          isUploading: false,
          uploadProgress: 0,
        });
      },

      setLastActiveTab: (tab: string) => {
        set({ lastActiveTab: tab });
      },

      setSidebarScrollPosition: (position: number) => {
        set({ sidebarScrollPosition: position });
      },
    }),
    {
      name: 'json-share-backend-storage',
      // Persist UI configuration, anonymous tracking, and current JSON
      partialize: (state) => ({
        viewerConfig: state.viewerConfig,
        anonymousSessionId: state.anonymousSessionId,
        anonymousJsonIds: state.anonymousJsonIds,
        showLibraryHint: state.showLibraryHint,
        currentJson: state.currentJson, // Persist the current JSON content
        lastActiveTab: state.lastActiveTab, // Persist active tab across pages
        sidebarScrollPosition: state.sidebarScrollPosition, // Persist sidebar scroll
      }),
    }
  )
);

// Expose store for testing in development
if (typeof window !== 'undefined' && config.isDevelopment) {
  interface WindowWithBackendStore extends Window {
    __backendStore?: typeof useBackendStore;
  }
  (window as WindowWithBackendStore).__backendStore = useBackendStore;
}

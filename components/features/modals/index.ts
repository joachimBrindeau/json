/**
 * Modal Components
 * Centralized exports for all modal dialogs
 *
 * Primary Modals:
 * - LoginModal: Authentication modal with OAuth providers
 * - ShareModal: Share JSON with social media, tags, visibility settings
 * - EmbedModal: Generate embed code for JSON
 * - ExportModal: Export JSON in various formats
 * - PublishModal: Publish JSON to public library
 *
 * Compatibility Exports:
 * - GlobalLoginModal: Wrapper around LoginModal with useLoginModal hook
 * - UnifiedShareModal: Alias for ShareModal (deprecated, use ShareModal)
 */

// Primary modals (direct exports to avoid nested re-export issues)
export { LoginModal } from './LoginModal';
export { SaveModal } from './SaveModal';
export { ShareModal } from './ShareModal';
export { EmbedModal } from './EmbedModal';
export { ExportModal } from './ExportModal';
export { PublishModal } from './PublishModal';

// Compatibility exports
export { GlobalLoginModal } from './GlobalLoginModal';
export { ShareModal as UnifiedShareModal } from './ShareModal';

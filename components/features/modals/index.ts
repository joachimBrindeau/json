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

// Primary modals
export { LoginModal } from './login-modal';
export { ShareModal } from './share-modal';
export { EmbedModal } from './embed-modal';
export { ExportModal } from './export-modal';
export { PublishModal } from './publish-modal';

// Compatibility exports
export { GlobalLoginModal } from './global-login-modal';
export { ShareModal as UnifiedShareModal } from './share-modal';

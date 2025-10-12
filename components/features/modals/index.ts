/**
 * Modal Components
 * Centralized exports for all modal dialogs
 *
 * Primary Modals:
 * - LoginModal: Authentication modal with OAuth providers
 * - UnifiedShareModal: Share JSON with social media, tags, visibility settings
 * - EmbedModal: Generate embed code for JSON
 * - ExportModal: Export JSON in various formats
 * - PublishModal: Publish JSON to public library
 * - NodeDetailsModal: Show details of selected JSON node
 *
 * Compatibility Exports:
 * - GlobalLoginModal: Wrapper around LoginModal with useLoginModal hook
 * - ShareModal: Alias for UnifiedShareModal (deprecated, use UnifiedShareModal)
 */

// Primary modals
export { LoginModal } from './login-modal';
export { UnifiedShareModal } from './unified-share-modal';
export { EmbedModal } from './embed-modal';
export { ExportModal } from './export-modal';
export { PublishModal } from './publish-modal';
export { NodeDetailsModal } from './node-details-modal';

// Compatibility exports
export { GlobalLoginModal } from './global-login-modal';
export { UnifiedShareModal as ShareModal } from './unified-share-modal';


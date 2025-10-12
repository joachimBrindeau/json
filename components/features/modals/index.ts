/**
 * Modal Components
 * Centralized exports for all modal dialogs
 */

export { EmbedModal } from './embed-modal';
export { ExportModal } from './export-modal';
export { LoginModal } from './login-modal';
export { PublishModal } from './publish-modal';
// ShareModal deprecated - use UnifiedShareModal instead (more features)
export { UnifiedShareModal } from './unified-share-modal';
export { UnifiedShareModal as ShareModal } from './unified-share-modal'; // Alias for backwards compatibility
export { NodeDetailsModal } from './node-details-modal';
// GlobalLoginModal is now just LoginModal with useLoginModal hook
export { GlobalLoginModal } from './global-login-modal';


/**
 * useNodeDetailsModal - Hook for managing node details modal state
 * 
 * Single Responsibility: Modal state management
 */

import { useState, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { extractNodeDetails, NodeDetails } from '../utils/flow-node-details';

export type NodeDetailsModalState = {
  selectedNode: NodeDetails | null;
  isOpen: boolean;
  openModal: (node: Node) => void;
  closeModal: () => void;
};

/**
 * Manage node details modal state and interactions
 */
export const useNodeDetailsModal = (): NodeDetailsModalState => {
  const [selectedNode, setSelectedNode] = useState<NodeDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback((node: Node) => {
    const nodeDetails = extractNodeDetails(node);
    setSelectedNode(nodeDetails);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    selectedNode,
    isOpen,
    openModal,
    closeModal,
  };
};


'use client';

import { create } from 'zustand';

interface LoginModalState {
  open: boolean;
  context: 'library' | 'save' | 'share' | 'expire' | 'general' | 'publish';
  openModal: (context?: LoginModalState['context']) => void;
  closeModal: () => void;
}

export const useLoginModal = create<LoginModalState>((set) => ({
  open: false,
  context: 'general',
  openModal: (context = 'general') => set({ open: true, context }),
  closeModal: () => set({ open: false }),
}));

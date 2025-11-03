'use client';

import { LoginModal } from './LoginModal';
import { useLoginModal } from '@/hooks/use-login-modal';

export function GlobalLoginModal() {
  const { open, context, closeModal } = useLoginModal();

  return <LoginModal open={open} onOpenChange={closeModal} context={context} />;
}

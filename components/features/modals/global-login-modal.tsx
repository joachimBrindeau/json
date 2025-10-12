'use client';

import { LoginModal } from './login-modal';
import { useLoginModal } from '@/hooks/use-login-modal';

export function GlobalLoginModal() {
  const { open, context, closeModal } = useLoginModal();

  return <LoginModal open={open} onOpenChange={closeModal} context={context} />;
}

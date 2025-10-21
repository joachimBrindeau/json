'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { PAGE_TRANSITIONS, TRANSITIONS } from './constants';

interface PageTransitionProps {
  children: React.ReactNode;
  variant?: 'fadeSlide' | 'fade' | 'slideLeft' | 'scale';
  className?: string;
}

/**
 * PageTransition component
 * Wraps page content with smooth enter/exit animations
 */
export function PageTransition({
  children,
  variant = 'fadeSlide',
  className = '',
}: PageTransitionProps) {
  const pathname = usePathname();
  const animation = PAGE_TRANSITIONS[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={animation.initial}
        animate={animation.animate}
        exit={animation.exit}
        transition={TRANSITIONS.smooth}
        className={`h-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * TabTransition component
 * For transitioning between tabs/views within a page
 */
interface TabTransitionProps {
  children: React.ReactNode;
  activeKey: string | number;
  className?: string;
}

export function TabTransition({ children, activeKey, className = '' }: TabTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={TRANSITIONS.smoothFast}
        className={`h-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}


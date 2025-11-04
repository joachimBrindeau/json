'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { INTERACTIONS, TRANSITIONS } from './constants';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'default' | 'subtle' | 'bounce';
  children: React.ReactNode;
}

/**
 * AnimatedButton Component
 * 
 * Low-level animated button component using framer-motion directly.
 * 
 * **Note:** For most use cases, prefer `AnimatedActionButton` from '@/components/ui/AnimatedActionButton'
 * which wraps the Button component and provides better integration with the design system.
 * 
 * **When to use AnimatedButton:**
 * - When you need a raw motion.button element
 * - When you don't need Button component features (variants, styling, etc.)
 * 
 * **When to use AnimatedActionButton:**
 * - For most animated buttons in the application
 * - When you need Button component features (variants, sizes, icons, etc.)
 * - For primary action buttons (Format, Minify, Compare, etc.)
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ variant = 'default', children, ...props }, ref) => {
    const interaction =
      variant === 'subtle'
        ? INTERACTIONS.buttonSubtle
        : variant === 'bounce'
          ? INTERACTIONS.buttonBounce
          : INTERACTIONS.button;

    return (
      <motion.button
        ref={ref}
        whileHover={interaction.whileHover}
        whileTap={interaction.whileTap}
        transition={TRANSITIONS.springFast}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

/**
 * AnimatedDiv component
 * Generic animated container for cards, etc.
 */
interface AnimatedDivProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'card' | 'icon';
  children: React.ReactNode;
}

export const AnimatedDiv = forwardRef<HTMLDivElement, AnimatedDivProps>(
  ({ variant = 'card', children, ...props }, ref) => {
    const interaction = variant === 'icon' ? INTERACTIONS.icon : INTERACTIONS.card;

    return (
      <motion.div
        ref={ref}
        whileHover={interaction.whileHover}
        whileTap={interaction.whileTap}
        transition={TRANSITIONS.spring}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedDiv.displayName = 'AnimatedDiv';

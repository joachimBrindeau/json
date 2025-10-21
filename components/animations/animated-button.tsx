'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { INTERACTIONS, TRANSITIONS } from './constants';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'default' | 'subtle' | 'bounce';
  children: React.ReactNode;
}

/**
 * AnimatedButton component
 * Button with micro-interactions (hover/tap effects)
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ variant = 'default', children, ...props }, ref) => {
    const interaction = variant === 'subtle' 
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


'use client';

import { motion } from 'framer-motion';
import { Button, type ButtonProps } from './button';
import { INTERACTIONS, TRANSITIONS } from '@/components/animations';
import { forwardRef } from 'react';

interface AnimatedActionButtonProps extends ButtonProps {
  /**
   * Animation variant
   * - default: Subtle scale (1.02/0.98)
   * - bounce: More pronounced (1.05/0.95)
   * - subtle: Very minimal (1.01/0.99)
   */
  animationVariant?: 'default' | 'bounce' | 'subtle';
}

/**
 * AnimatedActionButton
 * Button component with micro-interactions for primary actions
 * Use this for important CTAs like "Format", "Minify", "Compare", etc.
 */
export const AnimatedActionButton = forwardRef<HTMLButtonElement, AnimatedActionButtonProps>(
  ({ animationVariant = 'default', children, ...props }, ref) => {
    const interaction =
      animationVariant === 'subtle'
        ? INTERACTIONS.buttonSubtle
        : animationVariant === 'bounce'
          ? INTERACTIONS.buttonBounce
          : INTERACTIONS.button;

    return (
      <motion.div
        whileHover={interaction.whileHover}
        whileTap={interaction.whileTap}
        transition={TRANSITIONS.springFast}
        style={{ display: 'inline-block' }}
      >
        <Button ref={ref} {...props}>
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedActionButton.displayName = 'AnimatedActionButton';

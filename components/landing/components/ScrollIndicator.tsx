'use client';

import { motion } from 'framer-motion';

interface ScrollIndicatorProps {
  reducedMotion?: boolean;
}

/**
 * ScrollIndicator - Animated scroll arrow for hero section
 * Bobs continuously to indicate scrollable content.
 */
export function ScrollIndicator({ reducedMotion }: ScrollIndicatorProps) {
  return (
    <motion.div
      className="absolute bottom-12 left-1/2 -translate-x-1/2"
      animate={reducedMotion ? {} : { y: [0, 8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
        <rect
          x="1"
          y="1"
          width="18"
          height="26"
          rx="9"
          stroke="#525252"
          strokeWidth="1.5"
        />
        <motion.circle
          cx="10"
          cy="8"
          r="2"
          fill="#525252"
          animate={reducedMotion ? {} : { cy: [8, 16, 8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  );
}

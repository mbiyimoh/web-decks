'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GOLD } from '@/lib/design-tokens';

interface SectionLabelProps {
  number: string;
  title: string;
  className?: string;
  center?: boolean;
  reducedMotion?: boolean;
}

/**
 * SectionLabel - "01 — SECTION NAME" label component
 * Gold color, mono font, uppercase with letter-spacing.
 */
export function SectionLabel({
  number,
  title,
  className = '',
  center = false,
  reducedMotion = false,
}: SectionLabelProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: reducedMotion ? 0 : 16 }}
      transition={{ duration: reducedMotion ? 0 : 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className={`text-xs font-mono tracking-[0.2em] uppercase mb-6 ${
        center ? 'text-center' : ''
      } ${className}`}
      style={{ color: GOLD }}
    >
      {number} — {title}
    </motion.p>
  );
}

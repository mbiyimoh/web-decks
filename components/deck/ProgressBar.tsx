'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

interface ProgressBarProps {
  color?: string;
}

export function ProgressBar({ color = '#d4a54a' }: ProgressBarProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 origin-left z-50"
      style={{ scaleX, backgroundColor: color }}
    />
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GOLD, BG_PRIMARY } from '@/lib/design-tokens';

interface StickyCtaBarProps {
  show: boolean;
}

/**
 * StickyCtaBar - Mobile sticky CTA bar
 * Appears after scrolling past hero, fixed to bottom of viewport.
 * Only visible on mobile (md:hidden).
 */
export function StickyCtaBar({ show }: StickyCtaBarProps) {
  const scrollToCta = () => {
    document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden"
          style={{ backgroundColor: `${BG_PRIMARY}E6` }} // 90% opacity
        >
          <button
            onClick={scrollToCta}
            className="w-full py-4 rounded-lg font-semibold text-base transition-transform active:scale-[0.98]"
            style={{ backgroundColor: GOLD, color: BG_PRIMARY }}
            aria-label="Navigate to contact section"
          >
            Work with us &rarr;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

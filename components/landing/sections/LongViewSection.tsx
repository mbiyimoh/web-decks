'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GOLD, BG_PRIMARY, BG_SURFACE, BORDER_CARD } from '@/lib/design-tokens';
import { SectionLabel } from '../components/SectionLabel';

interface LongViewSectionProps {
  reducedMotion?: boolean;
}

export function LongViewSection({ reducedMotion }: LongViewSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const lineInView = useInView(lineRef, { once: true, margin: '-40px' });

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 20 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : delay },
  });

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 lg:py-40 px-6 md:px-12 lg:px-16"
      style={{
        background: `linear-gradient(180deg, ${BG_PRIMARY} 0%, #080808 50%, ${BG_PRIMARY} 100%)`,
      }}
    >
      <div className="max-w-3xl mx-auto">
        <SectionLabel
          number="07"
          title="The Compounding Effect"
          reducedMotion={reducedMotion}
        />

        <motion.h2
          {...fadeUp(0.1)}
          className="text-2xl sm:text-3xl md:text-4xl font-display leading-snug mb-8 md:mb-10"
        >
          The longer you work with our tools, the more they feel like an extension of your own thinking.
        </motion.h2>

        {/* Image placeholder */}
        <motion.div
          {...fadeUp(0.15)}
          className="mb-8 md:mb-10 rounded-xl overflow-hidden"
          style={{
            backgroundColor: BG_SURFACE,
            border: `1px solid ${BORDER_CARD}`,
          }}
        >
          <div className="aspect-[16/9] flex items-center justify-center">
            <p className="text-zinc-600 text-sm font-mono">
              [compounding context visualization]
            </p>
          </div>
        </motion.div>

        <motion.p
          {...fadeUp(0.2)}
          className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6 md:mb-8 font-body"
        >
          Most AI tools reset every session. Ours accumulate — your strategy sharpens, your voice clarifies, your frameworks get more precise.
        </motion.p>

        <motion.p
          {...fadeUp(0.3)}
          className="text-base md:text-lg text-zinc-300 leading-relaxed mb-10 md:mb-14 font-body"
        >
          No extra effort required. You&apos;re just doing your work. The system learns from that.
        </motion.p>

        {/* Climactic statement */}
        <motion.div {...fadeUp(0.4)}>
          <p
            className="text-xl sm:text-2xl md:text-3xl font-display"
            style={{ color: GOLD }}
          >
            A moat that gets deeper every time you work.
          </p>
          <p
            className="text-lg sm:text-xl md:text-2xl font-display text-zinc-400 mt-2"
          >
            Without you even thinking about it.
          </p>
          {/* Animated gold underline */}
          <div className="flex mt-4" ref={lineRef}>
            <motion.div
              className="h-px rounded-full"
              style={{ backgroundColor: GOLD }}
              initial={{ width: 0 }}
              animate={lineInView ? { width: 80 } : { width: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.8,
                delay: reducedMotion ? 0 : 0.3,
                ease: [0.25, 0.4, 0.25, 1],
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

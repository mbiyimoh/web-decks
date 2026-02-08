'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GOLD, BG_SURFACE } from '@/lib/design-tokens';
import { SectionLabel } from '../components/SectionLabel';

interface TwoThingsSectionProps {
  reducedMotion?: boolean;
}

export function TwoThingsSection({ reducedMotion }: TwoThingsSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 24 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : delay },
  });

  return (
    <section ref={ref} className="py-20 md:py-28 lg:py-36 px-6 md:px-12 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <SectionLabel
          number="03"
          title="The Playbook"
          reducedMotion={reducedMotion}
        />

        <motion.p
          {...fadeUp(0.1)}
          className="text-lg md:text-xl lg:text-2xl text-zinc-400 mb-10 md:mb-12 font-display"
        >
          We build AI systems that do two things simultaneously.
        </motion.p>

        {/* Side-by-side layout on desktop, stacked on mobile */}
        <motion.div
          {...fadeUp(0.2)}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-0 items-stretch mb-12 md:mb-16"
        >
          {/* Thing 1: Kill the drudgery */}
          <div
            className="p-6 md:p-8 rounded-2xl md:rounded-r-none"
            style={{
              backgroundColor: `${BG_SURFACE}80`,
              border: '1px solid #1e1e1e',
            }}
          >
            <h3 className="text-xl sm:text-2xl md:text-3xl font-display text-white mb-4">
              Kill the drudgery.
            </h3>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-body">
              Automate the reformatting, re-explaining, and context-reloading.
              Keep the creative work.
            </p>
          </div>

          {/* Plus sign divider */}
          <div className="flex items-center justify-center py-2 md:py-0 md:px-6">
            <span
              className="text-3xl md:text-4xl font-light"
              style={{ color: GOLD }}
            >
              +
            </span>
          </div>

          {/* Thing 2: Make your thinking show up */}
          <div
            className="p-6 md:p-8 rounded-2xl md:rounded-l-none"
            style={{
              backgroundColor: `${BG_SURFACE}80`,
              border: '1px solid #1e1e1e',
            }}
          >
            <h3 className="text-xl sm:text-2xl md:text-3xl font-display text-white mb-4">
              Make your thinking show up everywhere.
            </h3>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-body">
              Your voice, strategy, and frameworks — injected into every
              workflow automatically.
            </p>
          </div>
        </motion.div>

        {/* Closing statement */}
        <motion.p
          {...fadeUp(0.4)}
          className="text-lg md:text-xl lg:text-2xl text-zinc-300 leading-relaxed max-w-2xl"
        >
          The result: AI that doesn&apos;t just execute tasks faster.
        </motion.p>
        <motion.p
          {...fadeUp(0.45)}
          className="text-lg md:text-xl lg:text-2xl text-zinc-300 leading-relaxed max-w-2xl mt-3"
        >
          AI that executes them{' '}
          <em style={{ color: GOLD, fontStyle: 'italic' }}>the way you would</em>{' '}
          — if you had unlimited time and perfect memory.
        </motion.p>
      </div>
    </section>
  );
}

'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { GOLD, BG_PRIMARY, BG_ELEVATED } from '@/lib/design-tokens';

interface CTASectionProps {
  reducedMotion?: boolean;
}

const springSnappy = { type: 'spring', stiffness: 400, damping: 20 };

export function CTASection({ reducedMotion }: CTASectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 20 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : delay },
  });

  return (
    <section
      ref={ref}
      id="cta"
      className="py-20 md:py-28 lg:py-32 px-6 md:px-12 lg:px-16 relative overflow-hidden"
    >
      {/* Gold glow background */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 300,
          background: `radial-gradient(ellipse, ${GOLD}10 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />

      <div className="max-w-xl mx-auto text-center relative z-10">
        <motion.h2
          {...fadeUp(0)}
          className="text-2xl sm:text-3xl md:text-4xl font-display mb-4 md:mb-6"
        >
          Let&apos;s build something <span style={{ color: GOLD }}>brilliant</span>.
        </motion.h2>

        <motion.p
          {...fadeUp(0.1)}
          className="text-base md:text-lg text-zinc-400 leading-relaxed mb-3 md:mb-4 font-body"
        >
          Tell us who you are, how you think, and what you&apos;re trying to accomplish.
        </motion.p>

        <motion.p
          {...fadeUp(0.12)}
          className="text-base md:text-lg text-zinc-400 leading-relaxed mb-3 md:mb-4 font-body"
        >
          Our Clarity Canvas walks you through it — so when we talk, we&apos;re already caught up.
        </motion.p>

        <motion.p
          {...fadeUp(0.15)}
          className="text-sm md:text-base text-zinc-500 mb-8 md:mb-10 font-body"
        >
          No pitch. No pressure. Just a head start.
        </motion.p>

        <motion.div {...fadeUp(0.2)} className="flex flex-col items-center gap-4">
          {/* Primary CTA */}
          <motion.div
            whileHover={reducedMotion ? {} : { scale: 1.02 }}
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
            transition={springSnappy}
          >
            <Link
              href="/clarity-canvas"
              className="inline-block px-8 py-4 rounded-xl text-base font-semibold transition-colors min-h-[56px] min-w-[240px]"
              style={{ backgroundColor: GOLD, color: BG_PRIMARY }}
            >
              Start building your Canvas &rarr;
            </Link>
          </motion.div>

          {/* Secondary CTA */}
          <motion.div
            whileHover={
              reducedMotion
                ? {}
                : {
                    borderColor: '#3f3f46',
                    backgroundColor: `${BG_ELEVATED}80`,
                  }
            }
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
            className="transition-all"
          >
            <Link
              href="/contact"
              className="inline-block px-6 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors min-h-[48px]"
              style={{ border: '1px solid #27272a' }}
            >
              Wanna chat first? Schedule a call
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

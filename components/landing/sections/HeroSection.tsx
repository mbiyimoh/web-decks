'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { GOLD } from '@/lib/design-tokens';
import { G } from '../components/GoldHighlight';
import { ScrollIndicator } from '../components/ScrollIndicator';

interface HeroSectionProps {
  reducedMotion?: boolean;
}

/**
 * HeroSection - Full-viewport hero with headline and body
 * Features staggered reveal animation and parallax effects.
 */
export function HeroSection({ reducedMotion }: HeroSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 60]);

  const transition = (delay: number) => ({
    duration: reducedMotion ? 0 : 0.7,
    delay: reducedMotion ? 0 : delay,
    ease: [0.25, 0.4, 0.25, 1],
  });

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 40 },
    animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: reducedMotion ? 0 : 40 },
    transition: transition(delay),
  });

  return (
    <motion.section
      ref={ref}
      className="min-h-screen flex flex-col justify-center items-center px-6 md:px-16 pt-20 relative overflow-hidden"
      style={reducedMotion ? {} : { opacity: heroOpacity, y: heroY }}
    >
      <div className="relative z-10 max-w-3xl text-center">
        {/* Headline - staggered reveal */}
        <motion.h1
          className="text-[32px] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display leading-[1.1] mb-6 md:mb-8"
          {...fadeUp(0.1)}
        >
          AI can <span className="text-zinc-500">reproduce</span>
          <br />
          almost anything.
        </motion.h1>

        <motion.h2
          className="text-[32px] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display leading-[1.1] mb-8"
          {...fadeUp(0.2)}
        >
          Except <span style={{ color: GOLD }}>the thinking</span>
          <br />
          of the operator behind it.
        </motion.h2>

        {/* Body text - broken into digestible chunks */}
        <motion.div
          className="text-base md:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-body"
          {...fadeUp(0.5)}
        >
          <p>
            We build systems that learn <span style={{ color: GOLD }}>YOU</span>.
          </p>
          <p className="mt-1">
            <strong>Your</strong> judgment. <strong>Your</strong> strategy. <strong>Your</strong> goals.
          </p>
          <p className="mt-4">
            <strong><em className="italic">That&apos;s</em></strong> the input that makes AI dangerous.
          </p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator reducedMotion={reducedMotion} />
    </motion.section>
  );
}

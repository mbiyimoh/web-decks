'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
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
        {/* Headline - staggered reveal, text-balance prevents word widows */}
        <motion.h1
          className="text-[32px] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display leading-[1.1] mb-8 text-balance"
          {...fadeUp(0.1)}
        >
          AI gave everyone access to{' '}
          <span className="whitespace-nowrap">great answers.</span>
          <br />
          <span className="text-zinc-500">The advantage is now in</span>
          <br />
          who asks better questions.
        </motion.h1>

        {/* Body text - broken into digestible chunks */}
        <motion.div
          className="text-base md:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-body space-y-4"
          {...fadeUp(0.5)}
        >
          <p>
            We build systems that learn how <G>you</G> think.
          </p>
          <p>
            <G>Your</G> voice. <G>Your</G> judgment. <G>Your</G> strategy.
          </p>
          <p>
            That&apos;s the input that makes AI dangerous.
          </p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator reducedMotion={reducedMotion} />
    </motion.section>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { GOLD, BG_SURFACE } from '@/lib/design-tokens';
import { SectionLabel } from '../components/SectionLabel';

interface DrudgerySectionProps {
  reducedMotion?: boolean;
  isDesktop?: boolean;
}

// Mobile: show 6 items, Desktop: show all 12
const drudgeryItemsMobile = [
  'Reviewing meeting notes hours later trying to remember what was actually said on your morning call...',
  "Manually logging to-dos and status updates in your project management tools one by one — when you remember to, that is",
  "Posting a single tweet for your product launch because that's all your team has bandwidth for",
  "Copy-pasting the same company context into yet another AI prompt because the tool has no memory of who you are",
  "Explaining your strategy again because the person you're talking to wasn't in the room",
  'Formatting the same data differently for every stakeholder who needs to see it',
];

const drudgeryItemsDesktop = [
  ...drudgeryItemsMobile,
  "Digging through contacts and old emails trying to figure out who you've connected with in the past who could actually help",
  "Re-explaining your brand voice and positioning every time you hand off a brief to a contractor or team member",
  'Scanning your calendar at 6pm trying to reconstruct what you actually accomplished today',
  'Rebuilding the same spreadsheet analysis you\'ve already done three times, just with slightly different inputs',
  "Drafting a proposal from scratch when 80% of it is the same strategic framing you've already articulated a dozen times",
  "Staring at a blank content calendar knowing exactly what you want to say but lacking the time to produce it",
];

export function DrudgerySection({ reducedMotion, isDesktop }: DrudgerySectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const visibleCount = 3;

  const items = isDesktop ? drudgeryItemsDesktop : drudgeryItemsMobile;
  const cycleSpeed = isDesktop ? 4500 : 6000; // Slower on mobile (50% slower than before)

  // Reset activeIndex if it's out of bounds (e.g., when switching between mobile/desktop)
  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items.length, activeIndex]);

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused || reducedMotion) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, cycleSpeed);
    return () => clearInterval(timer);
  }, [isPaused, reducedMotion, items.length, cycleSpeed]);

  const getVisibleItems = () => {
    const visible = [];
    for (let i = 0; i < visibleCount; i++) {
      visible.push(items[(activeIndex + i) % items.length]);
    }
    return visible;
  };

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 24 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : delay },
  });

  return (
    <section ref={ref} className="py-16 md:py-24 lg:py-32 px-6 md:px-12 lg:px-16">
      <div className="max-w-5xl mx-auto">
        {/* Desktop: Split layout, Mobile: Stacked */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Left side: Text content */}
          <div className="mb-8 lg:mb-0">
            <SectionLabel number="06" title="The Daily Drag" reducedMotion={reducedMotion} />

            <motion.h2
              {...fadeUp(0.1)}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display leading-[1.15] mb-4"
            >
              You&apos;ve already done the hard thinking.
              <br />
              <span className="text-zinc-500">
                You just keep having to redo it.
              </span>
            </motion.h2>

            <motion.div
              {...fadeUp(0.2)}
              className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl font-body space-y-3"
            >
              <p>You&apos;ve built frameworks that work. You know your customers.</p>
              <p>But somehow most of your day is still spent on the intellectual drudgery between the idea and the thing:</p>
            </motion.div>
          </div>

          {/* Right side: Carousel */}
          <motion.div
            {...fadeUp(0.3)}
            className="relative rounded-2xl overflow-hidden"
            style={{ backgroundColor: BG_SURFACE, border: '1px solid #1e1e1e' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Top fade */}
            <div
              className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none"
              style={{ background: `linear-gradient(${BG_SURFACE}, transparent)` }}
            />
            {/* Bottom fade */}
            <div
              className="absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-none"
              style={{ background: `linear-gradient(transparent, ${BG_SURFACE})` }}
            />

            <div className="py-8 px-5 md:px-8 space-y-0 min-h-[280px]">
              <AnimatePresence mode="popLayout">
                {getVisibleItems().map((item, i) => (
                  <motion.div
                    key={`${activeIndex}-${i}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: i === 1 ? 1 : 0.4, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                            mass: 0.8,
                          }
                    }
                    className="py-4"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: GOLD }}
                      />
                      <p
                        className="text-sm md:text-base leading-relaxed font-body"
                        style={{
                          color: i === 1 ? '#a1a1aa' : '#52525b',
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: i === activeIndex ? GOLD : '#27272a',
                  }}
                  aria-label={`Go to item ${i + 1}`}
                />
              ))}
            </div>

            {/* Pause indicator */}
            {isPaused && (
              <div className="absolute bottom-3 right-4 text-[10px] text-zinc-600 uppercase tracking-wider font-mono">
                Paused
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

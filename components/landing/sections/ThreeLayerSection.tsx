'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GOLD, BG_SURFACE, BORDER_CARD, TEXT_SECONDARY } from '@/lib/design-tokens';
import { SectionLabel } from '../components/SectionLabel';

interface ThreeLayerSectionProps {
  reducedMotion?: boolean;
}

const layers = [
  {
    num: '01',
    name: 'Your Context Layer',
    desc: 'How you think, who your customers are, how you make decisions.',
    accent: true,
  },
  {
    num: '02',
    name: 'Data Connections Layer',
    desc: 'Clean integrations to your systems. One source of truth that talks to your context.',
    accent: false,
  },
  {
    num: '03',
    name: 'AI Apps Layer',
    desc: 'Applications that execute tasks your way, drawing on everything below.',
    accent: false,
  },
];

export function ThreeLayerSection({ reducedMotion }: ThreeLayerSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 24 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : delay },
  });

  // Render bottom-up visually (foundation at bottom)
  const reversedLayers = [...layers].reverse();

  return (
    <section ref={ref} className="py-16 md:py-24 lg:py-32 px-6 md:px-12 lg:px-16">
      <div className="max-w-3xl mx-auto">
        <SectionLabel number="05" title="The 33 Stack" reducedMotion={reducedMotion} />

        <motion.h2
          {...fadeUp(0.1)}
          className="text-2xl sm:text-3xl md:text-4xl font-display mb-10 md:mb-14"
        >
          Every system we build sits on three layers.
        </motion.h2>

        {/* Offset stacking visualization */}
        <div className="relative">
          {reversedLayers.map((layer, i) => {
            // Calculate offset: top layer has most offset (narrowest), bottom layer has least (widest)
            const offsetIndex = layers.length - 1 - i;
            const horizontalOffset = offsetIndex * 24; // 24px offset per layer on each side
            const shadowDepth = (layers.length - offsetIndex) * 4;

            return (
              <motion.div
                key={layer.num}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
                animate={
                  isInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: reducedMotion ? 0 : 20 }
                }
                transition={{
                  duration: reducedMotion ? 0 : 0.6,
                  delay: reducedMotion ? 0 : 0.2 + i * 0.15,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
                className="rounded-xl p-5 md:p-6 relative mb-3"
                style={{
                  marginLeft: `${horizontalOffset}px`,
                  marginRight: `${horizontalOffset}px`,
                  backgroundColor: BG_SURFACE,
                  border: layer.accent
                    ? `1px solid ${GOLD}40`
                    : `1px solid ${BORDER_CARD}`,
                  boxShadow: layer.accent
                    ? `0 ${shadowDepth}px ${shadowDepth * 3}px rgba(0,0,0,0.4), 0 0 80px ${GOLD}15, 0 0 120px ${GOLD}08`
                    : `0 ${shadowDepth}px ${shadowDepth * 3}px rgba(0,0,0,0.3)`,
                }}
              >
                <div className="flex items-start gap-4 md:gap-5">
                  <span
                    className="text-xs font-mono mt-1 shrink-0"
                    style={{ color: layer.accent ? GOLD : TEXT_SECONDARY }}
                  >
                    {layer.num}
                  </span>
                  <div>
                    <h3 className="text-base md:text-lg font-display text-white mb-1">
                      {layer.name}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed font-body">
                      {layer.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          {...fadeUp(0.7)}
          className="text-base md:text-lg text-zinc-400 mt-10 md:mt-12 font-body"
        >
          Because the foundation is there, your team builds the next ones themselves.
        </motion.p>
      </div>
    </section>
  );
}

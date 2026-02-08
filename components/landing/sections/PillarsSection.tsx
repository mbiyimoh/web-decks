'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GOLD, BG_SURFACE } from '@/lib/design-tokens';
import { SectionLabel } from '../components/SectionLabel';

interface PillarsSectionProps {
  reducedMotion?: boolean;
}

const pillars = [
  {
    number: '01',
    title: 'AI CONSULTING & UPSKILLING',
    description:
      "Engagements that ship real outcomes AND teach your team to think and build AI-first — so you're more capable when we leave than when we arrived.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
        <path d="M8 12a4 4 0 0 1 8 0" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'DEV FIRM + "CO-FOUNDER AS A SERVICE"',
    description:
      "For founders with strong vision but limited build capacity. We're your technical co-founder from zero to one — strategy, design, development, and AI integration.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'TOOLS THAT LEARN YOU',
    titleItalic: 'YOU',
    description:
      'The longer you use them, the more they feel like an extension of your own thinking. Included with every engagement.',
    badge: 'INCLUDED',
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

export function PillarsSection({ reducedMotion }: PillarsSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.12,
        delayChildren: reducedMotion ? 0 : 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.6, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  return (
    <section ref={ref} className="py-16 md:py-24 lg:py-32 px-6 md:px-12 lg:px-16">
      <div className="max-w-5xl mx-auto">
        <SectionLabel number="01" title="Our Three Goals" reducedMotion={reducedMotion} />

        {/* Three things we do - numbered for scannability */}
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reducedMotion ? 0 : 0.7, delay: reducedMotion ? 0 : 0.1 }}
          className="mb-16 md:mb-20"
        >
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="text-zinc-600 font-mono text-sm mt-1">1.</span>
              <span className="text-lg md:text-xl lg:text-2xl font-display text-white">
                Capture your unique context — who you are, your goals, how you think and operate.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-zinc-600 font-mono text-sm mt-1">2.</span>
              <span className="text-lg md:text-xl lg:text-2xl font-display text-white">
                Ensure that context is injected into every workflow thoughtfully and seamlessly.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-zinc-600 font-mono text-sm mt-1">3.</span>
              <span className="text-lg md:text-xl lg:text-2xl font-display text-white">
                Eliminate the intellectual drudgery from your workflows so you can focus on the creative problem-solving you do best.
              </span>
            </li>
          </ol>
        </motion.div>

        <SectionLabel number="02" title="Three Ways In" reducedMotion={reducedMotion} />

        <motion.p
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.2 }}
          className="text-zinc-400 text-base md:text-lg mb-10 md:mb-12"
        >
          We build with clients in three primary ways:
        </motion.p>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
        >
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              variants={item}
              className="rounded-2xl p-6 md:p-7 h-full flex flex-col relative group cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: BG_SURFACE,
                border: '1px solid #27272a',
              }}
              whileHover={
                reducedMotion
                  ? {}
                  : {
                      y: -4,
                      borderColor: `${GOLD}50`,
                      boxShadow: `0 0 40px ${GOLD}0a`,
                    }
              }
            >
              {pillar.badge && (
                <div
                  className="absolute top-4 right-4 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${GOLD}12`,
                    color: GOLD,
                    border: `1px solid ${GOLD}20`,
                  }}
                >
                  {pillar.badge}
                </div>
              )}
              <div className="mb-4 md:mb-5 opacity-80">{pillar.icon}</div>
              <h3 className="text-base md:text-lg font-display text-white mb-2 md:mb-3 leading-snug">
                {pillar.titleItalic
                  ? pillar.title.replace(pillar.titleItalic, '').trim() + ' '
                  : pillar.title}
                {pillar.titleItalic && <em className="italic">{pillar.titleItalic}</em>}
              </h3>
              <div
                className="w-8 h-px mb-3"
                style={{ backgroundColor: `${GOLD}40` }}
              />
              <p className="text-sm text-zinc-400 leading-relaxed flex-1 font-body">
                {pillar.description}
              </p>
              <div
                className="mt-4 md:mt-5 flex items-center gap-1.5 text-sm group-hover:gap-2.5 transition-all"
                style={{ color: GOLD }}
              >
                <span>Learn more</span>
                <span className="transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

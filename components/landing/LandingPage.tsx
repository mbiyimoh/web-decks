'use client';

import { useState, useEffect } from 'react';
import { useReducedMotion, useScroll } from 'framer-motion';
import { motion } from 'framer-motion';
import { BG_PRIMARY, GOLD } from '@/lib/design-tokens';

// Layout components
import { Nav } from './Nav';
import { StickyCtaBar } from './StickyCtaBar';

// Effects
import { GoldGlow } from './effects/GoldGlow';
import { FloatingOrbs } from './effects/FloatingOrbs';
import { ParticleCanvas } from './effects/ParticleCanvas';

// Content sections
import { HeroSection } from './sections/HeroSection';
import { PillarsSection } from './sections/PillarsSection';
import { DrudgerySection } from './sections/DrudgerySection';
import { TwoThingsSection } from './sections/TwoThingsSection';
import { ThreeLayerSection } from './sections/ThreeLayerSection';
import { LongViewSection } from './sections/LongViewSection';
import { ProductsPreviewSection } from './sections/ProductsPreviewSection';
import { CTASection } from './sections/CTASection';

/**
 * ProgressBar - Scroll progress indicator at top of page
 */
function ProgressBar() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
      style={{ scaleX: scrollYProgress, backgroundColor: GOLD }}
    />
  );
}

/**
 * LandingPage - Main orchestrator component for the 33 Strategies homepage
 *
 * Features:
 * - Mobile-first design (375px baseline)
 * - Progressive enhancement for desktop (particles, hover states)
 * - Respects prefers-reduced-motion
 * - Sticky CTA bar on mobile after scrolling past hero
 */
export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect viewport size for progressive enhancement
  useEffect(() => {
    const checkViewport = () => setIsDesktop(window.innerWidth >= 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Show sticky bar after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden text-white"
      style={{ backgroundColor: BG_PRIMARY }}
    >
      {/* Global styles */}
      <style jsx global>{`
        ::selection {
          background: ${GOLD}30;
          color: white;
        }

        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
      `}</style>

      {/* Progress bar */}
      <ProgressBar />

      {/* Navigation */}
      <Nav />

      {/* Background effects - mobile baseline (CSS only) */}
      <GoldGlow />
      <FloatingOrbs reducedMotion={prefersReducedMotion} />

      {/* Desktop enhancement: Canvas particles */}
      {isDesktop && !prefersReducedMotion && <ParticleCanvas />}

      {/* Content sections */}
      <main className="relative z-10" aria-label="33 Strategies landing page content">
        <HeroSection reducedMotion={prefersReducedMotion} />
        <PillarsSection reducedMotion={prefersReducedMotion} />
        <TwoThingsSection reducedMotion={prefersReducedMotion} />
        <ProductsPreviewSection reducedMotion={prefersReducedMotion} />
        <ThreeLayerSection reducedMotion={prefersReducedMotion} />
        <DrudgerySection
          reducedMotion={prefersReducedMotion}
          isDesktop={isDesktop}
        />
        <LongViewSection reducedMotion={prefersReducedMotion} />
        <CTASection reducedMotion={prefersReducedMotion} />
      </main>

      {/* Sticky CTA bar for mobile */}
      <StickyCtaBar show={showStickyBar} />

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center border-t border-zinc-900">
        <div
          className="h-px mb-8"
          style={{
            background: `linear-gradient(90deg, transparent, ${GOLD}20, transparent)`,
          }}
        />
        <p className="text-zinc-700 text-xs font-body">
          &copy; 2026 33 Strategies
        </p>
      </footer>
    </div>
  );
}

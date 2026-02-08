# 33 Strategies Landing Page Redesign

## Status
**Draft** — Ready for Review

## Authors
- Claude Code
- Date: 2026-02-07

## Overview

Transform the existing landing page from a "coming soon" placeholder into a full-featured, mobile-first marketing page that communicates the 33 Strategies value proposition through premium visual design, spatial layouts, and brand-signature animations.

The current `LandingPage.tsx` displays only a wordmark with a "Coming Soon" badge. This redesign replaces it with a complete narrative experience featuring:
- 8 distinct sections with unique layouts
- Mobile-first responsive design (375px baseline)
- CSS and canvas-based particle/glow effects
- Sticky mobile CTA for conversion
- Product suite preview

## Background/Problem Statement

### Current State
The landing page at `33strategies.ai` shows a placeholder with:
- 33 wordmark with geometric animation
- "Coming Soon" badge
- Contact email

### The Problem
1. **No value proposition** — Visitors don't learn what 33 Strategies does
2. **No conversion path** — No CTA to Clarity Canvas or contact form
3. **Not mobile-optimized** — Current design is desktop-centric
4. **Missing brand identity** — The premium, editorial aesthetic isn't expressed

### Why Now
- Products are live (BetterContacts, TalkingDocs, MarketingMachine)
- Clarity Canvas is ready for public intake
- Traffic is expected primarily from mobile devices (75%+)

## Goals

- **Primary:** Communicate the 33 Strategies value proposition in a compelling, premium way
- Convert visitors to either Clarity Canvas or contact form
- Showcase the product suite with clear CTAs to `/products`
- Achieve FCP < 1.5s and LCP < 2.0s on 4G mobile
- Support `prefers-reduced-motion` for accessibility
- Work flawlessly on mobile (375px+) as the baseline experience

## Non-Goals

- **Not** changing the written copy (content is finalized)
- **Not** reordering the narrative sections
- **Not** building new products page features
- **Not** implementing analytics or tracking
- **Not** A/B testing infrastructure
- **Not** CMS or content editing capabilities

## Technical Dependencies

### External Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| framer-motion | ^11.0.0 | Animation system (already installed) |
| next | 14.x | Framework (already installed) |
| tailwindcss | ^3.x | Styling (already installed) |

### Internal Dependencies
| Module | Purpose |
|--------|---------|
| `lib/design-tokens.ts` | Brand colors (GOLD, BG_PRIMARY, etc.) |
| `lib/products.ts` | Product data for preview section |
| `components/deck/RevealText.tsx` | Scroll-triggered reveal animations |
| `components/deck/SectionLabel.tsx` | Gold section labels |
| `components/deck/Card.tsx` | Glass card component |

### Version Requirements
- Node.js 18+
- React 18+
- Next.js 14+ (App Router)

## Detailed Design

### CTA URLs

| CTA | Target URL | Notes |
|-----|------------|-------|
| Primary (Clarity Canvas) | `/clarity-canvas` | Existing route |
| Secondary (Contact) | `/contact` | Existing route |
| Products Preview | `/products` | Existing route |
| Product cards | External URLs or `/contact?product={id}` | Per `lib/products.ts` |

### Architecture Overview

```
app/
  page.tsx                          # Imports LandingPage (no changes needed)

components/
  landing/
    LandingPage.tsx                 # Main orchestrator component
    Nav.tsx                         # Navigation with hide-on-scroll
    StickyCtaBar.tsx                # Mobile sticky CTA bar
    effects/
      GoldGlow.tsx                  # CSS breathing glow (mobile baseline)
      FloatingOrbs.tsx              # CSS floating orbs (mobile baseline)
      ParticleCanvas.tsx            # Canvas particles (desktop enhancement)
      useParticles.ts               # Particle logic hook
      # Note: Use useReducedMotion from framer-motion directly
    sections/
      HeroSection.tsx               # Full viewport hero
      PillarsSection.tsx            # Three pillars (What We Do)
      DrudgerySection.tsx           # Problem carousel
      TwoThingsSection.tsx          # The Promise
      ThreeLayerSection.tsx         # How It Works
      LongViewSection.tsx           # Vision section
      ProductsPreviewSection.tsx    # Product showcase
      CTASection.tsx                # Final conversion section
    components/
      GlassCard.tsx                 # Enhanced Card with glass effect
      GoldHighlight.tsx             # "You/your" gold text wrapper
      AnimatedDivider.tsx           # Gold line animations
      DrudgeryCarousel.tsx          # Carousel with auto-advance
      ProductMiniCard.tsx           # Compact product card
      ScrollIndicator.tsx           # Animated scroll arrow
```

### Component Specifications

#### 1. LandingPage.tsx (Main Orchestrator)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { HeroSection } from './sections/HeroSection';
import { PillarsSection } from './sections/PillarsSection';
import { DrudgerySection } from './sections/DrudgerySection';
import { TwoThingsSection } from './sections/TwoThingsSection';
import { ThreeLayerSection } from './sections/ThreeLayerSection';
import { LongViewSection } from './sections/LongViewSection';
import { ProductsPreviewSection } from './sections/ProductsPreviewSection';
import { CTASection } from './sections/CTASection';
import { StickyCtaBar } from './StickyCtaBar';
import { GoldGlow } from './effects/GoldGlow';
import { FloatingOrbs } from './effects/FloatingOrbs';
import { ParticleCanvas } from './effects/ParticleCanvas';
import { BG_PRIMARY } from '@/lib/design-tokens';

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
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
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: BG_PRIMARY }}
    >
      {/* Background effects - mobile baseline */}
      <GoldGlow />
      <FloatingOrbs reducedMotion={prefersReducedMotion} />

      {/* Desktop enhancement: Canvas particles */}
      {isDesktop && !prefersReducedMotion && <ParticleCanvas />}

      {/* Content sections */}
      <main className="relative z-10">
        <HeroSection reducedMotion={prefersReducedMotion} />
        <PillarsSection reducedMotion={prefersReducedMotion} />
        <DrudgerySection reducedMotion={prefersReducedMotion} isDesktop={isDesktop} />
        <TwoThingsSection reducedMotion={prefersReducedMotion} />
        <ThreeLayerSection reducedMotion={prefersReducedMotion} />
        <LongViewSection reducedMotion={prefersReducedMotion} />
        <ProductsPreviewSection reducedMotion={prefersReducedMotion} />
        <CTASection id="cta" reducedMotion={prefersReducedMotion} />
      </main>

      {/* Sticky CTA bar for mobile */}
      <StickyCtaBar show={showStickyBar} />

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center">
        <p className="text-zinc-700 text-xs font-body">
          &copy; 2026 33 Strategies
        </p>
      </footer>
    </div>
  );
}
```

#### 2. StickyCtaBar.tsx

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GOLD, BG_PRIMARY } from '@/lib/design-tokens';

interface StickyCtaBarProps {
  show: boolean;
}

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
```

#### 3. Effects System

**GoldGlow.tsx** (CSS baseline):
```tsx
'use client';

export function GoldGlow() {
  return (
    <>
      {/* Hero section glow */}
      <div
        className="absolute top-[30vh] left-1/2 -translate-x-1/2 w-[300px] h-[200px] md:w-[500px] md:h-[350px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(212,165,74,0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'breathe 5s ease-in-out infinite',
        }}
      />

      {/* CTA section glow */}
      <div
        className="absolute bottom-[20vh] left-1/2 -translate-x-1/2 w-[350px] h-[250px] md:w-[600px] md:h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(212,165,74,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'breathe 6s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: translate(-50%, 0) scale(1); }
          50% { opacity: 1; transform: translate(-50%, 0) scale(1.08); }
        }

        @media (prefers-reduced-motion: reduce) {
          div { animation: none !important; }
        }
      `}</style>
    </>
  );
}
```

**FloatingOrbs.tsx**:
```tsx
'use client';

interface FloatingOrbsProps {
  reducedMotion?: boolean;
}

export function FloatingOrbs({ reducedMotion }: FloatingOrbsProps) {
  const orbs = [
    { top: '45%', left: '15%', size: 80, delay: 0 },
    { top: '70%', right: '10%', size: 100, delay: 3 },
    { top: '85%', left: '25%', size: 60, delay: 5 },
  ];

  return (
    <>
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            top: orb.top,
            left: orb.left,
            right: orb.right,
            width: orb.size,
            height: orb.size,
            background: 'radial-gradient(circle, rgba(212,165,74,0.08) 0%, transparent 70%)',
            filter: 'blur(25px)',
            animation: reducedMotion ? 'none' : `float 8s ease-in-out infinite`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
      `}</style>
    </>
  );
}
```

**ParticleCanvas.tsx** (Desktop enhancement):
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { GOLD } from '@/lib/design-tokens';

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const [mounted, setMounted] = useState(false);

  // Defer initialization to avoid blocking LCP
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const particleCount = 40;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 1 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 165, 74, ${p.alpha})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Pause when tab not visible
    const handleVisibility = () => {
      if (document.hidden) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      } else {
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
```

#### 4. Section Components

Each section follows this pattern:

```tsx
'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GOLD, TEXT_PRIMARY, TEXT_MUTED } from '@/lib/design-tokens';

interface SectionProps {
  reducedMotion?: boolean;
}

export function ExampleSection({ reducedMotion }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 md:px-12 lg:px-16 py-16 md:py-24"
    >
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        transition={{ duration: reducedMotion ? 0 : 0.7, ease: [0.25, 0.4, 0.25, 1] }}
        className="max-w-4xl w-full"
      >
        {/* Section content */}
      </motion.div>
    </section>
  );
}
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        LandingPage.tsx                          │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ useState        │  │ useEffect       │  │ useReducedMotion│ │
│  │ - showStickyBar │  │ - scroll listen │  │ (accessibility) │ │
│  │ - isDesktop     │  │ - resize listen │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │          │
│           v                    v                    v          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Props Distribution                       ││
│  │  - reducedMotion → all sections                             ││
│  │  - isDesktop → DrudgerySection (12 vs 6 items)              ││
│  │  - showStickyBar → StickyCtaBar visibility                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Static Imports                           ││
│  │  - lib/design-tokens.ts → colors                            ││
│  │  - lib/products.ts → ProductsPreviewSection                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Content Constants

Content is defined inline in each section to match the prototype. Key content blocks:

```typescript
// components/landing/content.ts (optional, for content centralization)

export const HERO_CONTENT = {
  headline: [
    'AI gave everyone access to great answers.',
    'The advantage is now in',
    'WHO ASKS BETTER QUESTIONS.',
  ],
  body: `Every competitor can prompt the same tools. The technology is commoditized. What hasn't been commoditized is YOUR unique context — the way YOU think about YOUR market, YOUR customers, YOUR strategy. That's the input that makes AI dangerous.`,
};

export const PILLARS = [
  {
    number: '01',
    title: 'AI CONSULTING & UPSKILLING',
    description: 'Engagements that ship real outcomes AND teach your team to think and build AI-first.',
  },
  {
    number: '02',
    title: 'DEV FIRM + CO-FOUNDER',
    description: "For founders with strong vision but limited build capacity. We're your tech co-founder: strategy, design, development, AI.",
  },
  {
    number: '03',
    title: 'PRODUCTS THAT WORK FOR YOU',
    description: 'Tools born from our own workflows that kill drudgery and extend your best thinking — included with every engagement.',
    badge: 'INCLUDED',
  },
];

export const DRUDGERY_ITEMS_MOBILE = [
  '"Reviewing meeting notes hours later trying to remember what was actually said on your morning call..."',
  '"Manually logging to-dos and status updates in your project management tools one by one..."',
  '"Posting a single tweet for your product launch because that\'s all your team has bandwidth for..."',
  '"Copy-pasting context between tools because none of them talk to each other..."',
  '"Explaining your strategy again because the person you\'re talking to wasn\'t in the room..."',
  '"Formatting the same data differently for every stakeholder who needs to see it..."',
];

export const DRUDGERY_ITEMS_DESKTOP = [
  ...DRUDGERY_ITEMS_MOBILE,
  '"Rewriting the same onboarding email every time you hire someone new..."',
  '"Building a deck from scratch when you already have all the pieces..."',
  '"Searching through old threads to find that one decision you made..."',
  '"Manually updating your CRM after every conversation..."',
  '"Creating weekly reports that no one reads but everyone expects..."',
  '"Re-briefing your agency every time you want to run a campaign..."',
];

export const FEATURED_PRODUCTS = ['better-contacts', 'marketing-automation', 'talking-docs'];
```

### Responsive Breakpoints

| Breakpoint | Tailwind | Layout Changes |
|------------|----------|----------------|
| Default (mobile) | `<sm` | Single column, stacked, CSS effects only |
| sm (640px) | `sm:` | Minor typography/padding increases |
| md (768px) | `md:` | Canvas particles enabled, two-column layouts |
| lg (1024px) | `lg:` | Full layouts, split-screen Drudgery |
| xl (1280px) | `xl:` | Max-width constraints (1200px) |

### Animation Specifications

```typescript
// components/landing/animations.ts

export const transitions = {
  reveal: {
    duration: 0.7,
    ease: [0.25, 0.4, 0.25, 1],
  },
  revealMobile: {
    duration: 0.5,
    ease: [0.25, 0.4, 0.25, 1],
  },
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 24,
  },
  noMotion: {
    duration: 0,
  },
};

export const staggerChildren = (delay = 0.1) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: delay,
    },
  },
});
```

## User Experience

### User Journey

1. **Landing** — User arrives, sees hero with breathing gold glow
2. **Scroll prompt** — Animated arrow indicates content below
3. **Discovery** — User scrolls through narrative sections
4. **Sticky CTA appears** — After hero, "Work with us" bar slides up (mobile)
5. **Products preview** — User sees featured products
6. **Conversion** — User clicks CTA to Clarity Canvas or Contact

### Accessibility

- **Reduced motion**: All animations respect `prefers-reduced-motion`
- **Heading hierarchy**: h1 for hero, h2 for section titles
- **Touch targets**: 48×48px minimum on all interactive elements
- **Focus states**: Visible focus rings on all CTAs
- **ARIA labels**: Decorative elements marked `aria-hidden`
- **Color contrast**: All text meets WCAG AA (checked against `#0a0a0f` background)

### Mobile-First Details

| Element | Mobile | Desktop |
|---------|--------|---------|
| Hero headline | 32-40px | 72-96px |
| Body text | 16-18px | 18-20px |
| Horizontal padding | 24px | 48-64px |
| Section spacing | 64-80px | 96-128px |
| Drudgery items | 6 | 12 |
| Carousel speed | 4s | 3s |
| Sticky CTA | Full-width bar | Hidden (inline CTAs) |

## Testing Strategy

### Unit Tests

**Purpose:** Verify component rendering and prop handling

```typescript
// __tests__/landing/StickyCtaBar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { StickyCtaBar } from '@/components/landing/StickyCtaBar';

describe('StickyCtaBar', () => {
  // Tests that the bar is hidden when show=false
  it('does not render when show is false', () => {
    render(<StickyCtaBar show={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // Tests that the bar renders when show=true
  it('renders button when show is true', () => {
    render(<StickyCtaBar show={true} />);
    expect(screen.getByRole('button', { name: /work with us/i })).toBeInTheDocument();
  });

  // Tests that clicking triggers scroll (mock scrollIntoView)
  it('scrolls to CTA section on click', () => {
    const mockElement = { scrollIntoView: jest.fn() };
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

    render(<StickyCtaBar show={true} />);
    fireEvent.click(screen.getByRole('button'));

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
```

### Integration Tests

**Purpose:** Verify section interactions and scroll behavior

```typescript
// __tests__/landing/LandingPage.integration.test.tsx
import { render, screen, act } from '@testing-library/react';
import LandingPage from '@/components/landing/LandingPage';

describe('LandingPage Integration', () => {
  // Tests that all 8 sections render
  it('renders all content sections', () => {
    render(<LandingPage />);

    expect(screen.getByText(/who asks better questions/i)).toBeInTheDocument();
    expect(screen.getByText(/what we do/i)).toBeInTheDocument();
    expect(screen.getByText(/the problem/i)).toBeInTheDocument();
    expect(screen.getByText(/the promise/i)).toBeInTheDocument();
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
    expect(screen.getByText(/the long view/i)).toBeInTheDocument();
    expect(screen.getByText(/our products/i)).toBeInTheDocument();
    expect(screen.getByText(/open the clarity canvas/i)).toBeInTheDocument();
  });

  // Tests that sticky bar appears after scroll
  it('shows sticky CTA after scrolling past hero', async () => {
    render(<LandingPage />);

    // Initially hidden
    expect(screen.queryByRole('button', { name: /work with us/i })).not.toBeInTheDocument();

    // Simulate scroll past hero
    await act(async () => {
      Object.defineProperty(window, 'scrollY', { value: window.innerHeight, writable: true });
      window.dispatchEvent(new Event('scroll'));
    });

    // Should now be visible
    expect(screen.getByRole('button', { name: /work with us/i })).toBeInTheDocument();
  });
});
```

### E2E Tests

**Purpose:** Verify complete user flows on real devices

```typescript
// e2e/landing-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Tests mobile viewport behavior
  test('mobile: sticky CTA appears after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));

    // Wait for sticky bar
    await expect(page.getByRole('button', { name: /work with us/i })).toBeVisible();
  });

  // Tests navigation to CTA section
  test('mobile: sticky CTA scrolls to contact section', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));

    await page.getByRole('button', { name: /work with us/i }).click();

    // Should scroll to CTA section
    await expect(page.getByText(/open the clarity canvas/i)).toBeInViewport();
  });

  // Tests desktop particle canvas
  test('desktop: canvas particles render', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Canvas should exist
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  // Tests reduced motion preference
  test('respects reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Particles should not render
    await expect(page.locator('canvas')).not.toBeVisible();
  });

  // Tests performance metrics
  test('meets performance targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve({
            fcp: entries.find(e => e.name === 'first-contentful-paint')?.startTime,
            lcp: entries.find(e => e.entryType === 'largest-contentful-paint')?.startTime,
          });
        }).observe({ type: 'paint', buffered: true });
      });
    });

    // FCP < 2.5s, LCP < 3s (acceptable thresholds)
    expect(metrics.fcp).toBeLessThan(2500);
    expect(metrics.lcp).toBeLessThan(3000);
  });
});
```

### Mocking Strategies

```typescript
// Mock framer-motion for faster unit tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
  useInView: () => true,
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: { current: 0 } }),
}));

// Mock IntersectionObserver for jsdom
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}
global.IntersectionObserver = MockIntersectionObserver as any;
```

## Performance Considerations

### Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| FCP | < 1.5s | < 2.5s |
| LCP | < 2.0s | < 3.0s |
| CLS | < 0.05 | < 0.1 |
| TTI | < 3.0s | < 4.0s |
| JS Bundle | < 120KB gzipped | < 150KB |

### Optimization Strategies

1. **Font preloading** in `layout.tsx`:
```tsx
<link rel="preload" href="/fonts/InstrumentSerif.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
```

2. **Deferred particle canvas**: Initialize 100ms after mount

3. **CSS-first animations**: Use CSS keyframes for breathing glow, reserve Framer Motion for complex interactions

4. **Bundle splitting**:
```javascript
// next.config.js
experimental: {
  optimizePackageImports: ['framer-motion'],
}
```

5. **Selective imports**:
```typescript
// Good
import { motion, useInView, AnimatePresence } from 'framer-motion';

// Bad
import * as Motion from 'framer-motion';
```

## Security Considerations

- **No user input**: Page is entirely static content
- **No API calls**: No data fetching required
- **External links**: `rel="noopener noreferrer"` on all external links
- **Email link**: Uses `mailto:` protocol, no form submission

## Documentation

### To Create/Update

1. **Developer guide**: `docs/developer-guides/landing-page-guide.md`
   - Component architecture
   - Adding new sections
   - Animation patterns

2. **CLAUDE.md update**: Add landing page to Application Areas section

### Existing Docs to Reference

- `.claude/skills/33-strategies-frontend-design.md` — Design system
- `.claude/skills/mobile-first-design.md` — Mobile-first patterns
- `docs/developer-guides/learning-module-components.md` — Shared deck components

## Implementation Phases

### Phase 1: Foundation
- Create file structure under `components/landing/`
- Implement `LandingPage.tsx` orchestrator
- Implement `Nav.tsx` with hide-on-scroll behavior (from prototype)
- Implement `GoldGlow.tsx` and `FloatingOrbs.tsx` (CSS effects)
- Implement `StickyCtaBar.tsx`
- Implement `HeroSection.tsx` with full mobile layout

**Reference for section layouts**: See `docs/ideation/landing-page-redesign.md` sections 8-9 for ASCII wireframes of each section's mobile and desktop layouts.

### Phase 2: Content Sections
- Implement `PillarsSection.tsx`
- Implement `DrudgerySection.tsx` with carousel
- Implement `TwoThingsSection.tsx`
- Implement `ThreeLayerSection.tsx`
- Implement `LongViewSection.tsx`

### Phase 3: Products & Conversion
- Implement `ProductsPreviewSection.tsx` (uses `lib/products.ts`)
- Implement `CTASection.tsx`
- Implement `ProductMiniCard.tsx`

### Phase 4: Desktop Enhancements
- Implement `ParticleCanvas.tsx`
- Add desktop-specific layouts (split-screen Drudgery, 3-column grids)
- Add hover states and advanced animations

### Phase 5: Polish & Testing
- Performance optimization
- Accessibility audit
- E2E tests
- Lighthouse verification

## Open Questions

1. **Products order**: Should the featured products be hardcoded or pulled dynamically from `lib/products.ts` with a filter?
   - **Resolved**: Hardcode the 3 featured products (BetterContacts, MarketingMachine, TalkingDocs) as specified

2. **Sticky CTA on tablet**: Should the sticky bar appear on tablet (768px-1024px) or only mobile (<768px)?
   - **Recommendation**: Only mobile (<768px) to avoid clashing with inline CTAs

3. **Footer content**: Should the footer include navigation links or stay minimal?
   - **Recommendation**: Stay minimal (copyright only) for MVP, expand later if needed

## References

- **Ideation Document**: `docs/ideation/landing-page-redesign.md`
- **Prototype**: `docs/reference/landing-page-alpha-prototype/33strategies-homepage.jsx`
- **Design Spec**: `docs/reference/landing-page-alpha-prototype/33_Strategies_Homepage_Handoff.md`
- **Brand Guidelines**: `.claude/skills/33-strategies-frontend-design.md`
- **Mobile-First Skill**: `.claude/skills/mobile-first-design.md`
- **Web Best Practices**: `.claude/skills/web-design-best-practice.md`
- **Framer Motion Docs**: https://www.framer.com/motion/

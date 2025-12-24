# Scrollytelling Decks Developer Guide

This guide covers the patterns and techniques for building scrollytelling presentations - the core content type in the web-decks system.

## 0. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SCROLLYTELLING DECK ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        DECK COMPONENT                             │ │
│  │                                                                   │ │
│  │   'use client';  ◄─── Required for scroll hooks & state          │ │
│  │                                                                   │ │
│  │   ┌─────────────────────────────────────────────────────────────┐ │ │
│  │   │ Root Container                                              │ │ │
│  │   │ style={{ background: BG_PRIMARY, minHeight: '100vh' }}      │ │ │
│  │   │                                                             │ │ │
│  │   │   ┌─────────────────────────────────────────────────────┐   │ │ │
│  │   │   │ ProgressBar (fixed, top: 0)                         │   │ │ │
│  │   │   │ ├── useScroll() → scrollYProgress                   │   │ │ │
│  │   │   │ └── width scales 0% → 100% as user scrolls          │   │ │ │
│  │   │   └─────────────────────────────────────────────────────┘   │ │ │
│  │   │                                                             │ │ │
│  │   │   ┌─────────────────────────────────────────────────────┐   │ │ │
│  │   │   │ Section #1 (min-height: 100vh)                      │   │ │ │
│  │   │   │ ├── IntersectionObserver or useInView()             │   │ │ │
│  │   │   │ ├── Fade in when 20% visible                        │   │ │ │
│  │   │   │ └── Contains: SectionLabel, Headline, BodyText      │   │ │ │
│  │   │   └─────────────────────────────────────────────────────┘   │ │ │
│  │   │                            ▼                                │ │ │
│  │   │   ┌─────────────────────────────────────────────────────┐   │ │ │
│  │   │   │ Section #2 (min-height: 100vh)                      │   │ │ │
│  │   │   │ ├── Same visibility pattern                         │   │ │ │
│  │   │   │ └── RevealText components with staggered delays     │   │ │ │
│  │   │   └─────────────────────────────────────────────────────┘   │ │ │
│  │   │                            ▼                                │ │ │
│  │   │   ┌─────────────────────────────────────────────────────┐   │ │ │
│  │   │   │ Section #N...                                       │   │ │ │
│  │   │   └─────────────────────────────────────────────────────┘   │ │ │
│  │   │                                                             │ │ │
│  │   │   ┌─────────────────────────────────────────────────────┐   │ │ │
│  │   │   │ Footer                                              │   │ │ │
│  │   │   │ └── 33 Strategies branding                          │   │ │ │
│  │   │   └─────────────────────────────────────────────────────┘   │ │ │
│  │   │                                                             │ │ │
│  │   └─────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  TWO ANIMATION PATTERNS:                                                │
│  ┌────────────────────────────────┬────────────────────────────────────┐│
│  │ SIMPLE (Native CSS)            │ RICH (Framer Motion)               ││
│  ├────────────────────────────────┼────────────────────────────────────┤│
│  │ IntersectionObserver           │ useInView()                        ││
│  │ useState for visibility        │ motion.div with animate prop       ││
│  │ CSS transitions                │ Framer Motion transitions          ││
│  │ No dependencies                │ framer-motion package              ││
│  │ Example: IPFrameworkDeck       │ Example: TradeblockAIInflection    ││
│  └────────────────────────────────┴────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1. Dependencies & Key Functions

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | ^11.0.0 | Rich animations (optional) |
| `react` | ^18.2.0 | Hooks, refs, state |

### Animation Pattern Comparison

| Feature | Simple (Native) | Rich (Framer Motion) |
|---------|-----------------|---------------------|
| Bundle size | 0 KB | ~50 KB |
| Scroll progress | Manual calculation | `useScroll()` |
| Visibility detection | IntersectionObserver | `useInView()` |
| Animations | CSS transitions | `motion.div` + props |
| Best for | Simple decks | Complex interactions |

### Core Components (Defined Per-Deck)

Each deck typically defines these local components:

| Component | Purpose |
|-----------|---------|
| `Section` | Full-viewport wrapper with fade-in animation |
| `SectionLabel` | Gold uppercase category label |
| `Headline` | Large serif headline |
| `BodyText` | Body paragraph with max-width |
| `ProgressBar` | Fixed scroll progress indicator |
| `RevealText` | Text that fades in with delay |

### Brand Constants

**Reference:** See `.claude/skills/33-strategies-frontend-design.md` for the complete design system specification.

```typescript
// Standard 33 Strategies tokens (canonical values)
const GOLD = '#d4a54a';                        // Primary accent - signature gold
const GOLD_DIM = 'rgba(212, 165, 74, 0.15)';   // Gold at 15% opacity
const GOLD_GLOW = 'rgba(212, 165, 74, 0.3)';   // Gold glow effect
const GREEN = '#4ade80';                        // Success/positive
const BG_PRIMARY = '#0a0a0f';                   // Main background (subtle blue undertone)
const BG_SURFACE = '#111114';                   // Card backgrounds
const BG_ELEVATED = '#0d0d14';                  // Elevated surfaces
```

**Typography Classes:**
- Headlines: `className="font-display"` (Instrument Serif)
- Body text: `className="font-body"` (DM Sans)
- Labels: `className="font-mono"` (JetBrains Mono)

## 2. User Experience Flow

### Scroll Experience

1. User lands on deck → Title section fills viewport
2. User scrolls down → Content fades in section-by-section
3. Progress bar at top shows overall position (0% → 100%)
4. Each section triggers animation when ~20% visible
5. Content within sections can stagger (delay: 0, 0.1, 0.2s, etc.)
6. Final section + footer visible at 100% scroll

### Visual Hierarchy Per Section

```
┌─────────────────────────────────────┐
│                                     │
│  SECTION LABEL (gold, uppercase)    │
│                                     │
│  Large Serif Headline               │
│  with accent color highlights       │
│                                     │
│  Body text in muted gray. Lorem     │
│  ipsum dolor sit amet. Maximum      │
│  width of 600px for readability.    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Card or visual element      │    │
│  │ with surface background     │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### State Management

| State | Scope | Persistence |
|-------|-------|-------------|
| Scroll position | Window | None (recalculated) |
| Section visibility | Per-section | None (recalculated) |
| Interactive selections | Component | Session only |

## 3. File & Code Mapping

### Deck Components

| File | Pattern | Description |
|------|---------|-------------|
| `components/clients/plya/IPFrameworkDeck.tsx` | Simple | Native IntersectionObserver, inline styles |
| `components/clients/tradeblock/TradeblockAIInflection.tsx` | Rich | Framer Motion, Tailwind classes |
| `components/clients/plya/PLYAProposal.tsx` | Rich + Interactive | Multi-view SPA with hash routing |

### Directory Structure

```
components/clients/
├── plya/
│   ├── PLYAProposal.tsx       # Complex: multi-view, interactive
│   └── IPFrameworkDeck.tsx    # Simple: static scrollytelling
└── tradeblock/
    └── TradeblockAIInflection.tsx  # Medium: animated deck
```

### Registration

All decks must be registered in `lib/clients.ts`:
```typescript
const NewDeck = dynamic(
  () => import('@/components/clients/[client]/NewDeck'),
  { ssr: true }
);

// In client config:
content: [
  {
    slug: 'new-deck',
    type: 'deck',
    title: 'Deck Title',
    component: NewDeck,
  }
]
```

## 4. Connections to Other Parts

### Integration Points

| Connection | Direction | Description |
|------------|-----------|-------------|
| `lib/clients.ts` | Imports deck | Dynamic import for code splitting |
| `[slug]/page.tsx` | Renders deck | Mounts component when authenticated |
| `app/layout.tsx` | Provides fonts | Font CSS variables available |
| `styles/globals.css` | Base styles | Black background, smooth scroll |

### Shared Resources

- **Fonts**: `font-display` (Instrument Serif), `font-body` (DM Sans), `font-mono` (JetBrains Mono)
- **Colors**: Use brand constants consistently
- **No shared state**: Decks are fully self-contained

## 5. Critical Notes & Pitfalls

### Required Patterns

**Always include `'use client'`:**
```typescript
// TOP OF FILE - required for hooks
'use client';
```

**Full-viewport sections:**
```typescript
style={{ minHeight: '100vh' }}
// OR
className="min-h-screen"
```

**Progress bar z-index:**
```typescript
style={{ zIndex: 100 }}  // Above all content
```

### Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Missing `'use client'` | Hooks error | Add directive at top |
| `height: 100vh` instead of `minHeight` | Content cut off | Use `minHeight: '100vh'` |
| Threshold too high | Animation never triggers | Use `threshold: 0.2` or less |
| Missing observer cleanup | Memory leak | Return `() => observer.disconnect()` |
| Inline functions in observer | Re-renders | Define handler outside useEffect |

### Performance

**IntersectionObserver threshold:**
```typescript
// Good - triggers early, feels responsive
{ threshold: 0.2 }

// Bad - may not trigger if section is partially visible
{ threshold: 0.8 }
```

**Framer Motion `once` option:**
```typescript
// Animates every time scrolled into view (default)
useInView(ref, { once: false })

// Animates only first time (better performance)
useInView(ref, { once: true })
```

### Typography Gotchas

**Non-breaking spaces for better line breaks:**
```typescript
// Use &nbsp; or actual non-breaking space
<Headline>
  Our approach to <span style={{ color: GOLD }}>IP&nbsp;ownership</span>.
</Headline>

// In JSX with template literal
{`protecting what\u00A0matters\u00A0most`}
```

**Responsive font sizes with clamp:**
```typescript
fontSize: 'clamp(32px, 6vw, 56px)'
// Min: 32px, Preferred: 6% of viewport width, Max: 56px
```

## 6. Common Development Scenarios

### Scenario 1: Creating a New Simple Deck

**Template structure:**

```typescript
'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';

// Brand constants
const GOLD = '#D4A84B';
const BG_PRIMARY = '#0a0a0a';
const BG_SURFACE = '#111111';

// Section wrapper with fade-in
const Section = ({ children, id }: { children: ReactNode; id: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 24px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease'
      }}
    >
      {children}
    </section>
  );
};

// Typography components
const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p style={{ color: GOLD, fontSize: 12, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
    {children}
  </p>
);

const Headline = ({ children }: { children: ReactNode }) => (
  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 500, lineHeight: 1.15, color: '#fff', marginBottom: 24 }}>
    {children}
  </h2>
);

const BodyText = ({ children }: { children: ReactNode }) => (
  <p style={{ fontSize: 18, lineHeight: 1.7, color: '#a3a3a3', maxWidth: 600 }}>{children}</p>
);

// Main component
export default function NewDeck() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: BG_PRIMARY, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#1a1a1a', zIndex: 100 }}>
        <div style={{ height: '100%', background: GOLD, width: `${scrollProgress * 100}%`, transition: 'width 0.1s' }} />
      </div>

      <Section id="title">
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel>33 Strategies × Client</SectionLabel>
          <Headline>Your deck <span style={{ color: GOLD }}>headline</span>.</Headline>
          <BodyText>Supporting description text goes here.</BodyText>
        </div>
      </Section>

      {/* Add more sections... */}

      {/* Footer */}
      <div style={{ padding: '48px 24px', borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#525252' }}>
          <span style={{ color: GOLD }}>33</span> Strategies
        </p>
      </div>
    </div>
  );
}
```

**Common mistakes:**
- Forgetting progress bar
- Inconsistent color values
- Missing footer

**Verification:**
- Scroll through entire deck
- Progress bar reaches 100%
- Each section fades in smoothly

### Scenario 2: Adding Framer Motion Animations

**Convert from simple to rich pattern:**

```typescript
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// Replace custom Section with motion.section
const Section = ({ children, id }: { children: React.ReactNode; id: string }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen flex flex-col justify-center px-6 py-16"
    >
      {children}
    </motion.section>
  );
};

// Replace custom ProgressBar with Framer Motion version
const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-50"
      style={{ scaleX }}
    />
  );
};

// Add staggered reveal
const RevealText = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
};
```

**Verification:**
- Animations still trigger correctly
- No layout shift during animation
- Performance acceptable on mobile

### Scenario 3: Adding Interactive Elements

**Pattern from PLYAProposal - hash-based navigation:**

```typescript
type ViewMode = 'intro' | 'main' | 'summary';

const HASH_MAP: Record<string, ViewMode> = {
  '': 'intro',
  '#intro': 'intro',
  '#main': 'main',
  '#summary': 'summary',
};

export default function InteractiveDeck() {
  const [viewMode, setViewMode] = useState<ViewMode>('intro');

  // Sync with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      setViewMode(HASH_MAP[hash] || 'intro');
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL when view changes
  const navigate = (mode: ViewMode) => {
    window.history.pushState(null, '', `#${mode}`);
    setViewMode(mode);
  };

  return (
    <div>
      {viewMode === 'intro' && <IntroView onComplete={() => navigate('main')} />}
      {viewMode === 'main' && <MainView onNext={() => navigate('summary')} />}
      {viewMode === 'summary' && <SummaryView />}
    </div>
  );
}
```

## 7. Testing Strategy

### Manual Testing Checklist

- [ ] Progress bar starts at 0%, ends at 100%
- [ ] Each section fades in when scrolled into view
- [ ] Scrolling back up re-triggers animations (if `once: false`)
- [ ] Mobile: content fits without horizontal scroll
- [ ] Mobile: tap targets are large enough
- [ ] Text is readable (contrast, line height)
- [ ] Links/buttons work correctly
- [ ] Footer is visible at bottom

### Performance Checks

```bash
# Build and check bundle size
npm run build

# Look for the deck in output
# Should be code-split (not in main bundle)
```

### Common Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Animation doesn't trigger | Threshold too high | Lower to 0.2 or 0.1 |
| Progress bar stuck | Wrong scroll calculation | Check docHeight calculation |
| Content cut off | Using height instead of minHeight | Use `minHeight: '100vh'` |
| Jerky animations | Too many observers | Reduce complexity or use `once: true` |
| Flash of unstyled content | Missing `'use client'` | Add directive |

## 8. Quick Reference

### Deck Skeleton

```typescript
'use client';
import React, { useState, useEffect, useRef, ReactNode } from 'react';

const GOLD = '#D4A84B';
const BG_PRIMARY = '#0a0a0a';

// Section, SectionLabel, Headline, BodyText components...

export default function DeckName() {
  const [scrollProgress, setScrollProgress] = useState(0);
  // Scroll handler useEffect...

  return (
    <div style={{ background: BG_PRIMARY }}>
      {/* Progress bar */}
      <Section id="title">...</Section>
      <Section id="section-2">...</Section>
      {/* More sections */}
      {/* Footer */}
    </div>
  );
}
```

### Animation Constants

| Property | Typical Value | Purpose |
|----------|---------------|---------|
| `threshold` | 0.2 | When to trigger (20% visible) |
| `duration` | 0.6-0.8s | Animation length |
| `delay` | 0, 0.1, 0.2... | Stagger elements |
| `ease` | `[0.25, 0.4, 0.25, 1]` | Custom bezier curve |
| `margin` | "-10%" to "-20%" | InView trigger offset |

### Typography Scale

| Element | Font | Size | Color |
|---------|------|------|-------|
| SectionLabel | Sans/Mono | 12px | GOLD |
| Headline | Georgia/Serif | clamp(32px, 6vw, 56px) | #fff |
| BodyText | Inter/Sans | 18px | #a3a3a3 |
| Card heading | Sans | 13-16px | #fff |
| Card body | Sans | 14-15px | #a3a3a3 |

### Critical Files

1. `components/clients/[client]/[DeckName].tsx` - The deck component
2. `lib/clients.ts` - Registration (dynamic import + content entry)
3. `styles/globals.css` - Base styles, smooth scroll
4. `app/layout.tsx` - Font definitions

### Pattern Decision Tree

```
New deck needed?
    │
    ├── Simple static presentation → Native IntersectionObserver
    │   (6-10 sections, no interaction, minimal animations)
    │
    ├── Complex animations, multiple reveal types → Framer Motion
    │   (staggered reveals, parallax, micro-interactions)
    │
    └── Multi-view SPA (configurator, wizard) → Framer Motion + hash routing
        (user selections, state, navigation between views)
```

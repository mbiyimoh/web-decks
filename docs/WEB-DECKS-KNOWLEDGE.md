# Web Decks System — Claude Desktop Knowledge File

> **Purpose:** Reference document for Claude Desktop to maintain consistency when prototyping new scrollytelling web decks for TradeBlock or 33 Strategies.

---

## 1. System Overview

**What is a Web Deck?**
A web deck is a password-protected, scrollytelling presentation built with:
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **iron-session** (auth)

Each deck is a single-page React application with scroll-triggered animations, full-viewport sections, and a dark editorial aesthetic.

---

## 2. Technical Architecture

### Project Structure
```
web-decks/
├── app/
│   ├── layout.tsx          # Root layout (fonts, metadata)
│   ├── page.tsx            # Protected home route
│   ├── login/page.tsx      # Login page
│   └── api/
│       ├── auth/route.ts   # Login/logout API
│       └── health/route.ts # Railway health check
├── components/
│   └── TradeblockDeck.tsx  # Full deck component
├── lib/
│   └── session.ts          # Session configuration
├── styles/
│   └── globals.css         # Tailwind + global styles
├── middleware.ts           # Auth middleware
└── tailwind.config.ts      # Tailwind configuration
```

### Core Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "framer-motion": "^10.16.0",
  "iron-session": "^8.0.0",
  "tailwindcss": "^3.3.0"
}
```

---

## 3. Deck Component Structure

### Section Wrapper
Every full-viewport section uses this pattern:

```tsx
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id: string;
}

const Section = ({ children, className = '', id }: SectionProps) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 py-16 ${className}`}
    >
      {children}
    </motion.section>
  );
};
```

### Reveal Text Animation
Text that fades in and slides up when scrolled into view:

```tsx
interface RevealTextProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const RevealText = ({ children, delay = 0, className = '' }: RevealTextProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
```

### Progress Bar
Fixed scroll progress indicator at top:

```tsx
const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-[ACCENT_COLOR] origin-left z-50"
      style={{ scaleX }}
    />
  );
};
```

### Navigation Dots
Right-side navigation (desktop only):

```tsx
const NavDots = ({ sections, activeSection }: NavDotsProps) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`group flex items-center gap-3 ${
            activeSection === section.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'
          } transition-opacity`}
        >
          <span className="text-xs text-right w-32 hidden group-hover:block text-zinc-400">
            {section.label}
          </span>
          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
            activeSection === section.id
              ? 'bg-[ACCENT_COLOR] scale-125'
              : 'bg-zinc-600 group-hover:bg-zinc-400'
          }`} />
        </a>
      ))}
    </div>
  );
};
```

### Section Observer Hook
Active section tracking:

```tsx
useEffect(() => {
  const observers = sections.map(section => {
    const element = document.getElementById(section.id);
    if (!element) return null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveSection(section.id);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return { observer, element };
  });

  return () => {
    observers.forEach(obs => obs?.observer?.disconnect());
  };
}, []);
```

---

## 4. Animation Presets

### Timing Functions
```ts
const easeOutExpo = [0.25, 0.4, 0.25, 1];  // Smooth deceleration
const easeOut = "easeOut";                   // Standard ease out
```

### Standard Durations
```ts
const durations = {
  fast: 0.3,      // Quick transitions
  normal: 0.6,    // Standard animations
  slow: 0.8,      // Section fades
  reveal: 0.7,    // Text reveals
};
```

### Stagger Delays
Content within sections uses 0.05s - 0.1s increments:
```tsx
<RevealText delay={0}>Title</RevealText>
<RevealText delay={0.1}>Subtitle</RevealText>
<RevealText delay={0.2}>Body</RevealText>
<RevealText delay={0.3}>CTA</RevealText>
```

---

## 5. Brand: TradeBlock

### Typography
| Role | Font | CSS Variable |
|------|------|--------------|
| Display/Headlines | Space Grotesk | `--font-display` |
| Body/UI | Inter | `--font-body` |

**Font Loading (layout.tsx):**
```tsx
import { Space_Grotesk, Inter } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});
```

### Color Palette

**Backgrounds:**
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary | `#000000` | `bg-black` | Main background |
| Surface | `#18181b` | `bg-zinc-900` | Cards, containers |
| Surface Dim | `#09090b` | `bg-zinc-950` | Alternate sections |
| Elevated | `#27272a` | `bg-zinc-800` | Hover states, tags |

**Text:**
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary | `#ffffff` | `text-white` | Headlines, emphasis |
| Secondary | `#a1a1aa` | `text-zinc-400` | Body copy |
| Muted | `#71717a` | `text-zinc-500` | Captions, labels |

**Accent:**
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary | `#f59e0b` | `amber-500` | CTAs, highlights, progress |
| Light | `#fbbf24` | `amber-400` | Gradient endpoints |

**Status Colors:**
| Status | Background | Border | Text |
|--------|------------|--------|------|
| Completed | `emerald-500/20` | `emerald-500/50` | `emerald-400` |
| Rolling Out | `amber-500/20` | `amber-500/50` | `amber-400` |
| Beta | `blue-500/20` | `blue-500/50` | `blue-400` |
| Live | `purple-500/20` | `purple-500/50` | `purple-400` |

**Borders:**
| Token | Tailwind | Usage |
|-------|----------|-------|
| Default | `border-zinc-800` | Card borders |
| Subtle | `border-zinc-700/50` | Dividers |
| Accent | `border-amber-500/50` | Highlights |

### Effects

**Gradient Text:**
```tsx
<span className="bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
  Highlighted Text
</span>
```

**Alternative (CSS class):**
```css
.text-gradient {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Glow Effects:**
```css
.glow {
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.15);
}

.glow-strong {
  box-shadow: 0 0 80px rgba(245, 158, 11, 0.25);
}

.glow-purple {
  box-shadow: 0 0 60px rgba(168, 85, 247, 0.15);
}
```

**Background Blur Orbs:**
```tsx
<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
```

### Border Radius
| Size | Value | Tailwind | Usage |
|------|-------|----------|-------|
| Small | 8px | `rounded-lg` | Buttons, small cards |
| Medium | 12px | `rounded-xl` | Standard cards |
| Large | 16px | `rounded-2xl` | Featured containers |
| Full | 9999px | `rounded-full` | Badges, dots |

### Component Patterns

**Callout Box (Left Border Accent):**
```tsx
<div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 pl-6 py-4">
  <p className="text-zinc-300">
    <span className="text-white font-medium">Key point:</span> Supporting text
  </p>
</div>
```

**Metric/Analytics Card:**
```tsx
<div className="rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5">
  <p className="text-zinc-400 text-xs mb-1">Title</p>
  <p className="text-white text-xl font-bold mb-1">Value</p>
  <p className="text-zinc-500 text-xs">Subtitle</p>
</div>
```

**Feature Card:**
```tsx
<div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
      <Icon className="w-5 h-5 text-amber-500" />
    </div>
    <h3 className="text-xl font-bold text-white">Title</h3>
  </div>
  <p className="text-zinc-400">Description</p>
</div>
```

**Bullet List:**
```tsx
<ul className="space-y-2">
  <li className="flex items-center gap-2 text-zinc-400">
    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
    List item text
  </li>
</ul>
```

**Status Badge:**
```tsx
<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
  bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
  <span>✓</span>
  <span>Completed</span>
</span>
```

**Quote/Highlight Box:**
```tsx
<div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 glow">
  <p className="text-2xl md:text-3xl text-white font-display font-bold leading-relaxed">
    "Quote text with <span className="text-amber-500">highlighted phrase</span>"
  </p>
</div>
```

**Before/After Comparison:**
```tsx
<div className="grid grid-cols-12 gap-4 items-center bg-zinc-900/30 rounded-xl p-5 border border-zinc-800/50">
  <p className="col-span-2 text-white font-medium">Label</p>
  <p className="col-span-4 text-zinc-500 line-through">Before value</p>
  <p className="col-span-6 text-amber-500 font-medium">After value</p>
</div>
```

---

## 6. Brand: 33 Strategies

### Typography
| Role | Font | CSS Variable |
|------|------|--------------|
| Sans | Geist Sans | `--font-geist-sans` |
| Mono | Geist Mono | `--font-geist-mono` |

### Color Palette (OKLCH Format)

**Backgrounds:**
| Token | OKLCH | Approximate Hex | Usage |
|-------|-------|-----------------|-------|
| Background | `oklch(0.05 0 0)` | `#0a0a0a` | Main background |
| Card | `oklch(0.08 0 0)` | `#141414` | Card backgrounds |
| Muted | `oklch(0.12 0 0)` | `#1f1f1f` | Secondary surfaces |
| Secondary | `oklch(0.15 0 0)` | `#262626` | Elevated surfaces |

**Text:**
| Token | OKLCH | Approximate Hex | Usage |
|-------|-------|-----------------|-------|
| Foreground | `oklch(0.98 0 0)` | `#fafafa` | Primary text |
| Muted Foreground | `oklch(0.6 0 0)` | `#999999` | Secondary text |

**Accent (Primary - Green):**
| Token | OKLCH | Approximate Hex | Usage |
|-------|-------|-----------------|-------|
| Primary | `oklch(0.7 0.15 142)` | `#4ade80` | CTAs, highlights |
| Ring | `oklch(0.7 0.15 142)` | `#4ade80` | Focus rings |

**Semantic Colors:**
| Role | Color | Usage |
|------|-------|-------|
| Blue | `text-blue-400` | Product experience |
| Purple | `text-purple-400` | Technical depth |
| Green | `text-green-400` | Thought leadership |
| Orange | `rgba(251, 146, 60, X)` | Glow accents |

**Borders:**
| Token | OKLCH | Usage |
|-------|-------|-------|
| Border | `oklch(0.2 0 0)` | Standard borders |
| Input | `oklch(0.15 0 0)` | Form inputs |

### Effects

**White Glow:**
```css
--shadow-glow: 0 0 20px rgba(255, 255, 255, 0.15);
--shadow-cta-glow: 0 0 30px rgba(255, 255, 255, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.2);
```

**Glassmorphism Card:**
```tsx
<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
  Content
</div>
```

**Gradient Card:**
```tsx
<div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-12 hover:border-white/30 transition-all duration-500">
  Content
</div>
```

### Border Radius
| Token | Value |
|-------|-------|
| Default | `0.75rem` (12px) |
| Pill/Button | `rounded-full` |
| Cards | `rounded-2xl` |

### Component Patterns

**Badge:**
```tsx
<div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium">
  <span className="w-2 h-2 bg-white/60 rounded-full mr-2 animate-pulse"></span>
  Badge Text
</div>
```

**Primary CTA Button:**
```tsx
<Button
  className="bg-white text-black rounded-full px-10 py-7 text-xl font-semibold
    transition-all duration-300 hover:bg-gray-50 hover:scale-105
    shadow-cta-glow hover:shadow-glow"
>
  Button Text
  <ArrowRight />
</Button>
```

**Secondary CTA Button:**
```tsx
<Button
  variant="outline"
  className="border-2 border-white/30 text-white rounded-full px-10 py-7 text-xl font-semibold
    transition-all duration-300 hover:bg-white/10 hover:border-white/50"
>
  Button Text
</Button>
```

**Stat Card:**
```tsx
<div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-12">
  <div className="text-7xl font-bold text-white mb-6">$16M+</div>
  <div className="text-2xl font-semibold text-white mb-6">Label</div>
  <div className="text-white/70 text-lg">Description</div>
</div>
```

**Feature List:**
```tsx
<ul className="space-y-3 text-white/80">
  <li className="flex items-start">
    <span className="text-blue-400 mr-3 text-xl">•</span>
    <span>List item text</span>
  </li>
</ul>
```

**Section with Scroll Animation:**
```tsx
const { ref: sectionRef, isVisible } = useScrollAnimation();

<section ref={sectionRef} className={`transition-all duration-1000 ${
  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
}`}>
  Content
</section>
```

---

## 7. Spacing System

### Section Padding
| Token | Value | Usage |
|-------|-------|-------|
| Section SM | 5rem (80px) | Mobile/tablet sections |
| Section MD | 8rem (128px) | Desktop sections |
| Section LG | 10rem (160px) | Hero sections |

### Card Spacing
| Token | Value | Usage |
|-------|-------|-------|
| Card Padding | 2rem (32px) | Interior spacing |
| Card Gap | 2rem (32px) | Between cards |

### Base Scale (8px)
```
0.5rem = 8px
1rem = 16px
1.5rem = 24px
2rem = 32px
3rem = 48px
4rem = 64px
6rem = 96px
8rem = 128px
```

---

## 8. Responsive Breakpoints

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |
| `2xl:` | 1536px | Extra large |

**Common Responsive Patterns:**
```tsx
// Font sizes
className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"

// Padding
className="px-6 md:px-16 lg:px-24"

// Grid columns
className="grid md:grid-cols-2 lg:grid-cols-3"

// Hide on mobile
className="hidden lg:flex"

// Stack → Row
className="flex flex-col sm:flex-row"
```

---

## 9. Authentication Pattern

### Session Configuration
```typescript
export function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET required');

  return {
    password: secret,
    cookieName: '[brand]-deck-session',  // e.g., 'tradeblock-deck-session'
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}
```

### Login Page Structure
```tsx
<div className="min-h-screen flex items-center justify-center bg-black px-4">
  <div className="w-full max-w-sm">
    {/* Logo/Brand */}
    <div className="text-center mb-12">
      <h1 className="font-display text-4xl font-bold text-white">BRAND NAME</h1>
      <p className="mt-2 text-gray-500 text-sm">Subtitle</p>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="password"
        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg
          text-white placeholder-gray-500 focus:ring-2 focus:ring-[ACCENT]"
        placeholder="Enter password"
      />
      <button className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg">
        View Presentation
      </button>
    </form>
  </div>
</div>
```

---

## 10. Creating New Decks

### Checklist

1. **Create deck component** in `components/[BrandName]Deck.tsx`
2. **Define sections array** with id and label for each section
3. **Set up section observer** for active section tracking
4. **Add ProgressBar and NavDots** at top level
5. **Build sections** using Section and RevealText wrappers
6. **Apply brand tokens** (colors, fonts, effects)
7. **Add inline CSS** for custom effects (gradients, glows)

### Deck Skeleton
```tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// [Include Section, RevealText, ProgressBar, NavDots components]

export default function DeckName() {
  const [activeSection, setActiveSection] = useState('title');

  const sections = [
    { id: 'title', label: 'Title' },
    { id: 'section-1', label: 'Section 1' },
    // Add sections...
  ];

  useEffect(() => {
    // Section observer setup
  }, []);

  return (
    <div className="bg-black text-white min-h-screen font-body">
      <style>{`
        /* Brand-specific CSS classes */
      `}</style>

      <ProgressBar />
      <NavDots sections={sections} activeSection={activeSection} />

      <Section id="title" className="relative overflow-hidden">
        {/* Background effects */}
        <div className="relative z-10 max-w-4xl">
          <RevealText>
            {/* Content */}
          </RevealText>
        </div>
      </Section>

      {/* More sections... */}
    </div>
  );
}
```

---

## 11. Deployment (Railway)

### Required Environment Variables
```
DECK_PASSWORD=your_password
SESSION_SECRET=your_64_char_hex_secret  # Generate: openssl rand -hex 32
```

### railway.toml Configuration
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "next start -H 0.0.0.0 -p $PORT"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}
```

### Custom Domains
Configure in Railway dashboard → Service Settings → Networking → Custom Domains

---

## Quick Reference Cards

### TradeBlock At-a-Glance
```
Fonts: Space Grotesk (display), Inter (body)
Primary Accent: #f59e0b (amber-500)
Background: #000000 (black)
Text: #ffffff / #a1a1aa / #71717a
Glow: rgba(245, 158, 11, 0.15)
Radius: rounded-xl / rounded-2xl
```

### 33 Strategies At-a-Glance
```
Fonts: Geist Sans, Geist Mono
Primary Accent: oklch(0.7 0.15 142) ≈ #4ade80 (green)
Background: oklch(0.05 0 0) ≈ #0a0a0a
Text: #fafafa / #999999
Glow: rgba(255, 255, 255, 0.15)
Radius: 0.75rem / rounded-2xl / rounded-full
Glassmorphism: bg-white/10 backdrop-blur-md border-white/20
```

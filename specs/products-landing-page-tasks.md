# Task Breakdown: Products Landing Page

**Generated:** 2026-01-20
**Source:** specs/products-landing-page.md

## Overview

Create a products showcase page at `/products` that indexes all 33 Strategies products with full-width horizontal cards. Each card displays product name, tagline, status badge, benefit bullets, mockup placeholders, and CTA. Status badges indicate AVAILABLE (green), BY REQUEST (blue), or BETA (gold).

---

## Phase 1: Data Layer

### Task 1.1: Create Products Data File
**Description:** Create lib/products.ts with product definitions and types
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.2

**Technical Requirements:**
Create `lib/products.ts`:

```typescript
export type ProductStatus = 'available' | 'by-request' | 'beta';

export interface ProductMockup {
  type: 'desktop' | 'mobile';
  alt: string;
  placeholder: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  bullets: string[];
  status: ProductStatus;
  externalUrl?: string;
  contactFormProduct?: string;
  ctaLabel: string;
  mockups: ProductMockup[];
}

export const PRODUCTS: Product[] = [
  {
    id: 'talking-docs',
    name: 'TalkingDocs.ai',
    tagline: "Let's be honest: nobody reads the documents you send them. Now they don't have to.",
    bullets: [
      'Train an AI agent that represents you — Answer a few questions, and we\'ll configure an AI that speaks your language and knows your content',
      'Deliver documents through conversation, not attachments — Recipients explore by asking questions, not scrolling',
      'One link, instant access — No logins required. Your audience gets answers immediately',
    ],
    status: 'available',
    externalUrl: 'https://talkingdocs.ai',
    ctaLabel: 'Try TalkingDocs.ai',
    mockups: [
      {
        type: 'desktop',
        alt: 'TalkingDocs Share Experience',
        placeholder: 'Split-screen: AI chat on left, document viewer on right with citation linking',
      },
      {
        type: 'mobile',
        alt: 'TalkingDocs Mobile Experience',
        placeholder: 'Mobile view of the conversational document reader',
      },
    ],
  },
  {
    id: 'better-contacts',
    name: 'Better Contacts',
    tagline: 'Your contacts are flat. Give them some depth.',
    bullets: [
      '"Why Now" intelligence — Know exactly why someone matters right now, not just who they are',
      '30-second voice enrichment — Talk, don\'t type. AI extracts insights while you think out loud',
      'Chat-first exploration — "Who do I know in climate tech?" Ask your network like you\'d ask a friend',
    ],
    status: 'available',
    externalUrl: 'https://bettercontacts.ai',
    ctaLabel: 'Try Better Contacts',
    mockups: [
      {
        type: 'mobile',
        alt: 'Voice Enrichment',
        placeholder: '30-second timer with voice waveform + AI-extracted bubble tags appearing in real-time',
      },
      {
        type: 'mobile',
        alt: 'Research Enrichment',
        placeholder: 'Automated research-driven enrichment flow showing AI gathering context',
      },
      {
        type: 'desktop',
        alt: 'Explore Chat',
        placeholder: 'Natural language query with contact chips appearing, side-by-side view showing "Why Now" for each match',
      },
    ],
  },
  {
    id: 'm33t',
    name: 'M33T',
    tagline: 'The right people. The right context. Before you arrive.',
    bullets: [
      'End "random networking" — Every event, the same story: six conversations that go nowhere. M33T finds the 3-4 that actually matter',
      'Know who to meet & why — AI learns what you\'re trying to accomplish, then surfaces matches with conversation starters built in',
      'Two-sided intent — They know to find you too. Both sides arrive prepared',
    ],
    status: 'by-request',
    contactFormProduct: 'm33t',
    ctaLabel: 'Request Access',
    mockups: [
      {
        type: 'mobile',
        alt: 'Concierge Interview',
        placeholder: 'Chat-style onboarding: "What brings you to the event?" → "Series A investors in SaaS"',
      },
      {
        type: 'mobile',
        alt: 'Curated Matches',
        placeholder: 'List view showing "We found 5 ideal connections" with match cards',
      },
    ],
  },
  {
    id: 'marketing-automation',
    name: 'Marketing Automation',
    tagline: 'Plan multi-channel marketing campaigns visually—or let AI draft them for you and import in one click.',
    bullets: [
      'Brainstorm with AI, Build Automatically — Outline your entire campaign in Claude, ChatGPT, or your favorite LLM. Export a single file and import it directly into the builder',
      'Drag-and-Drop Visual Calendar — Build campaigns by dragging post blocks onto a weekly or daily calendar grid. See your entire campaign timeline at a glance',
      'Multi-Channel Orchestration in One View — Coordinate Twitter threads, Instagram posts, email sequences, and push notifications from a single master calendar',
    ],
    status: 'beta',
    contactFormProduct: 'marketing-automation',
    ctaLabel: 'Join Beta Waitlist',
    mockups: [
      {
        type: 'desktop',
        alt: 'LLM Import Flow',
        placeholder: 'Split-screen: Claude/ChatGPT conversation on left, import modal previewing structured campaign on right',
      },
      {
        type: 'desktop',
        alt: 'Campaign Calendar',
        placeholder: 'Weekly grid with channel swim lanes, draggable post blocks, color-coded channels',
      },
    ],
  },
];
```

**Acceptance Criteria:**
- [ ] File exports ProductStatus type, ProductMockup interface, Product interface
- [ ] PRODUCTS array contains 4 products with correct data
- [ ] Each product has appropriate mockups defined
- [ ] Status and CTA correctly set for each product

---

## Phase 2: UI Components

### Task 2.1: Create ProductStatusBadge Component
**Description:** Create components/products/ProductStatusBadge.tsx with status variants
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1, Task 2.2, Task 2.3

**Technical Requirements:**
Create `components/products/ProductStatusBadge.tsx`:

```typescript
'use client';

import { ProductStatus } from '@/lib/products';

const PRODUCT_STATUS_CONFIG = {
  available: {
    color: '#4ade80',
    bg: 'rgba(74, 222, 128, 0.15)',
    label: 'AVAILABLE',
  },
  'by-request': {
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.15)',
    label: 'BY REQUEST',
  },
  beta: {
    color: '#d4a54a',
    bg: 'rgba(212, 165, 74, 0.15)',
    label: 'BETA',
  },
} as const;

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  const config = PRODUCT_STATUS_CONFIG[status];

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
      style={{ background: config.bg }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.color }}
      />
      <span
        className="text-[11px] font-mono font-semibold tracking-wide"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Component renders correct color for each status
- [ ] Pill shape with dot indicator and uppercase label
- [ ] Uses mono font with tracking

---

### Task 2.2: Create ProductMockupPlaceholder Component
**Description:** Create components/products/ProductMockupPlaceholder.tsx for wireframe placeholders
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.1, Task 2.1, Task 2.3

**Technical Requirements:**
Create `components/products/ProductMockupPlaceholder.tsx`:

```typescript
'use client';

import { ProductMockup } from '@/lib/products';

interface ProductMockupPlaceholderProps {
  mockup: ProductMockup;
}

export function ProductMockupPlaceholder({ mockup }: ProductMockupPlaceholderProps) {
  const isDesktop = mockup.type === 'desktop';

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{
        width: isDesktop ? 160 : 70,
      }}
    >
      {/* Device frame */}
      <div
        className="flex items-center justify-center"
        style={{
          width: isDesktop ? 160 : 70,
          height: isDesktop ? 100 : 140,
          borderRadius: isDesktop ? 8 : 12,
          border: '1px dashed rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {/* Device icon */}
        {isDesktop ? (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Label */}
      <p
        className="text-[10px] text-center leading-tight"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {mockup.alt}
      </p>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Desktop placeholder: 160x100px with monitor icon
- [ ] Mobile placeholder: 70x140px with phone icon
- [ ] Dashed border with subtle background
- [ ] Alt text label below

---

### Task 2.3: Create ProductCard Component
**Description:** Create components/products/ProductCard.tsx with full-width horizontal layout
**Size:** Large
**Priority:** High
**Dependencies:** Task 1.1, Task 2.1, Task 2.2
**Can run parallel with:** Task 2.4

**Technical Requirements:**
Create `components/products/ProductCard.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product } from '@/lib/products';
import { ProductStatusBadge } from './ProductStatusBadge';
import { ProductMockupPlaceholder } from './ProductMockupPlaceholder';

// Design tokens
const GOLD = '#d4a54a';
const BG_SURFACE = '#111114';
const BG_ELEVATED = '#0d0d14';
const TEXT_PRIMARY = '#f5f5f5';
const TEXT_MUTED = '#888888';

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const isExternal = !!product.externalUrl;
  const href = isExternal
    ? product.externalUrl
    : `/contact?product=${product.contactFormProduct}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.4, 0.25, 1] }}
      className="mb-6"
    >
      <div
        className="rounded-2xl p-8 transition-all duration-200 hover:border-[rgba(212,165,74,0.3)]"
        style={{
          background: BG_SURFACE,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = BG_ELEVATED;
          e.currentTarget.style.borderColor = 'rgba(212,165,74,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = BG_SURFACE;
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        }}
      >
        {/* Status badge */}
        <div className="mb-4">
          <ProductStatusBadge status={product.status} />
        </div>

        {/* Three-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Column 1: Info */}
          <div className="flex flex-col">
            <h3
              className="text-2xl lg:text-3xl font-display mb-2"
              style={{ color: TEXT_PRIMARY }}
            >
              {product.name}
            </h3>
            <p className="text-base lg:text-lg mb-6" style={{ color: TEXT_MUTED }}>
              {product.tagline}
            </p>

            {/* CTA Button */}
            {isExternal ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 mt-auto self-start"
                style={{ background: GOLD, color: '#0a0a0f' }}
              >
                {product.ctaLabel}
                <svg
                  className="ml-2 w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            ) : (
              <Link
                href={href}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-opacity hover:opacity-90 mt-auto self-start"
                style={{ background: GOLD, color: '#0a0a0f' }}
              >
                {product.ctaLabel}
                <svg
                  className="ml-2 w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {/* Column 2: Bullets */}
          <div>
            <ul className="space-y-4">
              {product.bullets.map((bullet, i) => {
                // Split bullet into bold part and rest
                const dashIndex = bullet.indexOf('—');
                const title = dashIndex > -1 ? bullet.slice(0, dashIndex).trim() : null;
                const description = dashIndex > -1 ? bullet.slice(dashIndex + 1).trim() : bullet;

                return (
                  <li key={i} className="flex gap-3">
                    <span style={{ color: GOLD }} className="mt-1.5">
                      •
                    </span>
                    <div>
                      {title && (
                        <span className="font-medium" style={{ color: TEXT_PRIMARY }}>
                          {title}
                        </span>
                      )}
                      {title && ' — '}
                      <span style={{ color: TEXT_MUTED }}>{description}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: Mockups */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
            {product.mockups.map((mockup, i) => (
              <ProductMockupPlaceholder key={i} mockup={mockup} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
```

**Acceptance Criteria:**
- [ ] Full-width horizontal card with rounded corners
- [ ] Status badge at top
- [ ] 3-column grid on desktop, responsive on smaller screens
- [ ] Column 1: Name, tagline, CTA button
- [ ] Column 2: Bullets with gold bullet markers, bold titles
- [ ] Column 3: Mockup placeholders
- [ ] Hover state: gold border glow, background shift
- [ ] External links open in new tab, internal links use Next.js Link
- [ ] Staggered animation on scroll

---

### Task 2.4: Create ProductsHero Component
**Description:** Create components/products/ProductsHero.tsx with geometric animation
**Size:** Medium
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 2.3

**Technical Requirements:**
Create `components/products/ProductsHero.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const GOLD = '#d4a54a';
const GOLD_GLOW = 'rgba(212,165,74,0.3)';

function GeometricAnimation() {
  const rings = [
    { radius: 80, dots: 8, duration: 30, direction: 1 },
    { radius: 120, dots: 12, duration: 45, direction: -1 },
    { radius: 160, dots: 16, duration: 60, direction: 1 },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="w-[400px] h-[400px] md:w-[500px] md:h-[500px] relative">
        {rings.map((ring, ringIndex) => (
          <motion.div
            key={ringIndex}
            className="absolute inset-0"
            animate={{ rotate: 360 * ring.direction }}
            transition={{
              duration: ring.duration,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <svg className="w-full h-full" viewBox="0 0 400 400">
              <circle
                cx="200"
                cy="200"
                r={ring.radius}
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />
              {Array.from({ length: ring.dots }).map((_, dotIndex) => {
                const angle = (dotIndex / ring.dots) * Math.PI * 2;
                const x = 200 + Math.cos(angle) * ring.radius;
                const y = 200 + Math.sin(angle) * ring.radius;
                return (
                  <circle
                    key={dotIndex}
                    cx={x}
                    cy={y}
                    r={dotIndex % 4 === 0 ? 3 : 1.5}
                    fill={dotIndex % 4 === 0 ? GOLD_GLOW : 'rgba(255,255,255,0.15)'}
                  />
                );
              })}
            </svg>
          </motion.div>
        ))}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="40" fill="url(#centerGlow)" />
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={GOLD_GLOW} />
              <stop offset="100%" stopColor="rgba(212,165,74,0)" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export function ProductsHero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <GeometricAnimation />

      <div className="relative z-10 text-center max-w-3xl">
        {/* Logo link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          className="mb-6"
        >
          <Link href="/">
            <span className="text-6xl md:text-7xl font-display" style={{ color: GOLD }}>
              33
            </span>
          </Link>
        </motion.div>

        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-xs font-mono tracking-[0.2em] uppercase mb-6"
          style={{ color: GOLD }}
        >
          Our Products
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-4xl md:text-5xl lg:text-6xl font-display text-white mb-6 leading-tight"
        >
          AI-first Tools Built For{' '}
          <span style={{ color: GOLD }}>Operators</span> By Operators
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-lg md:text-xl text-zinc-400 mb-12"
        >
          Build brilliant things with brilliant people.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col items-center"
        >
          <p className="text-xs text-zinc-600 mb-2">Scroll</p>
          <div className="w-5 h-8 rounded-full border-2 border-zinc-700 relative">
            <motion.div
              className="w-1 h-2 rounded-full absolute top-1.5 left-1/2 -translate-x-1/2"
              style={{ background: GOLD }}
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

**Acceptance Criteria:**
- [ ] Full viewport height hero section
- [ ] Geometric animation with rotating rings and gold dots
- [ ] "33" logo links to home
- [ ] Gold "OUR PRODUCTS" label
- [ ] Headline with "Operators" highlighted in gold
- [ ] Subheadline in muted color
- [ ] Animated scroll indicator
- [ ] Staggered entrance animations

---

## Phase 3: Page Assembly

### Task 3.1: Create Products Page Route and Client Component
**Description:** Create app/products/page.tsx and ProductsPageClient.tsx
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1, Task 2.3, Task 2.4
**Can run parallel with:** None

**Technical Requirements:**

**File 1: `app/products/page.tsx`**
```typescript
import ProductsPageClient from './ProductsPageClient';

export const metadata = {
  title: 'Products | 33 Strategies',
  description:
    'AI-first tools built for operators by operators. Explore Talking Docs, Better Contacts, M33T, and more.',
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
```

**File 2: `app/products/ProductsPageClient.tsx`**
```typescript
'use client';

import Link from 'next/link';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductCard } from '@/components/products/ProductCard';
import { PRODUCTS } from '@/lib/products';

const GOLD = '#d4a54a';
const BG_PRIMARY = '#0a0a0f';
const TEXT_MUTED = '#888888';

export default function ProductsPageClient() {
  return (
    <div className="min-h-screen" style={{ background: BG_PRIMARY }}>
      {/* Hero section */}
      <ProductsHero />

      {/* Products section */}
      <section className="px-6 md:px-12 lg:px-16 pb-16">
        {PRODUCTS.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-16 py-8 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm" style={{ color: TEXT_MUTED }}>
            © 2025 33 Strategies
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/contact"
              className="transition-colors hover:text-white"
              style={{ color: TEXT_MUTED }}
            >
              Contact
            </Link>
            <a
              href="mailto:whatsgood@33strategies.ai"
              className="transition-colors hover:text-white"
              style={{ color: TEXT_MUTED }}
            >
              whatsgood@33strategies.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Page renders at /products route
- [ ] Metadata set for SEO
- [ ] Hero section displays with animation
- [ ] All 4 product cards render correctly
- [ ] Footer with copyright, Contact link, and email
- [ ] Responsive layout

---

## Phase 4: Testing & Verification

### Task 4.1: End-to-End Testing
**Description:** Test the complete products page flow
**Size:** Small
**Priority:** High
**Dependencies:** Task 3.1
**Can run parallel with:** None

**Test Scenarios:**
1. Navigate to /products - page renders with hero and 4 products
2. Verify status badges: Talking Docs (green), Better Contacts (green), M33T (blue), Marketing Automation (gold)
3. Click "Try TalkingDocs.ai" - opens talkingdocs.ai in new tab
4. Click "Try Better Contacts" - opens bettercontacts.ai in new tab
5. Click "Request Access" on M33T - navigates to /contact?product=m33t
6. Click "Join Beta Waitlist" on Marketing Automation - navigates to /contact?product=marketing-automation
7. Test hover states on cards - gold border appears
8. Test responsive layout at 375px, 768px, 1280px
9. Verify "33" logo links to home
10. Verify footer Contact link works

**Acceptance Criteria:**
- [ ] All test scenarios pass
- [ ] External links open in new tab
- [ ] Internal links navigate correctly with query params
- [ ] Responsive design works at all breakpoints

---

## Execution Summary

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| 1. Data Layer | 1.1 | None |
| 2. UI Components | 2.1, 2.2, 2.3, 2.4 | 1.1 (for 2.3), parallel otherwise |
| 3. Page Assembly | 3.1 | 1.1, 2.3, 2.4 |
| 4. Testing | 4.1 | 3.1 |

**Critical Path:** 1.1 → 2.3 → 3.1 → 4.1
**Parallel Opportunities:** Tasks 2.1, 2.2, 2.4 can run in parallel

**Total Tasks:** 6
**Estimated Implementation Time:** ~3 hours

# Specification: Products Landing Page

**Version:** 1.0
**Date:** 2026-01-20
**Status:** Draft
**Route:** `/products`
**Related:** `docs/ideation/products-landing-page.md`

---

## 1. Overview

### 1.1 Purpose
Create a products showcase page at `33strategies.ai/products` that indexes, explains, and promotes all 33 Strategies products with clear calls-to-action based on product availability status.

### 1.2 Success Criteria
- [ ] Page renders at `/products` route
- [ ] Hero section displays with geometric animation and headline
- [ ] 4 product cards render in full-width horizontal layout
- [ ] Each card displays: name, tagline, status badge, bullets, mockup placeholders
- [ ] Status badges correctly show AVAILABLE (green), BY REQUEST (blue), or BETA (gold)
- [ ] CTAs link to external sites (Talking Docs, Better Contacts) or contact form (M33T, Marketing Automation)
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Follows 33 Strategies design system (dark theme, gold accents)

---

## 2. User Stories

### 2.1 Visitor browsing products
**As a** potential customer visiting 33strategies.ai/products
**I want to** see all available products with clear descriptions and availability status
**So that** I can understand what 33 Strategies offers and take appropriate action

### 2.2 Visitor accessing available product
**As a** visitor interested in Talking Docs or Better Contacts
**I want to** click a CTA that takes me directly to the product
**So that** I can start using it immediately

### 2.3 Visitor requesting access to gated product
**As a** visitor interested in M33T or Marketing Automation
**I want to** click a CTA that takes me to a contact form
**So that** I can express interest and get in touch with 33 Strategies

---

## 3. Technical Architecture

### 3.1 File Structure
```
app/
  products/
    page.tsx                      # Route handler with metadata
    ProductsPageClient.tsx        # Main client component ('use client')

components/
  products/
    ProductCard.tsx               # Full-width horizontal product card
    ProductStatusBadge.tsx        # Status badge component
    ProductMockupPlaceholder.tsx  # Placeholder for wireframe images
    ProductsHero.tsx              # Hero section with animation

lib/
  products.ts                     # Product data definitions
```

### 3.2 Dependencies
- `framer-motion` — Animations
- `next/link` — Internal navigation
- Existing: `components/landing/LandingPage.tsx` (GeometricAnimation reference)
- Existing: `components/portal/design-tokens.ts` (color constants)

### 3.3 Data Model
```typescript
// lib/products.ts

export type ProductStatus = 'available' | 'by-request' | 'beta';

export interface ProductMockup {
  type: 'desktop' | 'mobile';
  alt: string;
  placeholder: string; // Description for placeholder
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  bullets: string[];
  status: ProductStatus;
  externalUrl?: string;           // For AVAILABLE products
  contactFormProduct?: string;    // Pre-checked checkbox ID for contact form
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
      { type: 'desktop', alt: 'TalkingDocs Share Experience', placeholder: 'Split-screen: AI chat on left, document viewer on right with citation linking' },
      { type: 'mobile', alt: 'TalkingDocs Mobile Experience', placeholder: 'Mobile view of the conversational document reader' },
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
      { type: 'mobile', alt: 'Voice Enrichment', placeholder: '30-second timer with voice waveform + AI-extracted bubble tags appearing in real-time' },
      { type: 'mobile', alt: 'Research Enrichment', placeholder: 'Automated research-driven enrichment flow showing AI gathering context' },
      { type: 'desktop', alt: 'Explore Chat', placeholder: 'Natural language query with contact chips appearing, side-by-side view showing "Why Now" for each match' },
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
      { type: 'mobile', alt: 'Concierge Interview', placeholder: 'Chat-style onboarding: "What brings you to the event?" → "Series A investors in SaaS"' },
      { type: 'mobile', alt: 'Curated Matches', placeholder: 'List view showing "We found 5 ideal connections" with match cards' },
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
      { type: 'desktop', alt: 'LLM Import Flow', placeholder: 'Split-screen: Claude/ChatGPT conversation on left, import modal previewing structured campaign on right' },
      { type: 'desktop', alt: 'Campaign Calendar', placeholder: 'Weekly grid with channel swim lanes, draggable post blocks, color-coded channels' },
    ],
  },
];
```

---

## 4. Component Specifications

### 4.1 ProductsPageClient.tsx
**Purpose:** Main page component with hero and product list

**Structure:**
```tsx
'use client';

import { motion } from 'framer-motion';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductCard } from '@/components/products/ProductCard';
import { PRODUCTS } from '@/lib/products';

export default function ProductsPageClient() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Progress bar (gold, fixed top) */}

      {/* Hero section */}
      <ProductsHero />

      {/* Product cards - vertical stack */}
      <div className="px-6 md:px-12 lg:px-16 pb-24">
        {PRODUCTS.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>

      {/* Footer */}
    </div>
  );
}
```

### 4.2 ProductsHero.tsx
**Purpose:** Hero section with geometric animation and headline

**Specifications:**
- Height: 100vh (full viewport)
- Background: `#0a0a0f` with GeometricAnimation component (reuse from LandingPage)
- Content (centered):
  - Gold "33" wordmark
  - Label: `OUR PRODUCTS` (gold, uppercase, tracked)
  - Headline: `AI-first Tools Built For Operators By Operators`
  - Subheadline: `Build brilliant things with brilliant people.`
- Scroll indicator at bottom

**Animation:**
- Staggered fade-in using RevealText pattern (delays: 0, 0.1, 0.2, 0.3)

### 4.3 ProductCard.tsx
**Purpose:** Full-width horizontal product card (~40vh height)

**Layout (3-column grid on desktop):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Status Badge]                                                          │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│                     │                     │                             │
│  PRODUCT NAME       │  • Bullet one that  │   ┌─────────┐  ┌─────────┐ │
│  ─────────────      │    explains pain    │   │ Desktop │  │ Mobile  │ │
│  Tagline that       │    point solved     │   │ Mockup  │  │ Mockup  │ │
│  hooks and          │                     │   │         │  │         │ │
│  provokes           │  • Bullet two that  │   └─────────┘  └─────────┘ │
│                     │    shows 10x        │                             │
│  [CTA Button]       │    improvement      │   (or 2 mobile, etc.)      │
│                     │                     │                             │
│                     │  • Bullet three     │                             │
│                     │                     │                             │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
```

**Specifications:**
- Height: ~40vh (2-3 cards visible at once when scrolling)
- Background: `#111114` (BG_SURFACE)
- Border: `1px solid rgba(255,255,255,0.08)`
- Border radius: 16px (rounded-2xl)
- Padding: 32px (p-8)
- Margin bottom: 24px between cards

**Grid:**
- Desktop: `grid-cols-3` (33% / 33% / 33%)
- Tablet: `grid-cols-2` (50% info+bullets / 50% mockups)
- Mobile: `grid-cols-1` (stacked vertically)

**Column 1 (Info):**
- Status badge (top, using ProductStatusBadge)
- Product name: `text-3xl font-display text-white`
- Tagline: `text-lg text-[#888888] mt-2`
- CTA button: Gold primary button style

**Column 2 (Bullets):**
- Unordered list with gold bullet markers
- Text: `text-base text-[#a3a3a3]`
- Line height: 1.6

**Column 3 (Mockups):**
- Flex container for mockup placeholders
- Desktop mockups: ~200px width
- Mobile mockups: ~100px width
- Use ProductMockupPlaceholder component

**Hover State:**
- Border color transitions to `rgba(212,165,74,0.3)` (gold glow)
- Background shifts to `#0d0d14` (BG_ELEVATED)

**Animation:**
- Fade in + slide up on scroll (staggered by index * 0.1s)

### 4.4 ProductStatusBadge.tsx
**Purpose:** Status indicator pill

**Status Variants:**
```typescript
export const PRODUCT_STATUS_CONFIG = {
  'available': {
    color: '#4ade80',
    bg: 'rgba(74, 222, 128, 0.15)',
    label: 'AVAILABLE',
  },
  'by-request': {
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.15)',
    label: 'BY REQUEST',
  },
  'beta': {
    color: '#d4a54a',
    bg: 'rgba(212, 165, 74, 0.15)',
    label: 'BETA',
  },
} as const;
```

**Style:**
- Pill shape (rounded-full)
- Dot indicator + uppercase label
- Font: mono, 11px, tracking 0.05em, weight 600

### 4.5 ProductMockupPlaceholder.tsx
**Purpose:** Visual placeholder for wireframe images

**Props:**
```typescript
interface ProductMockupPlaceholderProps {
  type: 'desktop' | 'mobile';
  alt: string;
  placeholder: string;
}
```

**Desktop Style:**
- Width: 200px, Height: 125px (16:10 aspect)
- Rounded corners (8px)
- Border: dashed 1px `rgba(255,255,255,0.2)`
- Background: `rgba(255,255,255,0.02)`
- Center icon (monitor SVG) + placeholder text below

**Mobile Style:**
- Width: 80px, Height: 160px (1:2 aspect for phone)
- Rounded corners (12px for phone frame feel)
- Border: dashed 1px `rgba(255,255,255,0.2)`
- Center icon (phone SVG) + placeholder text below

---

## 5. Styling Specifications

### 5.1 Colors (from design-tokens.ts)
```typescript
// Backgrounds
BG_PRIMARY = '#0a0a0f'
BG_SURFACE = '#111114'
BG_ELEVATED = '#0d0d14'

// Text
TEXT_PRIMARY = '#f5f5f5'
TEXT_MUTED = '#888888'
TEXT_DIM = '#555555'

// Accents
GOLD = '#d4a54a'
GREEN = '#4ade80'
BLUE = '#60a5fa'
```

### 5.2 Typography
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Hero headline | Instrument Serif | 48px / 56px | 400 | white |
| Product name | Instrument Serif | 30px | 400 | white |
| Tagline | DM Sans | 18px | 400 | #888888 |
| Bullets | DM Sans | 16px | 400 | #a3a3a3 |
| Status label | JetBrains Mono | 11px | 600 | (status color) |
| Section label | JetBrains Mono | 12px | 500 | #d4a54a |

### 5.3 Spacing
- Page padding: `px-6 md:px-12 lg:px-16`
- Card padding: `p-8` (32px)
- Card margin-bottom: `mb-6` (24px)
- Gap between mockups: `gap-4` (16px)

### 5.4 Animations
```typescript
// Stagger timing
const staggerDelay = 0.1; // seconds between each card

// Card reveal
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6, delay: index * staggerDelay, ease: [0.25, 0.4, 0.25, 1] }}

// Hover
transition={{ duration: 0.2 }}
```

---

## 6. CTA Behavior

### 6.1 Available Products (Talking Docs, Better Contacts)
- Button style: Gold background, dark text
- OnClick: `window.open(externalUrl, '_blank')`
- Or use `<a href={externalUrl} target="_blank" rel="noopener noreferrer">`

### 6.2 Gated Products (M33T, Marketing Automation)
- Button style: Gold background, dark text (same as available)
- OnClick: Navigate to `/contact?product={product.contactFormProduct}`
- Pre-checks the relevant product checkbox on the contact form

---

## 7. Contact Form (Separate Spec Needed)

**Note:** The contact form at `/contact` requires a separate specification. Key requirements captured here:

**Route:** `/contact`

**Fields:**
- Name (required)
- Email (required)
- "I'm interested in:" (checkbox group)
  - [ ] TalkingDocs.ai
  - [ ] Better Contacts
  - [ ] M33T
  - [ ] Marketing Automation
  - [ ] Hard Reset: 33-Day AI Transformation
  - [ ] AI-driven development services
- Message (optional textarea)

**Checkbox descriptions:**
- Hard Reset: "We leave clients with: 1) extensive business context; 2) core data connections and automation; 3) an educated team thinking about what's possible in a whole new way"
- AI-driven development: "We help you build things like a traditional dev firm would... just better, faster, and cheaper."

**Submission:**
- Sends email to `whatsgood@33strategies.ai`
- Shows success confirmation

**Query param support:**
- `/contact?product=m33t` → Pre-checks M33T checkbox
- `/contact?product=marketing-automation` → Pre-checks Marketing Automation checkbox

---

## 8. Responsive Behavior

### 8.1 Desktop (1024px+)
- Hero: Full geometric animation visible
- Cards: 3-column grid layout
- Mockups: Full size placeholders

### 8.2 Tablet (768px - 1023px)
- Hero: Slightly smaller animation
- Cards: 2-column grid (info+bullets | mockups)
- Mockups: Slightly reduced size

### 8.3 Mobile (< 768px)
- Hero: Reduced animation, smaller headline
- Cards: Single column stack (info → bullets → mockups)
- Mockups: Horizontally scrollable or stacked
- Card height: Auto (not fixed 40vh)

---

## 9. Accessibility

- [ ] All images have descriptive alt text
- [ ] Color contrast meets WCAG AA (text on dark backgrounds)
- [ ] Focus states on interactive elements (buttons, links)
- [ ] Status badges use both color AND text labels
- [ ] Semantic HTML structure (main, section, article, nav)
- [ ] Keyboard navigation works for all interactive elements

---

## 10. Performance

- [ ] Use `next/image` for optimized images (when mockups are added)
- [ ] Lazy load cards below the fold
- [ ] Minimize bundle size (tree-shake framer-motion)
- [ ] No layout shift (CLS) — reserve space for mockup placeholders

---

## 11. Testing Checklist

### 11.1 Visual
- [ ] Hero renders with animation
- [ ] All 4 products display correctly
- [ ] Status badges show correct colors and labels
- [ ] Hover states work on cards
- [ ] Mobile layout stacks properly

### 11.2 Functional
- [ ] External links open in new tab (Talking Docs, Better Contacts)
- [ ] Contact form links include product query param
- [ ] Scroll progress bar updates
- [ ] Page loads at `/products` route

### 11.3 Responsive
- [ ] Test at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1280px (desktop)
- [ ] Test at 1920px (large desktop)

---

## 12. Implementation Order

1. **Create data file:** `lib/products.ts`
2. **Create components:**
   - `ProductStatusBadge.tsx`
   - `ProductMockupPlaceholder.tsx`
   - `ProductCard.tsx`
   - `ProductsHero.tsx`
3. **Create page:**
   - `app/products/page.tsx`
   - `app/products/ProductsPageClient.tsx`
4. **Test and refine responsive behavior**
5. **Create contact form** (separate spec/implementation)

---

## 13. Out of Scope (for this spec)

- Individual product detail pages
- Contact form implementation (requires separate spec)
- Navigation link from main landing page
- Real mockup images (using placeholders)
- Analytics tracking
- SEO optimization beyond basic metadata

---

## 14. Open Questions

1. **Progress bar:** Should the products page have a scroll progress bar like the decks, or is that overkill for a simpler page?
2. **Navigation:** Should there be a back link to the main 33strategies.ai landing page?
3. **Footer:** Should the footer include navigation to contact, or just the copyright?

---

*Spec ready for validation.*

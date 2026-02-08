# Landing Page Redesign - Task Breakdown

**Spec:** `specs/feat-landing-page-redesign.md`
**Ideation:** `docs/ideation/landing-page-redesign.md`
**Status:** Ready for Implementation

---

## Phase 1: Foundation (Core Structure)

### Task 1.1: Create directory structure
Create the following file structure under `components/landing/`:
```
components/landing/
├── LandingPage.tsx        # Orchestrator (replace existing)
├── Nav.tsx                # Navigation with hide-on-scroll
├── StickyCtaBar.tsx       # Mobile sticky CTA
├── effects/
│   ├── GoldGlow.tsx       # CSS breathing glow
│   ├── FloatingOrbs.tsx   # CSS floating orbs
│   └── ParticleCanvas.tsx # Canvas particles (desktop)
├── sections/
│   ├── HeroSection.tsx
│   ├── PillarsSection.tsx
│   ├── DrudgerySection.tsx
│   ├── TwoThingsSection.tsx
│   ├── ThreeLayerSection.tsx
│   ├── LongViewSection.tsx
│   ├── ProductsPreviewSection.tsx
│   └── CTASection.tsx
└── components/
    ├── GoldHighlight.tsx  # Gold "you/your" wrapper
    ├── SectionLabel.tsx   # "01 — SECTION" labels
    └── ProductMiniCard.tsx
```

### Task 1.2: Implement GoldGlow.tsx
CSS-only breathing glow effect for hero and CTA sections.
- Radial gradient with gold color
- `@keyframes breathe` animation
- Respects `prefers-reduced-motion`

### Task 1.3: Implement FloatingOrbs.tsx
CSS floating orb components positioned throughout page.
- 2-3 orbs at strategic positions
- Float animation with staggered delays
- Accept `reducedMotion` prop

### Task 1.4: Implement Nav.tsx
Navigation bar with hide-on-scroll behavior.
- Fixed position with backdrop blur
- Hide on scroll down, show on scroll up
- Logo with "33" in gold + "Strategies"
- CTA button: "Start a Conversation"
- Mobile-responsive

### Task 1.5: Implement StickyCtaBar.tsx
Mobile sticky CTA bar.
- Fixed bottom, full-width
- AnimatePresence for enter/exit
- `md:hidden` (mobile only)
- Smooth scroll to #cta section

### Task 1.6: Implement HeroSection.tsx
Full-viewport hero with headline and body.
- Multi-line headline with staggered reveal
- Gold highlighting for "your"
- Scroll indicator with bob animation
- Responsive typography (32-40px mobile, 72-96px desktop)

### Task 1.7: Implement LandingPage.tsx orchestrator
Main component that composes all sections.
- Viewport detection for desktop enhancements
- Scroll detection for sticky bar
- `useReducedMotion` from framer-motion
- Import and render all sections

---

## Phase 2: Content Sections

### Task 2.1: Implement GoldHighlight.tsx
Reusable component for gold "you/your" text.
- Accepts children
- Applies gold color and font-weight

### Task 2.2: Implement SectionLabel.tsx
"01 — SECTION NAME" label component.
- Gold color, mono font
- Uppercase with letter-spacing

### Task 2.3: Implement PillarsSection.tsx
Three pillars "What We Do" section.
- Section label + headline
- 3 pillar cards with icons
- Stacked on mobile, 3-column on desktop
- Hover effects on desktop
- "INCLUDED" badge on third pillar

### Task 2.4: Implement DrudgerySection.tsx
"The Problem" carousel section.
- Split-screen on desktop (text left, carousel right)
- Stacked on mobile
- Auto-advancing carousel (4s mobile, 3s desktop)
- 6 items on mobile, 12 on desktop
- Pause on hover/touch

### Task 2.5: Implement TwoThingsSection.tsx
"The Promise" section.
- Two centered blocks with gold vertical divider
- "Kill the drudgery" + "Make your best thinking..."
- Glass card containers
- Closing statement with gold emphasis

### Task 2.6: Implement ThreeLayerSection.tsx
"How It Works" 3-layer stack.
- Visual stacking with depth
- Foundation layer (01) has gold border + glow
- Connector lines between layers
- Build animation from bottom up

### Task 2.7: Implement LongViewSection.tsx
"The Long View" vision section.
- Narrower max-width for intimacy
- Short paragraph breaks
- "That's not our moat. That's YOURS." climax
- Animated gold underline

---

## Phase 3: Products & Conversion

### Task 3.1: Implement ProductMiniCard.tsx
Compact product preview card.
- Product name, tagline, status badge
- Click links to external URL or `/contact`

### Task 3.2: Implement ProductsPreviewSection.tsx
Featured products showcase.
- 3 products: BetterContacts, MarketingMachine, TalkingDocs
- Stacked on mobile, 3-column on desktop
- "Explore all products →" CTA to `/products`

### Task 3.3: Implement CTASection.tsx
Final conversion section.
- Large breathing glow background
- Primary CTA: "Open the Clarity Canvas" → `/clarity-canvas`
- Secondary CTA: "Schedule a call" → `/contact`
- Gold background on primary, ghost on secondary

---

## Phase 4: Desktop Enhancements

### Task 4.1: Implement ParticleCanvas.tsx
Canvas-based particle system.
- 40 gold particles with slow drift
- Deferred initialization (100ms delay)
- Pause when tab not visible
- Only render on desktop (md+)
- Honor `prefers-reduced-motion`

### Task 4.2: Add desktop layouts
Enhance sections with desktop-specific layouts:
- PillarsSection: 3-column grid
- DrudgerySection: Split-screen (fixed left, carousel right)
- ProductsPreviewSection: 3-column grid
- Add hover effects to cards

### Task 4.3: Add scroll-linked animations
- Progress bar at top
- Parallax effects on hero
- Staggered reveals with longer delays

---

## Phase 5: Polish & Testing

### Task 5.1: Performance verification
- Test FCP/LCP on mobile (target < 2.5s)
- Verify bundle size impact
- Check animation smoothness (60fps)

### Task 5.2: Accessibility verification
- Test with `prefers-reduced-motion`
- Verify heading hierarchy (h1 → h2)
- Check touch target sizes (48px min)
- Verify color contrast

### Task 5.3: Mobile testing
- Test on 375px viewport
- Verify sticky CTA behavior
- Check carousel swipe
- Ensure no horizontal overflow

### Task 5.4: Update metadata and docs
- Update page title/description if needed
- Update CLAUDE.md Application Areas

---

## Dependencies

- `framer-motion` (already installed)
- `lib/design-tokens.ts` for colors
- `lib/products.ts` for product data

## CTA URLs

| CTA | Target URL |
|-----|------------|
| Primary (Clarity Canvas) | `/clarity-canvas` |
| Secondary (Contact) | `/contact` |
| Products Preview | `/products` |
| Product cards | External URLs or `/contact?product={id}` |

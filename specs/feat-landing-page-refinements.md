# Landing Page Content & Layout Refinements

## Status
**Draft** — Ready for Implementation

## Authors
- Claude Code
- Date: 2026-02-07

## Overview

Refine the landing page based on user feedback: update typography rules, rewrite content for scannability, adjust layouts, rename sections, and improve visual hierarchy. All 13 feedback items are addressed.

## Problem Statement

The initial landing page implementation has:
- Word widows and overly long paragraphs reducing readability
- Content that could be more scannable and punchy
- Layout choices that don't match desired visual hierarchy
- Section names that don't maintain consistent naming motif

## Goals

- Codify typography rules in design skill (no widows, max 2 sentences)
- Apply all 13 content/layout changes
- Maintain "THE ___" naming motif across sections
- Left-align all content (remove centering)
- Improve scannability throughout

## Non-Goals

- Adding new sections
- Major architectural changes
- Creating actual image assets (placeholders only)
- Rabbit-holing on stack visualization

---

## Technical Approach

### Files to Modify

**Design System:**
- `.claude/skills/33-strategies-frontend-design.md` - Add typography rules

**Components:**
- `components/landing/Nav.tsx` - Anchor link to #cta
- `components/landing/components/GoldHighlight.tsx` - Keep as-is (usage will change)
- `components/landing/sections/HeroSection.tsx` - Keep gold highlights, fix widows
- `components/landing/sections/PillarsSection.tsx` - Content rewrite, left-align
- `components/landing/sections/DrudgerySection.tsx` - Rename, animation, sans font
- `components/landing/sections/TwoThingsSection.tsx` - Rename, layout, content cuts
- `components/landing/sections/ProductsPreviewSection.tsx` - Rename, reorder
- `components/landing/sections/ThreeLayerSection.tsx` - Rename, content rewrite, visual
- `components/landing/sections/LongViewSection.tsx` - Content, placeholder, left-align
- `components/landing/sections/CTASection.tsx` - Content rewrites
- `components/landing/LandingPage.tsx` - Reorder sections

---

## Implementation Details

### Change 1: Typography Rules in Design Skill

Add to `.claude/skills/33-strategies-frontend-design.md`:

```markdown
## Typography Rules for Scannability

### Word Widows
- **Never allow single-word lines** at the end of headlines or paragraphs
- Minimum 2 words per line
- Use `text-wrap: balance` on headlines to prevent widows
- Manually adjust line breaks if needed with `<br />` at appropriate points

### Paragraph Length
- **Maximum 2 sentences per paragraph** before adding a line break
- Long uninterrupted text blocks cause reader abandonment
- Exception: Small detail copy (descriptions, captions) may have 2-3 lines
- Prefer short, punchy statements over flowing prose

### Line Break Strategy
- Break after complete thoughts
- Use line breaks to create visual rhythm
- Each "chunk" should be digestible in a glance
```

### Change 2: "What We Do" Content Structure

**Current:** Single long paragraph
**New:** Numbered format

```tsx
// PillarsSection.tsx headline area
<motion.div className="mb-10 md:mb-12">
  <p className="text-zinc-400 text-base md:text-lg mb-4">We do two things:</p>
  <ol className="space-y-4 text-xl md:text-2xl font-display">
    <li>
      <span className="text-zinc-500 font-mono text-sm mr-3">1.</span>
      Capture your unique context — how you think, operate, and make decisions.
    </li>
    <li>
      <span className="text-zinc-500 font-mono text-sm mr-3">2.</span>
      Eliminate the intellectual drudgery from your workflows so you can focus on the creative problem-solving you do best.
    </li>
  </ol>
</motion.div>
```

### Change 3: Pillar 3 Headline Options

Present 3 options for user selection:

| Option | Headline | Body |
|--------|----------|------|
| A | PRODUCTS THAT THINK LIKE YOU | The longer you use them, the more they feel like an extension of your own thinking. Included with every engagement. |
| B | YOUR THINKING, AMPLIFIED | Tools that learn how you work and adapt to how you think. Included with every engagement. |
| C | TOOLS THAT LEARN YOUR MIND | They start as products. They become extensions of you. Included with every engagement. |

### Change 4: Drudgery Section Updates

```tsx
// DrudgerySection.tsx
// Rename: "THE PROBLEM" → "THE STRUGGLE"
<SectionLabel number="02" title="The Struggle" />

// Use sans font for carousel items
<p className="text-sm md:text-base leading-relaxed font-body"> // Changed from font-display italic

// Animation: mechanical "click into place" feel
transition={{
  type: 'spring',
  stiffness: 500,  // Higher = snappier
  damping: 30,     // Higher = less bounce
  mass: 0.8,       // Lower = faster
}}
```

### Change 5: Gold Highlight Scope

Only use `<G>` component in HeroSection. Remove from all other sections:
- PillarsSection - remove
- DrudgerySection - remove
- TwoThingsSection - remove
- ThreeLayerSection - remove
- LongViewSection - remove
- CTASection - remove

### Change 6: Nav CTA Anchor Link

```tsx
// Nav.tsx - Change the CTA button
<Link
  href="#cta"  // Changed from /contact
  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
  style={{ border: `1px solid ${GOLD}60`, color: GOLD }}
>
  Start a Conversation
</Link>
```

### Change 7: Two Things Section ("THE PLAYBOOK")

```tsx
// TwoThingsSection.tsx
<SectionLabel number="03" title="The Playbook" />

// Side-by-side layout on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 items-stretch">
  {/* Thing 1 */}
  <div className="p-6 md:p-8 rounded-2xl md:rounded-r-none" style={{...}}>
    <h3>Kill the drudgery.</h3>
    <p>Automate the reformatting, re-explaining, and context-reloading. Keep the creative work.</p>
  </div>

  {/* Plus sign divider */}
  <div className="flex items-center justify-center py-4 md:py-0 md:absolute md:left-1/2 md:-translate-x-1/2">
    <span className="text-3xl font-light" style={{ color: GOLD }}>+</span>
  </div>

  {/* Thing 2 */}
  <div className="p-6 md:p-8 rounded-2xl md:rounded-l-none" style={{...}}>
    <h3>Make your thinking show up everywhere.</h3>
    <p>Your voice, strategy, and frameworks — injected into every workflow automatically.</p>
  </div>
</div>
```

**Content cuts (~40%):**
- Thing 1: "The reformatting, the re-explaining, the context-reloading, the manual labor between your thinking and its execution — automated out of existence. What remains is the rich, creative, decision-making work you're actually here to do."
  → "Automate the reformatting, re-explaining, and context-reloading. Keep the creative work."

- Thing 2: "Your voice. Your strategy. Your decision-making frameworks. Injected into every workflow, every draft, every analysis. Automatically. Without you having to bring it each time."
  → "Your voice, strategy, and frameworks — injected into every workflow automatically."

### Change 8: Section Order & Naming

```tsx
// LandingPage.tsx - Reorder sections
<main>
  <HeroSection />
  <PillarsSection />           {/* 01 — WHAT WE DO */}
  <DrudgerySection />          {/* 02 — THE STRUGGLE */}
  <TwoThingsSection />         {/* 03 — THE PLAYBOOK */}
  <ProductsPreviewSection />   {/* 04 — THE PRODUCTS */}
  <ThreeLayerSection />        {/* 05 — THE 33 STACK */}
  <LongViewSection />          {/* 06 — THE LONG VIEW (or new) */}
  <CTASection />
</main>
```

```tsx
// ProductsPreviewSection.tsx
<SectionLabel number="04" title="The Products" />
```

### Change 9: Three Layer Stack Updates

```tsx
// ThreeLayerSection.tsx
<SectionLabel number="05" title="The 33 Stack" />

const layers = [
  {
    num: '01',
    name: 'Your Context Layer',
    desc: 'Your voice. Your strategy. Your frameworks. The foundation everything else builds on.',
    accent: true,
  },
  {
    num: '02',
    name: 'Data Connections Layer',
    desc: 'Your systems, unified. One source of truth.',
    accent: false,
  },
  {
    num: '03',
    name: 'AI Apps Layer',
    desc: 'Applications that execute your way, using everything below.',
    accent: false,
  },
];
```

### Change 10: Stack Visualization (Offset + Shadow)

```tsx
// ThreeLayerSection.tsx - Add visual depth
{reversedLayers.map((layer, i) => (
  <motion.div
    style={{
      // Offset stacking effect
      marginLeft: `${(2 - i) * 8}px`,  // Bottom layer offset most
      marginRight: `${i * 8}px`,
      boxShadow: layer.accent
        ? `0 4px 24px ${GOLD}15, 0 8px 48px ${GOLD}08`
        : `0 2px 12px rgba(0,0,0,0.3)`,
      // Subtle size difference
      transform: `scale(${1 - (2 - i) * 0.01})`,
    }}
  >
```

### Change 11: Left-Align All Content

Remove `text-center` from:
- SectionLabel component (remove `center` prop usage)
- TwoThingsSection
- LongViewSection
- ProductsPreviewSection
- CTASection

### Change 12: Long View Section Updates

```tsx
// LongViewSection.tsx
<SectionLabel number="06" title="The Long View" />  // Or new headline

// After "...get more precise."
<div className="my-8 md:my-12 rounded-xl overflow-hidden bg-zinc-900/50 aspect-video flex items-center justify-center">
  <p className="text-zinc-600 text-sm font-mono">[Clarity Canvas visualization placeholder]</p>
</div>

// New closing line
<p className="text-xl md:text-2xl font-display" style={{ color: GOLD }}>
  A moat that gets deeper every time you work.
  <br />
  <span className="text-zinc-400">Without you even thinking about it.</span>
</p>
```

**Headline options to present:**
| Option | Headline |
|--------|----------|
| A | THE COMPOUND EFFECT |
| B | INTELLIGENCE THAT COMPOUNDS |
| C | THE DEEPER YOU GO |
| Keep | THE LONG VIEW |

### Change 13: CTA Section Updates

```tsx
// CTASection.tsx
<h2 className="text-2xl md:text-4xl font-display mb-6">
  Let's build something brilliant.
</h2>

// Primary CTA
<Link href="/clarity-canvas">
  Start building your Canvas
</Link>

// Secondary CTA
<Link href="/contact">
  Wanna chat first? Schedule a call
</Link>
```

---

## Testing Approach

1. Visual inspection on mobile (375px) and desktop (1280px)
2. Verify no word widows in headlines
3. Confirm all sections left-aligned
4. Check section order matches spec
5. Verify nav CTA anchors to #cta section
6. Confirm gold highlighting only in hero

---

## Open Questions

1. **Pillar 3 headline:** Which option? A, B, or C?
2. **Long View headline:** Which option? A, B, C, or keep "THE LONG VIEW"?
3. **Stack visualization:** Implement offset/shadow now or defer?

---

## Future Improvements

- Actual image for Long View section (Clarity Canvas spider-web visualization)
- More sophisticated stack 3D visualization
- Animation refinements based on user testing
- A/B testing different headline options

---

## References

- Ideation doc: `docs/ideation/landing-page-content-refinements.md`
- Original spec: `specs/feat-landing-page-redesign.md`
- Design skill: `.claude/skills/33-strategies-frontend-design.md`

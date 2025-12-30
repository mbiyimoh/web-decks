# 33 Strategies Training Decks — Project Reference

> **Purpose:** Reference for building and maintaining 33 Strategies scrollytelling training decks.

---

## Current Deck Inventory

| Deck | Purpose | Status |
|------|---------|--------|
| `ClaudeCodeWorkflowDeck.tsx` | Developer training on the 5-stage Claude Code workflow (Ideate → Spec → Validate → Decompose → Execute) | Active development, includes document viewer system |

---

## Brand: 33 Strategies

### Typography
| Role | Font | Usage |
|------|------|-------|
| Display/Headlines | Playfair Display (serif) | Section titles, key numbers, brand name |
| Body/UI | Inter (sans-serif) | Body text, labels, UI elements |

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background Primary | `#0a0a0a` | Main page background |
| Background Surface | `#111111` | Cards, containers |
| Background Elevated | `#0d0d0d` | Headers, footers, code blocks |
| Text Primary | `#ffffff` | Headlines |
| Text Secondary | `#a3a3a3` (zinc-400) | Body copy |
| Text Muted | `#737373` (zinc-500) | Captions, labels |
| Accent Gold | `#D4A84B` | Primary accent, section labels, CTAs |
| Accent Gold Light | `#E4C06B` | Hover states |
| Accent Green | `#4ADE80` (green-400) | Value/growth concepts, success states |
| Border Default | `#27272a` (zinc-800) | Card borders, dividers |

### Semantic Color Usage
- **Gold** — Section labels, key phrases in headlines, stats, CTAs, interactive elements
- **Green** — Value creation concepts, success states, "we are here" markers
- **Stage Colors** — Pipeline visualizations use stage-specific colors: Ideate=cyan, Validate=green, Decompose=purple, Execute=orange

### Effects
```css
/* Gold glow - use behind key sections */
box-shadow: 0 0 80px rgba(212, 168, 75, 0.15);

/* Background glow orb */
background: rgba(212, 168, 75, 0.1);
border-radius: 9999px;
filter: blur(48px);
```

---

## Content Patterns

### Section Label Format
```tsx
<p className="text-[#D4A84B] text-sm font-medium tracking-[0.2em] uppercase mb-4">
  01 — SECTION NAME
</p>
```

### Headline with Accent
```tsx
<h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-4">
  First part white. <span className="text-[#D4A84B]">Key phrase in gold.</span>
</h2>
```

### Stagger Animation Pattern
Content within sections uses incremental delays (0.05-0.1s increments):
```tsx
<RevealText delay={0}>Title</RevealText>
<RevealText delay={0.1}>Subtitle</RevealText>
<RevealText delay={0.2}>Body</RevealText>
<RevealText delay={0.3}>CTA</RevealText>
```

### Container Width
All sections use `max-w-5xl mx-auto` for consistent width and centering.

---

## Component Patterns

### Card Component
```tsx
const Card = ({ children, className = '', highlight = false }: CardProps) => (
  <div className={`bg-[#111111] border ${highlight ? 'border-[#D4A84B]/50' : 'border-zinc-800'} rounded-2xl p-6 md:p-8 ${className}`}>
    {children}
  </div>
);
```

### CodeBlock Component
```tsx
const CodeBlock = ({ children, className = '' }: CodeBlockProps) => (
  <div className={`bg-[#0d0d0d] border border-zinc-800 rounded-xl p-4 font-mono text-sm overflow-x-auto ${className}`}>
    <pre className="text-zinc-300 whitespace-pre-wrap">{children}</pre>
  </div>
);
```

### Flow Diagram Pattern
```tsx
<div className="flex items-center justify-center gap-2">
  {stages.map((stage, i) => (
    <>
      <div className={`${stage.bgColor} border ${stage.borderColor} rounded-xl p-4 text-center`}>
        <div className="text-2xl mb-2">{stage.icon}</div>
        <div className={`${stage.color} font-semibold`}>{stage.name}</div>
      </div>
      {i < stages.length - 1 && (
        <span className="text-zinc-600 text-xl">→</span>
      )}
    </>
  ))}
</div>
```

### Comparison Cards (Good/Bad)
```tsx
<div className="grid md:grid-cols-2 gap-6">
  <Card className="border-green-500/30">
    <p className="text-green-400 text-sm mb-2">✓ GOOD</p>
    {/* Content */}
  </Card>
  <Card className="border-red-500/30">
    <p className="text-red-400 text-sm mb-2">✗ BAD</p>
    {/* Content */}
  </Card>
</div>
```

---

## Document Viewer System

The Claude Code Workflow deck includes an interactive document viewer for displaying example files (CLAUDE.md, specs, etc.).

### Document Registry
```tsx
type DocumentId = 
  | 'claude-md-example'
  | 'what-were-building'
  | 'how-we-do-shit'
  | 'spec-ideate-output'
  | 'spec-full-example'
  | 'spec-decomposed'
  | 'hook-config';
```

### Panel Behavior
- **Default:** 40% width side panel (right-aligned), main content visible on left
- **Expanded:** 75% width with dark backdrop (toggle via button in header)
- Solid backgrounds (`#0a0a0a`) — no transparency/glassmorphism
- Escape key closes panel

### CTA Component
Visually distinct buttons that trigger the viewer:
```tsx
<button className="inline-flex items-center gap-3 px-4 py-2.5 mt-3
                   bg-[#D4A84B]/10 border border-[#D4A84B]/30 rounded-lg
                   text-[#D4A84B] hover:bg-[#D4A84B]/20 hover:border-[#D4A84B]/50
                   transition-all duration-200 group">
  <span className="text-lg">📄</span>
  <span className="text-sm font-medium">{label}</span>
  <span className="group-hover:translate-x-1 transition-transform">→</span>
</button>
```

### Known Issues
1. **Panel width:** Should open at 40% as side panel but may render full-width. Uses inline `style` props for width/background — needs debugging in real Next.js environment.
2. **Markdown renderer:** Basic implementation. Missing: nested lists, links, images, blockquotes.
3. **Mobile:** Percentage width may be too narrow. Consider full-width on mobile breakpoints.

---

## Deck Structure

Each deck follows this structure:

1. **Title slide** — Brand, deck name, subtitle
2. **Philosophy/thesis** — Core insight or mental model
3. **Framework overview** — High-level view of the system
4. **Detail sections** — One per major concept, with visualizations
5. **Practical application** — Real scenarios, when to use what
6. **Evolution/summary** — How to improve, key takeaways

### Section Array Pattern
```tsx
const sections = [
  { id: 'title', label: 'Title' },
  { id: 'philosophy', label: 'Philosophy' },
  { id: 'overview', label: 'Overview' },
  // ... detail sections
  { id: 'summary', label: 'Summary' },
];
```

---

## Visual Hierarchy

### Background Glows
Place behind key sections for depth:
```tsx
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                w-[500px] h-[300px] bg-[#D4A84B]/10 rounded-full blur-3xl" />
```

### Z-Index Layering
- Glow orbs: default (behind content)
- Content: `z-10` (via `relative z-10`)
- Nav dots: `z-40`
- Progress bar: `z-50`
- Document viewer: `z-50`

### Responsive Patterns
```tsx
// Font sizes
className="text-4xl md:text-5xl lg:text-6xl"

// Padding
className="px-6 md:px-16 lg:px-24"

// Grid columns
className="grid md:grid-cols-2 lg:grid-cols-3"

// Hide on mobile
className="hidden lg:flex"
```

---

## Quick Reference

```
Display Font:     Playfair Display (serif)
Body Font:        Inter (sans-serif)
Primary Accent:   #D4A84B (gold)
Secondary Accent: #4ADE80 (green)
Background:       #0a0a0a
Surface:          #111111
Border:           zinc-800

Section Label:    "01 — NAME" (gold, uppercase, tracking-[0.2em])
Headline:         "White text. Gold accent."
Container Width:  max-w-5xl mx-auto
Card Radius:      rounded-2xl
Code Radius:      rounded-xl
```

---

## Files

| File | Description |
|------|-------------|
| `ClaudeCodeWorkflowDeck.tsx` | Claude Code training deck with document viewer |
| `33-strategies-web-decks-rules` | Canonical design system reference (in project) |

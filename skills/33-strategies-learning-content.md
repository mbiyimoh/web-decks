# 33 Strategies Learning Content Guide

The definitive reference for creating and auditing interactive learning content at 33 Strategies. Use this alongside the `curriculum-strategist` agent to ensure all learning modules meet our pedagogical and design standards.

---

## Core Philosophy

### Quality of Thinking > Right Answers

We develop **judgment and capability**, not memorization. Every piece of content should pass this test:

> "After engaging with this, can the learner apply it independently, adapt it to novel situations, and teach it to others?"

If the answer is no, the content is incomplete.

### The Four Content Criteria

Evaluate all learning content against:

| Criterion | Question | Red Flag |
|-----------|----------|----------|
| **Completeness** | Does the learner have what they need to apply this independently? | "But how do I actually...?" |
| **Clarity** | Is the core insight unmistakable? | Learner can't summarize in one sentence |
| **Leanness** | Is there unnecessary complexity we could cut? | Content that exists "just in case" |
| **Intentionality** | Does every element serve the learning objective? | Filler, tangents, decoration |

### Transfer Over Dependency

Never optimize for "they need to re-watch this." Optimize for "they got it."

The goal is capability that persists beyond the training context.

---

## Progressive Disclosure

Reveal complexity in layers. Every major concept follows this structure:

### The Five-Layer Pattern

```
1. HOOK        → Why should I care?
2. CORE INSIGHT → The one thing to remember
3. FRAMEWORK   → How the parts connect
4. DETAIL      → Specifics for application
5. NUANCE      → Edge cases and advanced patterns
```

**Implementation rule:** Each layer should be its own scroll section or distinct visual unit. Never combine layers in a single viewport.

### Pacing Principles

- **One concept per scroll** — Each viewport teaches one thing
- **Staggered reveals** — Content animates in with deliberate timing (0.05-0.1s increments)
- **Breathing room** — Don't cram; let insights land
- **Progress indicators** — Learners should always know where they are

---

## Memory & Retention Patterns

### Repetition with Variation

The same insight should appear multiple times with different framings:

```
Section 3: "Context is everything"
Section 7: "Remember context is everything? Here's why it matters for specs."
Section 12: "This is context-is-everything applied to debugging."
```

### Callback References

Explicitly connect new concepts to earlier learning:

```tsx
<Card highlight>
  <p className="text-zinc-300">
    <span className="text-[#d4a54a]">Remember the specificity problem?</span>
    {" "}This is where we solve it.
  </p>
</Card>
```

### Consistent Signaling Tropes

Use repeatable visual/verbal patterns that learners anticipate:

| Trope | When to Use | Visual Treatment |
|-------|-------------|------------------|
| **"Theory → Practice"** | Transitioning from concept to application | Green divider with label |
| **"The Core Insight"** | Section's main takeaway | Gold section label |
| **"See It Real"** | Showing actual examples | Document viewer CTA |
| **"Why This Matters"** | Explaining stakes | Highlighted callout card |

### Summary Consolidation

Every module ends with a summary that:
1. Restates the 2-3 key takeaways
2. Uses different language than the original presentation
3. Connects back to the opening hook

---

## Content Architecture Patterns

### Pattern 1: The Core Insight

Every major section has ONE clear takeaway.

```tsx
<Section id="section-name">
  <RevealText>
    <SectionLabel number={N} label="THE CORE INSIGHT" />
  </RevealText>
  <RevealText delay={0.1}>
    <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight mb-8">
      Statement of the insight. <span className="text-[#d4a54a]">Key phrase highlighted.</span>
    </h2>
  </RevealText>
  <RevealText delay={0.2}>
    <p className="text-xl text-zinc-400 mb-8">
      Brief elaboration (1-2 sentences).
    </p>
  </RevealText>
  {/* Visualization or example */}
</Section>
```

### Pattern 2: The Comparison (Side-by-Side)

When teaching distinctions, use parallel cards:

```tsx
<div className="grid md:grid-cols-2 gap-6">
  <Card className="border-red-400/30">
    <p className="text-red-400 text-sm mb-2">✗ WRONG</p>
    <p className="text-zinc-300">{badExample}</p>
    <p className="text-zinc-500 text-sm mt-2">{whyItFails}</p>
  </Card>
  <Card className="border-green-400/30">
    <p className="text-green-400 text-sm mb-2">✓ RIGHT</p>
    <p className="text-zinc-300">{goodExample}</p>
    <p className="text-zinc-500 text-sm mt-2">{whyItWorks}</p>
  </Card>
</div>
```

**Usage:** Correct/incorrect approaches, before/after states, "don't do this / do this" guidance.

### Pattern 3: The Flow (Pipeline/Process)

When teaching sequential processes:

```tsx
<Card className="overflow-hidden">
  <div className="flex items-center justify-between gap-2">
    {stages.map((stage, i, arr) => (
      <React.Fragment key={stage.name}>
        <div className={`flex-1 ${stage.bgColor} border ${stage.borderColor} rounded-xl p-4 text-center`}>
          <div className="text-2xl mb-1">{stage.icon}</div>
          <div className={`${stage.color} text-sm font-semibold`}>{stage.name}</div>
        </div>
        {i < arr.length - 1 && (
          <div className="text-zinc-600 text-xl">→</div>
        )}
      </React.Fragment>
    ))}
  </div>
  {/* Stage descriptions below */}
  <div className="grid gap-2 mt-4 text-center" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
    {stages.map(stage => (
      <div key={stage.name} className="text-zinc-500 text-xs">{stage.description}</div>
    ))}
  </div>
</Card>
```

**Each stage gets its own color** from the palette:
- Cyan (#22d3ee) — Research/discovery
- Gold (#d4a54a) — Decision/specification
- Green (#4ade80) — Validation/success
- Purple (#a78bfa) — Transformation/decomposition
- Orange (#fb923c) — Execution/action

### Pattern 4: The Deep Dive (Two-Level)

For complex topics:

1. **Overview slide** — High-level flow with all stages visible
2. **Detail slides** — One per stage with full explanation

Include a "We Are Here" indicator showing position in the larger flow:

```tsx
const PipelineProgress = ({ current }: { current: string }) => (
  <div className="flex items-center gap-2 mb-8">
    {stages.map(stage => (
      <div
        key={stage.name}
        className={`px-3 py-1 rounded-full text-xs ${
          stage.id === current
            ? 'bg-white text-black font-semibold'
            : 'bg-zinc-800 text-zinc-500'
        }`}
      >
        {stage.name}
      </div>
    ))}
  </div>
);
```

### Pattern 5: The "See It Real" (Document Viewer)

Show actual examples from real projects:

```tsx
<ViewExampleCTA
  documentId="example-id"
  label="See a real example →"
/>
```

**For multiple related examples**, use the grouped document viewer:

```tsx
<ViewExampleCTA
  group={{
    groupId: 'context-examples',
    title: 'Context Examples',
    documents: [
      { id: 'claude-md', title: 'CLAUDE.md', ... },
      { id: 'customgpt', title: 'CustomGPT Instructions', ... },
      { id: 'subagent', title: 'Subagent Definition', ... },
    ]
  }}
  label="See examples →"
/>
```

The viewer includes:
- Tab switcher for multiple documents
- Expand/collapse toggle
- File path display
- Syntax highlighting for code blocks

### Pattern 6: The Transition (Theory → Practice)

Signal application moments with a consistent visual:

```tsx
<RevealText>
  <div className="flex items-center gap-3 mb-6">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-400/50" />
    <span className="text-green-400 text-sm font-medium tracking-wider uppercase">
      Theory → Practice
    </span>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-400/50" />
  </div>
</RevealText>
```

Use this **every time** content moves from concept to application.

---

## Visual Design System

### Typography Hierarchy

| Role | Font | Class | Usage |
|------|------|-------|-------|
| Headlines | Instrument Serif | `font-display` | Section titles, key numbers, "33" brand |
| Body | DM Sans | `font-body` | Explanatory text, descriptions |
| Labels/Code | JetBrains Mono | `font-mono` | Section labels, tags, code snippets |

### Section Labels

Always use the `SectionLabel` component for section headers:

```tsx
<SectionLabel number={1} label="THE CORE INSIGHT" />
```

Output: Gold text, tracking-wider, uppercase, with section number.

### Color Semantics

| Color | Hex | Meaning |
|-------|-----|---------|
| Gold | #d4a54a | Primary accent, key phrases, CTAs |
| Green | #4ade80 | Success, validation, "correct" |
| Red | #f87171 | Errors, warnings, "wrong" |
| Cyan | #22d3ee | Research, discovery, exploration |
| Purple | #a78bfa | Transformation, decomposition |
| Orange | #fb923c | Execution, action, energy |
| Blue | #60a5fa | Information, calm, secondary |

### Card Variants

```tsx
// Standard card
<Card>Content</Card>

// Highlighted card (gold border)
<Card highlight>Key insight or important callout</Card>

// Bordered card (semantic color)
<Card className="border-green-400/30">Success-related content</Card>
```

### Animation Timing

```tsx
// Stagger content within sections
<RevealText delay={0}>Title</RevealText>
<RevealText delay={0.1}>Subtitle</RevealText>
<RevealText delay={0.2}>Body</RevealText>
<RevealText delay={0.3}>CTA</RevealText>

// Use 0.05-0.1s increments
// Never exceed 0.5s total delay in a section
```

---

## Component Reference

### Core Layout Components

| Component | Purpose | Import |
|-----------|---------|--------|
| `Section` | Full-viewport scroll section | `@/components/deck` |
| `RevealText` | Fade-in animation wrapper | `@/components/deck` |
| `Card` | Styled content container | `@/components/deck` |
| `SectionLabel` | Gold section header | `@/components/deck` |
| `CodeBlock` | Syntax-highlighted code | `@/components/deck` |

### Navigation Components

| Component | Purpose | Import |
|-----------|---------|--------|
| `ProgressBar` | Scroll progress indicator | `@/components/deck` |
| `NavDots` | Side navigation (desktop) | `@/components/deck` |

### Interactive Components

| Component | Purpose | Import |
|-----------|---------|--------|
| `ViewExampleCTA` | Opens document viewer | Deck-specific |
| `DocumentViewerPanel` | Slide-in document reader | Deck-specific |
| `ModuleCompleteButton` | Progress tracking | `@/app/learning/components` |
| `VideoCommentary` | Inline video clips with topic badges | `@/components/deck` |
| `VideoCommentaryGrid` | Grid layout for multiple videos | `@/components/deck` |

### Video Commentary

Use `VideoCommentary` for supplemental screen-share clips, pro tips, and context:

```tsx
<VideoCommentary
  id="unique-id"
  title="Video title"
  description="Brief description"
  duration="2:30"
  topic="pro-tip"  // or: deep-dive, quick-take, behind-the-scenes, common-mistake, walkthrough
/>
```

**Topic badges:**
- `pro-tip` (💡 Gold) — Quick tips and shortcuts
- `deep-dive` (🔬 Purple) — Extended explanations
- `quick-take` (⚡ Cyan) — Brief commentary
- `behind-the-scenes` (🎬 Blue) — Real examples, mistakes made
- `common-mistake` (⚠️ Red) — What NOT to do
- `walkthrough` (🚶 Green) — Step-by-step demos

**Placeholder mode:** Omit the `video` prop to show "Video Coming Soon" state.

---

## Engagement Hooks

### Headlines That Provoke

```
✓ "A shitty LLM can execute a great plan brilliantly."
✓ "Voice is Google Fiber to your brain."
✓ "The AI doesn't know what you didn't tell it."

✗ "Introduction to AI Workflows"
✗ "Understanding Context"
✗ "Best Practices for Specifications"
```

### Concrete Stakes

Always answer "why should I care?" with specifics:

```
✓ "This is the difference between 10 minutes and 2 hours."
✓ "Without this, you'll rebuild what already exists."
✓ "This catches 80% of bugs before they're written."

✗ "This is important."
✗ "This will help you."
✗ "This is a best practice."
```

### Unexpected Analogies

Connect technical concepts to visceral experiences:

```
✓ "Prompting without context is like cooking without seasoning."
✓ "Typing is the shitty wifi at that overpriced coffee shop."
✓ "Nobody wants your unseasoned chicken."
```

---

## Quality Assurance Checklist

### Before Publishing, Verify:

**Content Structure**
- [ ] Every section has ONE clear core insight
- [ ] Progressive disclosure: hook → insight → framework → detail → nuance
- [ ] "Theory → Practice" transitions mark all application moments
- [ ] Summary section restates key takeaways in different words

**Memory & Retention**
- [ ] Key concepts repeated with variation across sections
- [ ] Callback references connect new concepts to earlier learning
- [ ] Consistent signaling tropes used throughout

**Visual Design**
- [ ] Section labels use `SectionLabel` component
- [ ] Cards use semantic border colors
- [ ] Animation delays properly staggered (0.05-0.1s increments)
- [ ] One concept per viewport

**Examples & Evidence**
- [ ] At least one "See It Real" document viewer per major concept
- [ ] Comparison patterns show wrong/right side-by-side
- [ ] Code examples are from real projects, not toy examples

**Flow & Pacing**
- [ ] Navigation dots label all sections meaningfully
- [ ] No two concepts in the same section
- [ ] Module can be completed in 10-15 minutes

**Accessibility**
- [ ] All sections have unique IDs
- [ ] Color contrast meets WCAG standards
- [ ] Animations respect reduced-motion preferences

---

## Red Flags to Catch

| Red Flag | Symptom | Fix |
|----------|---------|-----|
| **Cognitive overload** | Too many concepts per section | Split into multiple sections |
| **Toy examples** | Examples too simple to transfer | Use real project examples |
| **Missing the "why"** | Learners follow steps without understanding | Add stakes/motivation |
| **No application** | Theory without practice | Add "Theory → Practice" section |
| **Pattern breaks** | Inconsistent visual treatment | Audit against this guide |
| **Missing callbacks** | Concepts feel disconnected | Add explicit references to earlier sections |

---

## Creating New Modules

### 1. Start with Learning Objectives

Before writing any content, answer:
- What should the learner be able to DO after this module?
- What's the ONE core insight that unlocks everything else?
- What misconceptions might they bring that we need to address?

### 2. Outline with Patterns

Map your content to the standard patterns:
```
1. Title (Hook)
2. Core Insight (Core Insight Pattern)
3. Why It Matters (Stakes + Comparison Pattern)
4. The Framework (Flow Pattern)
5. Detail 1 (Deep Dive Pattern)
6. Detail 2 (Deep Dive Pattern)
7. Application (Theory → Practice + See It Real)
8. Summary (Consolidation)
```

### 3. Write the Core Insight First

The core insight headline should be:
- One sentence
- Contains a tension or surprise
- Highlights the key phrase in gold
- Memorable enough to quote

### 4. Build Examples Before Prose

Find or create real examples first, then write the explanatory content around them. This ensures the "See It Real" pattern isn't an afterthought.

### 5. Audit Against This Guide

Before marking complete, run through the Quality Assurance Checklist.

---

## Auditing Existing Content

When reviewing content for compliance, check:

1. **Does every section have a core insight?** Look for the pattern: SectionLabel → Headline with highlighted phrase → Brief elaboration.

2. **Are comparisons using the right visual pattern?** Side-by-side cards with semantic colors (red/green).

3. **Are processes showing the full flow?** Pipeline visualization with stage colors and descriptions.

4. **Are there "See It Real" moments?** Document viewer CTAs for major concepts.

5. **Are transitions marked?** "Theory → Practice" dividers before application sections.

6. **Is pacing appropriate?** One concept per scroll, proper animation staggering.

7. **Are callbacks present?** References to earlier sections using "Remember X? Here's why it matters for Y."

Use the `curriculum-strategist` agent alongside this guide for comprehensive audits.

---

## Reference: Example Document Structure

```tsx
// Standard learning module structure

export default function ModuleName() {
  const sections = [
    { id: 'title', label: 'Welcome' },
    { id: 'core-insight', label: 'The Core Insight' },
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'the-framework', label: 'The Framework' },
    { id: 'detail-1', label: 'Detail 1' },
    { id: 'detail-2', label: 'Detail 2' },
    { id: 'application', label: 'Applying This' },
    { id: 'summary', label: 'Summary' },
  ];

  return (
    <DocumentViewerProvider>
      <div className="bg-[#0a0a0f] text-white min-h-screen font-sans">
        <ProgressBar />
        <NavDots sections={sections} activeSection={activeSection} />
        <DocumentViewerPanel />

        {/* TITLE - Hook */}
        <Section id="title">...</Section>

        {/* CORE INSIGHT - The one thing */}
        <Section id="core-insight">
          <SectionLabel number={1} label="THE CORE INSIGHT" />
          <h2>Statement. <span className="text-[#d4a54a]">Key phrase.</span></h2>
          ...
        </Section>

        {/* WHY IT MATTERS - Stakes */}
        <Section id="why-it-matters">
          {/* Comparison pattern or concrete stakes */}
        </Section>

        {/* THE FRAMEWORK - How parts connect */}
        <Section id="the-framework">
          {/* Flow pattern */}
        </Section>

        {/* DETAILS - Deep dives */}
        <Section id="detail-1">
          {/* Deep dive pattern with "We Are Here" */}
        </Section>

        {/* APPLICATION - Theory to Practice */}
        <Section id="application">
          {/* Theory → Practice transition */}
          {/* See It Real examples */}
        </Section>

        {/* SUMMARY - Consolidation */}
        <Section id="summary">
          {/* 2-3 key takeaways, different wording */}
        </Section>

        <ModuleCompleteButton courseId="..." moduleId="..." />
      </div>
    </DocumentViewerProvider>
  );
}
```

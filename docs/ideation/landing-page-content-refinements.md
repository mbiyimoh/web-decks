# Landing Page Content & Layout Refinements

**Slug:** landing-page-content-refinements
**Author:** Claude Code
**Date:** 2026-02-07
**Branch:** feature/landing-page-refinements
**Related:** `specs/feat-landing-page-redesign.md`, `docs/ideation/landing-page-redesign.md`

---

## 1) Intent & Assumptions

**Task brief:** Refine the landing page based on 13 specific pieces of user feedback covering typography rules, content rewrites, layout changes, and section renaming to make the page more scannable, resonant, and on-brand.

**Assumptions:**
- All changes are refinements to the existing implementation
- Content changes should preserve core messaging while improving clarity
- Typography rules should be codified in the design skill for future use
- "Stack" visualization research should be quick (no rabbit-holing)

**Out of scope:**
- Adding new sections beyond what exists
- Major architectural changes
- Actual image assets (placeholders only)

---

## 2) Feedback Catalog

### Feedback #1: Typography Rules (Word Widows & Paragraph Length)
**Type:** Design System Update + Content Fix
**Issue:** "answers" sits alone on second line; paragraphs too long
**Rules to codify:**
- Never allow word widows (single word on last line) - minimum 2 words per line
- Maximum 2 sentences per paragraph before line break
- Long text blocks cause abandonment
- Small detail copy is the exception where 2+ lines are acceptable

### Feedback #2: "What We Do" Content Structure
**Type:** Content Rewrite
**Issue:** One long block of text
**Solution:** Break into numbered format:
1. Capture your unique context...
2. Eliminate intellectual drudgery to free up time/headspace for creative problem-solving

### Feedback #3: Pillar 3 Headline Options
**Type:** Content Exploration
**Current:** "PRODUCTS THAT WORK FOR YOU"
**Goal:** Convey "products that understand you deeply and feel like an extension of your thought"
**3 Options to pitch:**
1. "PRODUCTS THAT THINK LIKE YOU"
2. "YOUR THINKING, AMPLIFIED"
3. "TOOLS THAT LEARN YOUR MIND"

### Feedback #4: Drudgery Carousel Refinements
**Type:** Content + Animation Update
**Changes:**
- Rename section: "THE PROBLEM" → "THE STRUGGLE"
- Use sans font for bullet items (more readable)
- Animation: Ease in/out like mechanical dial "clicking into place"

### Feedback #5: Gold "You" Highlight Scope
**Type:** Content Fix
**Change:** Only apply gold highlighting to "you/your" in hero section, nowhere else

### Feedback #6: Nav CTA Anchor Link
**Type:** Functionality Fix
**Change:** "Start a Conversation" button should anchor to #cta section

### Feedback #7: Two Things Section Layout
**Type:** Layout + Content Update
**Changes:**
- Rename: "THE PROMISE" → "THE PLAYBOOK"
- Side-by-side on desktop with "+" between tiles
- Stacked on mobile with "+" between
- Cut detail text by ~40% while preserving sentiment
- Replace vertical line divider with "+"

### Feedback #8: Section Order & Naming
**Type:** Layout Update
**Changes:**
- Move "OUR PRODUCTS" to right after "THE PLAYBOOK"
- Rename: "OUR PRODUCTS" → "THE PRODUCTS"
- Maintains "THE ___" naming motif

### Feedback #9: Three Layer Stack Updates
**Type:** Content Rewrite
**Changes:**
- Rename: "HOW IT WORKS" → "THE 33 STACK"
- Cut detail text by ~60%
- Rename "Business Context Layer" → "Your Context Layer"
- Reference earlier language: "Your voice. Your strategy. Your decision-making frameworks."

### Feedback #10: Stack Visualization
**Type:** Visual Enhancement
**Goal:** Make it look more like actual stacked layers vs 3 rectangles
**Approach:** Quick research for inspiration, keep simple

### Feedback #11: Left-Align All Content
**Type:** Layout Fix
**Change:** Remove all text centering, left-align everything

### Feedback #12: Long View Section Updates
**Type:** Content + Layout Update
**Changes:**
- Add image placeholder after "...get more precise." and before "And none of this..."
- Change closing: "That's not our moat. That's yours." → "A moat that gets deeper every time you work. Without you even thinking about it."
- 3 headline options to pitch

### Feedback #13: CTA Section Updates
**Type:** Content Rewrite
**Changes:**
- Headline: "Start capturing your unique context" → "Let's build something brilliant"
- Primary CTA: "Open the Clarity Canvas →" → "Start building your Canvas"
- Secondary CTA: "Wanna chat with us first? Schedule a call" → "Wanna chat first? Schedule a call"

---

## 3) Research: Stack Visualization Patterns

Quick visual research for layered/stack patterns:

**Common Approaches:**
1. **Offset stacking** - Each layer slightly offset (x/y) to show depth
2. **Shadow depth** - Progressively larger shadows for layers below
3. **Size gradation** - Bottom layer slightly wider than top
4. **Connecting lines** - Dotted/solid lines between layers
5. **Isometric view** - 3D angled perspective
6. **Platform metaphor** - Layers as platforms with visual thickness

**Recommendation:** Use offset stacking with shadow depth - subtle but effective, maintains simplicity.

---

## 4) Content Drafts

### Feedback #3: Pillar 3 Headlines

**Option A: "PRODUCTS THAT THINK LIKE YOU"**
- Direct, clear
- Implies intelligence + personalization

**Option B: "YOUR THINKING, AMPLIFIED"**
- Emphasizes extension of self
- Active, empowering

**Option C: "TOOLS THAT LEARN YOUR MIND"**
- Emphasizes learning/adaptation
- Slightly more technical

**Body copy revision:**
Current: "Tools born from our own workflows that kill drudgery and extend your best thinking — included with every consulting or build engagement."

Proposed: "The longer you use them, the more they feel like an extension of your own thinking. Included with every engagement."

### Feedback #12: Long View Headlines

**Option A: "THE COMPOUND EFFECT"**
- Business/strategy language
- Implies accumulation over time

**Option B: "INTELLIGENCE THAT COMPOUNDS"**
- More specific to AI context
- Active, not passive

**Option C: "THE DEEPER YOU GO"**
- Conversational, inviting
- Implies journey/depth

---

## 5) Section Order (After Changes)

1. HERO (no label)
2. 01 — WHAT WE DO
3. 02 — THE STRUGGLE
4. 03 — THE PLAYBOOK
5. 04 — THE PRODUCTS
6. 05 — THE 33 STACK
7. 06 — THE LONG VIEW (or new headline)
8. CTA (no label)

---

## 6) Clarification Needed

1. **Pillar 3 headline preference?** Options A, B, or C?
2. **Long View headline preference?** Options A, B, or C? Or keep "THE LONG VIEW"?
3. **Stack visualization depth?** Should we implement offset stacking now or defer to future?

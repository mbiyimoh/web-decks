# Coming Soon Landing Page

**Slug:** coming-soon-landing-page
**Author:** Claude Code
**Date:** 2024-12-13
**Branch:** feat/coming-soon-landing
**Related:** Client portal architecture implementation

---

## 1) Intent & Assumptions

- **Task brief:** Create a "Coming Soon" landing page for 33strategies.ai featuring the 33 Strategies wordmark/logo, the tagline "Build brilliant things with brilliant people.", and a subtle geometric animation reminiscent of a loading animation.

- **Assumptions:**
  - Use existing Framer Motion for animations (already in project)
  - Dark theme consistent with rest of site (black background, white text)
  - No logo file exists - will create geometric "33" using code
  - Animation should be subtle and tasteful, not distracting
  - Mobile responsive design

- **Out of scope:**
  - Backend functionality
  - Form submissions / email capture
  - Complex multi-page interactions
  - Heavy asset loading (videos, images)

## 2) Pre-reading Log

- `components/landing/LandingPage.tsx`: Current simple landing with basic Framer Motion fade-in. Uses "33" as large text with "Strategies" underneath.
- `styles/globals.css`: Minimal global styles, dark theme base
- `tailwind.config.ts`: Custom fonts configured (display + body), no custom animations defined
- `CLAUDE.md`: Design tokens mention amber as accent color, Space Grotesk for headlines, Inter for body

## 3) Codebase Map

- **Primary components/modules:**
  - `components/landing/LandingPage.tsx` - Will be replaced with new coming soon design
  - `app/page.tsx` - Imports LandingPage, no changes needed

- **Shared dependencies:**
  - Framer Motion (already installed)
  - Tailwind CSS
  - Space Grotesk font (display)
  - Inter font (body)

- **Design tokens:**
  - Background: black (#000000)
  - Text: white, zinc-400, zinc-500
  - Accent: amber-500 (#f59e0b)

- **Potential blast radius:**
  - Only affects root landing page
  - No impact on client portals

## 4) Root Cause Analysis

N/A - This is a new feature, not a bug fix.

## 5) Research

### Potential Animation Approaches

1. **Rotating geometric shapes (triangles/hexagons)**
   - Pros: Elegant, evokes strategy/planning themes
   - Cons: Could feel generic

2. **Orbiting dots/particles around "33"**
   - Pros: Subtle, reminiscent of loading, constellation-like
   - Cons: May feel too "techy"

3. **Pulsing/breathing gradient glow**
   - Pros: Minimal, sophisticated, ambient
   - Cons: Less "geometric" feel

4. **Interconnected lines forming network/constellation**
   - Pros: Strategic feel, evokes connections and planning
   - Cons: Complex to implement well

5. **Rotating concentric circles/rings with dots**
   - Pros: Geometric, subtle motion, clock/time metaphor
   - Cons: Needs careful timing to avoid feeling busy

### Recommendation

**Option 5: Concentric rotating rings with subtle dots** - This provides:
- Clear geometric aesthetic
- Subtle animation that doesn't distract
- Evokes strategy/planning (compass, time, precision)
- Works well as ambient background behind "33" wordmark
- Easy to implement with Framer Motion

Implementation: Create 2-3 concentric circles with small dots at cardinal points, rotating at different speeds. Use low opacity and subtle amber accent glow.

## 6) Clarifications

User has already specified:
1. ✅ Wordmark: "33 Strategies"
2. ✅ Tagline: "Build brilliant things with brilliant people."
3. ✅ Style: Subtle, tasteful geometric animation
4. ✅ Theme: Coming soon messaging

No additional clarifications needed - requirements are clear.

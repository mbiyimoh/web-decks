# WSBC Final Proposal — Project Brief & PRD

## Overview

Create a unified WSBC proposal by combining the generic M33T platform introduction deck with the Wisconsin-specific interactive demo, adding transition slides, and implementing a strategic brand color shift that moves from 33 Strategies gold (during the M33T intro) to Wisconsin red (during the demo) and back to 33 Strategies gold (for the business proposal sections).

---

## Source Files

Two React/JSX files will be provided:

1. **M33T-Platform-Deck-v2.jsx** — Generic M33T platform deck with problem narrative and polished iPhone mockups
2. **WisconsinProposal-Full.jsx** — Wisconsin-specific proposal with interactive demo, trading cards, and tier pricing

---

## Brand Color Strategy

This proposal uses a deliberate color journey to create emotional impact:

| Section | Primary Accent Color | Rationale |
|---------|---------------------|-----------|
| Slides 1-3 (M33T Intro) | 33 Strategies Gold (`#D4A84B`) | We're introducing OUR platform |
| Slide 4 (Transition) | Gold | Still "us" talking |
| Slides 5+ (WSBC Demo) | Wisconsin Red (`#c5050c`) | Immersive demo in THEIR brand |
| "WAIT" Moment | Animated red → gold shift | Powerful brand reclaim |
| Post-Demo (Tiers, Pricing) | 33 Strategies Gold | Back to business proposal |

---

## Detailed Slide Structure

### SECTION A: M33T Platform Introduction (Gold Branding)

**Slide 1: The Problem**
- Source: M33T-Platform-Deck-v2.jsx, first content slide
- Content: "The expectation" vs "The reality" comparison
- Shows idealized networking expectation vs actual awkward reality
- iPhone mockups with iOS status bars (keep exactly as built)
- Accent color: Gold

**Slide 2: What If**
- Source: M33T-Platform-Deck-v2.jsx, second content slide
- Content: "What if the connection happened before the handshake?"
- Reframes the problem into possibility
- Accent color: Gold

**Slide 3: Introducing M33T**
- Source: M33T-Platform-Deck-v2.jsx, third content slide
- Content: M33T platform introduction with key value props
- iPhone mockups showing interview and matches screens
- Accent color: Gold

---

### SECTION B: Transition to Demo (Gold → Red)

**Slide 4: NEW — Demo Transition**
- Create from scratch
- Layout: Centered, minimal, dramatic
- Copy (large display text): "Rather than just telling you about M33T..."
- Copy (secondary): "...let us show you what it could look like for WSBC"
- CTA Button: "Experience It →" (gold accent, on dark background)
- On button click: Smooth dissolve/fade transition into the Instagram Stories invite (Slide 5)
- Transition effect: Crossfade or opacity dissolve (not a hard cut)
- Accent color: Gold (this is still "us" speaking)

---

### SECTION C: WSBC Interactive Demo (Wisconsin Red Branding)

**Slide 5: Instagram Stories Invite**
- Source: WisconsinProposal-Full.jsx, Instagram stories mockup section
- Content: "You're Invited" story-style invite to WSBC VIP Experience
- This is where Wisconsin red takes over
- All interactive elements, tap-to-advance behavior preserved

**Slides 6+: Full Demo Flow**
- Source: WisconsinProposal-Full.jsx, all demo sections
- Includes:
  - AI interview conversation
  - Trading card generation with flip animation
  - Matches reveal with connection cards
  - Any other interactive demo elements
- All styling uses Wisconsin red as primary accent
- Preserve all existing animations and interactions

---

### SECTION D: The "WAIT" Moment (Red → Gold Transition)

**Slide N: "WAIT" Brand Reclaim**
- Source: WisconsinProposal-Full.jsx (this slide already exists)
- Content: "WAIT. Now imagine ALL of your VIP attendees having this experience"
- **Critical animation:** The word "WAIT" starts in Wisconsin red and animates to 33 Strategies gold
  - Animation: Color interpolation over ~1 second, triggered on scroll into view
  - This is the emotional pivot point — subtle but powerful
  - Rest of the slide content should also transition to gold palette
- From this point forward, ALL content uses 33 Strategies gold

---

### SECTION E: Tier Presentation (Gold Branding)

**Scrollytelling Tier Section**
- Source: WisconsinProposal-Full.jsx tier section, but with UPDATED content
- Visual treatment: Scrollytelling with sticky elements or progressive reveal
- Accent color: Gold

**Updated Tier Definitions:**

**Level 1: VIP Digital Experience**
- M33T platform access for VIP attendees only
- Full interview → profile → matching → curated connections flow
- Digital networking experience
- Suggested headline: "Elevate Your VIPs"

**Level 2: Full Digital Experience**
- Everything in Level 1
- PLUS M33T platform access for student attendees
- Two separate but connected networks (VIPs can match with promising students, students can match with each other)
- Suggested headline: "Connect Your Entire Conference"

**Level 3: Full Experience + VIP Track**
- Everything in Level 2
- PLUS curated VIP-only programming and content side-track
- 33 Strategies handles event planning and coordination for VIP track
- Includes in-person facilitated networking woven throughout VIP programming
- Intimate 1-on-1 curated connections running in parallel with main conference
- Suggested headline: "The Complete VIP Experience"

**Tier Presentation Notes:**
- Each tier should build on the previous (additive, not replacement)
- Visual treatment should show the "stacking" or "unlocking" of features
- Level 3 should feel premium and comprehensive

---

### SECTION F: Pricing & Next Steps (Gold Branding)

**Pricing Section**
- Source: WisconsinProposal-Full.jsx pricing section, updated with new tiers
- Display all three tiers with clear visual hierarchy
- Level 3 should be visually emphasized as the recommended/premium option
- Accent color: Gold

**Contact/CTA Section**
- Source: WisconsinProposal-Full.jsx final section
- Clear next steps and contact information
- Accent color: Gold

---

## Technical Requirements

### Animation & Transitions

1. **Slide 4 → Slide 5 Transition**
   - Dissolve/crossfade effect when clicking "Experience It" button
   - Duration: ~800ms
   - Easing: ease-in-out

2. **"WAIT" Color Animation**
   - Trigger: On scroll into view (useInView or Intersection Observer)
   - Animation: `color` property interpolation from `#c5050c` to `#D4A84B`
   - Duration: ~1000ms
   - Easing: ease-out
   - Should feel smooth and intentional, not jarring

3. **All Existing Animations**
   - Preserve all animations from both source files
   - Trading card flips, match reveals, scroll animations, etc.

### Color System

Implement as CSS variables or constants for easy management:

```javascript
const colors = {
  // 33 Strategies
  gold: '#D4A84B',
  goldLight: '#E4C06B',
  goldDim: '#B8923F',
  
  // Wisconsin
  red: '#c5050c',
  redLight: '#e25959',
  redDim: '#9b0000',
  
  // Neutrals (shared)
  bgPrimary: '#0a0a0a',
  bgSurface: '#111111',
  textPrimary: '#ffffff',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
};
```

### Section-Based Theming

Create a mechanism to apply different accent colors to different sections. Options:
- CSS custom property that changes per section
- React context for theme color
- Simple prop passing to components

The key requirement: Components should be reusable with different accent colors.

### Responsive Behavior

- Preserve all responsive breakpoints from source files
- Mobile-first approach
- iPhone mockups should maintain proper aspect ratios at all sizes

### Scroll Behavior

- Preserve scrollytelling behavior from both source files
- Smooth scroll snapping if present in originals
- Progress indicators if present in originals

---

## Component Structure Recommendation

```
WSBCFinalProposal/
├── index.jsx (main orchestrator)
├── sections/
│   ├── M33TIntro.jsx (Slides 1-3, gold theme)
│   ├── DemoTransition.jsx (Slide 4, gold theme)
│   ├── WSBCDemo.jsx (Interactive demo, red theme)
│   ├── WaitMoment.jsx (Animated transition, red→gold)
│   ├── TierPresentation.jsx (Scrollytelling tiers, gold theme)
│   └── PricingCTA.jsx (Final section, gold theme)
├── components/
│   ├── iPhoneMockup.jsx (reusable, from M33T deck)
│   ├── TradingCard.jsx (from WSBC proposal)
│   ├── MatchCard.jsx (from both sources)
│   └── ... other shared components
└── styles/
    └── theme.js (color constants)
```

This is a suggestion — implementation can be a single file if that's simpler for deployment.

---

## Content Updates Checklist

- [ ] Slide 4 copy: "Rather than just telling you about M33T... let us show you what it could look like for WSBC"
- [ ] Slide 4 button: "Experience It →"
- [ ] Level 1 tier: VIP Digital Experience (update name and description)
- [ ] Level 2 tier: Full Digital Experience (update name and description)
- [ ] Level 3 tier: Full Experience + VIP Track (update name and description)
- [ ] Verify "WAIT" moment copy matches: "WAIT. Now imagine ALL of your VIP attendees having this experience"

---

## Quality Checklist

- [ ] Gold accent appears in Slides 1-4 (M33T intro)
- [ ] Wisconsin red appears in demo sections (Slides 5 through "WAIT")
- [ ] "WAIT" word animates from red to gold on scroll
- [ ] All content after "WAIT" uses gold accent
- [ ] Dissolve transition works from Slide 4 → Slide 5
- [ ] All existing animations preserved (cards, mockups, reveals)
- [ ] iPhone mockups have iOS status bars with proper icons
- [ ] Text alignment: left-justified except centered elements (icons, avatars, buttons)
- [ ] Three tiers display correctly with updated content
- [ ] Mobile responsive behavior works correctly
- [ ] No console errors

---

## Files to Deliver

Single React/JSX file: `WSBC-Final-Proposal.jsx`

Should be self-contained and deployable as a standalone React component, similar to the source files provided.

---

## Reference Screenshots

The iPhone mockup styling, iOS status bars, and proper proportions from M33T-Platform-Deck-v2.jsx should be maintained exactly. These have been polished to senior designer standards.

---

## Questions for Implementer

1. Does the existing WisconsinProposal-Full.jsx "WAIT" moment already have the red→gold animation, or does it need to be added?
2. Are there any navigation/progress indicators in either source file that should be preserved or unified?
3. Should the demo section have an explicit "Exit Demo" moment, or does the "WAIT" slide serve that purpose?

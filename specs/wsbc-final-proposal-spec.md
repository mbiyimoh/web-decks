# WSBC Final Proposal — Implementation Specification

## Overview

Create a unified WSBC proposal deck by merging the M33T platform introduction with the Wisconsin-specific interactive demo, implementing a strategic brand color journey, and deploying it as a password-protected client portal.

**Source Files:**
- `client-proposals-and-presentations/WSBC/M33T-Platform-Deck-v2.jsx` (1139 lines)
- `client-proposals-and-presentations/WSBC/WisconsinProposal-Full.jsx` (1349 lines)
- `client-proposals-and-presentations/WSBC/final-proposal-deck-merge-project-brief.md`

**Target Location:**
- `components/clients/wsbc/WSBCFinalProposal.tsx`

---

## Part 1: Unified Deck Implementation

### 1.1 Color Constants

Use direct color constants (matching source file patterns—no theming abstraction needed):

```typescript
// 33 Strategies Gold (used in M33T intro + post-WAIT sections)
const GOLD = '#D4A84B';
const GOLD_LIGHT = '#E4C06B';
const GOLD_DIM = '#B8923F';
const GOLD_GLOW = 'rgba(212, 168, 75, 0.15)';

// Wisconsin Red (used in demo sections only)
const WISCONSIN_RED = '#c5050c';
const WISCONSIN_RED_LIGHT = '#e23636';
const WISCONSIN_RED_DIM = '#8b0000';
const WISCONSIN_RED_GLOW = 'rgba(197, 5, 12, 0.15)';

// Shared neutrals
const BG_PRIMARY = '#0a0a0a';
const BG_SURFACE = '#111111';
const BG_ELEVATED = '#1a1a1a';
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECONDARY = '#a3a3a3';
const TEXT_MUTED = '#737373';
const TEXT_DIM = '#525252';
```

**Usage Pattern:** Each section uses its color constants directly. No runtime theming needed—only the WAIT moment requires dynamic color transition (handled via CSS transition).

### 1.2 Slide Structure & Content Mapping

| Slide | Source | Theme | Content | Notes |
|-------|--------|-------|---------|-------|
| 1 | M33T-Platform-Deck-v2.jsx:584-748 | Gold | "The Problem" - Expectation vs Reality | Copy iPhone mockups and section exactly |
| 2 | M33T-Platform-Deck-v2.jsx:753-793 | Gold | "What If" + Match Card Tease | Keep MatchCardTease component |
| 3 | M33T-Platform-Deck-v2.jsx:798-877 | Gold | "Introducing M33T" with iPhone mockups | Keep IPhoneMockup, InterviewScreenMockup, MatchesScreenMockup |
| 4 | **NEW** | Gold | Demo Transition - "Experience It" | Create from scratch (see spec below) |
| 5+ | WisconsinProposal-Full.jsx:290-354 | Red | IntroStories component | Adapt, remove auto-advance for demo context |
| 6+ | WisconsinProposal-Full.jsx:376-466 | Red | Interview component | Keep as-is |
| 7+ | WisconsinProposal-Full.jsx:472-767 | Red | HolographicTradingCard | Keep as-is |
| 8+ | WisconsinProposal-Full.jsx:772-806 | Red | GeneratingMatches | Keep as-is |
| 9+ | WisconsinProposal-Full.jsx:812-873 | Red | MatchReveal | Keep as-is |
| N | WisconsinProposal-Full.jsx:1054-1220 | **Red→Gold** | PitchScrolly ("WAIT" moment) | Modify animation (see spec below) |
| N+1 | WisconsinProposal-Full.jsx:1225-1315 | Gold | Proposal/Pricing (updated tiers) | Update tier content (see spec below) |

### 1.3 Navigation Architecture

**Critical clarification:** The deck uses two navigation modes that must work together seamlessly.

| Section | Navigation Mode | Behavior |
|---------|-----------------|----------|
| M33T Intro (slides 1-4) | **Scroll-based** | Single scrollable container with 4 viewport sections |
| "Experience It" button | **Click to proceed** | Triggers fade-out, switches to demo mode |
| WSBC Demo | **Phase-based** | Internal state machine (from original Wisconsin file) |
| PitchScrolly | **Scroll-based** | Returns to scroll navigation for tier reveal |
| Proposal | **Scroll-based** | Continues scrollable through end |

**Transition Flow:**
1. User scrolls through M33T intro sections (slides 1-4)
2. User clicks "Experience It" → fade-out (0.8s)
3. Demo fades in (0.8s) and takes over with phase-based navigation
4. Demo completes → Confirmation → transitions to PitchScrolly
5. PitchScrolly and Proposal are scroll-based again

**Back Navigation Decision:**
- Demo is **one-way** — no return to M33T intro slides
- Back buttons within demo phases are preserved (navigate within demo only)
- After demo, no back navigation to demo (forward-only narrative)

### 1.4 NEW: Slide 4 - Demo Transition

Create a new component for the transition between M33T intro and WSBC demo:

```tsx
const DemoTransition = ({ onStartDemo }: { onStartDemo: () => void }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = () => {
    setIsTransitioning(true);
    // Delay to allow fade-out before switching
    setTimeout(onStartDemo, 800);
  };

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      position: 'relative',
      textAlign: 'center',
      opacity: isTransitioning ? 0 : 1,
      transition: 'opacity 0.8s ease-in-out',
    }}>
      {/* Gold glow behind */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        height: 500,
        background: `radial-gradient(circle, ${colors.gold}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 420, position: 'relative', zIndex: 10 }}>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 36,
          fontWeight: 400,
          color: colors.textPrimary,
          marginBottom: 24,
          lineHeight: 1.3,
        }}>
          Rather than just telling you about M33T...
        </h2>

        <p style={{
          fontSize: 20,
          color: colors.textSecondary,
          marginBottom: 48,
          lineHeight: 1.5,
        }}>
          ...let us show you what it could look like for <span style={{ color: colors.gold, fontWeight: 500 }}>WSBC</span>
        </p>

        <button
          onClick={handleClick}
          style={{
            padding: '18px 48px',
            borderRadius: 14,
            border: 'none',
            background: colors.gold,
            color: colors.bgPrimary,
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${colors.goldGlow}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          Experience It
          <span style={{ fontSize: 20 }}>→</span>
        </button>
      </div>
    </section>
  );
};
```

**Transition Effect Requirements:**
- Button click triggers opacity fade-out (0.8s ease-in-out)
- After fade completes, switch to WSBC demo phase
- Demo entry (IntroStories) must fade in with matching 0.8s transition:
  ```tsx
  // In parent, when entering demo mode:
  const [demoVisible, setDemoVisible] = useState(false);

  // After switching to demo phase, trigger fade-in:
  useEffect(() => {
    if (phase === 'demo') {
      requestAnimationFrame(() => setDemoVisible(true));
    }
  }, [phase]);

  // Demo wrapper:
  <div style={{
    opacity: demoVisible ? 1 : 0,
    transition: 'opacity 0.8s ease-in-out',
  }}>
    {/* Demo content */}
  </div>
  ```

### 1.5 CRITICAL: "WAIT" Moment Color Animation

Modify the PitchScrolly component's intro section to animate the "Wait..." text from Wisconsin red to gold:

```tsx
// In PitchScrolly component, add state for color animation
const [waitAnimated, setWaitAnimated] = useState(false);
const waitRef = useRef<HTMLParagraphElement>(null);

// Trigger animation when section scrolls into view
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !waitAnimated) {
        setWaitAnimated(true);
      }
    },
    { threshold: 0.5 }
  );

  if (waitRef.current) observer.observe(waitRef.current);
  return () => observer.disconnect();
}, [waitAnimated]);

// The "Wait..." text with color animation
<p
  ref={waitRef}
  style={{
    fontSize: 13,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: 16,
    color: waitAnimated ? colors.gold : colors.red,
    transition: 'color 1s ease-out',
    opacity: introAnimated ? 1 : 0,
  }}
>
  Wait...
</p>
```

**Animation Specifications:**
- Trigger: When "WAIT" section scrolls into view (IntersectionObserver, threshold: 0.5)
- Color transition: `#c5050c` (red) → `#D4A84B` (gold)
- Duration: 1000ms
- Easing: ease-out
- The rest of the slide content should also be in gold from this point forward

### 1.6 UPDATED: Tier Definitions

Replace existing tier content with new definitions:

```typescript
const tiers = [
  {
    level: 1,
    name: 'VIP Digital Experience',
    headline: 'Elevate Your VIPs',
    tagline: 'M33T platform access for VIP attendees',
    description: 'Give your VIP attendees the full M33T experience—AI-powered interviews, personalized profiles, curated matches, and conversation starters before they arrive.',
    features: [
      'M33T platform access for all VIP attendees',
      'AI interview → profile → matching flow',
      'Curated connections with match rationale',
      'Personalized conversation starters',
      'Digital networking dashboard',
      'Post-event connection analytics',
    ],
    outcome: 'VIPs arrive knowing exactly who to meet and why',
  },
  {
    level: 2,
    name: 'Full Digital Experience',
    headline: 'Connect Your Entire Conference',
    tagline: 'VIP access + student attendee network',
    description: 'Extend M33T to your student attendees. Two connected networks—VIPs match with promising students, students match with each other.',
    features: [
      'Everything in Level 1',
      'M33T platform access for student attendees',
      'Separate but connected matching pools',
      'VIP-to-student connections enabled',
      'Student-to-student networking',
      'Cross-network visibility controls',
    ],
    outcome: 'Your entire conference arrives connected and purposeful',
    recommended: true,  // Highlight this tier
  },
  {
    level: 3,
    name: 'Full Experience + VIP Track',
    headline: 'The Complete VIP Experience',
    tagline: 'Digital + curated in-person programming',
    description: 'The ultimate VIP experience. Everything digital, plus a curated VIP-only programming track running in parallel with the main conference.',
    features: [
      'Everything in Level 2',
      'VIP-only programming side-track',
      '33 Strategies event planning & coordination',
      'In-person facilitated networking sessions',
      'Intimate 1-on-1 curated connections',
      'Private VIP lounge and executive roundtables',
      'Concierge-level service throughout',
    ],
    outcome: 'VIPs experience a conference designed entirely for them',
    premium: true,  // Visual emphasis
  },
];
```

**Tier Presentation Requirements:**
- Visual treatment should show "stacking" or "unlocking" of features
- Each tier builds on the previous (additive, not replacement)
- Level 2 should be marked as "Recommended" or "Most Popular"
- Level 3 should feel premium and comprehensive
- All tier sections use Gold accent color

**Pricing:** TBD — carry over original pricing ($8k/$15k/$25k) or leave as "Contact for pricing" until client confirms.

### 1.7 State Management Architecture (Simplified)

Use a **4-phase macro architecture**. Each phase manages its own internal state:

```typescript
type Phase = 'intro' | 'demo' | 'pitch' | 'proposal';

const [phase, setPhase] = useState<Phase>('intro');
```

| Phase | Content | Internal Navigation | Color |
|-------|---------|---------------------|-------|
| `intro` | M33T slides 1-4 | Scroll-based (no internal state needed) | Gold |
| `demo` | Wisconsin demo | **Reuse original phase machine** from WisconsinProposal-Full.jsx | Red |
| `pitch` | PitchScrolly | Scroll-based | Red→Gold |
| `proposal` | Pricing/CTA | Scroll-based | Gold |

**Key insight:** The Wisconsin demo already has a complete internal phase machine (lines 1320-1341). Reuse it directly rather than flattening into the parent.

```tsx
// Parent component structure:
export default function WSBCFinalProposal() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [demoVisible, setDemoVisible] = useState(false);

  // Handle demo entry fade-in
  useEffect(() => {
    if (phase === 'demo') {
      requestAnimationFrame(() => setDemoVisible(true));
    } else {
      setDemoVisible(false);
    }
  }, [phase]);

  return (
    <div style={{ background: BG_PRIMARY, minHeight: '100vh' }}>
      {phase === 'intro' && (
        <M33TIntroSection onStartDemo={() => setPhase('demo')} />
      )}

      {phase === 'demo' && (
        <div style={{ opacity: demoVisible ? 1 : 0, transition: 'opacity 0.8s ease-in-out' }}>
          <WSBCDemoSection onComplete={() => setPhase('pitch')} />
        </div>
      )}

      {phase === 'pitch' && (
        <PitchScrollySection onComplete={() => setPhase('proposal')} />
      )}

      {phase === 'proposal' && (
        <ProposalSection />
      )}
    </div>
  );
}
```

**WSBCDemoSection:** Copy the entire WisconsinProposalEnhanced component (lines 1320-1348) and rename. It already has internal phase management for stories→interview→card→matches→confirmation. Just wire `onComplete` to its final confirmation button.

### 1.8 Component Reuse Strategy

**From M33T-Platform-Deck-v2.jsx (copy directly):**
- `IPhoneMockup` component (lines 105-182)
- `InterviewScreenMockup` component (lines 187-362)
- `MatchesScreenMockup` component (lines 367-484)
- `MatchCardTease` component (lines 35-100)
- Problem section layout (lines 584-748)
- "What If" section layout (lines 753-793)
- "Introducing M33T" section (lines 798-877)

**From WisconsinProposal-Full.jsx (copy with theme adaptation):**
- `AmbientBackground` component (lines 131-213) - parameterize color
- `Avatar` component (lines 229-237) - parameterize color
- `WisconsinLogo` component (lines 240-248) - keep as-is for demo sections
- `IntroStories` component (lines 290-354)
- `Interview` component (lines 376-466)
- `HolographicTradingCard` component (lines 472-767)
- `GeneratingMatches` component (lines 772-806)
- `MatchReveal` and related components (lines 812-1030)
- `PitchScrolly` component (lines 1054-1220) - modify for red→gold animation
- `Proposal` component (lines 1225-1315) - update tier content

### 1.9 Scroll & Navigation Behavior

**Progress Bar:**
- Fixed at top of viewport
- Color matches current section theme (gold or red)
- Smooth width transition as user scrolls

**Section Navigation Dots (Desktop only):**
- Fixed on right side
- Show for M33T intro sections and final pitch/proposal
- Hidden during interactive demo phases (demo manages its own navigation)

**Scroll Snapping:**
- Optional: enable for M33T intro sections
- Disable during interactive demo (uses phase transitions, not scroll)

---

## Part 2: Client Portal Implementation

### 2.1 Environment Configuration

The password is already configured:
```bash
# .env (already updated per user)
WSBC_PASSWORD=BuckinghamBadger2026.
```

### 2.2 Client Registry Update

Add WSBC to `lib/clients.ts`:

```typescript
import dynamic from 'next/dynamic';

// Lazy-load WSBC component
const WSBCFinalProposal = dynamic(
  () => import('@/components/clients/wsbc/WSBCFinalProposal'),
  { ssr: true }
);

// Add to CLIENTS object:
'wsbc': {
  id: 'wsbc',
  name: 'WSBC',
  passwordEnvVar: 'WSBC_PASSWORD',
  content: [
    {
      slug: 'final-proposal',
      type: 'deck' as const,
      title: 'WSBC VIP Experience Proposal',
      description: 'Interactive proposal for the Wisconsin Sports Business Conference VIP experience',
      addedOn: '2024-12-27',
      component: WSBCFinalProposal,
    },
  ],
},
```

### 2.3 Component File Structure

Create a single file (matching source patterns):

```
components/
└── clients/
    └── wsbc/
        └── WSBCFinalProposal.tsx    # Single file containing all components
```

**Rationale:** Both source files are single-file components. Maintain this pattern for consistency and deployment simplicity. All sub-components (IPhoneMockup, Interview, etc.) are defined inline within the main file.

### 2.4 Routing (Automatic)

With the client registry update, these routes will work automatically:

| Route | Behavior |
|-------|----------|
| `/client-portals/wsbc` | Shows password gate, then content index |
| `/client-portals/wsbc/final-proposal` | Shows the merged deck (after auth) |

### 2.5 Authentication Flow

Uses existing patterns from PLYA:
1. User visits `/client-portals/wsbc`
2. Server checks session via iron-session
3. If not authenticated: render `PasswordGate` with `clientId="wsbc"`
4. User enters password `BuckinghamBadger2026.`
5. POST to `/api/auth/wsbc` validates password
6. Session cookie set with `clientId: 'wsbc'`
7. Page refreshes to show `ContentIndex` with deck listing
8. User clicks deck → navigates to `/client-portals/wsbc/final-proposal`

---

## Implementation Tasks

### Phase 1: Setup & Scaffolding
1. [ ] Create `components/clients/wsbc/WSBCFinalProposal.tsx`
2. [ ] Add color constants and Phase type
3. [ ] Create parent component shell with 4-phase state machine
4. [ ] Register WSBC client in `lib/clients.ts`

### Phase 2: M33T Intro Section (Gold)
5. [ ] Copy M33T components (IPhoneMockup, screen mockups, MatchCardTease)
6. [ ] Build M33TIntroSection with slides 1-3 as scrollable sections
7. [ ] Add DemoTransition component (slide 4) with fade-out behavior
8. [ ] Wire "Experience It" button to trigger phase change

### Phase 3: Demo Section (Red)
9. [ ] Copy WSBCDemoSection from WisconsinProposal-Full.jsx (lines 1320-1348 + all dependencies)
10. [ ] Add fade-in wrapper for demo entry
11. [ ] Wire demo completion to trigger pitch phase

### Phase 4: Pitch & Proposal (Red→Gold)
12. [ ] Copy PitchScrolly component with WAIT animation modification
13. [ ] Update tier content with new definitions
14. [ ] Copy Proposal component with updated tiers
15. [ ] Wire pitch completion to proposal phase

### Phase 5: Integration & Polish
16. [ ] Test complete flow: scroll → click → demo → scroll → end
17. [ ] Verify color journey: gold → red → gold
18. [ ] Test WAIT color animation triggers on scroll
19. [ ] Mobile responsive check
20. [ ] Verify portal auth with password "BuckinghamBadger2026."

---

## Quality Checklist (from Project Brief)

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
- [ ] Portal authentication works with password "BuckinghamBadger2026."

---

## Technical Notes

### TypeScript Considerations
- Convert JSX to TSX with proper type annotations
- Define interfaces for props, state, and mock data
- Use `'use client'` directive at top of file

### Animation Libraries
- Continue using inline styles with CSS animations (matching source files)
- Framer Motion available if needed but not required for consistency

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- iPhone mockups should maintain aspect ratio at all sizes

### Performance Considerations
- Lazy-load the component via Next.js dynamic import
- Consider extracting heavy sub-components for code splitting
- Minimize re-renders during scroll (use refs for DOM measurements)

---

## Open Questions from Project Brief

1. **Does the existing WisconsinProposal-Full.jsx "WAIT" moment already have the red→gold animation?**
   - Answer: No. It currently uses `GOLD_ACCENT` for the "Wait..." text. Need to implement red→gold transition.

2. **Are there any navigation/progress indicators in either source file that should be preserved or unified?**
   - M33T deck has: progress bar + section dots
   - Wisconsin demo has: phase-based navigation (no scroll indicators during interactive phases)
   - Recommendation: Progress bar throughout, section dots only for scrollable sections

3. **Should the demo section have an explicit "Exit Demo" moment, or does the "WAIT" slide serve that purpose?**
   - The "WAIT" slide effectively serves as the demo exit, transitioning both visually (color) and conceptually (from demo to pitch). No additional exit needed.

---

## File Deliverable

**Primary:** `components/clients/wsbc/WSBCFinalProposal.tsx`

Self-contained React component deployable as part of the web-decks Next.js application. Should export a default function component that renders the complete merged proposal.

---

## Estimated Scope

- **Lines of Code:** ~2000-2200 (merged from ~2500 source lines, simplified state management)
- **New Code:** ~150-200 lines (DemoTransition, WAIT animation, parent orchestration)
- **Complexity:** Medium (simplified 4-phase architecture, reusing existing demo state machine)
- **Time Estimate:** 2-3 hours for experienced implementer

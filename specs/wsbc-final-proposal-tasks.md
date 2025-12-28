# Task Breakdown: WSBC Final Proposal

**Generated:** 2024-12-27
**Source:** specs/wsbc-final-proposal-spec.md

## Overview

Merge two existing JSX decks (M33T Platform + Wisconsin Demo) into a unified WSBC proposal with strategic brand color journey, deployed as a password-protected client portal.

**Target File:** `components/clients/wsbc/WSBCFinalProposal.tsx`
**Estimated LOC:** ~2000-2200
**Complexity:** Medium

---

## Phase 1: Setup & Scaffolding

### Task 1.1: Create file structure and register client
**Description:** Create the WSBC component file and register in client portal system
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** None (must complete first)

**Implementation Steps:**

1. Create directory: `components/clients/wsbc/`
2. Create file: `WSBCFinalProposal.tsx` with basic shell
3. Update `lib/clients.ts` to register WSBC client

**Code for lib/clients.ts:**
```typescript
// Add import at top
const WSBCFinalProposal = dynamic(
  () => import('@/components/clients/wsbc/WSBCFinalProposal'),
  { ssr: true }
);

// Add to clients object
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

**Initial WSBCFinalProposal.tsx shell:**
```tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// COLOR CONSTANTS
// ============================================================================
// 33 Strategies Gold (M33T intro + post-WAIT sections)
const GOLD = '#D4A84B';
const GOLD_LIGHT = '#E4C06B';
const GOLD_DIM = '#B8923F';
const GOLD_GLOW = 'rgba(212, 168, 75, 0.15)';

// Wisconsin Red (demo sections only)
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

// ============================================================================
// TYPES
// ============================================================================
type Phase = 'intro' | 'demo' | 'pitch' | 'proposal';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function WSBCFinalProposal() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [demoVisible, setDemoVisible] = useState(false);

  // Handle demo fade-in
  useEffect(() => {
    if (phase === 'demo') {
      requestAnimationFrame(() => setDemoVisible(true));
    } else {
      setDemoVisible(false);
    }
  }, [phase]);

  return (
    <div style={{ background: BG_PRIMARY, minHeight: '100vh', color: TEXT_PRIMARY }}>
      {phase === 'intro' && (
        <div>M33T Intro Section (TODO)</div>
      )}

      {phase === 'demo' && (
        <div style={{
          opacity: demoVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out'
        }}>
          Demo Section (TODO)
        </div>
      )}

      {phase === 'pitch' && (
        <div>Pitch Section (TODO)</div>
      )}

      {phase === 'proposal' && (
        <div>Proposal Section (TODO)</div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] File exists at `components/clients/wsbc/WSBCFinalProposal.tsx`
- [ ] Client registered in `lib/clients.ts`
- [ ] Route `/client-portals/wsbc` shows password gate
- [ ] Route `/client-portals/wsbc/final-proposal` accessible after auth
- [ ] No TypeScript/build errors

---

## Phase 2: M33T Intro Section (Gold Theme)

### Task 2.1: Copy M33T reusable components
**Description:** Extract and copy iPhone mockup and screen components from M33T deck
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1
**Can run parallel with:** None

**Components to copy from M33T-Platform-Deck-v2.jsx:**

1. **IPhoneMockup** (lines 105-182): Realistic iPhone frame with notch, status bar
2. **InterviewScreenMockup** (lines 187-362): Interview UI inside iPhone
3. **MatchesScreenMockup** (lines 367-484): Matches display inside iPhone
4. **MatchCardTease** (lines 35-100): Match card preview component

**Key adaptations:**
- Change color references from inline to use GOLD constant
- Keep all existing styling and animations intact
- Ensure status bar shows proper iOS icons (battery, wifi, signal)

**Acceptance Criteria:**
- [ ] All 4 components copied and adapted
- [ ] iPhone mockups render correctly with gold accents
- [ ] Status bars display properly
- [ ] No visual regressions from original

---

### Task 2.2: Build M33TIntroSection with slides 1-3
**Description:** Create scrollable intro with Problem, What If, and Introducing M33T sections
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.1
**Can run parallel with:** None

**Section structure (all scroll-based, gold theme):**

**Slide 1: The Problem** (M33T-Platform-Deck-v2.jsx:584-748)
- "The expectation" vs "The reality" comparison
- Two iPhone mockups side by side
- Left: idealized networking scenario
- Right: awkward reality scenario

**Slide 2: What If** (M33T-Platform-Deck-v2.jsx:753-793)
- "What if the connection happened before the handshake?"
- MatchCardTease component
- Reframes problem into possibility

**Slide 3: Introducing M33T** (M33T-Platform-Deck-v2.jsx:798-877)
- M33T platform intro with value props
- Two iPhone mockups: interview + matches screens

**Component structure:**
```tsx
const M33TIntroSection = ({ onStartDemo }: { onStartDemo: () => void }) => {
  return (
    <div style={{ /* scrollable container */ }}>
      {/* Slide 1: The Problem */}
      <section style={{ minHeight: '100vh', /* ... */ }}>
        {/* Problem content with iPhones */}
      </section>

      {/* Slide 2: What If */}
      <section style={{ minHeight: '100vh', /* ... */ }}>
        {/* What If content with MatchCardTease */}
      </section>

      {/* Slide 3: Introducing M33T */}
      <section style={{ minHeight: '100vh', /* ... */ }}>
        {/* M33T intro with iPhone mockups */}
      </section>

      {/* Slide 4: Demo Transition */}
      <DemoTransition onStartDemo={onStartDemo} />
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] All 3 slides render with proper content
- [ ] Scroll behavior works smoothly
- [ ] Gold accent color used throughout
- [ ] iPhone mockups display correctly
- [ ] Responsive on mobile/tablet

---

### Task 2.3: Implement DemoTransition component (Slide 4)
**Description:** Create the "Experience It" transition slide with fade-out behavior
**Size:** Small
**Priority:** High
**Dependencies:** Task 2.2
**Can run parallel with:** None

**Full implementation:**
```tsx
const DemoTransition = ({ onStartDemo }: { onStartDemo: () => void }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = () => {
    setIsTransitioning(true);
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
        background: `radial-gradient(circle, ${GOLD}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 420, position: 'relative', zIndex: 10 }}>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 36,
          fontWeight: 400,
          color: TEXT_PRIMARY,
          marginBottom: 24,
          lineHeight: 1.3,
        }}>
          Rather than just telling you about M33T...
        </h2>

        <p style={{
          fontSize: 20,
          color: TEXT_SECONDARY,
          marginBottom: 48,
          lineHeight: 1.5,
        }}>
          ...let us show you what it could look like for{' '}
          <span style={{ color: GOLD, fontWeight: 500 }}>WSBC</span>
        </p>

        <button
          onClick={handleClick}
          style={{
            padding: '18px 48px',
            borderRadius: 14,
            border: 'none',
            background: GOLD,
            color: BG_PRIMARY,
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 8px 32px ${GOLD_GLOW}`,
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

**Acceptance Criteria:**
- [ ] Renders centered with gold glow background
- [ ] Copy matches spec exactly
- [ ] Button click triggers 0.8s fade-out
- [ ] After fade, triggers `onStartDemo` callback
- [ ] Responsive on mobile

---

## Phase 3: Demo Section (Red Theme)

### Task 3.1: Copy Wisconsin demo components and state machine
**Description:** Extract entire demo flow from WisconsinProposal-Full.jsx
**Size:** Large
**Priority:** High
**Dependencies:** Task 2.3
**Can run parallel with:** None

**Components to copy from WisconsinProposal-Full.jsx:**

1. **Utility components:**
   - `AmbientBackground` (lines 131-213)
   - `Avatar` (lines 229-237)
   - `WisconsinLogo` (lines 240-248)
   - `Breathing` animation wrapper (lines 250-258)
   - `ExpandableSection`, `DetailItem` (lines 530-552)

2. **Mock data:**
   - `PHASES` constant (lines 24-35)
   - `MOCK_USER_PROFILE` (lines 36-85)
   - `MOCK_MATCHES` (lines 87-125)
   - `ALL_ATTENDEES` (lines 127-180 if present, or similar)

3. **Demo phase components:**
   - `IntroStories` (lines 290-354)
   - `Interview` (lines 376-466)
   - `HolographicTradingCard` (lines 472-767)
   - `GeneratingMatches` (lines 772-806)
   - `MatchReveal` (lines 851-873)
   - `MatchPreviewCard` (lines 812-848)
   - `MatchDetail` (lines 875-915)
   - `AllAttendeesGrid` (lines 950-982)
   - `AttendeeSummaryCard` (lines 920-948)
   - `AttendeeDetail` (lines 985-1029)
   - `Confirmation` (lines 1035-1048)

4. **Main demo state machine** (lines 1320-1348):
```tsx
const WSBCDemoSection = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(PHASES.INTRO_STORIES);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedAttendee, setSelectedAttendee] = useState(null);

  const renderPhase = () => {
    switch (phase) {
      case PHASES.INTRO_STORIES:
        return <IntroStories onComplete={() => setPhase(PHASES.INTERVIEW)} />;
      case PHASES.INTERVIEW:
        return <Interview onComplete={() => setPhase(PHASES.CARD_PREVIEW)} />;
      case PHASES.CARD_PREVIEW:
        return <HolographicTradingCard profile={MOCK_USER_PROFILE} onConfirm={() => setPhase(PHASES.GENERATING)} />;
      case PHASES.GENERATING:
        return <GeneratingMatches onComplete={() => setPhase(PHASES.MATCHES_REVEAL)} />;
      case PHASES.MATCHES_REVEAL:
        return <MatchReveal
          onSelectMatch={(m) => { setSelectedMatch(m); setPhase(PHASES.MATCH_DETAIL); }}
          onContinue={onComplete}  // Wire to parent's onComplete!
          onViewAll={() => setPhase(PHASES.ALL_ATTENDEES)}
        />;
      // ... other cases
      case PHASES.CONFIRMATION:
        return <Confirmation onContinue={onComplete} />;  // Wire to parent!
      default:
        return <IntroStories onComplete={() => setPhase(PHASES.INTERVIEW)} />;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 480, minHeight: '100vh', margin: '0 auto' }}>
      {renderPhase()}
    </div>
  );
};
```

**Key adaptations:**
- All components use WISCONSIN_RED constants
- Wire `onComplete` callback to parent when demo finishes
- Remove any skip-to-end debug buttons
- Ensure Confirmation's "Continue" button triggers `onComplete`

**Acceptance Criteria:**
- [ ] All demo phases work: stories → interview → card → generating → matches → confirmation
- [ ] All interactions preserved (tap, swipe, click)
- [ ] HolographicTradingCard flip animation works
- [ ] Match cards display and are clickable
- [ ] "Continue" at end triggers parent phase transition
- [ ] Demo uses Wisconsin red throughout

---

### Task 3.2: Wire demo fade-in and completion
**Description:** Connect demo section to parent with proper transitions
**Size:** Small
**Priority:** High
**Dependencies:** Task 3.1
**Can run parallel with:** None

**Parent component update:**
```tsx
export default function WSBCFinalProposal() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [demoVisible, setDemoVisible] = useState(false);

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
        <div style={{
          opacity: demoVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out'
        }}>
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

**Acceptance Criteria:**
- [ ] Demo fades in over 0.8s when entering demo phase
- [ ] Demo completion triggers transition to pitch phase
- [ ] No visual jank during transitions
- [ ] Demo phase is one-way (no back to intro)

---

## Phase 4: Pitch & Proposal (Red→Gold)

### Task 4.1: Copy and modify PitchScrolly with WAIT animation
**Description:** Implement the "WAIT" section with red→gold color animation
**Size:** Medium
**Priority:** High
**Dependencies:** Task 3.2
**Can run parallel with:** None

**Copy from WisconsinProposal-Full.jsx lines 1054-1220**

**Critical modification - WAIT color animation:**
```tsx
const PitchScrollySection = ({ onComplete }: { onComplete: () => void }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [introAnimated, setIntroAnimated] = useState(false);
  const [waitAnimated, setWaitAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const waitRef = useRef<HTMLParagraphElement>(null);

  // Trigger intro animation on mount
  useEffect(() => {
    setTimeout(() => setIntroAnimated(true), 100);
  }, []);

  // WAIT color animation trigger
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

  // ... scroll handler ...

  return (
    <div ref={containerRef} style={{ height: '100vh', overflowY: 'auto', background: BG_PRIMARY }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.1)', zIndex: 100 }}>
        <div style={{
          height: '100%',
          background: waitAnimated ? GOLD : WISCONSIN_RED,  // Also transitions!
          width: `${scrollProgress * 100}%`,
          transition: 'width 0.1s ease-out, background 1s ease-out'
        }} />
      </div>

      {/* SECTION 0: The "Wait..." Intro */}
      <section className="pitch-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '64px 24px' }}>
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          background: `radial-gradient(circle, ${waitAnimated ? GOLD : WISCONSIN_RED}20 0%, transparent 70%)`,
          transition: 'background 1s ease-out',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 380, textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {/* THE CRITICAL ANIMATED TEXT */}
          <p
            ref={waitRef}
            style={{
              fontSize: 13,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 16,
              color: waitAnimated ? GOLD : WISCONSIN_RED,
              transition: 'color 1s ease-out',
              opacity: introAnimated ? 1 : 0,
            }}
          >
            Wait...
          </p>

          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 28,
            color: TEXT_PRIMARY,
            marginBottom: 20,
            lineHeight: 1.3,
            opacity: introAnimated ? 1 : 0,
            transform: introAnimated ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.3s'
          }}>
            Now imagine every VIP at your conference having this experience.
          </h1>

          <p style={{
            fontSize: 16,
            color: TEXT_SECONDARY,
            lineHeight: 1.6,
            opacity: introAnimated ? 1 : 0,
            transform: introAnimated ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.6s'
          }}>
            Pre-event intelligence. Curated connections. Conversations that actually matter.
          </p>
        </div>

        {/* Scroll hint */}
        {/* ... */}
      </section>

      {/* SECTION 1-3: Tier reveals (all use GOLD after WAIT) */}
      {/* Update SectionContent to use GOLD for icon, level label, highlight */}

      {/* Final section has button */}
      <SectionContent
        icon="🎯"
        level="Level 3: The Full VIP Track"
        headline="While students attend their sessions, executives have"
        highlightText="their own curated experience."
        body="..."
        showButton={true}
        onButtonClick={onComplete}
      />
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] "Wait..." text starts in Wisconsin red
- [ ] On scroll into view, animates to gold over 1s
- [ ] Background glow also transitions
- [ ] Progress bar color transitions
- [ ] All subsequent content uses gold
- [ ] "See the packages" button triggers `onComplete`

---

### Task 4.2: Update tier content and Proposal section
**Description:** Replace tier definitions and copy Proposal component
**Size:** Medium
**Priority:** High
**Dependencies:** Task 4.1
**Can run parallel with:** None

**Updated tier definitions:**
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
    recommended: true,
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
    premium: true,
  },
];
```

**Copy Proposal component** from WisconsinProposal-Full.jsx lines 1225-1315:
- Update packages array with new tier content
- Keep pricing at $8k/$15k/$25k (or update if directed)
- Ensure all accent colors use GOLD
- Update CTA to use 33 Strategies branding

**Acceptance Criteria:**
- [ ] All three tiers display with updated content
- [ ] Tier 2 marked as "Recommended"
- [ ] Tier 3 marked as "White Glove" or premium
- [ ] Expandable tier cards work
- [ ] FAQs section preserved
- [ ] CTA section with contact info
- [ ] All gold accent colors

---

## Phase 5: Integration & Polish

### Task 5.1: Full flow integration test
**Description:** Test complete deck flow end-to-end
**Size:** Small
**Priority:** High
**Dependencies:** Task 4.2
**Can run parallel with:** None

**Test scenarios:**
1. Load `/client-portals/wsbc/final-proposal`
2. Scroll through M33T intro (slides 1-4)
3. Click "Experience It" - verify fade transition
4. Complete demo flow (stories → interview → card → matches → confirmation)
5. Verify "Wait..." animates red → gold on scroll
6. Scroll through tier reveals
7. Verify proposal section displays correctly

**Acceptance Criteria:**
- [ ] Complete flow works without errors
- [ ] All phase transitions smooth
- [ ] Color journey: gold → red → gold
- [ ] No console errors
- [ ] No visual glitches

---

### Task 5.2: Mobile responsive verification
**Description:** Test and fix responsive behavior
**Size:** Small
**Priority:** Medium
**Dependencies:** Task 5.1
**Can run parallel with:** None

**Breakpoints to test:**
- Mobile: 375px, 414px (iPhone sizes)
- Tablet: 768px, 1024px
- Desktop: 1280px, 1440px

**Key areas:**
- iPhone mockups maintain aspect ratio
- Text sizes scale appropriately
- Demo fits in mobile viewport
- Buttons are tappable (44px min touch target)
- No horizontal scroll

**Acceptance Criteria:**
- [ ] Works on iPhone SE (375px)
- [ ] Works on iPhone 14 Pro (393px)
- [ ] Works on iPad (768px)
- [ ] Desktop layout correct
- [ ] Touch targets adequate

---

### Task 5.3: Portal authentication verification
**Description:** Verify password protection works
**Size:** Small
**Priority:** High
**Dependencies:** Task 5.1
**Can run parallel with:** Task 5.2

**Test scenarios:**
1. Visit `/client-portals/wsbc` without auth → should show password gate
2. Enter wrong password → should show error
3. Enter "BuckinghamBadger2026." → should authenticate
4. Visit `/client-portals/wsbc/final-proposal` → should show deck
5. Clear cookies, visit deck URL → should redirect to login

**Acceptance Criteria:**
- [ ] Password gate renders for unauthenticated users
- [ ] Wrong password shows error message
- [ ] Correct password grants access
- [ ] Session persists across pages
- [ ] Direct deck URL protected

---

## Dependency Graph

```
Task 1.1 (Setup)
    │
    ▼
Task 2.1 (M33T components)
    │
    ▼
Task 2.2 (M33T intro slides)
    │
    ▼
Task 2.3 (DemoTransition)
    │
    ▼
Task 3.1 (Demo components)
    │
    ▼
Task 3.2 (Demo wiring)
    │
    ▼
Task 4.1 (PitchScrolly + WAIT)
    │
    ▼
Task 4.2 (Tiers + Proposal)
    │
    ▼
Task 5.1 (Integration test)
    │
    ├──────────────┐
    ▼              ▼
Task 5.2       Task 5.3
(Mobile)       (Auth)
```

---

## Parallel Execution Opportunities

- Tasks 5.2 and 5.3 can run in parallel after 5.1
- Within phases, tasks are sequential due to dependencies

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Setup | 1 task | High |
| Phase 2: M33T Intro | 3 tasks | High |
| Phase 3: Demo | 2 tasks | High |
| Phase 4: Pitch/Proposal | 2 tasks | High |
| Phase 5: Polish | 3 tasks | High/Medium |
| **Total** | **11 tasks** | |

**Critical Path:** Tasks 1.1 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 4.1 → 4.2 → 5.1

**Estimated Time:** 2-3 hours for experienced implementer

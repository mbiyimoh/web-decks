# WSBC Final Proposal Refinements

**Status:** Ready for Implementation
**File:** `components/clients/wsbc/WSBCFinalProposal.tsx`

---

## Overview

Three targeted changes to the WSBC Final Proposal deck:
1. Update tier/package content to reflect revised structure
2. Fix duplicate "ready to get started?" message in AI chat demo
3. Add typing indicator animation to intro slide iPhone mockup

---

## Change 1: Revised Tier Structure

### Context

The tiers were incorrectly structured. The new framing:
- **Level 1 & 2**: Digital experience only (no in-person facilitation)
- **Level 3**: Includes in-person facilitated networking as part of VIP track programming

### Locations to Update

**A. PitchSection scrollytelling (lines ~1059-1076)**

| Level | Current Name | New Name | New Description |
|-------|--------------|----------|-----------------|
| 1 | "The Digital Experience" | "VIP Digital Experience" | M33T platform for VIP attendees only. Interview → profile → matching → curated connections. Digital-only experience. |
| 2 | "The Signature Event" | "Full Digital Experience" | M33T platform for BOTH VIP attendees AND student attendees—two separate but connected networks. Expand who can connect with who. Still digital-only. |
| 3 | "The Full VIP Track" | "Full Experience + VIP Track" | Everything in Level 2, plus a curated side-track of VIP-only programming/content. 33 Strategies handles event planning/coordination. Includes in-person facilitated networking woven throughout the VIP programming. |

**B. ProposalSection pricing packages (lines ~1087-1091)**

| Package | Current Price | New Price | New Tagline | New Description |
|---------|---------------|-----------|-------------|-----------------|
| Essential | $8,000 | $8,000 | "VIP Digital Experience" | M33T platform for your VIP attendees. AI-powered profiling, curated matches, conversation starters—delivered before they arrive. |
| Premium | $15,000 | $12,000 | "Full Digital Experience" | Expand the network. M33T for both VIPs and students—two connected audiences, one powerful platform. |
| Full Experience | $25,000 | $20,000 | "Full Experience + VIP Track" | The complete package. Digital platform for all, plus a dedicated VIP track with programming, content, and facilitated networking throughout. |

### Feature Lists (ProposalSection packages)

**Essential ($8k):**
- Branded VIP intake experience
- AI-powered attendee profiling
- 3-5 curated matches per attendee
- Personalized conversation starters
- Full VIP directory access
- Post-event analytics

**Premium ($12k):**
- Everything in Essential
- Student attendee network (separate but connected)
- Cross-network matching (VIP ↔ Student where relevant)
- Expanded directory access
- Network analytics dashboard

**Full Experience ($20k):**
- Everything in Premium
- Curated VIP programming track
- In-person facilitated networking sessions
- Executive roundtables
- Pre-conference VIP reception
- 33 Strategies event coordination
- Dedicated VIP concierge

### Outcome Statements

- Essential: "VIPs arrive knowing exactly who to meet"
- Premium: "Two audiences. One connected experience."
- Full Experience: "A conference within a conference—designed for your VIPs"

---

## Change 2: Fix Duplicate Chat Message Bug

### Problem

User reports "Ready to get started?" message appears twice in the AI chat demo.

### Investigation Points

1. Check `DemoInterview` component (lines ~646-732) for:
   - useEffect running twice (React Strict Mode)
   - State initialization adding duplicate messages
   - Message advancement logic that might double-fire

2. The `INTERVIEW_QUESTIONS` array (line 55) has only one "ready" entry, so the bug is likely in state management.

### Likely Fix

Add a check to prevent adding duplicate messages, or ensure useEffect dependencies are correct to prevent double-execution.

---

## Change 3: Add Typing Indicator to Intro Mockup

### Location

`InterviewScreenMockup` component (lines ~206-254) - the left iPhone mockup on the third intro slide.

### Requirement

Add animated "three dots" typing indicator below the last AI message to simulate the AI preparing to respond. This should be a looping CSS animation.

### Implementation

```tsx
// Typing indicator component
const TypingIndicator = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    width: 'fit-content',
  }}>
    <span className="typing-dot" style={{ animationDelay: '0s' }} />
    <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
    <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
  </div>
);
```

Add CSS keyframes for the bouncing dots:
```css
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
.typing-dot {
  width: 6px;
  height: 6px;
  background: #888;
  border-radius: 50%;
  animation: typingBounce 1.4s infinite;
}
```

---

## Acceptance Criteria

- [ ] PitchSection shows updated tier names and descriptions
- [ ] ProposalSection shows updated package names, prices ($8k/$12k/$20k), and features
- [ ] "Ready to get started?" message appears exactly once in AI chat demo
- [ ] Third intro slide iPhone mockup displays animated typing indicator
- [ ] All changes work correctly in dev server
- [ ] No TypeScript errors

---

## Files Modified

- `components/clients/wsbc/WSBCFinalProposal.tsx`

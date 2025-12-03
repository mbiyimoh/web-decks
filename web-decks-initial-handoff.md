# Tradeblock AI Pitch Deck — Technical Handoff

## Context

This deck is part of a multi-deck system. See `CLAUDE.md` at the repo root for the overall architecture, shared components, and conventions.

**Entity:** Tradeblock
**Deck:** AI Inflection 2025
**Location:** `decks/tradeblock/ai-inflection-2025/`

---

## Overview

A 13-slide scrollytelling investor pitch for Tradeblock's $500K internal funding round. Presents the company's AI transformation narrative with animated text reveals, scroll-triggered transitions, and demo video placeholders.

**Source files:**
- `tradeblock-deck-v4.jsx` — Full production component (to be moved into repo)
- `tradeblock-deck-v4-preview.jsx` — Compact preview version

---

## Setup in Repo

### 1. Create the deck directory

```bash
mkdir -p decks/tradeblock/ai-inflection-2025/{components,assets}
```

### 2. Move the component

Rename and move `tradeblock-deck-v4.jsx` to:

```
decks/tradeblock/ai-inflection-2025/page.tsx
```

### 3. Update imports

Replace inline component definitions with shared components:

```tsx
// Before (self-contained)
const Section = ({ children, className, id }) => { ... };
const RevealText = ({ children, delay, className }) => { ... };

// After (using shared components)
import { 
  Section, 
  RevealText, 
  ProgressBar, 
  NavDots, 
  DemoPlaceholder,
  StatusBadge 
} from '@/components';
```

### 4. Extract deck-specific components

Move these to `decks/tradeblock/ai-inflection-2025/components/`:

- `Roadmap.tsx` — 3-phase AI roadmap visualization
- `AnalyticsCard.tsx` — Metric cards for Analytics slide
- `CompanyCard.tsx` — Company cards for B2B slide

### 5. Add assets

Place demo videos in:

```
decks/tradeblock/ai-inflection-2025/assets/
├── campaign-demo.mp4
└── tradeblockgpt-demo.mp4
```

---

## File Structure (After Setup)

```
decks/tradeblock/ai-inflection-2025/
├── page.tsx                    # Main deck component
├── components/
│   ├── Roadmap.tsx             # 3-phase roadmap
│   ├── AnalyticsCard.tsx       # Per-shoe metrics cards
│   ├── CompanyCard.tsx         # B2B company cards
│   └── index.ts
├── assets/
│   ├── campaign-demo.mp4       # Phase 2 demo video
│   └── tradeblockgpt-demo.mp4  # Phase 3 demo video
└── README.md                   # This file (move/rename)
```

---

## Slide Structure

| # | ID | Title | Shared Components | Deck-Specific |
|---|----|-------|-------------------|---------------|
| 1 | `title` | TRADEBLOCK: THE AI INFLECTION | Section, RevealText | — |
| 2 | `question` | The Question | Section, RevealText | Roadmap |
| 3 | `phase1` | Operator Essentials | Section, RevealText, StatusBadge | — |
| 4 | `phase2` | Marketing, Comms & Engagement | Section, RevealText, StatusBadge, DemoPlaceholder | — |
| 5 | `phase2-results` | Every dormant channel is now active | Section, RevealText | — |
| 6 | `phase3` | TradeblockGPT | Section, RevealText, StatusBadge, DemoPlaceholder | — |
| 7 | `analytics` | Oh, and we already have a product to sell | Section, RevealText, StatusBadge | AnalyticsCard |
| 8 | `b2b` | Other companies want to pay for this | Section, RevealText | CompanyCard |
| 9 | `strategic` | Acquirers are seeing a different company | Section, RevealText | — |
| 10 | `optionality` | Multiple paths to outcome | Section, RevealText | — |
| 11 | `opportunity` | $500K to lean into what's working | Section, RevealText | — |
| 12 | `ask` | You've already bet on us | Section, RevealText | — |
| 13 | `demo` | Want to see it live? | Section, RevealText | — |

---

## Remaining TODOs

### 1. Replace Calendar Link Placeholder

Search for `REPLACE_WITH_CALENDAR_LINK` and replace with Google Calendar event link.

**To get the link:**
1. Create event in Google Calendar for Friday, December 5th
2. Add Google Meet link to the event
3. Click event → three dots → "Publish event"
4. Copy "Link to event" URL

### 2. Record Demo Videos

**Slide 4 — Campaign Engine Demo:**
- File: `assets/campaign-demo.mp4`
- Duration: 15-20 seconds
- Content: Recipe selection → AI content generation → Review interface → Multi-channel deployment
- Vibe: Speed and volume — "that's a lot of output from one click"

**Slide 6 — TradeblockGPT Demo:**
- File: `assets/tradeblockgpt-demo.mp4`
- Duration: 20-30 seconds
- Content: User prompt → GPT response with specific shoe/trade recommendation → Follow-up
- Vibe: Smart, specific, personal — "this thing actually knows me"

**To integrate videos:**

Replace `DemoPlaceholder` with:

```tsx
<video 
  autoPlay 
  loop 
  muted 
  playsInline
  className="w-full rounded-xl border border-zinc-700"
>
  <source src="./assets/campaign-demo.mp4" type="video/mp4" />
</video>
```

### 3. Refactor to Use Shared Components

Once shared components are built out at repo level:

```tsx
// Replace StatusBadge usage
<PhaseStatus status="completed" />
// becomes
<StatusBadge status="completed" />

// Replace inline Section/RevealText with imports
import { Section, RevealText } from '@/components';
```

---

## Content Reference

Key metrics and claims (for fact-checking):

| Metric | Value | Source |
|--------|-------|--------|
| Burn reduction | 83% ($140K → $24K) | Internal financials |
| Team leverage | 9-person team, 25-person output | Operational estimate |
| Campaign time | 8 hours → 45 minutes | Marketing workflow |
| Email CTR | 2-9% click-to-trade | Mailjet analytics |
| Break-even runway | ~$120K | Financial projections |
| Raise target | $500K | Internal round |
| Demo date | Friday, December 5th | Scheduled |
| B2B interest | PremiumGoods, Copyt, SLAM | Conversations |

**Analytics metrics (Advanced Analytics slide):**
- Desirability Ratio: 2.3x
- Offer Success Rate: 46.3% (73% for 1:1)
- Tradeability Score: 62/100
- Momentum: +6.9%

---

## Deployment

### Option A: Standalone (Quick)

Deploy just this deck:

```bash
cd decks/tradeblock/ai-inflection-2025
vercel
```

### Option B: As Part of Multi-Deck Site

If deploying the full repo with Next.js App Router:

1. Create route file:

```tsx
// app/tradeblock/ai-inflection/page.tsx
export { default } from '@/decks/tradeblock/ai-inflection-2025/page';
```

2. Deploy full site:

```bash
vercel
```

3. Access at: `https://[domain]/tradeblock/ai-inflection`

---

## Deck-Specific Design Notes

### Accent Color
This deck uses **amber** (`#f59e0b`) as the primary accent. Override in component if needed:

```tsx
<ProgressBar color="#f59e0b" />
```

### Phase Colors
- Phase 1 (Completed): Emerald (`#10b981`)
- Phase 2 (Rolling Out): Amber (`#f59e0b`)
- Phase 3 (Beta): Blue (`#3b82f6`)
- Analytics (Live): Purple (`#a855f7`)

### Custom Components

**Roadmap** — Horizontal 3-phase timeline. Shows status indicators and connecting lines. Used only on Slide 2.

**AnalyticsCard** — Compact metric card with title, value, subtitle. Supports `green`, `yellow`, `zinc` color variants. Used on Slide 7.

**CompanyCard** — Simple card with company name and description. Animated entrance. Used on Slide 8.

---

## Testing Checklist

- [ ] All 13 slides render correctly
- [ ] Scroll progress bar works
- [ ] Navigation dots work (desktop)
- [ ] Text animations trigger on scroll
- [ ] Demo placeholders display (or videos play)
- [ ] Calendar link works
- [ ] Mobile responsive (no horizontal scroll)
- [ ] Fonts load (Space Grotesk, Inter)
- [ ] No console errors
- [ ] Roadmap phases display correctly
- [ ] Analytics cards show metrics
- [ ] Company cards animate in

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1 | Nov 2025 | Initial 11-slide structure |
| v2 | Nov 2025 | Added Phase 1-3 roadmap, expanded narrative |
| v3 | Nov 2025 | Restructured opening with "The Question" framing |
| v4 | Dec 2025 | Added Advanced Analytics slide, swapped order (GPT before Analytics), expanded strategic positioning |

---

## Related Files

- `CLAUDE.md` — Repo-level architecture and conventions
- `components/` — Shared component library
- `styles/tokens.ts` — Design system tokens
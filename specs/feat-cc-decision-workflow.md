# Decision Workflow + Operational Structure

**Status:** Draft
**Author:** Claude Code
**Date:** 2026-02-06
**Context:** Central Command enhancement for post-discovery decision making and operational tracking

---

## Overview

After initial extraction and assessment review, add a structured decision workflow with 4 buckets (Aggressive / Slow-burn / Back-burner / Explicit No), each triggering configurable next-step templates. Also display extracted stakeholders with role tags and surface operational details (contacts, next actions, timeline signals) in a dedicated section.

## Problem Statement

After reviewing AI-extracted client intelligence, users currently lack a structured way to:
1. Make and record a pursuit decision with clear categorization
2. Get intelligent next-step suggestions based on that decision
3. See extracted stakeholders with their roles in the buying process
4. Track operational details (contacts, next actions, timing) in a dedicated section

The current flow is: extract → review synthesis → manually figure out what to do next. There's no guided workflow or structured operational view.

## Goals

- 4-bucket decision framework: Aggressive (pursue now), Slow-burn (nurture), Back-burner (revisit later), Explicit No (pass)
- Editable next-step templates triggered by bucket selection
- Stakeholder section showing all extracted individuals with role tags (champion, economic_buyer, etc.)
- Operational Details section surfacing contacts, next actions, and timeline signals
- All templates are suggestions — user can edit before saving

## Non-Goals

- Automated outreach or email drafting
- CRM integration
- Calendar integration for next action dates
- Multi-step drip sequences
- Approval workflows for decisions
- Notification system for follow-ups

---

## Technical Approach

### Files That Change

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `decisionBucket`, `nextStepTemplate` to PipelineRecord |
| `lib/central-command/schemas.ts` | Already has stakeholder types (completed in prep work) |
| `lib/central-command/decision-templates.ts` | **New:** Decision buckets and their default next-step templates |
| `lib/central-command/types.ts` | Add DecisionBucket type, update EnrichmentFindings for stakeholders |
| `app/central-command/components/DecisionPanel.tsx` | **New:** 4-bucket selection + next-step template editor |
| `app/central-command/components/StakeholdersSection.tsx` | **New:** Display extracted stakeholders with role tags |
| `app/central-command/components/OperationalDetails.tsx` | **New:** Contacts, next actions, timeline in structured view |
| `app/central-command/components/ClientDetailModal.tsx` | Add new sections and decision panel to layout |
| `app/api/central-command/prospects/[id]/route.ts` | Handle decisionBucket and nextStepTemplate fields |

### Integration Points

- Existing stakeholder extraction (schema and prompt already updated)
- Existing `pipelineRecommendationSchema` — operational extractions surface here
- Existing PipelineRecord — add new fields for decision tracking

---

## Implementation Details

### 1. Data Layer — Decision Fields

Add to `PipelineRecord` in Prisma schema:

```prisma
decisionBucket   String?   // 'aggressive' | 'slow_burn' | 'back_burner' | 'explicit_no'
nextStepNotes    String?   // User's notes on next steps (from template or manual)
decisionMadeAt   DateTime? // When the decision was made
```

### 2. Decision Templates Configuration

**`lib/central-command/decision-templates.ts`**

```typescript
export const DECISION_BUCKETS = {
  aggressive: {
    label: 'Aggressive Pursuit',
    description: 'High priority — pursue immediately with full attention',
    color: GREEN,
    defaultTemplate: `**Immediate Next Steps:**
1. Send intro email within 24 hours referencing [key pain point]
2. Propose discovery call for this week
3. Prepare 1-pager on how 33S addresses their [specific challenge]

**Key Talking Points:**
- Lead with [recommended approach from synthesis]
- Reference their [specific pain] and how we've solved similar problems
- Ask about [decision dynamics from synthesis]`,
  },
  slow_burn: {
    label: 'Slow Burn',
    description: 'Interested but not urgent — nurture over time',
    color: BLUE,
    defaultTemplate: `**Nurture Actions:**
1. Add to monthly value-share cadence
2. Send relevant case study that matches their [industry/challenge]
3. Re-engage in [timeframe based on timeline signals]

**Trigger Points to Watch:**
- Funding announcement
- Leadership change
- Competitive pressure mention`,
  },
  back_burner: {
    label: 'Back Burner',
    description: 'Not ready now — revisit later when circumstances change',
    color: GOLD,
    defaultTemplate: `**Back Burner Actions:**
1. Set reminder to check back in [3/6 months]
2. Note: Waiting for [specific trigger — budget cycle, decision-maker change, etc.]

**Reactivation Signals:**
- [What would make this worth revisiting]`,
  },
  explicit_no: {
    label: 'Explicit No',
    description: 'Not a fit — document why and move on',
    color: RED,
    defaultTemplate: `**Pass Reason:**
[Document why we're passing]

**Lessons Learned:**
- [What we learned from this evaluation]

**Potential Future Fit:**
- [Under what conditions might this change, or "Never"]`,
  },
} as const;

export type DecisionBucket = keyof typeof DECISION_BUCKETS;
```

Templates use markdown and can reference synthesis sections using placeholders. Templates are always editable — they're suggestions, not constraints.

### 3. Component — DecisionPanel

**`app/central-command/components/DecisionPanel.tsx`**

Located at the top of the assessment workflow after extraction review.

```typescript
interface DecisionPanelProps {
  currentBucket: DecisionBucket | null;
  currentNotes: string;
  synthesis: EnrichmentFindings;  // For template variable interpolation
  onSave: (bucket: DecisionBucket, notes: string) => void;
}
```

UI Layout:
```
┌─────────────────────────────────────────────────────────────────┐
│ PURSUIT DECISION                                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ AGGRESSIVE  │ │  SLOW BURN  │ │ BACK BURNER │ │ EXPLICIT  │ │
│  │ ✓ selected  │ │             │ │             │ │    NO     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ **Immediate Next Steps:**                                │   │
│  │ 1. Send intro email within 24 hours...                  │   │
│  │ 2. Propose discovery call for this week                 │   │
│  │ [editable textarea with markdown preview]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Save Decision]                                               │
└─────────────────────────────────────────────────────────────────┘
```

Behavior:
- Clicking a bucket loads its default template (but doesn't overwrite if user has made edits)
- User can edit the template freely
- Save persists both `decisionBucket` and `nextStepNotes` to PipelineRecord
- Show timestamp of when decision was made
- Allow changing decision bucket (loads new template, warns about overwriting notes)

### 4. Component — StakeholdersSection

**`app/central-command/components/StakeholdersSection.tsx`**

Displays extracted stakeholders from `enrichmentFindings.stakeholders` (stakeholders are stored directly on the synthesis object, which is saved as `enrichmentFindings` in the database).

```typescript
interface StakeholdersSectionProps {
  stakeholders: Stakeholder[];
  onEdit?: (index: number, updated: Stakeholder) => void;
  onAdd?: (stakeholder: Stakeholder) => void;
}
```

UI Layout:
```
┌─────────────────────────────────────────────────────────────────┐
│ STAKEHOLDERS                                          [+ Add]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 John Smith                              [CHAMPION]   │   │
│  │    VP of Product @ Acme Corp                            │   │
│  │    Internal advocate, pushing for this initiative.      │   │
│  │    📧 john@acme.com  📱 555-1234                       │   │
│  │    Confidence: 0.85                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Sarah Johnson                       [ECONOMIC_BUYER] │   │
│  │    CFO @ Acme Corp                                      │   │
│  │    Controls budget, mentioned in discovery call.        │   │
│  │    Confidence: 0.70                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

Role tag styling:
- `champion` → GREEN badge
- `economic_buyer` → GOLD badge
- `decision_maker` → GOLD badge
- `technical_evaluator` → BLUE badge
- `blocker` → RED badge
- `unknown` → TEXT_MUTED badge (subtle)
- Others → TEXT_MUTED badge

Click stakeholder card to expand/edit. Can add new stakeholders manually.

### 5. Component — OperationalDetails

**`app/central-command/components/OperationalDetails.tsx`**

Surfaces the operational extractions (from `recommendations` array in extraction response) in a structured view.

```typescript
interface OperationalDetailsProps {
  recommendations: PipelineRecommendation[];
  nextAction: string | null;
  nextActionDate: Date | null;
  onUpdateNextAction: (action: string, date?: Date) => void;
}
```

UI Layout:
```
┌─────────────────────────────────────────────────────────────────┐
│ OPERATIONAL DETAILS                                             │
├─────────────────────────────────────────────────────────────────┤
│  NEXT ACTION                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Schedule follow-up call with John           📅 Feb 10  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  EXTRACTED SIGNALS                                              │
│  • Budget: "Looking at $50k range" → potentialValue: 50000     │
│  • Timeline: "Need something by Q2" → notes (timeline signal)  │
│  • Contact: "Sarah Johnson, CFO" → contactName                 │
│                                                                 │
│  CONTACT INFO                                                   │
│  John Smith · john@acme.com · 555-1234                         │
└─────────────────────────────────────────────────────────────────┘
```

Shows:
- Primary next action with optional date
- Extracted recommendations grouped by category
- Aggregated contact information

### 6. ClientDetailModal Integration

Add three new sections to the modal layout, after CLIENT INTELLIGENCE:

```tsx
{/* After CLIENT INTELLIGENCE section */}

{/* Stakeholders — from extraction */}
<Section title="STAKEHOLDERS">
  <StakeholdersSection
    stakeholders={enrichmentFindings?.stakeholders || []}
    onEdit={handleStakeholderEdit}
    onAdd={handleStakeholderAdd}
  />
</Section>

{/* Decision Panel — make the call */}
<Section title="PURSUIT DECISION">
  <DecisionPanel
    currentBucket={pipelineRecord?.decisionBucket}
    currentNotes={pipelineRecord?.nextStepNotes || ''}
    synthesis={enrichmentFindings}
    onSave={handleDecisionSave}
  />
</Section>

{/* Operational Details — track the work */}
<Section title="OPERATIONAL DETAILS">
  <OperationalDetails
    recommendations={operationalRecommendations}
    nextAction={pipelineRecord?.nextAction}
    nextActionDate={pipelineRecord?.nextActionDate}
    onUpdateNextAction={handleNextActionUpdate}
  />
</Section>
```

### 7. API Updates

Add to `updateProspectSchema` in `lib/central-command/schemas.ts`:

```typescript
decisionBucket: z.enum(['aggressive', 'slow_burn', 'back_burner', 'explicit_no']).optional(),
nextStepNotes: z.string().optional(),
decisionMadeAt: z.string().optional(), // ISO date string
```

PATCH handler already structured to handle new record fields — just add the field mappings.

---

## User Experience

### Assessment → Decision Flow

1. User opens prospect from Intent or Funnel list
2. Reviews CLIENT INTELLIGENCE synthesis sections (collapse/expand)
3. Reviews STAKEHOLDERS — sees extracted individuals with role tags
4. Scrolls to PURSUIT DECISION panel
5. Clicks one of 4 bucket buttons (e.g., "Aggressive Pursuit")
6. Template populates in textarea with suggestions
7. User edits template to customize next steps
8. Clicks "Save Decision"
9. Decision bucket and notes saved to database
10. Prospect card in list view shows decision indicator

### Template Editing

Templates are markdown-formatted suggestions. Users can:
- Edit completely — delete template and write from scratch
- Modify — adjust the suggested steps
- Accept as-is — save without changes

Placeholder interpolation (future enhancement):
- `[key pain point]` → could auto-fill from synthesis
- `[specific challenge]` → could auto-fill from painAndBlockers

For now, placeholders remain as hints for the user to manually fill.

---

## Testing Approach

- **Bucket selection**: Click each bucket → verify template loads
- **Template editing**: Modify template → save → verify persisted correctly
- **Bucket change**: Select different bucket after editing → verify warning shown
- **Stakeholder display**: Extract with stakeholders → verify role tags render correctly
- **Stakeholder editing**: Click stakeholder → edit details → verify persisted
- **Operational details**: Verify recommendations grouped by category
- **Next action**: Edit next action → verify saved with optional date

---

## Open Questions

None — clarified with user:
- Back-burner bucket is required for "uncertain but interesting" cases
- Templates are very editable (suggestions, not constraints)

---

## Future Improvements

- **Template variable interpolation** — Auto-fill placeholders from synthesis
- **Decision history** — Track bucket changes over time
- **Email draft generation** — Generate outreach email from template
- **Calendar integration** — Create calendar event for next action date
- **Notification reminders** — Alert when follow-up date approaches
- **Stakeholder mapping visualization** — Org chart style view of stakeholders

---

## References

- **Stakeholder schema:** `lib/central-command/schemas.ts` (already updated)
- **Extraction prompt:** `lib/central-command/prompts.ts` (already updated)
- **Existing ClientDetailModal:** `app/central-command/components/ClientDetailModal.tsx`
- **Pipeline dashboard spec:** `specs/feat-central-command-pipeline-dashboard.md`

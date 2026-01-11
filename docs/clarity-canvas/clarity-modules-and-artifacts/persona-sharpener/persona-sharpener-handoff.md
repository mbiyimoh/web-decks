# PERSONA SHARPENER — HANDOFF DOCUMENT

> Integration guide for adding the Persona Sharpener mini-module to the Clarity Canvas experience.

---

## OVERVIEW

### What is Persona Sharpener?

A structured interview experience that helps founders build detailed, research-backed customer personas. It's designed as a **mini-module** within the Clarity Canvas system — a focused deep-dive that enriches the broader profile.

### Core Innovation

**Assumption-Based Hypothesis System**: Every answer the founder provides is tagged as an "assumption" with a confidence level. Later, real users can complete the same questionnaire (via shared validation link), and their responses are tagged as "validations." The system then compares assumptions to validations, showing founders where their mental model aligns with reality and where it needs adjustment.

### Files Included

| File | Purpose |
|------|---------|
| `persona-sharpener-v2.jsx` | Full sharpening questionnaire with assumption tracking |
| `persona-details-page.jsx` | Post-sharpening view with response drill-down |
| `persona-sharpener.jsx` | Original v1 (reference only, v2 supersedes) |

---

## DATA ARCHITECTURE

### Response Record Schema

Every answer (from founder or real user) is stored as a discrete record:

```typescript
interface Response {
  id: string;                         // UUID
  questionId: string;                 // e.g., 'age-range'
  personaId: string;                  // Which persona this belongs to
  sessionId: string;                  // Groups responses from one sitting
  
  // The Answer
  value: string | number | string[] | object;  // Varies by question type
  
  // Metadata
  isUnsure: boolean;                  // "I'm not sure" checkbox
  confidence: number;                 // 0-100 slider value
  additionalContext: string;          // Optional elaboration
  contextSource: 'voice' | 'text' | null;
  
  // Tagging
  responseType: 'assumption' | 'validation';
  respondentId: string;
  respondentRole: 'founder' | 'real-user';
  respondentName: string;
  respondentEmail?: string;           // For validation tracking
  
  // Field Mapping
  field: string;                      // e.g., 'demographics.ageRange'
  
  // Timestamps
  createdAt: string;                  // ISO timestamp
  updatedAt?: string;
}
```

### Persona Schema

```typescript
interface Persona {
  id: string;
  projectId: string;                  // Links to Clarity Canvas project
  name: string;                       // Auto-generated archetype name
  isPrimary: boolean;                 // Primary vs. secondary persona
  
  // Structured Fields (populated from responses)
  demographics: {
    ageRange?: string;
    lifestyle?: string;
    techSavviness?: number;
  };
  
  jobs: {
    functional?: string;
    emotional?: string;
    social?: string;
  };
  
  goals: {
    priorities?: RankedItem[];
    successDefinition?: object;
  };
  
  frustrations: {
    pastFailures?: string;
    dealbreakers?: string[];
    currentWorkaround?: object;
  };
  
  behaviors: {
    decisionStyle?: string;
    usageTime?: string;
    timeAvailable?: number;
    discoveryChannels?: RankedItem[];
    influences?: string[];
  };
  
  antiPatterns?: string[];
  quote?: string;
  
  // Computed Metrics
  clarity: {
    overall: number;
    identity: number;
    goals: number;
    frustrations: number;
    emotional: number;
    behaviors: number;
  };
  
  // Validation Status
  validationStats: {
    totalAssumptions: number;
    totalValidations: number;
    avgConfidence: number;
    fieldsNeedingReview: string[];    // Fields where alignment < 70%
  };
  
  createdAt: string;
  updatedAt: string;
}
```

### Field Aggregation (Computed)

When displaying a field, aggregate all responses that map to it:

```typescript
interface FieldAggregate {
  field: string;
  label: string;
  section: string;                    // 'identity' | 'goals' | etc.
  
  // Current Value
  currentValue: any;
  displayValue: string;
  
  // Response Summary
  totalResponses: number;
  assumptionCount: number;
  validationCount: number;
  
  // Computed Metrics
  avgConfidence: number;
  alignmentScore: number | null;      // null if no validations yet
  hasUnsureResponses: boolean;
  needsReview: boolean;               // alignmentScore < 70%
  
  // All Underlying Data
  responses: Response[];
}
```

---

## QUESTION BANK

### Structure

Questions are organized by category and include dual framing for assumption vs. validation modes:

```typescript
interface Question {
  id: string;
  type: 'this-or-that' | 'slider' | 'ranking' | 'multi-select' | 'fill-blank' | 'scenario' | 'voice';
  category: 'identity' | 'goals' | 'frustrations' | 'emotional' | 'social' | 'behaviors' | 'antiPatterns';
  field: string;                      // Which persona field this populates
  
  question: string;                   // Founder-facing (assumption mode)
  validationQuestion: string | null;  // User-facing (validation mode), null to skip
  
  // Type-specific config
  options?: Option[];                 // For this-or-that, multi-select
  items?: RankedItem[];               // For ranking
  blanks?: BlankConfig[];             // For fill-blank
  min?: string;                       // For slider
  max?: string;                       // For slider
  defaultValue?: number;              // For slider
  maxSelections?: number;             // For multi-select
  placeholder?: string;               // For scenario, voice
  helperText?: string;                // Additional guidance
}
```

### Current Question Bank (19 questions)

**Identity (4)**
- `age-range`: This-or-that (younger/middle/older)
- `lifestyle`: This-or-that (busy-professional/balanced-seeker)
- `tech-savvy`: Slider (simplicity → power user)
- `decision-style`: This-or-that (researcher/action-taker)

**Goals (3)**
- `primary-goal`: Ranking (save-time, save-money, look-good, be-healthy, reduce-stress, achieve-more)
- `success-scenario`: Fill-blank ("helped me {blank} within {timeframe}")
- `functional-job`: Scenario (open text)

**Frustrations (3)**
- `past-failures`: Scenario (open text)
- `dealbreakers`: Multi-select (8 options, max 3)
- `current-workaround`: Fill-blank ("{workaround}, but hate it because {reason}")

**Emotional (3)**
- `emotional-job`: This-or-that (in-control/accomplished/cared-for/free)
- `voice-capture`: Voice/text (quote capture)
- `recommendation-trigger`: Scenario (open text)

**Social (2)**
- `social-job`: This-or-that (competent/aspirational/relatable/innovative)
- `influence-sources`: Multi-select (6 options, max 2)

**Behaviors (3)**
- `discovery-channel`: Ranking (social, search, friend, content, app-store, ads)
- `usage-time`: This-or-that (morning/workday/evening/weekend)
- `time-available`: Slider (<5 min → 30+ min)

**Anti-Patterns (1)**
- `not-customer`: Multi-select (6 options, max 3) — *skipped in validation mode*

### Extending the Question Bank

The system should support adding new questions without code changes. Consider storing questions in the database with an admin interface for modification.

---

## THREE MODES OF OPERATION

### Mode 1: Sharpen (Founder)

**Purpose**: Founder captures their assumptions about the target customer.

**Flow**:
1. Enter from Clarity Canvas (module CTA)
2. Answer questions in sequence
3. For each question: select answer, optionally mark "unsure," set confidence, add context
4. Responses tagged as `responseType: 'assumption'`
5. See persona card update in real-time
6. Complete → see summary + prompt to share validation link

**UI**: Split panel (2/3 persona card, 1/3 questionnaire)

### Mode 2: Validate (Real User)

**Purpose**: Real users answer the same questions from their perspective.

**Flow**:
1. Receive shareable link (no account required)
2. Brief intro explaining purpose
3. Answer questions — framed for their perspective ("Which describes YOU?")
4. No "I'm not sure" option (they know themselves)
5. Still capture confidence + optional context
6. Responses tagged as `responseType: 'validation'`
7. Complete → thank you screen, optionally collect email for follow-up

**UI**: Single-panel questionnaire (no persona card visible)

**Note**: Some questions (like `not-customer`) should be skipped in validation mode — check for `validationQuestion: null`.

### Mode 3: Reconcile (Founder)

**Purpose**: Compare assumptions to validations and update persona.

**Flow**:
1. View persona details page with alignment scores per field
2. Drill into any field to see all responses (assumptions + validations)
3. For fields with low alignment (<70%):
   - See suggested value based on validation consensus
   - Choose to accept suggestion or keep assumption with reasoning
4. Document decisions for future reference

**UI**: Persona details page with drill-down panel

---

## INTEGRATION WITH CLARITY CANVAS

### Module Philosophy

**Mini-modules are NOT rigidly mapped to specific profile fields.**

Instead:
1. Each module has **suggested enrichments** — fields/sections typically improved by completing it
2. The system should **intelligently analyze** what was learned and consider broader updates
3. Modules can enrich sections beyond their primary focus when warranted

### Persona Sharpener — Typical Enrichments

| Canvas Section | How Persona Sharpener Enriches |
|----------------|--------------------------------|
| **Target Customer** | Primary — full persona detail |
| **Value Proposition** | Jobs-to-be-done inform what value to deliver |
| **Problem** | Frustrations, past failures, dealbreakers |
| **Channels** | Discovery channels, usage time, influences |
| **Customer Relationships** | Emotional/social jobs inform relationship style |

### Intelligent Enrichment Logic

After completing Persona Sharpener, the system should:

1. **Extract key learnings** from responses (especially high-confidence ones with context)
2. **Map to Canvas sections** — both typical and potential
3. **Generate suggested updates** with confidence levels
4. **Present to user for review** — not auto-apply

Example:
```
Based on your Persona Sharpener session:

✓ Target Customer section updated with full persona details
  
Suggested additional updates:

→ Problem section: Your customer's top frustrations 
  ("takes too long to see results", "requires too much daily effort")
  could strengthen your problem statement.
  [Apply] [Dismiss]

→ Channels section: Discovery preference (social media #1, friend 
  recommendation #2) suggests acquisition strategy emphasis.
  [Apply] [Dismiss]
```

### Module Trigger Points

Where Persona Sharpener can be accessed:

1. **Projects section** — explicit "Sharpen Persona" button
2. **Target Customer card** — if clarity score is low
3. **Guided flow** — part of initial project setup
4. **Nudge system** — "You haven't defined your customer yet"

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  CLARITY CANVAS (Parent)                                    │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Projects   │  │   Profile   │  │  Insights   │         │
│  │             │  │             │  │             │         │
│  │ • Project A │  │ • Identity  │  │ • Scores    │         │
│  │   └─ Personas  │ • Business  │  │ • Gaps      │         │
│  │      └─ Primary│ • Goals     │  │ • Actions   │         │
│  │      └─ Secondary           │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MINI-MODULE: Persona Sharpener                     │   │
│  │                                                     │   │
│  │  Input: projectId, personaId (optional)            │   │
│  │  Output: Persona record + Response records          │   │
│  │                                                     │   │
│  │  After completion:                                  │   │
│  │  → Update persona in project                        │   │
│  │  → Suggest Canvas enrichments                       │   │
│  │  → Recalculate clarity scores                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## BACKEND REQUIREMENTS

### API Endpoints

```
# Personas
GET    /api/projects/:projectId/personas
POST   /api/projects/:projectId/personas
GET    /api/personas/:personaId
PUT    /api/personas/:personaId
DELETE /api/personas/:personaId

# Responses
GET    /api/personas/:personaId/responses
GET    /api/personas/:personaId/responses?field=demographics.ageRange
POST   /api/personas/:personaId/responses
PUT    /api/responses/:responseId
DELETE /api/responses/:responseId

# Sessions (group responses from one sitting)
POST   /api/personas/:personaId/sessions
GET    /api/sessions/:sessionId/responses

# Validation Links
POST   /api/personas/:personaId/validation-links
GET    /api/validation-links/:linkId
POST   /api/validation-links/:linkId/responses  # Public endpoint, no auth

# Field Aggregation
GET    /api/personas/:personaId/field-aggregates
GET    /api/personas/:personaId/field-aggregates/:field

# Questions (if stored in DB)
GET    /api/questions
GET    /api/questions?category=identity
```

### Validation Link System

The validation sharing system allows founders to share generated personas with real users for validation via public links.

**Database Schema:**

```typescript
interface ValidationLink {
  id: string;
  personaId: string;
  createdBy: string;                  // Founder user ID

  // Link Config
  slug: string;                       // Short URL slug (unique, URL-safe)
  expiresAt?: string;                 // Optional expiration
  maxResponses?: number;              // Optional cap

  // Tracking
  responseSessions: string[];         // Session IDs from this link
  totalResponses: number;

  // Status
  isActive: boolean;

  createdAt: string;
}

interface ValidationSession {
  id: string;
  validationLinkId: string;
  personaId: string;

  // Session State
  currentQuestionIndex: number;
  completedAt?: string;

  // Validator Info (optional)
  respondentName?: string;
  respondentEmail?: string;

  createdAt: string;
}
```

**Public validation page:** `/validate/:slug`

**Implementation Files:**
- `app/api/validate/[slug]/route.ts` - GET endpoint returns validation context
- `app/api/validate/[slug]/submit/route.ts` - POST endpoint accepts responses
- `app/validate/[slug]/page.tsx` - Public validation questionnaire UI
- `lib/clarity-canvas/modules/persona-sharpener/validation-utils.ts` - Slug generation, validation helpers

**Perspective Transformation:**

The validation system uses **dual question framing** - the same questions are shown differently to founders vs. real users:

```typescript
interface CustomizedQuestion {
  questionId: string;
  originalText: string;                // Base question from question bank

  // Founder perspective (for sharpening questionnaire)
  contextualizedText: string;          // "You mentioned they want to..."

  // User perspective (for validation links)
  validationContextualizedText: string | null;  // "We have a hypothesis that people like you want to..."

  // ... other fields
}
```

**Example Transformation:**

| Context | Question Framing |
|---------|------------------|
| **Base question** | "What's their primary goal when using this type of product?" |
| **Founder questionnaire** (`contextualizedText`) | "Based on your brain dump about busy parents, what's their primary goal when trying to plan family meals?" |
| **Validation link** (`validationContextualizedText`) | "We have a hypothesis that busy parents like you are primarily looking to save time when planning family meals. How well does this match your experience?" |

**Generation:**

Both `contextualizedText` and `validationContextualizedText` are generated by OpenAI during brain dump processing:

1. Founder submits brain dump (voice or text)
2. GPT-4o-mini extracts personas
3. For each persona, GPT-4o generates customized questions with **both perspectives**
4. Stored in `PersonaBrainDump.customizedQuestions` JSON field

**Retrieval Pattern:**

```typescript
// In validation endpoint (app/api/validate/[slug]/route.ts)
const brainDump = await prisma.personaBrainDump.findFirst({
  where: { personas: { some: { id: personaId } } },
  select: { customizedQuestions: true }
});

const customizedData = brainDump?.customizedQuestions as Record<string, { questions?: CustomizedQuestion[] }>;
const customizedQuestions = customizedData?.[personaId]?.questions;

// Build validation questions
const validationQuestion: ValidationQuestion = {
  ...baseQuestion,
  // Use user-perspective text if available, otherwise fall back to base validationQuestion
  validationContextualizedText: customized?.validationContextualizedText ?? undefined,
};
```

**Backfilling Existing Personas:**

For personas created before the `validationContextualizedText` field was added:

```bash
# Dry run (no changes)
npx tsx scripts/backfill-validation-contextualized-text.ts --dry-run

# Live update all personas
npx tsx scripts/backfill-validation-contextualized-text.ts

# Update specific persona
npx tsx scripts/backfill-validation-contextualized-text.ts --persona-id <id>
```

The backfill script (`scripts/backfill-validation-contextualized-text.ts`):
1. Finds brain dumps with personas
2. Regenerates customized questions using OpenAI with current prompt
3. Updates `customizedQuestions` JSON field on brain dump
4. Preserves all existing data
5. Skips personas that already have `validationContextualizedText`

**Critical Gotcha:**

Always use the correct perspective in each context:

```typescript
// ✅ CORRECT: Founder questionnaire uses contextualizedText
<p>{currentCustomizedQuestion?.contextualizedText}</p>

// ✅ CORRECT: Validation link uses validationContextualizedText
<p>{question.validationContextualizedText ?? question.validationQuestion}</p>

// ❌ WRONG: Using founder perspective in validation link
<p>{question.contextualizedText}</p>  // This says "You mentioned they..." - wrong for real users!
```

### Validation Responses Dashboard

After collecting validation responses, founders can view alignment analysis at `/clarity-canvas/modules/persona-sharpener/personas/[personaId]/validation-responses`.

**Key Files:**
- `ValidationResponsesPageClient.tsx` - Main dashboard component
- `alignment-calculator.ts` - Per-question-type scoring algorithms
- `confidence-thresholds.ts` - Statistical confidence system
- `validation-types.ts` - TypeScript interfaces

**Dashboard Features:**
1. **Summary Header** - 4-stat grid (Sessions, Responses, Alignment %, Questions Validated)
2. **Confidence Callout** - Shows statistical confidence level with progress bar to next threshold
3. **View Toggle** - "By Question" (compare responses per question) or "By Session" (drill into respondent)
4. **Top Misalignments** - Auto-surfaces questions with alignment < 70% and 2+ responses

**Alignment Scoring by Question Type:**

| Type | Algorithm |
|------|-----------|
| `this-or-that` | Exact match = 100%, different = 0% |
| `slider` | Proximity-based (within 10 = 100%, linear decay) |
| `ranking` | Weighted position (1st=30pts, 2nd=25pts, 3rd=20pts, 4th=15pts, 5th=7pts, 6th=3pts) |
| `multi-select` | Jaccard similarity (intersection / union * 100) |
| `fill-blank` | Word overlap scoring |
| `scenario` | Keyword overlap with 40% floor (open-ended responses are subjective) |

**Confidence Thresholds:**

| Responses | Confidence | Label |
|-----------|------------|-------|
| 0 | 0% | No Data |
| 1-2 | 50% | Early Signal |
| 3-4 | 90% | Statistically Meaningful |
| 5-11 | 95% | High Confidence |
| 12+ | 99% | Very High Confidence |

**Usage Example:**
```typescript
import { getConfidenceLevel, getConfidenceColor } from '@/lib/clarity-canvas/modules/persona-sharpener/confidence-thresholds';
import { calculateAlignment, calculateQuestionAlignment, calculateOverallAlignment } from '@/lib/clarity-canvas/modules/persona-sharpener/alignment-calculator';

// Get confidence level
const level = getConfidenceLevel(sessionCount);
// { label: 'Statistically Meaningful', confidencePercent: 90, nextLevel: { responses: 5, confidence: 95 } }

// Calculate single alignment
const result = calculateAlignment('age-range', founderValue, validatorValue);
// { score: 100, matchType: 'exact', explanation: 'Same choice' }

// Calculate question-level alignment (across all validators)
const questionAlignment = calculateQuestionAlignment('age-range', founderValue, validatorValues);
// { averageScore: 75, matchCount: 2, total: 3 }

// Calculate overall alignment (weighted by response count)
const overall = calculateOverallAlignment(questionAlignments);
// 82
```

### Clarity Score Calculation

```typescript
function calculateClarity(responses: Response[]): ClarityScores {
  const categoryQuestionCounts = {
    identity: 4,
    goals: 3,
    frustrations: 3,
    emotional: 3,
    behaviors: 3,
  };
  
  const scores = { identity: 0, goals: 0, frustrations: 0, emotional: 0, behaviors: 0 };
  
  responses.forEach(response => {
    if (!response.isUnsure && response.value !== undefined) {
      const question = getQuestionById(response.questionId);
      const category = question.category;
      if (scores[category] !== undefined) {
        scores[category] += (100 / categoryQuestionCounts[category]);
      }
    }
  });
  
  // Cap at 100
  Object.keys(scores).forEach(key => {
    scores[key] = Math.min(100, Math.round(scores[key]));
  });
  
  // Overall is average of categories
  scores.overall = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / 5
  );
  
  return scores;
}
```

### Alignment Score Calculation

```typescript
function calculateAlignment(field: string, responses: Response[]): number | null {
  const assumptions = responses.filter(r => r.responseType === 'assumption');
  const validations = responses.filter(r => r.responseType === 'validation');
  
  if (assumptions.length === 0 || validations.length === 0) {
    return null; // Can't calculate without both
  }
  
  const assumedValue = assumptions[0].value;
  
  const matches = validations.filter(v => {
    // Handle different value types
    if (Array.isArray(assumedValue) && Array.isArray(v.value)) {
      // For arrays, check overlap percentage
      const overlap = assumedValue.filter(a => v.value.includes(a));
      return overlap.length >= assumedValue.length * 0.5; // 50% overlap = match
    }
    return v.value === assumedValue;
  });
  
  return Math.round((matches.length / validations.length) * 100);
}
```

---

## IMPLEMENTATION GOTCHAS

### Critical: Always Calculate Metrics from Response Records

**Problem**: The `Persona` table has a `totalAssumptions` field, but it can become stale if not properly updated. Early implementations read this field directly, causing incorrect "X unsure answers" displays.

**Solution**: Always calculate `unsureCount` (and similar metrics) from the actual `Response` records at query time:

```typescript
// ✅ CORRECT: Calculate from responses
const unsureCount = responses.filter((r) => r.isUnsure).length;

// ❌ WRONG: Read from stale database field
const unsureCount = persona.totalAssumptions ?? 0;
```

**Affected API endpoints**:
- `GET /api/.../personas/[personaId]` - Must calculate from `persona.responses`
- `GET /api/.../sessions/[sessionId]` - Must calculate from `persona.responses` (ALL responses, not filtered by session)

**Key insight**: The `totalAssumptions` field is written during response submission but should never be read - it's effectively dead code. Consider removing it in a future migration.

### Session Endpoint Response Filtering

**Problem**: When fetching session data, the query originally filtered `persona.responses` by `sessionId`, which caused `unsureCount` to only reflect the current session's unsure answers, not the persona-level total.

**Solution**: Fetch ALL responses for persona-level metrics:

```typescript
// ✅ CORRECT: Fetch all responses for persona-level metrics
include: {
  persona: {
    include: {
      profile: true,
      responses: true,  // No filter - all responses across all sessions
    },
  },
  responses: true,  // Session-specific responses for the response map
},

// ❌ WRONG: Filters to only this session's responses
include: {
  persona: {
    include: {
      responses: { where: { sessionId } },  // Lost responses from other sessions
    },
  },
},
```

### Welcome Screen: Clickable Personas

**Problem**: Personas without sessions were rendered as static `<div>` elements with "Not started" text, making them impossible to click.

**Solution**: Personas without sessions should render as `<button>` elements that call a handler to create a session on-the-fly:

```tsx
// ✅ CORRECT: Clickable button that creates session
<button onClick={() => onStartPersona(p.id)}>
  {p.name} → Start
</button>

// ❌ WRONG: Static div with no interaction
<div>{p.name} - Not started</div>
```

The handler (`handleStartPersona`) creates a new session via `POST /api/.../sessions` and navigates to it.

### Avoid Screen Flash During State Transitions

**Problem**: When transitioning between states (e.g., question → skip confirmation), updating multiple state variables causes intermediate renders where the wrong content flashes briefly.

**Solution**: Use a single state update or pass state through function parameters to prevent intermediate renders:

```typescript
// ❌ WRONG: Two separate state updates cause flash
setShowSkipConfirm(false);  // Render 1: No confirmation, no question yet
setCurrentQuestionIndex(idx);  // Render 2: Question appears

// ✅ CORRECT: Accept both values in one function call
function resetQuestionState(options?: { showSkipConfirm?: boolean }) {
  setShowSkipConfirm(options?.showSkipConfirm ?? false);
  // Other state reset logic...
}
```

This pattern is critical for skip confirmation dialogs and persona switching.

---

## UI COMPONENTS (From Prototypes)

### Question Meta Wrapper

Every question gets wrapped with three standard elements:

1. **"I'm not sure" checkbox** — Orange styling, disables answer when checked
2. **Confidence slider** — 0-100, color-coded (orange → gold → green)
3. **Additional context input** — Collapsible, voice/text toggle

See `persona-sharpener-v2.jsx` for full implementation.

### Question Types (7)

| Type | Use Case | Value Shape |
|------|----------|-------------|
| `this-or-that` | Single selection from 2-4 options | `string` |
| `slider` | Spectrum value | `number` (0-100) |
| `ranking` | Prioritize 4-6 items | `Array<{id, label, rank}>` |
| `multi-select` | Select multiple (with max) | `string[]` |
| `fill-blank` | Mad Libs style | `object` (blank IDs → values) |
| `scenario` | Open text response | `string` |
| `voice` | Quote capture with voice/text | `string` |

### Response Card

Displays a single response with:
- Type badge (Assumption / Validation)
- Date and respondent info
- The answer value (formatted)
- Alignment indicator (for validations)
- Confidence bar
- Additional context (if provided)

See `persona-details-page.jsx` for full implementation.

### Clickable Field

Interactive field display showing:
- Response count badge
- Current value
- Avg confidence + alignment % (inline)
- "Has uncertainty" warning
- Orange border if needs review
- Chevron indicating drill-down available

---

## ARCHETYPE GENERATION

Auto-generate persona name based on emotional job + lifestyle:

```typescript
const archetypes = {
  'in-control-busy-professional': 'The Efficient Optimizer',
  'in-control-balanced-seeker': 'The Calm Commander',
  'accomplished-busy-professional': 'The Driven Achiever',
  'accomplished-balanced-seeker': 'The Mindful Achiever',
  'cared-for-busy-professional': 'The Overwhelmed Overcomer',
  'cared-for-balanced-seeker': 'The Supported Striver',
  'free-busy-professional': 'The Escaping Executive',
  'free-balanced-seeker': 'The Peace Seeker'
};

function generateArchetype(persona: Persona): string {
  const emotionalJob = persona.jobs?.emotional || '';
  const lifestyle = persona.demographics?.lifestyle || '';
  const key = `${emotionalJob}-${lifestyle}`;
  return archetypes[key] || 'Your Ideal Customer';
}
```

---

## DESIGN SYSTEM COMPLIANCE

### Colors

```javascript
const colors = {
  bg: '#0a0a0a',
  surface: '#111111',
  surfaceDim: '#0d0d0d',
  elevated: '#1a1a1a',
  gold: '#D4A84B',
  goldLight: '#E4C06B',
  green: '#4ADE80',
  blue: '#60A5FA',
  orange: '#FB923C',
  red: '#EF4444',
  white: '#ffffff',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
};
```

### Semantic Color Usage

| Color | Meaning |
|-------|---------|
| **Gold** | Primary accent, CTAs, highlights |
| **Orange** | Assumptions, uncertainty, warnings |
| **Green** | Validations, success, high confidence |
| **Blue** | Information, validation invitations |
| **Red** | Recording state, critical alerts |

### Typography

- **Display**: Georgia, serif (persona names, headlines)
- **Body**: System font stack (all other text)
- **Uppercase labels**: 10-11px, letter-spacing: 0.05-0.1em

---

## OPEN QUESTIONS / DECISIONS NEEDED

### 1. Multi-Persona Support
- Can a project have multiple personas?
- If so, how do they relate? (Primary + secondary? Segments?)
- Does validation link target one persona or all?

### 2. Question Customization
- Can founders add custom questions?
- Can they skip questions?
- Can they reorder the sequence?

### 3. Validation Experience
- Account required for validators? (Current design: no)
- Collect email at end? (Optional vs. required)
- Show any results to validators?

### 4. Response Lifecycle
- Can founder edit their responses after initial session?
- Can they delete individual responses?
- History/versioning of persona evolution?

### 5. AI Integration
- Use LLM to generate summary paragraph from responses?
- Use LLM to suggest Canvas enrichments?
- Use LLM to identify patterns across validations?

### 6. Offline/Sync
- Support offline completion of questionnaire?
- How to handle conflicts?

---

## IMPLEMENTATION PHASES

### Phase 1: Core Sharpening
- [ ] Database schema (personas, responses, sessions)
- [ ] Question bank (hardcoded initially)
- [ ] Sharpening questionnaire UI (port from prototype)
- [ ] Real-time persona card updates
- [ ] Clarity score calculation
- [ ] Basic persona details page

### Phase 2: Validation System
- [ ] Validation link generation
- [ ] Public validation page (no auth)
- [ ] Response tagging (assumption vs. validation)
- [ ] Alignment score calculation
- [ ] Response drill-down panel

### Phase 3: Canvas Integration
- [ ] Module entry points in Canvas UI
- [ ] Suggested enrichments after completion
- [ ] Clarity score contribution to Canvas
- [ ] Cross-module data sharing

### Phase 4: Polish
- [ ] Voice input implementation (Web Speech API)
- [ ] Export/share persona as document
- [ ] Validation reminder emails
- [ ] Analytics (completion rates, alignment trends)

---

## TESTING SCENARIOS

### Happy Path
1. Founder starts sharpening session
2. Answers all 19 questions with varying confidence
3. Marks 2-3 as "unsure"
4. Adds context to 5-6 questions
5. Completes → sees summary
6. Shares validation link
7. 3 real users complete validation
8. Founder reviews alignment scores
9. Updates persona based on learnings

### Edge Cases
- Founder abandons mid-session → resume later
- Validation link expires with partial responses
- 100% alignment (all validations match)
- 0% alignment (complete mismatch)
- Conflicting validations (users disagree with each other)
- Very long text responses (scenario questions)
- Voice input fails → falls back to text

---

## RELATED DOCUMENTS

- Clarity Canvas architecture (main project docs)
- 33 Strategies Design System (`33_Strategies_Design_System.md`)
- Mini-Module Framework (if exists)

---

*Last Updated: January 2025*
*Contact: Beems / 33 Strategies*

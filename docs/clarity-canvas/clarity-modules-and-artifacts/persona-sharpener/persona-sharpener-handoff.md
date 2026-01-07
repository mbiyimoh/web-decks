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

```typescript
interface ValidationLink {
  id: string;
  personaId: string;
  createdBy: string;                  // Founder user ID
  
  // Link Config
  slug: string;                       // Short URL slug
  expiresAt?: string;                 // Optional expiration
  maxResponses?: number;              // Optional cap
  
  // Tracking
  responseSessions: string[];         // Session IDs from this link
  totalResponses: number;
  
  // Status
  isActive: boolean;
  
  createdAt: string;
}
```

Public validation page: `/validate/:slug`

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

# Persona Sharpener Module Specification (V1)

> **Status:** Ready
> **Author:** Claude (AI Assistant)
> **Created:** 2025-01-04
> **Last Updated:** 2025-01-04
> **Follow-up Spec:** `feat-persona-sharpener-validation-mode.md` (implement after V1)

---

## 1. Overview

### 1.1 Purpose

Build the Persona Sharpener as the first enrichment module within the Clarity Canvas ecosystem. This module provides a structured interview experience that helps founders build detailed, research-backed customer personas with an innovative assumption/validation tracking system.

### 1.2 Business Value

- **For Founders:** Transforms vague customer assumptions into structured, testable hypotheses with confidence tracking
- **For Product Teams:** Creates shareable validation links to compare founder assumptions against real user responses
- **For Clarity Canvas:** Demonstrates the mini-module pattern that will be replicated for future enrichment experiences

### 1.3 Scope

**In Scope (This Spec):**
- Module index page accessible from Clarity Canvas profile
- Persona Sharpener questionnaire (Sharpen mode - founder assumptions)
- Response persistence with confidence and uncertainty tracking
- Real-time persona card updates during questionnaire
- Completion flow with summary and validation CTA
- Database schema for personas, responses, and sessions

**Out of Scope (Future Phases):**
- Validation mode (real users answering via shared link)
- Reconciliation mode (comparing assumptions to validations)
- Canvas enrichment integration (auto-updating profile sections)
- Voice input for additional context
- Question customization by founders

---

## 2. User Stories

### 2.1 Module Discovery

```
As a Clarity Canvas user who has completed my initial profile,
I want to discover enrichment modules that can deepen specific aspects of my profile,
So that I can gain more clarity in targeted areas like customer understanding.
```

**Acceptance Criteria:**
- [ ] "Explore Modules" button visible on ProfileScreen after initial brain dump
- [ ] Modules index page lists available modules with descriptions and icons
- [ ] Each module shows estimated completion time and what it enriches
- [ ] Persona Sharpener appears as the first (and initially only) module

### 2.2 Starting a Sharpening Session

```
As a founder starting Persona Sharpener,
I want to understand what I'm about to do and why it matters,
So that I'm mentally prepared for thoughtful, honest responses.
```

**Acceptance Criteria:**
- [ ] Welcome screen explains the purpose (capturing assumptions about customers)
- [ ] Clear indication that responses are tagged as "assumptions" until validated
- [ ] "Begin Sharpening" CTA starts the questionnaire
- [ ] Option to resume if a previous session was incomplete

### 2.3 Answering Questions

```
As a founder answering persona questions,
I want to provide my best guess while indicating my uncertainty level,
So that I can be honest about what I know vs. what I'm guessing.
```

**Acceptance Criteria:**
- [ ] 19 questions presented one at a time with progress indicator
- [ ] 6 question types supported: this-or-that, slider, ranking, multi-select, fill-blank, scenario
- [ ] "I'm not sure" checkbox available for every question (disables answer when checked)
- [ ] Confidence slider (0-100%) required for each answered question
- [ ] Optional "Add context" expandable field with text input
- [ ] Back/Skip/Continue navigation with proper state preservation
- [ ] Category indicator shows which aspect is being explored (identity, goals, frustrations, etc.)

### 2.4 Real-time Persona Updates

```
As a founder progressing through the questionnaire,
I want to see my persona card update in real-time,
So that I can visualize how my answers shape the customer profile.
```

**Acceptance Criteria:**
- [ ] Split-panel layout: 2/3 persona card, 1/3 questionnaire
- [ ] Persona card shows archetype name (auto-generated from emotional job + lifestyle)
- [ ] Clarity scores update per category as questions are answered
- [ ] Overall clarity percentage and confidence percentage visible
- [ ] "Unsure count" badge shows how many questions were marked uncertain
- [ ] Jobs-to-be-done section populates with functional/emotional/social jobs

### 2.5 Completing a Session

```
As a founder who has completed the questionnaire,
I want to see a summary of my persona and understand next steps,
So that I know what I've accomplished and how to validate my assumptions.
```

**Acceptance Criteria:**
- [ ] Completion screen shows final clarity % and average confidence %
- [ ] Count of questions marked as "unsure" highlighted for validation priority
- [ ] Explanation that these are assumptions until validated by real users
- [ ] "Generate Validation Link" CTA (disabled/placeholder for Phase 1)
- [ ] "Return to Profile" option to exit back to Clarity Canvas

---

## 3. Technical Architecture

### 3.1 Route Structure

```
app/
├── clarity-canvas/
│   ├── page.tsx                           # Existing - main profile
│   ├── ClarityCanvasClient.tsx            # Existing - add modules CTA
│   │
│   └── modules/
│       ├── page.tsx                       # NEW - Modules index
│       ├── ModulesIndexClient.tsx         # NEW - Client component
│       │
│       └── persona-sharpener/
│           ├── page.tsx                   # NEW - Server component (auth)
│           ├── PersonaSharpenerClient.tsx # NEW - Main client component
│           └── components/
│               ├── PersonaCard.tsx        # NEW - Left panel artifact
│               ├── InterviewPanel.tsx     # NEW - Right panel questionnaire
│               ├── QuestionRenderer.tsx   # NEW - Routes to question types
│               ├── QuestionMeta.tsx       # NEW - Wraps with confidence/unsure
│               ├── questions/             # NEW - Individual question components
│               │   ├── ThisOrThat.tsx
│               │   ├── Slider.tsx
│               │   ├── Ranking.tsx
│               │   ├── MultiSelect.tsx
│               │   ├── FillBlank.tsx
│               │   └── Scenario.tsx
│               ├── CompletionScreen.tsx   # NEW - Post-completion summary
│               └── WelcomeScreen.tsx      # NEW - Introduction
```

### 3.2 API Routes

```
app/api/clarity-canvas/modules/
├── route.ts                              # GET - List available modules
│
└── persona-sharpener/
    ├── personas/
    │   └── route.ts                      # GET/POST - Persona CRUD
    │
    ├── personas/[personaId]/
    │   ├── route.ts                      # GET/PUT/DELETE - Single persona
    │   └── responses/
    │       └── route.ts                  # GET/POST - Response management
    │
    ├── sessions/
    │   └── route.ts                      # POST - Create new session
    │
    └── questions/
        └── route.ts                      # GET - Question bank
```

### 3.3 Database Schema (Prisma)

```prisma
// ============================================================================
// CLARITY MODULES - Generic module infrastructure
// ============================================================================

model ClarityModule {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String
  icon        String   // Emoji or icon identifier
  estimatedMinutes Int
  enrichesSections String[] // Which profile sections this module enriches
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============================================================================
// PERSONA SHARPENER - Module-specific models
// ============================================================================

model Persona {
  id          String   @id @default(cuid())
  profileId   String   // Links to ClarityProfile
  profile     ClarityProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  name        String?  // Auto-generated archetype name
  isPrimary   Boolean  @default(true)

  // Structured fields (JSON for flexibility)
  demographics Json?   // { ageRange, lifestyle, techSavviness }
  jobs        Json?    // { functional, emotional, social }
  goals       Json?    // { priorities, successDefinition }
  frustrations Json?   // { pastFailures, dealbreakers, currentWorkaround }
  behaviors   Json?    // { decisionStyle, usageTime, timeAvailable, discoveryChannels, influences }
  antiPatterns String[]
  quote       String?

  // Computed scores (updated after each response)
  clarityOverall     Int @default(0)
  clarityIdentity    Int @default(0)
  clarityGoals       Int @default(0)
  clarityFrustrations Int @default(0)
  clarityEmotional   Int @default(0)
  clarityBehaviors   Int @default(0)

  // Tracking (V1: assumptions only; totalValidations added in validation-mode spec)
  totalAssumptions   Int @default(0)
  avgConfidence      Int @default(0)

  responses   Response[]
  sessions    SharpenerSession[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([profileId])
}

model Response {
  id          String   @id @default(cuid())
  personaId   String
  persona     Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)
  sessionId   String
  session     SharpenerSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  questionId  String   // e.g., 'age-range', 'lifestyle'
  field       String   // e.g., 'demographics.ageRange'

  // The answer
  value       Json     // Flexible: string, number, string[], object

  // Metadata
  isUnsure    Boolean  @default(false)
  confidence  Int      @default(50) // 0-100
  additionalContext String?
  contextSource String? // 'voice' | 'text' | null

  // Tagging (V1: founder assumptions only; respondentEmail added in validation-mode spec)
  responseType String  // 'assumption' (V1) | 'validation' (post-V1)
  respondentId String  // User ID
  respondentRole String // 'founder' (V1) | 'real-user' (post-V1)
  respondentName String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([personaId])
  @@index([sessionId])
  @@index([questionId])
}

model SharpenerSession {
  id          String   @id @default(cuid())
  personaId   String
  persona     Persona  @relation(fields: [personaId], references: [id], onDelete: Cascade)

  sessionType String   // 'sharpen' | 'validate'
  status      String   @default("in_progress") // 'in_progress' | 'completed' | 'abandoned'

  // Progress tracking
  lastQuestionIndex Int @default(0)
  questionsAnswered Int @default(0)
  questionsSkipped  Int @default(0)
  questionsUnsure   Int @default(0)

  startedAt   DateTime @default(now())
  completedAt DateTime?

  responses   Response[]

  @@index([personaId])
}

// NOTE: ValidationLink model deferred to validation-mode spec (feat-persona-sharpener-validation-mode.md)

// Update existing ClarityProfile to add personas relation
// (Add to existing model)
// personas Persona[]
```

### 3.4 Type Definitions

```typescript
// lib/clarity-canvas/modules/persona-sharpener/types.ts

export type QuestionType =
  | 'this-or-that'
  | 'slider'
  | 'ranking'
  | 'multi-select'
  | 'fill-blank'
  | 'scenario';

export type QuestionCategory =
  | 'identity'
  | 'goals'
  | 'frustrations'
  | 'emotional'
  | 'social'
  | 'behaviors'
  | 'antiPatterns';

export interface Question {
  id: string;
  type: QuestionType;
  category: QuestionCategory;
  field: string; // Maps to persona field, e.g., 'demographics.ageRange'
  question: string; // Founder-facing (assumption mode)
  validationQuestion: string | null; // User-facing (null = skip in validation)
  options?: QuestionOption[];
  items?: RankedItem[];
  blanks?: BlankConfig[];
  min?: string;
  max?: string;
  defaultValue?: number;
  maxSelections?: number;
  placeholder?: string;
  helperText?: string;
  instruction?: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface RankedItem {
  id: string;
  label: string;
  rank?: number;
}

export interface BlankConfig {
  id: string;
  placeholder: string;
  suggestions?: string[];
}

export interface ResponseInput {
  questionId: string;
  value: unknown;
  isUnsure: boolean;
  confidence: number;
  additionalContext?: string;
  contextSource?: 'voice' | 'text' | null;
}

export interface PersonaClarity {
  overall: number;
  identity: number;
  goals: number;
  frustrations: number;
  emotional: number;
  behaviors: number;
}

export interface PersonaDisplay {
  id: string;
  name: string;
  archetype: string;
  summary: string;
  quote: string | null;
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
    successDefinition?: Record<string, string>;
  };
  frustrations: {
    pastFailures?: string;
    dealbreakers?: string[];
    currentWorkaround?: Record<string, string>;
  };
  behaviors: {
    decisionStyle?: string;
    usageTime?: string;
    timeAvailable?: number;
    discoveryChannels?: RankedItem[];
    influences?: string[];
  };
  antiPatterns: string[];
  clarity: PersonaClarity;
  avgConfidence: number;
  unsureCount: number;
}

export interface SharpenerState {
  persona: PersonaDisplay;
  responses: Record<string, ResponseInput>;
  currentQuestionIndex: number;
  sessionId: string;
  isComplete: boolean;
}
```

### 3.5 Question Bank

The question bank contains 19 questions organized by category. Full definitions are in the handoff document. Key mapping:

| Category | Questions | Count |
|----------|-----------|-------|
| Identity | age-range, lifestyle, tech-savvy, decision-style | 4 |
| Goals | primary-goal, success-scenario, functional-job | 3 |
| Frustrations | past-failures, dealbreakers, current-workaround | 3 |
| Emotional | emotional-job, voice-capture, recommendation-trigger | 3 |
| Social | social-job, influence-sources | 2 |
| Behaviors | discovery-channel, usage-time, time-available | 3 |
| Anti-Patterns | not-customer | 1 |

Questions are presented in an interleaved order (not all identity questions first) to maintain engagement:
1. identity[0:2] → goals[0:2] → frustrations[0:2] → emotional[0:2] → behaviors[0:2]
2. identity[2:4] → goals[2:3] → frustrations[2:3] → social[0:2] → behaviors[2:3] → antiPatterns

---

## 4. UI/UX Specifications

### 4.1 Design System Compliance

Follow 33 Strategies design system:

```typescript
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

**Semantic Color Usage:**
- **Gold (#D4A84B):** Primary accent, CTAs, highlights, active states
- **Orange (#FB923C):** Assumptions, uncertainty markers, warnings
- **Green (#4ADE80):** Validations, success states, high confidence
- **Blue (#60A5FA):** Information, validation invitations, secondary actions

**Typography:**
- Headlines: `font-display` (Instrument Serif)
- Body: `font-body` (DM Sans)
- Labels/Tags: `font-mono` (JetBrains Mono) with uppercase and letter-spacing

### 4.2 Layout: Modules Index

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Profile              Clarity Modules             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Enrich Your Profile                                       │
│   Complete focused experiences to deepen specific aspects   │
│   of your clarity profile.                                  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  👤  Persona Sharpener                    ~10 min   │   │
│   │                                                     │   │
│   │  Build a detailed, research-backed customer         │   │
│   │  persona with assumption tracking and validation.   │   │
│   │                                                     │   │
│   │  Enriches: Target Customer • Value Prop • Problem   │   │
│   │                                                     │   │
│   │                                    [Start →]        │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  🎯  Coming Soon: Problem Validator                 │   │
│   │  ...                                                │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Layout: Persona Sharpener (Questionnaire)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Back    Persona Sharpener    [ASSUMPTIONS MODE]    ~8 min    [Save & Exit]│
├───────────────────────────────────────────────┬─────────────────────────────┤
│                                               │  SHARPENING QUESTIONS       │
│   PRIMARY PERSONA  [ASSUMPTIONS]              │  identity • 5 / 19          │
│                                               │  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░  │
│   👤  The Efficient Optimizer                 ├─────────────────────────────┤
│       Mid-career professional juggling        │                             │
│       multiple priorities who wants to        │  Your ideal customer is     │
│       feel in control.                        │  more likely to be...       │
│                                               │                             │
│   ┌─────────────┬─────────────┐               │  ┌───────────────────────┐  │
│   │  Clarity    │  Confidence │               │  │  18-35                │  │
│   │    68%      │     73%     │               │  │  Digital native       │  │
│   └─────────────┴─────────────┘               │  └───────────────────────┘  │
│                                               │  ┌───────────────────────┐  │
│   ⚠ 3 questions marked uncertain              │  │  35-50         ← ★    │  │
│                                               │  │  Established career   │  │
│   ────────────────────────────                │  └───────────────────────┘  │
│                                               │  ┌───────────────────────┐  │
│   "I don't have time to waste on              │  │  50+                  │  │
│    things that don't work."                   │  │  Values quality       │  │
│                                               │  └───────────────────────┘  │
│   ────────────────────────────                │                             │
│                                               │  ─────────────────────────  │
│   ┌────────┬────────┬────────┬────────┐       │                             │
│   │Identity│ Goals  │Frustr. │Emotion.│       │  ☐ I'm not sure about this │
│   │  75%   │  60%   │  50%   │  40%   │       │    That's okay — we'll      │
│   └────────┴────────┴────────┴────────┘       │    flag for validation      │
│                                               │                             │
│   JOBS TO BE DONE                             │  Confidence: ▓▓▓▓▓▓░░ 73%  │
│   ✓ Functional: Fit workouts into...         │  [Just guessing → Have data]│
│   ✓ Emotional: Feel in control               │                             │
│   ○ Social: Not yet captured                 │  [+ Add context (optional)] │
│                                               │                             │
│   ────────────────────────────                │  ─────────────────────────  │
│                                               │                             │
│   Goals          │  Frustrations              │  [← Back]        [Continue →]│
│   • Save time    │  • Too much effort         │                             │
│   • Be healthier │  • Too slow results        │                             │
│                                               │                             │
└───────────────────────────────────────────────┴─────────────────────────────┘
```

### 4.4 Component Specifications

#### Question Meta Wrapper
Every question is wrapped with three standard elements:
1. **"I'm not sure" checkbox** - Orange styling, disables answer when checked
2. **Confidence slider** - 0-100%, color-coded (orange → gold → green)
3. **Additional context input** - Collapsible, text input with voice toggle (future)

#### Persona Card Updates
- Archetype name generated from: `${emotionalJob}-${lifestyle}` → lookup table
- Summary generated from demographics + emotional job
- Clarity scores recalculated after each answer (not unsure)
- Quote populated from voice-capture question

---

## 5. Data Flow

### 5.1 Starting a Session

```
User clicks "Start Persona Sharpener"
    ↓
GET /api/clarity-canvas/modules/persona-sharpener/personas?profileId={id}
    ↓
If no persona exists:
    POST /api/clarity-canvas/modules/persona-sharpener/personas
    → Creates empty Persona linked to ClarityProfile
    ↓
POST /api/clarity-canvas/modules/persona-sharpener/sessions
    → Creates SharpenerSession with sessionType='sharpen'
    ↓
GET /api/clarity-canvas/modules/persona-sharpener/questions
    → Returns question bank (19 questions in sequence order)
    ↓
Render PersonaSharpenerClient with initial state
```

### 5.2 Answering a Question

```
User selects answer, sets confidence, optionally marks unsure
    ↓
Local state update:
    - responses[questionId] = { value, isUnsure, confidence, ... }
    - Recalculate persona display (archetype, summary, clarity scores)
    - Update persona card (real-time, no API call yet)
    ↓
User clicks "Continue"
    ↓
POST /api/clarity-canvas/modules/persona-sharpener/personas/{id}/responses
    → Body: { sessionId, questionId, value, isUnsure, confidence, ... }
    → Creates Response record
    → Updates Persona JSON fields and clarity scores
    → Returns updated { persona, clarity }
    ↓
Advance to next question
```

### 5.3 Completing a Session

```
User answers last question and clicks "Complete"
    ↓
PUT /api/clarity-canvas/modules/persona-sharpener/sessions/{id}
    → Body: { status: 'completed', completedAt: now() }
    ↓
GET /api/clarity-canvas/modules/persona-sharpener/personas/{id}
    → Returns final persona with all scores
    ↓
Render CompletionScreen with summary
```

---

## 6. Scoring Algorithms

### 6.1 Clarity Score Calculation

```typescript
function calculateClarity(responses: Response[]): PersonaClarity {
  const categoryQuestionCounts = {
    identity: 4,
    goals: 3,
    frustrations: 3,
    emotional: 3,
    behaviors: 3,
  };

  const scores: PersonaClarity = {
    overall: 0,
    identity: 0,
    goals: 0,
    frustrations: 0,
    emotional: 0,
    behaviors: 0,
  };

  // Count answered (not unsure) questions per category
  responses.forEach(response => {
    if (!response.isUnsure && response.value !== undefined) {
      const question = getQuestionById(response.questionId);
      const category = question.category;

      // Map social to emotional, antiPatterns excluded from scoring
      const scoreCategory = category === 'social' ? 'emotional' : category;

      if (scoreCategory !== 'antiPatterns' && scores[scoreCategory] !== undefined) {
        scores[scoreCategory] += (100 / categoryQuestionCounts[scoreCategory]);
      }
    }
  });

  // Cap at 100
  Object.keys(scores).forEach(key => {
    if (key !== 'overall') {
      scores[key] = Math.min(100, Math.round(scores[key]));
    }
  });

  // Overall is average of 5 categories
  scores.overall = Math.round(
    (scores.identity + scores.goals + scores.frustrations +
     scores.emotional + scores.behaviors) / 5
  );

  return scores;
}
```

### 6.2 Average Confidence Calculation

```typescript
function calculateAvgConfidence(responses: Response[]): number {
  const answeredResponses = responses.filter(
    r => !r.isUnsure && r.value !== undefined
  );

  if (answeredResponses.length === 0) return 0;

  const totalConfidence = answeredResponses.reduce(
    (sum, r) => sum + r.confidence, 0
  );

  return Math.round(totalConfidence / answeredResponses.length);
}
```

### 6.3 Archetype Generation

```typescript
const archetypes: Record<string, string> = {
  'in-control-busy-professional': 'The Efficient Optimizer',
  'in-control-balanced-seeker': 'The Calm Commander',
  'accomplished-busy-professional': 'The Driven Achiever',
  'accomplished-balanced-seeker': 'The Mindful Achiever',
  'cared-for-busy-professional': 'The Overwhelmed Overcomer',
  'cared-for-balanced-seeker': 'The Supported Striver',
  'free-busy-professional': 'The Escaping Executive',
  'free-balanced-seeker': 'The Peace Seeker',
};

function generateArchetype(persona: PersonaDisplay): string {
  const emotionalJob = persona.jobs?.emotional || '';
  const lifestyle = persona.demographics?.lifestyle || '';
  const key = `${emotionalJob}-${lifestyle}`;
  return archetypes[key] || 'Your Ideal Customer';
}
```

---

## 7. API Specifications

### 7.1 GET /api/clarity-canvas/modules

**Response:**
```json
{
  "modules": [
    {
      "id": "clm_...",
      "slug": "persona-sharpener",
      "name": "Persona Sharpener",
      "description": "Build a detailed, research-backed customer persona with assumption tracking and validation.",
      "icon": "👤",
      "estimatedMinutes": 10,
      "enrichesSections": ["Individual", "Goals", "Network"],
      "isActive": true
    }
  ]
}
```

### 7.2 POST /api/clarity-canvas/modules/persona-sharpener/personas

**Request:**
```json
{
  "profileId": "clp_..."
}
```

**Response:**
```json
{
  "persona": {
    "id": "per_...",
    "profileId": "clp_...",
    "name": null,
    "isPrimary": true,
    "demographics": null,
    "jobs": null,
    "goals": null,
    "frustrations": null,
    "behaviors": null,
    "antiPatterns": [],
    "quote": null,
    "clarityOverall": 0,
    "clarityIdentity": 0,
    "clarityGoals": 0,
    "clarityFrustrations": 0,
    "clarityEmotional": 0,
    "clarityBehaviors": 0,
    "totalAssumptions": 0,
    "totalValidations": 0,
    "avgConfidence": 0,
    "createdAt": "2025-01-04T...",
    "updatedAt": "2025-01-04T..."
  }
}
```

### 7.3 POST /api/clarity-canvas/modules/persona-sharpener/personas/{id}/responses

**Request:**
```json
{
  "sessionId": "ses_...",
  "questionId": "age-range",
  "value": "middle",
  "isUnsure": false,
  "confidence": 75,
  "additionalContext": "Based on Q3 customer interviews...",
  "contextSource": "text"
}
```

**Response:**
```json
{
  "response": {
    "id": "res_...",
    "personaId": "per_...",
    "sessionId": "ses_...",
    "questionId": "age-range",
    "field": "demographics.ageRange",
    "value": "middle",
    "isUnsure": false,
    "confidence": 75,
    "additionalContext": "Based on Q3 customer interviews...",
    "contextSource": "text",
    "responseType": "assumption",
    "respondentId": "usr_...",
    "respondentRole": "founder",
    "createdAt": "2025-01-04T..."
  },
  "persona": { /* Updated persona object */ },
  "clarity": {
    "overall": 15,
    "identity": 25,
    "goals": 0,
    "frustrations": 0,
    "emotional": 0,
    "behaviors": 0
  }
}
```

### 7.4 GET /api/clarity-canvas/modules/persona-sharpener/questions

**Response:**
```json
{
  "questions": [
    {
      "id": "age-range",
      "type": "this-or-that",
      "category": "identity",
      "field": "demographics.ageRange",
      "question": "Your ideal customer is more likely to be...",
      "validationQuestion": "Which age range best describes you?",
      "options": [
        { "value": "younger", "label": "18-35", "sublabel": "Digital native, mobile-first" },
        { "value": "middle", "label": "35-50", "sublabel": "Established career, time-poor" },
        { "value": "older", "label": "50+", "sublabel": "More deliberate, values quality" }
      ]
    },
    // ... 18 more questions
  ]
}
```

---

## 8. Implementation Plan

### Phase 1: Foundation (Database + Routes)
**Estimated Effort:** 4-6 hours

1. Add Prisma schema models (ClarityModule, Persona, Response, SharpenerSession, ValidationLink)
2. Run migration: `npx prisma migrate dev --name add_persona_sharpener_models`
3. Update ClarityProfile model to add `personas` relation
4. Create `/api/clarity-canvas/modules/route.ts` - list modules
5. Create `/api/clarity-canvas/modules/persona-sharpener/personas/route.ts` - CRUD
6. Create `/api/clarity-canvas/modules/persona-sharpener/questions/route.ts` - question bank
7. Create type definitions in `lib/clarity-canvas/modules/persona-sharpener/types.ts`
8. Create question bank in `lib/clarity-canvas/modules/persona-sharpener/questions.ts`

### Phase 2: Module Index UI
**Estimated Effort:** 2-3 hours

1. Create `/app/clarity-canvas/modules/page.tsx` (server component with auth)
2. Create `ModulesIndexClient.tsx` with module cards
3. Add "Explore Modules" button to ClarityCanvasClient ProfileScreen
4. Style according to 33 Strategies design system
5. Seed ClarityModule table with Persona Sharpener entry

### Phase 3: Persona Sharpener UI
**Estimated Effort:** 8-10 hours

1. Create `/app/clarity-canvas/modules/persona-sharpener/page.tsx`
2. Create `PersonaSharpenerClient.tsx` with multi-step flow
3. Port question components from `persona-sharpener-v2.jsx`:
   - ThisOrThat, Slider, Ranking, MultiSelect, FillBlank, Scenario (6 types)
4. Create `QuestionMeta.tsx` wrapper (unsure checkbox, confidence slider, context input)
5. Create `PersonaCard.tsx` with real-time updates
6. Create `InterviewPanel.tsx` with navigation
7. Create `WelcomeScreen.tsx` and `CompletionScreen.tsx`
8. Implement scoring calculations
9. Implement archetype generation

### Phase 4: API Integration
**Estimated Effort:** 3-4 hours

1. Create `/api/clarity-canvas/modules/persona-sharpener/sessions/route.ts`
2. Create `/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/route.ts`
3. Create `/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/responses/route.ts`
4. Connect UI to APIs:
   - Session creation on module start
   - Response persistence on question answer
   - Persona fetching on page load
5. Handle resume flow (existing incomplete session)

### Phase 5: Polish & Testing
**Estimated Effort:** 2-3 hours

1. Add Framer Motion animations (consistent with existing Clarity Canvas)
2. Responsive design adjustments (mobile stacked layout)
3. Error handling and loading states
4. Manual testing of complete flow
5. Edge case handling (empty responses, navigation, refresh)

---

## 9. Testing Scenarios

### Happy Path
1. User has completed Clarity Canvas brain dump
2. Clicks "Explore Modules" → sees modules index
3. Clicks "Start" on Persona Sharpener → sees welcome screen
4. Completes all 19 questions with varying confidence
5. Marks 2-3 questions as "unsure"
6. Adds context to 5-6 questions
7. Sees persona card update in real-time
8. Completes → sees summary with clarity % and confidence %
9. Returns to profile → can access modules again

### Edge Cases
- User abandons mid-session → can resume later
- User marks all questions as "unsure" → 0% clarity, warning displayed
- User skips many questions → partial persona with low clarity
- User refreshes page mid-session → state restored from last saved response
- User has no ClarityProfile yet → redirect to main Clarity Canvas
- Database error during save → graceful error handling, retry option

---

## 10. Success Metrics

### Functional Success
- [ ] Modules index accessible from Clarity Canvas profile
- [ ] All 19 questions render correctly with appropriate input types
- [ ] Responses persist to database with correct metadata
- [ ] Clarity scores calculate correctly per category
- [ ] Archetype generates correctly based on emotional job + lifestyle
- [ ] Session can be resumed if abandoned
- [ ] Completion screen shows accurate summary

### Quality Success
- [ ] UI matches 33 Strategies design system
- [ ] Animations are smooth (60fps)
- [ ] Page loads in <2 seconds
- [ ] No console errors in production
- [ ] Responsive on mobile (stacked layout)

---

## 11. Dependencies

### External
- **Prisma:** Database ORM (already installed)
- **Framer Motion:** Animations (already installed)
- **NextAuth:** Authentication (already configured)

### Internal
- **ClarityProfile:** Must exist for user before starting Persona Sharpener
- **Authentication:** User must be logged in to access modules
- **API Routes:** Must follow existing patterns in `/api/clarity-canvas/`

---

## 12. Open Questions (Resolved)

1. **Multi-Persona Support?** → Phase 1 supports single primary persona per profile. Multi-persona is future scope.

2. **Question Customization?** → Out of scope. Questions are hardcoded in Phase 1.

3. **Voice Input for Context?** → Text-only for Phase 1. Voice toggle is UI placeholder for future.

4. **Validation Mode?** → Out of scope for this spec. Covered in future Phase 2 spec.

---

## 13. References

- **Handoff Document:** `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-sharpener-handoff.md`
- **UI Prototype (v2):** `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-sharpener-v2.jsx`
- **Details Page Prototype:** `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/persona-details-page.jsx`
- **Clarity Canvas Spec:** `specs/feat-clarity-canvas-core-builder.md`
- **33 Strategies Design System:** `.claude/skills/33-strategies-frontend-design.md`

---

## 14. Follow-up: Validation Mode

After V1 is implemented and tested, immediately proceed to:

**`specs/feat-persona-sharpener-validation-mode.md`**

This proto-spec covers:
- ValidationLink model and link generation
- Public validation page (no auth)
- Real user response collection with `respondentEmail`
- `totalValidations` field on Persona
- Alignment scoring and reconciliation view
- Assumption vs. validation comparison UI

The validation mode spec is designed to be implemented as a direct follow-on to V1.

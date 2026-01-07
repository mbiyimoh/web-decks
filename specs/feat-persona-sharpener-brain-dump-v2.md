# Feature Specification: Enhanced Persona Sharpener with Brain Dump

**Slug:** `feat-persona-sharpener-brain-dump-v2`
**Author:** Claude Code
**Date:** 2026-01-05
**Status:** Ready for Implementation
**Ideation:** `docs/ideation/persona-sharpener-brain-dump-multi-persona.md`

---

## 1. Overview

### Problem Statement
The current Persona Sharpener drops users directly into a 19-question questionnaire without context. Users must answer every question from scratch, even when they could provide rich context upfront that would:
1. Pre-populate persona attributes
2. Identify multiple customer types
3. Enable smarter, shorter questionnaires

### Solution
Add a pre-interview "brain dump" step where users describe their product and ideal customers via voice (30-60s) or text. AI extracts 1-3 initial personas with attribute-level confidence scores. The questionnaire then:
- Skips questions where high-confidence data exists
- Reorders remaining questions by confidence gaps
- Contextualizes wording based on what the user mentioned
- Supports switching between multiple personas

### Success Metrics
- **Time to first persona:** <8 minutes (vs ~15 min currently)
- **Completion rate:** >70% (measure drop-off at each step)
- **User satisfaction:** "Questions felt relevant" feedback score >4/5
- **Multi-persona adoption:** >40% of users complete 2+ personas

---

## 2. User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: Welcome + Brain Dump                                       │
│                                                                     │
│  "Let's build your customer personas"                               │
│                                                                     │
│  [Voice] [Text]  ← Tab toggle                                       │
│                                                                     │
│  "Who are you building for? Paint a picture of the person who       │
│   is going to benefit from the thing you are creating."             │
│                                                                     │
│  Tip: "You can mention up to 3 different customer types."           │
│                                                                     │
│  [🎤 Start Recording]  or  [Text area]                              │
│  [Continue →]                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2: Processing (3-8 seconds)                                   │
│                                                                     │
│  "Analyzing your description..."                                    │
│  [Animated waveform / pulsing dots]                                 │
│                                                                     │
│  Progress indicators (appear sequentially):                         │
│  ✓ Transcribing audio...                                            │
│  ✓ Identifying customer personas...                                 │
│  ○ Customizing your questions...                                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3: Persona Confirmation                                       │
│                                                                     │
│  "We identified 2 personas from your description"                   │
│                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐           │
│  │ 👤 The Busy Executive   │  │ 👤 The Growth Marketer  │           │
│  │                         │  │                         │           │
│  │ Mid-career professional │  │ Data-driven, under 35   │           │
│  │ Values efficiency       │  │ Needs quick wins        │           │
│  │ Functional: Save time   │  │ Functional: Prove ROI   │           │
│  │                         │  │                         │           │
│  │ 🟢 High confidence      │  │ 🟡 Medium confidence    │           │
│  │ ~8 questions            │  │ ~12 questions           │           │
│  └─────────────────────────┘  └─────────────────────────┘           │
│                                                                     │
│  "We suggest starting with 'The Busy Executive' - we captured       │
│   the most detail about them from your description."                │
│                                                                     │
│  [Start with The Busy Executive →]                                  │
│  [Choose a different persona]                                       │
│                                                                     │
│  [+ Add another persona manually]                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4: Questionnaire (per persona)                                │
│                                                                     │
│  ┌─────────────────────────────┬───────────────────────────────────┐│
│  │ PERSONA SWITCHER            │  Question 3 of 8                  ││
│  │                             │  (11 pre-populated from brain     ││
│  │ [●] The Busy Executive      │   dump)                           ││
│  │ [ ] The Growth Marketer     │                                   ││
│  │                             │                                   ││
│  │─────────────────────────────│  Their primary goal is...         ││
│  │                             │                                   ││
│  │ YOUR IDEAL CUSTOMER         │  ┌─────────────────────────────┐  ││
│  │                             │  │ You mentioned earlier that  │  ││
│  │ Demographics                │  │ they want to "save time and │  ││
│  │ • 35-50, busy professional  │  │ feel in control"...         │  ││
│  │ • Tech-savvy, time-poor     │  │                             │  ││
│  │                             │  │ Does that still feel right? │  ││
│  │ Jobs to be Done             │  │                             │  ││
│  │ • Feel in control           │  │ [Yes, that's right ✓]       │  ││
│  │ • Save time on admin        │  │ [Let me refine this]        │  ││
│  │                             │  └─────────────────────────────┘  ││
│  │ Frustrations                │                                   ││
│  │ • Too many tools            │  OR if no pre-populated value:    ││
│  │ • Context switching         │  [Standard question UI]           ││
│  │                             │                                   ││
│  │ Clarity: 45% ████░░░░       │                                   ││
│  │ Confidence: 72% ███████░    │                                   ││
│  └─────────────────────────────┴───────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5: Persona Complete → Next Persona                            │
│                                                                     │
│  "The Busy Executive is ready!"                                     │
│                                                                     │
│  [Animated persona card summary]                                    │
│                                                                     │
│  "Ready to sharpen your next persona?"                              │
│                                                                     │
│  ┌─────────────────────────┐                                        │
│  │ 👤 The Growth Marketer  │                                        │
│  │ ~12 questions remaining │                                        │
│  │ [Continue →]            │                                        │
│  └─────────────────────────┘                                        │
│                                                                     │
│  [Skip for now]  [View completed personas]                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6: All Complete                                               │
│                                                                     │
│  "All 2 personas complete!"                                         │
│                                                                     │
│  [Side-by-side persona summary cards]                               │
│                                                                     │
│  Combined Clarity: 78%                                              │
│  5 assumptions flagged for validation                               │
│                                                                     │
│  [Return to Clarity Canvas]  [Share for Validation] (coming soon)   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Locked Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Brain dump prompt | "Who are you building for? Paint a picture of the person who is going to benefit from the thing you are creating." | Customer-focused, evocative |
| 2 | Multiple personas display | Show all immediately with progressive disclosure | Transparency, user control |
| 3 | Confirmation detail level | Full attribute preview (demographics, jobs, goals) | Builds confidence |
| 4 | Skip feedback | "You mentioned earlier that [value]... does that still feel right?" | Conversational, confirms accuracy |
| 5 | Completion order | User chooses with system suggestion | Agency with guidance |
| 6 | Brain dump storage | Store transcript + extracted personas (immutable) | Audit trail, reproducibility |
| 7 | Schema changes | Create separate `PersonaBrainDump` model | Clean separation |
| 8 | API structure | Single `/personas/brain-dump` endpoint | Atomic operation |
| 9 | Question customization | Batch pre-generate all customized questions | Natural phrasing, no per-question latency |
| 10 | Extraction failures | Graceful fallback to single generic persona | Never block user |

---

## 4. Technical Architecture

### 4.1 Data Model Changes

```prisma
// Add to prisma/schema.prisma

model PersonaBrainDump {
  id              String   @id @default(cuid())
  profileId       String
  profile         ClarityProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  // Input
  inputType       String   // "voice" | "text"
  rawTranscript   String   @db.Text
  audioBlobUrl    String?  // S3/R2 URL if voice input
  durationSeconds Int?     // Voice recording duration

  // Extraction Output (immutable snapshot)
  extractedData   Json     // Full extraction response
  personaCount    Int      // 1-3
  overallContext  Json     // { productDescription, marketContext }

  // Generated Questions (batch pre-generated)
  customizedQuestions Json // Array of question objects with contextualized wording

  // Metadata
  createdAt       DateTime @default(now())
  processingMs    Int?     // Total extraction time

  // Relations
  personas        Persona[]

  @@index([profileId])
}

// Update Persona model
model Persona {
  // ... existing fields ...

  // Link to brain dump (optional - manual personas won't have this)
  brainDumpId     String?
  brainDump       PersonaBrainDump? @relation(fields: [brainDumpId], references: [id])

  // Extraction metadata
  extractionConfidence Float?  // 0-1 overall confidence
  skippedQuestionIds   String[] // Questions auto-populated from brain dump

  @@index([brainDumpId])
}
```

### 4.2 Extraction Schema

```typescript
// lib/clarity-canvas/modules/persona-sharpener/brain-dump-schema.ts

import { z } from 'zod';

// Individual persona extracted from brain dump
export const extractedPersonaSchema = z.object({
  displayName: z.string()
    .describe("Short memorable name like 'The Busy Executive' or 'The Side Hustler'"),

  confidence: z.number().min(0).max(1)
    .describe("Overall extraction confidence (0-1)"),

  // Demographics
  demographics: z.object({
    ageRange: z.string().nullable(),
    lifestyle: z.string().nullable(),
    location: z.string().nullable(),
  }).optional(),

  // Jobs to be Done
  jobs: z.object({
    functional: z.string().nullable()
      .describe("Practical task they want to accomplish"),
    emotional: z.string().nullable()
      .describe("How they want to feel"),
    social: z.string().nullable()
      .describe("How they want to be perceived"),
  }).optional(),

  // Goals & Frustrations
  goals: z.object({
    primary: z.string().nullable(),
    secondary: z.string().nullable(),
  }).optional(),

  frustrations: z.object({
    main: z.string().nullable(),
    secondary: z.string().nullable(),
  }).optional(),

  // Behaviors
  behaviors: z.object({
    informationSources: z.string().nullable(),
    decisionStyle: z.string().nullable(),
  }).optional(),

  // Field-level confidence for skip logic
  fieldConfidence: z.record(z.string(), z.number())
    .describe("Confidence per field path, e.g., { 'demographics.ageRange': 0.9 }"),

  // Raw quote if they said something specific about this persona
  rawQuote: z.string().nullable(),
});

// Full extraction response
export const brainDumpExtractionResponseSchema = z.object({
  personas: z.array(extractedPersonaSchema).max(3),

  overallContext: z.object({
    productDescription: z.string()
      .describe("What the user is building, in their words"),
    marketContext: z.string().nullable()
      .describe("Industry, stage, or market context mentioned"),
    keyThemes: z.array(z.string())
      .describe("Recurring themes across personas"),
  }),
});

export type ExtractedPersona = z.infer<typeof extractedPersonaSchema>;
export type BrainDumpExtractionResponse = z.infer<typeof brainDumpExtractionResponseSchema>;
```

### 4.3 Customized Question Schema

```typescript
// lib/clarity-canvas/modules/persona-sharpener/customized-question-schema.ts

import { z } from 'zod';

export const customizedQuestionSchema = z.object({
  // Original question reference
  questionId: z.string(),
  originalText: z.string(),

  // Skip logic
  shouldSkip: z.boolean()
    .describe("True if high-confidence value exists from brain dump"),
  skipReason: z.string().nullable()
    .describe("If skipping, the pre-populated value"),

  // Contextualized version
  contextualizedText: z.string()
    .describe("Question rewritten to reference brain dump context"),
  contextualizedConfirmation: z.string().nullable()
    .describe("For skipped questions: 'You mentioned earlier that [X]... does that still feel right?'"),

  // Priority (lower = ask first)
  priority: z.number()
    .describe("1-19, based on confidence gaps"),
});

export const customizedQuestionsResponseSchema = z.object({
  personaId: z.string(),
  questions: z.array(customizedQuestionSchema),
  totalQuestions: z.number(),
  skippedCount: z.number(),
  estimatedMinutes: z.number(),
});

export type CustomizedQuestion = z.infer<typeof customizedQuestionSchema>;
```

### 4.4 API Endpoints

#### POST `/api/clarity-canvas/modules/persona-sharpener/brain-dump`

**Purpose:** Process brain dump, extract personas, generate customized questions

**Request:**
```typescript
{
  profileId: string;
  inputType: "voice" | "text";
  transcript: string;           // Raw transcript (from Whisper or text input)
  audioBlobUrl?: string;        // If voice, S3/R2 URL
  durationSeconds?: number;     // If voice
}
```

**Response:**
```typescript
{
  brainDumpId: string;
  personas: Array<{
    id: string;                 // Created persona ID
    displayName: string;
    confidence: number;
    questionCount: number;      // Questions after skip logic
    estimatedMinutes: number;
  }>;
  overallContext: {
    productDescription: string;
    marketContext: string | null;
  };
  suggestedStartPersonaId: string;  // Highest confidence
  processingMs: number;
}
```

**Implementation Flow:**
1. Validate input, check profile exists
2. Call GPT-4o-mini with extraction schema
3. For each extracted persona:
   a. Create Persona record
   b. Generate customized questions (batch GPT call)
   c. Calculate skip count and estimated time
4. Create PersonaBrainDump record
5. Return summary

#### GET `/api/clarity-canvas/modules/persona-sharpener/personas/[personaId]/questions`

**Purpose:** Get customized questions for a persona

**Response:**
```typescript
{
  personaId: string;
  questions: Array<{
    questionId: string;
    text: string;               // Contextualized if available
    type: "ranking" | "freetext" | "multiselect" | "scale";
    options?: string[];

    // Skip logic
    isSkipped: boolean;
    skippedValue?: string;
    confirmationPrompt?: string; // "You mentioned earlier that..."
  }>;
  progress: {
    answered: number;
    total: number;
    skipped: number;
  };
}
```

### 4.5 Component Architecture

```
app/clarity-canvas/modules/persona-sharpener/
├── page.tsx                           # Server component (auth)
├── PersonaSharpenerClient.tsx         # Main orchestrator (updated)
├── ErrorBoundary.tsx                  # Existing
│
├── components/
│   ├── WelcomeStep.tsx               # Existing (update for new flow)
│   ├── BrainDumpStep.tsx             # NEW - Voice/text input
│   ├── ProcessingStep.tsx            # NEW - Extraction progress
│   ├── PersonaConfirmation.tsx       # NEW - Review extracted personas
│   ├── PersonaSwitcher.tsx           # NEW - Left panel switcher
│   ├── QuestionnaireStep.tsx         # Existing (update for skip logic)
│   ├── PersonaCard.tsx               # Existing (minor updates)
│   ├── SkipConfirmation.tsx          # NEW - "Does this still feel right?"
│   ├── PersonaCompleteStep.tsx       # NEW - Single persona done
│   └── AllCompleteStep.tsx           # NEW - All personas done
```

### 4.6 State Machine

```typescript
type PersonaSharpenerStep =
  | 'welcome'           // Show brain dump prompt
  | 'brain-dump'        // Voice/text input
  | 'processing'        // AI extraction in progress
  | 'confirmation'      // Review extracted personas
  | 'questionnaire'     // Active questionnaire (per persona)
  | 'persona-complete'  // Single persona finished
  | 'all-complete';     // All personas finished

interface PersonaSharpenerState {
  step: PersonaSharpenerStep;

  // Brain dump
  brainDumpId: string | null;
  transcript: string;

  // Personas
  personas: Array<{
    id: string;
    displayName: string;
    confidence: number;
    isComplete: boolean;
    questionCount: number;
    answeredCount: number;
  }>;
  activePersonaId: string | null;

  // Questions (for active persona)
  questions: CustomizedQuestion[];
  currentQuestionIndex: number;

  // UI state
  isProcessing: boolean;
  error: string | null;
}
```

---

## 5. Implementation Phases

### Phase 1: Brain Dump Capture + Extraction API (2 days)

**Goal:** User can record voice or type text, system extracts 1-3 personas

**Tasks:**
1. Create `PersonaBrainDump` Prisma model, run migration
2. Update `Persona` model with brain dump fields
3. Create `brain-dump-schema.ts` with Zod schemas
4. Build `BrainDumpStep.tsx` component
   - Tab toggle: Voice / Text
   - Reuse VoiceRecorder for voice mode
   - Textarea with character count for text mode
   - "Continue" button triggers processing
5. Build `ProcessingStep.tsx` component
   - Animated progress indicators
   - Sequential status updates
6. Create `/api/.../brain-dump` endpoint
   - Extraction prompt engineering
   - GPT-4o-mini structured output
   - Persona record creation
7. Test with 5+ sample transcripts

**Validation:**
- [ ] Voice recording produces transcript
- [ ] Text input works with same pipeline
- [ ] 1-3 personas extracted from varied inputs
- [ ] Personas saved to database

### Phase 2: Persona Confirmation Screen (1 day)

**Goal:** User sees extracted personas and can start questionnaire

**Tasks:**
1. Build `PersonaConfirmation.tsx` component
   - Persona cards with confidence badges
   - Attribute preview (demographics, jobs, goals)
   - Question count estimate per persona
   - System suggestion for which to start
2. Add "Add another persona manually" flow
3. Wire confirmation → questionnaire transition
4. Update PersonaSharpenerClient state machine

**Validation:**
- [ ] All extracted personas display correctly
- [ ] Confidence levels visualized (green/yellow/red)
- [ ] User can select which persona to start
- [ ] System suggestion appears

### Phase 3: Customized Question Generation (1.5 days)

**Goal:** Questions are contextualized and prioritized per persona

**Tasks:**
1. Create `customized-question-schema.ts`
2. Build question customization prompt
   - Input: base questions + extracted persona + brain dump context
   - Output: skip decisions, reordering, contextualized wording
3. Add batch generation to brain-dump API (or separate endpoint)
4. Store customized questions in PersonaBrainDump.customizedQuestions
5. Create `SkipConfirmation.tsx` component
   - "You mentioned earlier that [X]... does that still feel right?"
   - [Yes, that's right] / [Let me refine this]
6. Update QuestionnaireStep to use customized questions
7. Update question API to serve customized versions

**Validation:**
- [ ] Questions reordered by confidence gap
- [ ] High-confidence fields show skip confirmation
- [ ] Question wording references brain dump context
- [ ] Skip confirmation UI works

### Phase 4: Multi-Persona UI (1 day)

**Goal:** User can switch between personas during questionnaire

**Tasks:**
1. Build `PersonaSwitcher.tsx` component
   - List all personas with completion %
   - Active persona highlighted with gold
   - Click to switch (with save prompt)
   - Keyboard shortcuts (Cmd+1, Cmd+2, Cmd+3)
2. Add switcher to left panel above PersonaCard
3. Build `PersonaCompleteStep.tsx`
   - Celebration animation
   - Summary of completed persona
   - Prompt for next persona
4. Build `AllCompleteStep.tsx`
   - All personas side-by-side
   - Combined clarity score
   - Navigation options
5. Handle partial completion (skip for now)

**Validation:**
- [ ] Persona switcher appears in questionnaire
- [ ] Switching saves progress and loads new questions
- [ ] Keyboard shortcuts work
- [ ] Completion flow handles multiple personas

### Phase 5: Polish + Edge Cases (0.5 days)

**Goal:** Production-ready experience

**Tasks:**
1. Extraction failure handling
   - Fallback to single generic persona
   - User notification without blocking
2. Empty brain dump handling
   - Minimum character/duration requirement
   - Helpful error message
3. Browser speech API fallback
   - Text-only mode for unsupported browsers
4. Loading states and transitions
   - Smooth animations between steps
   - Skeleton loaders
5. Error boundary updates
6. Analytics events for funnel tracking

**Validation:**
- [ ] Graceful handling of API failures
- [ ] Works in Safari/Firefox (text fallback)
- [ ] All transitions smooth
- [ ] No console errors

---

## 6. Extraction Prompt

```markdown
# Persona Extraction System Prompt

You are an expert at identifying customer personas from founder descriptions. Extract up to 3 distinct personas from the transcript below.

## Rules
1. Only extract personas explicitly mentioned or strongly implied
2. Never invent details - use null for missing attributes
3. Each persona should be meaningfully different
4. Assign confidence scores based on specificity of information
5. Keep displayName short and memorable (3-4 words max)
6. Quote relevant phrases in rawQuote field

## Field Confidence Scoring
- 0.9+: Explicitly stated with specifics ("35-year-old marketing managers")
- 0.7-0.9: Clearly implied ("busy professionals" → demographics.lifestyle)
- 0.5-0.7: Reasonable inference ("need to save time" → jobs.functional)
- <0.5: Weak signal or generic

## Output Format
Return a JSON object matching the schema. Include fieldConfidence for each non-null field.

## Transcript
{transcript}

## Product Context (if mentioned)
{productDescription}
```

---

## 7. Question Customization Prompt

```markdown
# Question Customization System Prompt

Customize the questionnaire for this persona based on their brain dump extraction.

## Persona
Name: {displayName}
Confidence: {confidence}
Extracted attributes: {extractedAttributes}

## Brain Dump Context
{brainDumpTranscript}

## Base Questions
{questions as JSON}

## Instructions

For each question:

1. **Skip Decision**
   - If fieldConfidence > 0.7 for the question's target field, set shouldSkip=true
   - Set skipReason to the extracted value
   - Create confirmationPrompt: "You mentioned earlier that {value}... does that still feel right?"

2. **Contextualization**
   - Rewrite question to reference brain dump context naturally
   - Example: "What frustrates them most?" → "You mentioned they deal with [context]. What frustrates them most about that?"
   - Keep the core question intent intact

3. **Priority**
   - Lower number = ask first
   - Prioritize questions where confidence is lowest (biggest gaps)
   - Questions about explicitly mentioned themes get slight priority boost

## Output
Return questions array with customized fields.
```

---

## 8. File Manifest

### New Files
| Path | Purpose |
|------|---------|
| `prisma/migrations/xxx_brain_dump.sql` | Database migration |
| `lib/clarity-canvas/modules/persona-sharpener/brain-dump-schema.ts` | Extraction Zod schemas |
| `lib/clarity-canvas/modules/persona-sharpener/customized-question-schema.ts` | Question customization schemas |
| `lib/clarity-canvas/modules/persona-sharpener/prompts/extraction.ts` | Extraction prompt |
| `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts` | Question prompt |
| `app/api/clarity-canvas/modules/persona-sharpener/brain-dump/route.ts` | Brain dump API |
| `app/clarity-canvas/modules/persona-sharpener/components/BrainDumpStep.tsx` | Voice/text input |
| `app/clarity-canvas/modules/persona-sharpener/components/ProcessingStep.tsx` | Extraction progress |
| `app/clarity-canvas/modules/persona-sharpener/components/PersonaConfirmation.tsx` | Review personas |
| `app/clarity-canvas/modules/persona-sharpener/components/PersonaSwitcher.tsx` | Multi-persona nav |
| `app/clarity-canvas/modules/persona-sharpener/components/SkipConfirmation.tsx` | Pre-populated UI |
| `app/clarity-canvas/modules/persona-sharpener/components/PersonaCompleteStep.tsx` | Single done |
| `app/clarity-canvas/modules/persona-sharpener/components/AllCompleteStep.tsx` | All done |

### Modified Files
| Path | Changes |
|------|---------|
| `prisma/schema.prisma` | Add PersonaBrainDump model, update Persona |
| `app/clarity-canvas/modules/persona-sharpener/PersonaSharpenerClient.tsx` | New step flow, multi-persona state |
| `app/clarity-canvas/modules/persona-sharpener/components/PersonaCard.tsx` | Minor updates for brain dump data |
| `app/clarity-canvas/modules/persona-sharpener/components/QuestionnaireStep.tsx` | Skip logic, customized questions |
| `lib/clarity-canvas/modules/persona-sharpener/questions.ts` | Add field mappings for skip logic |

---

## 9. Testing Checklist

### Unit Tests
- [ ] Extraction schema validates correctly
- [ ] Question customization schema validates
- [ ] Skip logic function works with various confidence levels
- [ ] Priority sorting produces expected order

### Integration Tests
- [ ] Brain dump API creates all records
- [ ] Multiple personas created from single extraction
- [ ] Customized questions generated correctly
- [ ] Persona switching preserves progress

### E2E Tests
- [ ] Full flow: brain dump → confirmation → questionnaire → complete
- [ ] Voice input flow (Chrome)
- [ ] Text input flow (all browsers)
- [ ] Skip confirmation accept/reject
- [ ] Multi-persona completion

### Manual Testing
- [ ] 5 varied brain dump transcripts produce reasonable personas
- [ ] Question contextualization feels natural
- [ ] Skip confirmations are accurate
- [ ] Extraction failure degrades gracefully

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor extraction quality | Users get irrelevant personas | Extensive prompt tuning, fallback to manual |
| Slow processing (>10s) | User abandonment | Show engaging progress UI, optimize prompts |
| Question customization misses context | Feels generic | Include raw transcript in prompt, validate samples |
| Browser speech API issues | Voice unusable | Prominent text fallback, browser detection |
| Token limits on long transcripts | Extraction fails | Truncate to 4000 chars, summarize if needed |

---

## 11. Future Enhancements (Out of Scope)

- **Persona editing:** Allow editing extracted attributes before questionnaire
- **Re-extraction:** "Try again with different prompt" for brain dump
- **Persona comparison:** Side-by-side diff view
- **Validation mode:** Share personas for real user feedback
- **Export:** Download personas as PDF/PNG
- **Team sharing:** Multiple users contribute to same persona set

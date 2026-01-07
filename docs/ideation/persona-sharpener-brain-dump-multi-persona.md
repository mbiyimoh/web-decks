# Enhanced Persona Sharpener: Brain Dump + Multi-Persona

**Slug:** persona-sharpener-brain-dump-multi-persona
**Author:** Claude Code
**Date:** 2026-01-05
**Related:** `specs/feat-persona-sharpener-module.md`, `docs/clarity-canvas/clarity-modules-and-artifacts/persona-sharpener/voice-text-extraction-pattern.md`

---

## 1) Intent & Assumptions

### Task Brief
Enhance the Persona Sharpener module with a pre-interview "brain dump" step where users describe their product/business and ideal customers via voice or text (30 seconds / couple sentences). The system uses AI to synthesize 1-3 initial personas from this input, presents a "persona confirmation" screen, then runs a customized questionnaire for each persona with questions adapted to the context provided. The left-hand panel shows the extracted persona during the interview, and a persona switcher enables working on multiple personas.

### Assumptions
- Users are authenticated (existing NextAuth setup)
- OpenAI GPT-4o-mini is available for extraction (existing API key)
- VoiceRecorder component and transcription API can be reused
- 3 personas maximum is sufficient for most use cases
- Users will complete all personas in one session (vs. returning later for each)
- Questions can be skipped but not fully customized by users
- Brain dump transcript is stored for reference but not editable post-extraction

### Out of Scope
- Full Clarity Canvas integration (updating profile sections from personas)
- Validation mode (real users validating founder assumptions)
- Voice input during questionnaire (text-only for answers)
- Persona comparison views (side-by-side diff)
- Exporting personas to external formats
- Team collaboration / shared personas
- Custom question creation by users
- Real-time streaming transcription (batch processing sufficient)

---

## 2) Pre-reading Log

| File | Takeaway |
|------|----------|
| `docs/clarity-canvas/.../persona-sharpener-handoff.md` | Comprehensive handoff with schema design, question bank, validation system design, archetype generation logic |
| `specs/feat-persona-sharpener-module.md` | V1 spec covers single-persona flow, 19 questions, 5 phases implementation |
| `docs/clarity-canvas/.../voice-text-extraction-pattern.md` | Detailed extraction pattern: pause detection, structured output schemas, progressive accumulation, conflict detection |
| `app/clarity-canvas/components/VoiceRecorder.tsx` | Existing voice recorder with 30-120s duration, waveform visualization, webm/opus output |
| `lib/clarity-canvas/extraction-schema.ts` | Zod schemas for brain dump extraction (chunks, themes, followUps) - for ClarityProfile, not Persona |
| `app/api/clarity-canvas/transcribe/route.ts` | Whisper transcription endpoint - reusable |
| `app/api/clarity-canvas/extract/route.ts` | GPT-4o-mini extraction endpoint - needs new schema for personas |
| `app/clarity-canvas/modules/persona-sharpener/PersonaSharpenerClient.tsx` | Current flow: welcome → questionnaire → complete. No brain dump step. |
| `lib/clarity-canvas/modules/persona-sharpener/questions.ts` | 19 static questions in interleaved sequence. No dynamic selection. |
| `prisma/schema.prisma` | Persona model supports multiple per profile, but current UI assumes single. |

---

## 3) Codebase Map

### Primary Components/Modules
| Path | Role |
|------|------|
| `app/clarity-canvas/modules/persona-sharpener/PersonaSharpenerClient.tsx` | Main orchestration - needs brain dump step + multi-persona state |
| `app/clarity-canvas/modules/persona-sharpener/components/PersonaCard.tsx` | Left panel artifact - needs persona switcher |
| `app/clarity-canvas/components/VoiceRecorder.tsx` | Voice capture - reuse for brain dump |
| `lib/clarity-canvas/modules/persona-sharpener/questions.ts` | Question bank - needs dynamic selection logic |
| `app/api/clarity-canvas/modules/persona-sharpener/personas/route.ts` | Persona CRUD - needs bulk create from extraction |

### Shared Dependencies
- `lib/clarity-canvas/extraction-schema.ts` - Pattern for Zod extraction schemas
- `lib/clarity-canvas/prompts.ts` - Extraction prompt templates
- `app/api/clarity-canvas/transcribe/route.ts` - Whisper integration
- Framer Motion - Animations throughout
- OpenAI SDK - GPT-4o-mini for extraction

### Data Flow
```
Brain Dump (voice/text)
  → Transcribe (Whisper API)
  → Extract (GPT-4o-mini + persona schema)
  → Persona Confirmation Screen (user reviews 1-3 personas)
  → For each persona:
      → Dynamic Question Selection (skip pre-populated, prioritize gaps)
      → Questionnaire (with persona context in left panel)
      → Response Persistence
  → Completion (all personas)
```

### Potential Blast Radius
- `PersonaSharpenerClient.tsx` - Major rewrite (new steps, multi-persona state)
- `PersonaCard.tsx` - Add switcher UI
- `questions.ts` - Add dynamic selection exports
- `prisma/schema.prisma` - Add brain dump tracking fields to Persona
- New files: `BrainDumpStep.tsx`, `PersonaConfirmation.tsx`, `PersonaSwitcher.tsx`
- New API: `/api/clarity-canvas/modules/persona-sharpener/personas/brain-dump`

---

## 4) Root Cause Analysis

*N/A - This is a feature enhancement, not a bug fix.*

---

## 5) Research Findings

### Potential Solutions

#### Solution 1: Single-Pass Extraction → Linear Questionnaire
**Description:** Extract personas once from brain dump, then run existing 19-question sequence for each persona without modification.

**Pros:**
- Simplest implementation
- Reuses existing question flow entirely
- Minimal new code

**Cons:**
- Asks redundant questions (already answered in brain dump)
- No personalization of question wording
- ~15 minutes per persona × 3 = 45+ minutes total

#### Solution 2: Multi-Pass Extraction → Skip-Logic Questionnaire
**Description:** Extract personas with attribute-level confidence scores. Skip questions where high-confidence data exists from brain dump. Present remaining questions in priority order.

**Pros:**
- Significantly shorter completion time
- Feels intelligent ("it already knows this")
- Uses brain dump data effectively

**Cons:**
- Requires mapping brain dump fields to question IDs
- Need to validate extraction accuracy before skipping
- More complex state management

#### Solution 3: Full Adaptive Questionnaire (RL-based)
**Description:** Use reinforcement learning to dynamically generate/prioritize questions based on real-time confidence gaps, previous answers, and brain dump context.

**Pros:**
- Most personalized experience
- Research shows 27% accuracy improvement
- Future-proof architecture

**Cons:**
- Significant complexity (weeks of development)
- Requires training data / feedback loops
- Over-engineered for MVP

### Recommendation

**Solution 2: Multi-Pass Extraction with Skip-Logic Questionnaire**

This balances user experience (shorter, smarter) with implementation feasibility. Key implementation details:

1. **Brain Dump Extraction Schema:**
```typescript
const personaExtractionSchema = z.object({
  personas: z.array(z.object({
    displayName: z.string(),
    confidence: z.number().min(0).max(1),
    demographics: z.object({
      ageRange: z.string().nullable(),
      lifestyle: z.string().nullable(),
    }).optional(),
    jobs: z.object({
      functional: z.string().nullable(),
      emotional: z.string().nullable(),
    }).optional(),
    goals: z.object({
      primary: z.string().nullable(),
    }).optional(),
    frustrations: z.object({
      main: z.string().nullable(),
    }).optional(),
    rawQuote: z.string().nullable(),
  })).max(3),
  overallContext: z.object({
    productDescription: z.string(),
    marketContext: z.string().nullable(),
  }),
});
```

2. **Skip Logic Implementation:**
```typescript
function getQuestionsForPersona(
  baseQuestions: Question[],
  extractedPersona: ExtractedPersona
): Question[] {
  return baseQuestions.filter(q => {
    const field = q.field; // e.g., 'demographics.ageRange'
    const extractedValue = getNestedValue(extractedPersona, field);
    // Skip if high-confidence extraction exists
    if (extractedValue && extractedPersona.fieldConfidence[field] > 0.7) {
      return false;
    }
    return true;
  });
}
```

3. **Multi-Persona UX (Slack-style switcher):**
- Persistent sidebar showing all personas with completion %
- Active persona highlighted with gold accent
- Click to switch (with "save progress" prompt if unsaved)
- Keyboard shortcuts: Cmd+1, Cmd+2, Cmd+3

4. **Hybrid Voice Processing:**
- Record full brain dump (30-120 seconds)
- Show "analyzing..." with streaming-style UI (engagement)
- Process with batch transcription (10-25% better accuracy)
- Extract personas in background
- Present confirmation screen when ready

---

## 6) Clarifications Needed

### UX Decisions

1. **Brain dump prompt wording:**
   - Option A: "Describe your product and ideal customer in 30 seconds"
   - Option B: "Tell us about your business and who you're building for"
   - Option C: "Who is this for? Paint a picture of your ideal customer"
   - **Recommendation:** Option C (focuses on customer, sets expectation)
   >> option C, but with a slight tweak "Who are you building for? Paint a picture of the person who is going to benefit from the thing you are creating"

2. **Multiple personas handling - when to show:**
   - Option A: Show all detected personas immediately after extraction
   - Option B: Show primary persona first, reveal others progressively
   - Option C: Let user specify expected count before brain dump
   - **Recommendation:** Option A with progressive disclosure (show summary cards, expand on click)
   >> yes, go with your recommendation

3. **Persona confirmation - level of detail:**
   - Option A: Just names + one-line descriptions
   - Option B: Full attribute preview (demographics, jobs, goals)
   - Option C: Editable fields before starting questionnaire
   - **Recommendation:** Option B (preview builds confidence, but editing is post-questionnaire scope)
   >> yes, go with your recommendation

4. **Question skipping feedback:**
   - Option A: Silently skip pre-populated questions
   - Option B: Show "We already know: [value]" with option to re-answer
   - Option C: Group all pre-populated at end for review
   - **Recommendation:** Option B (transparency builds trust)
   >> yes, go with your recommendation but instead of "We already know" say something like "You mentioned earlier that [whatever value / thing you mentioned]... does that still feel right?"

5. **Persona completion order:**
   - Option A: User chooses which persona to start with
   - Option B: System recommends based on confidence (lowest first = more gaps to fill)
   - Option C: Fixed order (persona 1 → 2 → 3)
   - **Recommendation:** Option A with system suggestion ("We recommend starting with X because...")
   >> yes, go with your recommendation

### Technical Decisions

6. **Brain dump storage:**
   - Option A: Store transcript only (derive personas on-demand)
   - Option B: Store transcript + extracted personas (immutable snapshot)
   - Option C: Store transcript, allow re-extraction with different prompts
   - **Recommendation:** Option B (audit trail, reproducibility)
   >> yes, go with your recommendation

7. **Schema changes:**
   - Option A: Add `brainDumpTranscript` field to each Persona
   - Option B: Create separate `PersonaBrainDump` model linked to multiple Personas
   - Option C: Store in existing ClarityProfile, link to Personas via profileId
   - **Recommendation:** Option B (clean separation, supports future features)
   >> yes, go with your recommendation

8. **API structure for bulk persona creation:**
   - Option A: Single endpoint `/personas/brain-dump` returns all extracted personas
   - Option B: Extraction endpoint returns data, separate POST to create each persona
   - Option C: Streaming endpoint returns personas as extracted
   - **Recommendation:** Option A (simpler client, atomic operation)
   >> yes, go with your recommendation

9. **Question customization depth:**
   - Option A: Only skip/include logic (binary)
   - Option B: Skip + reorder based on confidence gaps
   - Option C: Skip + reorder + contextualize wording ("You mentioned X, so...")
   - **Recommendation:** Option B for MVP, Option C as enhancement
   >> option C. lets make it great out of the gate, but feel free to ask follow up questions here if it adds more complexity that we need to discuss

10. **Handling extraction failures:**
    - Option A: Fall back to single generic persona, proceed to questionnaire
    - Option B: Show error, ask user to try again
    - Option C: Show raw transcript, let user manually identify personas
    - **Recommendation:** Option A (graceful degradation, never blocks user)
    >> yes, go with your recommendation

---

## 7) Proposed User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Welcome + Brain Dump                                   │
│                                                                 │
│  "Let's build your customer personas"                           │
│                                                                 │
│  [Voice] [Text]                                                 │
│                                                                 │
│  "In about 30 seconds, describe what you're building and        │
│   who your ideal customers are. You can mention up to 3         │
│   different customer types if you have them."                   │
│                                                                 │
│  [🎤 Start Recording]                                           │
│                                                                 │
│  or                                                             │
│                                                                 │
│  [Text input area: "Describe your product and customers..."]    │
│  [Continue →]                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Processing (2-5 seconds)                               │
│                                                                 │
│  "Analyzing your description..."                                │
│                                                                 │
│  [Animated dots / waveform]                                     │
│                                                                 │
│  "Identifying customer personas..."                             │
│  "Extracting key attributes..."                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Persona Confirmation                                   │
│                                                                 │
│  "We identified 2 personas from your description"               │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ 👤 The Busy Executive   │  │ 👤 The Growth Marketer  │       │
│  │                         │  │                         │       │
│  │ Mid-career professional │  │ Data-driven, under 35   │       │
│  │ Values efficiency       │  │ Needs quick wins        │       │
│  │                         │  │                         │       │
│  │ 🟢 High confidence      │  │ 🟡 Medium confidence    │       │
│  └─────────────────────────┘  └─────────────────────────┘       │
│                                                                 │
│  "We'll work on 'The Busy Executive' first, then complete       │
│   the other persona afterward."                                 │
│                                                                 │
│  [Start Sharpening →]                                           │
│                                                                 │
│  [+ Add another persona]  [Edit personas]                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Questionnaire (per persona)                            │
│                                                                 │
│  ┌───────────────────────────────┬─────────────────────────────┐│
│  │ [👤] The Busy Executive  1/2  │  Question 3 of 12           ││
│  │ [○ ] The Growth Marketer      │  (7 pre-populated)          ││
│  │                               │                             ││
│  │ YOUR IDEAL CUSTOMER           │  Their primary goal is...   ││
│  │                               │                             ││
│  │ Demographics                  │  We already know:           ││
│  │ • 35-50, busy professional    │  "Efficiency and time       ││
│  │ • Tech-savvy, time-poor       │   savings" from your desc.  ││
│  │                               │  [✓ Keep] [↻ Re-answer]     ││
│  │ Jobs to be Done               │                             ││
│  │ • Feel in control             │  OR answer fresh:           ││
│  │ • Save time                   │  [Ranking UI for goals]     ││
│  │                               │                             ││
│  │ Clarity: 45%                  │                             ││
│  │ Confidence: 72%               │                             ││
│  └───────────────────────────────┴─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Persona Complete → Next Persona                        │
│                                                                 │
│  "🎉 The Busy Executive is complete!"                           │
│                                                                 │
│  [Persona summary card]                                         │
│                                                                 │
│  "Ready to sharpen your next persona?"                          │
│                                                                 │
│  ┌─────────────────────────┐                                    │
│  │ 👤 The Growth Marketer  │                                    │
│  │ ~8 questions remaining  │                                    │
│  │ [Start →]               │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
│  [Skip for now]  [View completed personas]                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: All Complete                                           │
│                                                                 │
│  "🎉 All 2 personas complete!"                                  │
│                                                                 │
│  [Summary of both personas side by side]                        │
│                                                                 │
│  Combined Clarity: 78%                                          │
│  5 assumptions need validation                                  │
│                                                                 │
│  [Return to Profile]  [Share Validation Link] (coming soon)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8) Implementation Phases (Estimated)

### Phase 1: Brain Dump Capture + Extraction API (Day 1-2)
- [ ] Create `BrainDumpStep.tsx` component (voice + text options)
- [ ] Adapt VoiceRecorder for 30-60s brain dump
- [ ] Create persona extraction Zod schema
- [ ] Build `/api/.../personas/brain-dump` endpoint
- [ ] Test extraction with sample transcripts

### Phase 2: Persona Confirmation Screen (Day 2-3)
- [ ] Create `PersonaConfirmation.tsx` component
- [ ] Design persona preview cards
- [ ] Add "Start with this persona" flow
- [ ] Create PersonaBrainDump model in Prisma
- [ ] Bulk persona creation from extraction

### Phase 3: Multi-Persona State + Switcher (Day 3-4)
- [ ] Refactor PersonaSharpenerClient for multi-persona state
- [ ] Create `PersonaSwitcher.tsx` component
- [ ] Update PersonaCard with switcher integration
- [ ] Add per-persona progress tracking
- [ ] Implement persona switching with state preservation

### Phase 4: Dynamic Question Selection (Day 4-5)
- [ ] Create question filtering logic (skip pre-populated)
- [ ] Add "We already know" UI for skipped questions
- [ ] Implement question reordering by confidence gaps
- [ ] Update progress calculation for variable question counts
- [ ] Test complete flow with various brain dump inputs

### Phase 5: Polish + Edge Cases (Day 5-6)
- [ ] Add extraction failure fallback
- [ ] Loading states and animations
- [ ] Mobile responsive adjustments
- [ ] Error boundaries for each step
- [ ] Manual testing of all paths

---

## 9) Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Poor extraction accuracy from short brain dumps | Medium | High | Provide example prompts, allow retry, graceful fallback to single persona |
| Users confused by multi-persona flow | Medium | Medium | Clear progress indicators, "why are there multiple?" explanation |
| Question skip logic misses important data | Low | Medium | Always show "re-answer" option, don't auto-skip critical questions |
| State complexity with multiple in-progress personas | Medium | Medium | Save frequently, use reducer pattern, clear UX for switching |
| API costs spike with long transcripts | Low | Low | Cap transcript length, use gpt-4o-mini for extraction |

---

## 10) Success Metrics

- **Time to first persona:** < 10 minutes (vs. 15+ with current flow)
- **Extraction accuracy:** > 70% of extracted fields accepted without edit
- **Multi-persona completion:** > 60% of users with detected multiple personas complete all
- **User satisfaction:** Qualitative feedback on "it already knew" experience

---

## 11) Next Steps

1. **User to review clarifications (#6)** and provide decisions
2. **Create formal specification** from this ideation
3. **Decompose into STM tasks** with dependencies
4. **Implement in phases** with incremental testing

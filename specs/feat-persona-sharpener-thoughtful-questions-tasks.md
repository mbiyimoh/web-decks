# Task Breakdown: Thoughtful Question Generation for Persona Sharpener

**Generated:** 2026-01-06
**Source:** specs/feat-persona-sharpener-thoughtful-questions.md

## Overview

Redesign the question customization prompts to generate deeply contextual, thoughtful interview questions. This is primarily a prompt engineering task with minimal code changes.

**Total Tasks:** 5
**Estimated Effort:** Small-Medium (prompt rewriting + helper functions)
**Parallel Opportunities:** Tasks 1.1 and 1.2 can run in parallel

---

## Phase 1: Foundation (Helper Functions & Schema)

### Task 1.1: Create Field Mapping and Formatter Helper Functions

**Description:** Create helper functions that format extracted persona fields grouped by confidence level for the enhanced user prompt.
**Size:** Small
**Priority:** High
**Dependencies:** None
**Can run parallel with:** Task 1.2

**File to modify:** `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**Technical Requirements:**

The `fieldConfidence` schema uses camelCase keys that need to be mapped to:
1. Human-readable display names
2. Paths to access the actual extracted values from the persona

**Field Mapping Constant:**
```typescript
import type { ExtractedPersona, FieldConfidence } from '../brain-dump-schema';

/**
 * Maps fieldConfidence keys to display names and value paths
 */
const FIELD_MAP: Record<keyof FieldConfidence, { label: string; path: string[] }> = {
  demographicsAgeRange: { label: 'Age Range', path: ['demographics', 'ageRange'] },
  demographicsLifestyle: { label: 'Lifestyle', path: ['demographics', 'lifestyle'] },
  demographicsLocation: { label: 'Location/Context', path: ['demographics', 'location'] },
  jobsFunctional: { label: 'Functional Job', path: ['jobs', 'functional'] },
  jobsEmotional: { label: 'Emotional Job', path: ['jobs', 'emotional'] },
  jobsSocial: { label: 'Social Job', path: ['jobs', 'social'] },
  goalsPrimary: { label: 'Primary Goal', path: ['goals', 'primary'] },
  goalsSecondary: { label: 'Secondary Goal', path: ['goals', 'secondary'] },
  frustrationsMain: { label: 'Main Frustration', path: ['frustrations', 'main'] },
  frustrationsSecondary: { label: 'Secondary Frustration', path: ['frustrations', 'secondary'] },
  behaviorsInformationSources: { label: 'Information Sources', path: ['behaviors', 'informationSources'] },
  behaviorsDecisionStyle: { label: 'Decision Style', path: ['behaviors', 'decisionStyle'] },
};
```

**Helper to get nested value:**
```typescript
function getNestedValue(obj: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = obj;
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : null;
}
```

**Formatter functions:**
```typescript
function formatFieldsByConfidence(
  persona: ExtractedPersona,
  minConfidence: number,
  maxConfidence: number
): string {
  if (!persona.fieldConfidence) return 'No confidence data available.';

  const fields: string[] = [];

  for (const [key, mapping] of Object.entries(FIELD_MAP)) {
    const confidence = persona.fieldConfidence[key as keyof FieldConfidence];
    if (confidence === null || confidence === undefined) continue;
    if (confidence < minConfidence || confidence >= maxConfidence) continue;

    const value = getNestedValue(persona as unknown as Record<string, unknown>, mapping.path);
    if (!value) continue;

    fields.push(`- **${mapping.label}** (${Math.round(confidence * 100)}% confidence): "${value}"`);
  }

  return fields.length > 0 ? fields.join('\n') : 'No fields in this confidence range.';
}

export function formatHighConfidenceFields(persona: ExtractedPersona): string {
  return formatFieldsByConfidence(persona, 0.7, 1.1);
}

export function formatMediumConfidenceFields(persona: ExtractedPersona): string {
  return formatFieldsByConfidence(persona, 0.5, 0.7);
}

export function formatLowMediumConfidenceFields(persona: ExtractedPersona): string {
  return formatFieldsByConfidence(persona, 0.3, 0.5);
}

export function formatLowConfidenceFields(persona: ExtractedPersona): string {
  return formatFieldsByConfidence(persona, 0, 0.3);
}
```

**Acceptance Criteria:**
- [ ] FIELD_MAP constant covers all 12 fields from fieldConfidenceSchema
- [ ] getNestedValue safely handles null/undefined at any level
- [ ] formatFieldsByConfidence correctly filters by confidence range
- [ ] All four export functions work correctly with sample persona data
- [ ] Edge case: persona with null fieldConfidence returns graceful message
- [ ] Edge case: persona with all null values returns "No fields in this confidence range"

---

### Task 1.2: Add questionStyle Field to Schema

**Description:** Add optional `questionStyle` field to the customized question schema to capture confidence-based styling.
**Size:** Small
**Priority:** Medium
**Dependencies:** None
**Can run parallel with:** Task 1.1

**File to modify:** `lib/clarity-canvas/modules/persona-sharpener/customized-question-schema.ts`

**Implementation:**

Add to `customizedQuestionSchema` after the `priority` field:

```typescript
export const customizedQuestionSchema = z.object({
  // ... existing fields ...

  // Priority (lower = ask first)
  priority: z
    .number()
    .min(1)
    .max(19)
    .describe('Priority order based on confidence gaps (1 = highest priority)'),

  // NEW: Question styling based on confidence
  questionStyle: z
    .enum(['exploratory', 'confirmatory', 'skip'])
    .nullable()
    .describe('Question framing style based on field confidence: exploratory (<0.5), confirmatory (0.5-0.7), skip (>=0.7)'),
});
```

**Acceptance Criteria:**
- [ ] Field added with correct Zod enum type
- [ ] Field is nullable (OpenAI structured outputs requirement)
- [ ] Descriptive comment explains the confidence bands
- [ ] TypeScript types export correctly (CustomizedQuestion type includes new field)
- [ ] No breaking changes to existing consumers (field is nullable)

---

## Phase 2: Core Prompt Rewrite

### Task 2.1: Rewrite System Prompt with Examples and Frameworks

**Description:** Complete rewrite of QUESTION_CUSTOMIZATION_SYSTEM_PROMPT with 7 detailed examples, JTBD framework, confidence-based styling, and anti-patterns.
**Size:** Large
**Priority:** High
**Dependencies:** None (can start immediately, will integrate with Task 1.1 output)
**Can run parallel with:** Tasks 1.1, 1.2

**File to modify:** `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**New System Prompt Structure:**

```typescript
export const QUESTION_CUSTOMIZATION_SYSTEM_PROMPT = `You are an expert qualitative researcher and UX writer skilled in Jobs-to-be-Done methodology. Your task is to transform generic questionnaire items into thoughtful, context-aware questions that demonstrate genuine understanding and elicit concrete, specific responses.

## The Difference Between Lazy and Thoughtful Questions

### LAZY (Avoid This)
Original: "What's the primary task they're trying to accomplish?"
Context: User mentioned "freelancers who struggle to track billable hours"
Lazy output: "You mentioned they struggle to track billable hours. What's the primary task they're trying to accomplish?"

Why it's lazy:
- Just prepends context as a preamble
- Doesn't integrate context into the question's substance
- Feels like a form filler, not a thoughtful conversation

### THOUGHTFUL (Do This)
Same inputs →
Thoughtful output: "You mentioned freelancers constantly losing money because they forget to log time. When they're in the middle of a project and realize they haven't tracked anything—what usually triggers that realization? Is it invoice time, a client question, or something else? Walk me through what that moment typically looks like for them."

Why it's better:
- Integrates context INTO the question's substance
- Shows domain understanding (time tracking has triggers, moments)
- Asks for a specific, concrete scenario ("walk me through that moment")
- Uses context to narrow and focus appropriately

## Transformation Framework

For each question, follow this process:

### 1. What do we know?
- What specific details did the brain dump provide?
- What can we infer from the context?
- What would a thoughtful interviewer already understand?

### 2. What's the knowledge gap?
- What's the question really trying to uncover?
- What's missing from our current understanding?
- What would be most valuable to learn?

### 3. How can we probe concretely?
- Can we ask for a specific example or moment?
- Can we ground the question in an observable behavior?
- Can we use temporal, environmental, or social context?

### 4. What question type fits best?
- **Narrative**: "Walk me through the last time..."
- **Specific**: "What happened when... / Who was involved..."
- **Reflective**: "What did that mean to them? / How did that feel..."
- **Comparative**: "How did X compare to Y? / What made them choose..."
- **Temporal**: "What happened next? / When did they first notice..."

## JTBD Four Forces (Use for Motivation Questions)

When probing why someone does something or makes a decision:
- **Push of current situation**: What's driving them away from the status quo?
- **Pull of new solution**: What's attracting them to alternatives?
- **Habits holding back**: What inertia or switching costs keep them stuck?
- **Anxieties about change**: What fears or concerns block action?

## Confidence-Based Question Styling

Match your question framing to the confidence level:

| Confidence | Style | Framing Approach |
|------------|-------|------------------|
| < 0.3 | Exploratory | Open-ended discovery: "Tell me about..." / "Walk me through..." |
| 0.3-0.5 | Exploratory | Hypothesis-generating: "What might be going on when..." / "Help me understand..." |
| 0.5-0.7 | Confirmatory | Validation + depth: "You mentioned X. Does that show up as Y, or is it more like Z?" |
| >= 0.7 | Skip | Confirmation prompt: "You mentioned X—does that still feel right?" |

Set the questionStyle field accordingly: 'exploratory', 'confirmatory', or 'skip'.

## Anti-Patterns to AVOID

These patterns will produce low-quality questions:

❌ **Lazy prepending**: "You mentioned X. [Original question unchanged]"
❌ **Over-quoting**: "You said '[long exact quote]'. Tell me more."
❌ **Confirmation bias**: "So they definitely hate [thing], right?"
❌ **Double-barreled**: "How do they feel about pricing and interface?"
❌ **Leading**: "Don't you think they'd prefer a simpler solution?"
❌ **Hypothetical**: "Would they be interested if..."
❌ **Jargon soup**: "How do they leverage synergies in workflow optimization?"
❌ **Robotic confirmation**: "Value extracted: X. Confirm?"

## Quality Checklist

Every generated question must pass these checks:

✅ Integrates context INTO question substance (not just preamble)
✅ Shows understanding of domain/situation implications
✅ Asks for something specific and concrete
✅ Is open-ended (cannot be answered yes/no)
✅ Feels like a natural follow-up conversation
✅ Maintains neutral tone (not leading)
✅ Matches appropriate confidence-based style (exploratory/confirmatory/skip)

## Detailed Examples

### Example 1: Functional Job Question (Confirmatory Style)

**Original Question:**
"When your customer uses your product, what's the primary task they're trying to accomplish?"

**Brain Dump Context:**
- Persona: "The Overwhelmed Freelancer"
- jobs.functional: "track billable hours" (confidence: 0.65)
- Raw quote: "they're constantly losing money because they forget to log time"

**WRONG (Lazy):**
"You mentioned they track billable hours. What's the primary task they're trying to accomplish?"

**CORRECT (Thoughtful):**
"You mentioned freelancers constantly losing money because they forget to log time. When they're in the middle of a project and realize they haven't tracked anything—what usually triggers that realization? Is it invoice time, a client question, or something else? Walk me through what that moment typically looks like for them."

**Why it works:**
- Integrates the raw quote naturally
- Asks for a specific triggering moment
- Uses "walk me through" to elicit narrative
- Confirmatory style appropriate for 0.5-0.7 confidence

---

### Example 2: Frustrations Question (Exploratory Style)

**Original Question:**
"What have they tried before that didn't work? Why did it fail them?"

**Brain Dump Context:**
- Persona: "The Growth Marketer"
- frustrations.pastFailures: null (confidence: 0.2)
- Demographics suggest: mid-career professional

**WRONG (No transformation because no extraction):**
"What have they tried before that didn't work? Why did it fail them?"

**CORRECT (Thoughtful):**
"Most marketers at this stage have a graveyard of tools they tried and abandoned. When you picture your Growth Marketer opening their laptop—what's the tool or system they've given up on but still occasionally feels guilty about? What finally made them stop trying with it?"

**Why it works:**
- Creates relatable context ("graveyard of tools")
- Uses concrete visualization ("opening their laptop")
- Asks for emotional resonance ("feels guilty about")
- Exploratory style appropriate for < 0.3 confidence

---

### Example 3: Skip with Rich Confirmation

**Original Question:**
"Which better describes their lifestyle?"

**Brain Dump Context:**
- Persona: "The Side Hustler"
- demographics.lifestyle: "busy-professional" (confidence: 0.75)
- Raw quote: "working parents trying to build something on the side"

**Status:** SKIP (confidence >= 0.7)

**Confirmation Prompt:**
"You described them as working parents building something on the side—juggling a full-time job while nurturing their own venture. Does that still capture the core tension they're living with, or has your picture of them evolved?"

**Why it works:**
- Paraphrases naturally, not robotically
- Adds interpretive layer ("core tension they're living with")
- Invites revision without pressure ("or has your picture evolved")

---

### Example 4: Emotional Job Question (Confirmatory Style)

**Original Question:**
"When using your product, they primarily want to feel..."

**Brain Dump Context:**
- Persona: "The Cautious Buyer"
- jobs.emotional: "in-control" (confidence: 0.55)
- Context: B2B procurement, high-stakes decisions

**WRONG (Lazy):**
"You mentioned they want to feel in control. When using your product, they primarily want to feel..."

**CORRECT (Thoughtful):**
"You suggested they want to feel 'in control'—but control can mean different things. For someone making high-stakes procurement decisions, is 'in control' more about having complete information before deciding, or about being able to reverse course if something goes wrong? What does their version of control look like in practice?"

**Why it works:**
- Unpacks the abstraction ("control can mean different things")
- Connects to their specific context (high-stakes procurement)
- Offers concrete alternatives to choose between
- Confirmatory style (0.5-0.7 confidence)

---

### Example 5: Behavior Question (Exploratory Style)

**Original Question:**
"Where are they most likely to discover products like yours?"

**Brain Dump Context:**
- Persona: "The Tech-Forward Manager"
- behaviors.discoveryChannels: null (confidence: 0.15)
- Demographics: 35-50, tech-savvy, enterprise context

**WRONG (No transformation):**
"Where are they most likely to discover products like yours?"

**CORRECT (Thoughtful):**
"Think about the last enterprise tool or solution your Tech-Forward Manager actually adopted—not just evaluated, but truly brought into their workflow. How did they first hear about it? Was it a peer recommendation at a conference, something they stumbled on while researching a problem, or did it find them through content or ads? What made that particular discovery channel credible to them?"

**Why it works:**
- Grounds in a specific adoption event ("last tool they actually adopted")
- Distinguishes evaluation from adoption
- Offers concrete channel examples
- Probes credibility (the deeper insight)
- Exploratory style (< 0.3 confidence)

---

### Example 6: Dealing with Contradictions (Exploratory Style)

**Original Question:**
"How much time can they realistically dedicate to this?"

**Brain Dump Context:**
- Persona: "The Ambitious Beginner"
- behaviors.timeAvailable: "< 5 min/day" (confidence: 0.4)
- goals.primary suggests "achieve more" ranked highly
- Potential contradiction: wants big results with minimal time

**WRONG (Lazy):**
"You mentioned they have less than 5 minutes a day. How much time can they realistically dedicate to this?"

**CORRECT (Thoughtful):**
"You mentioned they only have about 5 minutes a day, but they're clearly ambitious about achieving more. Help me understand how they think about that trade-off. Do they believe quick wins can compound over time, or are they hoping to find a solution that packs big impact into small moments? What would make them feel like 5 minutes was actually 'enough'?"

**Why it works:**
- Acknowledges the apparent tension without judgment
- Invites them to reconcile the contradiction
- Offers two reasonable interpretations
- Probes for the underlying belief
- Exploratory style (0.3-0.5 confidence)

---

### Example 7: Anti-Pattern Showcase

**Original Question:**
"Who is explicitly NOT your customer?"

**Brain Dump Context:**
- Persona: "The Enterprise Buyer"
- Product: B2B SaaS for large teams
- Raw quote: "definitely not for small startups or individuals"

**WRONG Outputs (Anti-Patterns):**

❌ Lazy prepend: "You mentioned they're not for small startups. Who is explicitly NOT your customer?"
❌ Over-quoting: "You said 'definitely not for small startups or individuals'. Can you tell me more about who's not your customer?"
❌ Leading: "So solo founders and tiny startups would be a bad fit, right?"
❌ Robotic: "Anti-pattern value: small startups, individuals. Confirm exclusions."

**CORRECT (Thoughtful):**
"You've been clear that small startups and solo operators aren't the fit. I'm curious about the edge cases—what about a 15-person startup that's growing fast, or an enterprise team that operates like a scrappy startup internally? Where do you draw the line, and what's the signal that tells you someone's on the wrong side of it?"

**Why it works:**
- Acknowledges stated exclusion without re-asking
- Probes the boundary cases (where interesting insights live)
- Asks for the underlying signal/criteria
- Exploratory without being leading

---

## Skip Logic Rules

- If a field has confidence >= 0.7, mark shouldSkip: true
- Set questionStyle: 'skip'
- For skipped questions, provide:
  - skipReason: The extracted value
  - confirmationPrompt: Rich, conversational confirmation (NOT robotic)

## Priority Rules

Lower priority number = ask first (priority 1 is highest priority)

1. Questions about fields with confidence 0.3-0.5 (partial info, need more depth)
2. Questions about fields with confidence < 0.3 (knowledge gaps to fill)
3. Questions about fields with confidence 0.5-0.7 (validation needed)
4. Questions about fields with confidence >= 0.7 (skip - verification only)

Within each tier, prioritize:
Jobs to be done → Goals → Frustrations → Demographics → Behaviors

## Output Format

For each question, return:
- questionId: Original question ID
- originalText: Original question text
- field: Target field path
- type: Question type
- options: Original options (if applicable)
- shouldSkip: Boolean
- skipReason: The extracted value (if skipping)
- contextualizedText: Rewritten question with integrated context
- confirmationPrompt: Rich confirmation text (if skipping)
- priority: 1-19 based on confidence gaps
- questionStyle: 'exploratory' | 'confirmatory' | 'skip' based on confidence`;
```

**Acceptance Criteria:**
- [ ] System prompt includes all 7 detailed before/after examples
- [ ] Transformation Framework section included with 4-step process
- [ ] JTBD Four Forces section included (accessible framing)
- [ ] Confidence-based styling table with all 4 bands
- [ ] Anti-patterns section with 8 explicit patterns to avoid
- [ ] Quality checklist with 7 criteria
- [ ] Skip logic and priority rules preserved from original
- [ ] Output format updated to include questionStyle field
- [ ] Total length is ~300 lines as estimated

---

### Task 2.2: Enhance User Prompt with Confidence-Grouped Fields

**Description:** Rewrite QUESTION_CUSTOMIZATION_USER_PROMPT to synthesize extraction data by confidence level instead of dumping raw JSON.
**Size:** Medium
**Priority:** High
**Dependencies:** Task 1.1 (helper functions)

**File to modify:** `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**New User Prompt:**

```typescript
export const QUESTION_CUSTOMIZATION_USER_PROMPT = (
  persona: ExtractedPersona,
  productDescription: string,
  brainDumpTranscript: string,
  questionsJson: string
): string => `## Persona Being Customized: "${persona.displayName}"

Overall Confidence: ${Math.round((persona.confidence || 0) * 100)}%

---

## What We Know (Grouped by Confidence)

### Strong Signals (High Confidence >= 70%)
${formatHighConfidenceFields(persona)}

*These fields have clear answers from the brain dump. Questions should be SKIPPED with rich confirmation prompts.*

### Partial Understanding (Medium Confidence 50-70%)
${formatMediumConfidenceFields(persona)}

*We have directional information but need confirmation and depth. Questions should use CONFIRMATORY framing: "You mentioned X. Does that show up as Y, or is it more like Z?"*

### Working Hypotheses (Low-Medium Confidence 30-50%)
${formatLowMediumConfidenceFields(persona)}

*We have hints but need exploration. Questions should probe openly: "Help me understand what's behind..."*

### Knowledge Gaps (Low Confidence < 30%)
${formatLowConfidenceFields(persona)}

*Little to no signal in brain dump. Questions should be EXPLORATORY: "Tell me about..." / "Walk me through..."*

---

## Raw Quote from Brain Dump
"${persona.rawQuote || 'No direct quote captured'}"

*Use this to inform tone, vocabulary, and the user's mental model.*

---

## Product Context
${productDescription}

---

## Original Brain Dump Transcript (Reference)
${brainDumpTranscript}

---

## Questions to Customize
${questionsJson}

---

## Your Task

For each question:
1. Determine the confidence level for its target field
2. Apply the appropriate style (exploratory/confirmatory/skip)
3. Transform the question to integrate context INTO its substance
4. Avoid ALL anti-patterns (lazy prepending, over-quoting, leading, etc.)
5. Assign priority based on confidence gaps (biggest gaps = highest priority)
6. For skipped questions, write rich, conversational confirmation prompts

Return an array of customized questions matching the schema.`;
```

**Acceptance Criteria:**
- [ ] User prompt calls all four helper functions correctly
- [ ] Confidence bands are clearly labeled with styling guidance
- [ ] Raw quote section included with guidance on usage
- [ ] Product context and transcript still included
- [ ] Instructions reference anti-patterns and styling requirements
- [ ] Overall structure is clear and scannable for the LLM

---

## Phase 3: Validation

### Task 3.1: Manual Testing with Diverse Samples

**Description:** Test the enhanced prompts with 5 diverse brain dump samples and verify output quality.
**Size:** Medium
**Priority:** High
**Dependencies:** Tasks 2.1, 2.2

**Test Samples to Create:**

1. **B2C Consumer App** (lifestyle focus)
   - Persona: "The Busy Parent"
   - Mix of high/medium/low confidence fields
   - Emotional job focus

2. **B2B SaaS** (enterprise focus)
   - Persona: "The IT Director"
   - High confidence on demographics
   - Low confidence on frustrations

3. **Marketplace/Platform** (two-sided)
   - Persona: "The Side Gig Driver"
   - Contradictions between time and goals
   - Social job emphasis

4. **Solo Creator Tool** (individual focus)
   - Persona: "The Aspiring Influencer"
   - Low confidence overall
   - Exploratory questions dominate

5. **Professional Services** (expertise focus)
   - Persona: "The Small Business Owner"
   - Medium confidence across board
   - Confirmatory questions dominate

**Validation Checklist (for each sample):**
- [ ] No lazy prepending patterns detected
- [ ] Questions integrate context into substance
- [ ] Confidence-based styling applied correctly (check questionStyle field)
- [ ] Anti-patterns absent (leading, double-barreled, robotic, etc.)
- [ ] Mix of question types (narrative, specific, reflective, comparative, temporal)
- [ ] Confirmation prompts feel natural, not robotic
- [ ] Skip logic still functions (>= 0.7 triggers skip)
- [ ] Priority ordering respects confidence gaps
- [ ] Output schema is valid (all required fields present)
- [ ] API response time < 5 seconds

**Regression Checks:**
- [ ] Existing brain dump → questions flow still works end-to-end
- [ ] No TypeScript errors introduced
- [ ] No breaking changes to API response shape

**Acceptance Criteria:**
- [ ] All 5 samples produce thoughtful, contextual questions
- [ ] Zero anti-patterns detected across all samples
- [ ] All regression checks pass
- [ ] Document any edge cases or improvements needed

---

## Execution Summary

| Task | Size | Priority | Dependencies | Parallel With |
|------|------|----------|--------------|---------------|
| 1.1 Helper Functions | Small | High | None | 1.2, 2.1 |
| 1.2 Schema Update | Small | Medium | None | 1.1, 2.1 |
| 2.1 System Prompt Rewrite | Large | High | None | 1.1, 1.2 |
| 2.2 User Prompt Enhancement | Medium | High | 1.1 | - |
| 3.1 Manual Testing | Medium | High | 2.1, 2.2 | - |

**Recommended Execution Order:**
1. Start Tasks 1.1, 1.2, and 2.1 in parallel
2. Once 1.1 completes, start 2.2
3. Once 2.1 and 2.2 complete, start 3.1

**Critical Path:** 2.1 → 2.2 → 3.1 (system prompt is the core deliverable)

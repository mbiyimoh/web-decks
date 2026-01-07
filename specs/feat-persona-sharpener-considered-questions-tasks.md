# Task Breakdown: Considered Question Generation V2

**Generated:** 2026-01-07
**Source:** `specs/feat-persona-sharpener-considered-questions.md`

## Overview

Elevate the persona sharpener question customization prompts from "thoughtful" (V1) to "considered" (V2) by adding strategic thinking frameworks, formatting rules, and enhanced examples. All changes are to a single file: `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`.

## Phase 1: Helper Functions

### Task 1.1: Add World Sketch Helper Functions

**Description**: Add 4 helper functions for synthesizing persona data into the "World Sketch" section of the user prompt.
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: None (foundation task)

**File**: `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**Location**: Add after the existing `formatLowConfidenceFields` function (around line 104)

**Implementation**:

```typescript
/**
 * Format current approach from persona data
 * Uses: frustrations.main, behaviors.decisionStyle
 */
function formatCurrentApproach(persona: ExtractedPersona): string {
  const mainFrustration = persona.frustrations?.main;
  const decisionStyle = persona.behaviors?.decisionStyle;

  const parts: string[] = [];
  if (mainFrustration) parts.push(`Current pain: "${mainFrustration}"`);
  if (decisionStyle) parts.push(`Decision style: ${decisionStyle}`);

  return parts.length > 0 ? parts.join('; ') : 'Unknown—explore their current workflow';
}

/**
 * Format key frustrations as a brief summary
 * Uses: frustrations.main, frustrations.secondary
 */
function formatKeyFrustrations(persona: ExtractedPersona): string {
  const main = persona.frustrations?.main;
  const secondary = persona.frustrations?.secondary;

  const parts: string[] = [];
  if (main) parts.push(main);
  if (secondary) parts.push(secondary);

  return parts.length > 0 ? parts.join('; ') : 'Unknown—explore pain points';
}

/**
 * Extract tools/systems context from frustrations
 * Uses: frustrations.main (LLM has full transcript for additional context)
 *
 * Simplified approach: just surface the frustration text rather than
 * keyword scanning. The LLM will infer tools from the full transcript.
 */
function extractToolsContext(persona: ExtractedPersona): string {
  const mainFrustration = persona.frustrations?.main || '';

  if (mainFrustration) {
    return `From frustrations: "${mainFrustration}"`;
  }

  return 'Not explicitly mentioned—worth exploring';
}

/**
 * Extract where things break down from frustrations data
 * Uses: frustrations.main, frustrations.secondary
 */
function extractBreakdownPoints(persona: ExtractedPersona): string {
  const main = persona.frustrations?.main;
  const secondary = persona.frustrations?.secondary;

  const points: string[] = [];
  if (main) points.push(`Primary: ${main}`);
  if (secondary) points.push(`Secondary: ${secondary}`);

  return points.length > 0 ? points.join('; ') : 'Unknown—explore where current approach fails';
}
```

**Acceptance Criteria**:
- [ ] All 4 helper functions added after existing formatters
- [ ] Functions use correct ExtractedPersona schema fields (frustrations.main, frustrations.secondary, behaviors.decisionStyle)
- [ ] Fallback strings provided for missing data
- [ ] TypeScript compiles without errors

---

## Phase 2: System Prompt Enhancements

### Task 2.1: Add Strategic Consideration Framework

**Description**: Insert the "Strategic Consideration" section at the beginning of the system prompt, before the existing "Transformation Framework".
**Size**: Medium
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 2.2, 2.3

**File**: `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**Location**: Insert AFTER the opening role definition paragraph and BEFORE "## The Difference Between Lazy and Thoughtful Questions"

**Content to insert**:

```markdown
## Strategic Consideration (Do This First)

Before transforming any question, develop a mental model of this persona's world:

### A. What's Their Current World? (As-Is State)
- What workflow or job-to-be-done are they trying to execute?
- What does a typical day/week look like when dealing with this problem?
- What's the trigger moment where this problem becomes acute?
- What's the sequence of steps they go through?

### B. What Does "Crushing It" Look Like? (To-Be Hero State)
- If this persona achieved their ultimate goal, what would be observably different?
- Who would notice their success? What would those people say?
- What's the hero moment they're working toward—the moment where they feel like they've "made it"?
- How would their workflow be different in the ideal state?

### C. What's the Duct Tape? (Tools & Workarounds)
- What tools, systems, spreadsheets, or manual processes are they using today?
- Where does their current approach break down most painfully?
- What's the invisible tax they're paying—the friction they've normalized?
- What workarounds have they built that they shouldn't need?

### D. What Are the Cascade Effects?
- When something goes wrong in their workflow, what's the domino effect?
- What problems lead to other problems?
- What's the difference between a surface symptom and a root cause?

Use these answers to inform which questions matter most and how to frame them.
A considered question shows you've thought about the whole system, not just one data point.

```

**Acceptance Criteria**:
- [ ] Section inserted in correct location (after role definition, before lazy/thoughtful comparison)
- [ ] All 4 subsections (A, B, C, D) included
- [ ] Markdown formatting preserved

---

### Task 2.2: Add Question Purpose by Category

**Description**: Add guidance explaining *why* each question category matters and what great questions should reveal.
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 2.1, 2.3

**File**: `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**Location**: Insert AFTER the "JTBD Four Forces" section and BEFORE "Confidence-Based Question Styling"

**Content to insert**:

```markdown
## Question Purpose by Category

Each category serves a specific purpose in understanding the persona. Great questions reveal:

### Goals Questions
**Purpose:** Understand the hero moment and observable success
**Great questions reveal:** What would be different if they succeeded? Who would notice? What would they say?
**Probe for:** Specific, observable outcomes—not vague feelings

### Frustrations Questions
**Purpose:** Understand the invisible tax and normalized friction
**Great questions reveal:** What workarounds have they built? What do they just "deal with"? What's the cascade effect when things go wrong?
**Probe for:** Systemic patterns, not just isolated complaints

### Jobs Questions (Functional, Emotional, Social)
**Purpose:** Understand the full workflow and job sequence
**Great questions reveal:** What's the trigger? What are the steps? Where does it break down? What does the whole flow look like?
**Probe for:** The sequence from start to finish, not just the task name

### Behaviors Questions
**Purpose:** Understand current tools and approaches
**Great questions reveal:** What duct tape is holding their current solution together? What tools have they tried? Why do some work and others fail?
**Probe for:** The gap between what tools promise and what they deliver

### Identity/Demographics Questions
**Purpose:** Understand context that shapes their constraints
**Great questions reveal:** What life circumstances create their constraints? Why can't they just do the "obvious" solution?
**Probe for:** The real-world context that makes this hard

```

**Acceptance Criteria**:
- [ ] Section inserted after JTBD Four Forces
- [ ] All 5 category subsections included (Goals, Frustrations, Jobs, Behaviors, Identity)
- [ ] Each category has Purpose, Great questions reveal, and Probe for

---

### Task 2.3: Add Formatting Rules Section

**Description**: Add critical formatting rules for visual breathing room (max 2 sentences per paragraph).
**Size**: Small
**Priority**: High
**Dependencies**: None
**Can run parallel with**: Task 2.1, 2.2

**File**: `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**Location**: Insert AFTER "Anti-Patterns to AVOID" section and BEFORE "Quality Checklist"

**Content to insert**:

```markdown
## Formatting Rules (Critical)

Questions must be easy to read at a glance. Long blocks of text feel overwhelming.

### The Rule: Maximum 2 Sentences Per Paragraph

Break up questions with line breaks to create visual breathing room.

**WRONG (Wall of Text):**
"You described freelancers who forget to log time and end up undercharging. I'm curious about the whole flow: before they even start a project, do they have a plan for how they'll track time? Or does it only become a problem when the invoice is due? Walk me through what a typical project looks like from kickoff to payment—where does the system break down first, and what's the cascade effect from there?"

**CORRECT (Visual Breathing Room):**
"You described freelancers who forget to log time and end up undercharging.

I'm curious about the whole flow: before they even start a project, do they have a plan for how they'll track time? Or does it only become a problem when the invoice is due?

Walk me through what a typical project looks like from kickoff to payment—where does the system break down first, and what's the cascade effect from there?"

### Formatting Pattern

1. **Opening hook** (1-2 sentences): Acknowledge what they shared, show you understood
2. **Core probe** (1-2 sentences): The main question you're asking
3. **Concrete ask** (1-2 sentences): How to answer—"walk me through," "give me an example," etc.

Each of these should be its own paragraph, separated by blank lines.

### Why This Matters

- Users scan before reading—visual breaks signal "this is digestible"
- Shorter paragraphs feel conversational, not interrogative
- The question still has depth, but it doesn't *look* overwhelming
- Mobile users especially benefit from shorter visual blocks

```

**Acceptance Criteria**:
- [ ] Section inserted after Anti-Patterns, before Quality Checklist
- [ ] WRONG and CORRECT examples both included
- [ ] Formatting pattern (hook → probe → ask) documented
- [ ] "Why This Matters" bullet points included

---

### Task 2.4: Add V2 Considered Examples

**Description**: Replace or supplement existing examples with 7 V2 "Considered" examples showing elevation from V1.
**Size**: Large
**Priority**: High
**Dependencies**: Task 2.1 (Strategic Consideration must be added first for context)
**Can run parallel with**: None

**File**: `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**Location**: Replace the existing "## Detailed Examples" section with expanded V2 examples

**Content**: See spec for full 7 examples. Key structure for each:
- Original Question
- Brain Dump Context
- V1 Thoughtful (for comparison)
- V2 Considered (the target)
- Why V2 is Better (explanation)

**Examples to include**:
1. Functional Job Question (workflow focus)
2. Frustrations Question (tools & workarounds)
3. Goals Question (hero moment)
4. Behavior Question (discovery & adoption)
5. Emotional Job Question (control → practice)
6. Dealing with Contradictions
7. Anti-Pattern Showcase

**Acceptance Criteria**:
- [ ] All 7 examples included
- [ ] Each example shows V1 vs V2 comparison
- [ ] All examples use proper paragraph breaks (max 2 sentences per paragraph)
- [ ] "Why V2 is Better" explains the elevation

---

## Phase 3: User Prompt Enhancement

### Task 3.1: Enhance User Prompt with World Sketch

**Description**: Rewrite the `QUESTION_CUSTOMIZATION_USER_PROMPT` function to include the "Persona's World" synthesis section.
**Size**: Medium
**Priority**: High
**Dependencies**: Task 1.1 (helper functions must exist)
**Can run parallel with**: None

**File**: `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

**Changes**: Replace the existing `QUESTION_CUSTOMIZATION_USER_PROMPT` function body with enhanced version that includes:

1. New "Persona's World (Synthesized Understanding)" section after the header
2. Current Reality subsection using `formatCurrentApproach()` and `formatKeyFrustrations()`
3. Ideal State subsection using persona.goals?.primary, persona.jobs?.emotional, persona.jobs?.social
4. Tools & Workarounds subsection using `extractToolsContext()` and `extractBreakdownPoints()`
5. Updated task instructions emphasizing formatting rules

**New user prompt structure**:

```typescript
export const QUESTION_CUSTOMIZATION_USER_PROMPT = (
  persona: ExtractedPersona,
  productDescription: string,
  brainDumpTranscript: string,
  questionsJson: string
): string => `## Persona Being Customized: "${persona.displayName}"

Overall Confidence: ${Math.round((persona.confidence || 0) * 100)}%

---

## Persona's World (Synthesized Understanding)

Before customizing questions, develop a mental model of this persona's world:

### Current Reality (As-Is State)
- **Primary JTBD:** ${persona.jobs?.functional || 'Unknown—this is a critical gap to explore'}
- **Current Approach:** ${formatCurrentApproach(persona)}
- **Key Frustrations:** ${formatKeyFrustrations(persona)}

### Ideal State (Hero Moment)
- **Primary Goal:** ${persona.goals?.primary || 'Unknown—explore what winning looks like'}
- **Emotional Payoff:** ${persona.jobs?.emotional || 'Unknown—explore what feeling they want'}
- **Social Recognition:** ${persona.jobs?.social || 'Unknown—explore who would notice their success'}

### Tools & Workarounds
- **Current Tools/Systems:** ${extractToolsContext(persona)}
- **Where Things Break Down:** ${extractBreakdownPoints(persona)}

---

## What We Know (Grouped by Confidence)

### Strong Signals (High Confidence >= 70%)
${formatHighConfidenceFields(persona)}

*These fields have clear answers. Questions should be SKIPPED with rich confirmation prompts.*

### Partial Understanding (Medium Confidence 50-70%)
${formatMediumConfidenceFields(persona)}

*We have directional information but need confirmation and depth. Use CONFIRMATORY framing.*

### Working Hypotheses (Low-Medium Confidence 30-50%)
${formatLowMediumConfidenceFields(persona)}

*We have hints but need exploration. Probe openly with "Help me understand..."*

### Knowledge Gaps (Low Confidence < 30%)
${formatLowConfidenceFields(persona)}

*Little to no signal. Use EXPLORATORY framing: "Tell me about..." / "Walk me through..."*

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
1. **Consider the persona's world** using the Strategic Consideration Framework
2. **Determine the confidence level** for its target field
3. **Apply the appropriate style** (exploratory/confirmatory/skip)
4. **Transform the question** to show deep understanding—not just awareness
5. **Format with visual breathing room** (max 2 sentences per paragraph, separated by blank lines)
6. **Avoid ALL anti-patterns** (lazy prepending, wall of text, leading questions, etc.)
7. **Assign priority** based on confidence gaps (biggest gaps = highest priority)
8. **For skipped questions**, write rich, conversational confirmation prompts

Return an array of customized questions matching the schema.`;
```

**Acceptance Criteria**:
- [ ] New "Persona's World" section added at top
- [ ] All 4 helper functions called correctly
- [ ] Task instructions updated to include formatting rule (step 5)
- [ ] TypeScript compiles without errors

---

## Phase 4: Validation

### Task 4.1: Build Verification and Manual Testing

**Description**: Verify TypeScript compiles and manually test question generation quality.
**Size**: Small
**Priority**: High
**Dependencies**: All previous tasks
**Can run parallel with**: None

**Steps**:
1. Run `npm run build` to verify TypeScript compilation
2. Test the brain dump API with a sample transcript
3. Review generated questions against V2 criteria

**Validation Checklist**:
- [ ] TypeScript compiles without errors
- [ ] API responds successfully (< 5 seconds)
- [ ] Generated questions show full workflow understanding
- [ ] Generated questions probe for hero moments
- [ ] Generated questions have visual breathing room (paragraph breaks)
- [ ] No wall-of-text formatting in output
- [ ] Skip logic still works (>= 0.7 confidence)
- [ ] Priority ordering still functions

---

## Execution Summary

| Phase | Tasks | Dependencies | Parallel Opportunity |
|-------|-------|--------------|---------------------|
| Phase 1 | 1.1 (helpers) | None | Foundation |
| Phase 2 | 2.1, 2.2, 2.3, 2.4 (system prompt) | 2.4 depends on 2.1 | 2.1, 2.2, 2.3 can run parallel |
| Phase 3 | 3.1 (user prompt) | Task 1.1 | Sequential |
| Phase 4 | 4.1 (validation) | All | Sequential |

**Total Tasks**: 6
**Critical Path**: 1.1 → 2.1/2.2/2.3 → 2.4 → 3.1 → 4.1

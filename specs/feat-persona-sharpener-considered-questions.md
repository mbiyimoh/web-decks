# Specification: Considered Question Generation for Persona Sharpener (V2)

**Status:** Ready for Implementation
**Author:** Claude Code
**Date:** 2026-01-07
**Related:**
- `specs/feat-persona-sharpener-thoughtful-questions.md` (V1 - completed)
- `docs/ideation/persona-sharpener-thoughtful-questions.md`

---

## Overview

Elevate the question customization prompts from "thoughtful" (V1) to "considered" (V2). The current questions show awareness of what the user said but don't demonstrate deep consideration of what that information *means* for this persona's world, workflows, and hero journey.

### The Gap

| Level | Description | V1 State | V2 Target |
|-------|-------------|----------|-----------|
| **Aware** | Mentions what user said | ✓ | ✓ |
| **Integrated** | Weaves context into question substance | ✓ | ✓ |
| **Considered** | Shows understanding of domain implications | ✗ | ✓ |
| **Wise** | Asks about what *matters* for this persona's journey | ✗ | ✓ |

### Success Criteria

1. Questions demonstrate understanding of the persona's **full workflow**, not just isolated pain points
2. Questions probe for the **hero moment**—what observable success looks like
3. Questions explore **tools and workarounds** currently in use and where they break down
4. Questions ask about **cascade effects** and systemic patterns, not just single events
5. Questions are formatted with **visual breathing room** (max 2 sentences per paragraph)
6. Output feels like an expert researcher who has *thought deeply* about this persona's world

---

## Technical Scope

### Files to Modify

1. `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`
   - Add "Strategic Consideration Framework" section to system prompt
   - Add "Question Purpose" guidance per category
   - Add "Considered vs. Thoughtful" examples
   - Add "Formatting Rules" for visual breathing room
   - Enhance user prompt builder with "World Sketch" synthesis

### Files Unchanged

- `extraction.ts` - No changes needed
- `questions.ts` - Static question bank stays the same
- `brain-dump-schema.ts` - Schema unchanged
- `customized-question-schema.ts` - Schema unchanged
- API routes - No changes needed

---

## Implementation Details

### 1. Add Strategic Consideration Framework to System Prompt

Insert this new section BEFORE the existing "Transformation Framework":

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

### 2. Add Question Purpose Guidance

Add this section to help the LLM understand *why* each question category matters:

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

### 3. Add Formatting Rules Section

Add this critical section for visual breathing room:

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

### 4. Add "Considered vs. Thoughtful" Examples

Expand the examples section to show the elevation from V1 to V2:

```markdown
## Considered Examples (V2 Elevation)

These examples show the difference between "thoughtful" (V1) and "considered" (V2) questions.

---

### Example 1: Functional Job Question

**Original Question:**
"When your customer uses your product, what's the primary task they're trying to accomplish?"

**Brain Dump Context:**
- Persona: "The Overwhelmed Freelancer"
- jobs.functional: "track billable hours" (confidence: 0.65)
- Raw quote: "they're constantly losing money because they forget to log time"

**V1 Thoughtful (Good, but Surface-Level):**
"You mentioned freelancers constantly losing money because they forget to log time.

When they're in the middle of a project and realize they haven't tracked anything—what usually triggers that realization?

Is it invoice time, a client question, or something else?"

**V2 Considered (Shows Deep Understanding):**
"You described freelancers who lose money by forgetting to log time.

I want to understand their whole workflow around this: when they kick off a new project, is there even a moment where they set up tracking? Or does time logging only exist as a panicked scramble before invoicing?

Walk me through what happens from 'yes' to a project until they send the invoice—where does the system fall apart first?"

**Why V2 is Better:**
- Considers the **full workflow** (project kickoff → invoice), not just the failure moment
- Recognizes this might be a **systemic pattern**, not a one-time event
- Asks about the **sequence** and where it breaks down
- Shows understanding that the problem might start earlier than they realize

---

### Example 2: Frustrations Question (Tools & Workarounds)

**Original Question:**
"How do they currently solve this problem (without your product)?"

**Brain Dump Context:**
- Persona: "The Growth Marketer"
- frustrations.currentWorkaround: "spreadsheets everywhere" (confidence: 0.5)
- Context: Mid-career, managing multiple campaigns

**V1 Thoughtful:**
"You mentioned they use spreadsheets everywhere to manage campaigns.

What's the most painful part of that approach?

Walk me through a moment where the spreadsheet system completely failed them."

**V2 Considered:**
"You mentioned they're drowning in spreadsheets to manage campaigns.

I'm curious about the duct tape holding it together: how many different spreadsheets are we talking about? Is there a 'master' sheet that's supposed to connect them all, or is it more of a scattered mess?

When they need to answer a question like 'how did last month's campaigns perform?'—what's the actual process? How long does it take, and what usually goes wrong?"

**Why V2 is Better:**
- Probes the **architecture of their workaround**, not just "it's bad"
- Asks about a **specific scenario** (answering a performance question)
- Understands there's probably a **system** they've built, even if dysfunctional
- Gets at the **invisible tax**—time spent on things that should be easy

---

### Example 3: Goals Question (Hero Moment)

**Original Question:**
"Complete this from your customer's perspective: I would consider this product a success if..."

**Brain Dump Context:**
- Persona: "The Side Hustler"
- goals.primary: "achieve more" (confidence: 0.6)
- demographics.lifestyle: "busy-professional" (confidence: 0.75)
- Raw quote: "working parents trying to build something on the side"

**V1 Thoughtful:**
"You described working parents building something on the side while juggling a full-time job.

What would 'success' look like for them with your product?

What specific outcome would make them feel like it was worth the effort?"

**V2 Considered:**
"You described working parents trying to build something on the side—people who are already stretched thin but still investing in their dream.

What's the hero moment they're working toward? Is it a revenue milestone, quitting their day job, or something else entirely?

And who would they want to notice? Their spouse? Their colleagues? Themselves in the mirror? What would that recognition feel like?"

**Why V2 is Better:**
- Empathizes with their **constraint** (already stretched thin)
- Asks about **observable success**, not just feelings
- Probes the **social dimension**—who would notice?
- Gets at the **emotional payoff** in concrete terms

---

### Example 4: Behavior Question (Discovery & Adoption)

**Original Question:**
"Where are they most likely to discover products like yours?"

**Brain Dump Context:**
- Persona: "The Tech-Forward Manager"
- behaviors.discoveryChannels: null (confidence: 0.15)
- Demographics: 35-50, enterprise context

**V1 Thoughtful:**
"Think about the last enterprise tool your Tech-Forward Manager actually adopted—not just evaluated, but truly brought into their workflow.

How did they first hear about it?

What made that discovery channel credible to them?"

**V2 Considered:**
"Enterprise managers see hundreds of tools pitched at them. Most get ignored.

Think about a tool your Tech-Forward Manager actually adopted recently—not just tried, but made part of their workflow. What was different about how they discovered that one?

Was it the source (who told them), the timing (they had a problem that week), or something about how it was presented? What made them actually pay attention?"

**Why V2 is Better:**
- Acknowledges the **context** (they're drowning in pitches)
- Distinguishes between **adoption** and mere awareness
- Probes **multiple dimensions** of why something breaks through
- Asks about what made them **pay attention**, not just where they heard about it

---

### Example 5: Emotional Job Question

**Original Question:**
"When using your product, they primarily want to feel..."

**Brain Dump Context:**
- Persona: "The Cautious Buyer"
- jobs.emotional: "in-control" (confidence: 0.55)
- Context: B2B procurement, high-stakes decisions

**V1 Thoughtful:**
"You suggested they want to feel 'in control'—but control can mean different things.

For someone making high-stakes procurement decisions, is 'in control' more about having complete information before deciding, or about being able to reverse course if something goes wrong?

What does their version of control look like in practice?"

**V2 Considered:**
"You mentioned they want to feel 'in control' when making high-stakes procurement decisions.

I'm curious what that actually looks like in their world. When they're about to approve a big purchase—what do they need to see, know, or have in place before they feel safe signing off?

And what's the nightmare scenario they're trying to avoid? The one that would make them look bad to their boss or team?"

**Why V2 is Better:**
- Asks what control **looks like in practice**, not just the feeling
- Probes the **specific moment** of decision (about to approve)
- Gets at the **negative motivation** (what nightmare are they avoiding?)
- Connects emotional job to **social stakes** (looking bad to boss/team)

---

### Example 6: Dealing with Contradictions

**Original Question:**
"How much time can they realistically dedicate to this?"

**Brain Dump Context:**
- Persona: "The Ambitious Beginner"
- behaviors.timeAvailable: "< 5 min/day" (confidence: 0.4)
- goals.primary: "achieve more" ranked highly
- Potential contradiction: wants big results with minimal time

**V1 Thoughtful:**
"You mentioned they only have about 5 minutes a day, but they're clearly ambitious about achieving more.

Help me understand how they think about that trade-off.

Do they believe quick wins can compound over time, or are they hoping to find a solution that packs big impact into small moments?"

**V2 Considered:**
"There's a tension in what you've described: they have maybe 5 minutes a day, but they want to achieve something meaningful.

I'm curious how they reconcile that. Have they tried other things that promised quick results? What happened—did those work, or did they end up being 'quick' solutions that actually demanded more?

What would it take for them to trust that 5 minutes a day could actually move the needle?"

**Why V2 is Better:**
- Names the **tension explicitly** without judgment
- Asks about **past attempts** to solve this contradiction
- Probes their **trust threshold**—what would make them believe it?
- Gets at **pattern of behavior**, not just stated preference

---

### Example 7: Anti-Pattern Showcase (What NOT to Do)

**Original Question:**
"Who is explicitly NOT your customer?"

**Brain Dump Context:**
- Persona: "The Enterprise Buyer"
- Raw quote: "definitely not for small startups or individuals"

**V1 Thoughtful:**
"You've been clear that small startups and solo operators aren't the fit.

I'm curious about the edge cases—what about a 15-person startup growing fast, or an enterprise team that operates like a scrappy startup internally?

Where do you draw the line, and what's the signal that tells you someone's on the wrong side of it?"

**V2 Considered:**
"You mentioned small startups and individuals aren't your customer.

I'm curious about what happens when someone from that group does try to use your product. Have you seen that? What goes wrong—do they churn, complain, or just never get value?

And when you picture your ideal customer, what's the clearest signal that tells you 'yes, this person is right for us' before they even start?"

**Why V2 is Better:**
- Asks about **actual experiences** with wrong-fit customers
- Probes the **failure mode**, not just the exclusion
- Flips to ask about **positive signals**, not just negative
- Gets at **pattern recognition**, not just abstract criteria
```

### 5. Enhance User Prompt with "World Sketch" Synthesis

Modify `QUESTION_CUSTOMIZATION_USER_PROMPT` to include a synthesized narrative:

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

### 6. Add Helper Functions for World Sketch

Add these new helper functions (using actual `ExtractedPersona` schema fields):

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

---

## Example Transformations (Full V2 Output)

### Before (V1 Output)
```
You mentioned freelancers constantly losing money because they forget to log time. When they're in the middle of a project and realize they haven't tracked anything—what usually triggers that realization? Is it invoice time, a client question, or something else? Walk me through what that moment typically looks like for them.
```

### After (V2 Output)
```
You described freelancers who lose money by forgetting to log time.

I want to understand their whole workflow around this: when they kick off a new project, is there even a moment where they set up tracking? Or does time logging only exist as a panicked scramble before invoicing?

Walk me through what happens from 'yes' to a project until they send the invoice—where does the system fall apart first?
```

---

## Validation Plan

### Manual Review Checklist

After implementation, generate customized questions for 5 diverse brain dump samples:
1. B2C consumer app (lifestyle focus)
2. B2B SaaS (enterprise focus)
3. Marketplace/platform (two-sided)
4. Solo creator tool (individual focus)
5. Professional services (expertise focus)

For each output, verify:
- [ ] Questions show understanding of **full workflow**, not just single pain points
- [ ] Questions probe for **hero moment** and observable success
- [ ] Questions explore **tools and workarounds** in use
- [ ] Questions ask about **cascade effects** and systemic patterns
- [ ] Questions have **visual breathing room** (max 2 sentences per paragraph)
- [ ] No lazy prepending patterns
- [ ] No wall-of-text formatting
- [ ] Confidence-based styling applied correctly
- [ ] Confirmation prompts feel rich and conversational

### Formatting Verification

For each question, verify:
- [ ] No paragraph exceeds 2 sentences
- [ ] Paragraphs are separated by blank lines (`\n\n`)
- [ ] Question has clear structure: hook → probe → ask
- [ ] Total question length is reasonable (3-5 paragraphs max)

### Regression Check

Ensure:
- Skip logic still works (>= 0.7 confidence triggers skip)
- Priority ordering still functions
- Output schema remains valid
- API response times are acceptable (< 5 seconds)

---

## Implementation Order

1. **Add helper functions** for World Sketch synthesis
2. **Add Strategic Consideration Framework** to system prompt
3. **Add Question Purpose by Category** guidance
4. **Add Formatting Rules** section with examples
5. **Add V2 Considered Examples** (all 7)
6. **Enhance user prompt** with World Sketch synthesis
7. **Test with diverse samples** and iterate
8. **Verify formatting** (paragraph breaks, visual breathing room)

---

## Estimated Scope

- **System prompt additions:** ~350 lines of carefully crafted content
- **User prompt enhancements:** ~50 lines
- **Helper functions:** ~60 lines TypeScript
- **Testing:** Manual review of 5 samples with formatting verification

No database changes. No API route changes. No UI changes.

---

## Key Differences from V1

| Aspect | V1 (Thoughtful) | V2 (Considered) |
|--------|-----------------|-----------------|
| **Context use** | Integrates into question | Shows understanding of implications |
| **Scope** | Single pain point | Full workflow / system |
| **Hero moment** | Emotional job | Observable, social success |
| **Tools** | Mentioned | Explored in depth |
| **Cascade effects** | Not addressed | Explicitly probed |
| **Formatting** | Not specified | Max 2 sentences per paragraph |
| **Strategic framing** | Transformation framework | World Sketch + Strategic Consideration |

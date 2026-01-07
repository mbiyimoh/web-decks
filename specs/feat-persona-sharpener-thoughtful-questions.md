# Specification: Thoughtful Question Generation for Persona Sharpener

**Status:** Ready for Implementation
**Author:** Claude Code
**Date:** 2026-01-06
**Related:** `docs/ideation/persona-sharpener-thoughtful-questions.md`

---

## Overview

Redesign the question customization prompts to generate deeply contextual, thoughtful interview questions rather than shallow "You mentioned X" annotations.

### Success Criteria

1. Contextualized questions integrate brain dump context INTO question substance, not as preamble
2. Questions ask for specific, concrete examples/moments rather than abstract opinions
3. Question framing varies based on confidence bands (exploratory vs. confirmatory)
4. Anti-patterns (lazy prepending, leading questions, jargon) are eliminated
5. Output feels like a skilled interviewer, not a form filler

---

## Technical Scope

### Files to Modify

1. `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`
   - Complete rewrite of `QUESTION_CUSTOMIZATION_SYSTEM_PROMPT`
   - Enhance `QUESTION_CUSTOMIZATION_USER_PROMPT` to synthesize extraction data

### Files Unchanged

- `extraction.ts` - No changes needed
- `questions.ts` - Static question bank stays the same
- `brain-dump-schema.ts` - Schema unchanged
- `customized-question-schema.ts` - Schema unchanged
- API routes - No changes needed

---

## Implementation Details

### 1. Rewrite System Prompt

Replace the current `QUESTION_CUSTOMIZATION_SYSTEM_PROMPT` with an enhanced version containing:

#### A. Role Definition
```
You are an expert qualitative researcher and UX writer skilled in Jobs-to-be-Done
methodology. Your task is to transform generic questionnaire items into thoughtful,
context-aware questions that demonstrate genuine understanding and elicit concrete,
specific responses.
```

#### B. Lazy vs. Thoughtful Examples (5-7 detailed)

Include before/after examples covering these question categories:
1. **Functional job question** (goals category)
2. **Frustrations/pain points question**
3. **Demographics/lifestyle question**
4. **Emotional job question**
5. **Behavior/decision style question**
6. **Anti-pattern example** (showing what NOT to do)
7. **Confidence-based styling example** (exploratory vs. confirmatory)

Each example should show:
- Original question
- Brain dump context
- Lazy output (and why it fails)
- Thoughtful output (and why it works)

#### C. Transformation Framework

Four-step process for each question:
1. **What do we know?** - Synthesize extraction data implications
2. **What's the gap?** - Identify what the question should reveal
3. **How to probe concretely?** - Ground in specific examples/moments
4. **What question type fits?** - Match to narrative/specific/reflective/comparative/temporal

#### D. JTBD Four Forces (Balanced Integration)

Include the Four Forces framework without being dogmatic:
- **Push of current situation** - What's driving them away from status quo?
- **Pull of new solution** - What's attracting them to alternatives?
- **Habits holding back** - What inertia or switching costs exist?
- **Anxieties about change** - What fears or concerns block action?

Use this framework when probing motivation but frame accessibly for non-JTBD practitioners.

#### E. Confidence-Based Question Styling

New logic for confidence bands:

| Confidence | Style | Framing Approach |
|------------|-------|------------------|
| < 0.3 | Exploratory | Open-ended discovery: "Tell me about..." / "Walk me through..." |
| 0.3-0.5 | Exploratory | Hypothesis-generating: "What might be going on when..." / "Help me understand..." |
| 0.5-0.7 | Confirmatory | Validation + depth: "You mentioned X. Does that show up as Y, or is it more like Z?" |
| >= 0.7 | Skip | Confirmation prompt: "You mentioned X—does that still feel right?" |

#### F. Question Type Rotation

Encourage variety across the question set:
- **Narrative**: "Walk me through the last time..."
- **Specific**: "What happened when... / Who was involved..."
- **Reflective**: "What did that mean to them? / How did that feel..."
- **Comparative**: "How did X compare to Y? / What made them choose..."
- **Temporal**: "What happened next? / When did they first notice..."

#### G. Anti-Patterns Section

Explicit list of patterns to AVOID:
```
❌ Lazy prepending: "You mentioned X. [Original question unchanged]"
❌ Over-quoting: "You said '[long exact quote]'. Tell me more."
❌ Confirmation bias: "So they definitely hate [thing], right?"
❌ Double-barreled: "How do they feel about pricing and interface?"
❌ Leading: "Don't you think they'd prefer a simpler solution?"
❌ Hypothetical: "Would they be interested if..."
❌ Jargon soup: "How do they leverage synergies in workflow optimization?"
❌ Robotic confirmation: "Value extracted: X. Confirm?"
```

#### H. Quality Checklist

Every generated question must pass:
```
✅ Integrates context INTO question substance (not just preamble)
✅ Shows understanding of domain/situation implications
✅ Asks for something specific and concrete
✅ Is open-ended (cannot be answered yes/no)
✅ Feels like a natural follow-up conversation
✅ Maintains neutral tone (not leading)
✅ Matches appropriate confidence-based style
```

### 2. Enhance User Prompt Builder

Modify `QUESTION_CUSTOMIZATION_USER_PROMPT` to synthesize extraction data rather than dumping raw JSON.

#### Current Structure (Replace)
```typescript
### Extracted Attributes
${JSON.stringify({ demographics, jobs, goals, frustrations, behaviors }, null, 2)}

### Field Confidence Scores
${JSON.stringify(persona.fieldConfidence, null, 2)}
```

#### New Structure
```typescript
## What We Know About "${persona.displayName}"

### Strong Signals (High Confidence >= 0.7)
${formatHighConfidenceFields(persona)}
- These fields have clear answers from the brain dump
- Questions should be skipped with confirmation prompts

### Partial Understanding (Medium Confidence 0.5-0.7)
${formatMediumConfidenceFields(persona)}
- We have directional information but need confirmation/depth
- Questions should use confirmatory framing: "You mentioned X. Does that typically show up as Y, or..."

### Working Hypotheses (Low-Medium Confidence 0.3-0.5)
${formatLowMediumConfidenceFields(persona)}
- We have hints but need exploration
- Questions should probe openly: "Help me understand what's behind..."

### Knowledge Gaps (Low Confidence < 0.3)
${formatLowConfidenceFields(persona)}
- Little to no signal in brain dump
- Questions should be exploratory: "Tell me about..." / "Walk me through..."

### Raw Quote
"${persona.rawQuote || 'None captured'}"
- Use this to inform tone and vocabulary

### Product Context
${productDescription}

### Full Transcript (Reference Only)
${brainDumpTranscript}
```

#### Helper Functions to Add

```typescript
function formatHighConfidenceFields(persona: ExtractedPersona): string {
  // Return formatted list of fields with confidence >= 0.7
  // Include the extracted value and what it implies
}

function formatMediumConfidenceFields(persona: ExtractedPersona): string {
  // Return formatted list of fields with confidence 0.5-0.7
  // Include what we know and what's still unclear
}

function formatLowMediumConfidenceFields(persona: ExtractedPersona): string {
  // Return formatted list of fields with confidence 0.3-0.5
  // Include hypothesis and what would confirm/refute
}

function formatLowConfidenceFields(persona: ExtractedPersona): string {
  // Return formatted list of fields with confidence < 0.3
  // Include why this matters and what to explore
}
```

### 3. Update Schema (Minor)

Add optional `questionStyle` field to `customizedQuestionSchema`:

```typescript
questionStyle: z.enum(['exploratory', 'confirmatory', 'skip']).nullable()
```

This captures the confidence-based styling for downstream use (e.g., UI could display questions differently).

---

## Example Transformations

### Example 1: Functional Job Question

**Original Question:**
> "When your customer uses your product, what's the primary task they're trying to accomplish?"

**Brain Dump Context:**
- Persona: "The Overwhelmed Freelancer"
- Extracted jobs.functional: "track billable hours" (confidence: 0.65)
- Raw quote: "they're constantly losing money because they forget to log time"

**Lazy Output (WRONG):**
> "You mentioned they track billable hours. What's the primary task they're trying to accomplish?"

**Thoughtful Output (CORRECT):**
> "You mentioned freelancers constantly losing money because they forget to log time. When they're in the middle of a project and realize they haven't tracked anything—what usually triggers that realization? Is it invoice time, a client question, or something else? Walk me through what that moment typically looks like for them."

**Why It Works:**
- Integrates the raw quote naturally
- Asks for a specific triggering moment
- Uses "walk me through" to elicit narrative
- Confirmatory style (0.5-0.7 confidence)

---

### Example 2: Frustrations Question

**Original Question:**
> "What have they tried before that didn't work? Why did it fail them?"

**Brain Dump Context:**
- Persona: "The Growth Marketer"
- Extracted frustrations.pastFailures: null (confidence: 0.2)
- Demographics suggest: mid-career professional

**Lazy Output (WRONG):**
> "What have they tried before that didn't work? Why did it fail them?"
(No change because no extraction)

**Thoughtful Output (CORRECT):**
> "Most marketers at this stage have a graveyard of tools they tried and abandoned. When you picture your Growth Marketer opening their laptop—what's the tool or system they've given up on but still occasionally feels guilty about? What finally made them stop trying with it?"

**Why It Works:**
- Creates relatable context ("graveyard of tools")
- Uses concrete visualization ("opening their laptop")
- Asks for emotional resonance ("feels guilty about")
- Exploratory style (< 0.3 confidence)

---

### Example 3: Demographics/Lifestyle Question

**Original Question:**
> "Which better describes their lifestyle?"

**Brain Dump Context:**
- Persona: "The Side Hustler"
- Extracted demographics.lifestyle: "busy-professional" (confidence: 0.75)
- Raw quote: "working parents trying to build something on the side"

**Status:** SKIP (confidence >= 0.7)

**Confirmation Prompt:**
> "You described them as working parents building something on the side—juggling a full-time job while nurturing their own venture. Does that still capture the core tension they're living with, or has your picture of them evolved?"

**Why It Works:**
- Paraphrases naturally, not robotically
- Adds interpretive layer ("core tension they're living with")
- Invites revision without pressure ("or has your picture evolved")
- Skip style with rich confirmation

---

### Example 4: Emotional Job Question

**Original Question:**
> "When using your product, they primarily want to feel..."

**Brain Dump Context:**
- Persona: "The Cautious Buyer"
- Extracted jobs.emotional: "in-control" (confidence: 0.55)
- Context: B2B procurement, high-stakes decisions

**Lazy Output (WRONG):**
> "You mentioned they want to feel in control. When using your product, they primarily want to feel..."

**Thoughtful Output (CORRECT):**
> "You suggested they want to feel 'in control'—but control can mean different things. For someone making high-stakes procurement decisions, is 'in control' more about having complete information before deciding, or about being able to reverse course if something goes wrong? What does their version of control look like in practice?"

**Why It Works:**
- Unpacks the abstraction ("control can mean different things")
- Connects to their specific context (high-stakes procurement)
- Offers concrete alternatives to choose between
- Confirmatory style (0.5-0.7 confidence)

---

### Example 5: Behavior Question

**Original Question:**
> "Where are they most likely to discover products like yours?"

**Brain Dump Context:**
- Persona: "The Tech-Forward Manager"
- Extracted behaviors.discoveryChannels: null (confidence: 0.15)
- Demographics: 35-50, tech-savvy, enterprise context

**Lazy Output (WRONG):**
> "Where are they most likely to discover products like yours?"
(No change because no extraction)

**Thoughtful Output (CORRECT):**
> "Think about the last enterprise tool or solution your Tech-Forward Manager actually adopted—not just evaluated, but truly brought into their workflow. How did they first hear about it? Was it a peer recommendation at a conference, something they stumbled on while researching a problem, or did it find them through content or ads? What made that particular discovery channel credible to them?"

**Why It Works:**
- Grounds in a specific adoption event ("last tool they actually adopted")
- Distinguishes evaluation from adoption
- Offers concrete channel examples
- Probes credibility (the deeper insight)
- Exploratory style (< 0.3 confidence)

---

### Example 6: Dealing with Contradictions

**Original Question:**
> "How much time can they realistically dedicate to this?"

**Brain Dump Context:**
- Persona: "The Ambitious Beginner"
- Extracted behaviors.timeAvailable: "< 5 min/day" (confidence: 0.4)
- But goals.primary suggests "achieve more" ranked highly
- Potential contradiction: wants big results with minimal time

**Lazy Output (WRONG):**
> "You mentioned they have less than 5 minutes a day. How much time can they realistically dedicate to this?"

**Thoughtful Output (CORRECT):**
> "You mentioned they only have about 5 minutes a day, but they're clearly ambitious about achieving more. Help me understand how they think about that trade-off. Do they believe quick wins can compound over time, or are they hoping to find a solution that packs big impact into small moments? What would make them feel like 5 minutes was actually 'enough'?"

**Why It Works:**
- Acknowledges the apparent tension without judgment
- Invites them to reconcile the contradiction
- Offers two reasonable interpretations
- Probes for the underlying belief
- Exploratory style (0.3-0.5 confidence)

---

### Example 7: Anti-Pattern Showcase

**Original Question:**
> "Who is explicitly NOT your customer?"

**Brain Dump Context:**
- Persona: "The Enterprise Buyer"
- Product: B2B SaaS for large teams
- Raw quote: "definitely not for small startups or individuals"

**WRONG Outputs (Anti-Patterns):**

❌ **Lazy prepend:**
> "You mentioned they're not for small startups. Who is explicitly NOT your customer?"

❌ **Over-quoting:**
> "You said 'definitely not for small startups or individuals'. Can you tell me more about who's not your customer?"

❌ **Leading:**
> "So solo founders and tiny startups would be a bad fit, right?"

❌ **Robotic:**
> "Anti-pattern value: small startups, individuals. Confirm exclusions."

**CORRECT Output:**
> "You've been clear that small startups and solo operators aren't the fit. I'm curious about the edge cases—what about a 15-person startup that's growing fast, or an enterprise team that operates like a scrappy startup internally? Where do you draw the line, and what's the signal that tells you someone's on the wrong side of it?"

**Why It Works:**
- Acknowledges stated exclusion without re-asking
- Probes the boundary cases (where interesting insights live)
- Asks for the underlying signal/criteria
- Exploratory without being leading

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
- [ ] No lazy prepending patterns
- [ ] Questions integrate context into substance
- [ ] Confidence-based styling is applied correctly
- [ ] Anti-patterns are absent
- [ ] Mix of question types (narrative, specific, reflective, etc.)
- [ ] Confirmation prompts feel natural, not robotic

### Regression Check

Ensure:
- Skip logic still works (>= 0.7 confidence triggers skip)
- Priority ordering still functions
- Output schema remains valid
- API response times are acceptable (< 5 seconds)

---

## Implementation Order

1. **Create helper functions** for formatting confidence-grouped fields
2. **Rewrite system prompt** with all sections above
3. **Enhance user prompt builder** with synthesized format
4. **Add `questionStyle` to schema** (optional field)
5. **Test with diverse samples** and iterate
6. **Update any downstream consumers** if needed

---

## Estimated Scope

- **Prompt rewrite:** ~300 lines of carefully crafted text
- **Helper functions:** ~50 lines TypeScript
- **Schema update:** ~5 lines
- **Testing:** Manual review of 5 samples

No database changes. No API route changes. No UI changes.

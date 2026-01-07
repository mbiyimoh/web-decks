# Thoughtful Question Generation for Persona Sharpener

**Slug:** persona-sharpener-thoughtful-questions
**Author:** Claude Code
**Date:** 2026-01-06
**Branch:** N/A (ideation phase)
**Related:** `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`

---

## 1) Intent & Assumptions

**Task brief:** The persona sharpener's interview questions currently feel shallow—they reference brain dump content in a lazy, surface-level way (e.g., "You mentioned X. Tell me more.") rather than thoughtfully integrating user-provided information into meaningful, probing questions that demonstrate genuine understanding and elicit deeper reflection.

**Assumptions:**
- The issue is primarily in the prompt engineering, not the underlying question bank
- The current system has the right data (extraction + field confidence), but uses it poorly
- Better prompts can produce significantly more thoughtful questions without changing architecture
- Users notice and care about question quality—shallow questions feel like a checkbox exercise

**Out of scope:**
- Changing the question bank structure or adding new questions
- UI/UX changes to how questions are presented
- Database schema modifications
- Adding new AI models or changing from GPT-4o-mini

---

## 2) Pre-reading Log

### Codebase Analysis

- `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts`: The core prompt file. System prompt is well-structured with skip logic, priority rules, and contextualization guidelines. However, the examples are basic and don't demonstrate deep integration.

- `lib/clarity-canvas/modules/persona-sharpener/prompts/extraction.ts`: Extraction prompt that pulls personas from brain dump. Captures `rawQuote` and field confidence scores—valuable data that could inform richer questions.

- `lib/clarity-canvas/modules/persona-sharpener/questions.ts`: 19-question bank organized by category. Each question has `field` mapping and `helperText`. The static questions are well-designed but need better contextualization.

### External Research

- **AI Conversational Interviewing (arXiv 2024)**: GPT-4 interviewers generate 62% longer responses with comparable quality to humans. Key: adaptive follow-ups and active listening signals.

- **JTBD Interview Methodology**: Timeline framework (First Thought → Passive Looking → Active Looking → Deciding) and Four Forces (Push, Pull, Habits, Anxieties) provide meta-structure for probing.

- **Laddering Techniques**: Drill down (vertical) for depth, move sideways (horizontal) for breadth. The system should vary question type based on response depth.

- **The "Name of the Dog" Principle**: Concrete environmental details trigger episodic memory and improve recall accuracy.

- **DICE Taxonomy**: Descriptive, Idiographic, Clarifying, Elaboration probes—different probe types serve different purposes.

---

## 3) Codebase Map

**Primary components/modules:**
- `lib/clarity-canvas/modules/persona-sharpener/prompts/question-customization.ts` - The prompt to improve
- `lib/clarity-canvas/modules/persona-sharpener/prompts/extraction.ts` - Provides input data
- `lib/clarity-canvas/modules/persona-sharpener/questions.ts` - Static question bank
- `app/api/clarity-canvas/modules/persona-sharpener/brain-dump/route.ts` - API that chains extraction → customization

**Shared dependencies:**
- OpenAI API with `zodResponseFormat` for structured outputs
- Zod schemas in `brain-dump-schema.ts` and `customized-question-schema.ts`

**Data flow:**
```
Brain dump transcript
  → Extraction prompt (extracts personas + field confidence)
  → Customization prompt (adapts questions per persona)
  → Customized questions with skip logic + priority + contextualizedText
```

**Potential blast radius:**
- Only affects question generation quality
- No schema changes, API changes, or data model changes
- Purely prompt engineering

---

## 4) Root Cause Analysis

### The Problem: Shallow Contextualization

**Current behavior (observed):**
```
Original: "What's the primary task they're trying to accomplish?"
Brain dump mentions: "freelancers who struggle to track billable hours"
Current output: "You mentioned they struggle to track billable hours. What's the primary task they're trying to accomplish?"
```

This is lazy because:
1. It's additive, not integrative (just prepends context as a preamble)
2. Doesn't demonstrate understanding of the *implications* of the context
3. Doesn't adjust the question's framing or scope based on what we know
4. Feels like a form filler, not a conversational partner

**Expected behavior:**
```
Thoughtful output: "You mentioned freelancers struggling to track billable hours. When they're in the middle of a project, what's the trigger that makes them realize they need to log time—is it the end of a session, an invoice deadline, or something else? Walk me through that moment."
```

This is better because:
1. Integrates the context *into* the question's substance
2. Shows understanding of the domain (time tracking has triggers, moments)
3. Asks for a specific, concrete scenario ("walk me through that moment")
4. Uses the context to narrow and focus the question appropriately

### Root Cause Hypotheses

1. **Prompt lacks examples of deep integration** (Confidence: 0.85)
   - The system prompt shows one basic example of contextualization
   - No examples of probing contradictions, drilling down, or environmental grounding
   - The model defaults to the simplest pattern: prepend "You mentioned..."

2. **Missing meta-instructions for question transformation** (Confidence: 0.8)
   - The prompt tells the model *what* to do but not *how* to think about transformation
   - No guidance on question types (narrative, specific, reflective, comparative)
   - No framework for varying depth based on confidence levels

3. **User prompt doesn't surface the full richness of extracted data** (Confidence: 0.7)
   - Passes JSON blobs of extracted attributes but doesn't highlight implications
   - Doesn't identify gaps, contradictions, or themes across fields
   - Missing "here's what we know, here's what we don't know" framing

4. **No active listening / probing logic** (Confidence: 0.75)
   - Current system treats each question independently
   - Doesn't consider relationships between questions or build narrative
   - Missing the JTBD timeline or Four Forces meta-framework

### Decision

**Primary fix: Redesign the system prompt** to include:
- Richer examples of thoughtful question transformation
- Explicit meta-frameworks (JTBD, laddering, question types)
- Clear anti-patterns to avoid
- Guidance on using extraction data to *transform* rather than *annotate* questions

**Secondary fix: Enhance user prompt** to:
- Surface implications of extracted data, not just raw values
- Identify specific knowledge gaps worth probing
- Provide thematic synthesis across fields

---

## 5) Research Findings

### Potential Solutions

#### Solution A: Enhanced Prompt with Examples (Recommended)

Rewrite `QUESTION_CUSTOMIZATION_SYSTEM_PROMPT` with:
- 5-7 before/after examples showing lazy → thoughtful transformation
- Explicit question type rotation (narrative, specific, reflective, comparative, temporal)
- Anti-pattern section ("Questions to avoid generating")
- JTBD Four Forces framework for probing motivation
- Laddering guidance (drill down vs. move sideways)
- "Make It Concrete" formula from research

**Pros:**
- No architecture changes
- Immediate improvement in output quality
- Leverages research-backed techniques
- Low risk, easy to iterate

**Cons:**
- Longer prompts may increase token usage slightly
- Requires careful prompt engineering to avoid over-constraining

#### Solution B: Two-Stage Prompt Pipeline

Add an intermediate "Question Strategy" step:
1. First prompt: Analyze extraction data, identify gaps/contradictions, create questioning strategy
2. Second prompt: Generate questions following the strategy

**Pros:**
- Separates analysis from generation (cleaner reasoning)
- Strategy can be reviewed/debugged
- Could enable more sophisticated prioritization

**Cons:**
- Doubles API calls per persona
- More complex error handling
- May be overkill for current needs

#### Solution C: Question-Specific Micro-Prompts

Instead of one big prompt, create 19 specialized mini-prompts—one per question—each with domain-specific examples and probing strategies.

**Pros:**
- Highly tailored to each question's domain
- Could achieve very high quality per question
- Modular and testable

**Cons:**
- 19x API calls per persona (expensive, slow)
- High maintenance burden
- Coordination between questions would be lost

### Recommendation

**Implement Solution A (Enhanced Prompt with Examples)** as the primary approach.

This is the highest-leverage change: better prompts using the same architecture. The research clearly shows that:
- Rich examples dramatically improve output quality
- Meta-frameworks (JTBD, laddering) provide structure without rigidity
- Anti-patterns prevent the laziest outputs

If Solution A proves insufficient after iteration, consider Solution B as a follow-up enhancement.

---

## 6) Clarification

### Decisions for User to Clarify

1. **Example quality vs. prompt length trade-off**: Should we include 5-7 detailed before/after examples (longer prompt, better outputs) or 3-4 compact examples (shorter prompt, potentially less consistent)?
>> 5-7 detailed

2. **Framework emphasis**: Should the prompt emphasize JTBD/Four Forces language (helpful for business personas) or more general UX research framing (broader applicability)?
>> lean into the former but somewhere in the middle 

3. **Confidence threshold behavior**: Currently >= 0.7 triggers skip. Should we also adjust question *style* based on confidence bands? E.g., 0.3-0.5 gets "exploratory" framing, 0.5-0.7 gets "confirmatory" framing?
>> sure

4. **Question interdependence**: Should questions reference each other? E.g., "Given what you said about their frustrations, how does that connect to their primary goal?" This adds complexity but increases narrative flow.
>> not right now. we'll save that for later

---

## 7) Proposed Prompt Redesign

### System Prompt Structure

```markdown
## Your Role
You are an expert qualitative researcher and UX writer. Your task is to transform
generic questionnaire items into thoughtful, context-aware questions that:
- Demonstrate genuine understanding of what the user has shared
- Probe for specific, concrete experiences rather than abstract opinions
- Build naturally on prior context rather than mechanically prepending it
- Use research-backed questioning techniques (laddering, JTBD, active listening)

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
Thoughtful output: "You mentioned freelancers struggling to track billable hours.
When they're in the middle of a project, what triggers them to stop and log time—
the end of a work session, an approaching invoice deadline, or something else?
Walk me through what that moment typically looks like."

Why it's better:
- Integrates context INTO the question's substance
- Shows domain understanding (time tracking has triggers, moments)
- Asks for a specific, concrete scenario ("walk me through that moment")
- Uses context to narrow and focus appropriately

## Transformation Framework

For each question, consider:

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
- Narrative: "Walk me through the last time..."
- Specific: "What happened when... / Who was involved..."
- Reflective: "What did that mean to you? / How did you feel..."
- Comparative: "How did X compare to Y? / What made you choose..."
- Temporal: "What happened next? / When did you first notice..."

## JTBD Four Forces (Use for Motivation Questions)

When probing why someone does something:
- Push: "What was it about their current situation that made them look for something new?"
- Pull: "What specifically attracted them to this solution over others?"
- Habits: "What makes it hard for them to change? What almost stops them?"
- Anxieties: "What concerns or fears do they have about trying something new?"

## Laddering Guidance

- Drill Down (vertical): When answer is vague, probe for specifics
- Move Sideways (horizontal): When topic is exhausted, transition to related area

## Anti-Patterns to Avoid

❌ Prepending context without integration: "You mentioned X. [Original question unchanged]"
❌ Over-quoting: "You said 'exact long quote from transcript here'. Tell me more."
❌ Confirmation bias: "So they definitely hate [thing you extracted], right?"
❌ Double-barreled questions: "How do they feel about the pricing and the interface?"
❌ Leading questions: "Don't you think they would prefer a simpler solution?"
❌ Hypothetical framing: "Would they be interested if you added..."
❌ Jargon soup: "How do they leverage synergies in their workflow optimization?"

## Quality Checklist

Every contextualized question should:
✅ Integrate context into the question's substance (not just preamble)
✅ Show understanding of domain/situation implications
✅ Ask for something specific and concrete
✅ Be open-ended (not yes/no answerable)
✅ Feel like a natural follow-up, not a form field
✅ Maintain neutral tone (not leading)

## Confirmation Prompt Guidelines

For skipped questions, the confirmation prompt should:
✅ Quote or paraphrase naturally (not robotically)
✅ Invite revision without pressure
✅ Sound conversational

Good: "You mentioned they're 'time-poor professionals who value efficiency above all else'—does that still capture how you see them, or has your thinking evolved?"

Bad: "Lifestyle value extracted: 'time-poor professional'. Confirm this is correct."

## Before/After Examples

[Include 5-7 detailed examples covering different question types and categories]
```

### User Prompt Enhancements

Instead of just passing raw JSON, synthesize insights:

```markdown
## What We Know About This Persona

**Core Identity:** {displayName} - {1-2 sentence synthesis}

**Strong Signals (confidence >= 0.7):**
- {field}: {value} — {what this implies for questioning}

**Partial Understanding (confidence 0.3-0.7):**
- {field}: {value} — {what's still unclear, worth probing}

**Knowledge Gaps (confidence < 0.3):**
- {field}: {why this matters, what good questions would reveal}

**Thematic Connections:**
- {Any patterns across fields, e.g., "Multiple references to time pressure suggest..."}

**Raw Quote:**
"{quote}" — {what this reveals about their voice/framing}
```

---

## 8) Success Metrics

After implementing the redesigned prompts, evaluate:

1. **Transformation depth**: Do questions integrate context or just prepend it?
2. **Specificity**: Do questions ask for concrete examples/moments?
3. **Variety**: Do questions use different types (narrative, reflective, comparative)?
4. **Naturalness**: Do questions read as conversational follow-ups?
5. **Anti-pattern absence**: Are the lazy patterns successfully avoided?

Consider A/B testing the old vs. new prompts and comparing:
- Qualitative review of 10-20 sample outputs
- User feedback on question quality
- Completion rates (do better questions improve engagement?)

---

## 9) Implementation Path

1. **Create new prompt file** or update existing with enhanced system prompt
2. **Add before/after examples** covering all question categories
3. **Enhance user prompt builder** to synthesize extraction data, not just dump JSON
4. **Test with diverse brain dump samples** across different business types
5. **Iterate based on output quality** review

---

## References

1. [AI Conversational Interviewing (arXiv 2024)](https://arxiv.org/html/2410.01824v1)
2. [JTBD Interview Practice Guide](https://commoncog.com/putting-jtbd-interview-to-practice/)
3. [Laddering Questions in UX Research](https://www.interaction-design.org/literature/article/laddering-questions-drilling-down-deep-and-moving-sideways-in-ux-research)
4. [The Art of Crafting Effective Interview Questions](https://www.theopennotebook.com/2023/09/26/the-art-of-crafting-effective-interview-questions/)
5. [Probing in Qualitative Research: Theory and Practice](https://www.tandfonline.com/doi/full/10.1080/14780887.2023.2238625)
6. [Context-Aware Conversational AI Framework](https://promptengineering.org/the-context-aware-conversational-ai-framework/)

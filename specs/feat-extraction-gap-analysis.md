# Feature Spec: Second-Pass Gap Analysis for Prospect Extraction

**Status:** Draft
**Author:** Claude
**Date:** February 2026

---

## Overview

Apply the Second-Pass Gap Analysis pattern (already proven in Clarity Canvas) to the Central Command prospect extraction flow. This adds a quality-auditing LLM pass that catches missed information, under-extracted details, and confidence issues in the initial text-to-structured-data extraction.

## Problem Statement

The current prospect extraction flow uses a single LLM pass to convert unstructured text (meeting notes, call transcripts, emails) into structured synthesis sections and score assessments. Single-pass extraction commonly:

- Misses information mentioned in passing
- Creates shallow summaries that lose nuance
- Assigns content to wrong categories
- Over-confident scoring without sufficient evidence
- Fragments related information across sections

The Second-Pass Gap Analysis Framework addresses these issues by adding a critical self-audit pass that reviews the first-pass output against the original source material.

## Goals

1. Add a second LLM pass to `/api/central-command/extract` that audits the first-pass extraction
2. Create a gap analysis prompt tailored to prospect extraction (synthesis sections + scores)
3. Return the improved extraction to the frontend (transparent to UI)
4. Add graceful degradation if second pass fails

## Non-Goals

- UI changes to IntakeModal (second pass is transparent)
- Making the second pass optional/configurable (future improvement)
- Background/async processing (keep it synchronous for now)
- Separate API endpoint (integrate directly into extract route)
- A/B testing infrastructure
- Quality metrics dashboard

## Technical Approach

### Architecture

```
POST /api/central-command/extract
    │
    ├─ [Existing] First Pass: generateObject(gpt-4o, extractionSchema)
    │   └─ Returns: PipelineExtraction (synthesis + recommendations)
    │
    ├─ [NEW] Second Pass: generateObject(gpt-4o, extractionSchema)
    │   └─ Input: Original text + First-pass results
    │   └─ System: EXTRACTION_GAP_ANALYSIS_PROMPT
    │   └─ Returns: Complete, final PipelineExtraction
    │
    └─ Return finalExtraction to frontend
```

### Key Files to Modify

1. **`lib/central-command/prompts.ts`** — Add `EXTRACTION_GAP_ANALYSIS_PROMPT`
2. **`app/api/central-command/extract/route.ts`** — Chain second LLM call after first pass

## Implementation Details

### 1. Gap Analysis Prompt (`lib/central-command/prompts.ts`)

Add a new prompt constant tailored to prospect extraction:

```typescript
export const EXTRACTION_GAP_ANALYSIS_PROMPT = `You have completed a first-pass extraction of prospect intelligence. Now perform a critical second-pass review with fresh eyes.

Your role is now that of a QUALITY AUDITOR — not just looking for missed information, but evaluating whether the first pass truly captured the meaning, nuance, and strategic value of the source material.

## REVIEW FOR THESE SCENARIOS

### In Synthesis Sections:

1. **MISSED ENTIRELY** — Information exists in source but no corresponding content
   - Facts, numbers, timeframes mentioned in passing
   - Secondary points that seemed minor but are relevant
   → Action: Add to appropriate section

2. **UNDER-EXTRACTED** — Section exists but fails to capture full richness
   - Important qualifiers or context dropped
   - Summary is accurate but shallow
   - Nuance that would help the user was lost
   → Action: Enrich with deeper detail

3. **MIS-CATEGORIZED** — Information captured in wrong section
   - Pain point written in goals section
   - Company info mixed into strategic assessment
   → Action: Move to correct section

4. **FRAGMENTED** — Related information split when it should be unified
   - A cohesive point became disjointed across sections
   → Action: Consolidate for coherence

5. **CONTRADICTED** — Later statements qualify or conflict with earlier ones
   - Later statements walk back earlier claims
   - Conditions or exceptions weren't captured
   → Action: Reflect the full, accurate picture

### In Score Assessments:

6. **OVER-CONFIDENT** — Score higher than evidence warrants
   - Inference presented as fact in rationale
   - Evidence array doesn't support the score
   → Action: Lower score, adjust rationale

7. **UNDER-CONFIDENT** — Score lower than evidence supports
   - Clear signals exist but weren't weighted properly
   → Action: Raise score, cite evidence

8. **MISSING EVIDENCE** — Score given without supporting quotes
   - Evidence array is empty or generic
   → Action: Add specific phrases from source

9. **WRONG DIMENSION** — Evidence cited for wrong scoring dimension
   - Budget signal used for timeline score
   → Action: Reassign evidence to correct score

### In Operational Recommendations:

10. **MISSED EXTRACTION** — Concrete data point not captured
    - Contact info, dates, company details mentioned but not extracted
    → Action: Add recommendation

11. **WRONG CATEGORY** — Extraction assigned to wrong category
    → Action: Correct category assignment

## YOUR OUTPUT

Return the COMPLETE, FINAL PipelineExtraction that should be shown to the user:

1. **KEEP** first-pass content that is accurate and complete
2. **REPLACE** content that needs correction (include only improved version)
3. **ADD** new content for missed information
4. **CONSOLIDATE** fragmented content

Do NOT return observations or findings. Return the actual structured extraction in the same schema.

Prioritize changes that materially affect understanding. Minor refinements matter less than strategic corrections.`;
```

### 2. Extract Route Modification (`app/api/central-command/extract/route.ts`)

Chain the second pass after the first:

```typescript
import { PIPELINE_EXTRACTION_SYSTEM_PROMPT, EXTRACTION_GAP_ANALYSIS_PROMPT } from '@/lib/central-command/prompts';

// ... existing code ...

// First pass extraction (existing, around line 54-59)
const { object: firstPassExtraction } = await generateObject({
  model: openai('gpt-4o'),
  schema: pipelineExtractionSchema,
  system: PIPELINE_EXTRACTION_SYSTEM_PROMPT,
  prompt: userPrompt,
});

// Second pass: Gap analysis
let finalExtraction = firstPassExtraction;
try {
  const { object: secondPassExtraction } = await generateObject({
    model: openai('gpt-4o'),
    schema: pipelineExtractionSchema,
    system: PIPELINE_EXTRACTION_SYSTEM_PROMPT,
    prompt: `${EXTRACTION_GAP_ANALYSIS_PROMPT}

ORIGINAL SOURCE TEXT:
${inputText}

FIRST PASS EXTRACTION:
${JSON.stringify(firstPassExtraction, null, 2)}

Return the complete, final extraction.`,
  });
  finalExtraction = secondPassExtraction;

  // Log improvement metrics
  console.log(`[central-command/extract] First pass: ${firstPassExtraction.recommendations.length} recommendations`);
  console.log(`[central-command/extract] Second pass: ${finalExtraction.recommendations.length} recommendations`);
} catch (error) {
  console.warn('[central-command/extract] Gap analysis failed, using first-pass results:', error);
  // Graceful degradation: use first pass if second fails
}

return NextResponse.json(finalExtraction, {
  headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
});
```

## Testing Approach

### Manual Testing
1. Paste a complex meeting transcript with multiple topics
2. Compare extraction quality with/without second pass (can comment out second pass temporarily)
3. Verify scores have better evidence after second pass
4. Check that operational extractions are more complete

### Key Scenarios
- Long transcript with buried details → second pass should catch them
- Contradictory statements → second pass should resolve
- Implicit budget/timeline signals → second pass should surface

## Open Questions

1. **Model choice for second pass**: Use `gpt-4o` (same as first) or `gpt-4o-mini` (cheaper)?
   - **Recommendation**: Start with `gpt-4o` for quality, optimize later if cost is concern

2. **Latency impact**: Second pass adds ~3-5 seconds. Is this acceptable?
   - **Recommendation**: Yes, quality is more important for prospect extraction

---

## Future Improvements

*Everything below is OUT OF SCOPE for initial implementation.*

### Configuration & Control
- Toggle to enable/disable second pass (for development speed)
- Selective triggering based on input length (skip for short inputs < 500 chars)
- Model selection per pass (gpt-4o for pass 1, gpt-4o-mini for pass 2)

### Observability & Metrics
- Track how often second pass changes results
- Measure confidence score improvements
- Log which audit scenarios trigger most often
- A/B testing infrastructure to compare quality

### Performance Optimization
- Parallel processing for very long content
- Caching first-pass results
- Async background processing option

### Advanced Quality
- Third pass for high-value prospects
- Domain-specific prompts (different industries)
- User feedback loop to improve prompts

---

## References

- [Second-Pass Gap Analysis Framework](/docs/reference/second-pass-gap-analysis-framework.md)
- [Clarity Canvas extraction implementation](/app/api/clarity-canvas/extract/route.ts)
- [Current extraction prompt](/lib/central-command/prompts.ts)
- [Extract route](/app/api/central-command/extract/route.ts)

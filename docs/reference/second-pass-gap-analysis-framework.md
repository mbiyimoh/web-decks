# Second-Pass Gap Analysis Framework

A reusable pattern for improving LLM text-to-structured-output extraction quality through critical self-auditing.

## Overview

When extracting structured data from unstructured text using LLMs, a single pass often misses information, creates shallow summaries, or assigns content to wrong categories. This framework adds a second LLM call that critically audits the first-pass output against the original source material.

**Key Insight**: The second pass isn't about "finding more stuff" — it's about quality auditing the entire first-pass output, including corrections, consolidations, and confidence adjustments.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTRACTION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │ Raw Text     │                                              │
│   │ (transcript, │                                              │
│   │  document)   │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────────────────────────────────────┐          │
│   │            FIRST PASS (Extraction)               │          │
│   │  - Domain-specific extraction prompt             │          │
│   │  - Structured output schema                      │          │
│   │  - Over-extraction preferred                     │          │
│   └──────────────────────┬───────────────────────────┘          │
│                          │                                      │
│                          ▼                                      │
│   ┌──────────────────────────────────────────────────┐          │
│   │           SECOND PASS (Gap Analysis)             │          │
│   │  Inputs:                                         │          │
│   │    - Original raw text                           │          │
│   │    - First-pass extraction results               │          │
│   │  Outputs:                                        │          │
│   │    - Complete, final structured output           │          │
│   │    (same schema as first pass)                   │          │
│   └──────────────────────┬───────────────────────────┘          │
│                          │                                      │
│                          ▼                                      │
│   ┌──────────────────────────────────────────────────┐          │
│   │              VALIDATION & OUTPUT                 │          │
│   │  - Schema validation                             │          │
│   │  - Fuzzy key matching (if applicable)            │          │
│   │  - Return to frontend                            │          │
│   └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## The Six Audit Scenarios

The gap analysis prompt instructs the LLM to review for these specific quality issues:

### 1. MISSED ENTIRELY
Information exists in the source but has no corresponding output item.

**Symptoms:**
- Facts, numbers, timeframes mentioned in passing
- Secondary points that seemed minor but are relevant
- Implicit knowledge the speaker assumes you understand

**Action:** Create new item

### 2. UNDER-EXTRACTED
An item exists but fails to capture the full richness of the source.

**Symptoms:**
- Important qualifiers or context dropped
- Summary is accurate but shallow
- Nuance that would help the user was lost

**Action:** Create replacement item with same key, richer content

### 3. MIS-CATEGORIZED
Information was captured but assigned to the wrong field/category.

**Symptoms:**
- Content would be more valuable in a different field
- The key/category doesn't match where this insight belongs

**Action:** Create corrected item with proper categorization

### 4. OVER-CONFIDENT
An item states something with higher confidence than the source warrants.

**Symptoms:**
- Inference presented as fact
- Confidence score doesn't match certainty in source material

**Action:** Create replacement item with adjusted confidence and language

### 5. FRAGMENTED
Related information was split across multiple items when it should be unified.

**Symptoms:**
- A cohesive point became disjointed across items
- Context from one part illuminates another

**Action:** Create consolidated item that synthesizes the fragments

### 6. CONTRADICTED
Later statements qualify or conflict with earlier ones.

**Symptoms:**
- Later statements walk back earlier claims
- Conditions or exceptions weren't captured

**Action:** Create replacement item reflecting the full, accurate picture

## Implementation Pattern

### 1. Define Your Schema

Use the same Zod schema for both passes. The second pass outputs the complete final set, not a diff.

```typescript
// Example: Generic extraction schema
const extractionSchema = z.object({
  items: z.array(z.object({
    content: z.string(),
    category: z.string(),
    summary: z.string().max(150),
    confidence: z.number().min(0).max(1),
  })),
  themes: z.array(z.string()),
  followUps: z.array(z.string()),
});
```

### 2. Create the Gap Analysis Prompt

Adapt this template for your domain:

```typescript
export const GAP_ANALYSIS_PROMPT = `You have completed a first-pass extraction. Now perform a critical second-pass review with fresh eyes.

Your role is now that of a QUALITY AUDITOR — not just looking for missed information, but evaluating whether the first pass truly captured the meaning, nuance, and strategic value of the source material.

REVIEW FOR THESE SCENARIOS:

1. **MISSED ENTIRELY** → Action: Create new item
2. **UNDER-EXTRACTED** → Action: Replace with richer version
3. **MIS-CATEGORIZED** → Action: Create with correct category
4. **OVER-CONFIDENT** → Action: Adjust confidence and language
5. **FRAGMENTED** → Action: Consolidate related items
6. **CONTRADICTED** → Action: Reflect full, accurate picture

YOUR OUTPUT:

Return the COMPLETE, FINAL set of items that should be shown to the user:

1. **KEEP** first-pass items that are accurate and complete
2. **REPLACE** items that need correction (include only improved version)
3. **ADD** new items for missed information
4. **OMIT** duplicative or consolidated items

Do NOT return "findings" or "observations." Return actual structured items in the same schema.

Prioritize changes that materially affect understanding. Minor refinements matter less than strategic corrections.`;
```

### 3. Chain the LLM Calls

```typescript
// First pass
const { object: firstPass } = await generateObject({
  model: openai('gpt-4o'),
  schema: extractionSchema,
  system: EXTRACTION_SYSTEM_PROMPT,
  prompt: `${EXTRACTION_PROMPT}\n\nSOURCE:\n${sourceText}`,
});

// Second pass: Gap analysis
const { object: finalOutput } = await generateObject({
  model: openai('gpt-4o'),
  schema: extractionSchema, // Same schema
  system: EXTRACTION_SYSTEM_PROMPT,
  prompt: `${GAP_ANALYSIS_PROMPT}

ORIGINAL SOURCE:
${sourceText}

FIRST PASS EXTRACTION:
${JSON.stringify(firstPass, null, 2)}

Return the complete, final set of items.`,
});

// Use finalOutput for validation and response
```

## Trade-offs

| Consideration | Impact |
|---------------|--------|
| **Latency** | Adds ~3-5 seconds for second LLM call |
| **Cost** | ~2x API cost per extraction |
| **Quality** | Typically catches 10-20% additional/improved items |
| **Complexity** | Minimal — same schema, additive code path |

## When to Use This Pattern

**Good candidates:**
- Long-form content (transcripts, documents, interviews)
- High-stakes extraction where quality matters more than speed
- Domains with many possible categories (easy to mis-assign)
- Content where later statements often qualify earlier ones

**Skip the second pass when:**
- Latency is critical (real-time applications)
- Source text is short and simple
- Cost sensitivity outweighs quality needs
- First-pass accuracy is already sufficient for use case

## Observability

Add logging to track the framework's effectiveness:

```typescript
console.log(`[extract] First pass: ${firstPass.items.length} items`);
console.log(`[extract] Second pass: ${finalOutput.items.length} items`);

if (finalOutput.items.length !== firstPass.items.length) {
  console.log(`[extract] Gap analysis adjusted by ${finalOutput.items.length - firstPass.items.length} items`);
}
```

Over time, this data reveals:
- How often the second pass changes results
- Whether certain source types benefit more from gap analysis
- If prompt tuning is improving first-pass quality

## Graceful Degradation

If the second LLM call fails, fall back to first-pass results:

```typescript
let finalOutput;
try {
  const { object } = await generateObject({ /* second pass */ });
  finalOutput = object;
} catch (error) {
  console.warn('[extract] Gap analysis failed, using first-pass results');
  finalOutput = firstPass;
}
```

This ensures the user always gets usable output even if the audit step fails.

## Current Implementation

In Clarity Canvas, this pattern is implemented in:

| File | Purpose |
|------|---------|
| `lib/clarity-canvas/prompts.ts` | Contains `GAP_ANALYSIS_PROMPT` |
| `app/api/clarity-canvas/extract/route.ts` | Chains both LLM calls |

The frontend receives the same `ExtractOnlyResponse` shape regardless of whether one or two passes occurred — the framework is transparent to consumers.

## Future Enhancements

Ideas documented but not yet implemented:

- **Configurable passes**: Toggle second pass on/off for development speed
- **Selective triggering**: Only run gap analysis for transcripts above N characters
- **Quality metrics**: Track how often second pass changes results
- **A/B testing**: Compare single vs two-pass quality with real users
- **Parallel processing**: For very long content, split and process in parallel

---

*Last Updated: February 2026*

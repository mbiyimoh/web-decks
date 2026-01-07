# OpenAI Structured Outputs: Gotchas & Best Practices

## Overview

This guide documents critical constraints when using OpenAI's `zodResponseFormat` for structured outputs, based on real debugging of the Persona Sharpener brain dump extraction.

**When this applies:** Any time you use `zodResponseFormat()` with OpenAI's Chat Completions API to get structured JSON responses.

---

## Critical Gotchas

### 1. `.optional()` Requires `.nullable()`

**The Problem:**
```typescript
// ❌ FAILS - OpenAI doesn't support .optional() alone
export const schema = z.object({
  demographics: extractedDemographicsSchema.optional()
});
```

**Error Message:**
```
BadRequestError: 400 Invalid schema for response_format 'persona_extraction':
In context=('properties', 'personas', 'items', 'properties', 'demographics'),
'.optional()' without '.nullable()' is not supported by the API.
```

**The Fix:**
```typescript
// ✅ WORKS - Use .nullable() for OpenAI structured outputs
export const schema = z.object({
  demographics: extractedDemographicsSchema
    .nullable()
    .describe('Demographic information if mentioned, or null if not')
});
```

**Why:**
- OpenAI's structured outputs require **all fields to be required**
- Optional fields must be explicitly nullable: `field: Type | null`
- Cannot use Zod's `.optional()` which makes fields `Type | undefined`

**Reference:**
- OpenAI Docs: https://platform.openai.com/docs/guides/structured-outputs
- See: `lib/clarity-canvas/modules/persona-sharpener/brain-dump-schema.ts`

---

### 2. `z.record()` Not Supported (Dynamic Keys)

**The Problem:**
```typescript
// ❌ FAILS - propertyNames not permitted
export const schema = z.object({
  fieldConfidence: z.record(z.string(), z.number())
});
```

**Error Message:**
```
BadRequestError: 400 Invalid schema for response_format 'persona_extraction':
In context=('properties', 'fieldConfidence'), 'propertyNames' is not permitted.
```

**The Fix:**
```typescript
// ✅ WORKS - Use explicit field names
export const fieldConfidenceSchema = z.object({
  demographicsAgeRange: z.number().min(0).max(1).nullable(),
  demographicsLifestyle: z.number().min(0).max(1).nullable(),
  jobsFunctional: z.number().min(0).max(1).nullable(),
  // ... all explicit fields
});

export const schema = z.object({
  fieldConfidence: fieldConfidenceSchema.nullable()
});
```

**Why:**
- OpenAI's JSON Schema doesn't support `additionalProperties` or `propertyNames`
- Cannot have objects with arbitrary/dynamic keys
- Must define all possible field names upfront

**Workarounds:**
1. Define explicit fields (recommended for known structure)
2. Use an array of `{key: string, value: T}` objects
3. Use a string field with JSON.stringify/parse (not type-safe)

---

## Comparison: OpenAI vs Vercel AI SDK

**Important:** Different AI SDKs have different Zod requirements.

### OpenAI SDK (`zodResponseFormat`)

```typescript
import { zodResponseFormat } from 'openai/helpers/zod';

const schema = z.object({
  name: z.string(),
  age: z.number().nullable(),  // ← Must use .nullable()
  metadata: z.object({           // ← No z.record() allowed
    key1: z.string().nullable(),
    key2: z.string().nullable()
  }).nullable()
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  response_format: zodResponseFormat(schema, 'my_schema')
});
```

### Vercel AI SDK (`generateObject`)

```typescript
import { generateObject } from 'ai';

const schema = z.object({
  name: z.string(),
  age: z.number().optional(),     // ← .optional() works fine
  metadata: z.record(z.string())  // ← z.record() works fine
});

const { object } = await generateObject({
  model: openai('gpt-4o-mini'),
  schema,
  prompt: '...'
});
```

**Key Difference:**
- Vercel AI SDK translates Zod schemas more permissively
- OpenAI SDK enforces stricter JSON Schema compliance
- Always check which SDK you're using before writing schemas

**Example in this codebase:**
- `app/api/clarity-canvas/extract/route.ts` uses Vercel AI SDK (uses `.optional()`)
- `app/api/clarity-canvas/modules/persona-sharpener/brain-dump/route.ts` uses OpenAI SDK (uses `.nullable()`)

---

## Best Practices

### 1. Add Schema Documentation

```typescript
// =============================================================================
// PERSONA EXTRACTION SCHEMAS
// =============================================================================
//
// NOTE: These schemas use .nullable() because they're used with OpenAI's
// zodResponseFormat which requires all fields to be required (not optional).
// See: https://platform.openai.com/docs/guides/structured-outputs
//
// This differs from extraction-schema.ts which uses .optional() because it
// uses Vercel AI SDK's generateObject() which supports optional fields.
// =============================================================================
```

### 2. Update Fallback Functions

When changing schemas from `.optional()` to `.nullable()`, update fallbacks:

```typescript
// ❌ OLD - returns undefined
function createFallback() {
  return {
    demographics: undefined  // Won't match .nullable() type
  };
}

// ✅ NEW - returns null
function createFallback() {
  return {
    demographics: null  // Matches .nullable() type
  };
}
```

### 3. Update TypeScript Operators

```typescript
// ❌ OLD - checking undefined
if (data.demographics) { ... }

// ✅ NEW - explicit null check (works for both)
if (data.demographics !== null) { ... }

// ✅ BEST - nullish coalescing
const age = data.demographics?.ageRange ?? 'Unknown';
```

### 4. Test Schema Validity Early

```typescript
// Add a quick test to catch schema issues before deployment
import { zodResponseFormat } from 'openai/helpers/zod';

try {
  zodResponseFormat(mySchema, 'test');
  console.log('✅ Schema is compatible with OpenAI');
} catch (error) {
  console.error('❌ Schema validation failed:', error);
}
```

---

## Debugging Checklist

When you get OpenAI schema errors:

- [ ] Check all optional fields use `.nullable()` not `.optional()`
- [ ] Search for `z.record()` and replace with explicit object schemas
- [ ] Update fallback functions to return `null` instead of `undefined`
- [ ] Check for `??` operators that expect `null` not `undefined`
- [ ] Verify prompt instructions match the new field structure
- [ ] Test with a simple payload before complex multi-object responses

---

## Files Modified for Persona Sharpener Fix

**Issue:** Brain dump extraction was failing and falling back to generic persona

**Root Causes:**
1. Schemas used `.optional()` instead of `.nullable()`
2. `fieldConfidence` used `z.record()` which OpenAI doesn't support

**Files Fixed:**
1. `lib/clarity-canvas/modules/persona-sharpener/brain-dump-schema.ts`
   - Changed all `.optional()` to `.nullable()`
   - Replaced `z.record()` with explicit `fieldConfidenceSchema`

2. `lib/clarity-canvas/modules/persona-sharpener/customized-question-schema.ts`
   - Changed `options` field from `.optional()` to `.nullable()`

3. `app/api/clarity-canvas/modules/persona-sharpener/brain-dump/route.ts`
   - Updated `createFallbackExtraction()` to use `null` values
   - Updated `createFallbackQuestions()` to use `?? null` pattern

4. `lib/clarity-canvas/modules/persona-sharpener/prompts/extraction.ts`
   - Updated field confidence documentation with new camelCase field names

**Verification:**
```bash
npx tsc --noEmit  # Should pass with exit code 0
```

---

## Additional Resources

- [OpenAI Structured Outputs Guide](https://platform.openai.com/docs/guides/structured-outputs)
- [Zod Documentation](https://zod.dev/)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)

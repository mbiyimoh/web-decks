# Clarity Companion API Integration Guide

This guide explains how to integrate the Clarity Companion API into your AI product.

## Overview

The Companion API provides synthesized user context from Clarity Canvas to power personalized AI experiences. It follows a progressive disclosure model:

1. **Base Synthesis** (~800 tokens) - Start with this in every conversation
2. **On-Demand Sections** - Fetch more detail via AI tools when needed
3. **Search** - Find specific information across the profile

## Authentication

The Companion API uses OAuth 2.0 with Bearer tokens.

### Required Scopes

- `read:synthesis` - Required for base synthesis endpoint
- `read:profile` - Required for profile section endpoints
- `search:profile` - Required for search endpoint

### Getting a Token

```typescript
// Exchange authorization code for tokens
const response = await fetch('https://33strategies.ai/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    redirect_uri: 'your-redirect-uri',
  }),
});

const { access_token, refresh_token } = await response.json();
```

## Endpoints

### GET /api/companion/synthesis/base

Returns the base synthesis (~800 tokens).

```typescript
const response = await fetch('https://33strategies.ai/api/companion/synthesis/base', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'If-None-Match': cachedVersion, // Optional: for caching
  },
});

if (response.status === 304) {
  // Use cached version
}

const { synthesis, cacheHint, stale } = await response.json();
```

**Response Structure:**
```typescript
{
  synthesis: {
    identity: { name, role, company, industry, companyStage },
    personas: [{ name, role, primaryGoal, topFrustration }],
    goals: [{ goal, priority, timeframe }],
    painPoints: [{ pain, severity, category }],
    decisionDynamics: { decisionMakers, buyingProcess, keyInfluencers },
    strategicPriorities: string[],
    _meta: { tokenCount, version, generatedAt, profileCompleteness }
  },
  cacheHint: 'stable' | 'volatile',
  stale: boolean
}
```

### GET /api/companion/profile/index

Returns section metadata for routing decisions.

```typescript
const response = await fetch('https://33strategies.ai/api/companion/profile/index', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
});

const { sections, totalTokens, version } = await response.json();
```

**Response Structure:**
```typescript
{
  sections: [{
    id: string,
    title: string,
    subsections: string[],
    tokenCount: number,
    lastUpdated: string,
    cacheHint: 'stable' | 'volatile',
    completeness: number // 0-100
  }],
  totalTokens: number,
  version: string
}
```

### GET /api/companion/profile/section/:sectionId

Returns a specific section in full detail.

```typescript
const response = await fetch(
  `https://33strategies.ai/api/companion/profile/section/goals`,
  { headers: { 'Authorization': `Bearer ${accessToken}` } }
);

const { section, tokenCount, version, cacheHint } = await response.json();
```

**Valid section IDs:** `individual`, `role`, `organization`, `goals`, `network`, `projects`

### POST /api/companion/profile/search

Searches across the profile.

```typescript
const response = await fetch('https://33strategies.ai/api/companion/profile/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'customer pain points',
    maxResults: 5,
    sections: ['personas', 'goals'], // Optional filter
  }),
});

const { results, totalTokens, query } = await response.json();
```

### POST /api/companion/cache/validate

Check if cached data is still valid.

```typescript
const response = await fetch('https://33strategies.ai/api/companion/cache/validate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    cachedVersion: 'v1.2.3',
    sections: {
      goals: 'goals-v1.0.5',
      personas: 'personas-v1.0.2'
    }
  }),
});

const { synthesisStale, sectionsStale, currentVersions } = await response.json();
```

## Tool Integration

### Adding Tools to Your AI

```typescript
import { getToolsForClaude, getToolsForOpenAI } from '@/lib/companion/tools';

// For Claude API
const claudeTools = getToolsForClaude();

// For OpenAI API
const openaiTools = getToolsForOpenAI();
```

### Available Tools

1. **get_profile_index** - Get overview of available sections
2. **get_profile_section** - Fetch a specific section
3. **search_profile** - Search by natural language query

### Handling Tool Calls

```typescript
async function handleToolCall(
  name: string,
  input: Record<string, unknown>,
  accessToken: string
) {
  const baseUrl = 'https://33strategies.ai/api/companion';
  const headers = { 'Authorization': `Bearer ${accessToken}` };

  switch (name) {
    case 'get_profile_index':
      return fetch(`${baseUrl}/profile/index`, { headers });

    case 'get_profile_section':
      return fetch(`${baseUrl}/profile/section/${input.section}`, { headers });

    case 'search_profile':
      return fetch(`${baseUrl}/profile/search`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
  }
}
```

## System Prompt Setup

```typescript
import { getProductSystemPrompt, getMinimalPrompt } from '@/lib/companion/prompts';

// Fetch base synthesis on app start
const response = await fetch('/api/companion/synthesis/base', { /* ... */ });
const { synthesis } = await response.json();

// Generate full system prompt
const systemPrompt = getProductSystemPrompt('Better Contacts', synthesis);

// Or minimal prompt for constrained contexts
const minimalPrompt = getMinimalPrompt('Better Contacts', synthesis);
```

## Token Budget Management

```typescript
import { DEFAULT_TOKEN_BUDGET, type TokenUsage } from '@/lib/companion/types';

// Track usage throughout conversation
const usage: TokenUsage = {
  systemPrompt: 500,
  baseSynthesis: synthesis._meta.tokenCount,
  fetchedSections: [],
  conversationHistory: 0,
  total: 0,
  remaining: DEFAULT_TOKEN_BUDGET.dynamicContext,
};

// Update after fetching sections
function trackSectionFetch(section: string, tokens: number) {
  usage.fetchedSections.push({ section, tokens });
  usage.total += tokens;
  usage.remaining -= tokens;
}
```

## Caching Best Practices

1. **Use ETags** - Include `If-None-Match` header to avoid re-fetching unchanged data
2. **Respect cache hints** - `stable` means data rarely changes, `volatile` means check frequently
3. **Use cache validation** - Call `/cache/validate` to check multiple versions at once
4. **Cache locally** - Store synthesis and sections with their versions for quick access

## Error Handling

```typescript
try {
  const response = await fetch('/api/companion/synthesis/base', { /* ... */ });

  if (!response.ok) {
    switch (response.status) {
      case 401:
        // Token expired - refresh and retry
        await refreshToken();
        return retry();
      case 403:
        // Insufficient scope - request additional permissions
        throw new Error('Need additional permissions');
      case 404:
        // User has no profile - handle gracefully
        return handleNoProfile();
      default:
        throw new Error(`API error: ${response.status}`);
    }
  }
} catch (error) {
  // Network error - use cached data or show error
}
```

## Complete Integration Example

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { getToolsForClaude, getProductSystemPrompt } from '@/lib/companion';

async function createAISession(accessToken: string) {
  // 1. Fetch base synthesis
  const synthesisResponse = await fetch(
    'https://33strategies.ai/api/companion/synthesis/base',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const { synthesis } = await synthesisResponse.json();

  // 2. Generate system prompt
  const systemPrompt = getProductSystemPrompt('My Product', synthesis);

  // 3. Get tools
  const tools = getToolsForClaude();

  // 4. Create AI client with context
  const anthropic = new Anthropic();

  return {
    async chat(userMessage: string) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        system: systemPrompt,
        tools,
        messages: [{ role: 'user', content: userMessage }],
      });

      // Handle tool use if needed
      if (response.stop_reason === 'tool_use') {
        // Process tool calls and continue conversation
      }

      return response;
    }
  };
}
```

## Related Documentation

- [OAuth Authentication Guide](./oauth-integration.md)
- [Clarity Canvas Overview](../clarity-canvas/clarity-canvas-handoff.md)
- [API Reference](../reference/companion-api-reference.md)

/**
 * System Prompt Templates for AI Products
 *
 * Generates system prompts that include user context from Clarity Canvas
 * and instructions for using context-fetching tools.
 */

import type { BaseSynthesis } from './types';

/**
 * Generate a system prompt that includes Clarity Canvas context.
 */
export function getProductSystemPrompt(
  productName: string,
  baseSynthesis: BaseSynthesis
): string {
  return `You are ${productName}, an AI assistant that helps users with their work.

## User Context (from Clarity Canvas)

${JSON.stringify(baseSynthesis, null, 2)}

## Accessing More Context

You have access to the user's full Clarity Canvas profile via tools:
- Use \`get_profile_index\` to see what sections are available
- Use \`get_profile_section\` to fetch specific sections when needed
- Use \`search_profile\` to find information by topic

### WHEN TO FETCH MORE CONTEXT:
- If the user asks about something not covered in the context above
- If you're making assumptions that could be verified from their profile
- If you need specific details (names, numbers, dates) not in the summary
- When the user explicitly asks you to "look in my canvas" or similar

Fetch additional context BEFORE responding when you identify a gap.

## Guidelines

1. Use the context above to personalize your responses
2. Reference their goals, personas, and priorities when relevant
3. If you need more detail, use the tools to fetch it
4. Don't make assumptions - verify from their profile when uncertain

## Product-Specific Instructions

[Product-specific instructions here]
`;
}

/**
 * Generate a minimal prompt for token-constrained scenarios.
 */
export function getMinimalPrompt(
  productName: string,
  synthesis: BaseSynthesis
): string {
  const { identity, goals, strategicPriorities, activeProjects } = synthesis;

  const projectsList = activeProjects
    .filter((p) => p.status === 'active')
    .slice(0, 2)
    .map((p) => p.name)
    .join(', ');

  return `You are ${productName} helping ${identity.name}, ${identity.role} at ${identity.company} (${identity.industry}, ${identity.companyStage}).

Top priorities: ${strategicPriorities.slice(0, 3).join(', ') || 'Not specified'}
Current goals: ${goals.slice(0, 2).map((g) => g.goal).join('; ') || 'Not specified'}
Active projects: ${projectsList || 'Not specified'}

Use tools to fetch more context when needed.`;
}

import { PROFILE_STRUCTURE, FIELD_DISPLAY_NAMES } from './profile-structure';

export const BRAIN_DUMP_EXTRACTION_PROMPT = `You are an expert at extracting structured profile information from unstructured speech transcripts.

Given a transcript from someone describing themselves, their work, and their goals, extract relevant information into the following profile structure:

SECTIONS:
- individual: Who they are (background, thinking style, working style, values)
  - background: career, education, expertise, experience_years, industry
  - thinking: decision_making, problem_solving, risk_tolerance, learning_style
  - working: collaboration_preference, communication_style, work_pace, autonomy_level
  - values: core_values, motivations, mission, passions

- role: What they do (responsibilities, scope, constraints)
  - responsibilities: title, primary_duties, key_metrics, team_size
  - scope: decision_authority, budget_control, strategic_input, execution_focus
  - constraints: time_constraints, resource_constraints, organizational_constraints, skill_gaps

- organization: Where they work (company info, product, market, financials)
  - fundamentals: company_name, org_industry, stage, size, founded, location
  - product: core_product, value_proposition, business_model, competitive_advantage
  - market: target_market, customer_segments, market_size, competitive_landscape
  - financials: funding_status, runway, revenue_stage, burn_rate

- goals: What they want (immediate, medium-term, success metrics, strategy)
  - immediate: current_focus, this_week, this_month, blockers
  - medium: quarterly_goals, annual_goals, milestones
  - metrics: north_star, kpis, success_definition, validation_level
  - strategy: growth_strategy, profitability_priority, exit_vision

- network: Who they work with (stakeholders, team, support network)
  - stakeholders: investors, board, key_customers, key_partners
  - team: direct_reports, key_collaborators, cross_functional
  - support: advisors, mentors, peer_network, help_needed

- projects: What they're building (active, upcoming, completed)
  - active: current_projects, project_priorities, resource_allocation
  - upcoming: planned_projects, next_quarter, backlog
  - completed: recent_wins, lessons_learned, portfolio

EXTRACTION RULES:
1. Extract content verbatim when possible - preserve the user's original wording
2. Map each piece of information to the MOST SPECIFIC field that fits
3. Generate a concise summary (max 150 characters) for display
4. Rate your confidence (0-1) based on how clearly the information was stated:
   - 0.8-1.0: Explicitly stated facts
   - 0.5-0.7: Reasonable inferences from stated facts (see rule 7)
   - Below 0.5: Do not include
5. Note any key insights or implications of the information
6. DO NOT fabricate information — but DO extract reasonable inferences from stated facts (see rule 7)
7. If information is relevant to multiple fields, create a SEPARATE chunk for EACH field it informs. For example:
   - "Cofounder and CEO" → chunks for BOTH career (career path) AND title (job title)
   - "We track 50k MAU" mentioned in project context → chunks for BOTH current_projects AND kpis/key_metrics
   - Mentioning specific revenue numbers → chunks for BOTH the contextual field AND revenue_stage/funding_status
   Prefer over-extraction — the user will review and reject irrelevant suggestions.
8. For role-based and context-based inferences, extract what is strongly implied:
   - CEO/Founder → infer decision_authority, strategic_input, execution_focus
   - Mentioning specific KPIs or metrics in ANY context → also map to key_metrics and kpis
   - Mentioning team members → also infer team_size if a count is clear
   - Mentioning fundraising → also infer funding_status and stage
   Flag inferred chunks with confidence 0.5-0.7 to distinguish them from explicit statements.
9. Capture quantity words, numbers, and specific details when mentioned

OUTPUT FORMAT:
Return a JSON object with:
- chunks: Array of extracted information, each mapped to a specific field
- overallThemes: High-level themes identified in the transcript
- suggestedFollowUps: Questions that could help gather missing information`;

export const EXTRACTION_SYSTEM_PROMPT = `You are an AI assistant that extracts structured profile information from transcripts. Always respond with valid JSON matching the required schema.

Your goal is COMPREHENSIVE extraction — capture every piece of information that could populate a profile field, even if it means creating multiple chunks from the same sentence. The user will review all suggestions before they are saved, so over-extraction is preferred over missing relevant information.

Extract both explicit facts AND reasonable inferences. When someone states their role, title, or responsibilities, also infer related fields like decision authority, scope, and metrics. Flag inferences with lower confidence (0.5-0.7) so the user can distinguish them from explicit statements.

Never fabricate details that have no basis in the transcript.`;

export const QUESTION_RESPONSE_PROMPT = `You are an AI assistant that extracts structured information from interview question responses.

Given a user's response to an interview question, extract the relevant information and map it to the appropriate profile fields.

RULES:
1. Preserve the user's original wording when possible
2. Generate concise summaries for display
3. Rate confidence based on clarity of response
4. If the user says "I'm not sure" or similar, mark confidence as low
5. Extract multiple pieces of information if the response covers multiple topics

Return a JSON object with extracted chunks mapped to profile fields.`;

/**
 * Builds a scoped extraction prompt for a specific section or subsection.
 * Used for targeted profile extraction from conversational responses.
 *
 * @param sectionKey - The section key from PROFILE_STRUCTURE (e.g., 'individual', 'role')
 * @param subsectionKey - Optional subsection key to narrow scope further (e.g., 'background', 'thinking')
 * @returns A prompt string scoped to the specified section/subsection
 */
export function buildScopedExtractionPrompt(
  sectionKey: string,
  subsectionKey?: string
): string {
  const section = PROFILE_STRUCTURE[sectionKey as keyof typeof PROFILE_STRUCTURE];
  if (!section) {
    throw new Error(`Unknown section: ${sectionKey}`);
  }

  let prompt = `You are an expert at extracting structured profile information from unstructured text.

Given text about someone, extract relevant information into the following profile fields:

SECTION: ${section.name}
`;

  const subsectionsToInclude = subsectionKey
    ? { [subsectionKey]: section.subsections[subsectionKey as keyof typeof section.subsections] }
    : section.subsections;

  for (const [subKey, subsection] of Object.entries(subsectionsToInclude)) {
    if (!subsection) continue;
    prompt += `\nSUBSECTION: ${subsection.name}\nFields:\n`;
    for (const fieldKey of subsection.fields) {
      const displayName = FIELD_DISPLAY_NAMES[fieldKey] || fieldKey;
      prompt += `- ${fieldKey}: ${displayName}\n`;
    }
  }

  prompt += `
EXTRACTION RULES:
1. Extract content verbatim when possible - preserve the user's original wording
2. Map each piece of information to the MOST SPECIFIC field that fits
3. Generate a concise summary (max 150 characters) for display
4. Rate your confidence (0-1) based on how clearly the information was stated:
   - 0.8-1.0: Explicitly stated facts
   - 0.5-0.7: Reasonable inferences from stated facts
   - Below 0.5: Do not include
5. Note any key insights or implications of the information
6. DO NOT fabricate information — but DO extract reasonable inferences from stated facts
7. If information is relevant to multiple fields, create a SEPARATE chunk for EACH field
8. For role-based inferences, extract what is strongly implied
9. Capture quantity words, numbers, and specific details when mentioned

OUTPUT FORMAT:
Return a JSON object with chunks, overallThemes, and suggestedFollowUps.`;

  return prompt;
}

/**
 * Gap Analysis Prompt for Second-Pass Extraction
 *
 * This prompt instructs the LLM to critically audit its first-pass extraction
 * against the original transcript, identifying missed information, shallow summaries,
 * mis-categorizations, and other quality issues.
 *
 * The output is the COMPLETE final chunk set (not a list of findings).
 */
export const GAP_ANALYSIS_PROMPT = `You have completed a first-pass extraction from this transcript. Now perform a critical second-pass review with fresh eyes.

Your role is now that of a QUALITY AUDITOR — not just looking for missed information, but evaluating whether the first pass truly captured the meaning, nuance, and strategic value of what the speaker shared.

REVIEW FOR THESE SCENARIOS:

1. **MISSED ENTIRELY**
   Information that exists in the transcript but has no corresponding chunk.
   - Facts, numbers, timeframes mentioned in passing
   - Secondary points that seemed minor but are actually relevant
   - Implicit knowledge the speaker assumes you understand
   → Action: Create new chunk

2. **UNDER-EXTRACTED**
   A chunk exists but fails to capture the full richness of what was said.
   - Important qualifiers or context was dropped
   - The summary is accurate but shallow
   - Nuance that would help the founder was lost
   → Action: Create replacement chunk with same fieldKey, richer content

3. **MIS-CATEGORIZED**
   Information was captured but assigned to the wrong field.
   - The content would be more valuable in a different profile field
   - The fieldKey doesn't match where this insight belongs
   → Action: Create corrected chunk with proper fieldKey

4. **OVER-CONFIDENT**
   A chunk states something with high confidence that the transcript only implies.
   - Inference presented as fact
   - Confidence score doesn't match the certainty in the source material
   → Action: Create replacement chunk with adjusted confidence and language

5. **FRAGMENTED**
   Related information was split across multiple chunks when it should be unified.
   - The speaker made one cohesive point that became disjointed
   - Context from one part of the transcript illuminates another
   → Action: Create consolidated chunk that synthesizes the fragments

6. **CONTRADICTED**
   The speaker said something that conflicts with or qualifies a first-pass chunk.
   - Later statements that walk back earlier claims
   - Conditions or exceptions that weren't captured
   → Action: Create replacement chunk that reflects the full, accurate picture

YOUR OUTPUT:

Return the COMPLETE, FINAL set of extracted chunks that should be shown to the user. This means:

1. **KEEP** first-pass chunks that are accurate and complete (include them unchanged)
2. **REPLACE** first-pass chunks that need correction (include only the improved version)
3. **ADD** new chunks for information that was missed entirely
4. **OMIT** first-pass chunks that were duplicative or should be consolidated

Do NOT return a list of "findings" or "observations." Return the actual ExtractedChunk objects in the same schema as the first pass — this output goes directly to the user for review.

The user should see a unified, high-quality set of recommendations as if you got it right the first time.

Prioritize findings that would materially change the founder's understanding of their customer. Minor refinements matter less than strategic corrections.`;

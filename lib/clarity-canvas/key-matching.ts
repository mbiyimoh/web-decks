import { PROFILE_STRUCTURE } from './profile-structure';

/**
 * Delimiter used to separate multiple context entries in fullContext field.
 * Used when appending new brain dump chunks to existing field context.
 */
export const CONTEXT_DELIMITER = '\n\n---\n\n';

/**
 * Build lookup maps for valid section/subsection/field keys
 * to enable fuzzy matching when the AI returns slightly wrong keys.
 */
export function buildKeyLookups() {
  const sectionKeys = new Set(Object.keys(PROFILE_STRUCTURE));
  const subsectionKeys = new Map<string, Set<string>>();
  const fieldKeys = new Map<string, Set<string>>();

  for (const [sectionKey, section] of Object.entries(PROFILE_STRUCTURE)) {
    const subsections = new Set(Object.keys(section.subsections));
    subsectionKeys.set(sectionKey, subsections);

    for (const [subsectionKey, subsection] of Object.entries(section.subsections)) {
      const compositeKey = `${sectionKey}.${subsectionKey}`;
      fieldKeys.set(compositeKey, new Set(subsection.fields as unknown as string[]));
    }
  }

  return { sectionKeys, subsectionKeys, fieldKeys };
}

/**
 * Find closest matching key from a set using simple heuristics:
 * - Exact match
 * - Case-insensitive match
 * - Underscore/hyphen normalization
 * - Contains match (for keys like "background_identity" → "background")
 */
export function fuzzyMatchKey(target: string, validKeys: Set<string>): string | null {
  // Exact match
  if (validKeys.has(target)) return target;

  const normalized = target.toLowerCase().replace(/-/g, '_');
  const keysArray = Array.from(validKeys);

  // Normalized exact match
  const normalizedMatch = keysArray.find((key) => key.toLowerCase().replace(/-/g, '_') === normalized);
  if (normalizedMatch) return normalizedMatch;

  // Contains match: target contains a valid key, or valid key contains target
  const containsMatch = keysArray.find((key) => normalized.includes(key) || key.includes(normalized));
  if (containsMatch) return containsMatch;

  return null;
}

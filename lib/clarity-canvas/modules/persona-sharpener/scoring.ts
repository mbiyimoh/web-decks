import type { PersonaClarity, PersonaDisplay, ResponseInput } from './types';
import { DEFAULT_ARCHETYPE } from './types';
import { getQuestionById } from './questions';

const categoryQuestionCounts: Record<string, number> = {
  identity: 4,
  goals: 3,
  frustrations: 3,
  emotional: 3,
  behaviors: 3,
};

export function calculateClarity(
  responses: Record<string, ResponseInput>
): PersonaClarity {
  const scores: PersonaClarity = {
    overall: 0,
    identity: 0,
    goals: 0,
    frustrations: 0,
    emotional: 0,
    behaviors: 0,
  };

  // Count answered (not unsure) questions per category
  Object.values(responses).forEach((response) => {
    if (!response.isUnsure && response.value !== undefined) {
      const question = getQuestionById(response.questionId);
      if (!question) return;

      const category = question.category;

      // Map social to emotional, antiPatterns excluded from scoring
      const scoreCategory = category === 'social' ? 'emotional' : category;

      // Only score valid clarity categories
      if (scoreCategory === 'antiPatterns') return;

      const validCategories = [
        'identity',
        'goals',
        'frustrations',
        'emotional',
        'behaviors',
      ] as const;

      if (
        validCategories.includes(
          scoreCategory as (typeof validCategories)[number]
        )
      ) {
        const count = categoryQuestionCounts[scoreCategory];
        if (count) {
          const key = scoreCategory as (typeof validCategories)[number];
          scores[key] += 100 / count;
        }
      }
    }
  });

  // Cap at 100
  (Object.keys(scores) as Array<keyof PersonaClarity>).forEach((key) => {
    if (key !== 'overall') {
      scores[key] = Math.min(100, Math.round(scores[key]));
    }
  });

  // Overall is average of 5 categories
  scores.overall = Math.round(
    (scores.identity +
      scores.goals +
      scores.frustrations +
      scores.emotional +
      scores.behaviors) /
      5
  );

  return scores;
}

export function calculateAvgConfidence(
  responses: Record<string, ResponseInput>
): number {
  const answeredResponses = Object.values(responses).filter(
    (r) => !r.isUnsure && r.value !== undefined
  );

  if (answeredResponses.length === 0) return 0;

  const totalConfidence = answeredResponses.reduce(
    (sum, r) => sum + r.confidence,
    0
  );

  return Math.round(totalConfidence / answeredResponses.length);
}

export function getUnsureCount(
  responses: Record<string, ResponseInput>
): number {
  return Object.values(responses).filter((r) => r.isUnsure).length;
}

const archetypes: Record<string, string> = {
  'in-control-busy-professional': 'The Efficient Optimizer',
  'in-control-balanced-seeker': 'The Calm Commander',
  'accomplished-busy-professional': 'The Driven Achiever',
  'accomplished-balanced-seeker': 'The Mindful Achiever',
  'cared-for-busy-professional': 'The Overwhelmed Overcomer',
  'cared-for-balanced-seeker': 'The Supported Striver',
  'free-busy-professional': 'The Escaping Executive',
  'free-balanced-seeker': 'The Peace Seeker',
};

export function generateArchetype(persona: PersonaDisplay): string {
  const emotionalJob = persona.jobs?.emotional || '';
  const lifestyle = persona.demographics?.lifestyle || '';
  const key = `${emotionalJob}-${lifestyle}`;
  return archetypes[key] || DEFAULT_ARCHETYPE;
}

/**
 * Resolve the display archetype for a persona.
 * Priority: extracted name → generated archetype → default
 */
export function resolveArchetype(
  extractedName: string | null,
  personaDisplay: PersonaDisplay
): string {
  // 1. Prefer brain dump extracted name (e.g., "The Busy Executive")
  if (extractedName) return extractedName;

  // 2. Fall back to generated archetype (only if valid)
  const generated = generateArchetype(personaDisplay);
  if (generated && generated !== DEFAULT_ARCHETYPE) return generated;

  // 3. Fall back to default
  return DEFAULT_ARCHETYPE;
}

export function generateSummary(persona: PersonaDisplay): string {
  const parts: string[] = [];

  if (persona.demographics?.ageRange) {
    const ageDesc: Record<string, string> = {
      younger: 'Young professional',
      middle: 'Mid-career professional',
      older: 'Experienced professional',
    };
    parts.push(ageDesc[persona.demographics.ageRange] || '');
  }

  if (persona.demographics?.lifestyle === 'busy-professional') {
    parts.push('juggling multiple priorities');
  } else if (persona.demographics?.lifestyle === 'balanced-seeker') {
    parts.push('seeking work-life harmony');
  }

  if (persona.jobs?.emotional) {
    const emotionalDesc: Record<string, string> = {
      'in-control': 'who wants to feel in control',
      accomplished: 'who craves accomplishment',
      'cared-for': 'who needs to feel supported',
      free: 'who yearns for freedom',
    };
    parts.push(emotionalDesc[persona.jobs.emotional] || '');
  }

  return parts.length > 0
    ? parts.join(' ') + '.'
    : 'Answer questions to build their profile.';
}

export function createEmptyPersonaDisplay(
  id: string,
  displayName?: string
): PersonaDisplay {
  return {
    id,
    name: displayName || null,
    archetype: displayName || 'Your Ideal Customer',
    summary: 'Answer questions to build their profile.',
    quote: null,
    demographics: {},
    jobs: {},
    goals: {},
    frustrations: {},
    behaviors: {},
    antiPatterns: [],
    clarity: {
      overall: 0,
      identity: 0,
      goals: 0,
      frustrations: 0,
      emotional: 0,
      behaviors: 0,
    },
    avgConfidence: 0,
    unsureCount: 0,
  };
}

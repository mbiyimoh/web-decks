import type { SectionWithSubsections, SubsectionWithFields, ProfileScores } from './types';

/**
 * Calculate score for a single field based on content presence and confidence
 * Score 0-100 where:
 * - 0: No content
 * - 25-50: Has summary but low confidence
 * - 50-75: Has summary with medium confidence
 * - 75-100: Has full context with high confidence
 */
export function calculateFieldScore(field: {
  summary: string | null;
  fullContext: string | null;
  confidence: number;
  sources?: { rawContent: string }[];
}): number {
  // No content = 0
  if (!field.summary && !field.fullContext) {
    return 0;
  }

  let baseScore = 0;

  // Has summary: base 40 points
  if (field.summary && field.summary.trim().length > 0) {
    baseScore = 40;
  }

  // Has full context: additional 30 points
  if (field.fullContext && field.fullContext.trim().length > 0) {
    baseScore += 30;
  }

  // Has multiple sources: additional 10 points
  if (field.sources && field.sources.length > 1) {
    baseScore += 10;
  }

  // Confidence multiplier (0.5 to 1.0)
  const confidenceMultiplier = 0.5 + field.confidence * 0.5;

  return Math.min(100, Math.round(baseScore * confidenceMultiplier));
}

/**
 * Calculate score for a subsection (average of field scores)
 */
export function calculateSubsectionScore(subsection: SubsectionWithFields): number {
  if (subsection.fields.length === 0) return 0;

  const totalScore = subsection.fields.reduce((sum, field) => {
    return sum + calculateFieldScore(field);
  }, 0);

  return Math.round(totalScore / subsection.fields.length);
}

/**
 * Calculate score for a section (weighted average of subsection scores)
 */
export function calculateSectionScore(section: SectionWithSubsections): number {
  if (section.subsections.length === 0) return 0;

  const totalScore = section.subsections.reduce((sum, subsection) => {
    return sum + calculateSubsectionScore(subsection);
  }, 0);

  return Math.round(totalScore / section.subsections.length);
}

/**
 * Calculate overall profile score (weighted average of section scores)
 */
export function calculateOverallScore(sections: SectionWithSubsections[]): number {
  if (sections.length === 0) return 0;

  const totalScore = sections.reduce((sum, section) => {
    return sum + calculateSectionScore(section);
  }, 0);

  return Math.round(totalScore / sections.length);
}

/**
 * Calculate all scores for a profile
 */
export function calculateAllScores(sections: SectionWithSubsections[]): ProfileScores {
  const sectionScores: Record<string, number> = {};

  for (const section of sections) {
    sectionScores[section.key] = calculateSectionScore(section);
  }

  return {
    overall: calculateOverallScore(sections),
    sections: sectionScores,
  };
}

/**
 * Get fields that need more information (score < 50)
 */
export function getWeakFields(sections: SectionWithSubsections[]): {
  sectionKey: string;
  sectionName: string;
  subsectionKey: string;
  subsectionName: string;
  fieldKey: string;
  fieldName: string;
  score: number;
}[] {
  const weakFields: ReturnType<typeof getWeakFields> = [];

  for (const section of sections) {
    for (const subsection of section.subsections) {
      for (const field of subsection.fields) {
        const score = calculateFieldScore(field);
        if (score < 50) {
          weakFields.push({
            sectionKey: section.key,
            sectionName: section.name,
            subsectionKey: subsection.key,
            subsectionName: subsection.name,
            fieldKey: field.key,
            fieldName: field.name,
            score,
          });
        }
      }
    }
  }

  // Sort by score ascending (weakest first)
  return weakFields.sort((a, b) => a.score - b.score);
}

/**
 * Calculate section completion percentage (fields with score >= 50)
 */
export function getSectionCompletion(section: SectionWithSubsections): {
  completed: number;
  total: number;
  percentage: number;
} {
  let completed = 0;
  let total = 0;

  for (const subsection of section.subsections) {
    for (const field of subsection.fields) {
      total++;
      if (calculateFieldScore(field) >= 50) {
        completed++;
      }
    }
  }

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/**
 * Calculate subsection field completion
 */
export function getSubsectionCompletion(subsection: SubsectionWithFields): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = subsection.fields.length;
  const completed = subsection.fields.filter(
    (f) => calculateFieldScore(f) >= 50
  ).length;

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

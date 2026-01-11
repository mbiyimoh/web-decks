/**
 * Confidence Thresholds Module
 *
 * Statistical confidence threshold system with progressive messaging for
 * persona validation response collection.
 *
 * Thresholds:
 * - 0 responses: No Data (0%)
 * - 1-2 responses: Early Signal (50%)
 * - 3-4 responses: Statistically Meaningful (90%)
 * - 5-11 responses: High Confidence (95%)
 * - 12+ responses: Very High Confidence (99%)
 */

export interface ConfidenceLevel {
  minResponses: number;
  confidencePercent: number;
  label: string;
  message: string;
  nextLevel: { responses: number; confidence: number } | null;
}

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  {
    minResponses: 0,
    confidencePercent: 0,
    label: 'No Data',
    message: 'Share your validation link to start collecting responses.',
    nextLevel: { responses: 3, confidence: 90 },
  },
  {
    minResponses: 1,
    confidencePercent: 50,
    label: 'Early Signal',
    message: 'You have initial feedback, but need more responses for reliable insights.',
    nextLevel: { responses: 3, confidence: 90 },
  },
  {
    minResponses: 3,
    confidencePercent: 90,
    label: 'Statistically Meaningful',
    message: 'You have enough responses for basic statistical significance (90% confidence).',
    nextLevel: { responses: 5, confidence: 95 },
  },
  {
    minResponses: 5,
    confidencePercent: 95,
    label: 'High Confidence',
    message: 'Strong sample size for reliable insights (95% confidence).',
    nextLevel: { responses: 12, confidence: 99 },
  },
  {
    minResponses: 12,
    confidencePercent: 99,
    label: 'Very High Confidence',
    message: 'Excellent sample size for highly reliable insights (99% confidence).',
    nextLevel: null,
  },
];

/**
 * Get the confidence level for a given response count.
 * Returns the highest confidence level that the response count qualifies for.
 *
 * @param responseCount - Number of validation responses collected
 * @returns Confidence level object with label, message, and next milestone
 *
 * @example
 * getConfidenceLevel(0)  // { label: 'No Data', confidencePercent: 0, ... }
 * getConfidenceLevel(1)  // { label: 'Early Signal', confidencePercent: 50, ... }
 * getConfidenceLevel(3)  // { label: 'Statistically Meaningful', confidencePercent: 90, ... }
 * getConfidenceLevel(5)  // { label: 'High Confidence', confidencePercent: 95, ... }
 * getConfidenceLevel(12) // { label: 'Very High Confidence', confidencePercent: 99, ... }
 */
export function getConfidenceLevel(responseCount: number): ConfidenceLevel {
  // Iterate from highest to lowest threshold
  for (let i = CONFIDENCE_LEVELS.length - 1; i >= 0; i--) {
    if (responseCount >= CONFIDENCE_LEVELS[i].minResponses) {
      return CONFIDENCE_LEVELS[i];
    }
  }
  // Fallback to first level (should never reach here if 0 is first level)
  return CONFIDENCE_LEVELS[0];
}

/**
 * Get the color for displaying confidence level indicators.
 * Uses 33 Strategies design tokens.
 *
 * @param confidencePercent - Confidence percentage (0-99)
 * @returns Hex color code
 *
 * @example
 * getConfidenceColor(99) // '#4ADE80' (green)
 * getConfidenceColor(90) // '#D4A84B' (gold)
 * getConfidenceColor(50) // '#FB923C' (orange)
 */
export function getConfidenceColor(confidencePercent: number): string {
  if (confidencePercent >= 95) return '#4ADE80'; // Green - High confidence
  if (confidencePercent >= 90) return '#D4A84B'; // Gold - Meaningful confidence
  return '#FB923C'; // Orange - Early signal
}

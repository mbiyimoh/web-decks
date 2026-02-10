import { InputType } from '@prisma/client';

/**
 * Generate a session title based on the recommendations
 */
export function generateSessionTitle(
  recommendations: { targetSection: string }[]
): string {
  const sections = Array.from(new Set(recommendations.map((r) => r.targetSection)));
  if (sections.length === 1) {
    return `${capitalize(sections[0])} context`;
  }
  return `Context for ${sections.length} pillars`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get human-readable label for input type
 */
export function getInputTypeLabel(type: InputType): string {
  const labels: Record<InputType, string> = {
    VOICE_TRANSCRIPT: 'Voice transcript',
    TEXT_INPUT: 'Text input',
    FILE_UPLOAD: 'File upload',
  };
  return labels[type];
}

/**
 * Map SourceType (VOICE/TEXT/FILE) to InputType
 */
export function mapSourceTypeToInputType(
  sourceType: 'VOICE' | 'TEXT' | 'FILE'
): InputType {
  switch (sourceType) {
    case 'VOICE':
      return 'VOICE_TRANSCRIPT';
    case 'FILE':
      return 'FILE_UPLOAD';
    default:
      return 'TEXT_INPUT';
  }
}

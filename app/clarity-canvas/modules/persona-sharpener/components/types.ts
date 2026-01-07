/**
 * Shared types for Persona Sharpener components
 */

/**
 * Minimal persona info used for switching/display in UI components
 */
export interface PersonaInfo {
  id: string;
  displayName: string;
  confidence: number;
  isComplete: boolean;
}

/**
 * Sibling persona info returned from session API for multi-persona navigation
 */
export interface SiblingPersona {
  id: string;
  name: string | null;
  sessionId: string | null;
  isComplete: boolean;
  isCurrent: boolean;
}

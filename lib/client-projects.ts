/**
 * Client Projects Registry
 *
 * Maps client IDs to their project content.
 * Project content lives in separate files for easy editing:
 *   lib/content/projects/[project-id].ts
 */

import { ProjectData } from '@/components/portal/types';

// Import project content files
import { plyaFitnessApp } from './content/projects/plya-fitness-app';

// ============================================================================
// CLIENT → PROJECT MAPPING
// ============================================================================
// Add new clients here and import their project content above.
// Set to null if client has no active project.

export const clientProjects: Record<string, ProjectData | null> = {
  plya: plyaFitnessApp,
  tradeblock: null,
  wsbc: null,
  'noggin-guru': null,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get project data for a client.
 * Returns null if client has no active project.
 */
export function getProjectForClient(clientId: string): ProjectData | null {
  return clientProjects[clientId.toLowerCase()] ?? null;
}

/**
 * Get full project data including timeline and deliverables.
 * Used for the full project page.
 */
export function getFullProjectData(clientId: string, projectId: string): ProjectData | null {
  const project = getProjectForClient(clientId);
  if (!project || project.id !== projectId) {
    return null;
  }
  return project;
}

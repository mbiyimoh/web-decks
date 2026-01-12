/**
 * Active Work Session Queries for Client Portal
 *
 * Queries in-progress Clarity Canvas sessions and established personas for portal users.
 */

import prisma from '@/lib/prisma';
import { ActiveWorkItem } from '@/components/portal/types';

// Total questions in persona sharpener (current configuration)
const TOTAL_PERSONA_SHARPENER_QUESTIONS = 15;

/**
 * Get active Clarity Canvas work items for a portal user.
 *
 * Currently supports:
 * - Persona Sharpener sessions (in_progress status)
 * - Established personas (link to persona management when no active sessions)
 *
 * @param userId - The User record ID (from unified session)
 * @returns Array of ActiveWorkItem for display in portal
 */
export async function getActiveWorkForUser(userId: string): Promise<ActiveWorkItem[]> {
  const items: ActiveWorkItem[] = [];

  // Query in-progress sharpener sessions for this user
  const sessions = await prisma.sharpenerSession.findMany({
    where: {
      status: 'in_progress',
      persona: {
        profile: {
          userRecordId: userId,
        },
      },
    },
    include: {
      persona: {
        select: {
          name: true,
          profile: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  // Add in-progress sessions
  sessions.forEach((session) => {
    const personaName = session.persona.name ?? 'Persona';
    const currentQuestion = (session.lastQuestionIndex ?? 0) + 1;

    items.push({
      id: session.id,
      module: 'Persona Sharpener',
      context: personaName,
      status: 'in-progress',
      progress: `Question ${currentQuestion} of ${TOTAL_PERSONA_SHARPENER_QUESTIONS}`,
      link: `/clarity-canvas/modules/persona-sharpener/${session.id}`,
    });
  });

  // If no in-progress sessions, check for established personas
  if (items.length === 0) {
    // Find personas for this user (with completed questionnaire sessions)
    const personas = await prisma.persona.findMany({
      where: {
        profile: {
          userRecordId: userId,
        },
        // Only include personas with at least one completed session
        sessions: {
          some: {
            status: 'completed',
          },
        },
      },
      include: {
        profile: {
          select: {
            id: true,
          },
        },
      },
    });

    // If user has established personas, show a link to manage them
    if (personas.length > 0) {
      const profileId = personas[0].profile.id;
      items.push({
        id: `personas-${profileId}`,
        module: 'Persona Sharpener',
        context: `${personas.length} persona${personas.length > 1 ? 's' : ''} defined`,
        status: 'available',
        progress: 'View or refine your personas',
        link: `/clarity-canvas/modules/persona-sharpener/personas?profile=${profileId}`,
      });
    }
  }

  return items;
}

/**
 * Get a count of active work items for a user.
 * Useful for showing badges or indicators.
 */
export async function getActiveWorkCount(userId: string): Promise<number> {
  return prisma.sharpenerSession.count({
    where: {
      status: 'in_progress',
      persona: {
        profile: {
          userRecordId: userId,
        },
      },
    },
  });
}

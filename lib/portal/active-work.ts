/**
 * Active Work Session Queries for Client Portal
 *
 * Queries in-progress Clarity Canvas sessions for portal users.
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
 *
 * @param userId - The User record ID (from unified session)
 * @returns Array of ActiveWorkItem for display in portal
 */
export async function getActiveWorkForUser(userId: string): Promise<ActiveWorkItem[]> {
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

  // Transform to ActiveWorkItem format
  return sessions.map((session) => {
    const personaName = session.persona.name ?? 'Persona';
    const currentQuestion = (session.lastQuestionIndex ?? 0) + 1;

    return {
      id: session.id,
      module: 'Persona Sharpener',
      context: personaName,
      status: 'in-progress',
      progress: `Question ${currentQuestion} of ${TOTAL_PERSONA_SHARPENER_QUESTIONS}`,
      link: `/clarity-canvas/modules/persona-sharpener/${session.id}`,
    };
  });
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

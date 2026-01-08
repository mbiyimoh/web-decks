import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createMinimalProfile } from '@/lib/clarity-canvas/seed-profile';
import { ensureUser } from '@/lib/user-sync';
import type { BrainDumpProject } from '@/lib/clarity-canvas/modules/persona-sharpener/types';

// Helper to include full persona and brain dump data
const profileInclude = {
  personas: {
    include: {
      sessions: {
        orderBy: { startedAt: 'desc' as const },
      },
      responses: true,
    },
  },
  brainDumps: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      personas: {
        include: {
          sessions: {
            orderBy: { startedAt: 'desc' as const },
          },
        },
      },
    },
  },
};

// GET - Fetch persona for current user's profile, including all brain dump projects
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record exists (creates if needed, links orphaned profiles)
    const user = await ensureUser(session);

    // Find profile using dual lookup (new userRecordId OR legacy userId)
    let profile = await prisma.clarityProfile.findFirst({
      where: {
        OR: [
          { userRecordId: user.id },      // New way (linked to User table)
          { userId: session.user.id },     // Legacy way (during transition)
        ],
      },
      include: profileInclude,
    });

    if (!profile) {
      // Create minimal profile for new users (no canvas sections seeded)
      const newProfile = await createMinimalProfile(user, session.user.id);
      // Re-fetch with personas included
      profile = await prisma.clarityProfile.findUnique({
        where: { id: newProfile.id },
        include: profileInclude,
      });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Find primary persona with in-progress session (for backward compatibility)
    const primaryPersona =
      profile.personas.find((p) => p.isPrimary) || profile.personas[0] || null;
    const hasIncompleteSession = primaryPersona?.sessions?.some(
      (s) => s.status === 'in_progress'
    ) || false;

    // Build brain dump projects with completion info
    const brainDumpProjects: BrainDumpProject[] = profile.brainDumps.map((bd) => {
      const personas = bd.personas.map((p) => {
        const completedSession = p.sessions.find((s) => s.status === 'completed');
        const inProgressSession = p.sessions.find((s) => s.status === 'in_progress');
        return {
          id: p.id,
          name: p.name,
          extractionConfidence: p.extractionConfidence,
          isComplete: !!completedSession,
          hasCompletedSession: !!completedSession,
          hasInProgressSession: !!inProgressSession,
          // Include session ID for direct linking
          inProgressSessionId: inProgressSession?.id || null,
          completedSessionId: completedSession?.id || null,
        };
      });

      const completedPersonaCount = personas.filter((p) => p.isComplete).length;
      const hasAnyProgress = personas.some(
        (p) => p.isComplete || p.hasInProgressSession
      );

      return {
        id: bd.id,
        createdAt: bd.createdAt.toISOString(),
        personaCount: bd.personaCount,
        personas,
        completedPersonaCount,
        hasAnyProgress,
      };
    });

    // Find the most relevant project to resume
    // Prioritize: projects with completed personas > projects with in-progress > newest
    const projectWithCompletedPersonas = brainDumpProjects.find(
      (p) => p.completedPersonaCount > 0
    );
    const projectWithProgress = brainDumpProjects.find((p) => p.hasAnyProgress);
    const activeProject = projectWithCompletedPersonas || projectWithProgress || brainDumpProjects[0];

    return NextResponse.json({
      // Backward compatibility
      persona: primaryPersona,
      hasIncompleteSession,
      // New: detailed project info
      brainDumpProjects,
      activeProject,
      hasProjects: brainDumpProjects.length > 0,
      hasCompletedPersonas: brainDumpProjects.some((p) => p.completedPersonaCount > 0),
    });
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 }
    );
  }
}

// POST - Create new persona
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user record exists (creates if needed, links orphaned profiles)
    const user = await ensureUser(session);

    // Find profile using dual lookup (new userRecordId OR legacy userId)
    let profile = await prisma.clarityProfile.findFirst({
      where: {
        OR: [
          { userRecordId: user.id },
          { userId: session.user.id },
        ],
      },
    });

    if (!profile) {
      // Create minimal profile for new users
      profile = await createMinimalProfile(user, session.user.id);
    }

    // Check if persona already exists
    const existingPersona = await prisma.persona.findFirst({
      where: { profileId: profile.id, isPrimary: true },
    });

    if (existingPersona) {
      return NextResponse.json({ persona: existingPersona });
    }

    // Create new persona
    const persona = await prisma.persona.create({
      data: {
        profileId: profile.id,
        isPrimary: true,
        antiPatterns: [],
      },
    });

    return NextResponse.json({ persona }, { status: 201 });
  } catch (error) {
    console.error('Error creating persona:', error);
    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}

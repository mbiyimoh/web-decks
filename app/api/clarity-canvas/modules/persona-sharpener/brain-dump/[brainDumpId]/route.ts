import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureUserFromUnifiedSession } from '@/lib/user-sync';

interface RouteContext {
  params: Promise<{ brainDumpId: string }>;
}

/**
 * DELETE /api/clarity-canvas/modules/persona-sharpener/brain-dump/[brainDumpId]
 *
 * Deletes a brain dump project and all associated personas, sessions, and responses.
 * Cascade delete is configured in Prisma schema:
 * - PersonaBrainDump -> Persona (onDelete: Cascade)
 * - Persona -> Response (onDelete: Cascade)
 * - Persona -> SharpenerSession (onDelete: Cascade)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await ensureUserFromUnifiedSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brainDumpId } = await context.params;

    // Verify the brain dump exists and belongs to the user
    const brainDump = await prisma.personaBrainDump.findFirst({
      where: {
        id: brainDumpId,
        profile: {
          userRecordId: user.id,
        },
      },
      include: {
        personas: {
          select: { id: true, name: true },
        },
      },
    });

    if (!brainDump) {
      return NextResponse.json(
        { error: 'Brain dump not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete the brain dump (cascade will handle personas, sessions, responses)
    await prisma.personaBrainDump.delete({
      where: { id: brainDumpId },
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      deletedPersonaCount: brainDump.personas.length,
    });
  } catch (error) {
    console.error('Error deleting brain dump:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

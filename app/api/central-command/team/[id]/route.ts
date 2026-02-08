import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  // Auth check
  const session = await getIronSession<SessionData>(
    await cookies(),
    getSessionOptions()
  );

  if (!isSessionValidForCentralCommand(session)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Extract id from params
  const { id } = await context.params;

  // Parse body
  const body = await request.json();
  const { name, role, color, utilization, allocations } = body;

  // Build update data object (only include fields that were provided)
  const updateData: {
    name?: string;
    role?: string;
    color?: string;
    utilization?: number;
    allocations?: string;
  } = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;
  if (color !== undefined) updateData.color = color;
  if (utilization !== undefined) {
    // Ensure utilization is between 0-100
    updateData.utilization = Math.max(0, Math.min(100, utilization));
  }
  if (allocations !== undefined) {
    // Validate and store allocations as JSON string
    if (Array.isArray(allocations)) {
      updateData.allocations = JSON.stringify(allocations);
    }
  }

  try {
    // Update team member
    const updated = await prisma.teamCapacity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      updated,
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    console.error('Failed to update team member:', error);

    // Check if it's a Prisma "not found" error
    const isPrismaError = (err: unknown): err is { code: string } => {
      return typeof err === 'object' && err !== null && 'code' in err;
    };

    if (isPrismaError(error) && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import {
  SessionData,
  getSessionOptions,
  isSessionValidForCentralCommand,
} from '@/lib/session';
import { CreateSessionRequestSchema } from '@/lib/input-session/schemas';

/**
 * GET /api/central-command/prospects/[id]/sessions
 * Returns all input sessions for a prospect
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    const sessions = await prisma.inputSession.findMany({
      where: { pipelineClientId: id },
      orderBy: { capturedAt: 'desc' },
    });

    return NextResponse.json(
      { sessions },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching prospect sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

/**
 * POST /api/central-command/prospects/[id]/sessions
 * Create a new input session for a prospect (follow-up context)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;
    const body = await req.json();
    const parsed = CreateSessionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { rawContent, inputType, title, sourceContext } = parsed.data;

    // Verify prospect exists
    const prospect = await prisma.pipelineClient.findUnique({
      where: { id },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const inputSession = await prisma.inputSession.create({
      data: {
        pipelineClientId: id,
        inputType: inputType || 'TEXT_INPUT',
        title: title || `Follow-up context - ${new Date().toLocaleDateString()}`,
        rawContent,
        sourceModule: 'central-command',
        sourceContext: sourceContext || 'follow-up',
        capturedAt: new Date(),
      },
    });

    return NextResponse.json(
      { session: inputSession },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

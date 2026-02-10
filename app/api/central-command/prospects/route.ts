import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { getProspects, getTeamCapacity } from '@/lib/central-command/queries';
import { createProspectSchema } from '@/lib/central-command/schemas';
import prisma from '@/lib/prisma';

/**
 * GET /api/central-command/prospects
 * Returns all prospects partitioned by status (intent, funnel, closed) + team capacity
 */
export async function GET() {
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

  // Fetch prospects and team data
  const prospectsData = await getProspects();
  const team = await getTeamCapacity();

  return NextResponse.json(
    { ...prospectsData, team },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * POST /api/central-command/prospects
 * Create a new prospect with both PipelineClient and PipelineRecord
 */
export async function POST(request: NextRequest) {
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

  // Parse and validate request body
  const body = await request.json();
  const validation = createProspectSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const data = validation.data;

  // Create both client and record in a transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create PipelineClient
      const client = await tx.pipelineClient.create({
        data: {
          name: data.name,
          industry: data.industry,
          color: data.color,
          website: data.website,
          contactName: data.contactName,
          contactRole: data.contactRole,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          contactLinkedin: data.contactLinkedin,
          notes: data.notes,
          rawInputText: data.rawInputText,
          enrichmentStatus: data.enrichmentFindings ? 'complete' : 'pending',
          enrichmentLastRun: data.enrichmentFindings ? new Date() : null,
          enrichmentFindings: data.enrichmentFindings ?? undefined,
          enrichmentConfidence: data.enrichmentConfidence ?? undefined,
          enrichmentSuggestedActions: data.enrichmentSuggestedActions ?? undefined,
        },
      });

      // Create PipelineRecord with AI-suggested scores
      const record = await tx.pipelineRecord.create({
        data: {
          clientId: client.id,
          status: 'funnel',
          currentStage: 'lead',
          stageIndex: 0,
          potentialValue: data.potentialValue,
          productFocus: data.productFocus,
          intakeMethod: data.rawInputText ? 'text_dump' : null,
          intakeDate: new Date(),
          isNew: true,
          scoreStrategic: data.scoreStrategic ?? 5,
          scoreValue: data.scoreValue ?? 5,
          scoreReadiness: data.scoreReadiness ?? 5,
          scoreTimeline: data.scoreTimeline ?? 5,
          scoreBandwidth: data.scoreBandwidth ?? 5,
        },
      });

      // Create InputSession to track the raw input (if provided)
      if (data.rawInputText) {
        await tx.inputSession.create({
          data: {
            pipelineClientId: client.id,
            inputType: 'TEXT_INPUT',
            title: `Initial intake - ${data.name}`,
            rawContent: data.rawInputText,
            sourceModule: 'central-command',
            sourceContext: 'prospect-intake',
            capturedAt: new Date(),
            processedAt: new Date(),
          },
        });
      }

      return { client, record };
    });

    return NextResponse.json(
      result,
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error creating prospect:', error);
    return NextResponse.json(
      { error: 'Failed to create prospect' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

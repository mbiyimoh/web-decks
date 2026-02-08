import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import { SessionData, getSessionOptions, isSessionValidForCentralCommand } from '@/lib/session';
import { getProspectDetail } from '@/lib/central-command/queries';
import { updateProspectSchema } from '@/lib/central-command/schemas';
import { addVersion, Version } from '@/lib/central-command/utils';
import { StageHistoryEntry } from '@/lib/central-command/types';
import prisma from '@/lib/prisma';

/**
 * GET /api/central-command/prospects/[id]
 * Returns single prospect with full pipeline record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Extract id from async params
  const { id } = await params;

  // Fetch prospect
  const prospect = await getProspectDetail(id);

  if (!prospect) {
    return NextResponse.json(
      { error: 'Prospect not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    prospect,
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * PATCH /api/central-command/prospects/[id]
 * Update prospect client and/or pipeline record
 * Handles version history, stage changes, and deal closure
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Extract id from async params
  const { id } = await params;

  // Parse and validate request body
  const body = await request.json();
  const validation = updateProspectSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: validation.error.flatten() },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const data = validation.data;

  // Fetch existing prospect for version history comparison
  const existing = await getProspectDetail(id);
  if (!existing) {
    return NextResponse.json(
      { error: 'Prospect not found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Separate updates into client and record fields
  const clientUpdates: Prisma.PipelineClientUpdateInput = {};
  const recordUpdates: Prisma.PipelineRecordUpdateInput = {};

  // Client fields
  if (data.name !== undefined) clientUpdates.name = data.name;
  if (data.industry !== undefined) clientUpdates.industry = data.industry;
  if (data.color !== undefined) clientUpdates.color = data.color;
  if (data.website !== undefined) clientUpdates.website = data.website;
  if (data.contactName !== undefined) clientUpdates.contactName = data.contactName;
  if (data.contactRole !== undefined) clientUpdates.contactRole = data.contactRole;
  if (data.contactEmail !== undefined) clientUpdates.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) clientUpdates.contactPhone = data.contactPhone;
  if (data.contactLinkedin !== undefined) clientUpdates.contactLinkedin = data.contactLinkedin;

  // Handle versioned field: notes
  if (data.notes !== undefined && data.notes !== existing.notes) {
    const source = (data.notesSource as Version['source']) || 'manual';
    clientUpdates.notes = data.notes;
    clientUpdates.notesVersions = addVersion(
      existing.notesVersions as Version[] | null,
      data.notes,
      source
    ) as unknown as Prisma.InputJsonValue;
    clientUpdates.notesSource = source;
  }

  // Pipeline record fields
  if (data.status !== undefined) recordUpdates.status = data.status;
  if (data.decision !== undefined) recordUpdates.decision = data.decision;
  if (data.decisionReason !== undefined) recordUpdates.decisionReason = data.decisionReason;
  if (data.value !== undefined) recordUpdates.value = data.value;
  if (data.potentialValue !== undefined) recordUpdates.potentialValue = data.potentialValue;
  if (data.scoreStrategic !== undefined) recordUpdates.scoreStrategic = data.scoreStrategic;
  if (data.scoreValue !== undefined) recordUpdates.scoreValue = data.scoreValue;
  if (data.scoreReadiness !== undefined) recordUpdates.scoreReadiness = data.scoreReadiness;
  if (data.scoreTimeline !== undefined) recordUpdates.scoreTimeline = data.scoreTimeline;
  if (data.scoreBandwidth !== undefined) recordUpdates.scoreBandwidth = data.scoreBandwidth;
  if (data.discoveryComplete !== undefined) recordUpdates.discoveryComplete = data.discoveryComplete;
  if (data.assessmentComplete !== undefined) recordUpdates.assessmentComplete = data.assessmentComplete;
  if (data.readinessPercent !== undefined) recordUpdates.readinessPercent = data.readinessPercent;
  if (data.isNew !== undefined) recordUpdates.isNew = data.isNew;
  if (data.productFocus !== undefined) recordUpdates.productFocus = data.productFocus;
  if (data.clientStatus !== undefined) recordUpdates.clientStatus = data.clientStatus;
  if (data.closedReason !== undefined) recordUpdates.closedReason = data.closedReason;
  if (data.closedReasonDetail !== undefined) recordUpdates.closedReasonDetail = data.closedReasonDetail;
  if (data.reengageDate !== undefined) {
    recordUpdates.reengageDate = data.reengageDate ? new Date(data.reengageDate) : null;
  }

  // Handle versioned field: lessonsLearned
  if (data.lessonsLearned !== undefined && data.lessonsLearned !== existing.pipelineRecord?.lessonsLearned) {
    const source = (data.lessonsSource as Version['source']) || 'manual';
    recordUpdates.lessonsLearned = data.lessonsLearned;
    recordUpdates.lessonsVersions = addVersion(
      existing.pipelineRecord?.lessonsVersions as Version[] | null,
      data.lessonsLearned,
      source
    ) as unknown as Prisma.InputJsonValue;
    recordUpdates.lessonsSource = source;
  }

  // Handle versioned field: reengageNotes
  if (data.reengageNotes !== undefined && data.reengageNotes !== existing.pipelineRecord?.reengageNotes) {
    const source = (data.reengageSource as Version['source']) || 'manual';
    recordUpdates.reengageNotes = data.reengageNotes;
    recordUpdates.reengageVersions = addVersion(
      existing.pipelineRecord?.reengageVersions as Version[] | null,
      data.reengageNotes,
      source
    ) as unknown as Prisma.InputJsonValue;
    recordUpdates.reengageSource = source;
  }

  // Handle versioned field: nextAction
  if (data.nextAction !== undefined && data.nextAction !== existing.pipelineRecord?.nextAction) {
    const source = (data.nextActionSource as Version['source']) || 'manual';
    recordUpdates.nextAction = data.nextAction;
    recordUpdates.nextActionVersions = addVersion(
      existing.pipelineRecord?.nextActionVersions as Version[] | null,
      data.nextAction,
      source
    ) as unknown as Prisma.InputJsonValue;
    recordUpdates.nextActionSource = source;
  }

  // Handle enrichmentFindings merge (for synthesis refinement)
  if (data.enrichmentFindings !== undefined) {
    const existingFindings = (existing.enrichmentFindings as Record<string, unknown>) || {};
    const updated = { ...existingFindings, ...data.enrichmentFindings };
    clientUpdates.enrichmentFindings = updated as unknown as Prisma.InputJsonValue;
  }

  // Handle enrichmentFindingsVersions (merge with existing to prevent race conditions)
  if (data.enrichmentFindingsVersions !== undefined) {
    const existingVersions = (existing.enrichmentFindingsVersions as Record<string, unknown>) || {};
    const updated = { ...existingVersions, ...data.enrichmentFindingsVersions };
    clientUpdates.enrichmentFindingsVersions = updated as unknown as Prisma.InputJsonValue;
  }

  // Handle nextActionDate
  if (data.nextActionDate !== undefined) {
    recordUpdates.nextActionDate = data.nextActionDate ? new Date(data.nextActionDate) : null;
  }

  // Handle decision workflow fields
  if (data.decisionBucket !== undefined) recordUpdates.decisionBucket = data.decisionBucket;
  if (data.nextStepNotes !== undefined) recordUpdates.nextStepNotes = data.nextStepNotes;
  if (data.decisionMadeAt !== undefined) {
    recordUpdates.decisionMadeAt = data.decisionMadeAt ? new Date(data.decisionMadeAt) : null;
  }

  // Handle stage change
  if (data.currentStage !== undefined && data.currentStage !== existing.pipelineRecord?.currentStage) {
    const existingHistory = (existing.pipelineRecord?.stageHistory as unknown as StageHistoryEntry[]) || [];
    const newEntry: StageHistoryEntry = {
      stage: data.currentStage as StageHistoryEntry['stage'],
      completed: true,
      date: new Date().toISOString(),
    };

    recordUpdates.currentStage = data.currentStage;
    recordUpdates.stageHistory = [...existingHistory, newEntry] as unknown as Prisma.InputJsonValue;
    recordUpdates.stageEnteredAt = new Date();

    // Update stageIndex if provided
    if (data.stageIndex !== undefined) {
      recordUpdates.stageIndex = data.stageIndex;
    }
  }

  // Handle deal closure
  if (data.status === 'closed' && existing.pipelineRecord?.status !== 'closed') {
    recordUpdates.closedAt = new Date();
  }

  // Update in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update client if there are client updates
      if (Object.keys(clientUpdates).length > 0) {
        await tx.pipelineClient.update({
          where: { id },
          data: clientUpdates,
        });
      }

      // Update record if there are record updates
      if (Object.keys(recordUpdates).length > 0 && existing.pipelineRecord) {
        await tx.pipelineRecord.update({
          where: { id: existing.pipelineRecord.id },
          data: recordUpdates,
        });
      }

      // Fetch final state with all relations
      const finalProspect = await tx.pipelineClient.findUnique({
        where: { id },
        include: { pipelineRecord: true },
      });

      return {
        client: finalProspect,
        record: finalProspect?.pipelineRecord || null,
      };
    });

    return NextResponse.json(
      result,
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error updating prospect:', error);
    return NextResponse.json(
      { error: 'Failed to update prospect' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

/**
 * DELETE /api/central-command/prospects/[id]
 * Permanently delete a prospect and its pipeline record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  try {
    // Delete in transaction (record first due to FK constraint)
    await prisma.$transaction(async (tx) => {
      // Delete PipelineRecord first (if exists)
      await tx.pipelineRecord.deleteMany({
        where: { clientId: id },
      });

      // Delete PipelineClient
      await tx.pipelineClient.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      { success: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error deleting prospect:', error);
    return NextResponse.json(
      { error: 'Failed to delete prospect' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

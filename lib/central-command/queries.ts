// queries.ts — Prisma query functions for Central Command

import prisma from '@/lib/prisma';
import { calculatePriority } from './utils';
import { ProspectsData, ProspectWithRecord } from './types';

/**
 * Get all prospects with pipeline records, partitioned by status
 * Sorted: intent by priority, funnel with new first then priority
 */
export async function getProspects(): Promise<ProspectsData> {
  const clients = await prisma.pipelineClient.findMany({
    include: {
      pipelineRecord: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Helper to extract priority scores from record
  const getPriorityScores = (record: {
    scoreStrategic: number;
    scoreValue: number;
    scoreReadiness: number;
    scoreTimeline: number;
    scoreBandwidth: number;
  }) => ({
    strategic: record.scoreStrategic,
    value: record.scoreValue,
    readiness: record.scoreReadiness,
    timeline: record.scoreTimeline,
    bandwidth: record.scoreBandwidth,
  });

  // Partition into intent, funnel, closed
  const intentClients = clients
    .filter((c) => c.pipelineRecord?.status === 'intent')
    .sort((a, b) => {
      const priorityA = calculatePriority(getPriorityScores(a.pipelineRecord!));
      const priorityB = calculatePriority(getPriorityScores(b.pipelineRecord!));
      return priorityB - priorityA;
    });

  const funnelClients = clients
    .filter((c) => c.pipelineRecord?.status === 'funnel')
    .sort((a, b) => {
      // New prospects first
      if (a.pipelineRecord?.isNew && !b.pipelineRecord?.isNew) return -1;
      if (!a.pipelineRecord?.isNew && b.pipelineRecord?.isNew) return 1;
      // Then by priority
      const priorityA = calculatePriority(getPriorityScores(a.pipelineRecord!));
      const priorityB = calculatePriority(getPriorityScores(b.pipelineRecord!));
      return priorityB - priorityA;
    });

  const closedDeals = clients.filter((c) => c.pipelineRecord?.status === 'closed');

  // Calculate pipeline stats
  const stats = {
    intentCount: intentClients.length,
    intentValue: intentClients.reduce((sum, c) => sum + (c.pipelineRecord?.value || 0), 0),
    funnelCount: funnelClients.length,
    funnelValue: funnelClients.reduce(
      (sum, c) => sum + (c.pipelineRecord?.potentialValue || 0),
      0
    ),
    closedCount: closedDeals.length,
  };

  return { intentClients, funnelClients, closedDeals, stats };
}

/**
 * Get single prospect with full pipeline record
 */
export async function getProspectDetail(id: string): Promise<ProspectWithRecord | null> {
  return prisma.pipelineClient.findUnique({
    where: { id },
    include: {
      pipelineRecord: true,
    },
  });
}

/**
 * Get all team capacity records
 */
export async function getTeamCapacity() {
  return prisma.teamCapacity.findMany({
    orderBy: { name: 'asc' },
  });
}

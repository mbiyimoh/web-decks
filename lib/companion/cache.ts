/**
 * Synthesis Caching for Clarity Companion API
 *
 * Handles caching of generated synthesis with:
 * - Hash-based invalidation when profile changes
 * - 24-hour TTL expiration
 * - Version tracking for ETag support
 */

import { prisma } from '@/lib/prisma';
import {
  generateBaseSynthesis,
  calculateProfileHash,
  resolveProfileWhereClause,
  resolveToUserId,
} from './synthesis';
import type { BaseSynthesis } from './types';

const SYNTHESIS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedSynthesis {
  synthesis: BaseSynthesis;
  version: string;
  cacheHit: boolean;
  stale: boolean;
}

/**
 * Get synthesis for a user, using cache if valid.
 * Regenerates if cache is stale or profile has changed.
 *
 * @param userId - OAuth user ID (can be Google UUID, email, or User.id cuid)
 */
export async function getCachedSynthesis(
  userId: string
): Promise<CachedSynthesis | null> {
  // Resolve OAuth userId to actual User.id (cuid) for FK-compatible operations
  // CompanionSynthesis.userId has FK to User.id, so we need the cuid
  const resolvedUserId = await resolveToUserId(userId);

  if (!resolvedUserId) {
    return null;
  }

  // Check for existing cached synthesis using resolved User.id
  const cached = await prisma.companionSynthesis.findUnique({
    where: { userId: resolvedUserId },
  });

  // Calculate current profile hash (uses original userId for flexible lookup)
  const currentHash = await calculateProfileHash(userId);

  // Determine if cache is valid
  const now = new Date();
  const isExpired = cached ? cached.expiresAt < now : true;
  const hashMismatch = cached ? cached.profileHash !== currentHash : true;
  const needsRegeneration = !cached || isExpired || hashMismatch;

  if (!needsRegeneration && cached) {
    // Return cached synthesis
    return {
      synthesis: cached.baseSynthesis as unknown as BaseSynthesis,
      version: cached.version,
      cacheHit: true,
      stale: false,
    };
  }

  // Generate new synthesis (uses original userId for flexible ClarityProfile lookup)
  const synthesis = await generateBaseSynthesis(userId);
  if (!synthesis) {
    return null;
  }

  // Calculate expiration
  const expiresAt = new Date(now.getTime() + SYNTHESIS_TTL_MS);

  // Upsert cache using resolved User.id (FK-compatible)
  // Note: JSON.parse(JSON.stringify()) is required to coerce BaseSynthesis interface
  // to Prisma's InputJsonValue type (Prisma JSON fields require index signatures)
  const version = synthesis._meta.version;
  const synthesisJson = JSON.parse(JSON.stringify(synthesis));
  await prisma.companionSynthesis.upsert({
    where: { userId: resolvedUserId },
    create: {
      userId: resolvedUserId,
      baseSynthesis: synthesisJson,
      profileHash: currentHash,
      tokenCount: synthesis._meta.tokenCount,
      version,
      expiresAt,
    },
    update: {
      baseSynthesis: synthesisJson,
      profileHash: currentHash,
      tokenCount: synthesis._meta.tokenCount,
      version,
      generatedAt: now,
      expiresAt,
    },
  });

  return {
    synthesis,
    version,
    cacheHit: false,
    stale: false,
  };
}

/**
 * Check if a cached version is stale.
 */
export async function isSynthesisStale(
  userId: string,
  cachedVersion: string
): Promise<{ stale: boolean; currentVersion: string }> {
  // Resolve to User.id for FK-compatible lookup
  const resolvedUserId = await resolveToUserId(userId);
  if (!resolvedUserId) {
    return { stale: true, currentVersion: '' };
  }

  const cached = await prisma.companionSynthesis.findUnique({
    where: { userId: resolvedUserId },
    select: { version: true, expiresAt: true, profileHash: true },
  });

  if (!cached) {
    return { stale: true, currentVersion: '' };
  }

  const currentHash = await calculateProfileHash(userId);
  const isExpired = cached.expiresAt < new Date();
  const hashMismatch = cached.profileHash !== currentHash;

  return {
    stale: cachedVersion !== cached.version || isExpired || hashMismatch,
    currentVersion: cached.version,
  };
}

/**
 * Invalidate cached synthesis for a user.
 * Call this when profile is updated.
 */
export async function invalidateSynthesis(userId: string): Promise<void> {
  // Resolve to User.id for FK-compatible deletion
  const resolvedUserId = await resolveToUserId(userId);
  if (!resolvedUserId) {
    return; // No user found, nothing to invalidate
  }

  await prisma.companionSynthesis.deleteMany({
    where: { userId: resolvedUserId },
  });
}

/**
 * Get section version for ETag support.
 * Uses profile updatedAt + section score as version proxy.
 */
export async function getSectionVersion(
  userId: string,
  sectionKey: string
): Promise<string | null> {
  const whereClause = await resolveProfileWhereClause(userId);

  const profile = await prisma.clarityProfile.findFirst({
    where: whereClause,
    include: {
      sections: {
        where: { key: sectionKey },
        select: { score: true },
      },
    },
  });

  if (!profile || profile.sections.length === 0) {
    return null;
  }

  const score = profile.sections[0].score;
  const timestamp = profile.updatedAt.getTime().toString(36);
  return `${sectionKey}-${timestamp}-${score}`;
}

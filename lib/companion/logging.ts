/**
 * Access Logging for Clarity Companion API
 *
 * Logs all API access for analytics, audit, and optimization.
 */

import { prisma } from '@/lib/prisma';

export interface AccessLogEntry {
  userId: string;
  productId: string;
  endpoint: string;
  section?: string;
  tokenCount: number;
  cacheHit: boolean;
  latencyMs: number;
}

/**
 * Log an API access event.
 * Fire-and-forget - doesn't block the response.
 */
export async function logAccess(entry: AccessLogEntry): Promise<void> {
  try {
    await prisma.companionAccessLog.create({
      data: {
        userId: entry.userId,
        productId: entry.productId,
        endpoint: entry.endpoint,
        section: entry.section,
        tokenCount: entry.tokenCount,
        cacheHit: entry.cacheHit,
        latencyMs: entry.latencyMs,
      },
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('[Companion] Failed to log access:', error);
  }
}

/**
 * Get access statistics for a product.
 */
export async function getProductStats(
  productId: string,
  since: Date
): Promise<{
  totalRequests: number;
  totalTokens: number;
  cacheHitRate: number;
  avgLatencyMs: number;
}> {
  const logs = await prisma.companionAccessLog.findMany({
    where: {
      productId,
      createdAt: { gte: since },
    },
    select: {
      tokenCount: true,
      cacheHit: true,
      latencyMs: true,
    },
  });

  if (logs.length === 0) {
    return {
      totalRequests: 0,
      totalTokens: 0,
      cacheHitRate: 0,
      avgLatencyMs: 0,
    };
  }

  const totalTokens = logs.reduce((sum, log) => sum + log.tokenCount, 0);
  const cacheHits = logs.filter((log) => log.cacheHit).length;
  const totalLatency = logs.reduce((sum, log) => sum + log.latencyMs, 0);

  return {
    totalRequests: logs.length,
    totalTokens,
    cacheHitRate: Math.round((cacheHits / logs.length) * 100) / 100,
    avgLatencyMs: Math.round(totalLatency / logs.length),
  };
}

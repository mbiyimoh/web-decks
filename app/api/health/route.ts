import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { areKeysConfigured } from '@/lib/oauth/keys';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'ok' | 'error';
    oauth: 'ok' | 'not_configured';
    redis: 'ok' | 'not_configured' | 'error';
  };
  version?: string;
}

export async function GET() {
  const checks: HealthStatus['checks'] = {
    database: 'ok',
    oauth: 'ok',
    redis: 'not_configured',
  };

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = 'error';
  }

  // Check OAuth keys configured
  if (!areKeysConfigured()) {
    checks.oauth = 'not_configured';
  }

  // Check Redis configured
  if (process.env.REDIS_URL) {
    try {
      const { getRedis } = await import('@/lib/redis');
      const redis = getRedis();
      await redis.ping();
      checks.redis = 'ok';
    } catch (error) {
      console.error('[health] Redis check failed:', error);
      checks.redis = 'error';
    }
  }

  // Determine overall status
  let status: HealthStatus['status'] = 'ok';
  if (checks.database === 'error') {
    status = 'unhealthy';
  } else if (checks.oauth === 'not_configured' || checks.redis === 'error') {
    status = 'degraded';
  }

  const response: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    checks,
  };

  // Return 503 if unhealthy (for load balancer health checks)
  const httpStatus = status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}

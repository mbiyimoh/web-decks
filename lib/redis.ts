/**
 * Redis client for token storage, session management, and rate limiting.
 *
 * Uses ioredis with Railway Redis or Upstash.
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

// NOTE: We check for REDIS_URL at runtime in getRedis(), not at module load time.
// This allows the build to succeed even without REDIS_URL configured locally.

// Singleton pattern for connection reuse
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL not configured. Add Redis for token storage.');
    }

    // Parse URL to check if it's Railway internal networking
    const isRailwayInternal = redisUrl.includes('.railway.internal');

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // TLS for Railway Redis (uses rediss:// URL)
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      // Railway internal networking needs explicit connection settings
      connectTimeout: 10000, // 10 seconds
      // Railway private networking uses IPv6, ensure we try that
      family: isRailwayInternal ? 0 : 4, // 0 = auto-detect (IPv4/IPv6), 4 = IPv4 only
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected to:', redisUrl.replace(/:[^:@]+@/, ':***@'));
    });

    redis.on('ready', () => {
      console.log('[Redis] Ready');
    });
  }

  return redis;
}

// ============================================================================
// Token Storage Helpers
// ============================================================================

/**
 * Set a key with expiration (seconds).
 */
export async function setWithExpiry(
  key: string,
  value: string,
  expirySeconds: number
): Promise<void> {
  const client = getRedis();
  await client.setex(key, expirySeconds, value);
}

/**
 * Get a value by key.
 */
export async function get(key: string): Promise<string | null> {
  const client = getRedis();
  return client.get(key);
}

/**
 * Delete a key.
 */
export async function del(key: string): Promise<void> {
  const client = getRedis();
  await client.del(key);
}

/**
 * Check if a key exists.
 */
export async function exists(key: string): Promise<boolean> {
  const client = getRedis();
  const result = await client.exists(key);
  return result === 1;
}

// ============================================================================
// Token Blacklist (for early revocation)
// ============================================================================

const TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';

/**
 * Add a token to the blacklist (for early revocation).
 * TTL should match the token's remaining lifetime.
 */
export async function blacklistToken(
  tokenJti: string,
  ttlSeconds: number
): Promise<void> {
  await setWithExpiry(`${TOKEN_BLACKLIST_PREFIX}${tokenJti}`, '1', ttlSeconds);
}

/**
 * Check if a token is blacklisted.
 */
export async function isTokenBlacklisted(tokenJti: string): Promise<boolean> {
  return exists(`${TOKEN_BLACKLIST_PREFIX}${tokenJti}`);
}

// ============================================================================
// Rate Limiting
// ============================================================================

const RATE_LIMIT_PREFIX = 'ratelimit:';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check rate limit using sliding window.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const client = getRedis();
  const fullKey = `${RATE_LIMIT_PREFIX}${key}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Use Redis transaction for atomicity
  const multi = client.multi();

  // Remove old entries outside the window
  multi.zremrangebyscore(fullKey, 0, windowStart);

  // Count current entries
  multi.zcard(fullKey);

  // Add current request
  multi.zadd(fullKey, now, `${now}-${Math.random()}`);

  // Set expiry on the sorted set
  multi.expire(fullKey, windowSeconds);

  const results = await multi.exec();

  // Results: [zremrangebyscore, zcard, zadd, expire]
  const currentCount = (results?.[1]?.[1] as number) || 0;

  const allowed = currentCount < maxRequests;
  const resetAt = new Date(now + windowSeconds * 1000);

  if (!allowed) {
    // Remove the request we just added since it's not allowed
    await client.zremrangebyscore(fullKey, now, now + 1);
  }

  return {
    allowed,
    remaining: Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0)),
    resetAt,
  };
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Close Redis connection (for graceful shutdown).
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Redis-backed rate limiting using Upstash.
 * Falls back to in-memory when UPSTASH_REDIS_REST_URL is not configured.
 *
 * Requires env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { RATE_LIMIT_PRESETS, type RateLimitPreset, type RateLimitOptions, type RateLimitResult } from './rateLimit'

let redisClient: Redis | null = null
const ratelimitInstances = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redisClient = new Redis({ url, token })
  return redisClient
}

function getRatelimit(preset: RateLimitPreset): Ratelimit | null {
  const existing = ratelimitInstances.get(preset)
  if (existing) return existing

  const redis = getRedis()
  if (!redis) return null

  const config = RATE_LIMIT_PRESETS[preset]
  const windowSeconds = Math.floor(config.windowMs / 1000)
  const windowUnit: Duration = windowSeconds >= 3600 ? `${Math.floor(windowSeconds / 3600)} h` : `${Math.floor(windowSeconds / 60)} m`

  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, windowUnit),
    analytics: false,
    prefix: `icma360:ratelimit:${preset}`,
  })
  ratelimitInstances.set(preset, instance)
  return instance
}

/**
 * Check rate limit using Redis.
 * Returns null if Redis is not configured (caller should fall back to in-memory).
 */
export async function checkRateLimitRedis(
  options: RateLimitOptions & { preset?: RateLimitPreset }
): Promise<RateLimitResult | null> {
  const preset = options.preset || 'api'
  const ratelimit = getRatelimit(preset)
  if (!ratelimit) return null

  const { success, limit, remaining, reset } = await ratelimit.limit(options.key)

  return {
    allowed: success,
    remaining,
    resetAt: reset,
    limit,
  }
}

/**
 * Unified rate limiting system for API endpoints.
 * Supports per-endpoint, per-user, and per-IP rate limiting.
 * Uses sliding window approach with configurable limits.
 * 
 * For production with multiple instances, replace Map with Redis.
 */

type RateLimitWindow = {
  count: number
  resetAt: number
}

// In-memory store (will reset on server restart)
const rateLimitStore = new Map<string, RateLimitWindow>()

// Cleanup interval: 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000

/**
 * Rate limit presets for different endpoint types
 */
export const RATE_LIMIT_PRESETS = {
  // Public read endpoints (search, listings)
  publicRead: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 req / 15 min
  
  // Authenticated read endpoints (profile, dashboard)
  authenticatedRead: { maxRequests: 200, windowMs: 15 * 60 * 1000 }, // 200 req / 15 min
  
  // Write endpoints (create, update)
  write: { maxRequests: 30, windowMs: 15 * 60 * 1000 }, // 30 req / 15 min
  
  // Auth endpoints (login, register, password reset)
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 req / 15 min
  
  // Admin endpoints
  admin: { maxRequests: 500, windowMs: 15 * 60 * 1000 }, // 500 req / 15 min
  
  // File upload endpoints
  upload: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 req / 15 min
  
  // API endpoints (default)
  api: { maxRequests: 150, windowMs: 15 * 60 * 1000 }, // 150 req / 15 min
} as const

export type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
  /** Key to identify the user/session/IP */
  key: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  // Check common proxy headers in order of preference
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP in the chain
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp
  
  const cfConnecting = headers.get('cf-connecting-ip')
  if (cfConnecting) return cfConnecting
  
  return 'unknown'
}

/**
 * Build a rate limit key from IP and/or user ID
 */
export function buildRateLimitKey(options: {
  ip?: string
  userId?: string
  endpoint: string
}): string {
  const parts = []
  if (options.userId) parts.push(`user:${options.userId}`)
  if (options.ip) parts.push(`ip:${options.ip}`)
  parts.push(`endpoint:${options.endpoint}`)
  return parts.join(':')
}

/**
 * Check if a request is within rate limits.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { maxRequests, windowMs, key } = options
  const now = Date.now()
  
  const window = rateLimitStore.get(key)
  
  if (!window || now >= window.resetAt) {
    // Create new window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
      limit: maxRequests,
    }
  }
  
  // Increment count in existing window
  window.count += 1
  
  if (window.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: window.resetAt,
      limit: maxRequests,
    }
  }
  
  return {
    allowed: true,
    remaining: maxRequests - window.count,
    resetAt: window.resetAt,
    limit: maxRequests,
  }
}

/**
 * Apply rate limiting to an API request.
 * Returns rate limit result with headers to add to response.
 */
export function applyRateLimit(options: {
  request: Request
  userId?: string
  preset?: RateLimitPreset
  customLimit?: { maxRequests: number; windowMs: number }
  endpoint?: string
}): { result: RateLimitResult; headers: Record<string, string> } {
  const { request, userId, preset = 'api', customLimit, endpoint } = options
  
  const ip = getClientIp(request.headers)
  const endpointPath = endpoint || new URL(request.url).pathname
  const key = buildRateLimitKey({ ip, userId, endpoint: endpointPath })
  
  const limits = customLimit || RATE_LIMIT_PRESETS[preset]
  const result = checkRateLimit({
    key,
    maxRequests: limits.maxRequests,
    windowMs: limits.windowMs,
  })
  
  // Build rate limit headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
  }
  
  return { result, headers }
}

/**
 * Clean up expired entries from the store.
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  rateLimitStore.forEach((window, key) => {
    if (now >= window.resetAt) {
      rateLimitStore.delete(key)
    }
  })
}

// Auto-cleanup
setInterval(cleanupRateLimitStore, CLEANUP_INTERVAL)

/**
 * Simple in-memory rate limiter for API endpoints.
 * Uses a sliding window approach to limit requests per user.
 */

type RateLimitWindow = {
  count: number
  resetAt: number
}

// In-memory store (will reset on server restart - for production, use Redis or DB)
const rateLimitStore = new Map<string, RateLimitWindow>()

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
  /** Key to identify the user/session */
  key: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request is within rate limits.
 * @returns RateLimitResult with allowed status and metadata
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
    }
  }
  
  // Increment count in existing window
  window.count += 1
  
  if (window.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: window.resetAt,
    }
  }
  
  return {
    allowed: true,
    remaining: maxRequests - window.count,
    resetAt: window.resetAt,
  }
}

/**
 * Clean up expired entries from the store.
 * Call this periodically to prevent memory leaks.
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  rateLimitStore.forEach((window, key) => {
    if (now >= window.resetAt) {
      rateLimitStore.delete(key)
    }
  })
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)

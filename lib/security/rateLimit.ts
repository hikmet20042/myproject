type RateLimitRecord = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitRecord>()

function now() {
  return Date.now()
}

function cleanupExpiredEntries(currentTime: number) {
  store.forEach((record, key) => {
    if (record.resetAt <= currentTime) {
      store.delete(key)
    }
  })
}

export function getRequestIp(headers: Headers) {
  const candidates = [
    headers.get('x-forwarded-for'),
    headers.get('x-real-ip'),
    headers.get('cf-connecting-ip'),
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const first = candidate.split(',')[0]?.trim()
    if (first) return first
  }

  return 'unknown'
}

export function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const currentTime = now()
  cleanupExpiredEntries(currentTime)

  const existing = store.get(key)
  if (!existing || existing.resetAt <= currentTime) {
    const resetAt = currentTime + windowMs
    store.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
      retryAfterMs: 0,
    }
  }

  const nextCount = existing.count + 1
  if (nextCount > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterMs: Math.max(existing.resetAt - currentTime, 0),
    }
  }

  existing.count = nextCount
  store.set(key, existing)

  return {
    allowed: true,
    remaining: Math.max(maxRequests - nextCount, 0),
    resetAt: existing.resetAt,
    retryAfterMs: 0,
  }
}

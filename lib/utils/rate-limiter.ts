interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (identifier: string) => string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  async isAllowed(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    let entry = this.store.get(key)

    // Create new entry if doesn't exist or window has passed
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
      }
      this.store.set(key, entry)

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: entry.resetTime,
      }
    }

    // Increment count
    entry.count++

    const allowed = entry.count <= this.config.maxRequests
    const remaining = Math.max(0, this.config.maxRequests - entry.count)

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }

  getStats() {
    return {
      activeKeys: this.store.size,
      entries: Array.from(this.store.entries()),
    }
  }
}

// Pre-configured rate limiters for different use cases
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
})

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
})

export const passwordResetRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 password reset attempts per hour
})

// Middleware helper for rate limiting
export async function checkRateLimit(
  limiter: RateLimiter,
  identifier: string,
): Promise<{ success: boolean; headers: Record<string, string> }> {
  const result = await limiter.isAllowed(identifier)

  const headers = {
    "X-RateLimit-Limit": limiter["config"].maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
  }

  if (!result.allowed) {
    headers["Retry-After"] = Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  }

  return {
    success: result.allowed,
    headers,
  }
}

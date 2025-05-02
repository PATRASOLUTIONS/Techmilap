/**
 * A simple in-memory rate limiter utility
 */

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  limit: number // Maximum number of requests per interval
  uniqueTokenPerInterval?: number // Maximum number of unique tokens per interval
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

export function rateLimit(options: RateLimitOptions) {
  const { interval, limit, uniqueTokenPerInterval = 500 } = options

  // Store token buckets in memory
  const tokenBuckets = new Map<string, TokenBucket>()

  // Clean up old tokens periodically
  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [token, bucket] of tokenBuckets.entries()) {
      if (now - bucket.lastRefill > interval * 2) {
        tokenBuckets.delete(token)
      }
    }
  }, interval)

  // Ensure cleanup doesn't prevent the process from exiting
  if (cleanup.unref) {
    cleanup.unref()
  }

  return {
    check: async (tokens: number, key: string): Promise<void> => {
      // Get or create token bucket
      const now = Date.now()
      let bucket = tokenBuckets.get(key)

      if (!bucket) {
        // Create a new bucket if it doesn't exist
        bucket = {
          tokens: limit,
          lastRefill: now,
        }
        tokenBuckets.set(key, bucket)
      } else {
        // Refill tokens based on time elapsed
        const timeElapsed = now - bucket.lastRefill
        const tokensToAdd = Math.floor(timeElapsed / interval) * limit

        if (tokensToAdd > 0) {
          bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd)
          bucket.lastRefill = now
        }
      }

      // Check if enough tokens are available
      if (bucket.tokens < tokens) {
        throw new Error("Rate limit exceeded")
      }

      // Consume tokens
      bucket.tokens -= tokens

      // Ensure we don't exceed the maximum number of unique tokens
      if (tokenBuckets.size > uniqueTokenPerInterval) {
        // Remove the oldest token
        const oldestKey = tokenBuckets.keys().next().value
        tokenBuckets.delete(oldestKey)
      }
    },
  }
}

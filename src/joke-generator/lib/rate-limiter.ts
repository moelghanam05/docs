/**
 * Simple token bucket rate limiter for API calls
 */

import type { RateLimiterConfig, RateLimiterState } from './types'

/**
 * Token bucket rate limiter to prevent API abuse
 */
export class RateLimiter {
  private state: RateLimiterState
  private config: RateLimiterConfig

  /**
   * Create a new rate limiter
   * @param config - Configuration for the rate limiter
   */
  constructor(config: RateLimiterConfig) {
    this.config = config
    this.state = {
      tokens: config.maxRequests,
      lastRefill: Date.now(),
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now()
    const timePassed = now - this.state.lastRefill

    if (timePassed >= this.config.windowMs) {
      this.state.tokens = this.config.maxRequests
      this.state.lastRefill = now
    }
  }

  /**
   * Try to consume a token
   * @returns true if a token was consumed, false if rate limit exceeded
   */
  public tryConsume(): boolean {
    this.refill()

    if (this.state.tokens > 0) {
      this.state.tokens--
      return true
    }

    return false
  }

  /**
   * Get the current number of available tokens
   */
  public getAvailableTokens(): number {
    this.refill()
    return this.state.tokens
  }

  /**
   * Get time until next token refill in milliseconds
   */
  public getTimeUntilRefill(): number {
    const now = Date.now()
    const timeSinceRefill = now - this.state.lastRefill
    return Math.max(0, this.config.windowMs - timeSinceRefill)
  }
}

/**
 * Create a rate limiter with default configuration
 * Default: 10 requests per minute
 */
export function createDefaultRateLimiter(): RateLimiter {
  return new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  })
}

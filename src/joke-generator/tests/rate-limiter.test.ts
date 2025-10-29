/**
 * Tests for the rate limiter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RateLimiter, createDefaultRateLimiter } from '@/joke-generator/lib/rate-limiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe('basic functionality', () => {
    it('should allow requests up to the max limit', () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 })

      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(false)
    })

    it('should block requests after exceeding the limit', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 })

      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(false)
      expect(limiter.tryConsume()).toBe(false)
    })

    it('should refill tokens after the time window', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 })

      // Consume all tokens
      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(false)

      // Advance time by 1 second
      vi.advanceTimersByTime(1000)

      // Should be able to consume again
      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(true)
    })

    it('should not refill tokens before the time window expires', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 })

      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(true)

      // Advance time by 500ms (half the window)
      vi.advanceTimersByTime(500)

      // Should still be blocked
      expect(limiter.tryConsume()).toBe(false)
    })
  })

  describe('getAvailableTokens', () => {
    it('should return the correct number of available tokens', () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1000 })

      expect(limiter.getAvailableTokens()).toBe(5)

      limiter.tryConsume()
      expect(limiter.getAvailableTokens()).toBe(4)

      limiter.tryConsume()
      limiter.tryConsume()
      expect(limiter.getAvailableTokens()).toBe(2)
    })

    it('should show full tokens after refill', () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 })

      limiter.tryConsume()
      limiter.tryConsume()
      expect(limiter.getAvailableTokens()).toBe(1)

      vi.advanceTimersByTime(1000)

      expect(limiter.getAvailableTokens()).toBe(3)
    })
  })

  describe('getTimeUntilRefill', () => {
    it('should return the time remaining until refill', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 })

      limiter.tryConsume()
      limiter.tryConsume()

      const timeUntilRefill = limiter.getTimeUntilRefill()
      expect(timeUntilRefill).toBeGreaterThan(0)
      expect(timeUntilRefill).toBeLessThanOrEqual(1000)
    })

    it('should decrease as time passes', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 })

      limiter.tryConsume()

      const initialTime = limiter.getTimeUntilRefill()

      vi.advanceTimersByTime(500)

      const laterTime = limiter.getTimeUntilRefill()
      expect(laterTime).toBeLessThan(initialTime)
    })

    it('should return 0 after the time window has passed', () => {
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1000 })

      limiter.tryConsume()

      vi.advanceTimersByTime(1000)

      expect(limiter.getTimeUntilRefill()).toBe(0)
    })
  })

  describe('createDefaultRateLimiter', () => {
    it('should create a rate limiter with default settings', () => {
      const limiter = createDefaultRateLimiter()

      // Should allow 10 requests
      for (let i = 0; i < 10; i++) {
        expect(limiter.tryConsume()).toBe(true)
      }

      // 11th request should be blocked
      expect(limiter.tryConsume()).toBe(false)
    })

    it('should refill after 60 seconds', () => {
      const limiter = createDefaultRateLimiter()

      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        limiter.tryConsume()
      }

      expect(limiter.tryConsume()).toBe(false)

      // Advance time by 60 seconds
      vi.advanceTimersByTime(60000)

      // Should be able to consume again
      expect(limiter.tryConsume()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle zero max requests', () => {
      const limiter = new RateLimiter({ maxRequests: 0, windowMs: 1000 })
      expect(limiter.tryConsume()).toBe(false)
    })

    it('should handle very small time windows', () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 1 })

      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(false)

      vi.advanceTimersByTime(1)

      expect(limiter.tryConsume()).toBe(true)
    })

    it('should handle very large time windows', () => {
      const limiter = new RateLimiter({ maxRequests: 1, windowMs: 3600000 }) // 1 hour

      expect(limiter.tryConsume()).toBe(true)
      expect(limiter.tryConsume()).toBe(false)

      vi.advanceTimersByTime(3599999) // Almost 1 hour
      expect(limiter.tryConsume()).toBe(false)

      vi.advanceTimersByTime(1) // Complete the hour
      expect(limiter.tryConsume()).toBe(true)
    })
  })
})

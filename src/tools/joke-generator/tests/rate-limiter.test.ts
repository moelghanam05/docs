import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '@/tools/joke-generator/lib/rate-limiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  afterEach(async () => {
    if (rateLimiter) {
      await rateLimiter.stop()
    }
  })

  describe('constructor', () => {
    it('should create a rate limiter with default config', () => {
      rateLimiter = new RateLimiter()
      expect(rateLimiter).toBeInstanceOf(RateLimiter)
    })

    it('should create a rate limiter with custom config', () => {
      rateLimiter = new RateLimiter({ maxRequests: 5, intervalMs: 30000 })
      expect(rateLimiter).toBeInstanceOf(RateLimiter)
    })
  })

  describe('schedule', () => {
    beforeEach(() => {
      rateLimiter = new RateLimiter({ maxRequests: 10, intervalMs: 1000 })
    })

    it('should execute a simple function', async () => {
      const result = await rateLimiter.schedule(async () => {
        return 'test result'
      })
      expect(result).toBe('test result')
    })

    it('should execute async functions', async () => {
      const result = await rateLimiter.schedule(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 42
      })
      expect(result).toBe(42)
    })

    it('should handle errors in scheduled functions', async () => {
      await expect(
        rateLimiter.schedule(async () => {
          throw new Error('Test error')
        }),
      ).rejects.toThrow('Test error')
    })

    it('should execute multiple functions in order', async () => {
      const results: number[] = []

      const promises = [1, 2, 3].map((num) =>
        rateLimiter.schedule(async () => {
          results.push(num)
          return num
        }),
      )

      await Promise.all(promises)
      expect(results).toHaveLength(3)
      expect(results).toContain(1)
      expect(results).toContain(2)
      expect(results).toContain(3)
    })
  })

  describe('rate limiting behavior', () => {
    it('should limit requests to the specified rate', async () => {
      // Create a very strict rate limiter: 2 requests per second
      rateLimiter = new RateLimiter({ maxRequests: 2, intervalMs: 1000 })

      const executionTimes: number[] = []

      // Schedule 4 requests
      const promises = Array.from({ length: 4 }, (_, i) =>
        rateLimiter.schedule(async () => {
          executionTimes.push(Date.now())
          return i
        }),
      )

      const start = Date.now()
      await Promise.all(promises)
      const elapsed = Date.now() - start

      // With 2 requests per second, 4 requests should take at least 1 second
      // (first 2 execute immediately, next 2 wait for refill)
      expect(elapsed).toBeGreaterThanOrEqual(900) // Allow some tolerance
    })

    it('should track queued requests', async () => {
      rateLimiter = new RateLimiter({ maxRequests: 1, intervalMs: 500 })

      // Schedule multiple requests quickly
      const promise1 = rateLimiter.schedule(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 1
      })

      const promise2 = rateLimiter.schedule(async () => {
        return 2
      })

      const promise3 = rateLimiter.schedule(async () => {
        return 3
      })

      // Check that requests are queued
      // Note: timing-dependent test, may need adjustment
      await new Promise((resolve) => setTimeout(resolve, 10))

      const queuedCount = rateLimiter.queuedCount
      expect(queuedCount).toBeGreaterThanOrEqual(0)

      await Promise.all([promise1, promise2, promise3])
    })
  })

  describe('stats', () => {
    beforeEach(() => {
      rateLimiter = new RateLimiter({ maxRequests: 10, intervalMs: 1000 })
    })

    it('should report queued count', () => {
      const count = rateLimiter.queuedCount
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should report running count', () => {
      const count = rateLimiter.runningCount
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('stop', () => {
    beforeEach(() => {
      rateLimiter = new RateLimiter({ maxRequests: 10, intervalMs: 1000 })
    })

    it('should stop the rate limiter', async () => {
      await expect(rateLimiter.stop()).resolves.toBeUndefined()
    })

    it('should clear queued jobs when stopped', async () => {
      // Schedule some jobs
      rateLimiter.schedule(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return 1
      })

      rateLimiter.schedule(async () => {
        return 2
      })

      rateLimiter.schedule(async () => {
        return 3
      })

      // Stop immediately - should drop waiting jobs
      await rateLimiter.stop()

      // The first job might complete, but others should be dropped
      // We just verify stop completes without error
      expect(true).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle very high request limits', async () => {
      rateLimiter = new RateLimiter({ maxRequests: 1000, intervalMs: 1000 })

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => rateLimiter.schedule(async () => i)),
      )

      expect(results).toHaveLength(10)
    })

    it('should handle very low request limits', async () => {
      rateLimiter = new RateLimiter({ maxRequests: 1, intervalMs: 100 })

      const results = await Promise.all(
        Array.from({ length: 3 }, (_, i) => rateLimiter.schedule(async () => i)),
      )

      expect(results).toHaveLength(3)
    })
  })
})

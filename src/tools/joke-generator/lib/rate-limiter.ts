import Bottleneck from 'bottleneck'
import type { RateLimiterConfig } from './types'

/**
 * Rate limiter for API requests using Bottleneck
 * Prevents API abuse by limiting request frequency
 */
export class RateLimiter {
  private limiter: Bottleneck

  constructor(config: RateLimiterConfig = { maxRequests: 10, intervalMs: 60000 }) {
    // Create a Bottleneck limiter with reservoir strategy
    // This allows maxRequests per intervalMs
    this.limiter = new Bottleneck({
      reservoir: config.maxRequests, // Initial number of requests allowed
      reservoirRefreshAmount: config.maxRequests, // Refill to this amount
      reservoirRefreshInterval: config.intervalMs, // Refill interval in ms
      maxConcurrent: 1, // Only one request at a time
      minTime: 100, // Minimum time between requests (100ms)
    })
  }

  /**
   * Schedule a function to run with rate limiting
   * @param fn Function to execute with rate limiting
   * @returns Promise that resolves with the function result
   */
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter.schedule(fn)
  }

  /**
   * Get current number of queued jobs
   */
  get queuedCount(): number {
    return this.limiter.counts().QUEUED
  }

  /**
   * Get current number of running jobs
   */
  get runningCount(): number {
    return this.limiter.counts().RUNNING
  }

  /**
   * Stop the limiter and clear all queued jobs
   */
  async stop(): Promise<void> {
    await this.limiter.stop({ dropWaitingJobs: true })
  }
}

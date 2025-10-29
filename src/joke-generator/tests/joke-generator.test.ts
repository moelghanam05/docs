/**
 * Tests for the joke generator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  JokeGenerator,
  createJokeGenerator,
  getRandomJoke,
  RateLimitError,
  JokeAPIError,
} from '@/joke-generator/lib/joke-generator'
import { RateLimiter } from '@/joke-generator/lib/rate-limiter'
import type { JokeResponse, JokeErrorResponse } from '@/joke-generator/lib/types'

describe('JokeGenerator', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchJoke', () => {
    it('should fetch a single joke successfully', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Why do programmers prefer dark mode? Because light attracts bugs!',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      const joke = await generator.fetchJoke()

      expect(joke).toEqual(mockJoke)
      expect(global.fetch).toHaveBeenCalledOnce()
    })

    it('should fetch a two-part joke successfully', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'twopart',
        setup: 'Why do Java developers wear glasses?',
        delivery: "Because they can't C#!",
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 2,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      const joke = await generator.fetchJoke()

      expect(joke.type).toBe('twopart')
      expect(joke.setup).toBeTruthy()
      expect(joke.delivery).toBeTruthy()
    })

    it('should respect rate limiting', async () => {
      const rateLimiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 })
      const generator = new JokeGenerator(rateLimiter)

      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockJoke,
      })

      // First two requests should succeed
      await generator.fetchJoke()
      await generator.fetchJoke()

      // Third request should fail due to rate limit
      await expect(generator.fetchJoke()).rejects.toThrow(RateLimitError)
    })

    it('should throw RateLimitError with retry information', async () => {
      const rateLimiter = new RateLimiter({ maxRequests: 1, windowMs: 60000 })
      const generator = new JokeGenerator(rateLimiter)

      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockJoke,
      })

      await generator.fetchJoke()

      try {
        await generator.fetchJoke()
        expect.fail('Should have thrown RateLimitError')
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError)
        expect((error as RateLimitError).retryAfter).toBeGreaterThan(0)
      }
    })

    it('should handle API errors', async () => {
      const mockError: JokeErrorResponse = {
        error: true,
        internalError: false,
        code: 106,
        message: 'No matching joke found',
        causedBy: ['No jokes found matching your criteria'],
        timestamp: Date.now(),
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockError,
      })

      const generator = createJokeGenerator()

      await expect(generator.fetchJoke()).rejects.toThrow(JokeAPIError)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const generator = createJokeGenerator()

      await expect(generator.fetchJoke()).rejects.toThrow('Failed to fetch joke')
    })

    it('should handle HTTP errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const generator = createJokeGenerator()

      await expect(generator.fetchJoke()).rejects.toThrow('HTTP error! status: 500')
    })
  })

  describe('getRandomJoke', () => {
    it('should return a formatted single joke', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Why do programmers prefer dark mode?',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      const joke = await generator.getRandomJoke()

      expect(joke).toBe('Why do programmers prefer dark mode?')
    })

    it('should return a formatted two-part joke', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'twopart',
        setup: 'Why do Java developers wear glasses?',
        delivery: "Because they can't C#!",
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 2,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      const joke = await generator.getRandomJoke()

      expect(joke).toBe("Why do Java developers wear glasses?\nBecause they can't C#!")
    })
  })

  describe('getMultipleJokes', () => {
    it('should fetch multiple jokes at once', async () => {
      const mockResponse = {
        error: false,
        amount: 2,
        jokes: [
          {
            error: false,
            category: 'Programming',
            type: 'single',
            joke: 'First joke',
            flags: {
              nsfw: false,
              religious: false,
              political: false,
              racist: false,
              sexist: false,
              explicit: false,
            },
            id: 1,
            safe: true,
            lang: 'en',
          },
          {
            error: false,
            category: 'Programming',
            type: 'twopart',
            setup: 'Setup',
            delivery: 'Punchline',
            flags: {
              nsfw: false,
              religious: false,
              political: false,
              racist: false,
              sexist: false,
              explicit: false,
            },
            id: 2,
            safe: true,
            lang: 'en',
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const generator = createJokeGenerator()
      const jokes = await generator.getMultipleJokes(2)

      expect(jokes).toHaveLength(2)
      expect(jokes[0]).toBe('First joke')
      expect(jokes[1]).toBe('Setup\nPunchline')
    })

    it('should enforce maximum of 10 jokes', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      await generator.getMultipleJokes(15)

      // Check that the fetch was called with amount=10 in the URL
      const fetchCall = (global.fetch as any).mock.calls[0][0]
      expect(fetchCall).toContain('amount=10')
    })

    it('should enforce minimum of 1 joke', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      await generator.getMultipleJokes(0)

      // Check that the fetch was called with amount=1 in the URL
      const fetchCall = (global.fetch as any).mock.calls[0][0]
      expect(fetchCall).toContain('amount=1')
    })
  })

  describe('URL building with options', () => {
    it('should build URL with custom categories', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Pun',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      await generator.fetchJoke({ categories: ['Pun'] })

      const fetchCall = (global.fetch as any).mock.calls[0][0]
      expect(fetchCall).toContain('/Pun?')
    })

    it('should build URL with joke type filter', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      await generator.fetchJoke({ type: 'single' })

      const fetchCall = (global.fetch as any).mock.calls[0][0]
      expect(fetchCall).toContain('type=single')
    })

    it('should build URL with blacklist flags', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      await generator.fetchJoke({ blacklistFlags: ['nsfw', 'religious'] })

      const fetchCall = (global.fetch as any).mock.calls[0][0]
      expect(fetchCall).toContain('blacklistFlags=nsfw,religious')
    })

    it('should build URL with search string', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke about debugging',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      await generator.fetchJoke({ searchString: 'debug' })

      const fetchCall = (global.fetch as any).mock.calls[0][0]
      expect(fetchCall).toContain('contains=debug')
    })

    it('should include safe-mode by default', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJoke,
      })

      const generator = createJokeGenerator()
      await generator.fetchJoke()

      const fetchCall = (global.fetch as any).mock.calls[0][0]
      expect(fetchCall).toContain('safe-mode=true')
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return rate limit status', () => {
      const generator = createJokeGenerator()
      const status = generator.getRateLimitStatus()

      expect(status).toHaveProperty('availableTokens')
      expect(status).toHaveProperty('timeUntilRefill')
      expect(status.availableTokens).toBeGreaterThanOrEqual(0)
      expect(status.timeUntilRefill).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getRandomJoke helper function', () => {
    it('should use a singleton instance', async () => {
      const mockJoke: JokeResponse = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Test joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 1,
        safe: true,
        lang: 'en',
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockJoke,
      })

      const joke1 = await getRandomJoke()
      const joke2 = await getRandomJoke()

      expect(joke1).toBe('Test joke')
      expect(joke2).toBe('Test joke')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })
})

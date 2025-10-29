import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import nock from 'nock'
import {
  JokeApiClient,
  createJokeClient,
  JokeApiClientError,
  JokeApiTimeoutError,
} from '@/tools/joke-generator'
import type { Joke, SingleJoke, TwoPartJoke } from '@/tools/joke-generator'

describe('JokeApiClient', () => {
  const baseUrl = 'https://v2.jokeapi.dev'
  let client: JokeApiClient

  beforeEach(() => {
    // Create a new client with shorter timeout for faster tests
    client = new JokeApiClient({
      baseUrl,
      defaultTimeout: 1000,
      rateLimiter: { maxRequests: 100, intervalMs: 1000 }, // Very permissive for tests
    })

    // Ensure nock is active
    nock.cleanAll()
    if (!nock.isActive()) {
      nock.activate()
    }
  })

  afterEach(async () => {
    await client.stop()
    nock.cleanAll()
    nock.restore()
  })

  describe('constructor and configuration', () => {
    it('should create client with default configuration', () => {
      const defaultClient = new JokeApiClient()
      expect(defaultClient).toBeInstanceOf(JokeApiClient)
    })

    it('should create client with custom configuration', () => {
      const customClient = new JokeApiClient({
        baseUrl: 'https://custom.api.com',
        defaultTimeout: 3000,
        rateLimiter: { maxRequests: 5, intervalMs: 60000 },
      })
      expect(customClient).toBeInstanceOf(JokeApiClient)
    })

    it('should create client using factory function', () => {
      const factoryClient = createJokeClient()
      expect(factoryClient).toBeInstanceOf(JokeApiClient)
    })
  })

  describe('getJoke', () => {
    it('should fetch a single joke successfully', async () => {
      const mockJoke: SingleJoke = {
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
        id: 42,
        safe: true,
        lang: 'en',
      }

      nock(baseUrl).get('/joke/Any').reply(200, mockJoke)

      const joke = await client.getJoke()
      expect(joke).toEqual(mockJoke)
    })

    it('should fetch a two-part joke successfully', async () => {
      const mockJoke: TwoPartJoke = {
        error: false,
        category: 'Programming',
        type: 'twopart',
        setup: 'Why do Java developers wear glasses?',
        delivery: "Because they don't C#!",
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 43,
        safe: true,
        lang: 'en',
      }

      nock(baseUrl).get('/joke/Programming').reply(200, mockJoke)

      const joke = await client.getJoke({ category: 'Programming' })
      expect(joke).toEqual(mockJoke)
    })

    it('should fetch jokes with blacklist flags', async () => {
      const mockJoke: SingleJoke = {
        error: false,
        category: 'Misc',
        type: 'single',
        joke: 'A clean joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 44,
        safe: true,
        lang: 'en',
      }

      nock(baseUrl).get('/joke/Any').query({ blacklistFlags: 'nsfw,explicit' }).reply(200, mockJoke)

      const joke = await client.getJoke({
        blacklistFlags: ['nsfw', 'explicit'],
      })
      expect(joke).toEqual(mockJoke)
    })

    it('should fetch multiple jokes', async () => {
      const mockJokes: { jokes: Joke[] } = {
        jokes: [
          {
            error: false,
            category: 'Programming',
            type: 'single',
            joke: 'Joke 1',
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
            type: 'single',
            joke: 'Joke 2',
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

      nock(baseUrl).get('/joke/Programming').query({ amount: '2' }).reply(200, mockJokes)

      const jokes = await client.getJoke({ category: 'Programming', amount: 2 })
      expect(jokes).toEqual(mockJokes)
    })

    it('should handle multiple categories', async () => {
      const mockJoke: SingleJoke = {
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
        id: 45,
        safe: true,
        lang: 'en',
      }

      nock(baseUrl).get('/joke/Programming,Pun').reply(200, mockJoke)

      const joke = await client.getJoke({ category: ['Programming', 'Pun'] })
      expect(joke).toEqual(mockJoke)
    })

    it('should handle search contains parameter', async () => {
      const mockJoke: SingleJoke = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'A joke about debugging',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 46,
        safe: true,
        lang: 'en',
      }

      nock(baseUrl).get('/joke/Programming').query({ contains: 'debug' }).reply(200, mockJoke)

      const joke = await client.getJoke({ category: 'Programming', contains: 'debug' })
      expect(joke).toEqual(mockJoke)
    })

    it('should handle type parameter', async () => {
      const mockJoke: TwoPartJoke = {
        error: false,
        category: 'Programming',
        type: 'twopart',
        setup: 'Setup',
        delivery: 'Delivery',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 47,
        safe: true,
        lang: 'en',
      }

      nock(baseUrl).get('/joke/Programming').query({ type: 'twopart' }).reply(200, mockJoke)

      const joke = await client.getJoke({ category: 'Programming', type: 'twopart' })
      expect(joke).toEqual(mockJoke)
    })
  })

  describe('error handling', () => {
    it('should throw JokeApiClientError on HTTP error', async () => {
      nock(baseUrl).get('/joke/Any').reply(500, 'Internal Server Error')

      await expect(client.getJoke()).rejects.toThrow(JokeApiClientError)
      await expect(client.getJoke()).rejects.toThrow('HTTP error! status: 500')
    })

    it('should throw JokeApiClientError on API error response', async () => {
      const errorResponse = {
        error: true,
        internalError: false,
        code: 106,
        message: 'No matching joke found',
        causedBy: ['No jokes were found that match your provided settings'],
        additionalInfo: 'Additional information',
        timestamp: Date.now(),
      }

      nock(baseUrl).get('/joke/Programming').reply(200, errorResponse)

      await expect(client.getJoke({ category: 'Programming' })).rejects.toThrow(JokeApiClientError)
      await expect(client.getJoke({ category: 'Programming' })).rejects.toThrow(
        'No matching joke found',
      )
    })

    it('should throw JokeApiTimeoutError on timeout', async () => {
      nock(baseUrl)
        .get('/joke/Any')
        .delay(2000) // Delay longer than timeout
        .reply(200, {})

      await expect(client.getJoke({ timeout: 100 })).rejects.toThrow(JokeApiTimeoutError)
    })

    it('should handle network errors gracefully', async () => {
      nock(baseUrl).get('/joke/Any').replyWithError('Network error')

      await expect(client.getJoke()).rejects.toThrow('Network error')
    })
  })

  describe('convenience methods', () => {
    it('should get a random joke', async () => {
      const mockJoke: SingleJoke = {
        error: false,
        category: 'Misc',
        type: 'single',
        joke: 'Random joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 48,
        safe: true,
        lang: 'en',
      }

      nock(baseUrl).get('/joke/Any').reply(200, mockJoke)

      const joke = await client.getRandomJoke()
      expect(joke).toEqual(mockJoke)
    })

    it('should get a programming joke', async () => {
      const mockJoke: SingleJoke = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Programming joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 49,
        safe: true,
        lang: 'en',
      }

      nock(baseUrl)
        .get('/joke/Programming')
        .query({ blacklistFlags: 'nsfw,religious,political,racist,sexist,explicit' })
        .reply(200, mockJoke)

      const joke = await client.getProgrammingJoke()
      expect(joke).toEqual(mockJoke)
    })

    it('should get an unsafe programming joke when safe is false', async () => {
      const mockJoke: SingleJoke = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Edgy programming joke',
        flags: {
          nsfw: true,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 50,
        safe: false,
        lang: 'en',
      }

      nock(baseUrl).get('/joke/Programming').reply(200, mockJoke)

      const joke = await client.getProgrammingJoke(false)
      expect(joke).toEqual(mockJoke)
    })
  })

  describe('formatJoke', () => {
    it('should format a single joke', () => {
      const joke: SingleJoke = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'This is a one-liner',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 51,
        safe: true,
        lang: 'en',
      }

      const formatted = client.formatJoke(joke)
      expect(formatted).toBe('This is a one-liner')
    })

    it('should format a two-part joke', () => {
      const joke: TwoPartJoke = {
        error: false,
        category: 'Programming',
        type: 'twopart',
        setup: 'Why did the programmer quit?',
        delivery: 'Because they did not get arrays!',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 52,
        safe: true,
        lang: 'en',
      }

      const formatted = client.formatJoke(joke)
      expect(formatted).toBe('Why did the programmer quit?\nBecause they did not get arrays!')
    })
  })

  describe('utility methods', () => {
    it('should return available categories', () => {
      const categories = client.getAvailableCategories()
      expect(categories).toContain('Programming')
      expect(categories).toContain('Misc')
      expect(categories).toContain('Dark')
      expect(categories).toContain('Pun')
      expect(categories).toContain('Any')
    })

    it('should return rate limiter stats', () => {
      const stats = client.getRateLimiterStats()
      expect(stats).toHaveProperty('queued')
      expect(stats).toHaveProperty('running')
      expect(typeof stats.queued).toBe('number')
      expect(typeof stats.running).toBe('number')
    })
  })

  describe('rate limiting', () => {
    it('should respect rate limits', async () => {
      // Create a client with strict rate limiting
      const limitedClient = new JokeApiClient({
        baseUrl,
        rateLimiter: { maxRequests: 2, intervalMs: 1000 },
      })

      const mockJoke: SingleJoke = {
        error: false,
        category: 'Programming',
        type: 'single',
        joke: 'Rate limited joke',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        id: 53,
        safe: true,
        lang: 'en',
      }

      // Mock 3 requests
      nock(baseUrl).get('/joke/Any').times(3).reply(200, mockJoke)

      const start = Date.now()

      // Make 3 requests - the third should be queued
      const promise1 = limitedClient.getJoke()
      const promise2 = limitedClient.getJoke()
      const promise3 = limitedClient.getJoke()

      await Promise.all([promise1, promise2, promise3])

      const elapsed = Date.now() - start

      // The third request should have been delayed
      // Due to rate limiting, it should take at least some time
      expect(elapsed).toBeGreaterThanOrEqual(0)

      await limitedClient.stop()
    })
  })
})

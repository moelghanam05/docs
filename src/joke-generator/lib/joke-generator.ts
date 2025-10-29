/**
 * Random joke generator that fetches jokes from JokeAPI
 * @see https://jokeapi.dev/
 */

import type { JokeResponse, JokeErrorResponse, JokeOptions, JokeCategory } from './types'
import { RateLimiter, createDefaultRateLimiter } from './rate-limiter'

/**
 * Base URL for the JokeAPI
 */
const JOKE_API_BASE_URL = 'https://v2.jokeapi.dev/joke'

/**
 * Default safe categories for jokes
 */
const DEFAULT_SAFE_CATEGORIES: JokeCategory[] = ['Programming', 'Misc', 'Pun']

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter: number,
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Error thrown when joke API returns an error
 */
export class JokeAPIError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly causedBy?: string[],
  ) {
    super(message)
    this.name = 'JokeAPIError'
  }
}

/**
 * Joke generator class that handles fetching jokes from the API
 */
export class JokeGenerator {
  private rateLimiter: RateLimiter
  private apiBaseUrl: string

  /**
   * Create a new joke generator
   * @param rateLimiter - Optional custom rate limiter (defaults to 10 requests per minute)
   * @param apiBaseUrl - Optional custom API base URL (defaults to JokeAPI)
   */
  constructor(rateLimiter?: RateLimiter, apiBaseUrl?: string) {
    this.rateLimiter = rateLimiter || createDefaultRateLimiter()
    this.apiBaseUrl = apiBaseUrl || JOKE_API_BASE_URL
  }

  /**
   * Build the API URL with options
   */
  private buildUrl(options: JokeOptions = {}): string {
    const categories = options.categories?.join(',') || DEFAULT_SAFE_CATEGORIES.join(',')
    const url = `${this.apiBaseUrl}/${categories}`

    const params = new URLSearchParams()

    // Add blacklist flags
    if (options.blacklistFlags && options.blacklistFlags.length > 0) {
      params.append('blacklistFlags', options.blacklistFlags.join(','))
    }

    // Add type filter
    if (options.type) {
      params.append('type', options.type)
    }

    // Add search string
    if (options.searchString) {
      params.append('contains', options.searchString)
    }

    // Add language
    if (options.lang) {
      params.append('lang', options.lang)
    }

    // Add amount (1-10)
    if (options.amount) {
      const amount = Math.max(1, Math.min(10, options.amount))
      params.append('amount', amount.toString())
    }

    // Always request safe jokes by default
    if (!options.blacklistFlags) {
      params.append('safe-mode', 'true')
    }

    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  /**
   * Fetch a joke from the API
   * @param options - Options for fetching the joke
   * @returns A joke response object
   * @throws {RateLimitError} If rate limit is exceeded
   * @throws {JokeAPIError} If the API returns an error
   * @throws {Error} If the network request fails
   */
  async fetchJoke(options: JokeOptions = {}): Promise<JokeResponse> {
    // Check rate limit
    if (!this.rateLimiter.tryConsume()) {
      const retryAfter = this.rateLimiter.getTimeUntilRefill()
      throw new RateLimitError(
        `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
        retryAfter,
      )
    }

    const url = this.buildUrl(options)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GitHub-Docs-JokeGenerator/1.0',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Check if the API returned an error
      if (data.error === true) {
        const errorData = data as JokeErrorResponse
        throw new JokeAPIError(
          errorData.message || 'Unknown API error',
          errorData.code,
          errorData.causedBy,
        )
      }

      return data as JokeResponse
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof JokeAPIError || error instanceof RateLimitError) {
        throw error
      }

      // Wrap other errors
      throw new Error(
        `Failed to fetch joke: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get a random joke as a formatted string
   * @param options - Options for fetching the joke
   * @returns A formatted joke string
   */
  async getRandomJoke(options: JokeOptions = {}): Promise<string> {
    const joke = await this.fetchJoke(options)

    if (joke.type === 'single') {
      return joke.joke || ''
    } else {
      return `${joke.setup}\n${joke.delivery}`
    }
  }

  /**
   * Get multiple jokes at once
   * @param count - Number of jokes to fetch (1-10)
   * @param options - Options for fetching jokes
   * @returns An array of formatted joke strings
   */
  async getMultipleJokes(count: number, options: JokeOptions = {}): Promise<string[]> {
    const amount = Math.max(1, Math.min(10, count))
    const response = await this.fetchJoke({ ...options, amount })

    // When amount > 1, the API returns an object with a 'jokes' array
    if ('jokes' in response && Array.isArray((response as any).jokes)) {
      const jokes = (response as any).jokes as JokeResponse[]
      return jokes.map((joke) => {
        if (joke.type === 'single') {
          return joke.joke || ''
        } else {
          return `${joke.setup}\n${joke.delivery}`
        }
      })
    }

    // Single joke response
    if (response.type === 'single') {
      return [response.joke || '']
    } else {
      return [`${response.setup}\n${response.delivery}`]
    }
  }

  /**
   * Get the current rate limiter status
   */
  getRateLimitStatus(): { availableTokens: number; timeUntilRefill: number } {
    return {
      availableTokens: this.rateLimiter.getAvailableTokens(),
      timeUntilRefill: this.rateLimiter.getTimeUntilRefill(),
    }
  }
}

/**
 * Create a joke generator with default settings
 */
export function createJokeGenerator(): JokeGenerator {
  return new JokeGenerator()
}

/**
 * Quick helper to get a random joke
 * Uses a singleton instance with default settings
 */
let defaultGenerator: JokeGenerator | null = null

export async function getRandomJoke(options: JokeOptions = {}): Promise<string> {
  if (!defaultGenerator) {
    defaultGenerator = createJokeGenerator()
  }
  return defaultGenerator.getRandomJoke(options)
}

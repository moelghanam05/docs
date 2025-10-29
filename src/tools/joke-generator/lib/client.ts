import { RateLimiter } from './rate-limiter'
import type {
  Joke,
  JokeApiError,
  JokeFetchOptions,
  JokeGeneratorConfig,
  JokeCategory,
} from './types'

/**
 * Custom error class for joke API errors
 */
export class JokeApiClientError extends Error {
  constructor(
    message: string,
    public code?: number,
    public causedBy?: string[],
  ) {
    super(message)
    this.name = 'JokeApiClientError'
  }
}

/**
 * Timeout error for API requests
 */
export class JokeApiTimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'JokeApiTimeoutError'
  }
}

/**
 * JokeApiClient - Fetches jokes from JokeAPI (https://jokeapi.dev)
 *
 * Features:
 * - Fetches jokes from various categories (Programming, Misc, Dark, Pun, etc.)
 * - Supports filtering by content flags (nsfw, religious, political, etc.)
 * - Built-in rate limiting to prevent API abuse
 * - Request timeout handling
 * - TypeScript type safety
 *
 * @example
 * ```typescript
 * const client = new JokeApiClient()
 *
 * // Get a programming joke
 * const joke = await client.getJoke({ category: 'Programming' })
 * console.log(joke)
 *
 * // Get a safe joke for work
 * const safeJoke = await client.getJoke({
 *   category: 'Any',
 *   blacklistFlags: ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit']
 * })
 * ```
 */
export class JokeApiClient {
  private readonly baseUrl: string
  private readonly defaultTimeout: number
  private readonly rateLimiter: RateLimiter

  constructor(config: JokeGeneratorConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://v2.jokeapi.dev'
    this.defaultTimeout = config.defaultTimeout || 5000
    this.rateLimiter = new RateLimiter(config.rateLimiter || { maxRequests: 10, intervalMs: 60000 })
  }

  /**
   * Build the API URL with query parameters
   */
  private buildUrl(options: JokeFetchOptions = {}): string {
    const categories = Array.isArray(options.category)
      ? options.category.join(',')
      : options.category || 'Any'

    const params = new URLSearchParams()

    if (options.lang) {
      params.append('lang', options.lang)
    }

    if (options.blacklistFlags && options.blacklistFlags.length > 0) {
      params.append('blacklistFlags', options.blacklistFlags.join(','))
    }

    if (options.type) {
      params.append('type', options.type)
    }

    if (options.contains) {
      params.append('contains', options.contains)
    }

    if (options.amount && options.amount > 1 && options.amount <= 10) {
      params.append('amount', options.amount.toString())
    }

    const queryString = params.toString()
    return `${this.baseUrl}/joke/${categories}${queryString ? `?${queryString}` : ''}`
  }

  /**
   * Fetch data from the API with timeout
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GitHub-Docs-JokeGenerator/1.0',
        },
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        throw new JokeApiTimeoutError(`Request timed out after ${timeout}ms`)
      }
      throw error
    }
  }

  /**
   * Parse and validate the API response
   */
  private async parseResponse(response: Response): Promise<Joke | Joke[]> {
    if (!response.ok) {
      throw new JokeApiClientError(`HTTP error! status: ${response.status}`, response.status)
    }

    const data = await response.json()

    // Check if it's an error response from the API
    if (data.error === true) {
      const errorData = data as JokeApiError
      throw new JokeApiClientError(
        errorData.message || 'API returned an error',
        errorData.code,
        errorData.causedBy,
      )
    }

    return data
  }

  /**
   * Get a single joke or multiple jokes from the API
   *
   * @param options - Configuration options for fetching jokes
   * @returns Promise resolving to a single Joke or array of Jokes
   * @throws {JokeApiClientError} When the API returns an error
   * @throws {JokeApiTimeoutError} When the request times out
   *
   * @example
   * ```typescript
   * // Get a programming joke
   * const joke = await client.getJoke({ category: 'Programming' })
   *
   * // Get multiple safe jokes
   * const jokes = await client.getJoke({
   *   category: 'Pun',
   *   amount: 5,
   *   blacklistFlags: ['nsfw', 'explicit']
   * })
   *
   * // Search for specific content
   * const searchJoke = await client.getJoke({
   *   category: 'Programming',
   *   contains: 'debug'
   * })
   * ```
   */
  async getJoke(options: JokeFetchOptions = {}): Promise<Joke | Joke[]> {
    const url = this.buildUrl(options)
    const timeout = options.timeout || this.defaultTimeout

    return this.rateLimiter.schedule(async () => {
      const response = await this.fetchWithTimeout(url, timeout)
      return this.parseResponse(response)
    })
  }

  /**
   * Get a random joke from any category
   * Convenience method that always returns a single joke
   *
   * @returns Promise resolving to a single Joke
   */
  async getRandomJoke(): Promise<Joke> {
    const result = await this.getJoke({ category: 'Any' })
    return Array.isArray(result) ? result[0] : result
  }

  /**
   * Get a programming joke
   * Convenience method for programming-related jokes
   *
   * @param safe - If true, excludes potentially offensive content
   * @returns Promise resolving to a single Joke
   */
  async getProgrammingJoke(safe: boolean = true): Promise<Joke> {
    const options: JokeFetchOptions = { category: 'Programming' }

    if (safe) {
      options.blacklistFlags = ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit']
    }

    const result = await this.getJoke(options)
    return Array.isArray(result) ? result[0] : result
  }

  /**
   * Format a joke as a human-readable string
   *
   * @param joke - The joke to format
   * @returns Formatted joke string
   */
  formatJoke(joke: Joke): string {
    if (joke.type === 'single') {
      return joke.joke
    } else {
      return `${joke.setup}\n${joke.delivery}`
    }
  }

  /**
   * Get available joke categories
   *
   * @returns Array of available joke categories
   */
  getAvailableCategories(): JokeCategory[] {
    return ['Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas', 'Any']
  }

  /**
   * Get rate limiter statistics
   *
   * @returns Object with queued and running request counts
   */
  getRateLimiterStats(): { queued: number; running: number } {
    return {
      queued: this.rateLimiter.queuedCount,
      running: this.rateLimiter.runningCount,
    }
  }

  /**
   * Stop the rate limiter and clear queued requests
   */
  async stop(): Promise<void> {
    await this.rateLimiter.stop()
  }
}

/**
 * Create a new JokeApiClient instance
 * Factory function for convenience
 *
 * @param config - Optional configuration
 * @returns New JokeApiClient instance
 */
export function createJokeClient(config?: JokeGeneratorConfig): JokeApiClient {
  return new JokeApiClient(config)
}

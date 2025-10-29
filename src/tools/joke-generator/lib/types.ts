/**
 * Type definitions for the Joke Generator module
 */

/**
 * Supported joke categories
 */
export type JokeCategory = 'Programming' | 'Misc' | 'Dark' | 'Pun' | 'Spooky' | 'Christmas' | 'Any'

/**
 * Joke delivery format types
 */
export type JokeType = 'single' | 'twopart'

/**
 * Flags for joke content filtering
 */
export interface JokeFlags {
  nsfw: boolean
  religious: boolean
  political: boolean
  racist: boolean
  sexist: boolean
  explicit: boolean
}

/**
 * Base joke interface
 */
export interface BaseJoke {
  error: boolean
  category: JokeCategory
  type: JokeType
  flags: JokeFlags
  id: number
  safe: boolean
  lang: string
}

/**
 * Single-part joke (one-liner)
 */
export interface SingleJoke extends BaseJoke {
  type: 'single'
  joke: string
}

/**
 * Two-part joke (setup and delivery)
 */
export interface TwoPartJoke extends BaseJoke {
  type: 'twopart'
  setup: string
  delivery: string
}

/**
 * Union type for all joke formats
 */
export type Joke = SingleJoke | TwoPartJoke

/**
 * API error response
 */
export interface JokeApiError {
  error: true
  internalError: boolean
  code: number
  message: string
  causedBy: string[]
  additionalInfo: string
  timestamp: number
}

/**
 * Configuration options for fetching jokes
 */
export interface JokeFetchOptions {
  /**
   * Joke category to fetch from (default: 'Any')
   */
  category?: JokeCategory | JokeCategory[]

  /**
   * Language code (default: 'en')
   */
  lang?: string

  /**
   * Flags to blacklist certain content
   */
  blacklistFlags?: Array<keyof JokeFlags>

  /**
   * Joke type to fetch (default: any type)
   */
  type?: JokeType

  /**
   * Search string to filter jokes
   */
  contains?: string

  /**
   * Number of jokes to fetch (1-10, default: 1)
   */
  amount?: number

  /**
   * Request timeout in milliseconds (default: 5000)
   */
  timeout?: number
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /**
   * Maximum requests per interval
   */
  maxRequests: number

  /**
   * Time interval in milliseconds
   */
  intervalMs: number
}

/**
 * Joke generator configuration
 */
export interface JokeGeneratorConfig {
  /**
   * Base URL for the JokeAPI (default: 'https://v2.jokeapi.dev')
   */
  baseUrl?: string

  /**
   * Default timeout for API requests in milliseconds (default: 5000)
   */
  defaultTimeout?: number

  /**
   * Rate limiter configuration
   */
  rateLimiter?: RateLimiterConfig
}

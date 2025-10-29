/**
 * Types and interfaces for the joke generator module
 */

/**
 * Type of joke delivery
 */
export type JokeType = 'single' | 'twopart'

/**
 * Categories of jokes available
 */
export type JokeCategory = 'Programming' | 'Misc' | 'Dark' | 'Pun' | 'Spooky' | 'Christmas'

/**
 * Flags that may be present in jokes
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
 * Single-line joke format
 */
export interface SingleJoke {
  type: 'single'
  joke: string
}

/**
 * Two-part joke format (setup and delivery)
 */
export interface TwoPartJoke {
  type: 'twopart'
  setup: string
  delivery: string
}

/**
 * Complete joke response from the API
 */
export interface JokeResponse {
  error: boolean
  category: JokeCategory
  type: JokeType
  joke?: string
  setup?: string
  delivery?: string
  flags: JokeFlags
  id: number
  safe: boolean
  lang: string
}

/**
 * Error response from the API
 */
export interface JokeErrorResponse {
  error: boolean
  internalError: boolean
  code: number
  message: string
  causedBy: string[]
  additionalInfo?: string
  timestamp: number
}

/**
 * Options for fetching jokes
 */
export interface JokeOptions {
  /** Categories to include (default: all safe categories) */
  categories?: JokeCategory[]
  /** Blacklist flags to exclude jokes with specific content */
  blacklistFlags?: Array<keyof JokeFlags>
  /** Type of joke to fetch */
  type?: JokeType
  /** Search string to filter jokes */
  searchString?: string
  /** Language code (default: 'en') */
  lang?: string
  /** Amount of jokes to fetch (1-10, default: 1) */
  amount?: number
}

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  tokens: number
  lastRefill: number
}

/**
 * Configuration for the rate limiter
 */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

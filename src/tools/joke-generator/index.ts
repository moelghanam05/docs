/**
 * Random Joke Generator Module
 *
 * This module provides functionality to fetch jokes from the JokeAPI (https://jokeapi.dev).
 * It includes built-in rate limiting, error handling, and TypeScript support.
 *
 * @example Basic usage
 * ```typescript
 * import { JokeApiClient } from '@/tools/joke-generator'
 *
 * const client = new JokeApiClient()
 * const joke = await client.getRandomJoke()
 * console.log(client.formatJoke(joke))
 * ```
 *
 * @example Advanced usage with options
 * ```typescript
 * import { JokeApiClient } from '@/tools/joke-generator'
 *
 * const client = new JokeApiClient({
 *   defaultTimeout: 3000,
 *   rateLimiter: { maxRequests: 5, intervalMs: 60000 }
 * })
 *
 * const jokes = await client.getJoke({
 *   category: ['Programming', 'Pun'],
 *   blacklistFlags: ['nsfw', 'explicit'],
 *   amount: 3
 * })
 * ```
 */

export {
  JokeApiClient,
  createJokeClient,
  JokeApiClientError,
  JokeApiTimeoutError,
} from './lib/client'
export { RateLimiter } from './lib/rate-limiter'
export type {
  Joke,
  SingleJoke,
  TwoPartJoke,
  JokeCategory,
  JokeType,
  JokeFlags,
  JokeFetchOptions,
  JokeGeneratorConfig,
  RateLimiterConfig,
  JokeApiError,
} from './lib/types'

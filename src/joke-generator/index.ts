/**
 * Random Joke Generator Module
 *
 * A module for fetching random jokes from JokeAPI with built-in rate limiting
 * and error handling.
 *
 * @example
 * ```typescript
 * import { getRandomJoke, createJokeGenerator } from '@/joke-generator'
 *
 * // Quick usage with default settings
 * const joke = await getRandomJoke()
 * console.log(joke)
 *
 * // Advanced usage with custom options
 * const generator = createJokeGenerator()
 * const programmingJoke = await generator.getRandomJoke({
 *   categories: ['Programming'],
 *   type: 'single'
 * })
 * ```
 */

export {
  JokeGenerator,
  createJokeGenerator,
  getRandomJoke,
  RateLimitError,
  JokeAPIError,
} from './lib/joke-generator'

export { RateLimiter, createDefaultRateLimiter } from './lib/rate-limiter'

export type {
  JokeResponse,
  JokeErrorResponse,
  JokeOptions,
  JokeType,
  JokeCategory,
  JokeFlags,
  SingleJoke,
  TwoPartJoke,
  RateLimiterConfig,
  RateLimiterState,
} from './lib/types'

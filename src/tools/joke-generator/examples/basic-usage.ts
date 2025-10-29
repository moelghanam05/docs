/**
 * Example usage of the Joke Generator module
 *
 * This script demonstrates various ways to use the JokeApiClient
 * to fetch and display jokes.
 *
 * Run with: tsx src/tools/joke-generator/examples/basic-usage.ts
 */

import {
  JokeApiClient,
  createJokeClient,
  JokeApiClientError,
  JokeApiTimeoutError,
} from '@/tools/joke-generator'

/**
 * Example 1: Simple random joke
 */
async function example1() {
  console.log('\n=== Example 1: Random Joke ===')
  const client = new JokeApiClient()

  try {
    const joke = await client.getRandomJoke()
    console.log(`\nCategory: ${joke.category}`)
    console.log(`Joke:\n${client.formatJoke(joke)}\n`)
  } catch (error) {
    console.error('Error fetching joke:', error)
  } finally {
    await client.stop()
  }
}

/**
 * Example 2: Programming joke
 */
async function example2() {
  console.log('\n=== Example 2: Safe Programming Joke ===')
  const client = createJokeClient()

  try {
    const joke = await client.getProgrammingJoke()
    console.log(`\nJoke:\n${client.formatJoke(joke)}\n`)
  } catch (error) {
    console.error('Error fetching joke:', error)
  } finally {
    await client.stop()
  }
}

/**
 * Example 3: Multiple jokes with filters
 */
async function example3() {
  console.log('\n=== Example 3: Multiple Safe Jokes ===')
  const client = new JokeApiClient()

  try {
    const result = await client.getJoke({
      category: ['Programming', 'Pun'],
      blacklistFlags: ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit'],
      amount: 3,
    })

    const jokes = Array.isArray(result) ? result : [result]

    jokes.forEach((joke, index) => {
      console.log(`\nJoke ${index + 1} (${joke.category}):`)
      console.log(client.formatJoke(joke))
    })
    console.log()
  } catch (error) {
    console.error('Error fetching jokes:', error)
  } finally {
    await client.stop()
  }
}

/**
 * Example 4: Error handling
 */
async function example4() {
  console.log('\n=== Example 4: Error Handling ===')
  const client = new JokeApiClient({ defaultTimeout: 5000 })

  try {
    // Try to fetch a joke with very specific criteria that might not exist
    const joke = await client.getJoke({
      category: 'Programming',
      contains: 'nonexistent-search-term-that-will-not-match-anything',
    })

    console.log(`\nJoke:\n${client.formatJoke(joke)}\n`)
  } catch (error) {
    if (error instanceof JokeApiClientError) {
      console.error('\n❌ API Error:', error.message)
      if (error.code) {
        console.error('Error Code:', error.code)
      }
      if (error.causedBy) {
        console.error('Caused by:', error.causedBy)
      }
    } else if (error instanceof JokeApiTimeoutError) {
      console.error('\n⏱️  Timeout Error:', error.message)
    } else {
      console.error('\n❌ Unexpected Error:', error)
    }
  } finally {
    await client.stop()
  }
}

/**
 * Example 5: Custom configuration with rate limiting
 */
async function example5() {
  console.log('\n=== Example 5: Rate Limiting Demo ===')

  // Create a client with strict rate limiting
  const client = new JokeApiClient({
    defaultTimeout: 3000,
    rateLimiter: {
      maxRequests: 3, // Only 3 requests
      intervalMs: 10000, // per 10 seconds
    },
  })

  try {
    console.log('\nFetching 5 jokes with rate limiting (3 per 10 seconds)...')
    const startTime = Date.now()

    // Fetch 5 jokes - the last 2 will be rate limited
    for (let i = 0; i < 5; i++) {
      const joke = await client.getJoke({ category: 'Programming' })
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      console.log(`\n[${elapsed}s] Joke ${i + 1}:`)
      console.log(client.formatJoke(joke))

      const stats = client.getRateLimiterStats()
      console.log(`Rate limiter - Queued: ${stats.queued}, Running: ${stats.running}`)
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✅ Completed in ${totalTime} seconds`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.stop()
  }
}

/**
 * Example 6: Available categories
 */
async function example6() {
  console.log('\n=== Example 6: Available Categories ===')
  const client = new JokeApiClient()

  const categories = client.getAvailableCategories()
  console.log('\nAvailable joke categories:')
  categories.forEach((category) => {
    console.log(`  - ${category}`)
  })

  await client.stop()
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('╔═══════════════════════════════════════════╗')
  console.log('║   Joke Generator Module - Examples       ║')
  console.log('╚═══════════════════════════════════════════╝')

  // Run examples sequentially
  await example1()
  await example2()
  await example3()
  await example4()
  await example6()

  // Skip example 5 by default as it takes 10+ seconds
  // Uncomment the line below to see rate limiting in action
  // await example5()

  console.log('\n✨ All examples completed!\n')
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { example1, example2, example3, example4, example5, example6 }

#!/usr/bin/env tsx
/**
 * Example script demonstrating the joke generator functionality
 * Run with: npx tsx src/joke-generator/examples/demo.ts
 */

import {
  JokeGenerator,
  createJokeGenerator,
  getRandomJoke,
  RateLimitError,
  JokeAPIError,
  RateLimiter,
} from '@/joke-generator'

console.log('🎉 Joke Generator Demo\n')
console.log('='.repeat(60))

/**
 * Example 1: Quick usage with default settings
 */
async function example1() {
  console.log('\n📝 Example 1: Quick Random Joke\n')

  try {
    const joke = await getRandomJoke()
    console.log(joke)
  } catch (error) {
    console.error('Error:', error)
  }
}

/**
 * Example 2: Programming jokes only
 */
async function example2() {
  console.log('\n📝 Example 2: Programming Joke\n')

  const generator = createJokeGenerator()

  try {
    const joke = await generator.getRandomJoke({
      categories: ['Programming'],
      type: 'single',
    })
    console.log(joke)
  } catch (error) {
    console.error('Error:', error)
  }
}

/**
 * Example 3: Multiple jokes
 */
async function example3() {
  console.log('\n📝 Example 3: Multiple Jokes\n')

  const generator = createJokeGenerator()

  try {
    const jokes = await generator.getMultipleJokes(3, {
      categories: ['Programming', 'Misc'],
    })

    jokes.forEach((joke, index) => {
      console.log(`${index + 1}. ${joke}`)
      console.log('-'.repeat(60))
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

/**
 * Example 4: Rate limiting demonstration
 */
async function example4() {
  console.log('\n📝 Example 4: Rate Limiting Demo\n')

  // Create a strict rate limiter: 3 requests per 30 seconds
  const strictLimiter = new RateLimiter({
    maxRequests: 3,
    windowMs: 30000,
  })

  const generator = new JokeGenerator(strictLimiter)

  console.log('Attempting 5 requests (limit: 3 per 30s)...\n')

  for (let i = 1; i <= 5; i++) {
    try {
      const joke = await generator.getRandomJoke()
      console.log(`${i}. ✅ Success: ${joke.substring(0, 50)}...`)
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.log(
          `${i}. ❌ Rate limit reached! Retry after ${Math.ceil(error.retryAfter / 1000)}s`,
        )
      } else {
        console.log(`${i}. ❌ Error: ${error}`)
      }
    }
  }

  // Show rate limit status
  const status = generator.getRateLimitStatus()
  console.log(`\n📊 Status: ${status.availableTokens} tokens available`)
}

/**
 * Example 5: Error handling
 */
async function example5() {
  console.log('\n📝 Example 5: Error Handling\n')

  const generator = createJokeGenerator()

  try {
    // Try to search for a joke that doesn't exist
    const joke = await generator.getRandomJoke({
      searchString: 'this-string-definitely-does-not-exist-in-any-joke-12345',
    })
    console.log(joke)
  } catch (error) {
    if (error instanceof JokeAPIError) {
      console.log('❌ API Error detected:')
      console.log(`   Code: ${error.code}`)
      console.log(`   Message: ${error.message}`)
      if (error.causedBy) {
        console.log(`   Caused by: ${error.causedBy.join(', ')}`)
      }
    } else if (error instanceof RateLimitError) {
      console.log('❌ Rate limit error:', error.message)
    } else {
      console.log('❌ Unknown error:', error)
    }
  }
}

/**
 * Run all examples
 */
async function main() {
  try {
    await example1()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await example2()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await example3()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await example4()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await example5()

    console.log('\n' + '='.repeat(60))
    console.log('✅ Demo completed!\n')
  } catch (error) {
    console.error('\n❌ Demo failed:', error)
    process.exit(1)
  }
}

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

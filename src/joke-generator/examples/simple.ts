#!/usr/bin/env tsx
/**
 * Simple example demonstrating basic joke generator usage
 * Run with: npx tsx src/joke-generator/examples/simple.ts
 */

import { getRandomJoke, createJokeGenerator } from '@/joke-generator'

async function main() {
  console.log('🎭 Simple Joke Generator Example\n')

  // Example 1: Quick usage
  console.log('Getting a random joke...')
  try {
    const joke = await getRandomJoke()
    console.log(`\n${joke}\n`)
  } catch (error) {
    console.error('Failed to get joke:', error instanceof Error ? error.message : error)
  }

  // Example 2: Get a programming joke
  console.log('Getting a programming joke...')
  const generator = createJokeGenerator()
  try {
    const programmingJoke = await generator.getRandomJoke({
      categories: ['Programming'],
    })
    console.log(`\n${programmingJoke}\n`)
  } catch (error) {
    console.error('Failed to get joke:', error instanceof Error ? error.message : error)
  }

  // Example 3: Check rate limit status
  const status = generator.getRateLimitStatus()
  console.log(`Rate limit: ${status.availableTokens} requests remaining`)
}

main()

# Random Joke Generator Module

A TypeScript module for fetching jokes from the [JokeAPI](https://jokeapi.dev) with built-in rate limiting, error handling, and comprehensive type safety.

## Features

- 🎭 **Multiple Joke Categories**: Programming, Misc, Dark, Pun, Spooky, Christmas
- 🛡️ **Content Filtering**: Blacklist jokes with specific flags (NSFW, religious, political, etc.)
- ⏱️ **Rate Limiting**: Built-in rate limiter to prevent API abuse
- ⚡ **Timeout Handling**: Configurable request timeouts
- 🔒 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🧪 **Well Tested**: Comprehensive unit test coverage
- 🎯 **Easy to Use**: Simple API with convenience methods

## Installation

This module is part of the GitHub Docs repository and uses existing dependencies.

```typescript
import { JokeApiClient } from '@/tools/joke-generator'
```

## Quick Start

### Basic Usage

```typescript
import { JokeApiClient } from '@/tools/joke-generator'

// Create a client
const client = new JokeApiClient()

// Get a random joke
const joke = await client.getRandomJoke()
console.log(client.formatJoke(joke))
```

### Get a Programming Joke

```typescript
// Get a safe programming joke
const programmingJoke = await client.getProgrammingJoke()
console.log(client.formatJoke(programmingJoke))

// Get any programming joke (including potentially offensive ones)
const anyProgrammingJoke = await client.getProgrammingJoke(false)
console.log(client.formatJoke(anyProgrammingJoke))
```

### Advanced Usage with Options

```typescript
// Fetch jokes with specific options
const jokes = await client.getJoke({
  category: ['Programming', 'Pun'],
  blacklistFlags: ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit'],
  type: 'twopart',
  amount: 5,
  contains: 'debug',
})
```

## API Reference

### JokeApiClient

Main client for fetching jokes from the JokeAPI.

#### Constructor

```typescript
new JokeApiClient(config?: JokeGeneratorConfig)
```

**Configuration Options:**

```typescript
interface JokeGeneratorConfig {
  baseUrl?: string // Default: 'https://v2.jokeapi.dev'
  defaultTimeout?: number // Default: 5000 (milliseconds)
  rateLimiter?: RateLimiterConfig // Rate limiting configuration
}

interface RateLimiterConfig {
  maxRequests: number // Maximum requests per interval
  intervalMs: number // Time interval in milliseconds
}
```

**Example:**

```typescript
const client = new JokeApiClient({
  defaultTimeout: 3000,
  rateLimiter: {
    maxRequests: 10,
    intervalMs: 60000, // 10 requests per minute
  },
})
```

#### Methods

##### `getJoke(options?: JokeFetchOptions): Promise<Joke | Joke[]>`

Fetch jokes with specific options.

**Options:**

```typescript
interface JokeFetchOptions {
  category?: JokeCategory | JokeCategory[] // Default: 'Any'
  lang?: string // Default: 'en'
  blacklistFlags?: Array<keyof JokeFlags> // Content filters
  type?: 'single' | 'twopart' // Joke format
  contains?: string // Search string
  amount?: number // 1-10, default: 1
  timeout?: number // Request timeout in milliseconds
}
```

**Example:**

```typescript
// Get a single safe programming joke
const joke = await client.getJoke({
  category: 'Programming',
  blacklistFlags: ['nsfw', 'explicit'],
})

// Get multiple jokes from different categories
const jokes = await client.getJoke({
  category: ['Programming', 'Pun', 'Misc'],
  amount: 5,
})

// Search for specific content
const debugJoke = await client.getJoke({
  category: 'Programming',
  contains: 'debug',
})
```

##### `getRandomJoke(): Promise<Joke>`

Get a random joke from any category.

```typescript
const joke = await client.getRandomJoke()
```

##### `getProgrammingJoke(safe?: boolean): Promise<Joke>`

Get a programming joke. If `safe` is true (default), excludes potentially offensive content.

```typescript
const safeJoke = await client.getProgrammingJoke()
const anyJoke = await client.getProgrammingJoke(false)
```

##### `formatJoke(joke: Joke): string`

Format a joke as a human-readable string.

```typescript
const joke = await client.getRandomJoke()
const formatted = client.formatJoke(joke)
console.log(formatted)
```

##### `getAvailableCategories(): JokeCategory[]`

Get list of available joke categories.

```typescript
const categories = client.getAvailableCategories()
// ['Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas', 'Any']
```

##### `getRateLimiterStats(): { queued: number; running: number }`

Get current rate limiter statistics.

```typescript
const stats = client.getRateLimiterStats()
console.log(`Queued: ${stats.queued}, Running: ${stats.running}`)
```

##### `stop(): Promise<void>`

Stop the rate limiter and clear queued requests.

```typescript
await client.stop()
```

### Factory Function

```typescript
createJokeClient(config?: JokeGeneratorConfig): JokeApiClient
```

Convenience factory function to create a new client.

```typescript
import { createJokeClient } from '@/tools/joke-generator'

const client = createJokeClient({
  defaultTimeout: 3000,
})
```

## Types

### Joke Categories

```typescript
type JokeCategory = 'Programming' | 'Misc' | 'Dark' | 'Pun' | 'Spooky' | 'Christmas' | 'Any'
```

### Joke Types

```typescript
type JokeType = 'single' | 'twopart'
```

### Joke Structure

```typescript
// Single-line joke
interface SingleJoke {
  type: 'single'
  joke: string
  category: JokeCategory
  flags: JokeFlags
  id: number
  safe: boolean
  lang: string
}

// Two-part joke (setup and delivery)
interface TwoPartJoke {
  type: 'twopart'
  setup: string
  delivery: string
  category: JokeCategory
  flags: JokeFlags
  id: number
  safe: boolean
  lang: string
}

type Joke = SingleJoke | TwoPartJoke
```

### Content Flags

```typescript
interface JokeFlags {
  nsfw: boolean
  religious: boolean
  political: boolean
  racist: boolean
  sexist: boolean
  explicit: boolean
}
```

## Error Handling

The module provides specific error types for different failure scenarios:

### JokeApiClientError

Thrown when the API returns an error or HTTP request fails.

```typescript
try {
  const joke = await client.getJoke({ contains: 'nonexistent' })
} catch (error) {
  if (error instanceof JokeApiClientError) {
    console.error(`API Error: ${error.message}`)
    console.error(`Error Code: ${error.code}`)
  }
}
```

### JokeApiTimeoutError

Thrown when a request times out.

```typescript
try {
  const joke = await client.getJoke({ timeout: 1000 })
} catch (error) {
  if (error instanceof JokeApiTimeoutError) {
    console.error('Request timed out')
  }
}
```

## Rate Limiting

The module includes built-in rate limiting using the [Bottleneck](https://github.com/SGrondin/bottleneck) library to prevent API abuse.

**Default Rate Limit:** 10 requests per 60 seconds

**Custom Rate Limiting:**

```typescript
const client = new JokeApiClient({
  rateLimiter: {
    maxRequests: 5, // 5 requests
    intervalMs: 60000, // per minute
  },
})
```

**Monitoring Rate Limiter:**

```typescript
const stats = client.getRateLimiterStats()
console.log(`Queued requests: ${stats.queued}`)
console.log(`Running requests: ${stats.running}`)
```

## Examples

### Example 1: Simple Random Joke

```typescript
import { JokeApiClient } from '@/tools/joke-generator'

const client = new JokeApiClient()
const joke = await client.getRandomJoke()

console.log(client.formatJoke(joke))
```

### Example 2: Safe Jokes for Work

```typescript
const client = new JokeApiClient()

const joke = await client.getJoke({
  category: 'Programming',
  blacklistFlags: ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit'],
})

console.log(client.formatJoke(joke))
```

### Example 3: Batch Fetching Multiple Jokes

```typescript
const client = new JokeApiClient()

const jokes = await client.getJoke({
  category: ['Programming', 'Pun'],
  amount: 10,
  type: 'twopart',
})

if (Array.isArray(jokes)) {
  jokes.forEach((joke, index) => {
    console.log(`\nJoke ${index + 1}:`)
    console.log(client.formatJoke(joke))
  })
}
```

### Example 4: Error Handling

```typescript
import { JokeApiClient, JokeApiClientError, JokeApiTimeoutError } from '@/tools/joke-generator'

const client = new JokeApiClient({ defaultTimeout: 3000 })

try {
  const joke = await client.getJoke({
    category: 'Programming',
    contains: 'specific-term',
  })
  console.log(client.formatJoke(joke))
} catch (error) {
  if (error instanceof JokeApiTimeoutError) {
    console.error('Request timed out - please try again')
  } else if (error instanceof JokeApiClientError) {
    console.error(`API Error: ${error.message}`)
    if (error.code === 106) {
      console.error('No matching jokes found')
    }
  } else {
    console.error('Unexpected error:', error)
  }
}
```

### Example 5: Custom Configuration with Strict Rate Limiting

```typescript
const client = new JokeApiClient({
  baseUrl: 'https://v2.jokeapi.dev',
  defaultTimeout: 5000,
  rateLimiter: {
    maxRequests: 3, // Only 3 requests
    intervalMs: 60000, // per minute
  },
})

// All requests will be rate-limited
for (let i = 0; i < 5; i++) {
  const joke = await client.getJoke()
  console.log(`Joke ${i + 1}: ${client.formatJoke(joke)}`)
}

// Clean up when done
await client.stop()
```

## Testing

The module includes comprehensive unit tests using Vitest and nock for HTTP mocking.

**Run tests:**

```bash
npm test -- src/tools/joke-generator/tests
```

**Run specific test file:**

```bash
npm test -- src/tools/joke-generator/tests/client.test.ts
```

## Dependencies

- **bottleneck**: Rate limiting
- **vitest**: Testing framework
- **nock**: HTTP request mocking for tests

All dependencies are already included in the repository's `package.json`.

## API Credits

This module uses the [JokeAPI](https://jokeapi.dev) by Sven Fehler. JokeAPI is a free REST API that serves uniformly and well-formatted jokes.

## License

This module is part of the GitHub Docs repository and follows the same license: MIT AND CC-BY-4.0.

## Contributing

Contributions are welcome! Please follow the existing code style and ensure all tests pass before submitting a pull request.

1. Make your changes
2. Add tests for new functionality
3. Run `npm run tsc` to check TypeScript
4. Run `npm test` to ensure tests pass
5. Run `npm run prettier` to format code
6. Submit a pull request

## Support

For issues related to:
- **This module**: Open an issue in the GitHub Docs repository
- **JokeAPI**: Visit [JokeAPI documentation](https://jokeapi.dev)

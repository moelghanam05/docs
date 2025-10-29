# Random Joke Generator Module

A TypeScript module for fetching random jokes from [JokeAPI](https://jokeapi.dev/) with built-in rate limiting, error handling, and TypeScript support.

## Features

- 🎯 **Easy to use**: Simple API for fetching random jokes
- 🛡️ **Rate limiting**: Built-in protection against API abuse
- 🔒 **Type-safe**: Full TypeScript support with comprehensive types
- ⚡ **Async/await**: Modern asynchronous API
- 🎨 **Flexible**: Customizable categories, filters, and options
- 🚨 **Error handling**: Comprehensive error handling with custom error types
- 🧪 **Well-tested**: Comprehensive unit tests with high coverage

## Installation

The module is part of the GitHub Docs codebase and can be imported using the `@/` alias:

```typescript
import { getRandomJoke, createJokeGenerator } from '@/joke-generator'
```

## Quick Start

### Basic Usage

Get a random joke with default settings (safe, programming-related jokes):

```typescript
import { getRandomJoke } from '@/joke-generator'

// Simple async function
async function tellMeAJoke() {
  try {
    const joke = await getRandomJoke()
    console.log(joke)
  } catch (error) {
    console.error('Failed to get joke:', error)
  }
}

tellMeAJoke()
```

### Advanced Usage

Create a custom joke generator with specific options:

```typescript
import { createJokeGenerator } from '@/joke-generator'

const generator = createJokeGenerator()

// Get a programming joke
const programmingJoke = await generator.getRandomJoke({
  categories: ['Programming'],
  type: 'single'
})

// Get a pun
const pun = await generator.getRandomJoke({
  categories: ['Pun'],
  type: 'twopart'
})

// Get multiple jokes at once
const jokes = await generator.getMultipleJokes(3, {
  categories: ['Programming', 'Misc']
})

jokes.forEach((joke, index) => {
  console.log(`Joke ${index + 1}: ${joke}\n`)
})
```

## API Reference

### Functions

#### `getRandomJoke(options?: JokeOptions): Promise<string>`

Quick helper function to get a random joke using a singleton instance.

**Parameters:**
- `options` (optional): Configuration options for the joke request

**Returns:** A promise that resolves to a formatted joke string

**Example:**
```typescript
const joke = await getRandomJoke({ categories: ['Programming'] })
console.log(joke)
```

#### `createJokeGenerator(): JokeGenerator`

Creates a new joke generator instance with default settings.

**Returns:** A new `JokeGenerator` instance

**Example:**
```typescript
const generator = createJokeGenerator()
```

### Classes

#### `JokeGenerator`

Main class for fetching jokes from the API.

##### Constructor

```typescript
new JokeGenerator(rateLimiter?: RateLimiter, apiBaseUrl?: string)
```

**Parameters:**
- `rateLimiter` (optional): Custom rate limiter instance
- `apiBaseUrl` (optional): Custom API base URL

**Example:**
```typescript
import { JokeGenerator, RateLimiter } from '@/joke-generator'

// Create custom rate limiter: 5 requests per 30 seconds
const customLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 30000
})

const generator = new JokeGenerator(customLimiter)
```

##### Methods

###### `fetchJoke(options?: JokeOptions): Promise<JokeResponse>`

Fetches a joke from the API and returns the raw response object.

**Parameters:**
- `options` (optional): Configuration options for the joke request

**Returns:** A promise that resolves to a `JokeResponse` object

**Throws:**
- `RateLimitError`: If rate limit is exceeded
- `JokeAPIError`: If the API returns an error
- `Error`: If the network request fails

**Example:**
```typescript
const response = await generator.fetchJoke({
  categories: ['Programming'],
  type: 'single'
})

console.log('Category:', response.category)
console.log('Joke:', response.joke)
```

###### `getRandomJoke(options?: JokeOptions): Promise<string>`

Gets a random joke as a formatted string.

**Parameters:**
- `options` (optional): Configuration options for the joke request

**Returns:** A promise that resolves to a formatted joke string

**Example:**
```typescript
const joke = await generator.getRandomJoke({
  categories: ['Pun'],
  blacklistFlags: ['nsfw', 'religious']
})
console.log(joke)
```

###### `getMultipleJokes(count: number, options?: JokeOptions): Promise<string[]>`

Gets multiple jokes at once (max 10).

**Parameters:**
- `count`: Number of jokes to fetch (1-10)
- `options` (optional): Configuration options for the joke requests

**Returns:** A promise that resolves to an array of formatted joke strings

**Example:**
```typescript
const jokes = await generator.getMultipleJokes(5, {
  categories: ['Programming', 'Misc']
})

jokes.forEach((joke, i) => console.log(`${i + 1}. ${joke}\n`))
```

###### `getRateLimitStatus(): { availableTokens: number; timeUntilRefill: number }`

Gets the current rate limit status.

**Returns:** An object with:
- `availableTokens`: Number of available API calls
- `timeUntilRefill`: Time until rate limit resets (in milliseconds)

**Example:**
```typescript
const status = generator.getRateLimitStatus()
console.log(`Available requests: ${status.availableTokens}`)
console.log(`Refill in: ${Math.ceil(status.timeUntilRefill / 1000)}s`)
```

#### `RateLimiter`

Token bucket rate limiter for controlling API request frequency.

##### Constructor

```typescript
new RateLimiter(config: RateLimiterConfig)
```

**Parameters:**
- `config`: Rate limiter configuration
  - `maxRequests`: Maximum number of requests allowed in the time window
  - `windowMs`: Time window in milliseconds

**Example:**
```typescript
import { RateLimiter } from '@/joke-generator'

// 20 requests per 2 minutes
const limiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 120000
})
```

##### Methods

###### `tryConsume(): boolean`

Attempts to consume a token for an API request.

**Returns:** `true` if a token was consumed, `false` if rate limit exceeded

###### `getAvailableTokens(): number`

Gets the current number of available tokens.

**Returns:** Number of available tokens

###### `getTimeUntilRefill(): number`

Gets the time until the next token refill.

**Returns:** Time in milliseconds until refill

### Types

#### `JokeOptions`

Configuration options for fetching jokes.

```typescript
interface JokeOptions {
  categories?: JokeCategory[]        // Categories to include
  blacklistFlags?: Array<keyof JokeFlags>  // Content flags to exclude
  type?: JokeType                    // Type of joke ('single' or 'twopart')
  searchString?: string              // Search term to filter jokes
  lang?: string                      // Language code (default: 'en')
  amount?: number                    // Number of jokes (1-10, default: 1)
}
```

#### `JokeCategory`

Available joke categories:
- `'Programming'`
- `'Misc'`
- `'Dark'`
- `'Pun'`
- `'Spooky'`
- `'Christmas'`

#### `JokeType`

Type of joke delivery:
- `'single'`: One-line joke
- `'twopart'`: Setup and punchline format

#### `JokeFlags`

Content flags for filtering:

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

### Error Handling

#### `RateLimitError`

Thrown when the rate limit is exceeded.

**Properties:**
- `message`: Error message
- `retryAfter`: Time to wait before retrying (in milliseconds)

**Example:**
```typescript
try {
  const joke = await generator.getRandomJoke()
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited! Retry after ${error.retryAfter}ms`)
  }
}
```

#### `JokeAPIError`

Thrown when the JokeAPI returns an error.

**Properties:**
- `message`: Error message
- `code`: API error code
- `causedBy`: Array of reasons for the error

**Example:**
```typescript
try {
  const joke = await generator.getRandomJoke({ searchString: 'nonexistent' })
} catch (error) {
  if (error instanceof JokeAPIError) {
    console.log(`API Error (${error.code}): ${error.message}`)
    console.log('Caused by:', error.causedBy)
  }
}
```

## Examples

### Example 1: Random Programming Joke

```typescript
import { getRandomJoke } from '@/joke-generator'

async function getProgrammingJoke() {
  const joke = await getRandomJoke({
    categories: ['Programming'],
    blacklistFlags: ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit']
  })
  
  console.log('Here\'s a programming joke:')
  console.log(joke)
}

getProgrammingJoke()
```

### Example 2: Joke of the Day

```typescript
import { createJokeGenerator } from '@/joke-generator'

async function jokeOfTheDay() {
  const generator = createJokeGenerator()
  
  try {
    // Get a safe, single-line joke
    const joke = await generator.getRandomJoke({
      categories: ['Programming', 'Misc', 'Pun'],
      type: 'single'
    })
    
    console.log('🎉 Joke of the Day 🎉')
    console.log(joke)
    
    // Check rate limit status
    const status = generator.getRateLimitStatus()
    console.log(`\nRemaining jokes today: ${status.availableTokens}`)
  } catch (error) {
    console.error('Could not fetch joke:', error)
  }
}

jokeOfTheDay()
```

### Example 3: Batch Joke Fetching

```typescript
import { createJokeGenerator, RateLimitError } from '@/joke-generator'

async function getJokeBatch() {
  const generator = createJokeGenerator()
  
  try {
    console.log('Fetching 5 jokes...\n')
    
    const jokes = await generator.getMultipleJokes(5, {
      categories: ['Programming', 'Pun']
    })
    
    jokes.forEach((joke, index) => {
      console.log(`${index + 1}. ${joke}`)
      console.log('---')
    })
    
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error(`Rate limit exceeded. Try again in ${Math.ceil(error.retryAfter / 1000)} seconds.`)
    } else {
      console.error('Error fetching jokes:', error)
    }
  }
}

getJokeBatch()
```

### Example 4: Custom Rate Limiting

```typescript
import { JokeGenerator, RateLimiter } from '@/joke-generator'

async function customRateLimiting() {
  // Create a strict rate limiter: 3 requests per 30 seconds
  const strictLimiter = new RateLimiter({
    maxRequests: 3,
    windowMs: 30000
  })
  
  const generator = new JokeGenerator(strictLimiter)
  
  console.log('Testing strict rate limiter (3 requests per 30s)...\n')
  
  // Try to fetch 5 jokes
  for (let i = 1; i <= 5; i++) {
    try {
      const joke = await generator.getRandomJoke()
      console.log(`${i}. ✅ ${joke}\n`)
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.log(`${i}. ❌ Rate limit reached!`)
        console.log(`   Retry after: ${Math.ceil(error.retryAfter / 1000)}s\n`)
      }
    }
  }
  
  // Check final status
  const status = generator.getRateLimitStatus()
  console.log(`Available tokens: ${status.availableTokens}`)
}

customRateLimiting()
```

### Example 5: Searching for Specific Jokes

```typescript
import { createJokeGenerator } from '@/joke-generator'

async function searchJokes() {
  const generator = createJokeGenerator()
  
  try {
    // Search for jokes containing "debug"
    const debugJoke = await generator.getRandomJoke({
      searchString: 'debug',
      categories: ['Programming']
    })
    
    console.log('Joke about debugging:')
    console.log(debugJoke)
  } catch (error) {
    console.error('Could not find matching joke:', error)
  }
}

searchJokes()
```

## Rate Limiting

The module includes built-in rate limiting to prevent API abuse:

- **Default limit**: 10 requests per minute
- **Configurable**: Create custom rate limiters with different limits
- **Automatic refill**: Tokens automatically refill after the time window

### Best Practices

1. **Reuse instances**: Create one generator instance and reuse it
2. **Handle rate limits**: Always catch `RateLimitError` and respect retry times
3. **Monitor status**: Check `getRateLimitStatus()` before making many requests
4. **Safe defaults**: The module defaults to safe, appropriate jokes

## Testing

The module includes comprehensive unit tests. Run them with:

```bash
npm test -- src/joke-generator/tests
```

Test coverage includes:
- Rate limiter functionality
- API error handling
- Network error handling
- URL building with various options
- Response formatting
- Edge cases and error conditions

## API Reference

This module uses the free [JokeAPI v2](https://jokeapi.dev/):
- **Base URL**: `https://v2.jokeapi.dev/joke`
- **Rate limit**: 120 requests per minute (per IP)
- **No API key required**
- **Free for non-commercial use**

## License

This module is part of the GitHub Docs project and follows the same license terms.

## Contributing

Contributions are welcome! Please ensure:
- All tests pass
- Code follows the TypeScript style guide
- Documentation is updated for new features
- Rate limiting is respected
